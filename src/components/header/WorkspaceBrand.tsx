'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Compass} from 'lucide-react';
import {APP_VERSION} from '@/config/version';

export default function WorkspaceBrand({badge, subtitle}: {badge: string; subtitle: string}) {
  const pathname = usePathname();
  return <>
    <Link href="/" className="flex items-center gap-3 group min-w-0" title="Về Trung Tâm Công Cụ MathAIO">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md dark:shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform"><Compass className="w-6 h-6 text-white" /></div>
      <div className="min-w-0">
        <div className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent tracking-tight flex items-center gap-2">MathAIO
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 tracking-normal">Studio</span>
          <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-semibold tracking-normal">{badge}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </Link>
    <Link href={`/changelog?from=${encodeURIComponent(pathname)}`} title="Bấm để xem lịch sử phiên bản (Changelog)" className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 tracking-normal shadow-xs transition shrink-0">{APP_VERSION.fullString}</Link>
  </>;
}
