'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_VERSION } from '@/config/version';
import LessonPlanView from '@/components/LessonPlanView';
import AppHeader from '@/components/header/AppHeader';

export default function LessonPlanPage() {
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Unified Global Header */}
      <AppHeader
        badge="Kế Hoạch Bài Dạy 5512"
        subtitle="Soạn giáo án tự động theo chuẩn Công văn 5512/BGDĐT"
      />

      {/* Main Workspace */}
      <main className="flex-1 min-h-0 w-full px-4 md:px-6 py-3 overflow-hidden flex flex-col">
        <LessonPlanView />
      </main>

      {/* Footer / Status Bar */}
      <footer className="shrink-0 h-8 px-4 md:px-6 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between z-10 print:hidden">
        <div className="flex items-center gap-3">
          <span>MathAIO Studio &copy; {new Date().getFullYear()} – Hệ thống Quản trị & Nền tảng Toán học All-in-One</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:inline">Chuẩn Công văn 5512 BGD&ĐT</span>
          <Link
            href={pathname ? `/changelog?from=${encodeURIComponent(pathname)}` : '/changelog'}
            className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted transition cursor-pointer font-mono"
            title="Xem Changelog"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Engine: Gemini 3.6 Flash
          </span>
        </div>
      </footer>
    </div>
  );
}
