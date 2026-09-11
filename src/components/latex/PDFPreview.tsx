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
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PDFSinglePage = memo(function PDFSinglePage({
  number,
  width,
  onPageClick,
  isHighlighted,
}: {
  number: number;
  width: number;
  onPageClick?: (page: number, ratio: number) => void;
  isHighlighted?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(841.89 / 595.28);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          setVisible(entries[0].isIntersecting);
        }
      },
      { rootMargin: '600px' }
    );
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  const pageHeight = Math.round(width * ratio);

  return (
    <div
      ref={element}
      id={`pdf-page-${number}`}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const yRatio = (e.clientY - rect.top) / Math.max(1, rect.height);
        onPageClick?.(number, yRatio);
      }}
      className={`mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.35)] bg-white rounded-xs overflow-hidden cursor-crosshair relative shrink-0 transition-shadow ${
        isHighlighted ? 'ring-4 ring-cyan-500/80' : ''
      }`}
      style={{
        width: `${width}px`,
        maxWidth: `${width}px`,
        minHeight: `${pageHeight}px`,
        aspectRatio: '1 / 1.414',
      }}
      aria-label={`Trang ${number}`}
    >
      {visible ? (
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
      ) : (
        <div
          className="w-full bg-white flex items-center justify-center text-xs text-slate-400 font-mono"
          style={{ minHeight: `${pageHeight}px` }}
        >
          Trang {number}
        </div>
      )}
      <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-mono select-none pointer-events-none">
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
  highlightPage,
  jumpToPage,
  onTotalPagesChange,
  onActivePageChange,
  isPresentation,
  onClosePresentation,
  showSubToolbar = false,
}: {
  url: string;
  zoom: number | 'page-width';
  setZoom: (z: number | 'page-width' | ((prev: number | 'page-width') => number | 'page-width')) => void;
  onSync?: (page: number, ratio: number) => void;
  highlightPage?: number;
  jumpToPage?: number;
  onTotalPagesChange?: (total: number) => void;
  onActivePageChange?: (page: number) => void;
  isPresentation?: boolean;
  onClosePresentation?: () => void;
  showSubToolbar?: boolean;
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
          // Threshold of 2px to eliminate sub-pixel / scrollbar fluctuation loops
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

  // Scroll to highlighted page when sync from code editor occurs
  useEffect(() => {
    if (highlightPage && highlightPage <= numPages) {
      const el = document.getElementById(`pdf-page-${highlightPage}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setActivePage(highlightPage);
        onActivePageChange?.(highlightPage);
      }
    }
  }, [highlightPage, numPages, onActivePageChange]);

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
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
      {/* Sub-toolbar for preview options (optional) */}
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

      {/* Main PDF Scroll Container with Fixed Vertical Scrollbar & Scroll Anchoring Disabled */}
      <div
        ref={host}
        className="flex-1 min-h-0 w-full h-full p-4 flex flex-col items-center bg-slate-200 dark:bg-[#525659]"
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
          {Array.from({ length: numPages }, (_, i) => (
            <PDFSinglePage
              key={i + 1}
              number={i + 1}
              width={computedWidth}
              onPageClick={onSync}
              isHighlighted={highlightPage === i + 1}
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
