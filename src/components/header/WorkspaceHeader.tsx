'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BookOpen } from 'lucide-react';

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
      ].map((tab) => {
        const isActive =
          tab.href === '/geometry'
            ? pathname === '/geometry'
            : tab.href === '/lesson-plan'
            ? pathname.startsWith('/lesson-plan') || pathname.startsWith('/soan-giao-an')
            : pathname.startsWith('/latex');

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
