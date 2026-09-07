'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ScrollText, Sparkles } from 'lucide-react';

export default function ShowcaseViewSwitcher() {
  const pathname = usePathname();
  const isBento = pathname === '/' || pathname === '';
  const isScrollable = pathname === '/landing';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/90 hover:bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-cyan-950/40 backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all">
        {/* Label Tag Staging */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-400 border-r border-slate-700/80 mr-0.5">
          <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>STAGING PREVIEW</span>
        </div>

        {/* Option 1: Bento Grid Mode */}
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            isBento
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Chuyển sang biến thể Bento Grid Hub"
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
          <span>Bento Grid</span>
        </Link>

        {/* Option 2: Scrollable Sections Mode */}
        <Link
          href="/landing"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            isScrollable
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Chuyển sang biến thể Scrollable Sections Landing"
        >
          <ScrollText className="w-3.5 h-3.5 shrink-0" />
          <span>Scrollable Landing</span>
        </Link>
      </div>
    </div>
  );
}
