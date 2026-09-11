'use client';
import { useEffect, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/context/ThemeContext';

export default function TeXEditor({
  source,
  onChange,
  fontSize,
  onCompile,
  insertRequest,
  onCursorLine,
  targetLine,
}: {
  source: string;
  onChange: (s: string) => void;
  fontSize: number;
  onCompile: () => void;
  insertRequest?: { id: number; text: string };
  onCursorLine?: (line: number) => void;
  targetLine?: number;
}) {
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const { resolvedTheme } = useTheme();
  const [editorRef, setEditorRef] = useState<Parameters<OnMount>[0] | null>(null);

  // Fallback timer if Monaco CDN is blocked
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setFallback(true), 10000);
    return () => clearTimeout(timer);
  }, [ready]);

  // Insert text at cursor position (from ribbon or tools)
  useEffect(() => {
    if (!editorRef || !insertRequest) return;
    const selection = editorRef.getSelection();
    editorRef.executeEdits('math-tools', [
      { range: selection!, text: insertRequest.text, forceMoveMarkers: true },
    ]);
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

    editor.onDidChangeCursorPosition((event) => {
      onCursorLine?.(event.position.lineNumber);
    });

    editor.addAction({
      id: 'compile-pdf',
      label: 'Biên dịch PDF',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: onCompile,
    });
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
      }}
    />
  );
}
