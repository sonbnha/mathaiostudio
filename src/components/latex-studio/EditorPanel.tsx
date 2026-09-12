'use client';
import React, { useEffect, useRef } from 'react';
import { useLaTeXStore } from '@/store/useLaTeXStore';
import { EditorView, basicSetup } from 'codemirror';
import { Compartment, EditorState } from '@uiw/react-codemirror';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { StreamLanguage } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
import { 
  Undo2, Redo2, Bold, Italic, Type, Image as ImageIcon, Link, 
  List, ListOrdered, MoreHorizontal, Search, SquarePen, Code, 
  SquareFunction, Sigma, FileText, ChevronDown, CheckCircle
} from 'lucide-react';

const cobaltTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#142333',
    foreground: '#ffffff',
    caret: '#ffffff',
    selection: '#264f78',
    selectionMatch: '#264f78',
    lineHighlight: '#1f354c',
    gutterBackground: '#142333',
    gutterForeground: '#8599a6',
  },
  styles: [
    { tag: [t.keyword, t.name, t.deleted, t.character, t.propertyName, t.macroName, t.variableName, t.labelName, t.color, t.constant(t.name), t.standard(t.name), t.definition(t.name), t.separator, t.annotation], color: '#ff66b2' },
    { tag: [t.function(t.variableName)], color: '#ff66b2' },
    { tag: [t.number, t.changed, t.modifier, t.self, t.string, t.special(t.brace), t.content, t.literal, t.heading, t.processingInstruction, t.inserted], color: '#3ad900' },
    { tag: [t.brace, t.bracket, t.angleBracket], color: '#3ad900' },
    { tag: t.operator, color: '#ff66b2' },
    { tag: t.comment, color: '#8599a6', fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
  ],
});

export default function EditorPanel() {
  const { files, activeFileId, updateFileContent } = useLaTeXStore();
  const activeFile = files.find(f => f.id === activeFileId);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const contentCompartment = useRef(new Compartment());

  useEffect(() => {
    if (!editorContainerRef.current) return;

    if (!editorViewRef.current) {
      const state = EditorState.create({
        doc: activeFile ? activeFile.content : '',
        extensions: [
          basicSetup,
          StreamLanguage.define(stex),
          cobaltTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && activeFileId) {
              updateFileContent(activeFileId, update.state.doc.toString());
            }
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: editorContainerRef.current,
      });

      editorViewRef.current = view;
    } else {
      if (activeFile) {
        const currentDoc = editorViewRef.current.state.doc.toString();
        if (currentDoc !== activeFile.content) {
          editorViewRef.current.dispatch({
            changes: { from: 0, to: currentDoc.length, insert: activeFile.content }
          });
        }
      }
    }
  }, [activeFileId, activeFile, updateFileContent]);

  return (
    <div className="flex flex-col h-full bg-[#142333] text-slate-200">
      
      {/* TABS */}
      <div className="flex bg-[#1a1a1b] h-[40px] items-end px-2 gap-1 border-b border-[#2d2d2d] overflow-x-auto shrink-0">
        {files.map((f, i) => {
          const isActive = activeFileId === f.id;
          return (
            <div 
              key={f.id} 
              className={`flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] rounded-t cursor-pointer border-t-2 ${isActive ? 'bg-[#142333] border-[#128a42]' : 'bg-[#1a1a1b] border-transparent hover:bg-[#2d2d2d]'}`}
            >
              <FileText className="w-3.5 h-3.5 text-[#128a42]" />
              <span className={`truncate text-[13px] ${isActive ? 'text-white' : 'text-slate-400'}`}>{f.name}</span>
              {!isActive && i > 0 && (
                <button className="ml-auto p-0.5 text-slate-500 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[12px]">×</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* EDITOR TOOLBAR */}
      <div className="flex items-center justify-between px-2 h-[40px] border-b border-[#2d2d2d] bg-[#142333] shrink-0">
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors"><Undo2 className="w-[14px] h-[14px]" /></button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors"><Redo2 className="w-[14px] h-[14px]" /></button>
          
          <button className="flex items-center p-1 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors ml-2 gap-0.5">
            <span className="font-serif font-bold text-[14px]">T<span className="text-[10px]">T</span></span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors font-serif font-bold text-[14px]">B</button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors font-serif italic text-[14px]">I</button>
          
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors ml-2" title="Math"><SquareFunction className="w-[14px] h-[14px]" /></button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors font-serif text-[14px]" title="Symbols">Ω</button>
          
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors ml-2"><ImageIcon className="w-[14px] h-[14px]" /></button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors"><Link className="w-[14px] h-[14px]" /></button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors"><List className="w-[14px] h-[14px]" /></button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors"><ListOrdered className="w-[14px] h-[14px]" /></button>
          
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors"><MoreHorizontal className="w-[14px] h-[14px]" /></button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors"><Search className="w-[14px] h-[14px]" /></button>
          
          {/* Code | Visual Toggle */}
          <div className="flex items-center bg-[#2d2d2d] rounded-full p-0.5">
            <button className="flex items-center gap-1.5 bg-[#128a42] text-white px-3 py-1 rounded-full text-[12px] font-semibold transition-colors">
              Code
            </button>
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1 rounded-full text-[12px] font-semibold transition-colors">
              Visual <SquarePen className="w-3 h-3" />
            </button>
          </div>

          <button className="flex items-center p-1 text-slate-400 hover:text-white rounded hover:bg-[#2d2d2d] transition-colors ml-1 gap-0.5" title="Spellcheck">
            <CheckCircle className="w-[14px] h-[14px]" />
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* EDITOR CONTENT */}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        {!activeFileId ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Select a file to edit</p>
          </div>
        ) : (
          <div ref={editorContainerRef} className="h-full w-full [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-[13px] [&_.cm-activeLineGutter]:bg-transparent [&_.cm-activeLine]:bg-[#1a2b3c]"></div>
        )}
      </div>

    </div>
  );
}
