'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface MathSymbolsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
  position?: 'bottom-drawer' | 'top-full' | 'sidebar';
}

interface MathItem {
  preview: string;
  insert: string;
  tooltip?: string;
  category: 'greek' | 'arrows' | 'operators' | 'relations' | 'misc';
  isWide?: boolean;
}

const ALL_MATH_SYMBOLS: MathItem[] = [
  // 1. GREEK
  { preview: '\\alpha', insert: '\\alpha', tooltip: 'alpha', category: 'greek' },
  { preview: '\\beta', insert: '\\beta', tooltip: 'beta', category: 'greek' },
  { preview: '\\gamma', insert: '\\gamma', tooltip: 'gamma', category: 'greek' },
  { preview: '\\delta', insert: '\\delta', tooltip: 'delta', category: 'greek' },
  { preview: '\\epsilon', insert: '\\epsilon', tooltip: 'epsilon', category: 'greek' },
  { preview: '\\varepsilon', insert: '\\varepsilon', tooltip: 'varepsilon', category: 'greek' },
  { preview: '\\zeta', insert: '\\zeta', tooltip: 'zeta', category: 'greek' },
  { preview: '\\eta', insert: '\\eta', tooltip: 'eta', category: 'greek' },
  { preview: '\\theta', insert: '\\theta', tooltip: 'theta', category: 'greek' },
  { preview: '\\vartheta', insert: '\\vartheta', tooltip: 'vartheta', category: 'greek' },
  { preview: '\\iota', insert: '\\iota', tooltip: 'iota', category: 'greek' },
  { preview: '\\kappa', insert: '\\kappa', tooltip: 'kappa', category: 'greek' },
  { preview: '\\lambda', insert: '\\lambda', tooltip: 'lambda', category: 'greek' },
  { preview: '\\mu', insert: '\\mu', tooltip: 'mu', category: 'greek' },
  { preview: '\\nu', insert: '\\nu', tooltip: 'nu', category: 'greek' },
  { preview: '\\xi', insert: '\\xi', tooltip: 'xi', category: 'greek' },
  { preview: '\\pi', insert: '\\pi', tooltip: 'pi', category: 'greek' },
  { preview: '\\varpi', insert: '\\varpi', tooltip: 'varpi', category: 'greek' },
  { preview: '\\rho', insert: '\\rho', tooltip: 'rho', category: 'greek' },
  { preview: '\\varrho', insert: '\\varrho', tooltip: 'varrho', category: 'greek' },
  { preview: '\\sigma', insert: '\\sigma', tooltip: 'sigma', category: 'greek' },
  { preview: '\\tau', insert: '\\tau', tooltip: 'tau', category: 'greek' },
  { preview: '\\upsilon', insert: '\\upsilon', tooltip: 'upsilon', category: 'greek' },
  { preview: '\\phi', insert: '\\phi', tooltip: 'phi', category: 'greek' },
  { preview: '\\varphi', insert: '\\varphi', tooltip: 'varphi', category: 'greek' },
  { preview: '\\chi', insert: '\\chi', tooltip: 'chi', category: 'greek' },
  { preview: '\\psi', insert: '\\psi', tooltip: 'psi', category: 'greek' },
  { preview: '\\omega', insert: '\\omega', tooltip: 'omega', category: 'greek' },
  { preview: '\\Gamma', insert: '\\Gamma', tooltip: 'Gamma', category: 'greek' },
  { preview: '\\Delta', insert: '\\Delta', tooltip: 'Delta', category: 'greek' },
  { preview: '\\Theta', insert: '\\Theta', tooltip: 'Theta', category: 'greek' },
  { preview: '\\Lambda', insert: '\\Lambda', tooltip: 'Lambda', category: 'greek' },
  { preview: '\\Xi', insert: '\\Xi', tooltip: 'Xi', category: 'greek' },
  { preview: '\\Pi', insert: '\\Pi', tooltip: 'Pi', category: 'greek' },
  { preview: '\\Sigma', insert: '\\Sigma', tooltip: 'Sigma', category: 'greek' },
  { preview: '\\Upsilon', insert: '\\Upsilon', tooltip: 'Upsilon', category: 'greek' },
  { preview: '\\Phi', insert: '\\Phi', tooltip: 'Phi', category: 'greek' },
  { preview: '\\Psi', insert: '\\Psi', tooltip: 'Psi', category: 'greek' },
  { preview: '\\Omega', insert: '\\Omega', tooltip: 'Omega', category: 'greek' },

  // 2. ARROWS
  { preview: '\\rightarrow', insert: '\\rightarrow ', tooltip: 'Mũi tên sang phải', category: 'arrows' },
  { preview: '\\leftarrow', insert: '\\leftarrow ', tooltip: 'Mũi tên sang trái', category: 'arrows' },
  { preview: '\\Rightarrow', insert: '\\Rightarrow ', tooltip: 'Suy ra (Rightarrow)', category: 'arrows' },
  { preview: '\\Leftarrow', insert: '\\Leftarrow ', tooltip: 'Suy từ (Leftarrow)', category: 'arrows' },
  { preview: '\\Leftrightarrow', insert: '\\Leftrightarrow ', tooltip: 'Tương đương', category: 'arrows' },
  { preview: '\\leftrightarrow', insert: '\\leftrightarrow ', tooltip: 'Hai chiều đơn', category: 'arrows' },
  { preview: '\\mapsto', insert: '\\mapsto ', tooltip: 'Ánh xạ', category: 'arrows' },
  { preview: '\\longrightarrow', insert: '\\longrightarrow ', tooltip: 'Mũi tên dài phải', category: 'arrows' },
  { preview: '\\longleftarrow', insert: '\\longleftarrow ', tooltip: 'Mũi tên dài trái', category: 'arrows' },
  { preview: '\\iff', insert: '\\iff ', tooltip: 'Khi và chỉ khi', category: 'arrows' },
  { preview: '\\uparrow', insert: '\\uparrow ', tooltip: 'Lên trên', category: 'arrows' },
  { preview: '\\downarrow', insert: '\\downarrow ', tooltip: 'Xuống dưới', category: 'arrows' },
  { preview: '\\updownarrow', insert: '\\updownarrow ', tooltip: 'Lên xuống', category: 'arrows' },
  { preview: '\\nearrow', insert: '\\nearrow ', tooltip: 'Đông bắc', category: 'arrows' },
  { preview: '\\searrow', insert: '\\searrow ', tooltip: 'Đông nam', category: 'arrows' },
  { preview: '\\swarrow', insert: '\\swarrow ', tooltip: 'Tây nam', category: 'arrows' },
  { preview: '\\nwarrow', insert: '\\nwarrow ', tooltip: 'Tây bắc', category: 'arrows' },

  // 3. OPERATORS
  { preview: '\\pm', insert: '\\pm ', tooltip: 'Cộng trừ', category: 'operators' },
  { preview: '\\mp', insert: '\\mp ', tooltip: 'Trừ cộng', category: 'operators' },
  { preview: '\\times', insert: '\\times ', tooltip: 'Nhân (x)', category: 'operators' },
  { preview: '\\div', insert: '\\div ', tooltip: 'Chia', category: 'operators' },
  { preview: '\\cdot', insert: '\\cdot ', tooltip: 'Chấm nhân', category: 'operators' },
  { preview: '\\ast', insert: '\\ast ', tooltip: 'Dấu sao', category: 'operators' },
  { preview: '\\circ', insert: '\\circ ', tooltip: 'Tròn rỗng', category: 'operators' },
  { preview: '\\bullet', insert: '\\bullet ', tooltip: 'Chấm tròn đặc', category: 'operators' },
  { preview: '\\oplus', insert: '\\oplus ', tooltip: 'Cộng trong tròn', category: 'operators' },
  { preview: '\\otimes', insert: '\\otimes ', tooltip: 'Nhân trong tròn', category: 'operators' },
  { preview: '\\dfrac{\\Box}{\\Box}', insert: '\\dfrac{${1}}{${2}}', tooltip: 'Phân số dfrac', category: 'operators' },
  { preview: '\\frac{\\Box}{\\Box}', insert: '\\frac{${1}}{${2}}', tooltip: 'Phân số frac', category: 'operators' },
  { preview: '\\sqrt{\\Box}', insert: '\\sqrt{${1}}', tooltip: 'Căn bậc 2', category: 'operators' },
  { preview: '\\sqrt[n]{\\Box}', insert: '\\sqrt[${1}]{${2}}', tooltip: 'Căn bậc n', category: 'operators' },
  { preview: '{\\Box}^{\\Box}', insert: '^{${1}}', tooltip: 'Lũy thừa / Mũ', category: 'operators' },
  { preview: '{\\Box}_{\\Box}', insert: '_{${1}}', tooltip: 'Chỉ số dưới', category: 'operators' },
  { preview: '\\sum', insert: '\\sum ', tooltip: 'Tổng sigma', category: 'operators' },
  { preview: '\\sum_{\\Box}^{\\Box}', insert: '\\sum_{${1}}^{${2}} ', tooltip: 'Tổng cận', category: 'operators' },
  { preview: '\\prod', insert: '\\prod ', tooltip: 'Tích pi', category: 'operators' },
  { preview: '\\prod_{\\Box}^{\\Box}', insert: '\\prod_{${1}}^{${2}} ', tooltip: 'Tích cận', category: 'operators' },
  { preview: '\\int', insert: '\\int ', tooltip: 'Tích phân', category: 'operators' },
  { preview: '\\int_{\\Box}^{\\Box}', insert: '\\int_{${1}}^{${2}} ', tooltip: 'Tích phân cận', category: 'operators' },
  { preview: '\\iint', insert: '\\iint ', tooltip: 'Tích phân 2 lớp', category: 'operators' },
  { preview: '\\iiint', insert: '\\iiint ', tooltip: 'Tích phân 3 lớp', category: 'operators' },
  { preview: '\\oint', insert: '\\oint ', tooltip: 'Tích phân kín', category: 'operators' },
  { preview: '\\lim_{\\Box \\to \\Box}', insert: '\\lim_{${1} \\to ${2}} ', tooltip: 'Giới hạn', category: 'operators' },
  { preview: '\\partial', insert: '\\partial ', tooltip: 'Đạo hàm riêng', category: 'operators' },
  { preview: '\\nabla', insert: '\\nabla ', tooltip: 'Nabla', category: 'operators' },

  // 4. RELATIONS
  { preview: '=', insert: '= ', tooltip: 'Bằng', category: 'relations' },
  { preview: '\\neq', insert: '\\neq ', tooltip: 'Khác', category: 'relations' },
  { preview: '\\le', insert: '\\le ', tooltip: 'Nhỏ hơn hoặc bằng', category: 'relations' },
  { preview: '\\ge', insert: '\\ge ', tooltip: 'Lớn hơn hoặc bằng', category: 'relations' },
  { preview: '\\ll', insert: '\\ll ', tooltip: 'Rất nhỏ hơn', category: 'relations' },
  { preview: '\\gg', insert: '\\gg ', tooltip: 'Rất lớn hơn', category: 'relations' },
  { preview: '\\approx', insert: '\\approx ', tooltip: 'Xấp xỉ', category: 'relations' },
  { preview: '\\equiv', insert: '\\equiv ', tooltip: 'Đồng nhất', category: 'relations' },
  { preview: '\\sim', insert: '\\sim ', tooltip: 'Đồng dạng / Tương đương', category: 'relations' },
  { preview: '\\cong', insert: '\\cong ', tooltip: 'Bằng nhau / Toàn đẳng', category: 'relations' },
  { preview: '\\in', insert: '\\in ', tooltip: 'Thuộc tập', category: 'relations' },
  { preview: '\\notin', insert: '\\notin ', tooltip: 'Không thuộc', category: 'relations' },
  { preview: '\\subset', insert: '\\subset ', tooltip: 'Tập con thực sự', category: 'relations' },
  { preview: '\\supset', insert: '\\supset ', tooltip: 'Chứa tập', category: 'relations' },
  { preview: '\\subseteq', insert: '\\subseteq ', tooltip: 'Tập con hoặc bằng', category: 'relations' },
  { preview: '\\supseteq', insert: '\\supseteq ', tooltip: 'Chứa hoặc bằng', category: 'relations' },
  { preview: '\\cap', insert: '\\cap ', tooltip: 'Giao tập hợp', category: 'relations' },
  { preview: '\\cup', insert: '\\cup ', tooltip: 'Hợp tập hợp', category: 'relations' },
  { preview: '\\setminus', insert: '\\setminus ', tooltip: 'Hiệu tập hợp', category: 'relations' },
  { preview: '\\perp', insert: '\\perp ', tooltip: 'Vuông góc', category: 'relations' },
  { preview: '\\parallel', insert: '\\parallel ', tooltip: 'Song song', category: 'relations' },
  { preview: '\\propto', insert: '\\propto ', tooltip: 'Tỉ lệ thuận', category: 'relations' },

  // 5. MISC
  { preview: '\\infty', insert: '\\infty', tooltip: 'Vô cực', category: 'misc' },
  { preview: '\\emptyset', insert: '\\emptyset', tooltip: 'Tập rỗng', category: 'misc' },
  { preview: '\\forall', insert: '\\forall ', tooltip: 'Với mọi', category: 'misc' },
  { preview: '\\exists', insert: '\\exists ', tooltip: 'Tồn tại', category: 'misc' },
  { preview: '\\nexists', insert: '\\nexists ', tooltip: 'Không tồn tại', category: 'misc' },
  { preview: '\\neg', insert: '\\neg ', tooltip: 'Phủ định', category: 'misc' },
  { preview: '\\land', insert: '\\land ', tooltip: 'Và (hội)', category: 'misc' },
  { preview: '\\lor', insert: '\\lor ', tooltip: 'Hoặc (tuyển)', category: 'misc' },
  { preview: '\\widehat{\\Box}', insert: '\\widehat{${1}}', tooltip: 'Góc', category: 'misc' },
  { preview: '\\angle \\Box', insert: '\\angle ${1}', tooltip: 'Ký hiệu góc', category: 'misc' },
  { preview: '{\\Box}^\\circ', insert: '${1}^\\circ', tooltip: 'Độ góc', category: 'misc' },
  { preview: '\\vec{\\Box}', insert: '\\vec{${1}}', tooltip: 'Vectơ', category: 'misc' },
  { preview: '\\overline{\\Box}', insert: '\\overline{${1}}', tooltip: 'Gạch đầu', category: 'misc' },
  { preview: '\\mathbb{R}', insert: '\\mathbb{R}', tooltip: 'Tập số thực R', category: 'misc' },
  { preview: '\\mathbb{N}', insert: '\\mathbb{N}', tooltip: 'Tập số tự nhiên N', category: 'misc' },
  { preview: '\\mathbb{Z}', insert: '\\mathbb{Z}', tooltip: 'Tập số nguyên Z', category: 'misc' },
  { preview: '\\mathbb{Q}', insert: '\\mathbb{Q}', tooltip: 'Tập số hữu tỉ Q', category: 'misc' },
  { preview: '\\mathbb{C}', insert: '\\mathbb{C}', tooltip: 'Tập số phức C', category: 'misc' },
  { preview: '\\dots', insert: '\\dots ', tooltip: 'Ba chấm', category: 'misc' },
  { preview: '\\cdots', insert: '\\cdots ', tooltip: 'Ba chấm ngang giữa', category: 'misc' },
  { preview: '\\vdots', insert: '\\vdots ', tooltip: 'Ba chấm dọc', category: 'misc' },
  { preview: '\\ddots', insert: '\\ddots ', tooltip: 'Ba chấm chéo', category: 'misc' },
  {
    preview: '\\begin{pmatrix}\\Box & \\Box\\\\\\Box & \\Box\\end{pmatrix}',
    insert: '\\begin{pmatrix}\n  ${1} & ${2} \\\\\n  ${3} & ${4}\n\\end{pmatrix}',
    tooltip: 'Ma trận pmatrix',
    category: 'misc',
    isWide: true,
  },
  {
    preview: '\\begin{bmatrix}\\Box & \\Box\\\\\\Box & \\Box\\end{bmatrix}',
    insert: '\\begin{bmatrix}\n  ${1} & ${2} \\\\\n  ${3} & ${4}\n\\end{bmatrix}',
    tooltip: 'Ma trận bmatrix',
    category: 'misc',
    isWide: true,
  },
  {
    preview: '\\begin{cases}\\Box\\\\\\Box\\end{cases}',
    insert: '\\begin{cases}\n  ${1} \\\\\n  ${2}\n\\end{cases}',
    tooltip: 'Hệ phương trình cases',
    category: 'misc',
    isWide: true,
  },
];

const CATEGORIES = [
  { id: 'greek', name: 'Chữ Hy Lạp' },
  { id: 'arrows', name: 'Mũi tên' },
  { id: 'operators', name: 'Phép toán' },
  { id: 'relations', name: 'Quan hệ' },
  { id: 'misc', name: 'Khác' },
] as const;

export default function MathSymbolsPopover({
  isOpen,
  onClose,
  onInsert,
  position = 'bottom-drawer',
}: MathSymbolsPopoverProps) {
  const [activeTab, setActiveTab] = useState<'greek' | 'arrows' | 'operators' | 'relations' | 'misc'>('greek');
  const [searchQuery, setSearchQuery] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

  // Esc key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.closest('.monaco-editor') ||
        target?.classList?.contains('inputarea') ||
        ['INPUT', 'TEXTAREA'].includes(target?.tagName)
      ) {
        return;
      }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSymbols = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return ALL_MATH_SYMBOLS.filter(
        (s) =>
          s.insert.toLowerCase().includes(q) ||
          s.preview.toLowerCase().includes(q) ||
          (s.tooltip && s.tooltip.toLowerCase().includes(q))
      );
    }
    return ALL_MATH_SYMBOLS.filter((s) => s.category === activeTab);
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      className="absolute bottom-0 inset-x-0 h-56 bg-[#181a1d] dark:bg-[#141618] border-t border-white/10 shadow-2xl z-20 flex flex-col select-none text-xs text-slate-200 animate-in slide-in-from-bottom duration-150"
    >
      {/* Top Header: Categories Tabs + Search Box + Close Button */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#1e2124] shrink-0 gap-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 pr-1 py-0.5 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveTab(cat.id);
                setSearchQuery('');
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === cat.id && !searchQuery
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-2xs'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm ký hiệu..."
              className="bg-[#2a2e33] text-white text-xs rounded-md pl-7 pr-2 py-1 outline-none border border-white/10 focus:border-cyan-500 w-36 sm:w-44 font-mono placeholder:text-neutral-500"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
            title="Đóng bảng ký hiệu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of KaTeX Symbol Buttons */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 scrollbar-thin">
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
          {filteredSymbols.map((item, idx) => {
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
                onClick={() => onInsert(item.insert)}
                title={item.tooltip || item.insert}
                className={`rounded-lg border border-white/10 hover:border-cyan-500/80 bg-[#24272b] hover:bg-cyan-500/15 text-slate-100 flex items-center justify-center p-1 transition cursor-pointer shadow-2xs hover:scale-105 ${
                  item.isWide ? 'col-span-2 h-10' : 'h-9 min-w-[32px]'
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
        {filteredSymbols.length === 0 && (
          <div className="p-4 text-center text-neutral-400 text-xs">
            Không tìm thấy ký hiệu nào với từ khóa "{searchQuery}"
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3 py-1 border-t border-white/5 bg-[#141618] flex items-center justify-between text-[10px] text-neutral-400 shrink-0">
        <span>Nhấn để chèn ký hiệu vào vị trí con trỏ</span>
        <span>Phím Esc để đóng</span>
      </div>
    </div>
  );
}
