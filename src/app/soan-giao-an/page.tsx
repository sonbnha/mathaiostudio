'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacySoanGiaoAnPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/lesson-plan');
  }, [router]);

  return null;
}
