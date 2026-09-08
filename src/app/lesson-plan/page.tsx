'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Compass,
  BookOpen,
  Settings,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import LessonPlanView from '@/components/LessonPlanView';
import WorkspaceHeader from '@/components/header/WorkspaceHeader';
import ThemeToggleButton from '@/components/header/ThemeToggleButton';

export default function LessonPlanPage() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="shrink-0 z-30 backdrop-blur-md bg-white/85 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs dark:shadow-xl dark:shadow-slate-950/50 transition-colors print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group" title="Về Trung Tâm Công Cụ MathAIO">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md dark:shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent tracking-tight flex items-center gap-2">
                MathAIO
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 tracking-normal">
                  Studio
                </span>
                <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold tracking-normal">
                  Kế Hoạch Bài Dạy 5512
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Soạn giáo án tự động theo chuẩn Công văn 5512/BGDĐT
              </p>
            </div>
          </Link>
          <Link
            href={pathname ? `/changelog?from=${encodeURIComponent(pathname)}` : '/changelog'}
            title="Bấm để xem lịch sử phiên bản (Changelog)"
            className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 tracking-normal shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <span>{APP_VERSION.fullString}</span>
          </Link>

          {/* Module Navigation Tabs */}
          <WorkspaceHeader />
        </div>

        {/* Header Right Utilities */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
            title="Trang quản trị License & Changelog"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Quản trị</span>
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggleButton />
        </div>
      </header>

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
