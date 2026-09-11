/** LaTeX-on-HTTP adapter. Source is sent only to the configured server, never as a URL. */
export const SOURCE_LIMIT = 200_000;
const PDF_LIMIT = 4_000_000;
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
export async function compileLatex(source: string, signal?: AbortSignal): Promise<Uint8Array> {
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
        compiler: 'xelatex',
        options: {
          compiler: {
            halt_on_error: true,
            force: false,
          },
          response: {
            log_files_on_failure: true,
          },
        },
        resources: [{ main: true, path: 'document.tex', content: source }],
      }),
    });
    if (!response.ok) {
      const raw = new TextDecoder().decode(await boundedBody(response, 200_000));
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
        /* Engine may return a plain TeX log. */
      }
      throw new CompileError(
        response.status === 429 ? 'Engine đang bận. Vui lòng thử lại sau.' : 'Không thể biên dịch tài liệu.',
        response.status >= 500 ? 502 : response.status === 429 ? 429 : 422,
        log.slice(-32000)
      );
    }
    const bytes = await boundedBody(response, PDF_LIMIT);
    if (new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') throw new CompileError('Engine không trả về PDF hợp lệ.', 502);
    return bytes;
  } catch (error) {
    if (error instanceof CompileError) throw error;
    if (error instanceof Error && ['TimeoutError','AbortError'].includes(error.name)) throw new CompileError('Biên dịch quá thời gian cho phép (45 giây).', 504);
    throw new CompileError('Không kết nối được dịch vụ biên dịch. Vui lòng thử lại sau.', 502);
  }
}
