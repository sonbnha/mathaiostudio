import { create } from 'zustand';
import type { SyncTeXBox } from '@/lib/synctexParser';

export type FileNode = {
  id: string;
  name: string;
  content: string;
  isFolder?: boolean;
  parentId?: string;
};

interface LaTeXState {
  // 1. Files & Project
  files: FileNode[];
  activeFileId: string | null;
  openTabs: string[]; // List of file IDs open in tabs
  setFiles: (files: FileNode[]) => void;
  updateFileContent: (id: string, content: string) => void;
  setActiveFile: (id: string) => void;
  closeTab: (id: string) => void;

  // 2. Editor
  cursorLine: number;
  setCursorLine: (line: number) => void;
  editorMode: 'code' | 'visual';
  setEditorMode: (mode: 'code' | 'visual') => void;

  // 3. PDF Viewer & SyncTeX
  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;
  syncTeXData: any | null; // Parsed synctex data
  setSyncTeXData: (data: any) => void;
  
  zoomLevel: number | 'fit-width' | 'fit-page';
  setZoomLevel: (zoom: number | 'fit-width' | 'fit-page') => void;
  
  pdfTargetLine: number | null; // When clicking code, tell PDF to jump
  setPdfTargetLine: (line: number | null) => void;
  
  editorTargetLine: number | null; // When clicking PDF, tell Code to jump
  setEditorTargetLine: (line: number | null) => void;

  // 4. Compile Status
  isCompiling: boolean;
  setIsCompiling: (compiling: boolean) => void;
  autoCompile: boolean;
  setAutoCompile: (auto: boolean) => void;
  logs: any[];
  setLogs: (logs: any[]) => void;
}

export const useLaTeXStore = create<LaTeXState>((set) => ({
  files: [{ id: '1', name: 'main.tex', content: '\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}' }],
  activeFileId: '1',
  openTabs: ['1'],
  setFiles: (files) => set({ files }),
  updateFileContent: (id, content) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, content } : f)
  })),
  setActiveFile: (id) => set((state) => ({
    activeFileId: id,
    openTabs: state.openTabs.includes(id) ? state.openTabs : [...state.openTabs, id]
  })),
  closeTab: (id) => set((state) => {
    const newTabs = state.openTabs.filter(t => t !== id);
    return {
      openTabs: newTabs,
      activeFileId: state.activeFileId === id ? (newTabs[0] || null) : state.activeFileId
    };
  }),

  cursorLine: 1,
  setCursorLine: (line) => set({ cursorLine: line }),
  editorMode: 'code',
  setEditorMode: (mode) => set({ editorMode: mode }),

  pdfUrl: null,
  setPdfUrl: (url) => set({ pdfUrl: url }),
  syncTeXData: null,
  setSyncTeXData: (data) => set({ syncTeXData: data }),
  
  zoomLevel: 'fit-width',
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  
  pdfTargetLine: null,
  setPdfTargetLine: (line) => set({ pdfTargetLine: line }),
  
  editorTargetLine: null,
  setEditorTargetLine: (line) => set({ editorTargetLine: line }),

  isCompiling: false,
  setIsCompiling: (isCompiling) => set({ isCompiling }),
  autoCompile: true,
  setAutoCompile: (autoCompile) => set({ autoCompile }),
  logs: [],
  setLogs: (logs) => set({ logs }),
}));
