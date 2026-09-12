'use client';

import React from 'react';
import { X, FileText, Hash, Sigma, Image as ImageIcon, Table as TableIcon } from 'lucide-react';
import type { StudioFile } from '@/components/latex/StudioTools';

export interface LatexStats {
  words: number;
  charactersNoSpaces: number;
  charactersWithSpaces: number;
  equations: number;
  figures: number;
  tables: number;
  headers: number;
}

export function countLatexWords(content: string): LatexStats {
  if (!content) {
    return {
      words: 0,
      charactersNoSpaces: 0,
      charactersWithSpaces: 0,
      equations: 0,
      figures: 0,
      tables: 0,
      headers: 0,
    };
  }

  // 1. Remove comments (% to end of line)
  let text = content.replace(/(?<!\\)%.*$/gm, '');

  // 2. Count equations
  const inlineMathCount = (text.match(/(?<!\\)\$(?:\\.|[^$\\])+\$/g) || []).length;
  const displayMathCount = (text.match(/(?<!\\)\$\$(?:\\.|[^$\\])+\$\$/g) || []).length;
  const envMathCount = (
    text.match(/\\begin\{(?:equation|align|gather|multline|flalign|cases|displaymath)\*?\}/g) || []
  ).length;
  const bracketMathCount = (text.match(/\\\[[\s\S]*?\\\]/g) || []).length;
  const parenMathCount = (text.match(/\\\([\s\S]*?\\\)/g) || []).length;
  const totalEquations = inlineMathCount + displayMathCount + envMathCount + bracketMathCount + parenMathCount;

  // 3. Count figures and tables
  const totalFigures = (text.match(/\\begin\{figure\*?\}/g) || []).length;
  const totalTables = (text.match(/\\begin\{(?:table\*?|tabularx?|longtable)\}/g) || []).length;

  // 4. Count headers
  const totalHeaders = (
    text.match(/\\(?:part|chapter|section|subsection|subsubsection|paragraph)\*?\{/g) || []
  ).length;

  // 5. Strip math blocks
  text = text.replace(/(?<!\\)\$\$[\s\S]*?\$\$/g, ' ');
  text = text.replace(/(?<!\\)\$[\s\S]*?(\$|$)/g, ' ');
  text = text.replace(/\\\[[\s\S]*?\\\]/g, ' ');
  text = text.replace(/\\\([\s\S]*?\\\)/g, ' ');
  text = text.replace(/\\begin\{(?:equation|align|gather|multline|flalign|cases|displaymath)\*?\}[\s\S]*?\\end\{(?:equation|align|gather|multline|flalign|cases|displaymath)\*?\}/g, ' ');

  // 6. Strip preamble if \begin{document} is present
  const docStart = text.indexOf('\\begin{document}');
  if (docStart !== -1) {
    text = text.slice(docStart + 16);
  }
  const docEnd = text.indexOf('\\end{document}');
  if (docEnd !== -1) {
    text = text.slice(0, docEnd);
  }

  // 7. Strip common LaTeX commands with arguments or optional arguments
  text = text.replace(/\\(?:usepackage|documentclass|bibliographystyle|bibliography|input|include|label|ref|eqref|cite|pageref|includegraphics)(?:\[[^\]]*\])?\{[^}]*\}/g, ' ');
  
  // Unwrap formatting commands: \textbf{abc} -> abc
  text = text.replace(/\\(?:textbf|textit|textsl|textsc|textsf|texttt|underline|emph|section|subsection|subsubsection|chapter|caption)\*?\{([^}]*)\}/g, '$1');
  
  // Remove remaining commands \abc
  text = text.replace(/\\[a-zA-Z]+\*?/g, ' ');

  // Remove curly braces, brackets
  text = text.replace(/[{}[\]]/g, ' ');

  // Normalize whitespace
  const trimmed = text.trim();
  const wordsArray = trimmed.length > 0 ? trimmed.split(/\s+/).filter((w) => w.length > 0) : [];
  const words = wordsArray.length;
  const charactersWithSpaces = trimmed.length;
  const charactersNoSpaces = trimmed.replace(/\s/g, '').length;

  return {
    words,
    charactersNoSpaces,
    charactersWithSpaces,
    equations: totalEquations,
    figures: totalFigures,
    tables: totalTables,
    headers: totalHeaders,
  };
}

export function countProjectLatexWords(files: StudioFile[]): LatexStats {
  const texFiles = files.filter((f) => f.name.endsWith('.tex'));
  return texFiles.reduce<LatexStats>(
    (acc, f) => {
      const stats = countLatexWords(f.content || '');
      return {
        words: acc.words + stats.words,
        charactersNoSpaces: acc.charactersNoSpaces + stats.charactersNoSpaces,
        charactersWithSpaces: acc.charactersWithSpaces + stats.charactersWithSpaces,
        equations: acc.equations + stats.equations,
        figures: acc.figures + stats.figures,
        tables: acc.tables + stats.tables,
        headers: acc.headers + stats.headers,
      };
    },
    {
      words: 0,
      charactersNoSpaces: 0,
      charactersWithSpaces: 0,
      equations: 0,
      figures: 0,
      tables: 0,
      headers: 0,
    }
  );
}

interface WordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFileName: string;
  activeFileContent: string;
  allFiles: StudioFile[];
}

export function WordCountModal({
  isOpen,
  onClose,
  activeFileName,
  activeFileContent,
  allFiles,
}: WordCountModalProps) {
  const [scope, setScope] = React.useState<'active' | 'project'>('active');

  if (!isOpen) return null;

  const currentStats =
    scope === 'active'
      ? countLatexWords(activeFileContent)
      : countProjectLatexWords(allFiles);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Thống kê số từ (Word Count)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân tích chuẩn LaTeX (đã loại bỏ mã lệnh và môi trường)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="px-5 pt-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setScope('active')}
              className={`flex-1 py-1.5 px-3 rounded-md transition cursor-pointer ${
                scope === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tệp hiện tại ({activeFileName})
            </button>
            <button
              type="button"
              onClick={() => setScope('project')}
              className={`flex-1 py-1.5 px-3 rounded-md transition cursor-pointer ${
                scope === 'project'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Toàn bộ dự án ({allFiles.filter((f) => f.name.endsWith('.tex')).length} tệp TeX)
            </button>
          </div>
        </div>

        {/* Body Stats Grid */}
        <div className="p-5 space-y-4">
          {/* Main Word Count Hero Card */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {currentStats.words.toLocaleString('vi-VN')}
            </div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mt-1">
              Tổng số từ (Words)
            </div>
          </div>

          {/* Detailed Statistics Table */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Ký tự (không tính dấu cách)
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {currentStats.charactersNoSpaces.toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Ký tự (tính cả dấu cách)
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {currentStats.charactersWithSpaces.toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sigma className="w-3.5 h-3.5 text-cyan-500" /> Công thức toán học
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {currentStats.equations.toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Hình ảnh (Figures)
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {currentStats.figures.toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-amber-500" /> Bảng số liệu (Tables)
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {currentStats.tables.toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" /> Tiêu đề mục (Headers)
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {currentStats.headers.toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
