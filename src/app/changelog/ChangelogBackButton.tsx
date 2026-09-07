'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ChangelogBackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from');

  const handleBack = () => {
    // Ưu tiên 1: Route nguồn từ tham số ?from=
    const decoded = fromPath ? decodeURIComponent(fromPath) : '';
    if ((fromPath && fromPath.startsWith('/')) || (decoded && decoded.startsWith('/'))) {
      router.push(decoded.startsWith('/') ? decoded : fromPath!);
      return;
    }

    // Ưu tiên 2: Lịch sử trình duyệt nếu có
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
      return;
    }

    // Fallback an toàn về Trang chủ (/)
    router.push('/');
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer group"
      aria-label="Quay lại"
    >
      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>Quay lại</span>
    </button>
  );
}
