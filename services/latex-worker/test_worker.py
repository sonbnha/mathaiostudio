import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('worker', Path(__file__).with_name('server.py'))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)

class WorkerTests(unittest.TestCase):
    def test_reject_path_escape(self):
        for path in ('../secret.tex', '/secret.tex', 'a/../../b', 'a\\b', '-shell.tex', 'a:b', ''):
            with self.assertRaises(worker.Failure): worker.safe_path(path)

    def test_expired_build(self):
        with self.assertRaises(worker.Failure) as failure:
            worker.synchronize({'buildId': '0' * 32, 'direction': 'forward'})
        self.assertEqual(failure.exception.status, 410)

    @unittest.skipUnless(shutil.which('latexmk') and shutil.which('synctex'), 'Requires TeX Live and SyncTeX')
    def test_native_multifile_forward_reverse_and_success_warnings(self):
        with tempfile.TemporaryDirectory() as root:
            worker.ROOT = Path(root)
            for engine in ('pdflatex', 'xelatex', 'lualatex'):
                with self.subTest(engine=engine):
                    result = worker.compile_project({'compiler': engine, 'resources': [
                        {'path': 'main.tex', 'main': True, 'content': '\\documentclass{article}\n\\begin{document}\nSame text repeated.\n\\input{chapters/second}\n\\end{document}\n'},
                        {'path': 'chapters/second.tex', 'content': '\\newpage\nSame text repeated.\n\\ref{missing}\n'}]})
                    self.assertTrue(result['synctexAvailable'])
                    self.assertIn('undefined', result['log'])
                    forward = worker.synchronize({'buildId': result['buildId'], 'direction': 'forward', 'file': 'chapters/second.tex', 'line': 2})
                    self.assertEqual(forward['page'], 2)
                    self.assertGreater(forward['width'], 0)
                    reverse = worker.synchronize({'buildId': result['buildId'], 'direction': 'reverse', 'page': forward['page'], 'x': forward['x'] + 40, 'y': forward['y'] + forward['height']/2})
                    self.assertEqual(reverse['file'], 'chapters/second.tex')
                    self.assertIn(reverse['line'], (2, 3))
                    with self.assertRaises(worker.Failure):
                        worker.synchronize({'buildId': result['buildId'], 'direction': 'forward', 'file': '../main.tex', 'line': 1})
                    worker.BUILDS.clear()

if __name__ == '__main__': unittest.main()
