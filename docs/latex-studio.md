# LaTeX Document Studio

Route: `/latex`. The client loads CodeMirror 6 with full LaTeX highlighting, autocomplete, snippets, multi-file management, local/cloud storage synchronization, and posts project resources to `/api/latex/compile`.

## Compilation Engine & Multi-File Architecture

By default the API uses `https://latex.ytotech.com/builds/sync` (or the configured `LATEX_COMPILER_URL`), supporting **XeLaTeX**, **pdfLaTeX**, and **LuaLaTeX** engines with Unicode Vietnamese, Math, Exam, TikZ, and multi-file dependencies.

The compilation API accepts structured project resources (`resources` array containing `.tex`, `.bib`, `.sty`, `.cls`, and base64-encoded image assets) with designated `mainDocument` entry point.

The response is a vector PDF, displayed with a client-side PDF viewer and downloaded without rasterization. Zoom, fit width and page rendering do not depend on a native browser PDF plugin. Download always preserves the original vector PDF.

## Configuration & Security

Configure `LATEX_COMPILER_URL` in the environment to use a dedicated HTTPS LaTeX-on-HTTP-compatible endpoint. Optional `LATEX_COMPILER_TOKEN` supplies a server-only Bearer token. Contract: POST JSON `{compiler: "xelatex"|"pdflatex"|"lualatex", resources: [{main: true, path: "main.tex", content: "..."}]}`; return PDF on success or a TeX error log with a non-2xx status.

Document source is strictly preserved in private memory during request processing and never written to server application logs.

## Verification

Run `npm run build` to verify static typing, routes, and page generation.
