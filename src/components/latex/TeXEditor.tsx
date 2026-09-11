'use client';
import { useEffect, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/context/ThemeContext';
import type { ParsedTeXIssue } from '@/components/latex/ErrorConsole';

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
  onMount: onMountProp,
}: {
  source: string;
  onChange: (s: string) => void;
  fontSize: number;
  onCompile: () => void;
  insertRequest?: { id: number; text: string };
  editorActionRequest?: { id: number; action: string };
  onCursorLine?: (line: number) => void;
  targetLine?: number;
  errors?: ParsedTeXIssue[];
  onMount?: (editor: Parameters<OnMount>[0]) => void;
}) {
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const { resolvedTheme } = useTheme();
  const [editorRef, setEditorRef] = useState<Parameters<OnMount>[0] | null>(null);
  const [monacoRef, setMonacoRef] = useState<any>(null);
  const [decorations, setDecorations] = useState<string[]>([]);

  // Fallback timer if Monaco CDN is blocked
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setFallback(true), 10000);
    return () => clearTimeout(timer);
  }, [ready]);

  // Update Monaco Error Squiggles / Markers and Gutter Bullets
  useEffect(() => {
    if (!editorRef || !monacoRef) return;
    const model = editorRef.getModel();
    if (!model) return;

    if (!errors || errors.length === 0) {
      monacoRef.editor.setModelMarkers(model, 'tex-errors', []);
      setDecorations((prev) => editorRef.deltaDecorations(prev, []));
      return;
    }

    const markers = errors
      .filter((err) => err.line && err.line > 0)
      .map((err) => {
        const lineContent = model.getLineContent(err.line!) || '';
        return {
          startLineNumber: err.line!,
          startColumn: 1,
          endLineNumber: err.line!,
          endColumn: Math.max(1, lineContent.length + 1),
          message: err.message,
          severity:
            err.type === 'error'
              ? monacoRef.MarkerSeverity.Error
              : monacoRef.MarkerSeverity.Warning,
        };
      });

    monacoRef.editor.setModelMarkers(model, 'tex-errors', markers);

    // Overleaf-style crisp red error bullet in the left gutter beside line numbers
    const newDecs = errors
      .filter((err) => err.line && err.line > 0 && err.type === 'error')
      .map((err) => ({
        range: new monacoRef.Range(err.line!, 1, err.line!, 1),
        options: {
          isWholeLine: true,
          className: 'latex-error-line',
          glyphMarginClassName: 'latex-error-glyph',
          glyphMarginHoverMessage: { value: `Lỗi biên dịch LaTeX: ${err.message}` },
        },
      }));

    setDecorations((prev) => editorRef.deltaDecorations(prev, newDecs));
  }, [editorRef, monacoRef, errors]);

  // Handle ribbon actions (Undo, Redo, Find, Bold, Italic, Link, Table)
  useEffect(() => {
    if (!editorRef || !editorActionRequest) return;
    const { action } = editorActionRequest;
    const sel = editorRef.getSelection();
    const model = editorRef.getModel();

    if (action === 'undo') {
      editorRef.trigger('ribbon', 'undo', null);
    } else if (action === 'redo') {
      editorRef.trigger('ribbon', 'redo', null);
    } else if (action === 'find') {
      editorRef.getAction('actions.find')?.run();
    } else if (action === 'bold') {
      if (sel && model) {
        const text = model.getValueInRange(sel);
        const replacement = text ? `\\textbf{${text}}` : `\\textbf{}`;
        editorRef.executeEdits('ribbon-bold', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
      }
    } else if (action === 'italic') {
      if (sel && model) {
        const text = model.getValueInRange(sel);
        const replacement = text ? `\\textit{${text}}` : `\\textit{}`;
        editorRef.executeEdits('ribbon-italic', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
      }
    } else if (action === 'link') {
      if (sel && model) {
        const text = model.getValueInRange(sel);
        const replacement = `\\href{https://example.com}{${text || 'liên kết'}}`;
        editorRef.executeEdits('ribbon-link', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
      }
    } else if (action === 'table') {
      if (sel) {
        const tableSnippet = `\\begin{table}[h!]\n\\centering\n\\begin{tabular}{|c|c|c|}\n\\hline\nCột 1 & Cột 2 & Cột 3 \\\\\n\\hline\nA & B & C \\\\\nD & E & F \\\\\n\\hline\n\\end{tabular}\n\\caption{Bảng mẫu}\n\\end{table}\n`;
        editorRef.executeEdits('ribbon-table', [{ range: sel, text: tableSnippet, forceMoveMarkers: true }]);
      }
    } else if (action === 'code') {
      if (sel && model) {
        const text = model.getValueInRange(sel);
        const replacement = text ? `\\texttt{${text}}` : `\\texttt{}`;
        editorRef.executeEdits('ribbon-code', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
      }
    } else if (action === 'quote') {
      if (sel && model) {
        const text = model.getValueInRange(sel);
        const replacement = text ? `\\begin{quote}\n  ${text}\n\\end{quote}` : `\\begin{quote}\n  \n\\end{quote}`;
        editorRef.executeEdits('ribbon-quote', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
      }
    } else if (action === 'select-all') {
      editorRef.getAction('editor.action.selectAll')?.run();
    }
    editorRef.focus();
  }, [editorRef, editorActionRequest]);

  // Insert text at cursor position (from ribbon or tools) with smart cursor placement
  useEffect(() => {
    if (!editorRef || !insertRequest) return;
    const selection = editorRef.getSelection();
    if (!selection) return;

    const snippetController = (editorRef as any).getContribution?.(
      'snippetController2'
    );

    if (
      snippetController &&
      typeof snippetController.insert === 'function' &&
      /\$\{\d+(?::[^\}]*)?\}|\$\d+/.test(insertRequest.text)
    ) {
      snippetController.insert(insertRequest.text);
    } else {
      const cleanText = insertRequest.text.replace(/\$\{\d+:?([^\}]*)\}|\$\d+/g, '$1');
      editorRef.executeEdits('math-tools', [
        { range: selection, text: cleanText, forceMoveMarkers: true },
      ]);

      // Jump cursor into first bracket/brace
      const firstBracketIdx = cleanText.search(/[\{\[\(]/);
      if (firstBracketIdx !== -1) {
        const linesBefore = cleanText.substring(0, firstBracketIdx).split('\n');
        const targetLine = selection.startLineNumber + linesBefore.length - 1;
        const targetCol =
          linesBefore.length === 1
            ? selection.startColumn + firstBracketIdx + 1
            : linesBefore[linesBefore.length - 1].length + 1;
        editorRef.setPosition({ lineNumber: targetLine, column: targetCol });
      }
    }
    editorRef.focus();
  }, [editorRef, insertRequest]);

  // SyncTeX: Scroll to target line when clicked on PDF
  useEffect(() => {
    if (!editorRef || !targetLine) return;
    editorRef.revealLineInCenter(targetLine);
    editorRef.setPosition({ lineNumber: targetLine, column: 1 });
    editorRef.focus();
  }, [editorRef, targetLine]);

  const mount: OnMount = (editor, monaco) => {
    setReady(true);
    setEditorRef(editor);
    setMonacoRef(monaco);
    onMountProp?.(editor);

    editor.onDidChangeCursorPosition((event) => {
      onCursorLine?.(event.position.lineNumber);
    });

    editor.addAction({
      id: 'compile-pdf',
      label: 'Biên dịch PDF',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: onCompile,
    });

    editor.addAction({
      id: 'format-bold',
      label: 'Chữ đậm (\\textbf)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
      run: (ed) => {
        const sel = ed.getSelection();
        const model = ed.getModel();
        if (sel && model) {
          const text = model.getValueInRange(sel);
          const replacement = text ? `\\textbf{${text}}` : `\\textbf{}`;
          ed.executeEdits('shortcut-bold', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
        }
      },
    });

    editor.addAction({
      id: 'format-italic',
      label: 'Chữ nghiêng (\\textit)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
      run: (ed) => {
        const sel = ed.getSelection();
        const model = ed.getModel();
        if (sel && model) {
          const text = model.getValueInRange(sel);
          const replacement = text ? `\\textit{${text}}` : `\\textit{}`;
          ed.executeEdits('shortcut-italic', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
        }
      },
    });

    editor.addAction({
      id: 'insert-inline-math',
      label: 'Chèn công thức toán (\\( ... \\))',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM],
      run: (ed) => {
        const sel = ed.getSelection();
        const model = ed.getModel();
        if (sel && model) {
          const text = model.getValueInRange(sel);
          const replacement = text ? `\\( ${text} \\)` : `\\(  \\)`;
          ed.executeEdits('shortcut-math', [{ range: sel, text: replacement, forceMoveMarkers: true }]);
          if (!text) {
            ed.setPosition({
              lineNumber: sel.startLineNumber,
              column: sel.startColumn + 3,
            });
          }
        }
      },
    });

    // Smart initial cursor placement (between line 8 and 10, line 9 inside document body)
    const model = editor.getModel();
    if (model) {
      const lineCount = model.getLineCount();
      if (targetLine && targetLine <= lineCount) {
        editor.setPosition({ lineNumber: targetLine, column: 1 });
        editor.revealLineInCenter(targetLine);
        editor.focus();
      } else {
        for (let i = 1; i <= lineCount; i++) {
          const lineContent = model.getLineContent(i).trim();
          if (lineContent === '\\begin{document}') {
            const nextLine = i + 1;
            if (nextLine <= lineCount) {
              editor.setPosition({ lineNumber: nextLine, column: 1 });
              editor.revealLineInCenter(nextLine);
              editor.focus();
              break;
            }
          }
        }
      }
    }
  };

  if (fallback) {
    return (
      <div className="h-full flex flex-col p-2">
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
          Trình soạn thảo nâng cao đang tải ở chế độ tương thích nhẹ.
        </p>
        <textarea
          aria-label="Mã nguồn LaTeX"
          value={source}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 min-h-0 w-full p-3 bg-transparent font-mono border rounded-xl"
          style={{ fontSize }}
        />
      </div>
    );
  }

  return (
    <>
    <Editor
      language="latex"
      path="document.tex"
      value={source}
      onChange={(v) => onChange(v ?? '')}
      theme={resolvedTheme === 'dark' ? 'mathaio-dark' : 'light'}
      onMount={mount}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme('mathaio-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
            { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
            { token: 'string', foreground: 'f472b6' },
            { token: 'tag', foreground: 'fbbf24' },
            { token: 'delimiter.bracket', foreground: '94a3b8' },
          ],
          colors: {
            'editor.background': '#020617',
            'editor.foreground': '#cbd5e1',
            'editorLineNumber.foreground': '#475569',
            'editorLineNumber.activeForeground': '#22d3ee',
            'editor.lineHighlightBackground': '#0f172a',
            'editor.selectionBackground': '#164e6380',
          },
        });

        if (!monaco.languages.getLanguages().some((l: { id: string }) => l.id === 'latex')) {
          monaco.languages.register({ id: 'latex' });
          monaco.languages.setMonarchTokensProvider('latex', {
            tokenizer: {
              root: [
                [/%.*$/, 'comment'],
                [/\\(?:begin|end|documentclass|usepackage|geometry|setmainfont|babelprovide|babelfont)\b/, 'keyword'],
                [/\\[a-zA-Z@]+|\\./, 'tag'],
                [/\$\$?|\\[\[\]()]/, 'string'],
                [/[{}\[\]]/, 'delimiter.bracket'],
                [/[0-9]+/, 'number'],
              ],
            },
          });

          monaco.languages.setLanguageConfiguration('latex', {
            comments: { lineComment: '%' },
            brackets: [
              ['{', '}'],
              ['[', ']'],
              ['(', ')'],
            ],
            autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '$', close: '$' },
            ],
          });

          // Register rich Snippets (Tab-trigger)
          monaco.languages.registerCompletionItemProvider('latex', {
            triggerCharacters: ['\\'],
            provideCompletionItems(model: any, position: any) {
              const range = new monaco.Range(
                position.lineNumber,
                Math.max(1, position.column - 8),
                position.lineNumber,
                position.column
              );

              return {
                suggestions: [
                  {
                    label: '\\bpt',
                    insertText: '\\begin{cases}\n  ${1:2x + y = 5} \\\\\n  ${2:x - 3y = -1}\n\\end{cases}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Môi trường hệ phương trình cases',
                    range,
                  },
                  {
                    label: '\\bex',
                    insertText: '\\begin{exercise}\n  ${1:Nội dung bài tập toán học...}\n\\end{exercise}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Môi trường bài tập exercise',
                    range,
                  },
                  {
                    label: '\\frac',
                    insertText: '\\dfrac{${1:a}}{${2:b}}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Phân số dfrac',
                    range,
                  },
                  {
                    label: '\\bsol',
                    insertText: '\\begin{solution}\n  ${1:Lời giải chi tiết từng bước...}\n\\end{solution}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Môi trường lời giải solution',
                    range,
                  },
                  {
                    label: '\\bth',
                    insertText: '\\begin{theorem}[${1:Tên định lý}]\n  ${2:Nội dung định lý...}\n\\end{theorem}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Môi trường định lý theorem',
                    range,
                  },
                  {
                    label: '\\btikz',
                    insertText: '\\begin{tikzpicture}[scale=${1:0.8}]\n  \\draw[thick, blue] (${2:0,0}) -- (${3:3,0}) -- (${4:1.5,2}) -- cycle;\n\\end{tikzpicture}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Môi trường hình học tikzpicture',
                    range,
                  },
                  {
                    label: '\\bmat',
                    insertText: '\\begin{pmatrix}\n  ${1:a} & ${2:b} \\\\\n  ${3:c} & ${4:d}\n\\end{pmatrix}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Ma trận pmatrix',
                    range,
                  },
                  {
                    label: '\\balign',
                    insertText: '\\begin{align*}\n  ${1:f(x)} &= ${2:ax^2 + bx + c} \\\\\n  &= ${3:0}\n\\end{align*}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: 'Căn dòng công thức align*',
                    range,
                  },
                  {
                    label: '\\bmulti',
                    insertText: '\\begin{multicols}{4}\n\\begin{enumerate}[label=\\Alph*.]\n  \\item ${1:Phương án A}\n  \\item ${2:Phương án B}\n  \\item ${3:Phương án C}\n  \\item ${4:Phương án D}\n\\end{enumerate}\n\\end{multicols}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    documentation: '4 đáp án trắc nghiệm A-B-C-D',
                    range,
                  },
                ],
              };
            },
          });
        }
      }}
      loading={<div className="p-4 text-xs text-slate-500">Đang tải trình soạn thảo LaTeX Monaco…</div>}
      options={{
        fontSize,
        lineNumbers: 'on',
        minimap: { enabled: false },
        automaticLayout: true,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        tabSize: 2,
        ariaLabel: 'Mã nguồn LaTeX',
        glyphMargin: true,
        contextmenu: true,
        quickSuggestions: true,
        copyWithSyntaxHighlighting: true,
      }}
    />
    <style jsx global>{`
      .latex-error-glyph {
        background-color: #ef4444 !important;
        border-radius: 50% !important;
        width: 8px !important;
        height: 8px !important;
        margin-left: 6px !important;
        margin-top: 5px !important;
        box-shadow: 0 0 5px rgba(239, 68, 68, 0.8) !important;
        cursor: pointer !important;
      }
      .latex-error-line {
        background-color: rgba(239, 68, 68, 0.08) !important;
      }
    `}</style>
    </>
  );
}
