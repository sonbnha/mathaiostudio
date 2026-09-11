'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Key,
  LogIn,
  UserPlus,
  Home,
  ChevronRight,
  Compass,
  FileCode,
  BookOpen,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/context/ApiKeyContext';
import WorkspaceBrand from '@/components/header/WorkspaceBrand';
import ThemeToggleButton from '@/components/header/ThemeToggleButton';
import UserProfileDropdown from '@/components/header/UserProfileDropdown';
import { checkHasAuthToken } from '@/lib/authClient';
import { APP_VERSION } from '@/config/version';

export interface AppHeaderProps {
  badge?: string;
  subtitle?: string;
  className?: string;
  docTitle?: string;
  onDocTitleChange?: (newTitle: string) => void;
  saveStatus?: 'saved' | 'saving' | 'unsaved' | string;
  saveStatusLabel?: string;
  toolType?: 'geometry' | 'latex' | 'lesson-plan' | string;
  toolName?: string;
  toolIcon?: React.ReactNode;
  extraRight?: React.ReactNode;
}

export default function AppHeader({
  badge,
  subtitle,
  className = '',
  docTitle,
  onDocTitleChange,
  saveStatus = 'saved',
  saveStatusLabel,
  toolType,
  toolName,
  toolIcon,
  extraRight,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { openApiKeyModal, isCustomKeyActive } = useApiKey();

  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localDocTitle, setLocalDocTitle] = useState(docTitle || '');

  useEffect(() => {
    setMounted(true);
    setHasToken(checkHasAuthToken());
  }, []);

  useEffect(() => {
    if (docTitle !== undefined) {
      setLocalDocTitle(docTitle);
    }
  }, [docTitle]);

  const isHome = pathname === '/' || pathname === '/landing';

  // Determine tool information for workspace breadcrumb
  let currentToolType = toolType;
  if (!currentToolType) {
    if (pathname.startsWith('/geometry')) currentToolType = 'geometry';
    else if (pathname.startsWith('/latex')) currentToolType = 'latex';
    else if (pathname.startsWith('/lesson-plan') || pathname.startsWith('/soan-giao-an')) currentToolType = 'lesson-plan';
  }

  let currentToolName = toolName;
  let currentToolIcon = toolIcon;
  let defaultPlaceholder = 'Tài liệu chưa đặt tên';

  if (currentToolType === 'geometry') {
    currentToolName = currentToolName || 'Hình học';
    currentToolIcon = currentToolIcon || <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
    defaultPlaceholder = 'Hình vẽ chưa đặt tên';
  } else if (currentToolType === 'latex') {
    currentToolName = currentToolName || 'LaTeX Studio';
    currentToolIcon = currentToolIcon || <FileCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    defaultPlaceholder = 'Tài liệu LaTeX';
  } else if (currentToolType === 'lesson-plan') {
    currentToolName = currentToolName || 'Giáo án 5512';
    currentToolIcon = currentToolIcon || <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    defaultPlaceholder = 'Kế hoạch bài dạy';
  }

  // Determine default badge & subtitle for home hub view
  let resolvedBadge = badge || 'Workspace Hub';
  let resolvedSubtitle = subtitle || 'Trung tâm Quản lý Dự án & Hệ sinh thái Toán học';

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <header
      className={`shrink-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-colors ${className}`}
    >
      {/* 1. Left Section */}
      {isHome ? (
        /* HOME VIEW: Clean MathAIO Brand Logo + Version & Hub Badge */
        <div className="flex items-center gap-3">
          <WorkspaceBrand badge={resolvedBadge} subtitle={resolvedSubtitle} />
        </div>
      ) : (
        /* WORKSPACE VIEW: Context-aware Breadcrumb (Trang chủ -> Tool -> Inline Title -> Status) */
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-full">
          {/* Mini Brand / Home Link */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 px-2 py-1 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            title="Về Trung tâm Dự án Trang chủ"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                MathAIO
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                Trang chủ
              </span>
            </div>
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />

          {/* Tool Category Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
            {currentToolIcon}
            <span className="hidden xs:inline sm:inline">{currentToolName}</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />

          {/* Inline Editable Document Title */}
          <div className="relative flex items-center min-w-0 max-w-[150px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-[300px] lg:max-w-[380px] group">
            <input
              type="text"
              value={docTitle !== undefined ? docTitle : localDocTitle}
              onChange={(e) => {
                const val = e.target.value;
                setLocalDocTitle(val);
                onDocTitleChange?.(val);
              }}
              placeholder={defaultPlaceholder}
              className="w-full font-bold text-xs bg-slate-100/70 hover:bg-slate-200/60 focus:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-700/60 dark:focus:bg-slate-950 border border-slate-200/70 focus:border-cyan-500 dark:border-slate-700/70 dark:focus:border-cyan-500 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 truncate transition focus:outline-none shadow-2xs cursor-text"
              title="Click để sửa tên tệp trực tiếp (tự động đồng bộ)"
            />
          </div>

          {/* Save Status Cloud Badge */}
          <div className="hidden sm:flex items-center shrink-0">
            {saveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="hidden md:inline">Đang lưu</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40"
                title="Đã lưu vào bộ nhớ trình duyệt"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline">{saveStatusLabel || 'Đã lưu'}</span>
              </span>
            )}
          </div>

          {/* Changelog Version Link */}
          <Link
            href={`/changelog?from=${encodeURIComponent(pathname)}`}
            title="Xem Changelog"
            className="hidden xl:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition shrink-0"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>
      )}

      {/* 2. Middle Spacer: Flexible space without center tabs */}
      <div className="flex-1 min-w-0" />

      {/* 3. Right Section: Extra actions + Gemini Key + Auth / UserProfileDropdown + Theme Toggle */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Extra workspace actions (e.g. Guest License Badges) */}
        {extraRight}

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
                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(160,185,129,0.7)] animate-pulse'
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
