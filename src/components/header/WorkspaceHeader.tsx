'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BookOpen } from 'lucide-react';

export function WorkspaceBrand({ badge, subtitle }: { badge: string; subtitle?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" title="Về trang chủ MathAIO">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shadow-cyan-500/20 group-hover:scale-105 transition-transform">
        <Compass className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            MathAIO
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
            {badge}
          </span>
        </div>
        {subtitle && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}

/** Shared module navigation, also embedded in existing workspace headers. */
export default function WorkspaceHeader() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Công cụ MathAIO"
      className="flex flex-wrap items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3 ml-2"
    >
      {[
        { href: '/geometry', label: 'Vẽ hình học', icon: <Compass size={15} /> },
        { href: '/lesson-plan', label: 'Soạn giáo án 5512', icon: <BookOpen size={15} /> },
        { href: '/latex', label: 'LaTeX Studio', icon: <span className="font-serif font-bold text-xs">TeX</span> },
      ].map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname.startsWith(tab.href) ? 'page' : undefined}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
            pathname.startsWith(tab.href)
              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
