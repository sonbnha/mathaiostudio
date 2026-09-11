'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sigma,
  Shapes,
  Calculator,
  Layers,
  Sparkles,
  FunctionSquare,
} from 'lucide-react';
import katex from 'katex';

export interface MathSymbolsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
}

interface MathCategory {
  id: string;
  name: string;
  items: Array<{
    display: string;
    code: string;
    tooltip?: string;
  }>;
}

const MATHTYPE_CATEGORIES: MathCategory[] = [
  {
    id: 'algebra',
    name: 'Đại số',
    items: [
      { display: '\\dfrac{a}{b}', code: '\\dfrac{${1:a}}{${2:b}}', tooltip: 'Phân số' },
      { display: '\\sqrt{x}', code: '\\sqrt{${1:x}}', tooltip: 'Căn bậc 2' },
      { display: '\\sqrt[n]{x}', code: '\\sqrt[${1:n}]{${2:x}}', tooltip: 'Căn bậc n' },
      { display: 'x^{n}', code: '{${1:x}}^{${2:n}}', tooltip: 'Lũy thừa' },
      { display: 'x_{n}', code: '{${1:x}}_{${2:n}}', tooltip: 'Chỉ số dưới' },
      { display: '\\pm', code: '\\pm ', tooltip: 'Cộng trừ' },
      { display: '\\mp', code: '\\mp ', tooltip: 'Trừ cộng' },
      { display: '\\times', code: '\\times ', tooltip: 'Nhân (dấu x)' },
      { display: '\\cdot', code: '\\cdot ', tooltip: 'Nhân (dấu chấm)' },
      { display: '\\div', code: '\\div ', tooltip: 'Chia' },
      { display: '\\neq', code: '\\neq ', tooltip: 'Khác' },
      { display: '\\le', code: '\\le ', tooltip: 'Nhỏ hơn hoặc bằng' },
      { display: '\\ge', code: '\\ge ', tooltip: 'Lớn hơn hoặc bằng' },
      { display: '\\approx', code: '\\approx ', tooltip: 'Xấp xỉ' },
      { display: '\\equiv', code: '\\equiv ', tooltip: 'Đồng nhất' },
      { display: '|x|', code: '|${1:x}|', tooltip: 'Giá trị tuyệt đối' },
      { display: '(a, b)', code: '(${1:a}, ${2:b})', tooltip: 'Khoảng' },
      { display: '[a, b]', code: '[${1:a}, ${2:b}]', tooltip: 'Đoạn' },
      { display: '\\infty', code: '+\\infty', tooltip: 'Vô cực' },
      { display: '-\\infty', code: '-\\infty', tooltip: 'Âm vô cực' },
    ],
  },
  {
    id: 'calculus',
    name: 'Giải tích',
    items: [
      { display: '\\int', code: '\\int_{${1:a}}^{${2:b}} ${3:f(x)}\\,dx', tooltip: 'Tích phân xác định' },
      { display: '\\int\\,dx', code: '\\int ${1:f(x)}\\,dx', tooltip: 'Tích phân bất định' },
      { display: '\\iint', code: '\\iint_{${1:D}} ${2:f(x, y)}\\,dxdy', tooltip: 'Tích phân 2 lớp' },
      { display: '\\lim', code: '\\lim_{${1:x} \\to ${2:x_0}} ${3:f(x)}', tooltip: 'Giới hạn' },
      { display: '\\sum', code: '\\sum_{${1:i=1}}^{${2:n}} ${3:a_i}', tooltip: 'Tổng xích-ma' },
      { display: '\\prod', code: '\\prod_{${1:k=1}}^{${2:n}} ${3:a_k}', tooltip: 'Tích chuỗi' },
      { display: 'f\'(x)', code: 'f\'(${1:x})', tooltip: 'Đạo hàm' },
      { display: '\\frac{dy}{dx}', code: '\\frac{d${1:y}}{d${2:x}}', tooltip: 'Vi phân' },
      { display: '\\partial', code: '\\frac{\\partial ${1:f}}{\\partial ${2:x}}', tooltip: 'Đạo hàm riêng' },
      { display: 'e^x', code: 'e^{${1:x}}', tooltip: 'Hàm mũ e^x' },
      { display: '\\ln x', code: '\\ln(${1:x})', tooltip: 'Logarit tự nhiên' },
      { display: '\\log_a b', code: '\\log_{${1:a}}(${2:b})', tooltip: 'Logarit cơ số a' },
      { display: '\\sin x', code: '\\sin(${1:x})', tooltip: 'Hàm sin' },
      { display: '\\cos x', code: '\\cos(${1:x})', tooltip: 'Hàm cos' },
      { display: '\\tan x', code: '\\tan(${1:x})', tooltip: 'Hàm tan' },
      { display: '\\cot x', code: '\\cot(${1:x})', tooltip: 'Hàm cot' },
    ],
  },
  {
    id: 'geometry',
    name: 'Hình học',
    items: [
      { display: '\\vec{u}', code: '\\vec{${1:u}}', tooltip: 'Vectơ u' },
      { display: '\\overrightarrow{AB}', code: '\\overrightarrow{${1:AB}}', tooltip: 'Vectơ AB' },
      { display: '\\Delta ABC', code: '\\Delta ${1:ABC}', tooltip: 'Tam giác ABC' },
      { display: '\\widehat{A}', code: '\\widehat{${1:BAC}}', tooltip: 'Góc BAC' },
      { display: '60^\\circ', code: '${1:60}^\\circ', tooltip: 'Độ góc' },
      { display: '\\parallel', code: '\\parallel ', tooltip: 'Song song' },
      { display: '\\perp', code: '\\perp ', tooltip: 'Vuông góc' },
      { display: '\\angle', code: '\\angle ${1:ABC}', tooltip: 'Ký hiệu góc' },
      { display: '\\sim', code: '\\sim ', tooltip: 'Đồng dạng' },
      { display: '\\cong', code: '\\cong ', tooltip: 'Bằng nhau (hình học)' },
      { display: '(O; R)', code: '(${1:O}; ${2:R})', tooltip: 'Đường tròn (O; R)' },
      { display: '\\pi', code: '\\pi', tooltip: 'Số Pi' },
      { display: '\\alpha', code: '\\alpha', tooltip: 'Alpha' },
      { display: '\\beta', code: '\\beta', tooltip: 'Beta' },
      { display: '\\gamma', code: '\\gamma', tooltip: 'Gamma' },
      { display: '\\theta', code: '\\theta', tooltip: 'Theta' },
      { display: '\\phi', code: '\\phi', tooltip: 'Phi' },
      { display: '\\omega', code: '\\omega', tooltip: 'Omega' },
    ],
  },
  {
    id: 'logic',
    name: 'Logic & Tập',
    items: [
      { display: '\\in', code: '\\in ', tooltip: 'Thuộc' },
      { display: '\\notin', code: '\\notin ', tooltip: 'Không thuộc' },
      { display: '\\subset', code: '\\subset ', tooltip: 'Tập con' },
      { display: '\\supset', code: '\\supset ', tooltip: 'Chứa' },
      { display: '\\cup', code: '\\cup ', tooltip: 'Hợp' },
      { display: '\\cap', code: '\\cap ', tooltip: 'Giao' },
      { display: '\\setminus', code: '\\setminus ', tooltip: 'Hiệu tập hợp' },
      { display: '\\emptyset', code: '\\emptyset', tooltip: 'Tập rỗng' },
      { display: '\\forall', code: '\\forall ', tooltip: 'Với mọi' },
      { display: '\\exists', code: '\\exists ', tooltip: 'Tồn tại' },
      { display: '\\implies', code: '\\implies ', tooltip: 'Suy ra' },
      { display: '\\iff', code: '\\iff ', tooltip: 'Tương đương' },
      { display: '\\mathbb{R}', code: '\\mathbb{R}', tooltip: 'Tập số thực R' },
      { display: '\\mathbb{N}', code: '\\mathbb{N}', tooltip: 'Tập số tự nhiên N' },
      { display: '\\mathbb{Z}', code: '\\mathbb{Z}', tooltip: 'Tập số nguyên Z' },
      { display: '\\mathbb{Q}', code: '\\mathbb{Q}', tooltip: 'Tập số hữu tỉ Q' },
      { display: '\\mathbb{C}', code: '\\mathbb{C}', tooltip: 'Tập số phức C' },
    ],
  },
  {
    id: 'env',
    name: 'Môi trường',
    items: [
      {
        display: '\\begin{cases}..',
        code: '\\begin{cases}\n  ${1:2x + y = 5} \\\\\n  ${2:x - 3y = -1}\n\\end{cases}',
        tooltip: 'Hệ phương trình',
      },
      {
        display: '\\begin{pmatrix}..',
        code: '\\begin{pmatrix}\n  ${1:a} & ${2:b} \\\\\n  ${3:c} & ${4:d}\n\\end{pmatrix}',
        tooltip: 'Ma trận vuông',
      },
      {
        display: '\\begin{align*}..',
        code: '\\begin{align*}\n  ${1:f(x)} &= ${2:ax^2 + bx + c} \\\\\n  &= ${3:0}\n\\end{align*}',
        tooltip: 'Căn dòng công thức',
      },
      {
        display: '\\text{A-B-C-D}',
        code: '\\begin{multicols}{4}\n\\begin{enumerate}[label=\\Alph*.]\n  \\item ${1:Phương án A}\n  \\item ${2:Phương án B}\n  \\item ${3:Phương án C}\n  \\item ${4:Phương án D}\n\\end{enumerate}\n\\end{multicols}',
        tooltip: '4 đáp án trắc nghiệm',
      },
      {
        display: '\\text{Bài tập}',
        code: '\\begin{exercise}\n  ${1:Đề bài tập toán học...}\n\\end{exercise}',
        tooltip: 'Môi trường bài tập',
      },
      {
        display: '\\text{Lời giải}',
        code: '\\begin{solution}\n  ${1:Lời giải chi tiết từng bước...}\n\\end{solution}',
        tooltip: 'Môi trường lời giải',
      },
      {
        display: '\\text{Định lý}',
        code: '\\begin{theorem}[${1:Tên định lý}]\n  ${2:Nội dung định lý...}\n\\end{theorem}',
        tooltip: 'Môi trường định lý',
      },
      {
        display: '\\text{TikZ Hình}',
        code: '\\begin{tikzpicture}[scale=0.8]\n  \\draw[thick, blue] (0,0) -- (3,0) -- (1.5,2) -- cycle;\n\\end{tikzpicture}',
        tooltip: 'Khung vẽ TikZ',
      },
    ],
  },
];

export default function MathSymbolsPopover({
  isOpen,
  onClose,
  onInsert,
}: MathSymbolsPopoverProps) {
  const [activeTab, setActiveTab] = useState<string>('algebra');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCategory = MATHTYPE_CATEGORIES.find((c) => c.id === activeTab) || MATHTYPE_CATEGORIES[0];

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1.5 w-[350px] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* Top Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-1 overflow-x-auto min-w-0">
          {MATHTYPE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                activeTab === cat.id
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 ml-1"
          title="Đóng (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of MathType Icon Buttons (5 to 6 columns) */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-[220px] overflow-y-auto p-0.5">
        {currentCategory.items.map((item, idx) => {
          let renderedHtml = '';
          try {
            renderedHtml = katex.renderToString(item.display, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            renderedHtml = `<span class="text-[10px]">${item.display}</span>`;
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onInsert(item.code);
                onClose();
              }}
              title={item.tooltip || item.code}
              className="h-9 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/80 dark:hover:border-cyan-500/80 bg-slate-50/70 hover:bg-cyan-500/10 dark:bg-slate-950/50 dark:hover:bg-cyan-500/15 text-slate-900 dark:text-slate-100 flex items-center justify-center p-1 transition-all cursor-pointer shadow-2xs hover:scale-105"
            >
              <div
                className="text-xs overflow-hidden max-w-full truncate pointer-events-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Bấm biểu tượng để chèn mã</span>
        <span>Phím Esc để đóng</span>
      </div>
    </div>
  );
}
