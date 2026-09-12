'use client';
import React from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useLaTeXStore } from '@/store/useLaTeXStore';
import EditorPanel from './EditorPanel';

// We will build Sidebar and PDFViewerPanel next
// import Sidebar from './Sidebar';
// import PDFViewerPanel from './PDFViewerPanel';

export default function LaTeXStudioRoot() {
  const { files, activeFileId } = useLaTeXStore();

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* 1. TOP NAVBAR */}
      <header className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-[#252526]">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-lg tracking-tight text-blue-600 dark:text-blue-400 cursor-pointer">
            Overleaf<span className="text-slate-800 dark:text-slate-200"> Clone</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <button className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">Menu</button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">File</button>
            <button className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">Edit</button>
            <button className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">Insert</button>
            <button className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">View</button>
            <button className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">Format</button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">History</button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors shadow-sm">
            Share
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 min-h-0 w-full flex">
        <PanelGroup direction="horizontal">
          
          {/* COLUMN 1: LEFT SIDEBAR */}
          <Panel defaultSize={15} minSize={10} maxSize={30} className="bg-slate-50 dark:bg-[#252526] flex flex-col">
            <div className="p-3 font-semibold text-xs tracking-wider uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>Files</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {files.map(f => (
                <div 
                  key={f.id} 
                  className={`px-4 py-1.5 text-sm cursor-pointer ${activeFileId === f.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium border-l-2 border-blue-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800 border-l-2 border-transparent text-slate-700 dark:text-slate-300'}`}
                  onClick={() => useLaTeXStore.getState().setActiveFile(f.id)}
                >
                  {f.name}
                </div>
              ))}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 transition-colors cursor-col-resize" />

          {/* COLUMN 2: EDITOR */}
          <Panel defaultSize={45} minSize={25} className="bg-white dark:bg-[#1e1e1e] flex flex-col z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(0,0,0,0.2)]">
             <EditorPanel />
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 transition-colors cursor-col-resize z-20" />

          {/* COLUMN 3: PDF VIEWER */}
          <Panel defaultSize={40} minSize={20} className="bg-slate-100 dark:bg-[#333333] flex flex-col relative">
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md font-medium text-sm shadow-md transition-colors">
                  Recompile
                </button>
             </div>
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
               [PDF Viewer Panel Coming Soon]
             </div>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}
