'use client';
import React, { useState } from 'react';
import { useLaTeXStore } from '@/store/useLaTeXStore';
import { 
  ChevronDown, Download, Maximize, FileText,
  ChevronUp, ExternalLink, Minus, Plus, CircleHalf
} from 'lucide-react';
import PDFViewerCore from './PDFViewerCore';

export default function PDFViewerPanel() {
  const { pdfUrl } = useLaTeXStore();
  const [scale, setScale] = useState(1.0);

  return (
    <div className="flex flex-col h-full bg-[#525659]">
      
      {/* PDF TOOLBAR */}
      <div className="flex items-center justify-between px-2 h-[40px] border-b border-[#3d3d3d] bg-[#2a2b2c] shrink-0 shadow-sm z-20">
        
        {/* Left Side */}
        <div className="flex items-center gap-2">
          
          {/* Recompile Button (Unified) */}
          <div className="flex items-center bg-[#128a42] hover:bg-[#107c3b] rounded cursor-pointer transition-colors shadow-sm">
            <button className="px-3 py-1.5 text-white font-semibold text-[13px]">
              Recompile
            </button>
            <div className="w-[1px] h-4 bg-[#107c3b] mx-[1px]" />
            <button className="px-2 py-1.5 text-white">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          {/* Logs */}
          <button className="relative p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors ml-1 group" title="Logs">
            <FileText className="w-[16px] h-[16px]" />
            {/* Exclamation mark inside file */}
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold mt-[1px]">!</span>
            {/* Red Badge */}
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#2a2b2c]">
              1
            </div>
          </button>
          
          <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors" title="Download PDF">
            <Download className="w-[16px] h-[16px]" />
          </button>
          
          <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors" title="Pop-out">
            <ExternalLink className="w-[16px] h-[16px]" />
          </button>
          
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1">
          <div className="w-[1px] h-5 bg-[#4d4d4d] mx-2" />
          
          <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors" title="Invert Colors">
             <CircleHalf className="w-[15px] h-[15px]" />
          </button>

          <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors ml-1">
            <ChevronUp className="w-[16px] h-[16px]" />
          </button>
          <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors">
            <ChevronDown className="w-[16px] h-[16px]" />
          </button>
          
          <span className="text-[13px] text-slate-300 mx-2 font-mono">2 / 2</span>
          
          <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors ml-1" onClick={() => setScale(s => s - 0.1)}>
            <Minus className="w-[15px] h-[15px]" />
          </button>
          <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#3d3d3d] transition-colors" onClick={() => setScale(s => s + 0.1)}>
            <Plus className="w-[15px] h-[15px]" />
          </button>
          
          <div className="flex items-center gap-1 ml-1 cursor-pointer hover:bg-[#3d3d3d] px-2 py-1.5 rounded transition-colors text-[13px] text-slate-300">
            <span>{Math.round(scale * 70)}%</span>
            <ChevronDown className="w-[14px] h-[14px]" />
          </div>
        </div>
      </div>

      {/* PDF VIEWER AREA */}
      <div className="flex-1 overflow-auto bg-[#525659] p-8 flex justify-center custom-scrollbar">
        <PDFViewerCore url={pdfUrl} scale={scale} />
      </div>

    </div>
  );
}
