import { compileLatex, CompileError, SOURCE_LIMIT } from '@/lib/latexCompiler';
export const runtime = 'nodejs';
export const maxDuration = 60;
const privateHeaders = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
export async function POST(request: Request) {
  const fail = (error: string, status: number, log?: string) => Response.json({error, ...(log ? {log} : {})}, {status, headers: privateHeaders});
  // Reject browser cross-site submissions; compiler URL is never supplied by callers.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const host = request.headers.get('host') || new URL(request.url).host;
      if (new URL(origin).host !== host) return fail('Nguồn yêu cầu không hợp lệ.', 403);
    } catch { return fail('Nguồn yêu cầu không hợp lệ.', 403); }
  }
  if (!request.headers.get('content-type')?.includes('application/json')) return fail('Yêu cầu phải là JSON.', 415);
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail('Thiếu mã nguồn LaTeX.', 400);
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const {done, value} = await reader.read(); if (done) break;
        size += value.length;
        if (size > SOURCE_LIMIT * 2) { await reader.cancel(); return fail('Mã nguồn quá lớn (tối đa 200 KB).', 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return fail('JSON không hợp lệ.', 400); }
    const source = body && typeof body === 'object' && 'source' in body ? body.source : undefined;
    if (typeof source !== 'string' || !source.trim()) return fail('Nhập mã nguồn LaTeX trước khi biên dịch.', 400);
    if (Buffer.byteLength(source, 'utf8') > SOURCE_LIMIT) return fail('Mã nguồn quá lớn (tối đa 200 KB).', 413);
    console.log('=== API COMPILE PAYLOAD ===', source);
    const pdf = await compileLatex(source, request.signal);
    return new Response(new Blob([pdf as Uint8Array<ArrayBuffer>], {type: 'application/pdf'}), {headers: {...privateHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="document.pdf"'}});
  } catch (error) {
    if (error instanceof CompileError) {
      console.log('=== API COMPILE LOG ===', error.log);
      return fail(error.message, error.status, error.log);
    }
    return fail('Không thể xử lý yêu cầu biên dịch.', 500);
  }
}
