import { compileLatex, CompileError, SOURCE_LIMIT, type CompileResource, type CompileOptions } from '@/lib/latexCompiler';

export const runtime = 'nodejs';
export const maxDuration = 60;

const privateHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: Request) {
  const fail = (error: string, status: number, log?: string) =>
    Response.json({ error, ...(log ? { log } : {}) }, { status, headers: privateHeaders });

  // Reject browser cross-site submissions; compiler URL is never supplied by callers.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const host = request.headers.get('host') || new URL(request.url).host;
      if (new URL(origin).host !== host) return fail('Nguồn yêu cầu không hợp lệ.', 403);
    } catch {
      return fail('Nguồn yêu cầu không hợp lệ.', 403);
    }
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return fail('Yêu cầu phải là JSON.', 415);
  }

  try {
    const rawBody = await request.json();
    if (!rawBody || typeof rawBody !== 'object') {
      return fail('Dữ liệu yêu cầu không hợp lệ.', 400);
    }

    const {
      source,
      code,
      engine,
      compiler,
      mainDocument,
      resources,
      files,
    } = rawBody as any;

    const compilerEngine = compiler || engine || 'xelatex';
    const primaryMainDoc = mainDocument || 'main.tex';

    let compileInput: CompileOptions | string;

    if (Array.isArray(resources) && resources.length > 0) {
      compileInput = {
        compiler: compilerEngine,
        mainDocument: primaryMainDoc,
        resources: resources as CompileResource[],
      };
    } else if (Array.isArray(files) && files.length > 0) {
      const resList: CompileResource[] = files.map((f: any) => ({
        path: f.name || f.path,
        content: f.content || '',
        main: f.name === primaryMainDoc || f.path === primaryMainDoc,
      }));
      compileInput = {
        compiler: compilerEngine,
        mainDocument: primaryMainDoc,
        resources: resList,
      };
    } else {
      const singleSource = typeof source === 'string' ? source : typeof code === 'string' ? code : '';
      if (!singleSource.trim()) {
        return fail('Nhập mã nguồn LaTeX trước khi biên dịch.', 400);
      }
      if (Buffer.byteLength(singleSource, 'utf8') > SOURCE_LIMIT) {
        return fail('Mã nguồn quá lớn (tối đa 500 KB).', 413);
      }
      compileInput = {
        compiler: compilerEngine,
        mainDocument: 'document.tex',
        resources: [{ path: 'document.tex', content: singleSource, main: true }],
      };
    }

    const pdf = await compileLatex(compileInput, request.signal);
    return new Response(new Blob([pdf as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), {
      headers: {
        ...privateHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="document.pdf"',
      },
    });
  } catch (error) {
    if (error instanceof CompileError) {
      return fail(error.message, error.status, error.log);
    }
    return fail('Không thể xử lý yêu cầu biên dịch.', 500);
  }
}
