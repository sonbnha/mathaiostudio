'use client';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
function PDFPage({number, width}: {number: number; width: number}) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(841.89 / 595.28);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), {rootMargin: '600px'});
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={element} className="mb-4 shadow-md bg-white" style={{width, minHeight: width * ratio}} aria-label={`Trang ${number}`}>
    {visible && <Page pageNumber={number} width={width} devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)} onLoadSuccess={page => {const view = page.getViewport({scale:1}); setRatio(view.height/view.width);}} loading={<p className="p-4 text-slate-600">Đang tải trang {number}…</p>} />}
  </div>;
}
export default function PDFPreview({url, zoom}: {url: string; zoom: number|'page-width'}) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [pages, setPages] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(200, entries[0].contentRect.width - 32)));
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const pageWidth = zoom === 'page-width' ? width : 595.28 * zoom / 100;
  return <div ref={host} className="flex-1 min-h-0 overflow-auto p-4" aria-label="Tài liệu PDF đã biên dịch">
    <Document file={url} onLoadSuccess={({numPages}) => setPages(numPages)} loading={<p role="status">Đang mở PDF…</p>}
      error={<p role="alert">Không thể hiển thị PDF. Hãy dùng nút Tải PDF về máy để mở tài liệu.</p>}>
      {Array.from({length: pages}, (_, i) => <PDFPage key={i} number={i+1} width={pageWidth} />)}
    </Document>
    {pages > 0 && <p className="text-xs text-slate-500">{pages} trang · PDF A4</p>}
  </div>;
}
