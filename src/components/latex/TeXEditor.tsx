'use client';
import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { EditorState, Compartment, StateEffect } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { StreamLanguage } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { linter, type Diagnostic } from '@codemirror/lint';

interface EditorProps {
  source: string;
  onChange: (value: string) => void;
  fontSize: number;
  onCompile: () => void;
  targetLine?: any;
  targetLineJump?: any;
  errors?: any[];
  readOnly?: boolean;
  settings?: any;
  insertRequest?: any;
  editorActionRequest?: any;
  onCursorLine?: (line: number) => void;
  projectFiles?: any[];
  projectImages?: any[];
  onMount?: (view: any) => void;
}

export default function TeXEditor({
  source,
  onChange,
  fontSize,
  onCompile,
  targetLine,
  targetLineJump,
  readOnly = false,
  errors = [],
  onMount,
  onCursorLine
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeConfig = useRef(new Compartment());
  const readOnlyConfig = useRef(new Compartment());

  useEffect(() => {
    if (!editorRef.current) return;

    // Command to handle Cmd+Enter / Ctrl+Enter for compile
    const compileKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onCompile();
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
        themeConfig.current.of([EditorView.theme({
          "&": { fontSize: `${fontSize}px` },
          ".cm-scroller": { fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace' }
        })]),
        readOnlyConfig.current.of(EditorState.readOnly.of(readOnly)),
        oneDark, // Default to dark theme
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
          if (update.selectionSet && onCursorLine) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head).number;
            onCursorLine(line);
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });
    viewRef.current = view;
    if (onMount) onMount(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync external prop changes
  useEffect(() => {
    if (viewRef.current && source !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: source }
      });
    }
  }, [source]);

  // Handle font size change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeConfig.current.reconfigure([EditorView.theme({
          "&": { fontSize: `${fontSize}px` },
          ".cm-scroller": { fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace' }
        })])
      });
    }
  }, [fontSize]);

  // Handle readOnly change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: readOnlyConfig.current.reconfigure(EditorState.readOnly.of(readOnly))
      });
    }
  }, [readOnly]);

  // Inverse Sync: Jump to target line when double-clicking PDF
  useEffect(() => {
    let lineToJump = typeof targetLine === "number" ? targetLine : targetLine?.line;
    if (viewRef.current && lineToJump && lineToJump > 0) {
      const view = viewRef.current;
      const doc = view.state.doc;
      if (lineToJump <= doc.lines) {
        const linePos = doc.line(lineToJump).from;
        view.dispatch({
          selection: { anchor: linePos },
          effects: EditorView.scrollIntoView(linePos, { y: 'center' })
        });
        view.focus();
      }
    }
  }, [targetLine, targetLineJump]);

  return <div ref={editorRef} className="w-full h-full overflow-hidden" />;
}
