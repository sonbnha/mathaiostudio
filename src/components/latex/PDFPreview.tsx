'use client';

import { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { Search, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFSyncTarget } from '@/lib/synctexParser';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
export interface PDFHighlightTarget extends PDFSyncTarget { id: number }
export interface PDFPosition { page: number; x: number; y: number }
type PageInfo = { width: number; height: number; page: PDFPageProxy };
type SearchMatch = { page: number; x: number; y: number; width: number; height: number };
type Anchor = { page: number; ratio: number };

const LazyPage = memo(function LazyPage({ number, width, info, target, searchTarget, invert, onPosition, onSync, root, force }: {
  number: number; width: number; info: PageInfo; target?: PDFHighlightTarget | null; searchTarget?: SearchMatch;
  invert: boolean; root: HTMLElement | null; force: boolean;
  onPosition: (position: PDFPosition) => void; onSync?: (position: PDFPosition) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [flash, setFlash] = useState(false);
  const height = width * info.height / info.width;
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {root, rootMargin: '700px'});
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [root]);
  useEffect(() => {
    if (!target) return;
    const frame = requestAnimationFrame(() => setFlash(true));
    const timer = setTimeout(() => setFlash(false), 3500);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [target]);
  const position = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewport = info.page.getViewport({scale: 1});
    const [x, y] = viewport.convertToPdfPoint((event.clientX - rect.left) * info.width / rect.width, (event.clientY - rect.top) * info.height / rect.height);
    return {page: number, x, y: info.page.view[3] - y};
  };
  let overlay: {left: number; top: number; width: number; height: number} | undefined;
  if (target && flash) {
    const view = info.page.getViewport({scale: 1});
    const coords = view.convertToViewportRectangle([target.x, info.page.view[3] - target.y, target.x + target.width, info.page.view[3] - target.y - target.height]);
    overlay = {left: Math.min(coords[0], coords[2]) / info.width * 100, top: Math.min(coords[1], coords[3]) / info.height * 100,
      width: Math.abs(coords[2] - coords[0]) / info.width * 100, height: Math.max(0.5, Math.abs(coords[3] - coords[1]) / info.height * 100)};
  } else if (searchTarget) {
    overlay = {left: searchTarget.x / info.width * 100, top: searchTarget.y / info.height * 100,
      width: searchTarget.width / info.width * 100, height: searchTarget.height / info.height * 100};
  }
  return <div ref={ref} data-pdf-page={number} className="relative mb-4 bg-white shadow-lg shrink-0" style={{width, height, filter: invert ? 'invert(.9) hue-rotate(180deg)' : undefined}}
    onClick={e => { if ((e.target as HTMLElement).closest('a,button,input')) return; const p = position(e); onPosition(p); if (e.ctrlKey || e.metaKey) onSync?.(p); }}
    onDoubleClick={e => { if (!(e.target as HTMLElement).closest('a,button,input')) onSync?.(position(e)); }}
    aria-label={`Trang PDF ${number}`}>
    {(visible || force) && <Page pageNumber={number} width={width} renderTextLayer renderAnnotationLayer
      devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)} loading={<p className="p-4 text-xs text-slate-500">Đang kết xuất trang {number}…</p>} />}
    {overlay && <div aria-hidden className="absolute pointer-events-none z-20 border-2 border-amber-500 bg-amber-300/30" style={{left: `${overlay.left}%`, top: `${overlay.top}%`, width: `${overlay.width}%`, height: `${overlay.height}%`}} />}
  </div>;
});

export default function PDFPreview({url, zoom, setZoom, onReverseSync, onPositionChange, highlightTarget, jumpToPage,
  onTotalPagesChange, onActivePageChange, isPresentation, onClosePresentation, invertColors = false,
  isOutOfSync = false, onRecompile, syncAvailable = false, initialPage = 1,
}: {
  url: string; zoom: number | 'page-width';
  setZoom: (z: number | 'page-width' | ((prev: number | 'page-width') => number | 'page-width')) => void;
  onReverseSync?: (page: number, y: number, x?: number) => void;
  onPositionChange?: (position: PDFPosition) => void;
  highlightTarget?: PDFHighlightTarget | null; highlightPage?: number; jumpToPage?: number;
  onTotalPagesChange?: (total: number) => void; onActivePageChange?: (page: number) => void;
  isPresentation?: boolean; onClosePresentation?: () => void; showSubToolbar?: boolean; invertColors?: boolean;
  isOutOfSync?: boolean; onRecompile?: () => void; syncAvailable?: boolean; initialPage?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pdf = useRef<PDFDocumentProxy | null>(null);
  const loadVersion = useRef(0);
  const anchor = useRef<Anchor>({page: initialPage, ratio: 0});
  const restoring = useRef(false);
  const callbacks = useRef({onTotalPagesChange, onActivePageChange, onPositionChange});
  callbacks.current = {onTotalPagesChange, onActivePageChange, onPositionChange};
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [containerWidth, setContainerWidth] = useState(600);
  const [activePage, setActivePage] = useState(initialPage);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState('');
  const textCache = useRef(new Map<number, Awaited<ReturnType<PDFPageProxy['getTextContent']>>>());
  const [loadedUrl, setLoadedUrl] = useState('');
  const pageWidth = (info: PageInfo) => zoom === 'page-width' ? Math.max(160, containerWidth - 32) : info.width * zoom / 100;
  const scrollTo = useCallback((page: number, ratio = 0) => {
    const element = host.current?.querySelector<HTMLElement>(`[data-pdf-page="${page}"]`);
    const container = host.current;
    if (!element || !container) return;
    container.scrollTop += element.getBoundingClientRect().top - container.getBoundingClientRect().top + element.offsetHeight * ratio;
    setActivePage(page);
    callbacks.current.onActivePageChange?.(page);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setContainerWidth(Math.floor(entry.contentRect.width)));
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    restoring.current = true;
    ++loadVersion.current;
    pdf.current = null;
    textCache.current.clear();
    const generation = loadVersion;
    return () => { ++generation.current; };
  }, [url]);

  const onLoad = useCallback(async (document: PDFDocumentProxy) => {
    const version = loadVersion.current;
    const result: PageInfo[] = [];
    try {
      for (let n = 1; n <= document.numPages; n++) {
        const page = await document.getPage(n);
        if (version !== loadVersion.current) return;
        const viewport = page.getViewport({scale: 1});
        result.push({page, width: viewport.width, height: viewport.height});
      }
      pdf.current = document;
      setPages(result);
      setLoadedUrl(url);
      callbacks.current.onTotalPagesChange?.(document.numPages);
    } catch { setNotice('Không thể đọc thông tin trang PDF.'); }
  }, [url]);

  // Restore a page-relative anchor after a new PDF or a change of zoom/width.
  useEffect(() => {
    if (loadedUrl !== url || !pages.length) return;
    restoring.current = true;
    const frame = requestAnimationFrame(() => {
      scrollTo(Math.min(anchor.current.page, pages.length), anchor.current.ratio);
      restoring.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [loadedUrl, url, pages, zoom, containerWidth, isPresentation, scrollTo]);

  useEffect(() => { if (jumpToPage && pages.length) scrollTo(Math.min(pages.length, Math.max(1, jumpToPage))); }, [jumpToPage, pages.length, scrollTo]);
  useEffect(() => {
    if (!highlightTarget || loadedUrl !== url) return;
    const info = pages[highlightTarget.page - 1];
    if (!info) return;
    const [, y] = info.page.getViewport({scale: 1}).convertToViewportPoint(highlightTarget.x, info.page.view[3] - highlightTarget.y);
    scrollTo(highlightTarget.page, y / info.height);
    if (host.current) host.current.scrollTop = Math.max(0, host.current.scrollTop - host.current.clientHeight / 3);
  }, [highlightTarget, loadedUrl, url, pages, scrollTo]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setMatches([]); setMatchIndex(0); setSearching(!!query.trim());
      if (!query.trim() || !pdf.current || loadedUrl !== url) { setSearching(false); return; }
      const results: SearchMatch[] = [];
      const needle = query.toLocaleLowerCase();
      try {
        for (let n = 0; n < pages.length; n++) {
          const info = pages[n];
          const content = textCache.current.get(n) || await info.page.getTextContent();
          if (cancelled) return;
          textCache.current.set(n, content);
          const spans: Array<{start: number; end: number; x: number; y: number; width: number; height: number}> = [];
          let text = '';
          for (const item of content.items) {
            if (!('str' in item)) continue;
            const [x, y] = info.page.getViewport({scale: 1}).convertToViewportPoint(item.transform[4], item.transform[5]);
            const height = Math.max(1, Math.hypot(item.transform[2], item.transform[3]));
            spans.push({start: text.length, end: text.length + item.str.length, x, y: y - height, width: item.width, height});
            text += item.str + (item.hasEOL ? ' ' : '');
          }
          const haystack = text.toLocaleLowerCase();
          for (let start = haystack.indexOf(needle); start !== -1; start = haystack.indexOf(needle, start + Math.max(1, needle.length))) {
            const span = spans.find(s => s.end > start && s.start < start + needle.length);
            if (span) results.push({page: n + 1, x: span.x, y: span.y, width: Math.max(2, span.width), height: span.height});
          }
        }
        if (!cancelled) setMatches(results);
      } catch { if (!cancelled) setNotice('Không thể tìm kiếm văn bản trong PDF này.'); }
      finally { if (!cancelled) setSearching(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, pages, loadedUrl, url]);
  const currentMatch = matches[matchIndex];
  useEffect(() => { if (currentMatch) scrollTo(currentMatch.page, currentMatch.y / pages[currentMatch.page - 1].height); }, [currentMatch, pages, scrollTo]);
  useEffect(() => {
    if (!isPresentation) return;
    const listener = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input,textarea,[contenteditable=true]')) return;
      if (event.key === 'Escape') onClosePresentation?.();
      if (['ArrowRight', 'PageDown', ' ', 'ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        scrollTo(Math.max(1, Math.min(pages.length, activePage + (['ArrowLeft', 'PageUp'].includes(event.key) ? -1 : 1))));
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [isPresentation, activePage, pages.length, scrollTo, onClosePresentation]);

  const onScroll = () => {
    const container = host.current;
    if (!container || restoring.current || loadedUrl !== url) return;
    const top = container.getBoundingClientRect().top;
    const elements = container.querySelectorAll<HTMLElement>('[data-pdf-page]');
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > top + 20) {
        const page = Number(element.dataset.pdfPage);
        anchor.current = {page, ratio: Math.max(0, (top - rect.top) / rect.height)};
        setActivePage(page);
        callbacks.current.onActivePageChange?.(page);
        const info = pages[page - 1];
        if (info) {
          const [x, y] = info.page.getViewport({scale: 1}).convertToPdfPoint(info.width / 2, Math.min(info.height, (anchor.current.ratio + .15) * info.height));
          callbacks.current.onPositionChange?.({page, x, y: info.page.view[3] - y});
        }
        break;
      }
    }
  };
  const exportPNG = async () => {
    const document = pdf.current;
    if (!document) return;
    try {
      const page = await document.getPage(activePage);
      const viewport = page.getViewport({scale: 300 / 72});
      const canvas = window.document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({canvas, viewport}).promise;
      canvas.toBlob(blob => {
        if (!blob) return;
        const link = window.document.createElement('a');
        const href = URL.createObjectURL(blob);
        link.href = href; link.download = `document-page-${activePage}-300dpi.png`; link.click();
        setTimeout(() => URL.revokeObjectURL(href), 1000);
      });
    } catch { setNotice('Không thể xuất ảnh trang PDF.'); }
  };
  return <div className={isPresentation ? 'fixed inset-0 z-50 flex flex-col bg-slate-900 text-white' : 'flex flex-col flex-1 min-h-0 h-full w-full'}>
    {isOutOfSync && <div role="status" className="text-xs p-2 bg-amber-100 text-amber-900 flex justify-between gap-2"><span>Dự án đã thay đổi. Biên dịch lại để cập nhật PDF và vị trí đồng bộ.</span><button onClick={onRecompile} className="underline shrink-0">Recompile</button></div>}
    {!syncAvailable && <p className="text-[11px] px-2 py-1 bg-slate-100 text-slate-600">PDF này không có dữ liệu SyncTeX.</p>}
    <div className="flex items-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs flex-wrap border-b border-slate-300 dark:border-slate-700">
      <Search className="w-3.5 h-3.5" aria-hidden />
      <input aria-label="Tìm trong PDF" placeholder="Tìm trong PDF" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 w-28 flex-1 bg-transparent px-1 py-1 outline-offset-2" onKeyDown={e => { if (e.key === 'Enter' && matches.length) setMatchIndex(i => (i + (e.shiftKey ? matches.length - 1 : 1)) % matches.length); }} />
      <span role="status">{searching ? 'Đang tìm…' : query ? `${matches.length ? matchIndex + 1 : 0}/${matches.length}` : `${activePage}/${pages.length || '…'}`}</span>
      <button aria-label="Kết quả trước" disabled={!matches.length} onClick={() => setMatchIndex(i => (i + matches.length - 1) % matches.length)} className="p-1 disabled:opacity-30"><ChevronLeft size={14}/></button>
      <button aria-label="Kết quả sau" disabled={!matches.length} onClick={() => setMatchIndex(i => (i + 1) % matches.length)} className="p-1 disabled:opacity-30"><ChevronRight size={14}/></button>
      <button aria-label="Thu nhỏ PDF" onClick={() => setZoom(z => Math.max(25, (typeof z === 'number' ? z : 100) - 25))}><ZoomOut size={14}/></button>
      <button onClick={() => setZoom('page-width')} className="px-1" title="Vừa chiều rộng">{zoom === 'page-width' ? 'Vừa rộng' : `${zoom}%`}</button>
      <button aria-label="Phóng to PDF" onClick={() => setZoom(z => Math.min(300, (typeof z === 'number' ? z : 100) + 25))}><ZoomIn size={14}/></button>
      <button onClick={() => void exportPNG()} className="px-1" title="Xuất trang hiện tại thành PNG 300 DPI">PNG</button>
      {isPresentation && <button aria-label="Thoát trình chiếu" onClick={onClosePresentation}><X size={16}/></button>}
    </div>
    {notice && <p role="alert" className="p-2 text-xs bg-rose-100 text-rose-800">{notice}</p>}
    <div ref={host} onScroll={onScroll} className="flex-1 min-h-0 overflow-auto p-4 bg-slate-200 dark:bg-[#525659]" style={{overflowAnchor: 'none'}} aria-label="Tài liệu PDF đã biên dịch">
      <Document file={url} onLoadSuccess={onLoad} onItemClick={({pageNumber}) => { if (pageNumber) scrollTo(pageNumber); }} loading={<p className="text-xs p-4">Đang mở PDF…</p>} error={<p role="alert" className="text-rose-700 p-4">Không thể mở PDF. Bạn có thể tải PDF về máy.</p>}>
        <div style={{width: 'max-content', minWidth: '100%'}} className="flex flex-col items-center">
          {pages.map((info, index) => <LazyPage key={`${loadedUrl}-${index}`} number={index + 1} info={info} width={pageWidth(info)} root={host.current}
            force={index + 1 === activePage} invert={invertColors} target={highlightTarget?.page === index + 1 ? highlightTarget : null}
            searchTarget={currentMatch?.page === index + 1 ? currentMatch : undefined}
            onPosition={p => callbacks.current.onPositionChange?.(p)}
            onSync={syncAvailable && !isOutOfSync ? p => onReverseSync?.(p.page, p.y, p.x) : undefined} />)}
        </div>
      </Document>
    </div>
  </div>;
}
