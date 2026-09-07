'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import LandingShowcaseView from '@/components/home/LandingShowcaseView';
import AuthenticatedToolsDashboard from '@/components/home/AuthenticatedToolsDashboard';

/**
 * HubSkeletonLoading: Placeholder tối giản giúp triệt tiêu hiện tượng giật layout (0ms visual shift)
 * khi ứng dụng đang xác thực phiên đăng nhập người dùng từ cookie/token.
 */
function HubSkeletonLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col justify-between">
      {/* Header Skeleton */}
      <header className="w-full border-b border-slate-800/60 bg-slate-950/60 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
          <div className="space-y-1.5 hidden sm:block">
            <div className="w-24 h-4 bg-slate-850 rounded animate-pulse" />
            <div className="w-36 h-3 bg-slate-900 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-28 h-8 rounded-full bg-slate-900 border border-slate-800 animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex flex-col justify-center">
        <div className="h-5 w-64 bg-slate-900 rounded animate-pulse mb-6 border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          <div className="col-span-1 h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          <div className="col-span-1 h-36 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          <div className="col-span-1 h-36 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          <div className="col-span-1 h-36 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="w-full border-t border-slate-800/60 bg-slate-950/60 px-4 sm:px-8 py-3.5 flex items-center justify-between text-xs text-slate-600">
        <div className="w-48 h-3 bg-slate-900 rounded animate-pulse" />
        <div className="w-24 h-3 bg-slate-900 rounded animate-pulse" />
      </footer>
    </div>
  );
}

export default function HomePage() {
  const { user, hasToken, isLoading, logout } = useAuth();
  const isAuthenticated = Boolean(user);

  // 1. Trạng thái xác thực đang tải và có token cần kiểm tra
  if (isLoading && hasToken && !user) {
    return <HubSkeletonLoading />;
  }

  // 2. Nhánh Giao Diện 2: Người dùng ĐÃ ĐĂNG NHẬP -> Bento App Launcher tối giản, loại bỏ hero text
  if (isAuthenticated && user) {
    return <AuthenticatedToolsDashboard user={user} onLogout={logout} />;
  }

  // 3. Nhánh Giao Diện 1: Khách CHƯA ĐĂNG NHẬP -> Landing Showcase đầy đủ (Scrollable Sections)
  return <LandingShowcaseView />;
}
