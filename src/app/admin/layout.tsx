'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, notFound } from 'next/navigation';
import {
  ShieldCheck,
  KeyRound,
  Users,
  History,
  LayoutDashboard,
  Menu,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Compass,
  LogOut,
  X,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import { CHANGELOG } from '@/config/changelog';
import AccountDetailsModal from '@/components/admin/AccountDetailsModal';
import { AdminProvider, useAdminContext } from './AdminContext';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const {
    currentUser,
    authLoading,
    isAdmin,
    keys,
    userAccounts,
    changelogs,
    theme,
    toggleTheme,
    handleLogout,
    selectedAccountModal,
    setSelectedAccountModal,
    toastMsg,
  } = useAdminContext();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 dark:text-cyan-400" />
          <p className="text-xs font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  const role = currentUser?.role?.toLowerCase();
  if (!currentUser || (role !== 'admin' && role !== 'ctv' && role !== 'staff')) {
    notFound();
  }

  const isOverviewActive = pathname === '/admin';
  const isKeysActive = pathname.startsWith('/admin/license-keys');
  const isUsersActive = pathname.startsWith('/admin/users');
  const isChangelogActive = pathname.startsWith('/admin/changelog');

  const pageTitle = isOverviewActive
    ? 'Tổng Quan'
    : isKeysActive
    ? '🔑 License Keys & Định Mức Ω'
    : isUsersActive
    ? '👥 Quản Lý Tài Khoản'
    : isChangelogActive
    ? '📜 Lịch Sử Phiên Bản (Changelog)'
    : 'Bảng Điều Khiển';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 antialiased">
      {/* 1. Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 2. Mobile Drawer Panel (Slide over from left) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#111622] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                  MathAIO
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isAdmin
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'CTV'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Quản trị & Phân quyền
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-6 text-xs">
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Bảng Điều Khiển
            </span>

            <Link
              href="/admin"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                isOverviewActive
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Tổng Quan</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  isOverviewActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                }`}
              />
            </Link>

            <Link
              href="/admin/license-keys"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                isKeysActive
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4" />
                <span>License Keys</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isKeysActive
                      ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {keys.length}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isKeysActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                  }`}
                />
              </div>
            </Link>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Hệ Thống & Phân Quyền
              </span>

              <Link
                href="/admin/users"
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                  isUsersActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Quản lý tài khoản</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isUsersActive
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {userAccounts.length}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isUsersActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                    }`}
                  />
                </div>
              </Link>

              <Link
                href="/admin/changelog"
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                  isChangelogActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4" />
                  <span>Lịch Sử Phiên Bản</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isChangelogActive
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {changelogs.length}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isChangelogActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                    }`}
                  />
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Footer Profile */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] font-mono text-slate-400 truncate">
                @{currentUser.username}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <a
              href="/"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 border border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto bg-white dark:bg-[#111622] border-r border-slate-200 dark:border-slate-800/80 z-30">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                  MathAIO
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isAdmin
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'CTV'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Quản trị & Phân quyền
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-6 text-xs">
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Bảng Điều Khiển
            </span>

            <Link
              href="/admin"
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                isOverviewActive
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Tổng Quan</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  isOverviewActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                }`}
              />
            </Link>

            <Link
              href="/admin/license-keys"
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                isKeysActive
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4" />
                <span>License Keys</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isKeysActive
                      ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {keys.length}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isKeysActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                  }`}
                />
              </div>
            </Link>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Hệ Thống & Phân Quyền
              </span>

              <Link
                href="/admin/users"
                className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                  isUsersActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Quản lý tài khoản</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isUsersActive
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {userAccounts.length}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isUsersActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                    }`}
                  />
                </div>
              </Link>

              <Link
                href="/admin/changelog"
                className={`w-full px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-all duration-150 ${
                  isChangelogActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-600 dark:border-cyan-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4" />
                  <span>Lịch Sử Phiên Bản</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isChangelogActive
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {changelogs.length}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isChangelogActive ? 'opacity-100 text-cyan-500' : 'opacity-0'
                    }`}
                  />
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Footer Profile */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] font-mono text-slate-400 truncate">
                @{currentUser.username}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <a
              href="/"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 border border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 4. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-[#111622]/85 border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 lg:hidden shrink-0"
              title="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-medium text-slate-900 dark:text-slate-200 truncate">
                {isAdmin ? 'Admin Portal' : 'CTV Portal'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-cyan-600 dark:text-cyan-400 capitalize truncate">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Changelog Version Button */}
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              title="Bấm để xem lịch sử phiên bản (Changelog)"
              className="hidden sm:inline-flex text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition items-center gap-1 cursor-pointer shadow-xs"
            >
              <span>{APP_VERSION.fullString}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-amber-400 transition shadow-xs"
              title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </header>

        {/* Main Content Slot */}
        <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-w-0 space-y-6 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/60 py-4 px-4 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto w-full text-xs text-slate-500 dark:text-slate-500 z-10 transition-colors">
          <span>MathAIO Studio &copy; {new Date().getFullYear()} – Hệ thống Quản trị & Nền tảng Toán học All-in-One</span>
          <button
            type="button"
            onClick={() => setIsChangelogOpen(true)}
            title="Bấm để xem lịch sử phiên bản (Changelog)"
            className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            Phiên bản {APP_VERSION.fullString}
          </button>
        </footer>
      </div>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl border border-slate-800 dark:border-slate-200 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Changelog / Version History Modal */}
      {isChangelogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Lịch sử Phiên bản
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nhật ký cập nhật & tính năng mới của MathAIO Studio
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangelogOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Releases List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs">
              {CHANGELOG.map((rel, idx) => (
                <div
                  key={rel.version}
                  className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
                        {rel.version}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          Mới nhất
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {rel.date}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {rel.title}
                  </h4>

                  <ul className="flex flex-col gap-2 pl-1">
                    {rel.changes.map((c, cIdx) => (
                      <li
                        key={cIdx}
                        className="flex items-start gap-2 text-slate-600 dark:text-slate-300 leading-relaxed"
                      >
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                            c.type === 'feat'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : c.type === 'fix'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : c.type === 'improve'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20'
                          }`}
                        >
                          {c.type}
                        </span>
                        <span>{c.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unified Account & VIP Subscription Details Modal */}
      <AccountDetailsModal
        isOpen={selectedAccountModal !== null}
        onClose={() => setSelectedAccountModal(null)}
        data={selectedAccountModal}
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
