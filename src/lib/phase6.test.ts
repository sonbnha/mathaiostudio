import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseTeXLog} from './texLog';
import {compileFingerprint, resolveProjectPath} from './synctexParser';
import {compileLatexArtifacts, SOURCE_LIMIT, PDF_LIMIT} from './latexCompiler';
import {POST} from '../app/api/latex/compile/route';

test('diagnostics retain nested Unicode paths and distinguish identical errors in two files', () => {
  const log = `(./main.tex\n(./chapters/chương.tex\n! Undefined control sequence.\nl.7 \\bad\nLaTeX Warning: Reference missing on input line 8.\n)\n(./appendix.tex\n! Undefined control sequence.\nl.7 \\bad\n)\n)\nchapters/chương.tex:9: Package foo Warning: wrapped warning\n`;
  const {errors,warnings} = parseTeXLog(log);
  assert.equal(errors.length,2);
  assert.deepEqual(errors.map(e=>[e.file,e.line]), [['chapters/chương.tex',7],['appendix.tex',7]]);
  assert.equal(warnings.length,2);
  assert.equal(warnings[0].file,'chapters/chương.tex');
  assert.equal(warnings[1].line,9);
});
test('wrapped package warnings retain line and do not become errors', () => {
  const result=parseTeXLog('(./main.tex\nPackage foo Warning: Missing reference\n(foo)                on input line 12.\n)');
  assert.equal(result.warnings[0].line,12);
  assert.equal(result.errors.length,0);
});
test('project fingerprint tracks subfiles, assets and engine but not file order', () => {
  const files=[{name:'main.tex',content:'main'},{name:'child.tex',content:'child'}];
  const key=compileFingerprint(files,[],'main.tex','xelatex');
  assert.equal(key,compileFingerprint([...files].reverse(),[],'main.tex','xelatex'));
  assert.notEqual(key,compileFingerprint([files[0],{...files[1],content:'edit'}],[],'main.tex','xelatex'));
  assert.notEqual(key,compileFingerprint(files,[{name:'img.png',dataUrl:'data:new'}],'main.tex','xelatex'));
  assert.notEqual(key,compileFingerprint(files,[],'main.tex','pdflatex'));
  assert.equal(resolveProjectPath('/tmp/build/./chapters/a.tex',['chapters/a.tex']), 'chapters/a.tex');
  assert.equal(resolveProjectPath('a.tex',['one/a.tex','two/a.tex']),null);
});
test('artifact response keeps success warnings and compiler capability', async t => {
  t.mock.method(globalThis,'fetch',async () => new Response(JSON.stringify({pdf:Buffer.from('%PDF-1.7\nfixture').toString('base64'), log:'LaTeX Warning: test', buildId:'a'.repeat(32),synctexAvailable:true}), {headers:{'Content-Type':'application/json'}}));
  const result=await compileLatexArtifacts('fixture');
  assert.match(result.log,/Warning/);
  assert.equal(result.buildId,'a'.repeat(32));
  const response=await POST(new Request('https://test/api/latex/compile',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({source:'fixture'})}));
  assert.equal(response.status,200);
  assert.match((await response.json()).log,/Warning/);
});
test('PDF-only provider explicitly has no SyncTeX and maps binary resources to upstream file field', async t => {
  t.mock.method(globalThis,'fetch',async (_url:unknown, init?:RequestInit) => {
    const body=JSON.parse(String(init?.body));
    assert.equal(body.resources[1].file,'aGVsbG8=');
    assert.equal(body.resources[1].data,undefined);
    return new Response('%PDF-1.7\nfixture');
  });
  const result=await compileLatexArtifacts({resources:[{path:'main.tex',main:true,content:'source'},{path:'img.png',data:'aGVsbG8='}]});
  assert.equal(result.synctexAvailable,false);
  assert.equal(result.log,'');
});
test('request validation is bounded for both legacy and resource requests', async () => {
  const request=(body:string)=>new Request('https://test/api/latex/compile',{method:'POST',headers:{'Content-Type':'application/json'},body});
  assert.equal((await POST(request('{'))).status,400);
  assert.equal((await POST(request(JSON.stringify({resources:[{path:'../x.tex',content:'x'}]})))).status,400);
  assert.equal((await POST(request(JSON.stringify({resources:[{path:'main.tex',content:'x'.repeat(SOURCE_LIMIT+1)}]})))).status,413);
  assert.equal(PDF_LIMIT,10_000_000);
});
