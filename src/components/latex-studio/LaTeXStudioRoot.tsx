'use client';
import React, { useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useLaTeXStore } from '@/store/useLaTeXStore';
import EditorPanel from './EditorPanel';
import PDFViewerPanel from './PDFViewerPanel';
import { 
  FileText, Upload, FolderPlus, FilePlus, Settings, HelpCircle, 
  ChevronDown, Layout, History, FileUp, Search, MessageSquarePlus, Edit3, MoreVertical
} from 'lucide-react';

export default function LaTeXStudioRoot() {
  const { files, activeFileId, setActiveFile } = useLaTeXStore();
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  return (
    <div className="w-full h-screen flex flex-col bg-[#142333] text-slate-200 overflow-hidden font-sans text-[13px]">
      
      {/* 1. TOP NAVBAR (EXACT OVERLEAF MATCH) */}
      <header className="h-[40px] border-b border-[#2d2d2d] flex items-center justify-between px-3 shrink-0 bg-[#1a1a1b] z-50">
        <div className="flex items-center gap-1">
          {/* Overleaf Leaf Logo */}
          <div className="w-8 h-8 flex items-center justify-center mr-2 cursor-pointer hover:bg-[#2d2d2d] rounded">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#128a42">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          
          <div className="flex items-center text-[#b3b3b3] text-[13px] font-normal">
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">File</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Edit</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Insert</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">View</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Format</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Help</button>
            <button className="ml-2 bg-[#202e3b] text-[#6eb6ff] hover:bg-[#2a3c4d] px-3 py-1.5 rounded-full font-semibold transition-colors">
              Upgrade
            </button>
          </div>
        </div>

        {/* Center: Project Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 cursor-pointer hover:bg-[#2d2d2d] px-3 py-1 rounded">
          <span className="font-semibold text-white">MathAIO Studio Project</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          <button className="text-slate-300 hover:bg-[#2d2d2d] hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
          <button className="text-slate-300 hover:bg-[#2d2d2d] hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
            <Layout className="w-4 h-4" />
            <span>Layout</span>
          </button>
          <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 ml-1">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.5 6h-7a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5zm-3.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM13 2H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1.5v-1.5H3V3h10v1.5h1.5V3a1 1 0 0 0-1-1z"/></svg>
            Share
          </button>
        </div>
      </header>

      {/* 2. WORKSPACE AREA */}
      <div className="flex-1 min-h-0 w-full flex relative z-10">
        
        {/* LEFTMOST ICON BAR */}
        <div className="w-[40px] bg-[#1a1a1b] border-r border-[#1a1a1b] flex flex-col items-center py-2 shrink-0 z-30">
          <div className="flex flex-col gap-3 w-full items-center">
            <button className="p-1.5 text-[#128a42] bg-[#2d2d2d] rounded shadow-sm" title="Files"><FileText className="w-[18px] h-[18px]" /></button>
            <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Search"><Search className="w-[18px] h-[18px]" /></button>
            <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Review"><MessageSquarePlus className="w-[18px] h-[18px]" /></button>
          </div>
          <div className="mt-auto flex flex-col gap-3 w-full items-center mb-1">
            <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Help"><HelpCircle className="w-[18px] h-[18px]" /></button>
            <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Settings"><Settings className="w-[18px] h-[18px]" /></button>
          </div>
        </div>

        <PanelGroup orientation="horizontal">
          
          {/* COLUMN 1: SIDEBAR (FILE TREE + OUTLINE) */}
          <Panel defaultSize={15} minSize={10} className="bg-[#1a1a1b] flex flex-col z-20">
            <PanelGroup orientation="vertical">
              
              {/* FILE TREE */}
              <Panel defaultSize={60} minSize={20} className="flex flex-col">
                <div className="px-3 py-2 flex items-center justify-between group">
                  <div className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-300 hover:text-white">
                    <span className="text-[9px]">v</span>
                    <span>File tree</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded"><FilePlus className="w-[14px] h-[14px]" /></button>
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded"><FolderPlus className="w-[14px] h-[14px]" /></button>
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded"><FileUp className="w-[14px] h-[14px]" /></button>
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded"><Edit3 className="w-[14px] h-[14px]" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pb-2 custom-scrollbar">
                  {files.map(f => {
                    const isActive = activeFileId === f.id;
                    return (
                      <div 
                        key={f.id} 
                        className={`group flex items-center justify-between pl-6 pr-2 py-1.5 cursor-pointer border-l-2 ${isActive ? 'bg-[#1b3223] border-[#128a42] text-white' : 'border-transparent text-slate-400 hover:bg-[#2d2d2d] hover:text-slate-300'}`}
                        onClick={() => setActiveFile(f.id)}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-[#128a42]' : 'text-[#128a42]'}`} />
                          <span className="truncate">{f.name}</span>
                        </div>
                        {isActive && (
                          <button className="p-0.5 text-slate-300 hover:text-white hover:bg-[#294a34] rounded transition-colors opacity-100">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>

              {/* HORIZONTAL RESIZER inside Sidebar */}
              <PanelResizeHandle className="h-[5px] bg-transparent hover:bg-slate-700/20 transition-colors cursor-row-resize flex flex-col items-center justify-center relative">
                <div className="w-full h-[1px] bg-[#2d2d2d]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-[2px]">
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                  <div className="w-[2px] h-[2px] rounded-full bg-slate-500" />
                </div>
              </PanelResizeHandle>

              {/* OUTLINE */}
              <Panel defaultSize={40} minSize={10} className="flex flex-col bg-[#1a1a1b]">
                <div className="px-3 py-2 flex items-center gap-1.5 cursor-pointer font-semibold text-slate-300 hover:text-white">
                  <span className="text-[9px]">v</span>
                  <span>File outline</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center text-slate-400 text-[12px] custom-scrollbar">
                  <p>We can't find any sections or subsections in this file.</p>
                  <a href="#" className="text-blue-400 hover:underline mt-1">Find out more about the file outline</a>
                </div>
              </Panel>

            </PanelGroup>
          </Panel>

          {/* VERTICAL RESIZER 1 (Sidebar | Editor) */}
          <PanelResizeHandle className="w-[11px] bg-[#222c38] border-x border-[#171f28] hover:bg-[#2b3746] transition-colors cursor-col-resize z-30 relative shrink-0">
            {/* Upper 3-dot grip with wider spacing */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 flex flex-col gap-[5px] pointer-events-none">
              <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
              <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
              <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
            </div>

            {/* Collapse Tab (extra slender & longer, centered on splitter line) */}
            <div 
              className="absolute top-[52%] left-1/2 -translate-x-1/2 w-[9px] h-[48px] bg-[#3a4656] hover:bg-[#4a586d] rounded-[2px] flex items-center justify-center cursor-pointer text-slate-200 border border-[#232c37] shadow-sm z-40 transition-colors"
              title="Collapse file tree"
            >
              <span className="text-[9px] font-bold leading-none select-none text-slate-200">{'<'}</span>
            </div>

            {/* Lower 3-dot grip with wider spacing */}
            <div className="absolute top-[68%] left-1/2 -translate-x-1/2 flex flex-col gap-[5px] pointer-events-none">
              <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
              <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
              <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
            </div>
          </PanelResizeHandle>

          {/* COLUMN 2 & 3: EDITOR + PDF VIEWER */}
          <Panel defaultSize={85} minSize={20} className="flex flex-col">
            <PanelGroup orientation="horizontal">
              
              {/* COLUMN 2: EDITOR */}
              <Panel defaultSize={50} minSize={10} className="bg-[#142333] flex flex-col z-10 shadow-none">
                 <EditorPanel />
              </Panel>

              {/* VERTICAL RESIZER 2 (Editor | PDF) */}
              <PanelResizeHandle className="w-[11px] bg-[#222c38] border-x border-[#171f28] hover:bg-[#2b3746] transition-colors cursor-col-resize z-30 relative shrink-0">
                {/* SyncTeX Pill (Larger & pushed higher up at ~20%) */}
                <div 
                  className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[26px] h-[54px] bg-[#1a232f] hover:bg-[#243040] rounded-full flex flex-col items-center justify-center cursor-pointer border border-[#323f52] shadow-md z-40 transition-colors"
                  title="SyncTeX (Code <-> PDF)"
                >
                  <button 
                    className="w-full h-1/2 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
                    title="Jump to PDF"
                  >
                    <span className="text-[12px] font-bold leading-none select-none">→</span>
                  </button>
                  <div className="w-[16px] h-[1px] bg-[#323f52]" />
                  <button 
                    className="w-full h-1/2 flex items-center justify-center text-slate-200 hover:text-white transition-colors"
                    title="Jump to Code"
                  >
                    <span className="text-[12px] font-bold leading-none select-none">←</span>
                  </button>
                </div>

                {/* Upper 3-dot grip with wider spacing */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 flex flex-col gap-[5px] pointer-events-none">
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
                </div>

                {/* Collapse PDF Tab (extra slender & longer, centered on splitter line) */}
                <div 
                  className="absolute top-[52%] left-1/2 -translate-x-1/2 w-[9px] h-[48px] bg-[#3a4656] hover:bg-[#4a586d] rounded-[2px] flex items-center justify-center cursor-pointer text-slate-200 border border-[#232c37] shadow-sm z-40 transition-colors"
                  title="Collapse PDF viewer"
                >
                  <span className="text-[9px] font-bold leading-none select-none text-slate-200">{'>'}</span>
                </div>

                {/* Lower 3-dot grip with wider spacing */}
                <div className="absolute top-[68%] left-1/2 -translate-x-1/2 flex flex-col gap-[5px] pointer-events-none">
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
                  <div className="w-[2.5px] h-[2.5px] rounded-full bg-slate-400 opacity-80" />
                </div>
              </PanelResizeHandle>

              {/* COLUMN 3: PDF VIEWER */}
              <Panel defaultSize={50} minSize={10} className="bg-[#525659] flex flex-col relative z-10 shadow-none">
                 <PDFViewerPanel />
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}
