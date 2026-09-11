'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Key,
  LogIn,
  UserPlus,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/context/ApiKeyContext';
import { useRenewModal } from '@/context/RenewModalContext';
import WorkspaceBrand from '@/components/header/WorkspaceBrand';
import WorkspaceHeader from '@/components/header/WorkspaceHeader';
import ThemeToggleButton from '@/components/header/ThemeToggleButton';
import UserProfileDropdown from '@/components/header/UserProfileDropdown';
import { checkHasAuthToken } from '@/lib/authClient';

export interface AppHeaderProps {
  badge?: string;
  subtitle?: string;
  className?: string;
}

export default function AppHeader({
  badge,
  subtitle,
  className = '',
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { openApiKeyModal, isCustomKeyActive } = useApiKey();
  const { openRenewModal } = useRenewModal();

  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasToken(checkHasAuthToken());
  }, []);

  // Determine default badge & subtitle based on current route if not explicitly passed
  let resolvedBadge = badge;
  let resolvedSubtitle = subtitle;

  if (!resolvedBadge) {
    if (pathname.startsWith('/geometry')) {
      resolvedBadge = 'AI Visualizer';
      resolvedSubtitle = 'Mô hình hóa hình học & lượng giác THCS / THPT';
    } else if (pathname.startsWith('/lesson-plan') || pathname.startsWith('/soan-giao-an')) {
      resolvedBadge = 'Kế Hoạch Bài Dạy 5512';
      resolvedSubtitle = 'Soạn giáo án tự động theo chuẩn Công văn 5512/BGDĐT';
    } else if (pathname.startsWith('/latex')) {
      resolvedBadge = 'LaTeX Studio';
      resolvedSubtitle = 'Biên soạn tài liệu toán học & xuất bản PDF A4';
    } else {
      resolvedBadge = 'Studio';
      resolvedSubtitle = 'Hệ sinh thái ứng dụng Toán học trực quan';
    }
  }

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <header
      className={`shrink-0 z-30 backdrop-blur-md bg-white/85 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs dark:shadow-xl dark:shadow-slate-950/50 transition-colors ${className}`}
    >
      {/* 1. Left Section: Logo MathAIO, Version Tag, and Navigation Tabs */}
      <div className="flex items-center gap-3">
        <WorkspaceBrand badge={resolvedBadge} subtitle={resolvedSubtitle || ''} />
        <WorkspaceHeader />
      </div>

      {/* 2. Right Section: Gemini Key, Auth / UserProfileDropdown, Theme Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Gemini API Key Configuration Button */}
        <button
          type="button"
          onClick={() => openApiKeyModal()}
          className="h-10 inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 rounded-xl text-xs font-medium border transition-all duration-200 shadow-xs cursor-pointer group shrink-0 bg-gradient-to-r from-purple-50 via-indigo-50/60 to-sky-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100/50 text-purple-900 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-sky-950/40 dark:border-purple-500/30 dark:hover:border-purple-400/60 dark:hover:bg-purple-950/60 dark:text-purple-200 dark:hover:text-white"
          title={
            isCustomKeyActive
              ? 'Đang dùng Gemini Key cá nhân. Bấm để quản lý.'
              : 'Đang dùng Gemini Key hệ thống (Auto). Bấm để nhập Key cá nhân.'
          }
        >
          <Key className="w-3.5 h-3.5 text-purple-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform shrink-0" />
          {isCustomKeyActive ? (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-xs text-purple-900 dark:text-purple-200">
                Key riêng
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200/80 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 uppercase tracking-wide">
                Cá nhân
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-xs text-purple-900 dark:text-purple-200">
                Gemini Key
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200/80 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 uppercase tracking-wide">
                Auto
              </span>
            </div>
          )}
          <span
            className={`w-2 h-2 rounded-full shrink-0 transition-all ${
              isCustomKeyActive
                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-purple-500 dark:bg-indigo-400 shadow-[0_0_6px_rgba(168,85,247,0.4)] dark:shadow-[0_0_6px_rgba(129,140,248,0.7)]'
            }`}
          />
        </button>

        {/* User Auth Section */}
        {!mounted || (hasToken && isLoading && !user) ? (
          <div className="flex items-center gap-2 shrink-0 animate-pulse">
            <div className="h-10 w-9 sm:w-28 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-800/50" />
          </div>
        ) : !user ? (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/login"
              className="h-10 px-3 sm:px-3.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
              title="Đăng nhập tài khoản MathAIO"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
            <Link
              href="/register"
              className="h-10 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
              title="Đăng ký tài khoản nhận 10 Ω Trial"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Đăng ký</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <UserProfileDropdown user={user} onLogout={handleLogout} />
          </div>
        )}

        {/* Theme Toggle Button */}
        <ThemeToggleButton />
      </div>
    </header>
  );
}
