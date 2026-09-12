"""Private LaTeX artifact worker. Run in the supplied isolated container in production."""
import base64
import hmac
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(os.environ.get('LATEX_BUILD_ROOT', '/tmp/mathaio-latex-builds'))
TOKEN = os.environ.get('LATEX_COMPILER_TOKEN', '')
TTL = 3600
MAX_BODY = 24_000_000
MAX_PDF = 10_000_000
SLOTS = threading.BoundedSemaphore(2)
BUILDS = {}
LOCK = threading.Lock()

class Failure(Exception):
    def __init__(self, message, status=400, log=''):
        self.message, self.status, self.log = message, status, log

def safe_path(value):
    if not isinstance(value, str) or not value or '\\' in value or ':' in value or any(ord(c) < 32 for c in value):
        raise Failure('Đường dẫn tệp không hợp lệ.')
    path = PurePosixPath(value)
    if path.is_absolute() or '..' in path.parts or value.startswith('-') or str(path) == '.':
        raise Failure('Đường dẫn tệp không hợp lệ.')
    return str(path)

def run(args, cwd, timeout=40):
    env = {k: v for k, v in os.environ.items() if k in ('PATH', 'LANG', 'LC_ALL', 'TEXMFVAR', 'TEXMFCACHE')}
    env.update({'HOME': str(cwd), 'openin_any': 'p', 'openout_any': 'p', 'shell_escape': 'f'})
    if os.environ.get('LATEX_SANDBOX') == 'bubblewrap':
        sandbox = ['bwrap', '--unshare-all', '--die-with-parent', '--new-session',
                   '--ro-bind', '/usr', '/usr', '--ro-bind', '/bin', '/bin',
                   '--ro-bind', '/lib', '/lib', '--ro-bind', '/etc', '/etc',
                   '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp',
                   '--bind', str(cwd), str(cwd), '--chdir', str(cwd)]
        if Path('/lib64').exists():
            sandbox.extend(['--ro-bind', '/lib64', '/lib64'])
        args = sandbox + ['--'] + args
    # Never pass the worker credential or the web application's environment to TeX.
    with tempfile.TemporaryFile() as output:
        proc = subprocess.Popen(args, cwd=cwd, env=env, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            import signal
            os.killpg(proc.pid, signal.SIGKILL)
            proc.wait()
            raise Failure('Biên dịch quá thời gian cho phép.', 504)
        output.seek(0, 2)
        size = output.tell()
        output.seek(max(0, size - 300_000))
        return proc.returncode, output.read().decode('utf8', errors='replace')

def cleanup():
    with LOCK:
        expired = [key for key, value in BUILDS.items() if value['expires'] < time.time()]
        for key in expired:
            shutil.rmtree(BUILDS.pop(key)['directory'], ignore_errors=True)
        tracked = {b['directory'] for b in BUILDS.values()}
        for directory in ROOT.glob('build-*'):
            if directory not in tracked and directory.is_dir() and directory.stat().st_mtime < time.time() - TTL:
                shutil.rmtree(directory, ignore_errors=True)

def compile_project(body):
    cleanup()
    compiler = body.get('compiler', 'xelatex')
    if compiler not in ('xelatex', 'pdflatex', 'lualatex'):
        raise Failure('Trình biên dịch không hợp lệ.')
    resources = body.get('resources')
    if not isinstance(resources, list) or not 1 <= len(resources) <= 500:
        raise Failure('Dự án phải có từ 1 đến 500 tệp.')
    ROOT.mkdir(parents=True, exist_ok=True)
    directory = Path(tempfile.mkdtemp(prefix='build-', dir=ROOT)).resolve()
    keep = False
    try:
        paths, main, total = set(), None, 0
        for item in resources:
            path = safe_path(item.get('path'))
            if path in paths:
                raise Failure('Trùng đường dẫn tệp: ' + path)
            paths.add(path)
            if item.get('main'):
                if main is not None:
                    raise Failure('Chỉ chọn một tài liệu chính.')
                main = path
            if isinstance(item.get('content'), str):
                data = item['content'].encode('utf8')
            else:
                try:
                    data = base64.b64decode(item.get('file', item.get('data', '')), validate=True)
                except (ValueError, TypeError):
                    raise Failure('Tài nguyên base64 không hợp lệ.')
            total += len(data)
            if total > 16_000_000:
                raise Failure('Dự án vượt giới hạn 16 MB.', 413)
            target = directory / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        if not main or not main.endswith('.tex'):
            raise Failure('Thiếu tài liệu chính .tex.')
        # A private output directory cannot collide with an uploaded resource.
        out = directory / ('output-' + uuid.uuid4().hex)
        out.mkdir()
        options = body.get('options', {}).get('compiler', {})
        args = ['latexmk', '-norc', {'xelatex': '-xelatex', 'pdflatex': '-pdf', 'lualatex': '-lualatex'}[compiler],
                '-synctex=1', '-file-line-error', '-interaction=nonstopmode', '-no-shell-escape', '-outdir=' + str(out)]
        if options.get('halt_on_error'):
            args.append('-halt-on-error')
        args.append(main)
        code, stdout = run(args, directory)
        stem = Path(main).stem
        log_path = out / (stem + '.log')
        if log_path.exists():
            with log_path.open('rb') as stream:
                stream.seek(max(0, log_path.stat().st_size - 300_000))
                log = stream.read(300_000).decode('utf8', errors='replace')
        else:
            log = stdout
        # Hide infrastructure paths while retaining project-relative source names.
        log = log.replace(str(directory) + '/', '')
        pdf_path = out / (stem + '.pdf')
        if not pdf_path.exists():
            raise Failure('Không thể tạo PDF.', 422, log)
        if pdf_path.stat().st_size > MAX_PDF:
            raise Failure('PDF vượt giới hạn 10 MB.', 413, log)
        pdf = pdf_path.read_bytes()
        if not pdf.startswith(b'%PDF-'):
            raise Failure('PDF không hợp lệ.', 502)
        synctex = out / (stem + '.synctex.gz')
        build_id = uuid.uuid4().hex
        with LOCK:
            BUILDS[build_id] = {'directory': directory, 'pdf': pdf_path, 'paths': paths, 'expires': time.time() + TTL}
        keep = True
        return {'pdf': base64.b64encode(pdf).decode(), 'log': log, 'buildId': build_id,
                'synctexAvailable': synctex.exists(), 'hasErrors': code != 0}
    finally:
        if not keep:
            shutil.rmtree(directory, ignore_errors=True)

def number(value, low, high):
    if not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise Failure('Tọa độ SyncTeX không hợp lệ.')
    return value

def synchronize(body):
    cleanup()
    with LOCK:
        build = BUILDS.get(body.get('buildId', ''))
        if not build:
            raise Failure('Bản biên dịch đã hết hạn. Hãy Recompile để đồng bộ.', 410)
        # Renew while the native command is reading the build.
        build['expires'] = time.time() + TTL
    directory, pdf = build['directory'], build['pdf']
    direction = body.get('direction')
    if direction == 'forward':
        file = safe_path(body.get('file'))
        if file not in build['paths']:
            raise Failure('Tệp không thuộc bản biên dịch này.', 404)
        line = int(number(body.get('line'), 1, 1_000_000))
        args = ['synctex', 'view', '-i', f'{line}:0:{directory / file}', '-o', str(pdf)]
    elif direction == 'reverse':
        page = int(number(body.get('page'), 1, 100_000))
        x, y = number(body.get('x'), 0, 100_000), number(body.get('y'), 0, 100_000)
        args = ['synctex', 'edit', '-o', f'{page}:{x}:{y}:{pdf}']
    else:
        raise Failure('Hướng đồng bộ không hợp lệ.')
    _, output = run(args, directory, timeout=5)
    records = []
    record = {}
    for line in output.splitlines():
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        if key == ('Page' if direction == 'forward' else 'Input') and record:
            records.append(record)
            record = {}
        record[key] = value.strip()
    if record:
        records.append(record)
    for r in records:
        try:
            if direction == 'forward' and 'Page' in r:
                vals = {k: float(r[k]) for k in ('h', 'v', 'W', 'H')}
                if not all(math.isfinite(v) for v in vals.values()):
                    continue
                return {'page': int(r['Page']), 'x': vals['h'], 'y': vals['v'] - vals['H'],
                        'width': abs(vals['W']), 'height': abs(vals['H'])}
            if direction == 'reverse' and 'Input' in r:
                file = str(Path(r['Input']).resolve().relative_to(directory))
                if file in build['paths']:
                    return {'file': file, 'line': max(1, int(r['Line']))}
        except (ValueError, KeyError):
            continue
    raise Failure('Không tìm thấy vị trí tương ứng trong bản biên dịch.', 404)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_POST(self):
        if TOKEN and not hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + TOKEN):
            return self.reply(401, {'error': 'Unauthorized'})
        if not SLOTS.acquire(blocking=False):
            return self.reply(429, {'error': 'Engine đang bận. Vui lòng thử lại.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                raise Failure('Kích thước yêu cầu không hợp lệ.', 413)
            self.connection.settimeout(15)
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise Failure('Yêu cầu phải là JSON object.')
            if self.path == '/builds/sync':
                result = compile_project(body)
            elif self.path == '/synctex':
                result = synchronize(body)
            else:
                raise Failure('Not found', 404)
            self.reply(200, result)
        except Failure as error:
            self.reply(error.status, {'error': error.message, 'log': error.log})
        except (ValueError, TypeError, AttributeError, OSError):
            self.reply(400, {'error': 'Không thể xử lý yêu cầu.'})
        finally:
            SLOTS.release()

    def reply(self, status, data):
        raw = json.dumps(data).encode()
        try:
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass

if __name__ == '__main__':
    address = os.environ.get('LATEX_BIND', '127.0.0.1')
    if address != '127.0.0.1' and not TOKEN:
        raise SystemExit('LATEX_COMPILER_TOKEN is required for a non-loopback listener.')
    # Periodic cleanup also removes idle builds without waiting for another request.
    def janitor():
        while True:
            time.sleep(60)
            cleanup()
    threading.Thread(target=janitor, daemon=True).start()
    ThreadingHTTPServer((address, int(os.environ.get('PORT', '2345'))), Handler).serve_forever()
