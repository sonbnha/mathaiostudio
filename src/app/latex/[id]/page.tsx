'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LaTeXSubrouteRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams?.id) {
      router.replace(`/latex?id=${encodeURIComponent(resolvedParams.id)}`);
    } else {
      router.replace('/latex');
    }
  }, [resolvedParams, router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 gap-3">
      <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold">Đang chuyển tiếp tới không gian LaTeX Studio…</p>
    </div>
  );
}
