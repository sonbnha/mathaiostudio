'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Code2,
  Download,
  FileText,
  Loader2,
  Maximize2,
  Play,
  Save,
  WandSparkles,
  ZoomIn,
  ZoomOut,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  History as HistoryIcon,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import WorkspaceHeader, { WorkspaceBrand } from '@/components/header/WorkspaceHeader';
import ThemeToggleButton from '@/components/header/ThemeToggleButton';
import StudioTools, { type StudioFile, type StudioImage, type RestorePoint } from '@/components/latex/StudioTools';
import { LATEX_TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplateById } from '@/components/latex/LaTeXTemplates';

const TeXEditor = dynamic(() => import('@/components/latex/TeXEditor'), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-xs text-slate-500">Đang tải trình soạn thảo Monaco…</div>
  ),
});

const PDFPreview = dynamic(() => import('@/components/latex/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-xs text-slate-500">Đang tải trình xem PDF…</div>
  ),
});

const STORAGE_KEY = 'mathaio_latex_studio_state_v2';

const button =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer';

export default function LaTeXStudio({ engineLabel }: { engineLabel: string }) {
  // Main state
  const defaultTpl = getTemplateById(DEFAULT_TEMPLATE_ID) || LATEX_TEMPLATES[0];
  const [template, setTemplate] = useState<string>(defaultTpl.id);
  const [source, setSource] = useState<string>(defaultTpl.source);
  const [activeFileName, setActiveFileName] = useState<string>('main.tex');
  const [files, setFiles] = useState<StudioFile[]>([
    { name: 'main.tex', content: defaultTpl.source },
  ]);
  const [images, setImages] = useState<StudioImage[]>([]);
  const [history, setHistory] = useState<RestorePoint[]>([]);

  // Compiler state
  const [status, setStatus] = useState<'ready' | 'compiling' | 'success' | 'error'>('ready');
  const [error, setError] = useState<string>('');
  const [pdf, setPdf] = useState<string | null>(null);
  const [compiledSource, setCompiledSource] = useState<string>('');
  const [zoom, setZoom] = useState<number | 'page-width'>('page-width');
  const [fontSize, setFontSize] = useState<number>(14);

  // SyncTeX & Tools state
  const [targetLine, setTargetLine] = useState<number | undefined>(undefined);
  const [highlightPage, setHighlightPage] = useState<number | undefined>(undefined);
  const [insertRequest, setInsertRequest] = useState<{ id: number; text: string } | undefined>(undefined);
  const [isPresentation, setIsPresentation] = useState<boolean>(false);
  const [storageNotice, setStorageNotice] = useState<string>('');

  // AI & Async busy flags
  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [ocrBusy, setOcrBusy] = useState<boolean>(false);
  const [fixBusy, setFixBusy] = useState<boolean>(false);

  // Restore saved state from LocalStorage on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.source) {
          setSource(parsed.source);
          setFiles(parsed.files || [{ name: 'main.tex', content: parsed.source }]);
          setHistory(parsed.history || []);
          if (parsed.template) setTemplate(parsed.template);
          if (parsed.fontSize) setFontSize(parsed.fontSize);
          setStorageNotice('Đã khôi phục bản nháp trước');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save debounced to LocalStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            source,
            template,
            fontSize,
            files: files.map((f) => (f.name === activeFileName ? { ...f, content: source } : f)),
            history: history.slice(-20),
            updatedAt: Date.now(),
          })
        );
        setStorageNotice(`Tự động lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`);
      } catch {
        // storage quota
      }
    }, 1200);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [source, template, fontSize, files, activeFileName, history]);

  // Insert helper for Ribbon and snippets
  const handleInsert = useCallback((text: string) => {
    setInsertRequest({ id: Date.now(), text });
  }, []);

  // Compile LaTeX to PDF
  const compile = useCallback(
    async (sourceToCompile?: string) => {
      const code = sourceToCompile || source;
      if (!code.trim()) return;

      setStatus('compiling');
      setError('');

      try {
        const res = await fetch('/api/latex/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: code }),
        });

        if (!res.ok) {
          let errData: any = {};
          try {
            errData = await res.json();
          } catch {
            errData = { error: 'Lỗi máy chủ biên dịch.' };
          }
          throw new Error(errData.log || errData.error || 'Biên dịch thất bại.');
        }

        const blob = await res.blob();
        if (pdf) URL.revokeObjectURL(pdf);
        const url = URL.createObjectURL(blob);
        setPdf(url);
        setCompiledSource(code);
        setStatus('success');

        // Add to history restore points
        setHistory((prev) => [
          ...prev,
          { at: Date.now(), source: code, label: 'Biên dịch thành công' },
        ]);
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Lỗi không xác định khi biên dịch.');
      }
    },
    [source, pdf]
  );

  // 1-Click AI Auto-Fix
  const handleAIFix = async () => {
    if (!error) {
      alert('Chưa phát hiện lỗi biên dịch để sửa.');
      return;
    }
    setFixBusy(true);
    try {
      const res = await fetch('/api/latex/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, errorLog: error }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tự sửa lỗi.');
      }

      setSource(data.fixedSource);
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFileName ? { ...f, content: data.fixedSource } : f))
      );
      // Auto re-compile fixed source!
      await compile(data.fixedSource);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi AI sửa mã.');
    } finally {
      setFixBusy(false);
    }
  };

  // AI Assistant Actions
  const handleAI = async (action: string, customPrompt?: string) => {
    setAiBusy(true);
    try {
      const res = await fetch('/api/latex/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, source, customPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI không thể hoàn thành yêu cầu.');
      }

      // Append AI generated math content at cursor or bottom
      handleInsert(`\n\n% --- AI generated content ---\n${data.result}\n`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gọi trợ lý AI.');
    } finally {
      setAiBusy(false);
    }
  };

  // OCR Image to LaTeX
  const handleOCR = async (file: File) => {
    setOcrBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/latex/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể nhận diện ảnh.');
      }

      handleInsert(`\n\n% --- OCR từ ảnh ${file.name} ---\n${data.latex}\n`);
    } catch (err: any) {
      alert(err.message || 'Lỗi nhận diện OCR ảnh.');
    } finally {
      setOcrBusy(false);
    }
  };

  // Import Word (.docx) to LaTeX
  const handleImportWord = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/latex/word', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể nhập file Word.');
      }

      if (window.confirm(`Thay thế tài liệu bằng nội dung từ file Word "${file.name}"?`)) {
        setSource(data.latex);
        setFiles((prev) =>
          prev.map((f) => (f.name === activeFileName ? { ...f, content: data.latex } : f))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi chuyển đổi file Word.');
    }
  };

  // Export LaTeX to Word (.docx)
  const handleExportWord = async () => {
    try {
      const res = await fetch('/api/latex/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, title: 'Tai_lieu_MathAIO' }),
      });
      if (!res.ok) throw new Error('Không thể tạo file Word.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Tai_lieu_MathAIO.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Lỗi xuất file Word.');
    }
  };

  // Export .tex file
  const exportTex = () => {
    const blob = new Blob([source], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFileName || 'document.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore point
  const handleRestore = (point: RestorePoint) => {
    if (window.confirm(`Khôi phục bản nháp lúc ${new Date(point.at).toLocaleTimeString('vi-VN')}?`)) {
      setSource(point.source);
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFileName ? { ...f, content: point.source } : f))
      );
    }
  };

  // 2-Way SyncTeX Click Handlers
  const handleSyncPDFToCode = (page: number, ratio: number) => {
    // Approximate line calculation from page and ratio
    const lines = source.split('\n');
    const estimatedTotalPages = Math.max(1, Math.ceil(lines.length / 45));
    const linesPerPage = Math.ceil(lines.length / estimatedTotalPages);
    const line = Math.min(lines.length, Math.max(1, Math.round((page - 1) * linesPerPage + ratio * linesPerPage)));
    setTargetLine(line);
  };

  const handleSyncCodeToPDF = (lineNumber: number) => {
    const lines = source.split('\n');
    const estimatedTotalPages = Math.max(1, Math.ceil(lines.length / 45));
    const linesPerPage = Math.ceil(lines.length / estimatedTotalPages);
    const page = Math.min(estimatedTotalPages, Math.max(1, Math.ceil(lineNumber / linesPerPage)));
    setHighlightPage(page);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header Bar */}
      <header className="shrink-0 z-30 backdrop-blur-md bg-white/85 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs dark:shadow-xl dark:shadow-slate-950/50 transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          <WorkspaceBrand
            badge="LaTeX Studio"
            subtitle="Biên soạn tài liệu toán học &amp; xuất bản PDF A4"
          />
          <WorkspaceHeader />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
            <FileText className="w-3.5 h-3.5 text-cyan-500" />
            PDF Engine v2.0 (XeLaTeX)
          </span>
          <ThemeToggleButton />
        </div>
      </header>

      {/* 2. Top Action Controls */}
      <div className="relative z-10 mx-4 md:mx-6 mt-3 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/85 dark:bg-slate-900/70 shadow-xs backdrop-blur-sm flex flex-wrap items-center gap-2 shrink-0">
        <h1 className="sr-only">Biên Soạn &amp; Biên Dịch LaTeX Sang PDF</h1>

        {/* Template Selector with GDPT 2018 badges */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mẫu chuẩn:
          </label>
          <select
            aria-label="Chọn mẫu tài liệu"
            value={template}
            disabled={status === 'compiling'}
            className={`${button} bg-white dark:bg-slate-900 max-w-72 font-medium`}
            onChange={(e) => {
              const selected = LATEX_TEMPLATES.find((t) => t.id === e.target.value);
              if (selected) {
                if (
                  source === LATEX_TEMPLATES.find((t) => t.id === template)?.source ||
                  window.confirm(
                    `Chuyển sang mẫu "${selected.name}"? Nội dung hiện tại sẽ được lưu vào lịch sử nháp.`
                  )
                ) {
                  setTemplate(selected.id);
                  setSource(selected.source);
                  setFiles((prev) =>
                    prev.map((f) => (f.name === activeFileName ? { ...f, content: selected.source } : f))
                  );
                }
              }
            }}
          >
            {LATEX_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.badge ? `[${t.badge}] ` : ''}
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Compile Action Button */}
        <button
          onClick={() => void compile()}
          disabled={status === 'compiling' || !source.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
          title="Phím tắt: Ctrl+Enter / Cmd+Enter"
        >
          {status === 'compiling' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{status === 'compiling' ? 'Đang biên dịch…' : 'Biên dịch PDF'}</span>
        </button>

        {/* Export .tex */}
        <button className={button} onClick={exportTex}>
          <Code2 className="w-3.5 h-3.5 text-cyan-500" />
          <span>Xuất .tex</span>
        </button>

        {/* Download PDF */}
        {pdf ? (
          <a href={pdf} download="Tai_lieu_Toan_MathAIO.pdf" className={button}>
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tải PDF A4</span>
          </a>
        ) : (
          <button className={button} disabled>
            <Download className="w-3.5 h-3.5" />
            <span>Tải PDF</span>
          </button>
        )}

        {/* Status indicator badge */}
        <span
          role="status"
          className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full border px-3 py-1 sm:ml-auto ${
            status === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : status === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300'
          }`}
        >
          {status === 'ready' && <span>Sẵn sàng biên dịch</span>}
          {status === 'compiling' && <span>Đang dịch mã TeX…</span>}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Biên dịch thành công</span>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-rose-500" />
              <span>Phát hiện lỗi TeX</span>
            </>
          )}
        </span>
      </div>

      {/* 3. Studio Tools: Ribbon, Project, AI, Geometry, History */}
      <StudioTools
        source={source}
        setSource={(newSource) => {
          setSource(newSource);
          setFiles((prev) =>
            prev.map((f) => (f.name === activeFileName ? { ...f, content: newSource } : f))
          );
        }}
        insert={handleInsert}
        onAI={handleAI}
        aiBusy={aiBusy}
        onAIFix={handleAIFix}
        fixBusy={fixBusy}
        onOCR={handleOCR}
        ocrBusy={ocrBusy}
        onImportWord={handleImportWord}
        onExportWord={handleExportWord}
        files={files}
        setFiles={setFiles}
        images={images}
        setImages={setImages}
        history={history}
        restore={handleRestore}
        activeFileName={activeFileName}
        setActiveFileName={setActiveFileName}
        onTogglePresentation={() => setIsPresentation(true)}
      />

      {/* 4. Main Split-Pane Workspace */}
      <main className="relative z-10 flex-1 min-h-0 w-full px-4 md:px-6 py-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN: TeX Editor */}
        <section
          aria-label="Trình soạn thảo mã LaTeX"
          className="min-w-0 flex flex-col bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden backdrop-blur-sm h-[55vh] lg:h-auto"
        >
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 text-xs bg-slate-50/80 dark:bg-slate-900/50">
            <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Code2 className="w-4 h-4 text-cyan-500" />
              <span>Mã nguồn LaTeX</span>
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {activeFileName}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500 flex items-center gap-1">
                Cỡ chữ:
                <select
                  aria-label="Cỡ chữ mã nguồn"
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 text-xs"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                >
                  {[12, 13, 14, 15, 16, 18, 20, 24].map((n) => (
                    <option key={n} value={n}>
                      {n}px
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <TeXEditor
              source={source}
              onChange={(newSource) => {
                setSource(newSource);
                setFiles((prev) =>
                  prev.map((f) => (f.name === activeFileName ? { ...f, content: newSource } : f))
                );
              }}
              fontSize={fontSize}
              onCompile={compile}
              insertRequest={insertRequest}
              onCursorLine={handleSyncCodeToPDF}
              targetLine={targetLine}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: PDF Preview Panel */}
        <section
          aria-label="Khung xem trước tài liệu PDF"
          className="min-w-0 flex flex-col bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden backdrop-blur-sm h-[65vh] lg:h-auto"
        >
          {pdf && source !== compiledSource && (
            <div
              role="status"
              className="text-xs px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between"
            >
              <span>Mã nguồn đã thay đổi. Biên dịch lại (Ctrl+Enter) để cập nhật PDF.</span>
              <button
                onClick={() => void compile()}
                className="underline font-bold hover:text-amber-900 cursor-pointer"
              >
                Cập nhật ngay
              </button>
            </div>
          )}

          {pdf ? (
            <PDFPreview
              key={pdf}
              url={pdf}
              zoom={zoom}
              setZoom={setZoom}
              onSync={handleSyncPDFToCode}
              highlightPage={highlightPage}
              isPresentation={isPresentation}
              onClosePresentation={() => setIsPresentation(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chưa có tài liệu PDF
              </p>
              <p className="text-xs max-w-sm leading-relaxed text-slate-500">
                Chọn mẫu chuẩn GDPT 2018 hoặc nhập mã LaTeX ở cột bên trái, rồi bấm{' '}
                <strong className="text-cyan-600">“Biên dịch PDF”</strong> (Ctrl+Enter / Cmd+Enter).
              </p>
            </div>
          )}

          {/* Compiler Error Console & AI Auto-Fix Bar */}
          {error && (
            <div
              role="alert"
              className="max-h-56 overflow-auto p-3.5 border-t border-rose-300 dark:border-rose-900/80 bg-rose-50/90 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 text-xs shrink-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Nhật ký lỗi biên dịch TeX</span>
                </div>

                <button
                  disabled={fixBusy}
                  onClick={handleAIFix}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <WandSparkles className="w-3.5 h-3.5" />
                  <span>{fixBusy ? 'AI đang sửa…' : '1-Click AI Auto-Fix'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] max-h-36 overflow-auto bg-white/60 dark:bg-slate-950/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900/40">
                {error}
              </pre>
            </div>
          )}
        </section>
      </main>

      {/* 5. Footer Status Bar */}
      <footer className="relative z-10 shrink-0 px-4 md:px-6 py-2 border-t border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>MathAIO Studio © {new Date().getFullYear()}</span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden md:inline-flex items-center gap-1.5">
            <Save className="w-3 h-3 text-emerald-500" />
            {storageNotice || 'Tự động lưu bản nháp'}
          </span>
          <Link
            href="/changelog?from=%2Flatex"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted font-mono"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Biên dịch XeLaTeX trực tuyến qua {engineLabel}</span>
        </div>
      </footer>
    </div>
  );
}
