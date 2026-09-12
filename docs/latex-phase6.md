# Phase 6 — PDF, compile logs and native SyncTeX

## Development

Install Python 3 and TeX Live with `latexmk`, `pdflatex`, `xelatex`, `lualatex` and `synctex` available. MacTeX's `/Library/TeX/texbin` is detected automatically by the launcher.

Run `npm run dev:latex`. This starts a private loopback worker on port 2345 and Next.js on port 3000. Optional `PORT` and `LATEX_WORKER_PORT` select other ports. Stop both with Ctrl+C. No `.env` files are modified.

`npm run dev` continues to use the existing configured compiler. A PDF-only compiler remains supported, but supplies neither native SyncTeX nor successful-build logs. The UI states this explicitly and does not invent position mappings or claim the absence of warnings.

## Production worker

Build `services/latex-worker/Dockerfile` on Linux. Set a private `LATEX_COMPILER_TOKEN` on both the worker and the web application. Configure the web application with:

```
LATEX_COMPILER_MODE=artifacts
LATEX_COMPILER_URL=https://your-private-worker.example/builds/sync
```

Keep the worker private behind HTTPS. The web application never accepts a compiler URL from the browser. `/synctex` must be routed on the same worker origin. TeX compilation runs as a non-root user with shell escape disabled. The container uses Bubblewrap to give each TeX/SyncTeX process only its own build directory, read-only system files, and no network. The host/container runtime must support unprivileged user namespaces; if unavailable, builds fail rather than silently bypassing the sandbox. Use a read-only root filesystem, writable bounded `/tmp`, dropped capabilities, process/memory/CPU limits, and no application secrets or host documents in the worker container. Do not run the un-sandboxed development worker as a public production service.

Builds are private random 128-bit capabilities with a one-hour idle TTL. Source, PDF and SyncTeX are removed on expiry. Restarting a worker invalidates its builds; the UI asks for Recompile. Use one worker instance or sticky routing for compilation and SyncTeX; shared artifact storage is not implemented here. Compile concurrency is 2, timeout 40 seconds, input 24 MB JSON / 16 MB decoded assets / 500 files, output 10 MB PDF. The application additionally limits combined text source to 500 KB. Apply a disk quota to the worker's temporary storage based on traffic and TTL.

## API contract

The browser requests JSON from `/api/latex/compile`; legacy PDF clients remain supported. JSON has `pdf` (base64), `log`, `buildId`, `synctexAvailable`, `hasErrors`. The worker preserves diagnostics even when TeX produces a PDF with errors. PDF-only upstreams return explicit absent capabilities. Binary resources are sent to LaTeX-on-HTTP using its `file` field.

`POST /api/latex/synctex` accepts the build capability plus either:

- `{direction: "forward", file, line}` → `{page, x, y, width, height}`.
- `{direction: "reverse", page, x, y}` → `{file, line}`.

Coordinates are unscaled PDF points from the top left, converted using PDF.js page viewports in the browser. The worker delegates to native `synctex view` / `synctex edit`; there is no text-matching or line/page-ratio fallback. Source paths must belong to that exact build. SyncTeX itself may return a nearby typeset box for macros or commands that have no visible output.

The client rejects stale async responses, refuses SyncTeX on changed projects and compares all files, images and compile settings with the compiled snapshot. Cursor movement alone never scrolls PDF. Diagnostics are tied to the requested snapshot and filtered per editor file.

## Verification

- `npm run test:latex`: compiler compatibility, bounded inputs, Unicode/nested paths, warnings and project revision tracking.
- `python3 -B services/latex-worker/test_worker.py`: native multi-file compile and both SyncTeX directions with all three engines; repeated identical text on different pages ensures text matching cannot fake success. Requires TeX Live; the native test is explicitly skipped if tools are missing.
- `npx tsc --noEmit --incremental false` and `npm run build`.

Manual acceptance: two-column and landscape pages; Ctrl/Cmd-click and double-click; navigation to a child file; repeated jumps to the same line; errors in two files at the same line number; warnings on successful compile; change a child file or image and verify stale banner; modify during an in-flight sync; regenerate a PDF while viewing a later page; search an offscreen page; select/copy text and follow a PDF link; zoom and use presentation keys. Image-only/scanned PDFs have no searchable text without OCR.
