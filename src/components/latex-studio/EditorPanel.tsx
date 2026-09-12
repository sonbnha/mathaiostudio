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
import { Bold, Italic, Code, Eye, Search, Undo, Redo, Image as ImageIcon, Type, Link2 } from 'lucide-react';

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
          // Trigger compile via store or event
          return true;
        }
      },
      {
        key: 'Mod-Click',
        run: () => {
          // SyncTeX Forward
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

  // Sync state -> editor when switching tabs or external changes
  useEffect(() => {
    if (viewRef.current && source !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: source }
      });
    }
  }, [source, activeFileId]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#1e1e1e]">
      
      {/* 1. TABS BAR */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#2d2d2d] flex items-center px-1 overflow-x-auto shrink-0 hide-scrollbar">
        {openTabs.map(tabId => {
          const f = files.find(x => x.id === tabId);
          if (!f) return null;
          const isActive = activeFileId === tabId;
          return (
            <div 
              key={tabId} 
              className={`flex items-center gap-2 px-3 h-full text-xs cursor-pointer border-r border-slate-200 dark:border-slate-800 transition-colors ${isActive ? 'bg-white dark:bg-[#1e1e1e] border-t-2 border-t-blue-500 text-slate-900 dark:text-slate-100 font-medium' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-[#333] border-t-2 border-t-transparent'}`} 
              onClick={() => setActiveFile(tabId)}
            >
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button 
                className="text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-sm p-0.5 transition-colors" 
                onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. RICH TEXT TOOLBAR */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#252526] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors font-serif font-bold" title="Bold (\textbf{})">
            B
          </button>
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors font-serif italic" title="Italic (\textit{})">
            I
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Insert Math ($$)">
            <Type className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Insert Image (\includegraphics)">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Insert Link (\href)">
            <Link2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Find & Replace">
            <Search className="w-4 h-4" />
          </button>
          <div className="flex items-center bg-slate-100 dark:bg-[#1e1e1e] p-0.5 rounded-md border border-slate-200 dark:border-slate-800">
            <button 
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${editorMode === 'code' ? 'bg-white dark:bg-[#2d2d2d] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
              onClick={() => setEditorMode('code')}
            >
              Code
            </button>
            <button 
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors flex items-center gap-1 ${editorMode === 'visual' ? 'bg-white dark:bg-[#2d2d2d] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
              onClick={() => setEditorMode('visual')}
            >
              <Eye className="w-3 h-3" />
              Visual
            </button>
          </div>
        </div>
      </div>

      {/* 3. CODEMIRROR EDITOR CONTAINER */}
      <div className="flex-1 min-h-0 w-full relative">
        {!activeFile ? (
          <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">
            Select a file to edit
          </div>
        ) : (
          <div ref={editorRef} className="w-full h-full overflow-hidden absolute inset-0 [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-sm" />
        )}
      </div>

    </div>
  );
}
