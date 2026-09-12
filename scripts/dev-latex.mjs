import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const workerPort = process.env.LATEX_WORKER_PORT || '2345';
const webPort = process.env.PORT || '3000';
const texPath = '/Library/TeX/texbin';
const env = {...process.env, PATH: `${process.env.PATH || ''}${existsSync(texPath) ? path.delimiter + texPath : ''}`};
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) { try { child.kill('SIGTERM'); } catch {} }
  setTimeout(() => process.exit(code), 500).unref();
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
function start(command, args, extra) {
  const child = spawn(command, args, {cwd, env: {...env, ...extra}, stdio: 'inherit'});
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 0); });
  return child;
}
start('python3', ['-B', 'services/latex-worker/server.py'], {PORT: workerPort, LATEX_BIND: '127.0.0.1'});
await new Promise(resolve => setTimeout(resolve, 800));
if (!stopping) start(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', webPort], {
  LATEX_COMPILER_MODE: 'artifacts', LATEX_COMPILER_URL: `http://127.0.0.1:${workerPort}/builds/sync`,
});
