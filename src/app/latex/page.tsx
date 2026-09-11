'use client';
import dynamic from 'next/dynamic';

const LaTeXDashboard = dynamic(() => import('@/components/latex/LaTeXDashboard'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 gap-3">
      <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold">Đang tải Trung Tâm Quản Lý Dự Án LaTeX…</p>
    </div>
  ),
});

export default function LaTeXPage() {
  return <LaTeXDashboard />;
}
