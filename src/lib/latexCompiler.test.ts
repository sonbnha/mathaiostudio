import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileLatex, CompileError, SOURCE_LIMIT, PDF_LIMIT} from './latexCompiler';
import {POST} from '../app/api/latex/compile/route';

const request = (body: string, headers: Record<string,string> = {}) => new Request('https://studio.test/api/latex/compile', {method:'POST', headers:{'content-type':'application/json', ...headers}, body});
test('reject malformed, empty, oversized and cross-site requests before contacting engine', async () => {
  assert.equal((await POST(request('{'))).status,400);
  assert.equal((await POST(request('{}'))).status,400);
  assert.equal((await POST(request(JSON.stringify({source:' '.repeat(2)})))).status,400);
  assert.equal((await POST(request(JSON.stringify({source:'x'.repeat(SOURCE_LIMIT + 1)})))).status,413);
  assert.equal((await POST(request('{}', {'origin':'https://elsewhere.test'}))).status,403);
  assert.equal((await POST(request('{}', {'content-type':'text/plain'}))).status,415);
  assert.equal((await POST(request('{}', {'host':'preview.test','origin':'https://preview.test'}))).status,400);
  assert.equal((await POST(request('{}', {'origin':'null'}))).status,403);
});
test('compile adapter validates PDF, preserves diagnostics and handles timeout/unavailability', async t => {
  const fetchMock=t.mock.method(globalThis,'fetch');
  fetchMock.mock.mockImplementation(async (_url: unknown, options: RequestInit = {}) => {
    const body=JSON.parse(String(options.body));
    assert.equal(body.compiler,'xelatex'); assert.equal(body.resources[0].content,'sample');
    assert.equal(options.redirect,'error');
    return new Response('%PDF-1.7\nexample', {headers:{'content-type':'application/pdf'}});
  });
  assert.equal(new TextDecoder().decode(await compileLatex('sample')), '%PDF-1.7\nexample');
  const response=await POST(request(JSON.stringify({source:'sample'})));
  assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'application/pdf');
  assert.equal(response.headers.get('cache-control'),'no-store');
  fetchMock.mock.mockImplementation(async () => new Response(JSON.stringify({log:'! Undefined control sequence. l.3'}),{status:400}));
  await assert.rejects(compileLatex('sample'), (e: unknown) => e instanceof CompileError && e.status===422 && e.log.includes('l.3'));
  fetchMock.mock.mockImplementation(async () => new Response('<html>not PDF</html>'));
  await assert.rejects(compileLatex('sample'), (e: unknown) => e instanceof CompileError && e.status===502);
  fetchMock.mock.mockImplementation(async () => new Response(new Uint8Array(PDF_LIMIT + 1)));
  await assert.rejects(compileLatex('sample'), (e: unknown) => e instanceof CompileError && e.status===413);
  fetchMock.mock.mockImplementation(async () => {throw new DOMException('timeout','TimeoutError');});
  await assert.rejects(compileLatex('sample'), (e: unknown) => e instanceof CompileError && e.status===504);
  fetchMock.mock.mockImplementation(async () => {throw new TypeError('network');});
  await assert.rejects(compileLatex('sample'), (e: unknown) => e instanceof CompileError && e.status===502);
});
