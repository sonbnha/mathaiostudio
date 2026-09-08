'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LandingShowcaseView from '@/components/home/LandingShowcaseView';
import AuthenticatedToolsDashboard from '@/components/home/AuthenticatedToolsDashboard';

/**
 * HomeLoadingSkeleton: Khung xương Bento Grid tối giản khớp 100% với giao diện Hub đã đăng nhập,
 * triệt tiêu hoàn toàn hiện tượng nháy màn hình (Flash of Unauthenticated Content - FOUC)
 * khi người dùng reload (F5 / Cmd+R) hoặc Next.js đang hydrate.
 */
function HomeLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Header Skeleton đồng bộ */}
      <div className="w-full border-b border-slate-200 dark:border-slate-800/60 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 animate-pulse" />
          <div className="space-y-1.5 hidden sm:block">
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-900 rounded animate-pulse" />
            <div className="w-36 h-3 bg-slate-200/80 dark:bg-slate-900/80 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-24 h-8 rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 animate-pulse" />
        </div>
      </div>

      {/* Bento Launcher Skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full animate-pulse space-y-5">
        <div className="h-4 w-56 bg-slate-200 dark:bg-slate-900 rounded-md" />
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 h-72 bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl" />
            <div className="md:col-span-1 h-72 bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-36 bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl" />
            <div className="h-36 bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Chặn toàn bộ render Landing nếu chưa hoàn tất hydrate HOẶC auth đang đọc session/token
  if (!mounted || isLoading) {
    return <HomeLoadingSkeleton />;
  }

  // 2. Sau khi ĐÃ XÁC ĐỊNH CHẮC CHẮN: Người dùng đã đăng nhập -> Bento Grid
  if (isAuthenticated && user) {
    return <AuthenticatedToolsDashboard user={user} onLogout={logout} />;
  }

  // 3. Chỉ khi chắc chắn 100% là khách vãng lai -> Landing Showcase đầy đủ
  return <LandingShowcaseView />;
}
