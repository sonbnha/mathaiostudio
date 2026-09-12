'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_VERSION } from '@/config/version';

export default function WorkspaceBrand({ badge, subtitle }: { badge: string; subtitle: string }) {
  const pathname = usePathname();
  return (
    <>
      <Link href="/" className="flex items-center gap-3 group min-w-0" title="Về Trung Tâm Công Cụ MathAIO">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
            <rect width="100" height="100" rx="22" fill="#090d16" />
            <rect x="1.5" y="1.5" width="97" height="97" rx="20.5" stroke="#1e293b" strokeWidth="1.5" />
            <g transform="translate(15, 15)">
              <circle cx="35" cy="35" r="32" stroke="#10b981" strokeWidth="3" strokeDasharray="160 40" strokeLinecap="round" opacity="0.9" />
              <circle cx="58" cy="13" r="3.5" fill="#34d399" />
              <line x1="18" y1="20" x2="18" y2="50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="52" y1="20" x2="52" y2="50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M18 50 L35 20 L52 50" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="25" y1="38" x2="45" y2="38" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              <path d="M18 20 L35 38 L52 20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </g>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent tracking-tight flex items-center gap-2">
            MathAIO
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 tracking-normal">Studio</span>
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-semibold tracking-normal">{badge}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </Link>
      <Link href={`/changelog?from=${encodeURIComponent(pathname)}`} title="Bấm để xem lịch sử phiên bản (Changelog)" className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 tracking-normal shadow-xs transition shrink-0">{APP_VERSION.fullString}</Link>
    </>
  );
}
