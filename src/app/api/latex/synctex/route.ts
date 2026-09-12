import { boundedBody, CompileError } from '@/lib/latexCompiler';

export const runtime = 'nodejs';
export const maxDuration = 15;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

export async function POST(request: Request) {
  const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
  if (process.env.LATEX_COMPILER_MODE !== 'artifacts' || !process.env.LATEX_COMPILER_URL) {
    return fail('Dịch vụ hiện tại không cung cấp SyncTeX. Cần bộ biên dịch hỗ trợ dữ liệu vị trí.', 503);
  }
  try {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== (request.headers.get('host') || new URL(request.url).host)) return fail('Nguồn yêu cầu không hợp lệ.', 403);
    if (!request.headers.get('content-type')?.includes('application/json')) return fail('Yêu cầu phải là JSON.', 415);
    const bytes = await boundedBody(new Response(request.body), 4096);
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body.buildId !== 'string' || !/^[a-f0-9]{32}$/.test(body.buildId)) return fail('Bản biên dịch không hợp lệ.', 400);
    const validNumber = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
    if (body.direction === 'forward') {
      if (typeof body.file !== 'string' || body.file.length > 1024 || !validNumber(body.line, 1, 1_000_000)) return fail('Vị trí mã nguồn không hợp lệ.', 400);
    } else if (body.direction === 'reverse') {
      if (!validNumber(body.page, 1, 100_000) || !validNumber(body.x, 0, 100_000) || !validNumber(body.y, 0, 100_000)) return fail('Vị trí PDF không hợp lệ.', 400);
    } else return fail('Hướng đồng bộ không hợp lệ.', 400);
    const url = new URL('/synctex', process.env.LATEX_COMPILER_URL);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname))) return fail('Địa chỉ engine phải sử dụng HTTPS.', 503);
    const auth: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.LATEX_COMPILER_TOKEN) auth.Authorization = `Bearer ${process.env.LATEX_COMPILER_TOKEN}`;
    const response = await fetch(url, { method: 'POST', headers: auth, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]), body: JSON.stringify(body) });
    const result = JSON.parse(new TextDecoder().decode(await boundedBody(response, 16_000)));
    if (!response.ok) return fail(typeof result.error === 'string' ? result.error : 'Không thể đồng bộ.', [400, 404, 410, 429].includes(response.status) ? response.status : 502);
    return Response.json(result, { headers });
  } catch (error) {
    if (error instanceof CompileError) return fail(error.message, error.status);
    if (error instanceof SyntaxError || error instanceof TypeError) return fail('Yêu cầu hoặc phản hồi không hợp lệ.', 400);
    return fail('Không thể kết nối bộ đồng bộ PDF.', 502);
  }
}
