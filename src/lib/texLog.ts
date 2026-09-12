import { resolveProjectPath } from './synctexParser';

export interface ParsedTeXIssue {
  id: string;
  type: 'error' | 'warning';
  line?: number;
  file?: string;
  message: string;
  rawSnippet?: string;
}

export function parseTeXLog(log: string, main = 'main.tex', projectFiles: string[] = []) {
  const errors: ParsedTeXIssue[] = [], warnings: ParsedTeXIssue[] = [];
  const stack: Array<string | null> = [];
  const seen = new Set<string>();
  const lines = log.split(/\r?\n/);
  const fileName = (path: string) => resolveProjectPath(path, projectFiles) || path.replace(/^\.\//, '');
  const currentFile = () => [...stack].reverse().find((f): f is string => !!f) || main;
  const add = (type: 'error' | 'warning', file: string, line: number | undefined, message: string, rawSnippet: string) => {
    const key = `${type}:${file}:${line}:${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    (type === 'error' ? errors : warnings).push({id: `issue-${seen.size}`, type, file, line, message, rawSnippet});
  };
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], text = raw.trim();
    const explicit = text.match(/^(.+?\.(?:tex|sty|cls|bib|bbl|aux)):(\d+):\s*(.*)$/i);
    if (explicit) {
      const message = explicit[3];
      add(/warning|(?:over|under)full/i.test(message) ? 'warning' : 'error', fileName(explicit[1]), Number(explicit[2]), message, raw);
      continue;
    }
    const isWarning = /(?:LaTeX|Package\s+\S+|Class\s+\S+|pdfTeX)\s+Warning:|(?:Over|Under)full\s+\\[hv]box/.test(text);
    const isError = /^!|^(?:LaTeX|Package\s+\S+) Error:|Emergency stop|Fatal error/.test(text);
    if (isWarning || isError) {
      let message = text.replace(/^!\s*/, '');
      let line = text.match(/(?:input line|at lines?|in paragraph at lines?)\s+(\d+)/i)?.[1];
      const snippet = [raw];
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const next = lines[j];
        if (/^!|^\S+\.(?:tex|sty|cls):\d+:/.test(next)) break;
        const location = next.match(/^\s*l\.(\d+)\s/);
        if (location) { line = location[1]; snippet.push(next); break; }
        // Package warnings often wrap their location onto an indented continuation.
        if (isWarning && (/^\s+\S/.test(next) || /^\([\w.-]+\)\s+/.test(next))) {
          message += ' ' + next.trim();
          snippet.push(next);
          line ||= next.match(/input line\s+(\d+)/i)?.[1];
          i = j;
        } else if (isWarning) break;
      }
      add(isWarning ? 'warning' : 'error', currentFile(), line ? Number(line) : undefined, message, snippet.join('\n'));
      continue;
    }
    // TeX logs express nested input files using parentheses. Track other parentheses too.
    const tokens = raw.matchAll(/\((?:"([^"]+\.(?:tex|sty|cls|bib|bbl|aux))"|([^()\s]+\.(?:tex|sty|cls|bib|bbl|aux)))?|\)/g);
    for (const token of tokens) {
      if (token[0] === ')') stack.pop();
      else stack.push(token[1] || token[2] ? fileName(token[1] || token[2]) : null);
    }
  }
  return {errors, warnings};
}
