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
  Settings,
  Key,
  Bookmark,
  Cpu,
  Maximize2,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import { useApiKey } from '@/context/ApiKeyContext';
import UserProfileDropdown from '@/components/header/UserProfileDropdown';

export interface AuthenticatedToolsDashboardProps {
  user: any;
  onLogout: () => Promise<void> | void;
}

export default function AuthenticatedToolsDashboard({
  user,
  onLogout,
}: AuthenticatedToolsDashboardProps) {
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

  const handleLogoutClick = async () => {
    await onLogout();
    router.refresh();
  };

  // Role check
  const role = (user?.role || '').toLowerCase();
  const isAdmin = Boolean(role === 'admin' || role === 'superadmin' || user?.is_admin);

  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'Thầy/Cô';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[420px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] bg-indigo-500/10 rounded-full blur-[170px]" />
        <div className="absolute -bottom-20 -left-40 w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-[170px]" />
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
          {/* Badge Gemini Key */}
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

          {/* User Profile Dropdown */}
          <UserProfileDropdown user={user} onLogout={handleLogoutClick} />

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-amber-400 transition shadow-xs cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* Main Hub Content: Minimal Launcher without Hero text (Above-the-fold) */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex flex-col justify-center">
        {/* Minimal Hub Header */}
        <div className="flex items-center justify-between mb-5 pt-1 border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">KHÔNG GIAN LÀM VIỆC • CHỌN CÔNG CỤ ĐỂ BẮT ĐẦU</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Tài khoản:</span>
            <span className="text-slate-300 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {displayName}
            </span>
          </div>
        </div>

        {/* Bento Grid: Right at the top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Card 1: HERO TOOL - Geometry Canvas (2 CỘT: col-span-1 md:col-span-2) */}
          <Link
            href="/geometry"
            className="group relative md:col-span-2 bg-gradient-to-b from-slate-900/60 to-slate-950/80 hover:from-slate-900/80 hover:to-slate-900/90 border border-slate-800/90 hover:border-cyan-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-xl shadow-black/40 hover:shadow-cyan-950/20 flex flex-col justify-between backdrop-blur-sm overflow-hidden"
          >
            {/* Top decorative glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

            <div className="relative z-10 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="text-cyan-400 bg-cyan-950/70 p-2.5 rounded-xl border border-cyan-800/60 group-hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Vẽ Hình Học Trực Quan AI
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Mô hình hóa hình học phẳng, toạ độ giải tích &amp; công thức LaTeX
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                    SVG Dynamic Engine
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-850 text-slate-300 border border-slate-700">
                    {APP_VERSION.version}
                  </span>
                </div>
              </div>

              {/* Interactive Mockup Preview Window */}
              <div className="w-full rounded-xl bg-slate-950/90 border border-slate-800/80 p-3 sm:p-4 shadow-inner relative group/mockup overflow-hidden">
                {/* Mini Canvas Ribbon Toolbar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-850 text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-slate-500 hidden sm:inline">canvas-preview.svg (800 × 520)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    <span className="text-cyan-400 font-semibold">100% Vector</span>
                    <Maximize2 className="w-2.5 h-2.5 text-slate-500 ml-1" />
                  </div>
                </div>

                {/* SVG Mockup Canvas Graphic */}
                <div className="h-40 sm:h-48 w-full flex items-center justify-center relative bg-radial from-slate-900/80 to-slate-950 rounded-lg overflow-hidden border border-slate-900">
                  {/* Grid Lines Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />

                  {/* Geometric SVG Illustration */}
                  <svg
                    viewBox="0 0 400 240"
                    className="w-full h-full max-h-48 relative z-10 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="200" cy="120" r="85" stroke="#38bdf8" strokeWidth="1.75" strokeDasharray="4 3" opacity="0.6" />
                    
                    <polygon
                      points="200,38 122,175 278,175"
                      fill="rgba(6, 182, 212, 0.06)"
                      stroke="#06b6d4"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />

                    <line x1="200" y1="38" x2="200" y2="175" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                    <rect x="200" y="163" width="12" height="12" stroke="#f59e0b" strokeWidth="1.2" fill="none" opacity="0.7" />

                    <circle cx="200" cy="130" r="42" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.8" />
                    <circle cx="200" cy="130" r="3" fill="#ec4899" />
                    <text x="208" y="132" fill="#f472b6" fontSize="10" fontFamily="monospace" fontWeight="bold">I</text>

                    <line x1="200" y1="130" x2="200" y2="172" stroke="#ec4899" strokeWidth="1.2" />
                    <text x="188" y="156" fill="#f472b6" fontSize="9" fontFamily="monospace">r</text>

                    <circle cx="200" cy="38" r="4" fill="#38bdf8" />
                    <text x="195" y="26" fill="#e0f2fe" fontSize="12" fontWeight="bold" fontFamily="sans-serif">A</text>

                    <circle cx="122" cy="175" r="4" fill="#38bdf8" />
                    <text x="105" y="185" fill="#e0f2fe" fontSize="12" fontWeight="bold" fontFamily="sans-serif">B</text>

                    <circle cx="278" cy="175" r="4" fill="#38bdf8" />
                    <text x="286" y="185" fill="#e0f2fe" fontSize="12" fontWeight="bold" fontFamily="sans-serif">C</text>

                    <circle cx="200" cy="175" r="3" fill="#f59e0b" />
                    <text x="194" y="194" fill="#fde68a" fontSize="11" fontWeight="bold" fontFamily="sans-serif">H</text>
                  </svg>

                  {/* Sample Prompt Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] text-slate-300 backdrop-blur-md">
                    <span className="truncate font-mono text-slate-400">
                      Prompt: &quot;Cho tam giác ABC nhọn nội tiếp (O), kẻ đường cao AH...&quot;
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      0.8s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="relative z-10 pt-3.5 mt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                Mở Không Gian Vẽ Canvas →
              </span>
              <span className="text-[11px] font-mono text-slate-500">TikZ &amp; SVG Ready</span>
            </div>
          </Link>

          {/* Bento Card 2: TOOL 2 - Soạn Giáo Án 5512 (1 CỘT: col-span-1) */}
          <Link
            href="/lesson-plan"
            className="group relative col-span-1 bg-gradient-to-b from-slate-900/60 to-slate-950/80 hover:from-slate-900/80 hover:to-slate-900/90 border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-xl shadow-black/40 hover:shadow-emerald-950/20 flex flex-col justify-between backdrop-blur-sm overflow-hidden"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-emerald-400 bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-800/60 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                  Chuẩn 5512 BGD&amp;ĐT
                </span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Soạn Giáo Án Chuẩn 5512
                </h2>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Tự động hóa tiến trình 4 hoạt động dạy học, ma trận đề thi và kế hoạch bài dạy môn Toán.
                </p>
              </div>

              {/* 4-Step Methodology Preview Stack */}
              <div className="space-y-1.5 pt-1">
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>HĐ Khởi động</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Tình huống</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>HĐ Hình thành kiến thức</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400">Định lý + Hình</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>HĐ Luyện tập</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Phiếu bài tập</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300 font-medium">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>HĐ Vận dụng &amp; Mở rộng</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Thực tiễn</span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-3.5 mt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                Soạn Giáo Án Ngay →
              </span>
              <span className="text-[11px] font-mono text-slate-500">Word A4 Sync</span>
            </div>
          </Link>

          {/* Bento Card 3: AI Gemini Flash & LaTeX Engine (Hàng dưới, Cột 1) */}
          <div className="relative bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-amber-400 bg-amber-950/50 p-2 rounded-xl border border-amber-800/50">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60">
                  AI Nano-Speed
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Gemini 3.6 &amp; LaTeX Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Công nghệ suy luận hình học nano-giây, render công thức KaTeX sắc nét và hỗ trợ quét OCR đề thi từ ảnh chụp.
                </p>
              </div>

              {/* Math preview formula snippet */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                <span>S = \frac{1}{2}ab\sin C = pr</span>
                <span className="text-amber-400 font-bold">&lt; 1.2s</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Độ trễ tối ưu</span>
              <span className="text-amber-400/80">KaTeX + MathJax</span>
            </div>
          </div>

          {/* Bento Card 4: Quản Trị Hệ Thống (Nếu là Admin) HOẶC Bộ Sưu Tập Của Tôi (Nếu là User thường) */}
          {isAdmin ? (
            <Link
              href="/admin"
              className="group relative bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-5 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-purple-950/20 flex flex-col justify-between backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-purple-400 bg-purple-950/60 p-2 rounded-xl border border-purple-800/60 group-hover:scale-105 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/80">
                    Super Admin
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                    <span>Cổng Quản Trị Hệ Thống</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Cấp phát License Keys, thiết lập quota người dùng, phân quyền giáo viên và quản lý bản phát hành Changelog.
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Vào Quản Trị →
                </span>
                <span className="text-[10px] font-mono text-slate-500">Admin Portal</span>
              </div>
            </Link>
          ) : (
            <Link
              href="/geometry"
              className="group relative bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-5 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-cyan-950/20 flex flex-col justify-between backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-cyan-400 bg-cyan-950/60 p-2 rounded-xl border border-cyan-800/60 group-hover:scale-105 transition-transform">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                    Cloud Storage
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                    <span>Bộ Sưu Tập Học Liệu Số</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Lưu trữ đám mây các mô hình toán học đã vẽ, đồng bộ tài khoản tự động và mở lại chỉnh sửa tức thì trên mọi thiết bị.
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Xem Bộ Sưu Tập →
                </span>
                <span className="text-[10px] font-mono text-slate-500">Đồng bộ Neon DB</span>
              </div>
            </Link>
          )}

          {/* Bento Card 5: Cộng Đồng Chia Sẻ Giáo Án */}
          <div className="relative bg-slate-900/20 border border-dashed border-slate-800/80 rounded-2xl p-5 opacity-65 flex flex-col justify-between cursor-not-allowed">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-slate-400 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/80">
                  Sắp ra mắt
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-300">
                  Cộng Đồng Chia Sẻ Giáo Án
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Nền tảng mở kết nối giáo viên toàn quốc chia sẻ bài giảng điện tử, tệp hình vẽ SVG và tài liệu giảng dạy.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-500">
              <span>Đang hoàn thiện...</span>
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
