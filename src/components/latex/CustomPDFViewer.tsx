'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { SyncTeXBox } from '@/lib/synctexParser';

// We can assign the worker dynamically
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface CustomPDFViewerProps {
  url: string;
  zoom: number | 'page-width';
  highlightBoxes?: SyncTeXBox[];
  onDoubleClick?: (page: number, xPt: number, yPt: number) => void;
}

export default function CustomPDFViewer({ url, zoom, highlightBoxes, onDoubleClick }: CustomPDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!url) return;
    const loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise.then((doc) => {
      setPdfDoc(doc);
    }).catch(console.error);
  }, [url]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto bg-slate-200 dark:bg-[#1a1f24] relative p-4">
      {pdfDoc && Array.from({ length: pdfDoc.numPages }).map((_, i) => (
        <PDFPage 
          key={i + 1} 
          pageNumber={i + 1} 
          pdfDoc={pdfDoc} 
          zoom={zoom} 
          highlightBoxes={highlightBoxes?.filter(b => b.page === i + 1)}
          onDoubleClick={onDoubleClick}
        />
      ))}
    </div>
  );
}

function PDFPage({ 
  pageNumber, 
  pdfDoc, 
  zoom, 
  highlightBoxes, 
  onDoubleClick 
}: { 
  pageNumber: number, 
  pdfDoc: pdfjsLib.PDFDocumentProxy, 
  zoom: number | 'page-width', 
  highlightBoxes?: SyncTeXBox[], 
  onDoubleClick?: (page: number, xPt: number, yPt: number) => void 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1.5);
  const [size, setSize] = useState({ width: 800, height: 1100 });
  const [highlightVisible, setHighlightVisible] = useState(false);

  useEffect(() => {
    if (highlightBoxes && highlightBoxes.length > 0) {
      setHighlightVisible(true);
      const t = setTimeout(() => setHighlightVisible(false), 3000);
      return () => clearTimeout(t);
    } else {
      setHighlightVisible(false);
    }
  }, [highlightBoxes]);

  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
    let isActive = true;

    pdfDoc.getPage(pageNumber).then(page => {
      if (!isActive) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const currentScale = typeof zoom === 'number' ? zoom : 1.5;
      setScale(currentScale);
      
      const viewport = page.getViewport({ scale: currentScale });
      setSize({ width: viewport.width, height: viewport.height });
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      renderTask = page.render({
        canvas: canvas,
        viewport: viewport
      });
    });

    return () => {
      isActive = false;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, pageNumber, zoom]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!onDoubleClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    onDoubleClick(pageNumber, xPx / scale, yPx / scale);
  };

  return (
    <div 
      className="relative mx-auto mb-6 bg-white shadow-xl" 
      style={{ width: size.width, height: size.height }}
      onDoubleClick={handleDoubleClick}
    >
      <canvas ref={canvasRef} className="w-full h-full cursor-text" />
      
      {/* Overleaf-Style SyncTeX Highlights */}
      {highlightVisible && highlightBoxes && highlightBoxes.map((box, i) => (
        <div
          key={i}
          className="absolute pointer-events-none transition-opacity duration-1000"
          style={{
            left: `${box.x * scale}px`,
            top: `${box.y * scale}px`,
            width: `${Math.max(box.width * scale, 5)}px`,
            height: `${Math.max(box.height * scale, 12)}px`,
            backgroundColor: 'rgba(254, 240, 138, 0.5)',
            border: '1px solid #ca8a04',
          }}
        />
      ))}
    </div>
  );
}
