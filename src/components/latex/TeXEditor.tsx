'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  Decoration,
  type DecorationSet,
  ViewUpdate,
} from '@codemirror/view';
import {
  EditorState,
  StateField,
  StateEffect,
  Compartment,
} from '@codemirror/state';
import {
  defaultKeymap,
  historyKeymap,
  history,
  indentWithTab,
  undo,
  redo,
  selectAll,
} from '@codemirror/commands';
import { searchKeymap, openSearchPanel } from '@codemirror/search';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  StreamLanguage,
  foldGutter,
  codeFolding,
  foldKeymap,
  foldService,
} from '@codemirror/language';
import { linter, type Diagnostic } from '@codemirror/lint';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  snippet,
  closeBrackets,
} from '@codemirror/autocomplete';
import { vim } from '@replit/codemirror-vim';
import { useTheme } from '@/context/ThemeContext';
import type { ParsedTeXIssue } from '@/components/latex/ErrorConsole';
import type { ProjectSettings } from '@/components/latex/projectSettings';
import { getEditorThemeExtension } from '@/components/latex/editorThemes';
import type { StudioFile, StudioImage } from '@/components/latex/StudioTools';
import { createLatexCompletionSource } from '@/components/latex/latexCompletions';

export interface TeXEditorProps {
  source: string;
  onChange: (s: string) => void;
  fontSize: number;
  onCompile: () => void;
  insertRequest?: { id: number; text: string };
  editorActionRequest?: { id: number; action: string };
  onCursorLine?: (line: number, explicit?: boolean) => void;
  targetLine?: number;
  errors?: ParsedTeXIssue[];
  onMount?: (view: EditorView) => void;
  settings?: ProjectSettings;
  readOnly?: boolean;
  projectFiles?: StudioFile[];
  projectImages?: StudioImage[];
}

export const insertTextAtCursor = (
  view: EditorView,
  text: string,
  cursorOffset?: number
) => {
  const range = view.state.selection.main;
  let insert = text;
  let offset = cursorOffset;
  const match = /\$\{(\d+)(?::([^}]*))?\}|\$(\d+)/.exec(text);
  if (match) {
    const clean = text.replace(/\$\{\d+(?::([^}]*))?\}|\$\d+/g, '$1');
    insert = clean;
    if (offset === undefined) {
      offset = match.index;
    }
  }

  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor: range.from + (offset !== undefined ? offset : insert.length) },
    scrollIntoView: true,
  });
  view.focus();
};

const latexSnippets = [
  {
    label: '\\bpt',
    detail: 'Hệ phương trình cases',
    type: 'snippet',
    apply: snippet('\\begin{cases}\n  ${2x + y = 5} \\\\\n  ${x - 3y = -1}\n\\end{cases}'),
  },
  {
    label: '\\bex',
    detail: 'Môi trường bài tập exercise',
    type: 'snippet',
    apply: snippet('\\begin{exercise}\n  ${Nội dung bài tập toán học...}\n\\end{exercise}'),
  },
  {
    label: '\\frac',
    detail: 'Phân số dfrac',
    type: 'snippet',
    apply: snippet('\\dfrac{${a}}{${b}}'),
  },
  {
    label: '\\bsol',
    detail: 'Môi trường lời giải solution',
    type: 'snippet',
    apply: snippet('\\begin{solution}\n  ${Lời giải chi tiết từng bước...}\n\\end{solution}'),
  },
  {
    label: '\\bth',
    detail: 'Môi trường định lý theorem',
    type: 'snippet',
    apply: snippet('\\begin{theorem}[${Tên định lý}]\n  ${Nội dung định lý...}\n\\end{theorem}'),
  },
  {
    label: '\\btikz',
    detail: 'Môi trường hình học tikzpicture',
    type: 'snippet',
    apply: snippet(
      '\\begin{tikzpicture}[scale=${0.8}]\n  \\draw[thick, blue] (${0,0}) -- (${3,0}) -- (${1.5,2}) -- cycle;\n\\end{tikzpicture}'
    ),
  },
  {
    label: '\\bmat',
    detail: 'Ma trận pmatrix',
    type: 'snippet',
    apply: snippet('\\begin{pmatrix}\n  ${a} & ${b} \\\\\n  ${c} & ${d}\n\\end{pmatrix}'),
  },
  {
    label: '\\balign',
    detail: 'Căn dòng công thức align*',
    type: 'snippet',
    apply: snippet('\\begin{align*}\n  ${f(x)} &= ${ax^2 + bx + c} \\\\\n  &= ${0}\n\\end{align*}'),
  },
  {
    label: '\\bmulti',
    detail: '4 đáp án trắc nghiệm A-B-C-D',
    type: 'snippet',
    apply: snippet(
      '\\begin{multicols}{4}\n\\begin{enumerate}[label=\\Alph*.]\n  \\item ${Phương án A}\n  \\item ${Phương án B}\n  \\item ${Phương án C}\n  \\item ${Phương án D}\n\\end{enumerate}\n\\end{multicols}'
    ),
  },
];

export const latexFoldService = foldService.of((state, lineStart, lineEnd) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;

  // Fold \begin{env} ... \end{env}
  const beginMatch = text.match(/\\begin\{([^}]+)\}/);
  if (beginMatch) {
    const env = beginMatch[1];
    const endTag = `\\end{${env}}`;
    for (let l = line.number + 1; l <= state.doc.lines; l++) {
      const nextLine = state.doc.line(l);
      if (nextLine.text.includes(endTag)) {
        return { from: line.to, to: nextLine.to };
      }
    }
  }

  // Fold \section{...} to next \section, \chapter, or end
  const secMatch = text.match(/\\(section|chapter|part)\*?\{/);
  if (secMatch) {
    for (let l = line.number + 1; l <= state.doc.lines; l++) {
      const nextLine = state.doc.line(l);
      if (/\\(section|chapter|part)\*?\{/.test(nextLine.text)) {
        return { from: line.to, to: state.doc.line(l - 1).to };
      }
    }
    return { from: line.to, to: state.doc.length };
  }

  return null;
});

export const latexLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const doc = view.state.doc;
  const text = doc.toString();

  // 1. Check brace matching
  const stack: { char: string; pos: number }[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') {
      i++; // skip escaped char
      continue;
    }
    if (c === '{') {
      stack.push({ char: '{', pos: i });
    } else if (c === '}') {
      if (stack.length === 0) {
        diagnostics.push({
          from: i,
          to: i + 1,
          severity: 'error',
          message: 'Dấu ngoặc nhọn đóng "}" thừa không có ngoặc mở tương ứng',
        });
      } else {
        stack.pop();
      }
    }
  }
  for (const unclosed of stack) {
    diagnostics.push({
      from: unclosed.pos,
      to: unclosed.pos + 1,
      severity: 'warning',
      message: 'Dấu ngoặc nhọn mở "{" chưa được đóng',
    });
  }

  // 2. Check \begin{env} without \end{env}
  const envStack: { env: string; pos: number; line: number }[] = [];
  const envRegex = /\\(begin|end)\{([^}]+)\}/g;
  let m;
  while ((m = envRegex.exec(text)) !== null) {
    const type = m[1];
    const env = m[2];
    const pos = m.index;
    const lineNum = doc.lineAt(pos).number;

    if (type === 'begin') {
      envStack.push({ env, pos, line: lineNum });
    } else {
      const last = envStack.pop();
      if (!last) {
        diagnostics.push({
          from: pos,
          to: pos + m[0].length,
          severity: 'error',
          message: `Thừa thẻ đóng \\end{${env}} không có \\begin tương ứng`,
        });
      } else if (last.env !== env) {
        diagnostics.push({
          from: pos,
          to: pos + m[0].length,
          severity: 'error',
          message: `Sai cặp môi trường: \\begin{${last.env}} (dòng ${last.line}) đóng bằng \\end{${env}}`,
        });
      }
    }
  }

  for (const unclosed of envStack) {
    diagnostics.push({
      from: unclosed.pos,
      to: unclosed.pos + `\\begin{${unclosed.env}}`.length,
      severity: 'warning',
      message: `Môi trường \\begin{${unclosed.env}} chưa có \\end{${unclosed.env}} tương ứng`,
    });
  }

  return diagnostics;
});

const setErrorEffect = StateEffect.define<ParsedTeXIssue[]>();

const errorField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const e of tr.effects) {
      if (e.is(setErrorEffect)) {
        const issues = e.value;
        const decos: any[] = [];
        for (const err of issues) {
          if (err.line && err.line > 0 && err.line <= tr.state.doc.lines && err.type === 'error') {
            const line = tr.state.doc.line(err.line);
            decos.push(
              Decoration.line({
                class: 'cm-latex-error-line',
                attributes: { title: err.message },
              }).range(line.from)
            );
          }
        }
        decos.sort((a, b) => a.from - b.from);
        return Decoration.set(decos);
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});



export default function TeXEditor({
  source,
  onChange,
  fontSize,
  onCompile,
  insertRequest,
  editorActionRequest,
  onCursorLine,
  targetLine,
  errors,
  onMount,
  settings,
  readOnly = false,
  projectFiles = [],
  projectImages = [],
}: TeXEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();

  const projectFilesRef = useRef(projectFiles);
  projectFilesRef.current = projectFiles;
  const projectImagesRef = useRef(projectImages);
  projectImagesRef.current = projectImages;

  const latexCompletion = useMemo(
    () =>
      createLatexCompletionSource(
        () => projectFilesRef.current,
        () => projectImagesRef.current
      ),
    []
  );

  const fontSizeCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const bracketsCompartment = useRef(new Compartment());
  const autocompleteCompartment = useRef(new Compartment());
  const vimCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());

  // Ref callbacks to avoid stale closures in CodeMirror extensions
  const onCompileRef = useRef(onCompile);
  onCompileRef.current = onCompile;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCursorLineRef = useRef(onCursorLine);
  onCursorLineRef.current = onCursorLine;

  // Initialize CodeMirror 6 EditorView
  useEffect(() => {
    if (!containerRef.current) return;

    const customKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onCompileRef.current();
          return true;
        },
      },
      {
        key: 'Mod-b',
        run: (view) => {
          const range = view.state.selection.main;
          const text = view.state.sliceDoc(range.from, range.to);
          const replacement = text ? `\\textbf{${text}}` : `\\textbf{}`;
          const cursorOffset = text ? replacement.length : 8;
          view.dispatch({
            changes: { from: range.from, to: range.to, insert: replacement },
            selection: { anchor: range.from + cursorOffset },
            scrollIntoView: true,
          });
          return true;
        },
      },
      {
        key: 'Mod-i',
        run: (view) => {
          const range = view.state.selection.main;
          const text = view.state.sliceDoc(range.from, range.to);
          const replacement = text ? `\\textit{${text}}` : `\\textit{}`;
          const cursorOffset = text ? replacement.length : 8;
          view.dispatch({
            changes: { from: range.from, to: range.to, insert: replacement },
            selection: { anchor: range.from + cursorOffset },
            scrollIntoView: true,
          });
          return true;
        },
      },
      {
        key: 'Mod-m',
        run: (view) => {
          const range = view.state.selection.main;
          const text = view.state.sliceDoc(range.from, range.to);
          const replacement = text ? `\\( ${text} \\)` : `\\(  \\)`;
          const cursorOffset = text ? replacement.length : 3;
          view.dispatch({
            changes: { from: range.from, to: range.to, insert: replacement },
            selection: { anchor: range.from + cursorOffset },
            scrollIntoView: true,
          });
          return true;
        },
      },
      {
        key: 'Mod-\\',
        run: (view) => {
          const line = view.state.doc.lineAt(view.state.selection.main.head).number;
          onCursorLineRef.current?.(line, true);
          return true;
        },
      },
      ...foldKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
    ]);

    const domEvents = EditorView.domEventHandlers({
      dblclick: (event, view) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          const line = view.state.doc.lineAt(view.state.selection.main.head).number;
          onCursorLineRef.current?.(line, true);
        }
        return false;
      },
    });

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
      if (update.selectionSet) {
        const line = update.state.doc.lineAt(update.state.selection.main.head).number;
        onCursorLineRef.current?.(line, false);
      }
    });

    const isDark = resolvedTheme === 'dark';

    const startState = EditorState.create({
      doc: source,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        codeFolding(),
        latexFoldService,
        latexLinter,
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        bracketMatching(),
        bracketsCompartment.current.of(
          settings?.autoCloseBrackets !== false ? closeBrackets() : []
        ),
        autocompleteCompartment.current.of(
          settings?.autoComplete !== false
            ? autocompletion({ override: [latexCompletion] })
            : []
        ),
        vimCompartment.current.of(
          settings?.keybindings === 'vim' ? vim() : []
        ),
        StreamLanguage.define(stex),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        customKeymap,
        domEvents,
        errorField,
        themeCompartment.current.of(
          getEditorThemeExtension(
            settings?.editorTheme,
            isDark,
            settings?.fontFamily || 'JetBrains Mono',
            settings?.nonBlinkingCursor || false,
            settings?.lineHeight || settings?.editorLineHeight || '1.5'
          )
        ),
        fontSizeCompartment.current.of(
          EditorView.theme({
            '&': { fontSize: `${fontSize}px` },
          })
        ),
        readOnlyCompartment.current.of([
          EditorView.editable.of(!readOnly),
          EditorState.readOnly.of(!!readOnly),
        ]),
        updateListener,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;
    onMount?.(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Run once on mount

  // Sync incoming source changes (e.g. file switch, template load)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (source !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: source },
      });
    }
  }, [source]);

  // Sync autoCloseBrackets
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: bracketsCompartment.current.reconfigure(
        settings?.autoCloseBrackets !== false ? closeBrackets() : []
      ),
    });
  }, [settings?.autoCloseBrackets]);

  // Sync autoComplete
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: autocompleteCompartment.current.reconfigure(
        settings?.autoComplete !== false
          ? autocompletion({ override: [latexCompletion] })
          : []
      ),
    });
  }, [settings?.autoComplete, latexCompletion]);

  // Sync Vim keybindings
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: vimCompartment.current.reconfigure(
        settings?.keybindings === 'vim' ? vim() : []
      ),
    });
  }, [settings?.keybindings]);

  // Sync font size changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: fontSizeCompartment.current.reconfigure(
        EditorView.theme({
          '&': { fontSize: `${fontSize}px` },
        })
      ),
    });
  }, [fontSize]);

  // Sync readOnly
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompartment.current.reconfigure([
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(!!readOnly),
      ]),
    });
  }, [readOnly]);

  // Sync theme changes, editorTheme, fontFamily, nonBlinkingCursor, lineHeight
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const isDark = resolvedTheme === 'dark';
    view.dispatch({
      effects: themeCompartment.current.reconfigure(
        getEditorThemeExtension(
          settings?.editorTheme,
          isDark,
          settings?.fontFamily || 'JetBrains Mono',
          settings?.nonBlinkingCursor || false,
          settings?.lineHeight || settings?.editorLineHeight || '1.5'
        )
      ),
    });
  }, [
    resolvedTheme,
    settings?.editorTheme,
    settings?.fontFamily,
    settings?.nonBlinkingCursor,
    settings?.lineHeight,
    settings?.editorLineHeight,
  ]);

  // Sync LaTeX errors squiggles / lines
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: setErrorEffect.of(errors || []),
    });
  }, [errors]);

  // Sync targetLine jump (SyncTeX from PDF)
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !targetLine) return;
    if (targetLine > 0 && targetLine <= view.state.doc.lines) {
      const line = view.state.doc.line(targetLine);
      view.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true,
      });
      view.focus();
    }
  }, [targetLine]);

  // Handle ribbon actions (Undo, Redo, Find, Bold, Italic, Link, Table, Code, Quote, SelectAll)
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !editorActionRequest) return;
    const { action } = editorActionRequest;
    const range = view.state.selection.main;
    const selectedText = view.state.sliceDoc(range.from, range.to);

    if (action === 'undo') {
      undo(view);
    } else if (action === 'redo') {
      redo(view);
    } else if (action === 'find') {
      openSearchPanel(view);
    } else if (action === 'bold') {
      const replacement = selectedText ? `\\textbf{${selectedText}}` : `\\textbf{}`;
      const cursorOffset = selectedText ? replacement.length : 8;
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: replacement },
        selection: { anchor: range.from + cursorOffset },
        scrollIntoView: true,
      });
    } else if (action === 'italic') {
      const replacement = selectedText ? `\\textit{${selectedText}}` : `\\textit{}`;
      const cursorOffset = selectedText ? replacement.length : 8;
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: replacement },
        selection: { anchor: range.from + cursorOffset },
        scrollIntoView: true,
      });
    } else if (action === 'link') {
      const replacement = `\\href{https://example.com}{${selectedText || 'liên kết'}}`;
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: replacement },
        selection: { anchor: range.from + replacement.length },
        scrollIntoView: true,
      });
    } else if (action === 'table') {
      const tableSnippet = `\n\\begin{table}[htbp]\n  \\centering\n  \\begin{tabular}{|c|c|c|}\n    \\hline\n    Cột 1 & Cột 2 & Cột 3 \\\\\n    \\hline\n    Dữ liệu 1,1 & Dữ liệu 1,2 & Dữ liệu 1,3 \\\\\n    Dữ liệu 2,1 & Dữ liệu 2,2 & Dữ liệu 2,3 \\\\\n    \\hline\n  \\end{tabular}\n  \\caption{Bảng mẫu}\n  \\label{tab:table}\n\\end{table}\n`;
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: tableSnippet },
        selection: { anchor: range.from + tableSnippet.length },
        scrollIntoView: true,
      });
    } else if (action === 'code') {
      const replacement = selectedText ? `\\texttt{${selectedText}}` : `\\texttt{}`;
      const cursorOffset = selectedText ? replacement.length : 8;
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: replacement },
        selection: { anchor: range.from + cursorOffset },
        scrollIntoView: true,
      });
    } else if (action === 'quote') {
      const replacement = selectedText
        ? `\\begin{quote}\n  ${selectedText}\n\\end{quote}`
        : `\\begin{quote}\n  \n\\end{quote}`;
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: replacement },
        selection: { anchor: range.from + (selectedText ? replacement.length : 17) },
        scrollIntoView: true,
      });
    } else if (action === 'select-all') {
      selectAll(view);
    }
    view.focus();
  }, [editorActionRequest]);

  // Handle insert requests (Symbols, Templates, Snippets)
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !insertRequest) return;
    insertTextAtCursor(view, insertRequest.text);
  }, [insertRequest]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden select-text text-left"
    />
  );
}
