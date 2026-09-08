# LaTeX Document Studio

Route: `/latex`. The client loads Monaco only after mounting, registers LaTeX highlighting, saves drafts locally, and posts source to `/api/latex/compile`. XeLaTeX supports Unicode Vietnamese with Noto Serif, amsmath, amssymb, exam and TikZ. The response is a vector PDF, displayed with a client-only React-PDF viewer and downloaded without rasterization. The PDF.js worker is bundled locally. Zoom, fit width and lazy page rendering do not depend on a native browser PDF plugin. Download always preserves the original vector PDF.

## Staging engine

Vercel does not run local TeX executables. By default the API uses `https://latex.ytotech.com/builds/sync`, the public LaTeX-on-HTTP beta. Document source is transmitted to that provider; its hostname appears in the workspace before compilation. No silent fallback to a different provider occurs. Public-service availability and privacy are external dependencies; use a dedicated service for confidential documents or guaranteed capacity.

Configure `LATEX_COMPILER_URL` in the staging Vercel environment to use a dedicated HTTPS LaTeX-on-HTTP-compatible endpoint. Optional `LATEX_COMPILER_TOKEN` supplies a server-only Bearer token. Redeploy after changing environment variables. Contract: POST JSON `{compiler: "xelatex", resources: [{main: true, path: "document.tex", content: source}]}`; return PDF on success or a TeX error log with a non-2xx status. The upstream open-source engine and self-hosting instructions are at https://github.com/YtoTech/latex-on-http.

Requests are limited to 200 KB source, 4 MB PDF and 45 seconds upstream (60-second Vercel function). Invalid JSON, empty documents, wrong content types, upstream errors, timeouts and non-PDF replies receive explicit errors. No document source is written to application logs. Compiling is user-triggered, not automatic. Configure provider/gateway rate limits for sustained public traffic.

## Checks

Run `npm run build` and `npx tsx --test src/lib/latexCompiler.test.ts`. Compile every template against the real engine. For staging, verify the home launcher while signed in, all three workspace navigation tabs, PDF compilation/download, invalid TeX diagnostics, light/dark theme, and responsive layout. The editor depends on the Monaco loader CDN; an editable fallback is available if it is unavailable.
