'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for worker to avoid Webpack/Next.js turbopack issues with ESM workers
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PDFViewerCoreProps {
  url: string | null;
  scale?: number;
}

export default function PDFViewerCore({ url, scale = 1.0 }: PDFViewerCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!url) {
      setPdfDoc(null);
      return;
    }

    const loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise.then((doc) => {
      setPdfDoc(doc);
    }).catch(err => {
      console.error('Error loading PDF:', err);
    });

    return () => {
      loadingTask.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any;

    pdfDoc.getPage(1).then((page) => {
      const viewport = page.getViewport({ scale: scale * 1.5 }); // 1.5 for retina sharpness
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Scale down CSS width to maintain visual size while rendering at higher resolution
      canvas.style.width = `${viewport.width / 1.5}px`;
      canvas.style.height = `${viewport.height / 1.5}px`;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      renderTask = page.render(renderContext);
    });

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, scale]);

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p className="text-[13px]">No PDF generated yet</p>
      </div>
    );
  }

  return (
    <div className="relative shadow-lg bg-white overflow-hidden">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
