import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative selection:bg-cyan-500 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              MathAIO
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Studio
            </span>
          </div>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-800/50">
        <p>© {new Date().getFullYear()} MathAIO Studio – Nền tảng Toán học All-in-One.</p>
      </footer>
    </div>
  );
}
