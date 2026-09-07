'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  BookOpen,
  Sun,
  Moon,
  Sparkles,
  LogIn,
  UserPlus,
  Key,
  ArrowRight,
  Maximize2,
  FileText,
  Check,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import { useApiKey } from '@/context/ApiKeyContext';

export default function LandingShowcaseView() {
  const pathname = usePathname();
  const { openApiKeyModal, isCustomKeyActive } = useApiKey();
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-[160px]" />
        <div className="absolute top-[800px] -right-40 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[180px]" />
        <div className="absolute top-[1800px] -left-40 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Top Header Bar for Guests */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  MathAIO
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hệ Sinh Thái Ứng Dụng Toán Học Trực Quan
              </p>
            </div>
          </Link>

          <Link
            href={pathname ? `/changelog?from=${encodeURIComponent(pathname)}` : '/changelog'}
            title="Xem nhật ký phát hành (Changelog)"
            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-indigo-400 border border-slate-800 hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
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

          {/* Guest Auth Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold items-center gap-1.5 transition shadow-sm shadow-indigo-500/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký miễn phí</span>
            </Link>
          </div>

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

      {/* MAIN SCROLLABLE SECTIONS */}
      <main className="relative z-10 w-full flex flex-col">
        {/* PHÂN TẦNG 1: HERO SECTION & CENTRAL OVERVIEW MOCKUP */}
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>KIẾN TRÚC TOÁN HỌC THẾ HỆ MỚI • CHUẨN ĐỔI MỚI GIÁO DỤC</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Số Hóa Không Gian Giảng Dạy &amp; Biên Soạn Toán Học Chuyên Sâu
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl leading-relaxed text-balance mb-8">
            Nền tảng All-in-One tích hợp AI giải tích: tự động dựng hình vẽ SVG hình học động, biên dịch công thức LaTeX chuẩn xác và số hóa giáo án môn Toán theo Công văn 5512 BGD&amp;ĐT.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              href="/geometry"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Khám Phá Canvas Hình Học</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
            <Link
              href="/lesson-plan"
              className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 border border-slate-700/80 hover:border-emerald-500/50 font-medium text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Soạn Giáo Án Chuẩn 5512</span>
            </Link>
          </div>

          {/* Central Hero Studio Mockup Window */}
          <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-2 sm:p-3 shadow-2xl shadow-indigo-950/40 relative">
            <div className="rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden">
              {/* Studio Window Titlebar */}
              <div className="h-10 bg-slate-900/90 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-slate-300 font-sans hidden sm:inline">
                    MathAIO Studio Workspace — Unified Engine
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 text-[10px]">
                    Gemini 3.6 Flash Active
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px]">
                    CV 5512 Synced
                  </span>
                </div>
              </div>

              {/* Window Content: 2-Sided Integrated Split Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
                {/* Left side: Canvas SVG Graphic Preview */}
                <div className="md:col-span-7 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative bg-radial from-slate-900/60 to-slate-950">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                      <Compass className="w-4 h-4" />
                      Dynamic Vector Canvas
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Auto Coordinate Solving</span>
                  </div>

                  {/* SVG Illustration */}
                  <div className="my-4 h-52 flex items-center justify-center">
                    <svg
                      viewBox="0 0 360 200"
                      className="w-full h-full max-h-52 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Circumcircle */}
                      <circle cx="180" cy="100" r="75" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                      
                      {/* Triangle */}
                      <polygon
                        points="180,28 110,150 250,150"
                        fill="rgba(6, 182, 212, 0.08)"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />

                      {/* Altitude */}
                      <line x1="180" y1="28" x2="180" y2="150" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                      <rect x="180" y="138" width="10" height="10" stroke="#f59e0b" strokeWidth="1.2" fill="none" opacity="0.8" />

                      {/* Inscribed Circle */}
                      <circle cx="180" cy="110" r="38" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle cx="180" cy="110" r="3" fill="#ec4899" />
                      <text x="186" y="112" fill="#f472b6" fontSize="10" fontFamily="monospace" fontWeight="bold">I</text>

                      {/* Vertex Points & Labels */}
                      <circle cx="180" cy="28" r="3.5" fill="#38bdf8" />
                      <text x="176" y="18" fill="#e0f2fe" fontSize="11" fontWeight="bold">A</text>
                      <circle cx="110" cy="150" r="3.5" fill="#38bdf8" />
                      <text x="96" y="158" fill="#e0f2fe" fontSize="11" fontWeight="bold">B</text>
                      <circle cx="250" cy="150" r="3.5" fill="#38bdf8" />
                      <text x="256" y="158" fill="#e0f2fe" fontSize="11" fontWeight="bold">C</text>
                      <circle cx="180" cy="150" r="2.5" fill="#f59e0b" />
                      <text x="176" y="168" fill="#fde68a" fontSize="10" fontWeight="bold">H</text>
                    </svg>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px] truncate">
                      Prompt: &quot;Vẽ tam giác ABC nội tiếp (O), kẻ đường cao AH...&quot;
                    </span>
                    <span className="text-cyan-400 font-mono text-[10px] font-bold shrink-0 ml-2">
                      Ready in 0.9s
                    </span>
                  </div>
                </div>

                {/* Right side: Lesson Plan Document Preview */}
                <div className="md:col-span-5 p-6 flex flex-col justify-between bg-slate-950/80">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <BookOpen className="w-4 h-4" />
                      Kế Hoạch Bài Dạy 5512
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Môn Toán THPT</span>
                  </div>

                  {/* Document structured steps mockup */}
                  <div className="my-4 space-y-2.5 text-left">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="text-[10px] font-mono text-cyan-400 font-bold mb-0.5">HOẠT ĐỘNG 1: KHỞI ĐỘNG</div>
                      <div className="text-slate-200 font-medium text-xs">Đặt tình huống tính khoảng cách trong thực tế</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-indigo-500/30 text-xs shadow-sm shadow-indigo-950/30">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-0.5">HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC</div>
                      <div className="text-slate-200 font-medium text-xs">Chứng minh định lý &amp; Quan sát mô hình Canvas</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="text-[10px] font-mono text-emerald-400 font-bold mb-0.5">HOẠT ĐỘNG 3: LUYỆN TẬP</div>
                      <div className="text-slate-200 font-medium text-xs">Phiếu học tập 4 câu trắc nghiệm &amp; tự luận</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="text-[10px] font-mono text-amber-400 font-bold mb-0.5">HOẠT ĐỘNG 4: VẬN DỤNG</div>
                      <div className="text-slate-200 font-medium text-xs">Giải quyết bài toán đo đạc thực địa</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-850 pt-3">
                    <span>Đồng bộ 2 chiều Canvas</span>
                    <span className="text-emerald-400 font-semibold font-mono">Xuất .DOCX Chuẩn A4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PHÂN TẦNG 2: DEEP-DIVE SECTION - HÌNH HỌC SVG */}
        <section className="w-full py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Core Capabilities */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DEEP-DIVE • GEOMETRY CANVAS</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Trực Quan Hóa Hình Học Phẳng &amp; Lượng Giác Bằng Vector Thuần
                </h2>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Chỉ cần mô tả bài toán bằng ngôn ngữ tự nhiên, hệ thống tự động giải tích toạ độ chính xác, vẽ đường phụ, góc vuông và đặt nhãn điểm thông minh.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Giải tích toạ độ &amp; Quan hệ hình học chính xác</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Tự động giải hệ phương trình toạ độ cho tâm đường tròn, tiếp tuyến, trực tâm và trọng tâm.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Công thức toán học KaTeX tích hợp</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Render nhãn góc, độ dài cạnh, ký hiệu vuông góc và công thức lượng giác đồng bộ.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Xuất file đa định dạng</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Xuất Vector SVG độ nét cao, PNG trong suốt cho Word/PowerPoint và code TikZ cho tài liệu LaTeX.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/geometry"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all hover:translate-x-1"
                  >
                    <span>Trải Nghiệm Canvas Hình Học</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Large Canvas Mockup */}
              <div className="lg:col-span-6 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl">
                <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-850 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="font-semibold text-slate-200">Canvas Live Preview</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">TikZ Ready</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Export PNG</span>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full rounded-lg bg-slate-900/40 border border-slate-850 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                    
                    <svg viewBox="0 0 400 240" className="w-full h-full max-h-64 relative z-10 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <line x1="40" y1="200" x2="360" y2="200" stroke="#475569" strokeWidth="1" />
                      <line x1="60" y1="220" x2="60" y2="20" stroke="#475569" strokeWidth="1" />
                      <path d="M 70,30 Q 180,210 330,30" stroke="#818cf8" strokeWidth="2.5" fill="none" />
                      <line x1="100" y1="180" x2="280" y2="60" stroke="#06b6d4" strokeWidth="1.75" />
                      <circle cx="190" cy="120" r="4" fill="#38bdf8" />
                      <text x="198" y="118" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">M(x₀, y₀)</text>
                      <path d="M 120,160 Q 180,210 240,160 Z" fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 2" />
                      <text x="165" y="180" fill="#a5b4fc" fontSize="10" fontFamily="monospace">S = ∫ f(x)dx</text>
                    </svg>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-300 font-mono text-[11px]">
                      Hàm số &amp; Tiếp tuyến: y = x² - 4x + 3 tại điểm M
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">100% Vector SVG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PHÂN TẦNG 3: DEEP-DIVE SECTION - SOẠN GIÁO ÁN CHUẨN 5512 */}
        <section className="w-full py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Lesson Plan Document Mockup */}
              <div className="lg:col-span-6 order-2 lg:order-1 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl">
                <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-850 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-slate-200">GiaoAn_HinhHoc_10_5512.docx</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                      Chuẩn BGD&amp;ĐT
                    </span>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-855 space-y-3 text-left">
                    <div className="border-b border-slate-800 pb-2">
                      <div className="text-[11px] font-bold text-white uppercase">KẾ HOẠCH BÀI DẠY (GIÁO ÁN TOÁN 10)</div>
                      <div className="text-[10px] text-slate-400">BÀI: ĐỊNH LÝ CÔSIN VÀ ĐỊNH LÝ SIN TRONG TAM GIÁC</div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="text-emerald-400 font-bold font-mono text-[10px] block">I. MỤC TIÊU BÀI DẠY</span>
                        <span className="text-slate-300 text-[11px]">Năng lực toán học: Thiết lập và áp dụng định lý côsin để giải tam giác và giải quyết tình huống thực tiễn.</span>
                      </div>

                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="text-indigo-400 font-bold font-mono text-[10px] block">II. THIẾT BỊ DẠY HỌC &amp; HỌC LIỆU</span>
                        <span className="text-slate-300 text-[11px]">Máy chiếu, mô hình hình học động MathAIO Studio SVG, phiếu học tập nhóm.</span>
                      </div>

                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="text-cyan-400 font-bold font-mono text-[10px] block">III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG 5512)</span>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-[10px] text-slate-300 font-mono">
                          <span className="bg-slate-900 p-1 rounded border border-slate-800">1. HĐ Khởi Động</span>
                          <span className="bg-slate-900 p-1 rounded border border-slate-800">2. HĐ Hình Thành KT</span>
                          <span className="bg-slate-900 p-1 rounded border border-slate-800">3. HĐ Luyện Tập</span>
                          <span className="bg-slate-900 p-1 rounded border border-slate-800">4. HĐ Vận Dụng</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="text-[11px]">Phân định rõ HĐ Giáo viên vs Học sinh</span>
                    <span className="text-emerald-400 font-semibold font-mono text-[11px]">Xuất Word 1-Click</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Narrative */}
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DEEP-DIVE • LESSON PLAN 5512</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Tự Động Hóa Soạn Kế Hoạch Bài Dạy Chuẩn Công Văn 5512
                </h2>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Tiết kiệm hàng giờ soạn bài mỗi tuần. Hệ thống tự động cấu trúc chuẩn 4 hoạt động dạy học, phân định rõ sản phẩm học sinh, câu hỏi gợi mở của giáo viên và tích hợp hình vẽ trực quan.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Chuẩn 100% Cấu Trúc Khung 5512</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Mục tiêu (Kiến thức, Năng lực, Phẩm chất), Thiết bị học liệu và 4 hoạt động bài dạy hoàn chỉnh.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Tích hợp hình vẽ &amp; Bổ sung vào Canvas tức thì</h4>
                      <p className="text-xs text-slate-400 mt-0.5">1-click chuyển mọi hình minh họa trong giáo án sang không gian vẽ để tinh chỉnh toạ độ theo ý muốn.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Xuất file Word (.docx) định dạng in ấn</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Tải tệp Word chuẩn căn lề A4, font Times New Roman hoặc Cambria Math, sẵn sàng nộp tổ chuyên môn.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/lesson-plan"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all hover:translate-x-1"
                  >
                    <span>Soạn Giáo Án 5512 Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PHÂN TẦNG 4: TECH SPECS, STATS & FINAL CTA */}
        <section className="w-full py-20 border-t border-slate-800/60 bg-slate-950 text-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto mb-14">
              <h3 className="text-xs font-mono font-semibold text-indigo-400 tracking-wider uppercase mb-2">
                HỆ THỐNG NANO-ENGINE THẾ HỆ MỚI
              </h3>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Chỉ Số Hiệu Năng &amp; Năng Lực Cốt Lõi
              </h2>
            </div>

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono mb-1">&lt; 1.2s</div>
                <div className="text-xs font-bold text-white mb-1">Tốc Độ Sinh AI</div>
                <p className="text-[11px] text-slate-400">Gemini 3.6 Flash độ trễ cực thấp</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mb-1">100%</div>
                <div className="text-xs font-bold text-white mb-1">Chuẩn BGD&amp;ĐT</div>
                <p className="text-[11px] text-slate-400">Tuân thủ triệt để khung 5512</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono mb-1">0ms</div>
                <div className="text-xs font-bold text-white mb-1">Độ Trễ Render SVG</div>
                <p className="text-[11px] text-slate-400">Vector thuần không vỡ nét khi in</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mb-1">∞ Ω</div>
                <div className="text-xs font-bold text-white mb-1">Hạn Ngạch Giáo Viên</div>
                <p className="text-[11px] text-slate-400">Hỗ trợ tối đa cho nhà giáo</p>
              </div>
            </div>

            {/* Bottom Final CTA Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900/40 border border-indigo-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Sẵn Sàng Nâng Tầm Tiết Học Toán Học Của Bạn?
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Bắt đầu ngay hôm nay với công cụ dựng hình SVG và soạn giáo án trực quan hoàn toàn miễn phí.
                </p>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/geometry"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
                  >
                    Mở Canvas Hình Học
                  </Link>
                  <Link
                    href="/lesson-plan"
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
                  >
                    Soạn Giáo Án 5512
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Status Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>MathAIO Studio &copy; {new Date().getFullYear()} – Hệ thống Quản trị &amp; Nền tảng Toán học All-in-One</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline">Chuẩn Công văn 5512 BGD&amp;ĐT</span>
          <Link
            href={pathname ? `/changelog?from=${encodeURIComponent(pathname)}` : '/changelog'}
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
