'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ChangelogBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const hasHistory = window.history.length > 1;
      const hasInternalReferrer =
        Boolean(document.referrer) &&
        document.referrer.startsWith(window.location.origin);

      if (hasHistory && hasInternalReferrer) {
        router.back();
        return;
      }
    }
    // Safe fallback if opened directly in a new tab or from an external source
    router.push('/geometry');
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer group"
      aria-label="Quay lại"
    >
      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      <span>Quay lại</span>
    </button>
  );
}
