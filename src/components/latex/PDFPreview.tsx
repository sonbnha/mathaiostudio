'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Minimize2,
  Tv,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PDFHighlightTarget {
  page: number;
  yRatio: number; // 0.0 to 1.0
  id: number;
}

const PDFSinglePage = memo(function PDFSinglePage({
  number,
  width,
  onPageClick,
  onPageDoubleClick,
  highlightYRatio,
  highlightId,
  invertColors = false,
}: {
  number: number;
  width: number;
  onPageClick?: (page: number, ratio: number) => void;
  onPageDoubleClick?: (page: number, ratio: number) => void;
  highlightYRatio?: number;
  highlightId?: number;
  invertColors?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(841.89 / 595.28);
  const [highlightVisible, setHighlightVisible] = useState(false);

  // Animate target highlight indicator on forward sync
  useEffect(() => {
    if (highlightYRatio !== undefined && highlightId) {
      setHighlightVisible(true);
      const timer = setTimeout(() => {
        setHighlightVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setHighlightVisible(false);
    }
  }, [highlightYRatio, highlightId]);

  const pageHeight = Math.round(width * ratio);

  return (
    <div
      ref={element}
      id={`pdf-page-${number}`}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const yRatio = (e.clientY - rect.top) / Math.max(1, rect.height);
        if (e.ctrlKey || e.metaKey) {
          onPageDoubleClick?.(number, yRatio);
        } else {
          onPageClick?.(number, yRatio);
        }
      }}
      onDoubleClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const yRatio = (e.clientY - rect.top) / Math.max(1, rect.height);
        onPageDoubleClick?.(number, yRatio);
      }}
      className="mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.35)] bg-white rounded-xs relative shrink-0 transition-all duration-150"
      style={{
        width: `${width}px`,
        maxWidth: `${width}px`,
        minHeight: `${pageHeight}px`,
        filter: invertColors ? 'invert(0.9) hue-rotate(180deg)' : undefined,
      }}
      aria-label={`Trang ${number} - Nhấp đúp để nhảy tới mã nguồn (Reverse Sync)`}
      title="Nhấp đúp vào trang PDF để nhảy tới đúng dòng trong mã nguồn (SyncTeX)"
    >
      <Page
        pageNumber={number}
        width={width}
        devicePixelRatio={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)}
        onLoadSuccess={(page) => {
          const view = page.getViewport({ scale: 1 });
          if (view.width > 0 && view.height > 0) {
            setRatio(view.height / view.width);
          }
        }}
        loading={
          <div
            className="w-full flex items-center justify-center bg-white text-xs text-slate-400 font-mono"
            style={{ minHeight: `${pageHeight}px` }}
          >
            Đang kết xuất trang {number}…
          </div>
        }
      />

      {/* Overleaf-Style Target Line / Highlight Box on top of Canvas */}
      {highlightVisible && highlightYRatio !== undefined && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-30 transition-all duration-300 ease-out"
          style={{
            top: `${Math.max(0.04, Math.min(0.96, highlightYRatio)) * 100}%`,
            transform: 'translateY(-50%)',
            filter: invertColors ? 'invert(1) hue-rotate(180deg)' : undefined,
          }}
        >
          <div
            className="w-full h-11 flex items-center justify-between px-3.5 shadow-2xl"
            style={{
              backgroundColor: 'rgba(254, 240, 138, 0.95)',
              borderTop: '2.5px solid #ca8a04',
              borderBottom: '2.5px solid #ca8a04',
              boxShadow: '0 0 25px 6px rgba(234, 179, 8, 0.85)',
            }}
          >
            <div className="flex items-center gap-1.5 bg-amber-500 text-slate-950 font-bold text-xs font-mono px-2.5 py-1 rounded shadow-md">
              <span>SyncTeX</span>
              <span>➔</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-950 font-bold tracking-tight">
                Vị trí tương ứng (Line Sync)
              </span>
              <div className="h-3 w-3 rounded-full bg-amber-600 animate-ping" />
            </div>
          </div>
        </div>
      )}

      <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-mono select-none pointer-events-none z-10">
        Trang {number}
      </span>
    </div>
  );
});

export default function PDFPreview({
  url,
  zoom,
  setZoom,
  onSync,
  onReverseSync,
  highlightTarget,
  highlightPage,
  jumpToPage,
  onTotalPagesChange,
  onActivePageChange,
  isPresentation,
  onClosePresentation,
  showSubToolbar = false,
  invertColors = false,
  isOutOfSync = false,
  onRecompile,
}: {
  url: string;
  zoom: number | 'page-width';
  setZoom: (z: number | 'page-width' | ((prev: number | 'page-width') => number | 'page-width')) => void;
  onSync?: (page: number, ratio: number) => void;
  onReverseSync?: (page: number, ratio: number) => void;
  highlightTarget?: PDFHighlightTarget | null;
  highlightPage?: number;
  jumpToPage?: number;
  onTotalPagesChange?: (total: number) => void;
  onActivePageChange?: (page: number) => void;
  isPresentation?: boolean;
  onClosePresentation?: () => void;
  showSubToolbar?: boolean;
  invertColors?: boolean;
  isOutOfSync?: boolean;
  onRecompile?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [exportingImage, setExportingImage] = useState(false);

  // ResizeObserver with threshold & debounce to prevent resize loops
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const rawWidth = entries[0].contentRect.width - (isPresentation ? 64 : 32);
      const newWidth = Math.max(200, Math.floor(rawWidth));

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setContainerWidth((prev) => {
          if (Math.abs(prev - newWidth) > 2) {
            return newWidth;
          }
          return prev;
        });
      }, 100);
    });

    if (host.current) observer.observe(host.current);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isPresentation]);

  // Scroll to forward sync target position
  useEffect(() => {
    if (!highlightTarget) return;
    const targetPage = Math.max(1, Math.min(highlightTarget.page, numPages || 1));
    const targetY = highlightTarget.yRatio;

    const performScroll = () => {
      const pageEl = document.getElementById(`pdf-page-${targetPage}`);
      const hostEl = host.current;
      if (pageEl && hostEl) {
        const hostRect = hostEl.getBoundingClientRect();
        const pageRect = pageEl.getBoundingClientRect();
        const pageTopRelativeToHost = hostEl.scrollTop + (pageRect.top - hostRect.top);
        const targetOffsetInPage = pageRect.height * Math.max(0.04, Math.min(0.96, targetY));
        const scrollToY = Math.max(0, pageTopRelativeToHost + targetOffsetInPage - hostEl.clientHeight / 2);

        hostEl.scrollTo({ top: scrollToY, behavior: 'smooth' });
        setActivePage(targetPage);
        onActivePageChange?.(targetPage);
      }
    };

    performScroll();
    const t1 = setTimeout(performScroll, 50);
    const t2 = setTimeout(performScroll, 180);
    const t3 = setTimeout(performScroll, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [highlightTarget, highlightPage, numPages, onActivePageChange]);

  // Jump to specific page requested by horizontal page navigator
  useEffect(() => {
    if (jumpToPage && jumpToPage <= numPages && jumpToPage >= 1) {
      const el = document.getElementById(`pdf-page-${jumpToPage}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActivePage(jumpToPage);
        onActivePageChange?.(jumpToPage);
      }
    }
  }, [jumpToPage, numPages, onActivePageChange]);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!isPresentation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('.cm-editor') ||
        target?.closest('.monaco-editor') ||
        target?.classList?.contains('inputarea') ||
        ['INPUT', 'TEXTAREA'].includes(target?.tagName || '')
      ) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setActivePage((p) => Math.min(numPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setActivePage((p) => Math.max(1, p - 1));
      } else if (e.key === 'Escape') {
        onClosePresentation?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentation, numPages, onClosePresentation]);

  // Export High-Res PNG (300 DPI) using pdfjs canvas
  const handleExportPNG = useCallback(async () => {
    if (!url) return;
    try {
      setExportingImage(true);
      const loadingTask = (pdfjs as any).getDocument(url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(activePage || 1);

      const targetDpi = 300;
      const defaultDpi = 72;
      const scale = targetDpi / defaultDpi; // ~4.167x
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo canvas 2D');

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      await (page.render as any)(renderContext).promise;

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `document-page-${activePage || 1}-300dpi.png`;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh PNG 300 DPI:', err);
      alert('Không thể xuất ảnh PNG. Vui lòng thử lại.');
    } finally {
      setExportingImage(false);
    }
  }, [url, activePage]);

  const computedWidth =
    zoom === 'page-width'
      ? containerWidth
      : Math.round((595.28 * (typeof zoom === 'number' ? zoom : 100)) / 100);

  // Presentation Mode View
  if (isPresentation) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-between p-4">
        {/* Presentation Header Bar */}
        <div className="w-full flex items-center justify-between px-6 py-3 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Tv className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm">Chế độ Trình chiếu Máy chiếu (Full-screen)</span>
            <span className="text-xs text-slate-400 font-mono">
              Trang {activePage} / {numPages || 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              disabled={activePage <= 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage((p) => Math.min(numPages, p + 1))}
              disabled={activePage >= numPages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportPNG}
              disabled={exportingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{exportingImage ? 'Đang xuất…' : 'Xuất PNG 300 DPI'}</span>
            </button>
            <button
              onClick={onClosePresentation}
              className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white cursor-pointer ml-2"
              title="Thoát trình chiếu (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presentation Slide View */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-auto p-4">
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<p className="text-slate-400">Đang chuẩn bị trình chiếu…</p>}
          >
            {numPages > 0 && (
              <PDFSinglePage
                number={activePage}
                width={Math.min(containerWidth * 1.1, 900)}
                onPageClick={onSync}
                onPageDoubleClick={onReverseSync}
                invertColors={invertColors}
              />
            )}
          </Document>
        </div>

        <div className="text-[11px] text-slate-500">
          Dùng phím Mũi tên Trái / Phải hoặc Space để chuyển trang · Phím Esc để thoát.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden relative">
      {/* Out of Sync Warning Ribbon */}
      {isOutOfSync && (
        <div className="w-full px-3 py-1 bg-amber-500/90 dark:bg-amber-600/90 text-slate-950 dark:text-slate-900 text-[11px] font-medium flex items-center justify-between shadow-xs shrink-0 z-20">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Mã nguồn đã thay đổi kể từ lần biên dịch trước.</span>
          </div>
          {onRecompile && (
            <button
              type="button"
              onClick={onRecompile}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-white hover:bg-slate-800 text-[10px] font-semibold transition cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Biên dịch lại</span>
            </button>
          )}
        </div>
      )}

      {/* Sub-toolbar for preview options */}
      {showSubToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 text-xs bg-slate-50/80 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-1">
            <button
              disabled={!url}
              onClick={() =>
                setZoom((z) => Math.max(25, (typeof z === 'number' ? z : 100) - 25))
              }
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1.5 text-slate-600 dark:text-slate-400">
              {typeof zoom === 'number' ? `${zoom}%` : 'Vừa rộng'}
            </span>
            <button
              disabled={!url}
              onClick={() =>
                setZoom((z) => Math.min(300, (typeof z === 'number' ? z : 100) + 25))
              }
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!url}
              onClick={() => setZoom('page-width')}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] disabled:opacity-40 cursor-pointer"
            >
              Vừa rộng
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={!url || exportingImage}
              onClick={handleExportPNG}
              title="Xuất trang đầu ra ảnh PNG 300 DPI trong suốt để dán vào PowerPoint"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>{exportingImage ? 'Đang xuất…' : 'PNG 300 DPI'}</span>
            </button>

            {numPages > 0 && (
              <span className="text-[11px] font-mono text-slate-500">
                {numPages} trang
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main PDF Scroll Container */}
      <div
        ref={host}
        className={`flex-1 min-h-0 w-full h-full p-4 flex flex-col items-center transition-colors ${
          invertColors ? 'bg-slate-900 dark:bg-[#181a1d]' : 'bg-slate-200 dark:bg-[#525659]'
        }`}
        style={{
          overflowY: 'scroll',
          overflowX: 'auto',
          overflowAnchor: 'none',
        }}
        aria-label="Tài liệu PDF đã biên dịch"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            onTotalPagesChange?.(numPages);
          }}
          loading={
            <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-200">
              Đang mở tài liệu PDF…
            </div>
          }
          error={
            <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-300">
              Không thể hiển thị PDF trực tiếp. Hãy dùng nút Tải PDF về máy.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            const isTarget = Boolean(highlightTarget && highlightTarget.page === pageNum);
            return (
              <PDFSinglePage
                key={pageNum}
                number={pageNum}
                width={computedWidth}
                onPageClick={onSync}
                onPageDoubleClick={onReverseSync}
                highlightYRatio={isTarget && highlightTarget ? highlightTarget.yRatio : undefined}
                highlightId={isTarget && highlightTarget ? highlightTarget.id : undefined}
                invertColors={invertColors}
              />
            );
          })}
        </Document>
      </div>
    </div>
  );
}
