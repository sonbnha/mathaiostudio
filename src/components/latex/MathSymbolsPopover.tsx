'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
    id: 'fraction_root',
    name: 'Căn / Phân số / Mũ',
    items: [
      { display: '\\frac{a}{b}', code: '\\frac{${1:a}}{${2:b}}', tooltip: '\\frac{a}{b}' },
      { display: '\\dfrac{a}{b}', code: '\\dfrac{${1:a}}{${2:b}}', tooltip: '\\dfrac{a}{b}' },
      { display: '\\sqrt{x}', code: '\\sqrt{${1:x}}', tooltip: '\\sqrt{x}' },
      { display: '\\sqrt[n]{x}', code: '\\sqrt[${1:n}]{${2:x}}', tooltip: '\\sqrt[n]{x}' },
      { display: 'x^{2}', code: '{${1:x}}^{2}', tooltip: 'x^2' },
      { display: 'x^{n}', code: '{${1:x}}^{${2:n}}', tooltip: 'x^n' },
      { display: 'x_{i}', code: '{${1:x}}_{${2:i}}', tooltip: 'x_i' },
      { display: 'x_{i}^{n}', code: '{${1:x}}_{${2:i}}^{${3:n}}', tooltip: 'x_i^n' },
      { display: '|x|', code: '|${1:x}|', tooltip: '|x|' },
      { display: '\\|x\\|', code: '\\|${1:x}\\|', tooltip: '||x||' },
      { display: '\\overline{x}', code: '\\overline{${1:x}}', tooltip: '\\overline{x}' },
      { display: '\\underline{x}', code: '\\underline{${1:x}}', tooltip: '\\underline{x}' },
    ],
  },
  {
    id: 'operators_relations',
    name: 'Toán tử & Quan hệ',
    items: [
      { display: '\\pm', code: '\\pm ', tooltip: '\\pm' },
      { display: '\\mp', code: '\\mp ', tooltip: '\\mp' },
      { display: '\\times', code: '\\times ', tooltip: '\\times' },
      { display: '\\div', code: '\\div ', tooltip: '\\div' },
      { display: '\\cdot', code: '\\cdot ', tooltip: '\\cdot' },
      { display: '\\ast', code: '\\ast ', tooltip: '\\ast' },
      { display: '=', code: '= ', tooltip: '=' },
      { display: '\\neq', code: '\\neq ', tooltip: '\\neq' },
      { display: '\\approx', code: '\\approx ', tooltip: '\\approx' },
      { display: '\\equiv', code: '\\equiv ', tooltip: '\\equiv' },
      { display: '\\sim', code: '\\sim ', tooltip: '\\sim' },
      { display: '\\cong', code: '\\cong ', tooltip: '\\cong' },
      { display: '\\le', code: '\\le ', tooltip: '\\le' },
      { display: '\\ge', code: '\\ge ', tooltip: '\\ge' },
      { display: '\\ll', code: '\\ll ', tooltip: '\\ll' },
      { display: '\\gg', code: '\\gg ', tooltip: '\\gg' },
      { display: '\\propto', code: '\\propto ', tooltip: '\\propto' },
    ],
  },
  {
    id: 'calculus',
    name: 'Giải tích & Vi phân',
    items: [
      { display: '\\int', code: '\\int ${1:f(x)}\\,dx', tooltip: '\\int' },
      { display: '\\int_{a}^{b}', code: '\\int_{${1:a}}^{${2:b}} ${3:f(x)}\\,dx', tooltip: '\\int_a^b' },
      { display: '\\iint', code: '\\iint_{${1:D}} ${2:f(x, y)}\\,dxdy', tooltip: '\\iint' },
      { display: '\\iiint', code: '\\iiint_{${1:V}} ${2:f(x, y, z)}\\,dxdydz', tooltip: '\\iiint' },
      { display: '\\oint', code: '\\oint_{${1:C}} ${2:f(z)}\\,dz', tooltip: '\\oint' },
      { display: '\\sum', code: '\\sum ${1:x_i}', tooltip: '\\sum' },
      { display: '\\sum_{i=1}^{n}', code: '\\sum_{${1:i=1}}^{${2:n}} ${3:a_i}', tooltip: '\\sum_{i=1}^n' },
      { display: '\\prod', code: '\\prod ${1:x_i}', tooltip: '\\prod' },
      { display: '\\prod_{i=1}^{n}', code: '\\prod_{${1:i=1}}^{${2:n}} ${3:a_i}', tooltip: '\\prod_{i=1}^n' },
      { display: '\\lim_{x \\to x_0}', code: '\\lim_{${1:x} \\to ${2:x_0}} ${3:f(x)}', tooltip: '\\lim_{x \\to x_0}' },
      { display: '\\lim_{x \\to \\infty}', code: '\\lim_{${1:x} \\to \\infty} ${2:f(x)}', tooltip: '\\lim_{x \\to \\infty}' },
      { display: '\\mathrm{d}x', code: '\\mathrm{d}${1:x}', tooltip: '\\mathrm{d}x' },
      { display: '\\partial x', code: '\\frac{\\partial ${1:f}}{\\partial ${2:x}}', tooltip: '\\partial x' },
      { display: '\\nabla', code: '\\nabla', tooltip: '\\nabla' },
      { display: '\\infty', code: '+\\infty', tooltip: '\\infty' },
    ],
  },
  {
    id: 'geometry_trig',
    name: 'Hình học & Lượng giác',
    items: [
      { display: '\\vec{u}', code: '\\vec{${1:u}}', tooltip: '\\vec{u}' },
      { display: '\\overrightarrow{AB}', code: '\\overrightarrow{${1:AB}}', tooltip: '\\overrightarrow{AB}' },
      { display: '\\angle ABC', code: '\\widehat{${1:ABC}}', tooltip: '\\angle ABC' },
      { display: '\\Delta', code: '\\Delta ${1:ABC}', tooltip: '\\Delta' },
      { display: '\\perp', code: '\\perp ', tooltip: '\\perp' },
      { display: '\\parallel', code: '\\parallel ', tooltip: '\\parallel' },
      { display: '\\not\\parallel', code: '\\not\\parallel ', tooltip: '\\not\\parallel' },
      { display: '\\sim', code: '\\sim ', tooltip: '\\sim' },
      { display: '60^\\circ', code: '${1:60}^\\circ', tooltip: '^\circ' },
      { display: '\\pi', code: '\\pi', tooltip: '\\pi' },
      { display: '\\sin', code: '\\sin(${1:x})', tooltip: '\\sin' },
      { display: '\\cos', code: '\\cos(${1:x})', tooltip: '\\cos' },
      { display: '\\tan', code: '\\tan(${1:x})', tooltip: '\\tan' },
      { display: '\\cot', code: '\\cot(${1:x})', tooltip: '\\cot' },
    ],
  },
  {
    id: 'sets_logic',
    name: 'Tập hợp & Logic',
    items: [
      { display: '\\in', code: '\\in ', tooltip: '\\in' },
      { display: '\\notin', code: '\\notin ', tooltip: '\\notin' },
      { display: '\\subset', code: '\\subset ', tooltip: '\\subset' },
      { display: '\\supset', code: '\\supset ', tooltip: '\\supset' },
      { display: '\\subseteq', code: '\\subseteq ', tooltip: '\\subseteq' },
      { display: '\\supseteq', code: '\\supseteq ', tooltip: '\\supseteq' },
      { display: '\\cap', code: '\\cap ', tooltip: '\\cap' },
      { display: '\\cup', code: '\\cup ', tooltip: '\\cup' },
      { display: '\\setminus', code: '\\setminus ', tooltip: '\\setminus' },
      { display: '\\emptyset', code: '\\emptyset', tooltip: '\\emptyset' },
      { display: '\\mathbb{R}', code: '\\mathbb{R}', tooltip: '\\mathbb{R}' },
      { display: '\\mathbb{N}', code: '\\mathbb{N}', tooltip: '\\mathbb{N}' },
      { display: '\\mathbb{Z}', code: '\\mathbb{Z}', tooltip: '\\mathbb{Z}' },
      { display: '\\mathbb{Q}', code: '\\mathbb{Q}', tooltip: '\\mathbb{Q}' },
      { display: '\\mathbb{C}', code: '\\mathbb{C}', tooltip: '\\mathbb{C}' },
      { display: '\\forall', code: '\\forall ', tooltip: '\\forall' },
      { display: '\\exists', code: '\\exists ', tooltip: '\\exists' },
      { display: '\\nexists', code: '\\nexists ', tooltip: '\\nexists' },
      { display: '\\Rightarrow', code: '\\Rightarrow ', tooltip: '\\Rightarrow' },
      { display: '\\Leftarrow', code: '\\Leftarrow ', tooltip: '\\Leftarrow' },
      { display: '\\Leftrightarrow', code: '\\Leftrightarrow ', tooltip: '\\Leftrightarrow' },
      { display: '\\neg', code: '\\neg ', tooltip: '\\neg' },
      { display: '\\land', code: '\\land ', tooltip: '\\land' },
      { display: '\\lor', code: '\\lor ', tooltip: '\\lor' },
    ],
  },
  {
    id: 'greek_letters',
    name: 'Ký tự Hy Lạp',
    items: [
      { display: '\\alpha', code: '\\alpha', tooltip: '\\alpha' },
      { display: '\\beta', code: '\\beta', tooltip: '\\beta' },
      { display: '\\gamma', code: '\\gamma', tooltip: '\\gamma' },
      { display: '\\delta', code: '\\delta', tooltip: '\\delta' },
      { display: '\\epsilon', code: '\\epsilon', tooltip: '\\epsilon' },
      { display: '\\varepsilon', code: '\\varepsilon', tooltip: '\\varepsilon' },
      { display: '\\theta', code: '\\theta', tooltip: '\\theta' },
      { display: '\\lambda', code: '\\lambda', tooltip: '\\lambda' },
      { display: '\\mu', code: '\\mu', tooltip: '\\mu' },
      { display: '\\pi', code: '\\pi', tooltip: '\\pi' },
      { display: '\\rho', code: '\\rho', tooltip: '\\rho' },
      { display: '\\sigma', code: '\\sigma', tooltip: '\\sigma' },
      { display: '\\tau', code: '\\tau', tooltip: '\\tau' },
      { display: '\\phi', code: '\\phi', tooltip: '\\phi' },
      { display: '\\varphi', code: '\\varphi', tooltip: '\\varphi' },
      { display: '\\omega', code: '\\omega', tooltip: '\\omega' },
      { display: '\\Delta', code: '\\Delta', tooltip: '\\Delta' },
      { display: '\\Omega', code: '\\Omega', tooltip: '\\Omega' },
    ],
  },
  {
    id: 'brackets_matrices',
    name: 'Ngoặc & Ma trận',
    items: [
      { display: '\\left( \\right)', code: '\\left( ${1:x} \\right)', tooltip: '\\left( \\right)' },
      { display: '\\left[ \\right]', code: '\\left[ ${1:x} \\right]', tooltip: '\\left[ \\right]' },
      { display: '\\left\\{ \\right\\}', code: '\\left\\{ ${1:x} \\right\\}', tooltip: '\\left\\{ \\right\\}' },
      {
        display: '\\begin{cases}..',
        code: '\\begin{cases}\n  ${1:2x + y = 5} \\\\\n  ${2:x - 3y = -1}\n\\end{cases}',
        tooltip: '\\begin{cases}',
      },
      {
        display: '\\begin{matrix}..',
        code: '\\begin{matrix}\n  ${1:a} & ${2:b} \\\\\n  ${3:c} & ${4:d}\n\\end{matrix}',
        tooltip: '\\begin{matrix}',
      },
      {
        display: '\\begin{pmatrix}..',
        code: '\\begin{pmatrix}\n  ${1:a} & ${2:b} \\\\\n  ${3:c} & ${4:d}\n\\end{pmatrix}',
        tooltip: '\\begin{pmatrix}',
      },
      {
        display: '\\begin{bmatrix}..',
        code: '\\begin{bmatrix}\n  ${1:a} & ${2:b} \\\\\n  ${3:c} & ${4:d}\n\\end{bmatrix}',
        tooltip: '\\begin{bmatrix}',
      },
      {
        display: '\\begin{vmatrix}..',
        code: '\\begin{vmatrix}\n  ${1:a} & ${2:b} \\\\\n  ${3:c} & ${4:d}\n\\end{vmatrix}',
        tooltip: '\\begin{vmatrix}',
      },
    ],
  },
];

export default function MathSymbolsPopover({
  isOpen,
  onClose,
  onInsert,
}: MathSymbolsPopoverProps) {
  const [activeTab, setActiveTab] = useState<string>('fraction_root');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss & Esc key
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
      className="absolute top-full left-0 mt-1.5 w-[480px] sm:w-[520px] max-h-[500px] overflow-hidden bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-3 z-50 text-xs text-slate-100 animate-in fade-in zoom-in-95 duration-100 select-none flex flex-col"
    >
      {/* Top Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 pr-1 py-0.5 scrollbar-thin">
          {MATHTYPE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0 ml-1 cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Square MathType Icon Buttons (32x32px) */}
      <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 overflow-y-auto max-h-[300px] p-1 scrollbar-thin">
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
              className="h-9 w-full min-w-[32px] rounded-lg border border-slate-800 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-cyan-500/15 text-slate-100 flex items-center justify-center p-1 transition-all cursor-pointer shadow-2xs hover:scale-105"
            >
              <div
                className="text-xs overflow-hidden max-w-full truncate pointer-events-none text-slate-100"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom Status Bar */}
      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <span>Click ký hiệu để chèn vào Editor</span>
        <span>Phím Esc để đóng</span>
      </div>
    </div>
  );
}
