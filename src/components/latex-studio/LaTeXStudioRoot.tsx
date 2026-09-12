'use client';
import React from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useLaTeXStore } from '@/store/useLaTeXStore';
import EditorPanel from './EditorPanel';
import { 
  Menu, FileText, Upload, FolderPlus, FilePlus, Trash2, Settings, HelpCircle, 
  ChevronDown, ChevronRight, Layout, History, FileUp
} from 'lucide-react';

export default function LaTeXStudioRoot() {
  const { files, activeFileId, setActiveFile } = useLaTeXStore();

  return (
    <div className="w-full h-screen flex flex-col bg-[#1a1a1b] text-slate-200 overflow-hidden font-sans text-[13px]">
      
      {/* 1. TOP NAVBAR (EXACT OVERLEAF MATCH) */}
      <header className="h-[46px] border-b border-[#2d2d2d] flex items-center justify-between px-3 shrink-0 bg-[#1a1a1b]">
        <div className="flex items-center gap-1">
          {/* Logo Placeholder */}
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mr-2 cursor-pointer hover:bg-slate-700">
            <span className="font-bold text-white text-lg">O</span>
          </div>
          
          <div className="flex items-center text-slate-300">
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">File</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Edit</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Insert</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">View</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Format</button>
            <button className="hover:bg-[#2d2d2d] hover:text-white px-2 py-1 rounded transition-colors">Help</button>
            <button className="ml-2 bg-[#2d2d2d] text-blue-400 hover:bg-[#3d3d3d] px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wide border border-[#3d3d3d]">
              Upgrade
            </button>
          </div>
        </div>

        {/* Center: Project Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 cursor-pointer hover:bg-[#2d2d2d] px-3 py-1 rounded">
          <span className="font-semibold text-slate-200">MathAIO Studio Project</span>
          <ChevronDown className="w-[14px] h-[14px] text-slate-400" />
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          <button className="text-slate-300 hover:bg-[#2d2d2d] hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
            <History className="w-[14px] h-[14px]" />
            <span>History</span>
          </button>
          <button className="text-slate-300 hover:bg-[#2d2d2d] hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
            <Layout className="w-[14px] h-[14px]" />
            <span>Layout</span>
          </button>
          <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-4 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 ml-1">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.5 6h-7a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5zm-3.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM13 2H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1.5v-1.5H3V3h10v1.5h1.5V3a1 1 0 0 0-1-1z"/></svg>
            Share
          </button>
        </div>
      </header>

      {/* 2. WORKSPACE AREA */}
      <div className="flex-1 min-h-0 w-full flex">
        
        {/* LEFTMOST ICON BAR */}
        <div className="w-[48px] bg-[#1a1a1b] border-r border-[#2d2d2d] flex flex-col items-center py-2 shrink-0 z-20">
          <div className="flex flex-col gap-3 w-full items-center">
            <button className="p-2 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Menu"><Menu className="w-[18px] h-[18px]" /></button>
            <button className="p-2 text-white bg-[#2d2d2d] rounded" title="Files"><FileText className="w-[18px] h-[18px]" /></button>
            <button className="p-2 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Search"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M15.7 14.3l-4.2-4.2c.8-1.2 1.3-2.6 1.3-4.1 0-3.9-3.1-7-7-7s-7 3.1-7 7 3.1 7 7 7c1.5 0 2.9-.5 4.1-1.3l4.2 4.2c.2.2.5.3.7.3s.5-.1.7-.3c.4-.4.4-1 0-1.4zM2 6c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z"/></svg></button>
            <button className="p-2 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Git"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M15.7 5.3l-5-5c-.4-.4-1-.4-1.4 0l-8 8c-.4.4-.4 1 0 1.4l5 5c.4.4 1 .4 1.4 0l8-8c.4-.4.4-1 0-1.4zM7 11.6L2.4 7 7 2.4l1.6 1.6L5.8 6.8c.2.4.4.9.4 1.4 0 .5-.2 1-.4 1.4l2.8 2.8L7 11.6zm6.6-3.2L10.8 11.2l-1.6-1.6 2.8-2.8c-.2-.4-.4-.9-.4-1.4 0-.5.2-1 .4-1.4L9.2 1.2 13.6 5.6c.4.4.4 1 0 1.4z"/></svg></button>
          </div>
          <div className="mt-auto flex flex-col gap-3 w-full items-center mb-2">
            <button className="p-2 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d]" title="Settings"><Settings className="w-[18px] h-[18px]" /></button>
          </div>
        </div>

        <PanelGroup orientation="horizontal">
          
          {/* COLUMN 1: SIDEBAR (FILE TREE + OUTLINE) */}
          <Panel defaultSize={15} minSize={10} className="bg-[#222223] flex flex-col border-r border-[#2d2d2d] z-30">
            <PanelGroup orientation="vertical">
              
              {/* FILE TREE */}
              <Panel defaultSize={60} minSize={20} className="flex flex-col">
                <div className="px-3 py-2 flex items-center justify-between group">
                  <div className="flex items-center gap-1 cursor-pointer font-semibold text-slate-300">
                    <ChevronDown className="w-[14px] h-[14px]" />
                    <span>File tree</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded" title="New File"><FilePlus className="w-[14px] h-[14px]" /></button>
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded" title="New Folder"><FolderPlus className="w-[14px] h-[14px]" /></button>
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded" title="Upload"><FileUp className="w-[14px] h-[14px]" /></button>
                    <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded" title="Delete"><Trash2 className="w-[14px] h-[14px]" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pb-2">
                  {files.map(f => (
                    <div 
                      key={f.id} 
                      className={`flex items-center gap-2 pl-6 pr-3 py-1.5 cursor-pointer border-l-2 ${activeFileId === f.id ? 'bg-[#293d31] border-[#128a42] text-white' : 'border-transparent text-slate-400 hover:bg-[#2d2d2d] hover:text-slate-300'}`}
                      onClick={() => setActiveFile(f.id)}
                    >
                      <FileText className="w-[14px] h-[14px] text-slate-500" />
                      <span className="truncate">{f.name}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* HORIZONTAL RESIZER inside Sidebar */}
              <PanelResizeHandle className="h-1.5 bg-[#1a1a1b] hover:bg-[#3d3d3d] transition-colors cursor-row-resize flex items-center justify-center">
                <div className="w-6 h-[2px] bg-slate-600 rounded-full" />
              </PanelResizeHandle>

              {/* OUTLINE */}
              <Panel defaultSize={40} minSize={10} className="flex flex-col bg-[#222223]">
                <div className="px-3 py-2 flex items-center gap-1 cursor-pointer font-semibold text-slate-300">
                  <ChevronDown className="w-[14px] h-[14px]" />
                  <span>File outline</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center text-slate-400 text-[12px]">
                  <p>We can't find any sections or subsections in this file.</p>
                  <a href="#" className="text-blue-400 hover:underline mt-1">Find out more about the file outline</a>
                </div>
              </Panel>

            </PanelGroup>
          </Panel>

          {/* VERTICAL RESIZER (Sidebar | Editor) */}
          <PanelResizeHandle className="w-1.5 bg-[#1a1a1b] hover:bg-[#3d3d3d] transition-colors cursor-col-resize z-40 flex items-center justify-center relative">
            {/* Grip dots */}
            <div className="flex flex-col gap-[2px]">
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <div className="w-1 h-1 rounded-full bg-slate-600" />
            </div>
          </PanelResizeHandle>

          {/* COLUMN 2 & 3: EDITOR + PDF VIEWER */}
          <Panel defaultSize={85} minSize={20} className="flex flex-col">
            <PanelGroup orientation="horizontal">
              
              {/* COLUMN 2: EDITOR */}
              <Panel defaultSize={50} minSize={10} className="bg-[#1e1e1e] flex flex-col z-10 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                 <EditorPanel />
              </Panel>

              {/* VERTICAL RESIZER (Editor | PDF) */}
              <PanelResizeHandle className="w-1.5 bg-[#1a1a1b] hover:bg-[#3d3d3d] transition-colors cursor-col-resize z-20 flex items-center justify-center">
                <div className="flex flex-col gap-[2px]">
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                </div>
              </PanelResizeHandle>

              {/* COLUMN 3: PDF VIEWER */}
              <Panel defaultSize={50} minSize={10} className="bg-[#38393a] flex flex-col relative z-10">
                 {/* PDF Toolbar Fake for now, will build in Phase 3 */}
                 <div className="h-[40px] bg-[#222223] border-b border-[#2d2d2d] flex items-center justify-between px-3 shrink-0">
                   <div className="flex items-center">
                     <div className="flex">
                       <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-3 py-1 rounded-l text-[13px] font-semibold transition-colors border-r border-[#107c3b]">
                         Recompile
                       </button>
                       <button className="bg-[#128a42] hover:bg-[#107c3b] text-white px-1.5 py-1 rounded-r text-[13px] flex items-center justify-center transition-colors">
                         <ChevronDown className="w-[14px] h-[14px]" />
                       </button>
                     </div>
                   </div>
                   <div className="flex items-center text-slate-400 gap-3">
                     <span className="text-[12px]">PDF Viewer Panel Coming Soon</span>
                   </div>
                 </div>
                 
                 {/* Canvas container */}
                 <div className="flex-1 flex items-center justify-center bg-[#38393a]">
                    <div className="text-slate-500 text-[13px]">PDF Canvas</div>
                 </div>
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}
