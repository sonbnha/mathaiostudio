'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  BookOpen,
  Shield,
  Users,
  Sun,
  Moon,
  Sparkles,
  LogIn,
  UserPlus,
  Settings,
  Key,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/context/ApiKeyContext';
import UserProfileDropdown from '@/components/header/UserProfileDropdown';

export default function HomePage() {
  const { user, isLoading, logout } = useAuth();
  const { openApiKeyModal, isCustomKeyActive } = useApiKey();
  const router = useRouter();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Sync theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  // Role check
  const role = (user?.role || '').toLowerCase();
  const isAdmin = Boolean(role === 'admin' || role === 'superadmin' || user?.is_admin);

  // Quota & VIP status calculation
  const isVip = Boolean(
    isAdmin ||
    user?.isVip ||
    user?.is_vip ||
    (user?.remainingCredits !== undefined && (user.remainingCredits === 'Vô hạn' || user.remainingCredits === -1))
  );

  const displayCredits = isAdmin
    ? '∞ Ω'
    : user?.remainingCredits !== undefined
    ? user.remainingCredits === -1 || user.remainingCredits === 'Vô hạn'
      ? '∞ Ω'
      : `${user.remainingCredits} Ω`
    : '10 Ω';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] bg-indigo-500/5 rounded-full blur-[160px]" />
        <div className="absolute -bottom-20 -left-40 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-30 w-full border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  MathAIO
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hệ Sinh Thái Ứng Dụng Toán Học Trực Quan
              </p>
            </div>
          </Link>

          <Link
            href="/changelog"
            title="Xem nhật ký phát hành (Changelog)"
            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
          >
            <span>{APP_VERSION.fullString}</span>
          </Link>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Badge Gemini Key (Đồng bộ với /geometry) */}
          <button
            type="button"
            onClick={() => openApiKeyModal()}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-slate-300 bg-slate-900 border border-slate-700/80 hover:border-slate-600 shrink-0 shadow-xs transition cursor-pointer"
            title="Cấu hình Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{isCustomKeyActive ? 'Gemini Key Cá nhân' : 'Gemini Key AUTO'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
          </button>

          {/* Nút "Quản trị": CHỈ HIỂN THỊ KHI isAdmin === true */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition text-xs flex items-center gap-1.5"
              title="Cổng quản trị hệ thống"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Quản trị</span>
            </Link>
          )}

          {/* User Auth Section */}
          {isLoading && !user ? (
            <div className="h-10 w-24 bg-slate-850 rounded-2xl animate-pulse" />
          ) : !user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium items-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Đăng ký</span>
              </Link>
            </div>
          ) : (
            <UserProfileDropdown user={user} onLogout={handleLogout} />
          )}

          {/* Theme Toggle (Nút bo tròn cạnh cụm tài khoản) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-amber-400 transition shadow-xs"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* Main Hub Content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full flex flex-col justify-center">
        {/* Hero Section */}
        <div className="mb-10 text-left">
          <div className="cyan font-mono text-xs px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 inline-flex items-center gap-1.5 mb-3 text-cyan-400">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>MATHAIO ECOSYSTEM • TRUNG TÂM CÔNG CỤ</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Không Gian Sáng Tạo &amp; Giảng Dạy Toán Học
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed text-balance">
            Truy cập nhanh các ứng dụng chuyên biệt hỗ trợ trực quan hóa hình học, biên soạn giáo án chuẩn hóa và quản trị hệ thống.
          </p>
        </div>

        {/* Tool Cards Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 - Vẽ Hình Học (SVG Canvas) */}
          <Link
            href="/geometry"
            className="group relative bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-cyan-950/20 flex flex-col justify-between backdrop-blur-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-cyan-400 bg-cyan-950/60 p-3 rounded-xl border border-cyan-800/60 group-hover:scale-105 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                  {APP_VERSION.version}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                  <span>Vẽ Hình Học Trực Quan</span>
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  Mô hình hóa hình học phẳng &amp; lượng giác THCS/THPT, hỗ trợ quét SVG, gán nhãn điểm thông minh và công thức LaTeX.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Mở Canvas →
              </span>
              <span className="text-[10px] font-mono text-slate-500">AI Visualizer</span>
            </div>
          </Link>

          {/* Card 2 - Soạn Giáo Án 5512 */}
          <Link
            href="/lesson-plan"
            className="group relative bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-emerald-950/20 flex flex-col justify-between backdrop-blur-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-emerald-400 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/60 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                  BGD&amp;ĐT
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                  <span>Soạn Giáo Án Chuẩn 5512</span>
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  Tự động hóa xây dựng tiến trình bài dạy, ma trận đề thi và kế hoạch bài dạy môn Toán theo khung chuẩn công văn 5512.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Soạn ngay →
              </span>
              <span className="text-[10px] font-mono text-slate-500">Word A4 Sync</span>
            </div>
          </Link>

          {/* Card 3 - Cổng Quản Trị (Admin Portal) - CHỈ HIỂN THỊ KHI isAdmin === true */}
          {isAdmin && (
            <Link
              href="/admin"
              className="group relative bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-purple-950/20 flex flex-col justify-between backdrop-blur-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-purple-400 bg-purple-950/60 p-3 rounded-xl border border-purple-800/60 group-hover:scale-105 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/80">
                    Admin
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                    <span>Cổng Quản Trị Hệ Thống</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    Quản lý tài khoản, cấp phát License Key, phân quyền giáo viên và quản lý xuất bản Changelog.
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Vào quản trị →
                </span>
                <span className="text-[10px] font-mono text-slate-500">Super Admin</span>
              </div>
            </Link>
          )}

          {/* Card 4 - Cộng Đồng Chia Sẻ Giáo Án (Placeholder mở rộng) */}
          <div className="relative bg-slate-900/20 border border-dashed border-slate-800/80 rounded-2xl p-6 opacity-60 flex flex-col justify-between cursor-not-allowed">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-slate-400 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/80">
                  Sắp ra mắt
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-300">
                  Cộng Đồng Chia Sẻ Giáo Án
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">
                  Nền tảng mở kết nối giáo viên toàn quốc chia sẻ bài giảng điện tử, tệp hình vẽ SVG và tài liệu giảng dạy.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/40 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Đang phát triển...
              </span>
              <span className="text-[10px] font-mono text-slate-600">Community</span>
            </div>
          </div>
        </div>
      </main>

      {/* Status Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/60 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>MathAIO Studio &copy; {new Date().getFullYear()} – Hệ thống Quản trị &amp; Nền tảng Toán học All-in-One</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline">Chuẩn Công văn 5512 BGD&amp;ĐT</span>
          <Link
            href="/changelog"
            className="hover:text-cyan-400 underline decoration-dotted transition font-mono"
            title="Xem Changelog"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AI Engine: Gemini 3.6 Flash</span>
        </div>
      </footer>
    </div>
  );
}
