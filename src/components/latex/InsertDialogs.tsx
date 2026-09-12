'use client';

import React, { useState } from 'react';
import {
  X,
  Table as TableIcon,
  Image as ImageIcon,
  Sigma,
  BookOpen,
  Bookmark,
  Check,
} from 'lucide-react';

export type InsertDialogType = 'table' | 'image' | 'equation' | 'citation' | 'crossref' | null;

interface InsertDialogsProps {
  type: InsertDialogType;
  onClose: () => void;
  onInsertText: (text: string) => void;
  projectImages?: Array<{ name: string; url?: string; dataUrl?: string }>;
}

export default function InsertDialogs({
  type,
  onClose,
  onInsertText,
  projectImages = [],
}: InsertDialogsProps) {
  // Table state
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tableCaption, setTableCaption] = useState('Bảng số liệu');
  const [tableLabel, setTableLabel] = useState('tab:data');

  // Image state
  const [selectedImage, setSelectedImage] = useState(projectImages[0]?.name || 'example.png');
  const [imageWidth, setImageWidth] = useState('0.8\\linewidth');
  const [imageCaption, setImageCaption] = useState('Mô tả hình ảnh');
  const [imageLabel, setImageLabel] = useState('fig:example');

  // Equation state
  const [eqType, setEqType] = useState<'inline' | 'display' | 'equation' | 'align'>('equation');
  const [eqContent, setEqContent] = useState('f(x) = \\int_{-\\infty}^{\\infty} e^{-t^2} \\, dt');
  const [eqLabel, setEqLabel] = useState('eq:integral');

  // Citation state
  const [citationKey, setCitationKey] = useState('einstein1905');

  // Cross-reference state
  const [refType, setRefType] = useState<'ref' | 'eqref' | 'pageref'>('ref');
  const [refLabel, setRefLabel] = useState('fig:example');

  if (!type) return null;

  const handleInsert = () => {
    if (type === 'table') {
      const colSpec = '|' + ' c |'.repeat(cols);
      let body = '';
      for (let r = 1; r <= rows; r++) {
        const rowCells = Array.from({ length: cols }, (_, c) => `Ô ${r},${c + 1}`).join(' & ');
        body += `  ${rowCells} \\\\\n  \\hline\n`;
      }
      const code = `\\begin{table}[htbp]
  \\centering
  \\caption{${tableCaption}}
  \\label{${tableLabel}}
  \\begin{tabular}{${colSpec}}
  \\hline
${body}  \\end{tabular}
\\end{table}`;
      onInsertText(code);
    } else if (type === 'image') {
      const code = `\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=${imageWidth}]{${selectedImage}}
  \\caption{${imageCaption}}
  \\label{${imageLabel}}
\\end{figure}`;
      onInsertText(code);
    } else if (type === 'equation') {
      let code = '';
      if (eqType === 'inline') {
        code = `$${eqContent}$`;
      } else if (eqType === 'display') {
        code = `\\[\n  ${eqContent}\n\\]`;
      } else if (eqType === 'equation') {
        code = `\\begin{equation}\\label{${eqLabel}}\n  ${eqContent}\n\\end{equation}`;
      } else if (eqType === 'align') {
        code = `\\begin{align}\\label{${eqLabel}}\n  ${eqContent}\n\\end{align}`;
      }
      onInsertText(code);
    } else if (type === 'citation') {
      onInsertText(`\\cite{${citationKey}}`);
    } else if (type === 'crossref') {
      if (refType === 'eqref') {
        onInsertText(`\\eqref{${refLabel}}`);
      } else if (refType === 'pageref') {
        onInsertText(`\\pageref{${refLabel}}`);
      } else {
        onInsertText(`\\ref{${refLabel}}`);
      }
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-13 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            {type === 'table' && <TableIcon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />}
            {type === 'image' && <ImageIcon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />}
            {type === 'equation' && <Sigma className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />}
            {type === 'citation' && <BookOpen className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />}
            {type === 'crossref' && <Bookmark className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />}
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {type === 'table' && 'Chèn Bảng LaTeX (Table)'}
              {type === 'image' && 'Chèn Hình ảnh (Figure)'}
              {type === 'equation' && 'Chèn Công thức Toán học'}
              {type === 'citation' && 'Chèn Trích dẫn Tài liệu (\\cite)'}
              {type === 'crossref' && 'Chèn Tham chiếu chéo (\\ref)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {type === 'table' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số hàng (Rows)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số cột (Columns)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={cols}
                    onChange={(e) => setCols(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề bảng (Caption)
                </label>
                <input
                  type="text"
                  value={tableCaption}
                  onChange={(e) => setTableCaption(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nhãn tham chiếu (Label)
                </label>
                <input
                  type="text"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          {type === 'image' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn tệp ảnh
                </label>
                {projectImages.length > 0 ? (
                  <select
                    value={selectedImage}
                    onChange={(e) => setSelectedImage(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 font-mono"
                  >
                    {projectImages.map((img) => (
                      <option key={img.name} value={img.name}>
                        {img.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedImage}
                    onChange={(e) => setSelectedImage(e.target.value)}
                    placeholder="VD: image.png hoặc figures/chart.pdf"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono outline-none focus:border-emerald-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Độ rộng hiển thị (Width)
                </label>
                <input
                  type="text"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  placeholder="0.8\linewidth hoặc 8cm"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chú thích hình ảnh (Caption)
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          {type === 'equation' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kiểu công thức
                </label>
                <select
                  value={eqType}
                  onChange={(e) => setEqType(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                >
                  <option value="equation">Môi trường có đánh số (\begin&#123;equation&#125;)</option>
                  <option value="align">Hệ phương trình căn lề (\begin&#123;align&#125;)</option>
                  <option value="display">Khối công thức trung tâm (\[ ... \])</option>
                  <option value="inline">Công thức nội dòng ($ ... $)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung LaTeX
                </label>
                <textarea
                  value={eqContent}
                  onChange={(e) => setEqContent(e.target.value)}
                  rows={3}
                  className="w-full font-mono bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none focus:border-emerald-500 resize-none text-xs"
                />
              </div>
            </>
          )}

          {type === 'citation' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Khóa trích dẫn (BibTeX Key)
              </label>
              <input
                type="text"
                value={citationKey}
                onChange={(e) => setCitationKey(e.target.value)}
                placeholder="VD: einstein1905, knuth1984texbook"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {type === 'crossref' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại tham chiếu
                </label>
                <select
                  value={refType}
                  onChange={(e) => setRefType(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                >
                  <option value="ref">\ref (Hình ảnh, bảng, mục)</option>
                  <option value="eqref">\eqref (Công thức toán học)</option>
                  <option value="pageref">\pageref (Số trang)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nhãn mục tiêu (Target Label)
                </label>
                <input
                  type="text"
                  value={refLabel}
                  onChange={(e) => setRefLabel(e.target.value)}
                  placeholder="VD: fig:example, eq:integral, sec:intro"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-13 px-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer text-xs"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Chèn vào mã nguồn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
