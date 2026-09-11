'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface MathSymbolsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  position?: 'top-full' | 'sidebar';
}

interface MathItem {
  preview: string;
  insert: string;
  tooltip?: string;
  isWide?: boolean;
}

interface MathCategory {
  id: string;
  name: string;
  items: MathItem[];
}

const MATHTYPE_CATEGORIES: MathCategory[] = [
  {
    id: 'fraction_root',
    name: 'Căn / Phân số / Mũ',
    items: [
      { preview: '\\dfrac{\\Box}{\\Box}', insert: '\\dfrac{${1}}{${2}}', tooltip: 'Phân số dfrac' },
      { preview: '\\frac{\\Box}{\\Box}', insert: '\\frac{${1}}{${2}}', tooltip: 'Phân số frac' },
      { preview: '\\sqrt{\\Box}', insert: '\\sqrt{${1}}', tooltip: 'Căn bậc hai' },
      { preview: '\\sqrt[n]{\\Box}', insert: '\\sqrt[${1}]{${2}}', tooltip: 'Căn bậc n' },
      { preview: '{\\Box}^{\\Box}', insert: '^{${1}}', tooltip: 'Lũy thừa' },
      { preview: '{\\Box}_{\\Box}', insert: '_{${1}}', tooltip: 'Chỉ số dưới' },
      { preview: '{\\Box}_{\\Box}^{\\Box}', insert: '_{${1}}^{${2}}', tooltip: 'Mũ và chỉ số dưới' },
      { preview: '|\\Box|', insert: '|${1}|', tooltip: 'Trị tuyệt đối' },
      { preview: '\\|\\Box\\|', insert: '\\|${1}\\|', tooltip: 'Chuẩn (Norm)' },
      { preview: '\\overline{\\Box}', insert: '\\overline{${1}}', tooltip: 'Gạch đầu' },
      { preview: '\\underline{\\Box}', insert: '\\underline{${1}}', tooltip: 'Gạch chân' },
    ],
  },
  {
    id: 'operators_relations',
    name: 'Toán tử & Quan hệ',
    items: [
      { preview: '\\pm', insert: '\\pm ', tooltip: 'Cộng trừ' },
      { preview: '\\mp', insert: '\\mp ', tooltip: 'Trừ cộng' },
      { preview: '\\times', insert: '\\times ', tooltip: 'Nhân (x)' },
      { preview: '\\div', insert: '\\div ', tooltip: 'Chia' },
      { preview: '\\cdot', insert: '\\cdot ', tooltip: 'Nhân (chấm)' },
      { preview: '\\ast', insert: '\\ast ', tooltip: 'Sao' },
      { preview: '=', insert: '= ', tooltip: 'Bằng' },
      { preview: '\\neq', insert: '\\neq ', tooltip: 'Khác' },
      { preview: '\\approx', insert: '\\approx ', tooltip: 'Xấp xỉ' },
      { preview: '\\equiv', insert: '\\equiv ', tooltip: 'Đồng nhất' },
      { preview: '\\sim', insert: '\\sim ', tooltip: 'Đồng dạng' },
      { preview: '\\cong', insert: '\\cong ', tooltip: 'Bằng nhau' },
      { preview: '\\le', insert: '\\le ', tooltip: 'Nhỏ hơn hoặc bằng' },
      { preview: '\\ge', insert: '\\ge ', tooltip: 'Lớn hơn hoặc bằng' },
      { preview: '\\ll', insert: '\\ll ', tooltip: 'Rất nhỏ hơn' },
      { preview: '\\gg', insert: '\\gg ', tooltip: 'Rất lớn hơn' },
      { preview: '\\propto', insert: '\\propto ', tooltip: 'Tỉ lệ thuận' },
    ],
  },
  {
    id: 'calculus',
    name: 'Giải tích & Vi phân',
    items: [
      { preview: '\\int', insert: '\\int ', tooltip: 'Tích phân bất định' },
      { preview: '\\int_{\\Box}^{\\Box}', insert: '\\int_{${1}}^{${2}} ', tooltip: 'Tích phân xác định' },
      { preview: '\\iint', insert: '\\iint ', tooltip: 'Tích phân hai lớp' },
      { preview: '\\iiint', insert: '\\iiint ', tooltip: 'Tích phân ba lớp' },
      { preview: '\\oint', insert: '\\oint ', tooltip: 'Tích phân đường cong' },
      { preview: '\\sum', insert: '\\sum ', tooltip: 'Tổng' },
      { preview: '\\sum_{\\Box}^{\\Box}', insert: '\\sum_{${1}}^{${2}} ', tooltip: 'Tổng chuỗi' },
      { preview: '\\prod', insert: '\\prod ', tooltip: 'Tích' },
      { preview: '\\prod_{\\Box}^{\\Box}', insert: '\\prod_{${1}}^{${2}} ', tooltip: 'Tích chuỗi' },
      { preview: '\\lim_{\\Box \\to \\Box}', insert: '\\lim_{${1} \\to ${2}} ', tooltip: 'Giới hạn' },
      { preview: '\\lim_{\\Box \\to \\infty}', insert: '\\lim_{${1} \\to \\infty} ', tooltip: 'Giới hạn vô cực' },
      { preview: '\\mathrm{d}\\Box', insert: '\\mathrm{d}${1}', tooltip: 'Vi phân d' },
      { preview: '\\frac{\\partial \\Box}{\\partial \\Box}', insert: '\\frac{\\partial ${1}}{\\partial ${2}}', tooltip: 'Đạo hàm riêng' },
      { preview: '\\nabla', insert: '\\nabla', tooltip: 'Toán tử Nabla' },
      { preview: '\\infty', insert: '+\\infty', tooltip: 'Vô cực' },
    ],
  },
  {
    id: 'geometry_trig',
    name: 'Hình học & Lượng giác',
    items: [
      { preview: '\\vec{\\Box}', insert: '\\vec{${1}}', tooltip: 'Vectơ' },
      { preview: '\\overrightarrow{\\Box}', insert: '\\overrightarrow{${1}}', tooltip: 'Vectơ 2 điểm' },
      { preview: '\\widehat{\\Box}', insert: '\\widehat{${1}}', tooltip: 'Ký hiệu góc' },
      { preview: '\\angle \\Box', insert: '\\angle ${1}', tooltip: 'Góc' },
      { preview: '\\Delta', insert: '\\Delta ', tooltip: 'Tam giác' },
      { preview: '\\perp', insert: '\\perp ', tooltip: 'Vuông góc' },
      { preview: '\\parallel', insert: '\\parallel ', tooltip: 'Song song' },
      { preview: '\\not\\parallel', insert: '\\not\\parallel ', tooltip: 'Không song song' },
      { preview: '\\sim', insert: '\\sim ', tooltip: 'Đồng dạng' },
      { preview: '{\\Box}^\\circ', insert: '${1}^\\circ', tooltip: 'Độ góc' },
      { preview: '\\pi', insert: '\\pi', tooltip: 'Số Pi' },
      { preview: '\\sin(\\Box)', insert: '\\sin(${1})', tooltip: 'Hàm sin' },
      { preview: '\\cos(\\Box)', insert: '\\cos(${1})', tooltip: 'Hàm cos' },
      { preview: '\\tan(\\Box)', insert: '\\tan(${1})', tooltip: 'Hàm tan' },
      { preview: '\\cot(\\Box)', insert: '\\cot(${1})', tooltip: 'Hàm cot' },
    ],
  },
  {
    id: 'sets_logic',
    name: 'Tập hợp & Logic',
    items: [
      { preview: '\\in', insert: '\\in ', tooltip: 'Thuộc' },
      { preview: '\\notin', insert: '\\notin ', tooltip: 'Không thuộc' },
      { preview: '\\subset', insert: '\\subset ', tooltip: 'Tập con' },
      { preview: '\\supset', insert: '\\supset ', tooltip: 'Chứa tập' },
      { preview: '\\subseteq', insert: '\\subseteq ', tooltip: 'Tập con hoặc bằng' },
      { preview: '\\supseteq', insert: '\\supseteq ', tooltip: 'Chứa hoặc bằng' },
      { preview: '\\cap', insert: '\\cap ', tooltip: 'Giao' },
      { preview: '\\cup', insert: '\\cup ', tooltip: 'Hợp' },
      { preview: '\\setminus', insert: '\\setminus ', tooltip: 'Hiệu tập hợp' },
      { preview: '\\emptyset', insert: '\\emptyset', tooltip: 'Tập rỗng' },
      { preview: '\\mathbb{R}', insert: '\\mathbb{R}', tooltip: 'Tập số thực' },
      { preview: '\\mathbb{N}', insert: '\\mathbb{N}', tooltip: 'Tập số tự nhiên' },
      { preview: '\\mathbb{Z}', insert: '\\mathbb{Z}', tooltip: 'Tập số nguyên' },
      { preview: '\\mathbb{Q}', insert: '\\mathbb{Q}', tooltip: 'Tập số hữu tỉ' },
      { preview: '\\mathbb{C}', insert: '\\mathbb{C}', tooltip: 'Tập số phức' },
      { preview: '\\forall', insert: '\\forall ', tooltip: 'Với mọi' },
      { preview: '\\exists', insert: '\\exists ', tooltip: 'Tồn tại' },
      { preview: '\\nexists', insert: '\\nexists ', tooltip: 'Không tồn tại' },
      { preview: '\\Rightarrow', insert: '\\Rightarrow ', tooltip: 'Suy ra' },
      { preview: '\\Leftarrow', insert: '\\Leftarrow ', tooltip: 'Suy từ' },
      { preview: '\\Leftrightarrow', insert: '\\Leftrightarrow ', tooltip: 'Tương đương' },
      { preview: '\\neg', insert: '\\neg ', tooltip: 'Phủ định' },
      { preview: '\\land', insert: '\\land ', tooltip: 'Và (hội)' },
      { preview: '\\lor', insert: '\\lor ', tooltip: 'Hoặc (tuyển)' },
    ],
  },
  {
    id: 'greek_letters',
    name: 'Ký tự Hy Lạp',
    items: [
      { preview: '\\alpha', insert: '\\alpha', tooltip: 'alpha' },
      { preview: '\\beta', insert: '\\beta', tooltip: 'beta' },
      { preview: '\\gamma', insert: '\\gamma', tooltip: 'gamma' },
      { preview: '\\delta', insert: '\\delta', tooltip: 'delta' },
      { preview: '\\epsilon', insert: '\\epsilon', tooltip: 'epsilon' },
      { preview: '\\varepsilon', insert: '\\varepsilon', tooltip: 'varepsilon' },
      { preview: '\\theta', insert: '\\theta', tooltip: 'theta' },
      { preview: '\\lambda', insert: '\\lambda', tooltip: 'lambda' },
      { preview: '\\mu', insert: '\\mu', tooltip: 'mu' },
      { preview: '\\pi', insert: '\\pi', tooltip: 'pi' },
      { preview: '\\rho', insert: '\\rho', tooltip: 'rho' },
      { preview: '\\sigma', insert: '\\sigma', tooltip: 'sigma' },
      { preview: '\\tau', insert: '\\tau', tooltip: 'tau' },
      { preview: '\\phi', insert: '\\phi', tooltip: 'phi' },
      { preview: '\\varphi', insert: '\\varphi', tooltip: 'varphi' },
      { preview: '\\omega', insert: '\\omega', tooltip: 'omega' },
      { preview: '\\Delta', insert: '\\Delta', tooltip: 'Delta' },
      { preview: '\\Omega', insert: '\\Omega', tooltip: 'Omega' },
    ],
  },
  {
    id: 'brackets_matrices',
    name: 'Ngoặc & Ma trận',
    items: [
      { preview: '(\\Box)', insert: '\\left( ${1} \\right)', tooltip: 'Ngoặc tròn ( )' },
      { preview: '[\\Box]', insert: '\\left[ ${1} \\right]', tooltip: 'Ngoặc vuông [ ]' },
      { preview: '\\{\\Box\\}', insert: '\\left\\{ ${1} \\right\\}', tooltip: 'Ngoặc nhọn { }' },
      { preview: '|\\Box|', insert: '\\left| ${1} \\right|', tooltip: 'Gạch đứng | |' },
      {
        preview: '\\begin{cases}\\Box\\\\\\Box\\end{cases}',
        insert: '\\begin{cases}\n  ${1} \\\\\n  ${2}\n\\end{cases}',
        tooltip: 'Hệ phương trình (cases)',
        isWide: true,
      },
      {
        preview: '\\begin{pmatrix}\\Box & \\Box\\\\\\Box & \\Box\\end{pmatrix}',
        insert: '\\begin{pmatrix}\n  ${1} & ${2} \\\\\n  ${3} & ${4}\n\\end{pmatrix}',
        tooltip: 'Ma trận tròn (pmatrix)',
        isWide: true,
      },
      {
        preview: '\\begin{bmatrix}\\Box & \\Box\\\\\\Box & \\Box\\end{bmatrix}',
        insert: '\\begin{bmatrix}\n  ${1} & ${2} \\\\\n  ${3} & ${4}\n\\end{bmatrix}',
        tooltip: 'Ma trận vuông (bmatrix)',
        isWide: true,
      },
      {
        preview: '\\begin{vmatrix}\\Box & \\Box\\\\\\Box & \\Box\\end{vmatrix}',
        insert: '\\begin{vmatrix}\n  ${1} & ${2} \\\\\n  ${3} & ${4}\n\\end{vmatrix}',
        tooltip: 'Định thức ma trận (vmatrix)',
        isWide: true,
      },
      {
        preview: '\\begin{matrix}\\Box & \\Box\\\\\\Box & \\Box\\end{matrix}',
        insert: '\\begin{matrix}\n  ${1} & ${2} \\\\\n  ${3} & ${4}\n\\end{matrix}',
        tooltip: 'Bảng ma trận trơn (matrix)',
        isWide: true,
      },
    ],
  },
];

export default function MathSymbolsPopover({
  isOpen,
  onClose,
  onInsert,
  position = 'top-full',
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
      className={`absolute ${
        position === 'sidebar' ? 'left-full top-0 ml-2' : 'top-full left-0 mt-1.5'
      } w-[480px] sm:w-[520px] max-h-[500px] overflow-hidden bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-3 z-50 text-xs text-slate-100 animate-in fade-in zoom-in-95 duration-100 select-none flex flex-col`}
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

      {/* Grid of MathType Icon Buttons rendered via KaTeX */}
      <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 overflow-y-auto max-h-[300px] p-1 scrollbar-thin">
        {currentCategory.items.map((item, idx) => {
          let renderedHtml = '';
          try {
            renderedHtml = katex.renderToString(item.preview, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            renderedHtml = `<span class="text-[10px]">${item.preview}</span>`;
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onInsert(item.insert);
                onClose();
              }}
              title={item.tooltip || item.insert}
              className={`rounded-lg border border-slate-800 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-cyan-500/15 text-slate-100 flex items-center justify-center p-1 transition-all cursor-pointer shadow-2xs hover:scale-105 ${
                item.isWide ? 'col-span-2 h-12' : 'h-10 min-w-[36px]'
              }`}
            >
              <div
                className="text-xs overflow-hidden max-w-full truncate pointer-events-none text-slate-100 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom Status Bar */}
      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <span>Click biểu tượng để chèn khung rỗng vào Editor</span>
        <span>Phím Esc để đóng</span>
      </div>
    </div>
  );
}
