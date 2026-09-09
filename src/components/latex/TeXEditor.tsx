'use client';
import { useEffect, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/context/ThemeContext';
export default function TeXEditor({source, onChange, fontSize, onCompile}: {source: string; onChange: (s: string) => void; fontSize: number; onCompile: () => void}) {
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  useEffect(() => { if (ready) return; const timer = setTimeout(() => setFallback(true), 12000); return () => clearTimeout(timer); }, [ready]);
  const { resolvedTheme } = useTheme();
  const mount: OnMount = (editor, monaco) => {
    setReady(true);
    editor.addAction({ id: 'compile-pdf', label: 'Biên dịch PDF', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: onCompile });
  };
  if (fallback) return <div className="h-full flex flex-col"><p className="text-xs p-2">Trình soạn thảo nâng cao chưa tải được. Bạn vẫn có thể soạn và biên dịch mã bên dưới.</p><textarea aria-label="Mã nguồn LaTeX" value={source} onChange={e => onChange(e.target.value)} spellCheck={false} className="flex-1 min-h-0 w-full p-3 bg-transparent font-mono" style={{fontSize}} /></div>;
  return <Editor language="latex" path="document.tex" value={source} onChange={v => onChange(v ?? '')}
    theme={resolvedTheme === 'dark' ? 'mathaio-dark' : 'light'} onMount={mount}
    beforeMount={monaco => {
      monaco.editor.defineTheme('mathaio-dark', {base: 'vs-dark', inherit: true, rules: [], colors: {'editor.background': '#020617', 'editor.foreground': '#cbd5e1', 'editorLineNumber.foreground': '#475569', 'editorLineNumber.activeForeground': '#22d3ee', 'editor.lineHighlightBackground': '#0f172a', 'editor.selectionBackground': '#164e6380'}});
      if (!monaco.languages.getLanguages().some((l: {id: string}) => l.id === 'latex')) {
        monaco.languages.register({id: 'latex'});
        monaco.languages.setMonarchTokensProvider('latex', { tokenizer: { root: [
          [/%.*$/, 'comment'], [/\\(?:begin|end|documentclass|usepackage)\b/, 'keyword'],
          [/\\[a-zA-Z@]+|\\./, 'tag'], [/\$\$?|\\[\[\]()]/, 'string'], [/[{}\[\]]/, 'delimiter.bracket'], [/[0-9]+/, 'number'],
        ] }});
        monaco.languages.setLanguageConfiguration('latex', {comments: {lineComment: '%'}, brackets: [['{','}'],['[',']']], autoClosingPairs: [{open:'{',close:'}'},{open:'[',close:']'}]});
      }
    }}
    loading={<p className="p-4">Đang tải trình soạn thảo…</p>}
    options={{fontSize, lineNumbers: 'on', minimap: {enabled: false}, automaticLayout: true, wordWrap: 'on', scrollBeyondLastLine: false, tabSize: 2, ariaLabel: 'Mã nguồn LaTeX'}} />;
}
