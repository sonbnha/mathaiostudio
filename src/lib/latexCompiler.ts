import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/** LaTeX-on-HTTP adapter. Source is sent only to the configured server, never as a URL. */
export const SOURCE_LIMIT = 500_000;
const PDF_LIMIT = 10_000_000;

export interface CompileResource {
  path: string;
  content?: string;
  data?: string; // Base64 encoded for binary assets
  main?: boolean;
}

export interface CompileOptions {
  compiler?: 'xelatex' | 'pdflatex' | 'lualatex' | string;
  mainDocument?: string;
  draftMode?: boolean;
  stopOnError?: boolean;
  resources: CompileResource[];
}

export interface CompileArtifacts {
  pdf: string; // Base64
  synctex?: string; // Base64 (.synctex.gz)
  log?: string;
}

export class CompileError extends Error {
  constructor(message: string, public status: number, public log = '') { super(message); }
}

async function boundedBody(response: Response, limit: number): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) throw new CompileError('Engine trả về phản hồi rỗng.', 502);
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new CompileError('Kết quả vượt giới hạn dung lượng. Hãy chia nhỏ tài liệu.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

const execAsync = promisify(exec);

async function compileLocally(options: CompileOptions, resourcesPayload: CompileResource[]): Promise<CompileArtifacts> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathviz-latex-'));
  
  try {
    let mainFile = 'main.tex';
    
    // Write all resources
    for (const res of resourcesPayload) {
      const filePath = path.join(tmpDir, res.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      if (res.content !== undefined) {
        await fs.writeFile(filePath, res.content, 'utf8');
      } else if (res.data !== undefined) {
        await fs.writeFile(filePath, Buffer.from(res.data, 'base64'));
      }
      if (res.main) {
        mainFile = res.path;
      }
    }
    
    const compiler = ['xelatex', 'pdflatex', 'lualatex'].includes(options.compiler || '') 
      ? options.compiler 
      : 'xelatex';
      
    // Execute compiler
    let log = '';
    try {
      const cmd = `${compiler} -synctex=1 -interaction=nonstopmode ${options.stopOnError ? '-halt-on-error' : ''} "${mainFile}"`;
      const { stdout, stderr } = await execAsync(cmd, { cwd: tmpDir, timeout: 45000 });
      log = stdout + '\n' + stderr;
    } catch (err: any) {
      log = err.stdout + '\n' + err.stderr;
      if (options.stopOnError) {
        throw new CompileError('Không thể biên dịch tài liệu (Lỗi cục bộ).', 422, log);
      }
    }
    
    // Read PDF
    const pdfPath = path.join(tmpDir, mainFile.replace(/\.tex$/, '.pdf'));
    let pdfBuf: Buffer;
    try {
      pdfBuf = await fs.readFile(pdfPath);
    } catch (e) {
      throw new CompileError('Engine không tạo ra PDF.', 422, log);
    }
    
    // Read synctex.gz
    const synctexPath = path.join(tmpDir, mainFile.replace(/\.tex$/, '.synctex.gz'));
    let synctexBuf: Buffer | undefined;
    try {
      synctexBuf = await fs.readFile(synctexPath);
    } catch (e) {
      // Synctex not generated, it's fine
    }
    
    return {
      pdf: pdfBuf.toString('base64'),
      synctex: synctexBuf ? synctexBuf.toString('base64') : undefined,
      log
    };
  } finally {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function compileLatexArtifacts(
  input: string | CompileOptions,
  signal?: AbortSignal
): Promise<CompileArtifacts> {
  let compilerName = 'xelatex';
  let stopOnError = false;
  let draftMode = false;
  let resourcesPayload: CompileResource[] = [];

  if (typeof input === 'string') {
    resourcesPayload = [{ main: true, path: 'document.tex', content: input }];
  } else {
    compilerName = input.compiler?.toLowerCase() || 'xelatex';
    stopOnError = Boolean(input.stopOnError);
    draftMode = Boolean(input.draftMode);

    if (!['xelatex', 'pdflatex', 'lualatex'].includes(compilerName)) {
      compilerName = 'xelatex';
    }

    if (Array.isArray(input.resources) && input.resources.length > 0) {
      const hasMain = input.resources.some((r) => r.main);
      const targetMain = input.mainDocument || 'main.tex';

      resourcesPayload = input.resources.map((r) => {
        const isMain = hasMain ? Boolean(r.main) : r.path === targetMain || r.path === 'document.tex';
        let fileContent = r.content;

        if (draftMode && isMain && typeof fileContent === 'string') {
          if (!fileContent.includes('PassOptionsToPackage{draft}{graphicx}')) {
            fileContent = `\\PassOptionsToPackage{draft}{graphicx}\n${fileContent}`;
          }
        }

        const res: CompileResource = { path: r.path };
        if (isMain) res.main = true;
        if (fileContent !== undefined) res.content = fileContent;
        if (r.data !== undefined) res.data = r.data;
        return res;
      });

      if (!resourcesPayload.some((r) => r.main)) {
        const firstTex = resourcesPayload.find((r) => r.path.endsWith('.tex'));
        if (firstTex) firstTex.main = true;
        else if (resourcesPayload[0]) resourcesPayload[0].main = true;
      }
    } else {
      throw new CompileError('Dự án không có tài nguyên nào để biên dịch.', 400);
    }
  }

  // Check if we have local xelatex
  try {
    await execAsync('which xelatex');
    return compileLocally(typeof input === 'string' ? { resources: resourcesPayload } : input, resourcesPayload);
  } catch (e) {
    // Fallback to HTTP
  }

  const endpoint = process.env.LATEX_COMPILER_URL || 'https://latex.ytotech.com/builds/sync';
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new CompileError('Địa chỉ engine phải sử dụng HTTPS.', 503);
  }
  const headers: Record<string, string> = {'Content-Type': 'application/json', 'Accept': 'application/pdf'};
  if (process.env.LATEX_COMPILER_TOKEN) headers.Authorization = `Bearer ${process.env.LATEX_COMPILER_TOKEN}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      cache: 'no-store',
      redirect: 'error',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000),
      body: JSON.stringify({
        compiler: compilerName,
        options: {
          compiler: {
            halt_on_error: stopOnError,
            force: false,
          },
          response: {
            log_files_on_failure: true,
          },
        },
        resources: resourcesPayload,
      }),
    });

    if (!response.ok) {
      const raw = new TextDecoder().decode(await boundedBody(response, 300_000));
      let log = raw;
      try {
        const detail = JSON.parse(raw);
        if (detail.log_files && typeof detail.log_files === 'object') {
          const filesContent = Object.values(detail.log_files).filter((v) => typeof v === 'string').join('\n');
          log = filesContent || detail.logs || detail.log || raw;
        } else if (typeof detail.logs === 'string') {
          log = detail.logs;
        } else if (typeof detail.log === 'string') {
          log = detail.log;
        } else if (typeof detail.stderr === 'string') {
          log = detail.stderr;
        } else if (typeof detail.stdout === 'string') {
          log = detail.stdout;
        } else {
          log = JSON.stringify(detail, null, 2);
        }
      } catch {
        // ...
      }
      throw new CompileError(
        response.status === 429 ? 'Engine đang bận. Vui lòng thử lại sau.' : 'Không thể biên dịch tài liệu.',
        response.status >= 500 ? 502 : response.status === 429 ? 429 : 422,
        log.slice(-32000)
      );
    }

    const bytes = await boundedBody(response, PDF_LIMIT);
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new CompileError('Engine không trả về PDF hợp lệ.', 502);
    
    return {
      pdf: Buffer.from(bytes).toString('base64'),
      synctex: undefined,
    };
  } catch (error) {
    if (error instanceof CompileError) throw error;
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new CompileError('Biên dịch quá thời gian cho phép (45 giây).', 504);
    throw new CompileError('Không kết nối được dịch vụ biên dịch. Vui lòng thử lại sau.', 502);
  }
}

export async function compileLatex(input: string | CompileOptions, signal?: AbortSignal): Promise<Uint8Array> {
  const artifacts = await compileLatexArtifacts(input, signal);
  return Buffer.from(artifacts.pdf, 'base64');
}
