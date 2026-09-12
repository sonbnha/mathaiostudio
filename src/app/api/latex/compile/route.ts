import { compileLatexArtifacts, boundedBody, CompileError, SOURCE_LIMIT, type CompileResource, type CompileOptions } from '@/lib/latexCompiler';

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
    let rawBody;
    try {
      const bytes = await boundedBody(new Response(request.body), 24_000_000);
      rawBody = JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
      if (error instanceof CompileError) throw error;
      return fail('JSON không hợp lệ.', 400);
    }
    if (!rawBody || typeof rawBody !== 'object') {
      return fail('Dữ liệu yêu cầu không hợp lệ.', 400);
    }

    const {
      source,
      code,
      engine,
      compiler,
      mainDocument,
      draftMode,
      stopOnError,
      haltOnError,
      resources,
      files,
    } = rawBody as any;

    const compilerEngine = compiler || engine || 'xelatex';
    const primaryMainDoc = mainDocument || 'main.tex';
    const isDraft = Boolean(draftMode);
    const isStopOnError = Boolean(stopOnError || haltOnError);

    let compileInput: CompileOptions | string;

    if (Array.isArray(resources) && resources.length > 0) {
      compileInput = {
        compiler: compilerEngine,
        mainDocument: primaryMainDoc,
        draftMode: isDraft,
        stopOnError: isStopOnError,
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
        draftMode: isDraft,
        stopOnError: isStopOnError,
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
        draftMode: isDraft,
        stopOnError: isStopOnError,
        resources: [{ path: 'document.tex', content: singleSource, main: true }],
      };
    }

    if (typeof compileInput !== 'string') {
      const seen = new Set<string>();
      let textSize = 0;
      if (compileInput.resources.length > 500) return fail('Dự án có quá nhiều tệp.', 413);
      for (const resource of compileInput.resources) {
        if (!resource || typeof resource.path !== 'string' || !resource.path ||
            resource.path.startsWith('/') || resource.path.startsWith('-') ||
            /[\\:\x00-\x1f]/.test(resource.path) || resource.path.split('/').some((part) => !part || part === '..' || part === '.')) {
          return fail('Đường dẫn tài nguyên không hợp lệ.', 400);
        }
        if (seen.has(resource.path)) return fail('Trùng đường dẫn tài nguyên.', 400);
        seen.add(resource.path);
        if (resource.content !== undefined && typeof resource.content !== 'string') return fail('Nội dung tệp không hợp lệ.', 400);
        if (resource.data !== undefined && typeof resource.data !== 'string') return fail('Dữ liệu tệp không hợp lệ.', 400);
        textSize += Buffer.byteLength(resource.content || '', 'utf8');
      }
      if (textSize > SOURCE_LIMIT) return fail('Mã nguồn quá lớn (tối đa 500 KB).', 413);
    }
    const artifacts = await compileLatexArtifacts(compileInput, request.signal);
    if (request.headers.get('accept')?.includes('application/json')) {
      return Response.json({ ...artifacts, engineLabel: process.env.LATEX_COMPILER_MODE === 'artifacts' ? 'TeX + SyncTeX' : new URL(process.env.LATEX_COMPILER_URL || 'https://latex.ytotech.com').hostname, pdf: Buffer.from(artifacts.pdf).toString('base64') }, { headers: privateHeaders });
    }
    const pdf = artifacts.pdf;
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
