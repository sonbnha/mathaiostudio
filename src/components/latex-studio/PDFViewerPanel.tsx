'use client';
import React from 'react';
import { useLaTeXStore } from '@/store/useLaTeXStore';
import PDFViewerCore from './PDFViewerCore';
import { ChevronDown, Download, FileWarning, ArrowUp, ArrowDown, ZoomIn, ZoomOut, Maximize, FileCode2 } from 'lucide-react';

export default function PDFViewerPanel() {
  const { isCompiling, autoCompile, setAutoCompile, pdfUrl } = useLaTeXStore();

  return (
    <div className="w-full h-full flex flex-col bg-[#525659]">
      
      {/* 1. PDF TOOLBAR */}
      <div className="h-[40px] bg-[#2a2b2c] border-b border-[#2d2d2d] flex items-center justify-between px-2 shrink-0">
        
        {/* Left: Recompile, Logs, Download */}
        <div className="flex items-center gap-3">
          
          {/* Recompile Split Button */}
          <div className="flex shadow-sm">
            <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-3 py-1 rounded-l text-[13px] font-semibold transition-colors border-r border-[#107c3b] h-[26px] flex items-center">
              {isCompiling ? 'Compiling...' : 'Recompile'}
            </button>
            <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-1.5 py-1 rounded-r flex items-center justify-center transition-colors h-[26px]">
              <ChevronDown className="w-[14px] h-[14px]" />
            </button>
          </div>

          <div className="w-px h-5 bg-[#3d3d3d]" />

          {/* Logs */}
          <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors relative" title="Logs and output files">
            <FileWarning className="w-[15px] h-[15px]" />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full border border-[#222223] -translate-y-1/2 translate-x-1/2">
              1
            </span>
          </button>
          
          {/* Download */}
          <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors" title="Download PDF">
            <Download className="w-[15px] h-[15px]" />
          </button>
        </div>

        {/* Right: Sync, Pagination, Zoom */}
        <div className="flex items-center gap-2">
          {/* Go to Code */}
          <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors" title="Go to code">
            <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M2 2h2v12H2V2zm11 3.5L9.5 2 8 3.5l2 2H5v2h5l-2 2 1.5 1.5 3.5-3.5z"/></svg>
          </button>
          
          <div className="w-px h-5 bg-[#3d3d3d] mx-1" />

          {/* Pagination */}
          <div className="flex items-center gap-1 text-[13px] text-slate-300">
            <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors">
              <ArrowUp className="w-[14px] h-[14px]" />
            </button>
            <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors">
              <ArrowDown className="w-[14px] h-[14px]" />
            </button>
            <span className="px-2">1 / 1</span>
          </div>

          <div className="w-px h-5 bg-[#3d3d3d] mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 text-slate-300">
            <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors">
              <ZoomOut className="w-[15px] h-[15px]" />
            </button>
            <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors">
              <ZoomIn className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex items-center gap-1 ml-1 cursor-pointer hover:bg-[#3d3d3d] px-2 py-1 rounded transition-colors text-[13px]">
              <span>70%</span>
              <ChevronDown className="w-[14px] h-[14px] text-slate-400" />
            </div>
            
            <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors ml-1" title="Fit to width">
              <Maximize className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. PDF CANVAS AREA */}
      <div className="flex-1 overflow-auto bg-[#525659] relative flex justify-center p-4">
        <PDFViewerCore url={pdfUrl} scale={1.0} />
      </div>

    </div>
  );
}
