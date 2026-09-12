export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  type:
    | 'part'
    | 'chapter'
    | 'section'
    | 'subsection'
    | 'subsubsection'
    | 'paragraph'
    | 'equation'
    | 'figure'
    | 'table'
    | 'theorem'
    | 'exercise'
    | 'solution'
    | 'item';
  line: number;
}

export function cleanTexText(raw: string): string {
  if (!raw) return '';
  let s = raw;
  // Unwrap nested text formatting commands
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\\(?:textbf|textit|textsl|textsc|textsf|texttt|underline|emph)\*?\{([^}]*)\}/g, '$1');
  }

  return s
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\\\\/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract content inside balanced curly braces starting after commandName
 */
function extractBalancedBraces(
  source: string,
  startIndex: number
): { content: string; endIndex: number } | null {
  const openBrace = source.indexOf('{', startIndex);
  if (openBrace === -1) return null;

  let depth = 1;
  let i = openBrace + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }

  if (depth === 0) {
    return {
      content: source.slice(openBrace + 1, i - 1),
      endIndex: i,
    };
  }
  return null;
}

export function parseTexOutline(source: string): OutlineItem[] {
  if (!source) return [];

  const items: OutlineItem[] = [];
  const lines = source.split('\n');

  // Pre-calculate line offsets for fast line number lookup from character index
  const lineOffsets: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(lineOffsets[i] + lines[i].length + 1);
  }

  const getLineNumber = (charIndex: number): number => {
    let low = 0;
    let high = lineOffsets.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lineOffsets[mid] <= charIndex) {
        if (mid === lineOffsets.length - 1 || lineOffsets[mid + 1] > charIndex) {
          return mid + 1;
        }
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return 1;
  };

  // 1. Scan for Sectioning Commands (with support for multiline titles and balanced braces)
  const secRegex = /\\(part|chapter|section|subsection|subsubsection|paragraph|title)\*?\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = secRegex.exec(source)) !== null) {
    const cmd = match[1];
    const matchIndex = match.index;
    const balanced = extractBalancedBraces(source, matchIndex);

    if (balanced) {
      const line = getLineNumber(matchIndex);
      const title = cleanTexText(balanced.content) || `Mục không tên (${cmd})`;

      let level: 1 | 2 | 3 = 1;
      let type: OutlineItem['type'] = 'section';

      if (cmd === 'part' || cmd === 'chapter') {
        level = 1;
        type = cmd as any;
      } else if (cmd === 'section' || cmd === 'title') {
        level = 1;
        type = 'section';
      } else if (cmd === 'subsection') {
        level = 2;
        type = 'subsection';
      } else if (cmd === 'subsubsection') {
        level = 3;
        type = 'subsubsection';
      } else if (cmd === 'paragraph') {
        level = 3;
        type = 'paragraph';
      }

      items.push({
        id: `outline-sec-${matchIndex}`,
        title,
        level,
        type,
        line,
      });
    }
  }

  // 2. Scan for Environments & Special blocks
  const envRegex = /\\begin\{(figure\*?|table\*?|equation\*?|align\*?|theorem|exercise|solution)\}/g;
  while ((match = envRegex.exec(source)) !== null) {
    const env = match[1].replace(/\*$/, '');
    const matchIndex = match.index;
    const line = getLineNumber(matchIndex);

    // Look for caption or label inside the environment (next 800 chars)
    const snippet = source.slice(matchIndex, matchIndex + 800);
    const captionMatch = snippet.match(/\\caption\{([^}]+)\}/);
    const labelMatch = snippet.match(/\\label\{([^}]+)\}/);

    let title = '';
    let level: 1 | 2 | 3 = 3;
    let type: OutlineItem['type'] = 'figure';

    if (env.startsWith('figure')) {
      title = captionMatch ? `Hình: ${cleanTexText(captionMatch[1])}` : 'Hình ảnh';
      type = 'figure';
    } else if (env.startsWith('table')) {
      title = captionMatch ? `Bảng: ${cleanTexText(captionMatch[1])}` : 'Bảng số liệu';
      type = 'table';
    } else if (env === 'equation' || env === 'align') {
      title = labelMatch ? `Công thức [${labelMatch[1]}]` : 'Công thức toán';
      type = 'equation';
    } else if (env === 'theorem') {
      title = 'Định lý';
      type = 'theorem';
      level = 2;
    } else if (env === 'exercise') {
      title = 'Bài tập';
      type = 'exercise';
      level = 2;
    } else if (env === 'solution') {
      title = 'Lời giải';
      type = 'solution';
      level = 3;
    }

    items.push({
      id: `outline-env-${matchIndex}`,
      title,
      level,
      type,
      line,
    });
  }

  // 3. Scan for Vietnamese question markers: \textbf{Câu 1}, Câu 1:
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i].trim();
    if (lineText.startsWith('%')) continue;
    const cauMatch =
      lineText.match(/\\textbf\{(Câu\s+\d+[^}]*)\}/i) ||
      lineText.match(/^(Câu\s+\d+[\.:]?\s*[^\\]*)/i);
    if (cauMatch) {
      const qText = cleanTexText(cauMatch[1]);
      items.push({
        id: `outline-cau-${i}`,
        title: qText.slice(0, 45) + (qText.length > 45 ? '…' : ''),
        level: 2,
        type: 'exercise',
        line: i + 1,
      });
    }
  }

  // Sort all items strictly by line number
  items.sort((a, b) => a.line - b.line);

  // Filter duplicates on same line
  const uniqueItems: OutlineItem[] = [];
  const seenLines = new Set<number>();
  for (const item of items) {
    if (!seenLines.has(item.line)) {
      seenLines.add(item.line);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}
