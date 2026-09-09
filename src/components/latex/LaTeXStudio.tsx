'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {Code2, FileText, Download, Play, Loader2, ZoomIn, ZoomOut, Maximize2, Save} from 'lucide-react';
import {APP_VERSION} from '@/config/version';
import WorkspaceBrand from '@/components/header/WorkspaceBrand';
import { useCallback, useEffect, useRef, useState } from 'react';
import WorkspaceHeader from '@/components/header/WorkspaceHeader';
import ThemeToggleButton from '@/components/header/ThemeToggleButton';
import { LATEX_TEMPLATES } from './LaTeXTemplates';

const TeXEditor = dynamic(() => import('./TeXEditor'), { ssr: false, loading: () => <p className="p-4">Đang tải trình soạn thảo…</p> });
const PDFPreview = dynamic(() => import('./PDFPreview'), {ssr: false, loading: () => <p className="p-4">Đang mở PDF…</p>});
const button = 'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-cyan-500/40 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed';
const draftKey = 'mathaio-latex-draft-v1';
export default function LaTeXStudio({engineLabel}: {engineLabel: string}) {
  const [source, setSource] = useState(LATEX_TEMPLATES[0].source);
  const [template, setTemplate] = useState('blank');
  const [fontSize, setFontSize] = useState(14);
  const [status, setStatus] = useState<'ready'|'compiling'|'success'|'error'>('ready');
  const [error, setError] = useState('');
  const [pdf, setPdf] = useState('');
  const [compiledSource, setCompiledSource] = useState('');
  const [zoom, setZoom] = useState<number|'page-width'>('page-width');
  const [loaded, setLoaded] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const sourceRef = useRef(source);
  const active = useRef<AbortController|null>(null);
  useEffect(() => { sourceRef.current = source; }, [source]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    try { const draft = localStorage.getItem(draftKey); if (draft !== null) { setSource(draft); setTemplate(''); } } catch { setStorageNotice('Không thể đọc bản nháp trên trình duyệt này.'); }
    setLoaded(true);
    });
    return () => { cancelAnimationFrame(frame); active.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => { try { localStorage.setItem(draftKey, source); } catch { setStorageNotice('Không thể lưu bản nháp. Hãy xuất file .tex để giữ nội dung.'); } }, 500);
    return () => clearTimeout(timer);
  }, [source, loaded]);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf); }, [pdf]);
  const compile = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController(); active.current = controller;
    const snapshot = sourceRef.current;
    setStatus('compiling'); setError('');
    const timeout = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch('/api/latex/compile', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({source: snapshot}), signal: controller.signal});
      if (!response.ok) {
        const detail = await response.json().catch(() => ({error: `Máy chủ trả về lỗi ${response.status}`}));
        throw new Error([detail.error, detail.log].filter(Boolean).join('\n\n'));
      }
      const bytes = await response.arrayBuffer();
      if (new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') throw new Error('Máy chủ không trả về tài liệu PDF hợp lệ.');
      setPdf(URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'})));
      setCompiledSource(snapshot); setStatus('success');
    } catch (e) {
      setError(controller.signal.aborted ? 'Đã hết thời gian biên dịch (55 giây). Vui lòng thử lại hoặc rút gọn tài liệu.' : e instanceof Error ? e.message : 'Không thể biên dịch.');
      setStatus('error');
    } finally { clearTimeout(timeout); active.current = null; }
  }, []);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void compile(); } };
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut);
  }, [compile]);
  const exportTex = () => {
    const url = URL.createObjectURL(new Blob([source], {type: 'application/x-tex;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'document.tex'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="min-h-dvh lg:h-dvh lg:overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-200">
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true"><div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 dark:bg-cyan-600/15 rounded-full blur-3xl" /><div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl" /></div>
    <header className="shrink-0 z-30 backdrop-blur-md bg-white/85 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs dark:shadow-xl dark:shadow-slate-950/50 transition-colors">
      <div className="flex flex-wrap items-center gap-3"><WorkspaceBrand badge="LaTeX Studio" subtitle="Biên soạn tài liệu toán học &amp; xuất bản PDF A4" /><WorkspaceHeader /></div>
      <div className="flex items-center gap-2.5"><span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80"><FileText className="w-3.5 h-3.5 text-cyan-500" />PDF Engine v1.0</span><ThemeToggleButton /></div>
    </header>
    <div className="relative z-10 mx-4 md:mx-6 mt-3 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/80 dark:bg-slate-900/50 shadow-xs backdrop-blur-sm flex flex-wrap items-center gap-2 shrink-0">
      <h1 className="sr-only">Biên Soạn &amp; Biên Dịch LaTeX Sang PDF</h1>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chọn mẫu tài liệu <select aria-label="Chọn mẫu tài liệu" value={template} disabled={status === 'compiling'} className={`${button} ml-2 bg-white dark:bg-slate-900 max-w-60`} onChange={e => {
        const selected = LATEX_TEMPLATES.find(t => t.id === e.target.value);
        if (selected && (source === LATEX_TEMPLATES.find(t => t.id === template)?.source || window.confirm('Thay nội dung hiện tại bằng mẫu mới? Hãy xuất file .tex nếu cần giữ lại.'))) { setTemplate(selected.id); setSource(selected.source); }
      }}><option value="" disabled>Bản nháp</option>{LATEX_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <button onClick={() => void compile()} disabled={status === 'compiling' || !source.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50" title="Ctrl+Enter / Cmd+Enter">{status === 'compiling' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}{status === 'compiling' ? 'Đang biên dịch…' : 'Biên dịch PDF'}</button>
      <button className={button} onClick={exportTex}><Code2 className="w-3.5 h-3.5" />Xuất file .tex</button>
      {pdf ? <a href={pdf} download="document.pdf" className={button}><Download className="w-3.5 h-3.5" />Tải PDF về máy</a> : <button className={button} disabled><Download className="w-3.5 h-3.5" />Tải PDF về máy</button>}
      <span role="status" className={`text-[11px] font-medium rounded-full border px-2.5 py-1 sm:ml-auto ${status === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300'}`}>{({ready: 'Sẵn sàng', compiling: 'Đang biên dịch…', success: 'Biên dịch thành công', error: 'Lỗi biên dịch'})[status]}</span>
    </div>
    <main className="relative z-10 flex-1 min-h-0 w-full px-4 md:px-6 py-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section aria-label="Trình soạn thảo" className="min-w-0 flex flex-col bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden backdrop-blur-sm h-[65vh] lg:h-auto">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 text-xs bg-slate-50/80 dark:bg-slate-900/50"><span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300"><Code2 className="w-4 h-4 text-cyan-500" />Mã nguồn LaTeX<span className="hidden xl:inline text-[10px] font-mono font-normal text-slate-400">document.tex</span></span><label>Cỡ chữ <select aria-label="Cỡ chữ mã nguồn" className="bg-transparent border rounded p-1" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}>{[12,14,16,18,20,24].map(n => <option key={n}>{n}</option>)}</select></label></div>
        <div className="flex-1 min-h-0"><TeXEditor source={source} onChange={setSource} fontSize={fontSize} onCompile={compile} /></div>
      </section>
      <section aria-label="Xem trước PDF" className="min-w-0 flex flex-col bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden backdrop-blur-sm h-[75vh] lg:h-auto">
        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 text-xs bg-slate-50/80 dark:bg-slate-900/50"><span className="mr-auto flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300"><FileText className="w-4 h-4 text-cyan-500" />Khung xem trước PDF</span><button className={button} disabled={!pdf} aria-label="Thu nhỏ PDF" onClick={() => setZoom(z => Math.max(25, (typeof z === 'number' ? z : 100)-25))}><ZoomOut className="w-3.5 h-3.5" /></button><span>{typeof zoom === 'number' ? `${zoom}%` : 'Vừa chiều rộng'}</span><button className={button} disabled={!pdf} aria-label="Phóng to PDF" onClick={() => setZoom(z => Math.min(300,(typeof z === 'number' ? z : 100)+25))}><ZoomIn className="w-3.5 h-3.5" /></button><button className={button} disabled={!pdf} aria-label="Vừa chiều rộng" onClick={() => setZoom('page-width')}><Maximize2 className="w-3.5 h-3.5" /><span className="hidden xl:inline">Vừa chiều rộng</span></button></div>
        {pdf && source !== compiledSource && <p role="status" className="text-xs p-2 bg-amber-100 text-amber-900">PDF đang hiển thị là bản biên dịch trước. Biên dịch lại để cập nhật thay đổi.</p>}
        {pdf ? <PDFPreview key={pdf} url={pdf} zoom={zoom} /> : <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-slate-500"><div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" /></div><p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Chưa có tài liệu PDF</p><p className="text-xs max-w-xs leading-relaxed">Chọn mẫu hoặc nhập mã LaTeX ở cột bên trái, rồi bấm “Biên dịch PDF”.</p><p className="text-xs mt-2">Ctrl+Enter / Cmd+Enter · A4 · amsmath · amssymb · exam · TikZ</p></div>}
        {error && <div role="alert" className="max-h-56 overflow-auto p-4 border-t border-rose-300 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200"><h2 className="font-bold text-sm mb-2">Nhật ký lỗi biên dịch</h2><pre className="whitespace-pre-wrap break-words text-xs">{error}</pre></div>}
      </section>
    </main>
    <footer className="relative z-10 shrink-0 px-4 md:px-6 py-2 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3"><span>MathAIO Studio © {new Date().getFullYear()}</span><span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span><span className="hidden md:inline-flex items-center gap-1.5"><Save className="w-3 h-3" />{storageNotice || 'Tự động lưu bản nháp'}</span><Link href="/changelog?from=%2Flatex" className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted font-mono">{APP_VERSION.fullString}</Link></div>
      <span className="text-[10px]">Mã nguồn được gửi tới {engineLabel} khi biên dịch.</span>
    </footer>
  </div>;
}
