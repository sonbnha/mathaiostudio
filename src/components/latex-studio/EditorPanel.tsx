'use client';
import React, { useEffect, useRef } from 'react';
import { useLaTeXStore } from '@/store/useLaTeXStore';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { StreamLanguage } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { Bold, Italic, Type, Image as ImageIcon, Link2, Search, Eye, Code, X, Undo2, Redo2, Omega, List, AlignLeft, MoreHorizontal, FileText } from 'lucide-react';

export default function EditorPanel() {
  const { files, activeFileId, openTabs, setActiveFile, closeTab, updateFileContent, editorMode, setEditorMode, setCursorLine, setPdfTargetLine } = useLaTeXStore();
  
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readOnlyConfig = useRef(new Compartment());

  const activeFile = files.find(f => f.id === activeFileId);
  const source = activeFile?.content || '';

  useEffect(() => {
    if (!editorRef.current) return;

    const compileKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          return true;
        }
      },
      {
        key: 'Mod-Click',
        run: () => {
          if (viewRef.current) {
            const head = viewRef.current.state.selection.main.head;
            const line = viewRef.current.state.doc.lineAt(head).number;
            setPdfTargetLine(line);
          }
          return true;
        }
      }
    ]);

    const state = EditorState.create({
      doc: source,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        StreamLanguage.define(stex),
        keymap.of([
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap
        ]),
        compileKeymap,
        oneDark,
        readOnlyConfig.current.of(EditorState.readOnly.of(false)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && activeFileId) {
            updateFileContent(activeFileId, update.state.doc.toString());
          }
          if (update.selectionSet) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head).number;
            setCursorLine(line);
          }
        }),
        EditorView.theme({
          "&": { backgroundColor: "#1a2634" }, // Overleaf dark blue-ish background
          ".cm-content": { caretColor: "#fff" },
          ".cm-gutters": { backgroundColor: "#1a2634", color: "#4f6579", borderRight: "none" },
          ".cm-activeLine": { backgroundColor: "rgba(255, 255, 255, 0.05)" },
          ".cm-activeLineGutter": { backgroundColor: "rgba(255, 255, 255, 0.05)", color: "#a0aab5" },
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (viewRef.current && source !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: source }
      });
    }
  }, [source, activeFileId]);

  return (
    <div className="w-full h-full flex flex-col bg-[#1a2634]">
      
      {/* 1. TABS BAR */}
      <div className="h-[40px] bg-[#1a1a1b] flex items-center shrink-0 border-b border-[#2d2d2d] overflow-x-auto hide-scrollbar">
        {openTabs.map(tabId => {
          const f = files.find(x => x.id === tabId);
          if (!f) return null;
          const isActive = activeFileId === tabId;
          return (
            <div 
              key={tabId} 
              className={`flex items-center gap-2 px-3 h-full text-[13px] cursor-pointer transition-colors border-r border-[#2d2d2d] ${isActive ? 'bg-[#1a2634] text-white' : 'bg-[#1a1a1b] text-slate-400 hover:bg-[#2d2d2d]'}`} 
              onClick={() => setActiveFile(tabId)}
            >
              <FileText className={`w-[14px] h-[14px] ${isActive ? 'text-[#128a42]' : 'text-slate-500'}`} />
              <span className="truncate max-w-[150px]">{f.name}</span>
              <button 
                className={`ml-1 rounded-sm p-0.5 transition-colors ${isActive ? 'text-slate-300 hover:bg-[#3d3d3d]' : 'text-slate-500 hover:bg-[#3d3d3d] hover:text-white'}`} 
                onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
              >
                <X className="w-[14px] h-[14px]" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. RICH TEXT TOOLBAR (OVERLEAF EXACT) */}
      <div className="h-[40px] border-b border-[#2d2d2d] bg-[#222223] flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors" title="Undo"><Undo2 className="w-[15px] h-[15px]" /></button>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors" title="Redo"><Redo2 className="w-[15px] h-[15px]" /></button>
          
          <div className="w-px h-5 bg-[#3d3d3d] mx-1.5" />
          
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors font-serif font-bold" title="Bold"><Bold className="w-[15px] h-[15px]" /></button>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors font-serif italic" title="Italic"><Italic className="w-[15px] h-[15px]" /></button>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors font-serif" title="Text Size"><Type className="w-[15px] h-[15px]" /></button>
          
          <div className="w-px h-5 bg-[#3d3d3d] mx-1.5" />
          
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors" title="Insert Math"><Omega className="w-[15px] h-[15px]" /></button>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors" title="Insert Image"><ImageIcon className="w-[15px] h-[15px]" /></button>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors" title="List"><List className="w-[15px] h-[15px]" /></button>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors" title="Align"><AlignLeft className="w-[15px] h-[15px]" /></button>
          
          <button className="p-1 text-slate-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors ml-1" title="More">
            <MoreHorizontal className="w-[15px] h-[15px]" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3d3d3d] transition-colors" title="Search">
            <Search className="w-[15px] h-[15px]" />
          </button>
          
          {/* Pill Toggle */}
          <div className="flex items-center bg-[#1a1a1b] rounded-full border border-[#3d3d3d] p-0.5 mr-1">
            <button 
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-colors flex items-center gap-1 ${editorMode === 'code' ? 'bg-[#128a42] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setEditorMode('code')}
            >
              Code
            </button>
            <button 
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-colors flex items-center gap-1 ${editorMode === 'visual' ? 'bg-[#128a42] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setEditorMode('visual')}
            >
              <Eye className="w-[14px] h-[14px]" />
              Visual
            </button>
          </div>
        </div>
      </div>

      {/* 3. CODEMIRROR EDITOR CONTAINER */}
      <div className="flex-1 min-h-0 w-full relative bg-[#1a2634]">
        {!activeFile ? (
          <div className="flex items-center justify-center w-full h-full text-slate-500 text-sm">
            No file open
          </div>
        ) : (
          <div ref={editorRef} className="w-full h-full overflow-hidden absolute inset-0 [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-[13px]" />
        )}
      </div>

    </div>
  );
}
