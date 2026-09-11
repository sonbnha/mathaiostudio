'use client';

/**
 * Centralized Command & Action Registry for LaTeX Studio
 * Unifies all editor actions, templates, and execution logic between
 * Top Menu Bar and Editor Toolbar.
 */

export interface EditorExecutionContext {
  insert: (text: string) => void;
  triggerAction: (action: string) => void;
  openPopover?: (popover: 'heading' | 'math' | 'image' | 'table' | null) => void;
  toggleSymbols?: () => void;
  files?: Array<{ name: string; content: string; isBinary?: boolean; url?: string }>;
  uploadAsset?: (file: File) => void;
}

export interface EditorCommand {
  id: string;
  label: string;
  shortcut?: string;
  badge?: string;
  category: 'edit' | 'format' | 'insert' | 'view';
  execute: (ctx: EditorExecutionContext, params?: any) => void;
}

// 1. Centralized LaTeX Snippet Generators
export const LATEX_SNIPPETS = {
  bold: (text: string = '') => (text ? `\\textbf{${text}}` : `\\textbf{}`),
  italic: (text: string = '') => (text ? `\\textit{${text}}` : `\\textit{}`),
  underline: (text: string = 'văn bản') => `\\underline{${text}}`,
  codeInline: (text: string = 'code') => (text ? `\\texttt{${text}}` : `\\texttt{}`),
  mathInline: (text: string = '') => `\\( ${text} \\)`,
  mathDisplay: (text: string = '') => `\n\\[\n  ${text}\n\\]\n`,
  table: (rows: number = 3, cols: number = 3) => {
    const colAlign = Array(cols).fill('c').join('|');
    const headerRow = Array.from({ length: cols }, (_, i) => `Cột ${i + 1}`).join(' & ') + ' \\\\';
    const dataRows = Array.from({ length: Math.max(0, rows - 1) }, (_, r) =>
      Array.from({ length: cols }, (_, c) => `Dữ liệu ${r + 1},${c + 1}`).join(' & ') + ' \\\\'
    ).join('\n    ');

    return `\n\\begin{table}[htbp]
  \\centering
  \\begin{tabular}{|${colAlign}|}
    \\hline
    ${headerRow}
    \\hline
    ${dataRows ? dataRows + '\n    \\hline' : ''}
  \\end{tabular}
  \\caption{Bảng mẫu}
  \\label{tab:table}
\\end{table}\n`;
  },
  figure: (imgName: string = 'example-image') => `\n\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=0.7\\linewidth]{${imgName}}
  \\caption{Caption}
  \\label{fig:${imgName.replace(/\.[^/.]+$/, '')}}
\\end{figure}\n`,
  link: (text: string = 'liên kết', url: string = 'https://example.com') =>
    `\\href{${url}}{${text}}`,
  quote: (text: string = '') =>
    text ? `\n\\begin{quote}\n  ${text}\n\\end{quote}\n` : `\n\\begin{quote}\n  \n\\end{quote}\n`,
  listBullet: (item: string = '') => `\n\\begin{itemize}\n  \\item ${item}\n\\end{itemize}\n`,
  listNumbered: (item: string = '') => `\n\\begin{enumerate}\n  \\item ${item}\n\\end{enumerate}\n`,
  section: (title: string = 'Tiêu đề Section') => `\n\\section{${title}}\n`,
  subsection: (title: string = 'Tiêu đề Subsection') => `\n\\subsection{${title}}\n`,
  subsubsection: (title: string = 'Tiêu đề Subsubsection') => `\n\\subsubsection{${title}}\n`,
  paragraph: (title: string = 'Đoạn văn:') => `\n\\paragraph{${title}}\n`,
  cite: (key: string = 'key') => `\\cite{${key}}`,
};

// 2. Centralized Command Definitions
export const EDITOR_COMMANDS: Record<string, EditorCommand> = {
  // --- EDIT ACTIONS ---
  undo: {
    id: 'undo',
    label: 'Hoàn tác',
    shortcut: 'Ctrl+Z',
    category: 'edit',
    execute: (ctx) => ctx.triggerAction('undo'),
  },
  redo: {
    id: 'redo',
    label: 'Làm lại',
    shortcut: 'Ctrl+Y',
    category: 'edit',
    execute: (ctx) => ctx.triggerAction('redo'),
  },
  find: {
    id: 'find',
    label: 'Tìm kiếm & Thay thế',
    shortcut: 'Ctrl+F',
    category: 'edit',
    execute: (ctx) => ctx.triggerAction('find'),
  },
  selectAll: {
    id: 'selectAll',
    label: 'Chọn tất cả',
    shortcut: 'Ctrl+A',
    category: 'edit',
    execute: (ctx) => ctx.triggerAction('select-all'),
  },

  // --- FORMAT ACTIONS ---
  bold: {
    id: 'bold',
    label: 'In đậm',
    shortcut: 'Ctrl+B',
    category: 'format',
    execute: (ctx) => ctx.triggerAction('bold'),
  },
  italic: {
    id: 'italic',
    label: 'In nghiêng',
    shortcut: 'Ctrl+I',
    category: 'format',
    execute: (ctx) => ctx.triggerAction('italic'),
  },
  underline: {
    id: 'underline',
    label: 'Gạch chân',
    badge: '\\underline',
    category: 'format',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.underline()),
  },
  typewriter: {
    id: 'typewriter',
    label: 'Font máy đánh chữ',
    badge: '\\texttt',
    category: 'format',
    execute: (ctx) => ctx.triggerAction('code'),
  },
  section: {
    id: 'section',
    label: 'Mục chính (Section)',
    badge: '\\section',
    category: 'format',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.section()),
  },
  subsection: {
    id: 'subsection',
    label: 'Mục con (Subsection)',
    badge: '\\subsection',
    category: 'format',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.subsection()),
  },
  subsubsection: {
    id: 'subsubsection',
    label: 'Mục con cấp 2 (Subsubsection)',
    badge: '\\subsubsection',
    category: 'format',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.subsubsection()),
  },
  paragraph: {
    id: 'paragraph',
    label: 'Đoạn văn (Paragraph)',
    badge: '\\paragraph',
    category: 'format',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.paragraph()),
  },
  listBullet: {
    id: 'listBullet',
    label: 'Danh sách dấu chấm',
    category: 'format',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.listBullet()),
  },
  listNumbered: {
    id: 'listNumbered',
    label: 'Danh sách đánh số',
    category: 'format',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.listNumbered()),
  },

  // --- INSERT ACTIONS ---
  symbols: {
    id: 'symbols',
    label: 'Ký hiệu toán học',
    badge: 'Ω',
    category: 'insert',
    execute: (ctx) => ctx.toggleSymbols?.(),
  },
  mathInline: {
    id: 'mathInline',
    label: 'Trên dòng (Inline)',
    badge: '\\(x\\)',
    shortcut: 'Ctrl+M',
    category: 'insert',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.mathInline()),
  },
  mathDisplay: {
    id: 'mathDisplay',
    label: 'Dòng riêng (Display)',
    badge: '\\[x\\]',
    category: 'insert',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.mathDisplay()),
  },
  table: {
    id: 'table',
    label: 'Bảng biểu',
    category: 'insert',
    execute: (ctx, params?: { rows?: number; cols?: number }) => {
      const rows = params?.rows ?? 3;
      const cols = params?.cols ?? 3;
      ctx.insert(LATEX_SNIPPETS.table(rows, cols));
    },
  },
  figure: {
    id: 'figure',
    label: 'Hình ảnh',
    category: 'insert',
    execute: (ctx, params?: { imgName?: string }) => {
      ctx.insert(LATEX_SNIPPETS.figure(params?.imgName));
    },
  },
  imageUpload: {
    id: 'imageUpload',
    label: 'Tải từ máy tính',
    category: 'insert',
    execute: (ctx) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.png,.jpg,.jpeg,.svg,.pdf';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && ctx.uploadAsset) {
          ctx.uploadAsset(file);
        }
      };
      input.click();
    },
  },
  imageFromProject: {
    id: 'imageFromProject',
    label: 'Từ tệp dự án',
    category: 'insert',
    execute: (ctx) => {
      const imgFiles = (ctx.files || []).filter((f) =>
        /\.(png|jpe?g|svg|webp|pdf)$/i.test(f.name)
      );
      const imgName = imgFiles.length > 0 ? imgFiles[0].name : 'example-image.png';
      ctx.insert(LATEX_SNIPPETS.figure(imgName));
    },
  },
  imageFromUrl: {
    id: 'imageFromUrl',
    label: 'Từ URL hình ảnh',
    category: 'insert',
    execute: (ctx) => {
      const url = prompt('Nhập URL hình ảnh:');
      if (url) {
        ctx.insert(LATEX_SNIPPETS.figure(url));
      }
    },
  },
  link: {
    id: 'link',
    label: 'Liên kết',
    category: 'insert',
    execute: (ctx) => ctx.triggerAction('link'),
  },
  quote: {
    id: 'quote',
    label: 'Trích dẫn',
    category: 'insert',
    execute: (ctx) => ctx.triggerAction('quote'),
  },
  cite: {
    id: 'cite',
    label: 'Trích dẫn tài liệu (\\cite)',
    badge: '\\cite',
    category: 'insert',
    execute: (ctx) => ctx.insert(LATEX_SNIPPETS.cite()),
  },
};
