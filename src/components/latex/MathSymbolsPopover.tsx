'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Braces,
  Sigma,
  Shapes,
  X,
  Sparkles,
  Calculator,
  Search,
  Check,
  Layers,
} from 'lucide-react';
import katex from 'katex';
import { MATH_RIBBONS, TIKZ_LIBRARY } from '@/components/latex/StudioTools';

export interface MathSymbolsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
}

export default function MathSymbolsPopover({
  isOpen,
  onClose,
  onInsert,
}: MathSymbolsPopoverProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isTikZTab, setIsTikZTab] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside to close
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start pt-16 pl-4 sm:pl-8 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        ref={popoverRef}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs max-h-[75vh]"
      >
        {/* Popover Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Sigma className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Bảng Ký Hiệu & Mẫu Toán Học LaTeX
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Đóng bảng ký hiệu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
          {MATH_RIBBONS.map((grp, idx) => (
            <button
              key={grp.category}
              type="button"
              onClick={() => {
                setIsTikZTab(false);
                setActiveTab(idx);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                !isTikZTab && activeTab === idx
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-2xs font-bold border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              {grp.category}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsTikZTab(true)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition ${
              isTikZTab
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Shapes className="w-3.5 h-3.5 text-amber-500" />
            <span>Mẫu TikZ ({TIKZ_LIBRARY.length})</span>
          </button>
        </div>

        {/* Symbols Grid / TikZ List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {!isTikZTab ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MATH_RIBBONS[activeTab]?.items.map((item, idx) => {
                let renderedHtml = '';
                try {
                  renderedHtml = katex.renderToString(item.code, {
                    displayMode: false,
                    throwOnError: false,
                  });
                } catch {
                  renderedHtml = `<code>${item.label}</code>`;
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onInsert(`\n${item.code}\n`);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-cyan-500/5 transition flex flex-col justify-between gap-1.5 text-left group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>{item.label}</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 opacity-0 group-hover:opacity-100 transition font-mono">
                        + Chèn
                      </span>
                    </div>
                    <div
                      className="text-xs text-slate-900 dark:text-slate-100 py-1 overflow-x-auto select-none"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                    <code className="text-[10px] text-slate-400 font-mono truncate block">
                      {item.code}
                    </code>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {TIKZ_LIBRARY.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-amber-500/60 transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onInsert(`\n${item.code}\n`);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      + Chèn hình TikZ
                    </button>
                  </div>
                  <pre className="p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] max-h-24 overflow-y-auto leading-relaxed">
                    {item.code}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Bấm vào ký hiệu để chèn ngay vào vị trí con trỏ</span>
          <span className="font-mono text-[10px]">Phím Esc để đóng</span>
        </div>
      </div>
    </div>
  );
}
