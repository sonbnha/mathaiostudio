'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import WorkspaceHeader from '@/components/header/WorkspaceHeader';
import ThemeToggleButton from '@/components/header/ThemeToggleButton';
import { LATEX_TEMPLATES } from './LaTeXTemplates';

const TeXEditor = dynamic(() => import('./TeXEditor'), { ssr: false, loading: () => <p className="p-4">Đang tải trình soạn thảo…</p> });
const PDFPreview = dynamic(() => import('./PDFPreview'), {ssr: false, loading: () => <p className="p-4">Đang mở PDF…</p>});
const button = 'rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed';
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
  return <div className="min-h-dvh lg:h-dvh flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <header className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3"><Link href="/" className="font-bold text-lg">MathAIO <span className="text-cyan-600">Studio</span></Link><WorkspaceHeader /></div><ThemeToggleButton />
    </header>
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
      <h1 className="sr-only">Biên Soạn &amp; Biên Dịch LaTeX Sang PDF</h1>
      <label className="text-sm">Chọn mẫu tài liệu <select aria-label="Chọn mẫu tài liệu" value={template} disabled={status === 'compiling'} className={`${button} ml-2 bg-white dark:bg-slate-900 max-w-60`} onChange={e => {
        const selected = LATEX_TEMPLATES.find(t => t.id === e.target.value);
        if (selected && (source === LATEX_TEMPLATES.find(t => t.id === template)?.source || window.confirm('Thay nội dung hiện tại bằng mẫu mới? Hãy xuất file .tex nếu cần giữ lại.'))) { setTemplate(selected.id); setSource(selected.source); }
      }}><option value="" disabled>Bản nháp</option>{LATEX_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <button onClick={() => void compile()} disabled={status === 'compiling' || !source.trim()} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-sm font-bold disabled:opacity-50" title="Ctrl+Enter / Cmd+Enter">{status === 'compiling' ? 'Đang biên dịch…' : 'Biên dịch PDF'}</button>
      <button className={button} onClick={exportTex}>Xuất file .tex</button>
      {pdf ? <a href={pdf} download="document.pdf" className={button}>Tải PDF về máy</a> : <button className={button} disabled>Tải PDF về máy</button>}
      <span role="status" className={`text-xs rounded-full px-3 py-1 ${status === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-cyan-100 text-cyan-900'}`}>{({ready: 'Sẵn sàng', compiling: 'Đang biên dịch…', success: 'Biên dịch thành công', error: 'Lỗi biên dịch'})[status]}</span>
    </div>
    <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800">
      <section aria-label="Trình soạn thảo" className="min-w-0 flex flex-col bg-white dark:bg-slate-950 h-[65vh] lg:h-auto">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 text-xs"><span>document.tex · LaTeX</span><label>Cỡ chữ <select aria-label="Cỡ chữ mã nguồn" className="bg-transparent border rounded p-1" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}>{[12,14,16,18,20,24].map(n => <option key={n}>{n}</option>)}</select></label></div>
        <div className="flex-1 min-h-0"><TeXEditor source={source} onChange={setSource} fontSize={fontSize} onCompile={compile} /></div>
      </section>
      <section aria-label="Xem trước PDF" className="min-w-0 flex flex-col bg-slate-100 dark:bg-slate-900 h-[75vh] lg:h-auto">
        <div className="flex flex-wrap items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-800 text-xs"><span className="mr-auto">Xem trước PDF</span><button className={button} disabled={!pdf} aria-label="Thu nhỏ PDF" onClick={() => setZoom(z => Math.max(25, (typeof z === 'number' ? z : 100)-25))}>−</button><span>{typeof zoom === 'number' ? `${zoom}%` : 'Vừa chiều rộng'}</span><button className={button} disabled={!pdf} aria-label="Phóng to PDF" onClick={() => setZoom(z => Math.min(300,(typeof z === 'number' ? z : 100)+25))}>+</button><button className={button} disabled={!pdf} onClick={() => setZoom('page-width')}>Vừa chiều rộng</button></div>
        {pdf && source !== compiledSource && <p role="status" className="text-xs p-2 bg-amber-100 text-amber-900">PDF đang hiển thị là bản biên dịch trước. Biên dịch lại để cập nhật thay đổi.</p>}
        {pdf ? <PDFPreview key={pdf} url={pdf} zoom={zoom} /> : <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-slate-500"><span className="font-serif text-5xl mb-4 text-rose-400">TeX → PDF</span><p>Chọn mẫu hoặc nhập mã LaTeX, rồi bấm “Biên dịch PDF”.</p><p className="text-xs mt-2">Ctrl+Enter / Cmd+Enter · A4 · amsmath · amssymb · exam · TikZ</p></div>}
        {error && <div role="alert" className="max-h-56 overflow-auto p-4 border-t border-rose-300 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200"><h2 className="font-bold text-sm mb-2">Nhật ký lỗi biên dịch</h2><pre className="whitespace-pre-wrap break-words text-xs">{error}</pre></div>}
      </section>
    </main>
    <footer className="p-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">{storageNotice || 'Tự động lưu bản nháp trên trình duyệt'} · Mã nguồn được gửi tới {engineLabel} khi biên dịch.</footer>
  </div>;
}
