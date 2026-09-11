'use client';
import { use } from 'react';
import dynamic from 'next/dynamic';

const LaTeXStudio = dynamic(() => import('@/components/latex/LaTeXStudio'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 gap-3">
      <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold">Đang khởi tạo LaTeX Document Studio…</p>
    </div>
  ),
});

export default function LaTeXWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const endpoint = process.env.LATEX_COMPILER_URL || 'https://latex.ytotech.com/builds/sync';
  let engineLabel = 'XeLaTeX Engine';
  try {
    engineLabel = new URL(endpoint).hostname;
  } catch {}

  return <LaTeXStudio docId={resolvedParams.id} engineLabel={engineLabel} />;
}
