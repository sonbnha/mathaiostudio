'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  BookOpen,
  Sparkles,
  LogIn,
  UserPlus,
  Key,
  ArrowRight,
  Maximize2,
  FileText,
  Check,
  Zap,
  Layers,
  Globe,
  Shield,
  Download,
  Code,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import { useApiKey } from '@/context/ApiKeyContext';
import ThemeToggleButton from '@/components/header/ThemeToggleButton';

export default function LandingShowcaseView() {
  const pathname = usePathname();
  const { openApiKeyModal, isCustomKeyActive } = useApiKey();
  const [activeCanvasTab, setActiveCanvasTab] = useState<'visual' | 'print'>('visual');

  const changelogUrl = pathname ? `/changelog?from=${encodeURIComponent(pathname)}` : '/changelog';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 flex flex-col justify-between relative overflow-x-hidden transition-colors duration-200">
      {/* Background Lighting Gradients (Linear/Raycast Ambient Glow) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-indigo-500/10 to-transparent rounded-full blur-[160px]" />
        <div className="absolute top-[800px] -right-40 w-[650px] h-[650px] bg-cyan-500/5 rounded-full blur-[180px]" />
        <div className="absolute top-[1800px] -left-40 w-[650px] h-[650px] bg-indigo-500/5 rounded-full blur-[180px]" />
      </div>

      {/* 1. Header Khách Vãng Lai (Guest Navigation Glassmorphism) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                <rect width="100" height="100" rx="22" fill="#090d16" />
                <rect x="1.5" y="1.5" width="97" height="97" rx="20.5" stroke="#1e293b" strokeWidth="1.5" />
                <g transform="translate(15, 15)">
                  <circle cx="35" cy="35" r="32" stroke="#10b981" strokeWidth="3" strokeDasharray="160 40" strokeLinecap="round" opacity="0.9" />
                  <circle cx="58" cy="13" r="3.5" fill="#34d399" />
                  <line x1="18" y1="20" x2="18" y2="50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="52" y1="20" x2="52" y2="50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M18 50 L35 20 L52 50" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="25" y1="38" x2="45" y2="38" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  <path d="M18 20 L35 38 L52 20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                </g>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  MathAIO
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Hệ Sinh Thái Ứng Dụng Toán Học Trực Quan
              </p>
            </div>
          </Link>

          <Link
            href={changelogUrl}
            title="Xem nhật ký phát hành (Changelog)"
            className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
          >
            <span>{APP_VERSION.fullString}</span>
          </Link>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-3">
          {/* Badge Gemini Key */}
          <button
            type="button"
            onClick={() => openApiKeyModal()}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shrink-0 shadow-xs transition cursor-pointer"
            title="Cấu hình Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span>{isCustomKeyActive ? 'Gemini Key Cá nhân' : 'Gemini Key AUTO'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
          </button>

          {/* Đăng nhập & Đăng ký */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-3 py-1.5 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Đăng nhập</span>
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Bắt đầu miễn phí</span>
            </Link>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggleButton />
        </div>
      </header>

      {/* MAIN SCROLLABLE SECTIONS */}
      <main className="relative z-10 w-full flex flex-col">
        {/* 2. Hero Section - Định Vị Thương Hiệu & Điểm Nhấn Thị Giác */}
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center relative overflow-hidden flex flex-col items-center">
          {/* Ambient Glow Radial Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />

          {/* Glowing Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-6 shadow-[0_0_25px_rgba(6,182,212,0.25)] relative z-10">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>MATHAIO ECOSYSTEM • NỀN TẢNG TOÁN HỌC SỐ TOÀN DIỆN</span>
          </div>

          {/* Main H1 Headline with Silver-to-Cyan Gradient */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto mt-4 mb-6 bg-gradient-to-b from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent relative z-10">
            Đột Phá Năng Suất Giảng Dạy &amp; Trực Quan Hóa Toán Học
          </h1>

          {/* Description Paragraph */}
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 text-balance leading-relaxed relative z-10">
            Tích hợp công nghệ AI thế hệ mới hỗ trợ giáo viên THCS/THPT: Tự động vẽ mô hình hình học SVG chính xác từng tọa độ và biên soạn giáo án chuẩn 5512 chỉ trong vài giây.
          </p>

          {/* CTA Buttons Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14 relative z-10">
            <Link
              href="/geometry"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 text-sm sm:text-base flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Trải Nghiệm Canvas Ngay →</span>
            </Link>
            <Link
              href="/lesson-plan"
              className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold transition-all hover:border-emerald-500/50 text-sm sm:text-base flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Khám Phá Mẫu Giáo Án 5512</span>
            </Link>
          </div>

          {/* Interactive Mockup Hero (Trực quan hóa Canvas SVG kích thước lớn) */}
          <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 p-2.5 sm:p-3.5 shadow-2xl shadow-cyan-950/40 relative z-10">
            <div className="rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-inner">
              {/* Studio Window Titlebar */}
              <div className="h-10 bg-slate-900/90 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-slate-300 font-sans hidden sm:inline text-[11px]">
                    MathAIO Studio Workspace — Dynamic Vector Canvas Engine
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 text-[10px]">
                    Gemini 3.6 Flash Active
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px]">
                    100% Vector SVG
                  </span>
                </div>
              </div>

              {/* Ribbon Tool Bar Mockup */}
              <div className="h-10 bg-slate-900/50 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400 overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Con trỏ chọn</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] flex items-center gap-1.5 border border-slate-750">
                    Đoạn thẳng
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] flex items-center gap-1.5 border border-slate-750">
                    Tam giác
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] flex items-center gap-1.5 border border-slate-750">
                    Đường tròn
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] flex items-center gap-1.5 border border-slate-750">
                    LaTeX Nhãn
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4 font-mono text-[10px]">
                  <span className="text-slate-500">Tọa độ: X: 180, Y: 100</span>
                  <span className="text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    Scale: 100%
                  </span>
                </div>
              </div>

              {/* Window Content: 2-Sided Integrated Split Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                {/* Left side: Canvas SVG Graphic Preview */}
                <div className="md:col-span-7 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative bg-radial from-slate-900/60 to-slate-950">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                      <Compass className="w-4 h-4" />
                      Mô Phỏng Vector SVG Trực Tiếp
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                      Tự động tính toạ độ chính xác
                    </span>
                  </div>

                  {/* SVG Illustration - Tam giác ABC nội tiếp đường tròn (O), đường cao AH, tâm nội tiếp I */}
                  <div className="my-4 h-60 flex items-center justify-center relative">
                    {/* Grid Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

                    <svg
                      viewBox="0 0 380 220"
                      className="w-full h-full max-h-60 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.35)] relative z-10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Circumcircle (O) */}
                      <circle cx="190" cy="110" r="82" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />
                      <circle cx="190" cy="110" r="3" fill="#38bdf8" />
                      <text x="196" y="112" fill="#7dd3fc" fontSize="11" fontFamily="monospace" fontWeight="bold">O</text>

                      {/* Triangle ABC */}
                      <polygon
                        points="190,30 115,165 265,165"
                        fill="rgba(6, 182, 212, 0.08)"
                        stroke="#06b6d4"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                      />

                      {/* Altitude AH */}
                      <line x1="190" y1="30" x2="190" y2="165" stroke="#f59e0b" strokeWidth="1.75" strokeDasharray="2.5 2" />
                      {/* Right Angle Symbol at H */}
                      <rect x="190" y="152" width="11" height="11" stroke="#f59e0b" strokeWidth="1.3" fill="none" opacity="0.9" />

                      {/* Inscribed Circle (I) */}
                      <circle cx="190" cy="122" r="41" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 2" />
                      <circle cx="190" cy="122" r="3" fill="#ec4899" />
                      <text x="196" y="125" fill="#f472b6" fontSize="10" fontFamily="monospace" fontWeight="bold">I</text>

                      {/* Vertex Points & Labels */}
                      <circle cx="190" cy="30" r="4" fill="#38bdf8" stroke="#082f49" strokeWidth="1.5" />
                      <text x="186" y="19" fill="#e0f2fe" fontSize="12" fontWeight="bold">A</text>

                      <circle cx="115" cy="165" r="4" fill="#38bdf8" stroke="#082f49" strokeWidth="1.5" />
                      <text x="100" y="174" fill="#e0f2fe" fontSize="12" fontWeight="bold">B</text>

                      <circle cx="265" cy="165" r="4" fill="#38bdf8" stroke="#082f49" strokeWidth="1.5" />
                      <text x="272" y="174" fill="#e0f2fe" fontSize="12" fontWeight="bold">C</text>

                      <circle cx="190" cy="165" r="3" fill="#f59e0b" />
                      <text x="186" y="184" fill="#fde68a" fontSize="11" fontWeight="bold">H</text>
                    </svg>
                  </div>

                  {/* Prompt Demo Box with Execution Speed Metric */}
                  <div className="bg-slate-900/90 border border-slate-800/90 p-3 rounded-xl flex items-center justify-between text-xs shadow-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                      <span className="text-slate-300 font-mono text-[11px] truncate">
                        Prompt: &quot;Cho tam giác ABC nhọn nội tiếp (O), kẻ đường cao AH, xác định tâm I...&quot;
                      </span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold shrink-0 ml-3 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                      Thời gian xuất hình: 0.8s
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
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Chuẩn BGD&amp;ĐT
                    </span>
                  </div>

                  {/* Document structured 4-activity steps mockup */}
                  <div className="my-4 space-y-2.5 text-left">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="text-[10px] font-mono text-cyan-400 font-bold mb-0.5">HOẠT ĐỘNG 1: KHỞI ĐỘNG</div>
                      <div className="text-slate-200 font-medium text-xs">Đặt tình huống tính khoảng cách thực tế bằng tam giác</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-xs shadow-sm shadow-cyan-950/30">
                      <div className="text-[10px] font-mono text-cyan-300 font-bold mb-0.5">HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC</div>
                      <div className="text-slate-200 font-medium text-xs">Chứng minh định lý &amp; Quan sát mô hình Canvas tương tác</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="text-[10px] font-mono text-emerald-400 font-bold mb-0.5">HOẠT ĐỘNG 3: LUYỆN TẬP</div>
                      <div className="text-slate-200 font-medium text-xs">Phiếu học tập 4 cấp độ: Nhận biết, Thông hiểu, Vận dụng</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="text-[10px] font-mono text-amber-400 font-bold mb-0.5">HOẠT ĐỘNG 4: VẬN DỤNG</div>
                      <div className="text-slate-200 font-medium text-xs">Bài toán đo đạc thực địa và tính toán bán kính ngoại tiếp</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-850 pt-3">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Đồng bộ 2 chiều Canvas
                    </span>
                    <span className="text-cyan-400 font-semibold font-mono">Xuất .DOCX Chuẩn A4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Section 1: Deep Dive - Công Cụ Vẽ Hình Học Trực Quan AI */}
        <section className="w-full py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Specifications & Feature Benefits */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium shadow-sm">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SVG DYNAMIC ENGINE • 100% VECTOR</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Dựng hình chính xác, xuất chuẩn LaTeX và SVG sắc nét
                </h2>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Chỉ cần nhập đề bài bằng ngôn ngữ tự nhiên, hệ thống tự động giải tích tọa độ giải tích phẳng, dựng đường tròn nội/ngoại tiếp, trực tâm, trọng tâm và đánh nhãn công thức KaTeX sắc nét.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Tự động nhận diện đề bài và sinh mô hình hình học phẳng, lượng giác</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Giải quyết trọn vẹn tam giác, tứ giác, hình chóp, khối lăng trụ và đường cong hàm số.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Tùy biến màu sắc bài giảng trực quan hoặc chế độ đề thi in ấn đen trắng</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Dễ dàng chuyển đổi giữa phối màu nổi bật cho bài giảng điện tử và đường nét mảnh đen trắng chuẩn in đề thi.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Hỗ trợ xuất định dạng TikZ, SVG, PNG phân giải cao dán trực tiếp vào Word</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Xuất file TikZ sạch cho tài liệu LaTeX chuyên nghiệp, SVG vector thuần và PNG trong suốt độ phân giải cao.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/geometry"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all hover:translate-x-1"
                  >
                    <span>Trải Nghiệm Canvas Hình Học</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Mini Interactive Canvas Workspace Mockup */}
              <div className="lg:col-span-6 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl">
                <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-4">
                  {/* Top Bar with Mode Switcher */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-850 text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="font-semibold text-slate-200">Không Gian Vẽ Mini Preview</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveCanvasTab('visual')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                          activeCanvasTab === 'visual'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Bài giảng trực quan
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCanvasTab('print')}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                          activeCanvasTab === 'print'
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Đề thi đen trắng
                      </button>
                    </div>
                  </div>

                  {/* Rendered Preview Based On Mode */}
                  <div className="h-64 sm:h-72 w-full rounded-lg bg-slate-900/40 border border-slate-850 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

                    {activeCanvasTab === 'visual' ? (
                      <svg viewBox="0 0 400 240" className="w-full h-full max-h-64 relative z-10 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <line x1="40" y1="200" x2="360" y2="200" stroke="#475569" strokeWidth="1" />
                        <line x1="60" y1="220" x2="60" y2="20" stroke="#475569" strokeWidth="1" />
                        <path d="M 70,30 Q 180,210 330,30" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
                        <line x1="100" y1="180" x2="280" y2="60" stroke="#06b6d4" strokeWidth="1.75" />
                        <circle cx="190" cy="120" r="4" fill="#38bdf8" />
                        <text x="198" y="118" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">M(x₀, y₀)</text>
                        <path d="M 120,160 Q 180,210 240,160 Z" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 2" />
                        <text x="165" y="180" fill="#7dd3fc" fontSize="10" fontFamily="monospace">S = ∫ f(x)dx</text>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 400 240" className="w-full h-full max-h-64 relative z-10">
                        <line x1="40" y1="200" x2="360" y2="200" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="60" y1="220" x2="60" y2="20" stroke="#cbd5e1" strokeWidth="1" />
                        <path d="M 70,30 Q 180,210 330,30" stroke="#ffffff" strokeWidth="2" fill="none" />
                        <line x1="100" y1="180" x2="280" y2="60" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2" />
                        <circle cx="190" cy="120" r="3.5" fill="#ffffff" stroke="#000000" strokeWidth="1" />
                        <text x="198" y="118" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">M(x₀, y₀)</text>
                        <text x="165" y="180" fill="#cbd5e1" fontSize="10" fontFamily="monospace">S = ∫ f(x)dx</text>
                      </svg>
                    )}
                  </div>

                  {/* Export Options Bar */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
                    <span className="text-slate-300 font-mono text-[11px]">
                      {activeCanvasTab === 'visual' ? 'Chế độ màu trực quan bài giảng' : 'Chế độ in ấn đề thi đơn sắc'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                        TikZ Code
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                        SVG Vector
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                        PNG 4K
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Section 2: Deep Dive - Biên Soạn Kế Hoạch Bài Dạy Chuẩn 5512 */}
        <section className="w-full py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Word A4 Document Mockup (BGD&ĐT) */}
              <div className="lg:col-span-6 order-2 lg:order-1 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl">
                <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-850 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-slate-200">GiaoAn_Toan10_DinhLySinCos_5512.docx</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                      Chuẩn BGD&amp;ĐT
                    </span>
                  </div>

                  {/* A4 Sheet Preview */}
                  <div className="p-4 sm:p-5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-3.5 text-left">
                    <div className="border-b border-slate-800 pb-2.5 flex items-start justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">TRƯỜNG THPT CHUYÊN TOÁN HỌC</div>
                        <div className="text-[12px] font-bold text-white uppercase mt-0.5">KẾ HOẠCH BÀI DẠY (GIÁO ÁN TOÁN 10)</div>
                        <div className="text-[11px] text-emerald-400 font-medium">BÀI: ĐỊNH LÝ CÔSIN &amp; ĐỊNH LÝ SIN TRONG TAM GIÁC</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        Thời lượng: 2 Tiết
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Section 1 */}
                      <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                        <span className="text-cyan-400 font-bold font-mono text-[10px] block mb-0.5">I. MỤC TIÊU DẠY HỌC</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          • <strong className="text-white">Năng lực:</strong> Tính toán độ dài cạnh, góc tam giác trong tình huống thực tế.<br />
                          • <strong className="text-white">Phẩm chất:</strong> Rèn luyện tư duy logic, tính chính xác và cẩn thận.
                        </p>
                      </div>

                      {/* Section 2 */}
                      <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                        <span className="text-emerald-400 font-bold font-mono text-[10px] block mb-0.5">II. THIẾT BỊ &amp; HỌC LIỆU</span>
                        <p className="text-slate-300 text-[11px]">
                          Máy chiếu, phiếu học tập nhóm, mô hình động MathAIO Studio SVG.
                        </p>
                      </div>

                      {/* Section 3: 4 Activities Matrix */}
                      <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                        <span className="text-amber-400 font-bold font-mono text-[10px] block mb-1.5">III. TIẾN TRÌNH 4 HOẠT ĐỘNG 5512</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 font-mono">
                          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                            <span className="text-cyan-400 font-semibold block">1. Khởi Động:</span> Tình huống đo khoảng cách
                          </div>
                          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                            <span className="text-indigo-400 font-semibold block">2. Hình Thành KT:</span> Chứng minh công thức
                          </div>
                          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                            <span className="text-emerald-400 font-semibold block">3. Luyện Tập:</span> 4 mức độ nhận thức
                          </div>
                          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                            <span className="text-amber-400 font-semibold block">4. Vận Dụng:</span> Bài toán hàng hải &amp; đo đạc
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="text-[11px]">Định dạng Times New Roman, A4, Bảng biểu chuẩn</span>
                    <span className="text-emerald-400 font-semibold font-mono text-[11px] flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      Xuất File Word (.docx)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Narrative */}
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium shadow-sm">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CÔNG VĂN 5512 BGD&amp;ĐT</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Soạn giáo án tự động, chuẩn hóa ma trận câu hỏi và năng lực
                </h2>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Giúp thầy cô giảm tải tối đa áp lực thủ tục hành chính để tập trung chuyên môn. Khung kế hoạch bài dạy sinh ra bám sát chương trình GDPT 2018 với 4 bước hoạt động chuẩn mực.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Tự động tạo mục tiêu kiến thức, năng lực và phẩm chất theo chương trình mới</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Phân tách rõ ràng năng lực toán học đặc thù và phẩm chất chủ yếu (chăm chỉ, trung thực, trách nhiệm).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Đồng bộ hóa bài tập theo mức độ: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Hệ thống gợi ý ma trận câu hỏi đa dạng, phân định rõ hoạt động của giáo viên và sản phẩm kỳ vọng của học sinh.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Xuất file Word (.docx) giữ nguyên định dạng bảng biểu và công thức toán MathType/LaTeX</h4>
                      <p className="text-xs text-slate-400 mt-0.5">File tải về sạch đẹp, không lỗi font, tương thích hoàn toàn với Microsoft Word trên mọi thiết bị.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/lesson-plan"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:translate-x-1"
                  >
                    <span>Khám Phá Mẫu Giáo Án 5512</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Section 3: Điểm Tựa Kỹ Thuật (Feature Grid Highlights 3 Columns) */}
        <section className="w-full py-20 border-t border-slate-800/60 bg-slate-950 text-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto mb-14">
              <h3 className="text-xs font-mono font-semibold text-cyan-400 tracking-wider uppercase mb-2">
                KIẾN TRÚC ĐỘC QUYỀN • HIỆU NĂNG VƯỢT TRỘI
              </h3>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Điểm Tựa Kỹ Thuật &amp; Tính Năng Cốt Lõi
              </h2>
            </div>

            {/* 3 Columns Core Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-left">
              {/* Card 1 */}
              <div className="p-7 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  AI Gemini Flash Tối Ưu
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Phản hồi thời gian thực với độ trễ cực thấp (&lt; 1 giây), hiểu sâu ngữ cảnh chương trình giáo dục phổ thông và cấu trúc đề thi THPT Quốc gia môn Toán.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-850 flex items-center text-[11px] font-mono text-cyan-400">
                  <span>Latency &lt; 800ms • Realtime Inference</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-7 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 group shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  Không Gian Làm Việc Tập Trung
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Chuyển đổi liền mạch giữa môi trường vẽ hình SVG chuyên dụng và trình soạn giáo án chuẩn hóa 5512 mà không gây giật lag hay mất trạng thái bài làm.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-850 flex items-center text-[11px] font-mono text-indigo-400">
                  <span>2-Way Sync • Zero Workspace Lag</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-7 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 group shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  Sẵn Sàng Mở Rộng Cộng Đồng
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Cấu trúc nền tảng linh hoạt, sẵn sàng hướng tới mạng lưới chia sẻ học liệu, ngân hàng câu hỏi và kho giáo án mở cho hàng ngàn giáo viên Toán học toàn quốc.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-850 flex items-center text-[11px] font-mono text-emerald-400">
                  <span>Open Educational Ecosystem</span>
                </div>
              </div>
            </div>

            {/* 6. Bottom Banner & Call-to-Action Chốt Hạ */}
            <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900/40 border border-cyan-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl shadow-cyan-950/30">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>HOÀN TOÀN MIỄN PHÍ TRẢI NGHIỆM</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Sẵn Sàng Nâng Tầm Tiết Học Toán Học Của Bạn?
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Đăng nhập ngay để lưu trữ các bản vẽ vector không giới hạn, xuất giáo án chuẩn 5512 ra file Word và quản lý định mức tài nguyên Ω hoàn toàn miễn phí.
                </p>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/register"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Bắt Đầu Miễn Phí Ngay</span>
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Tài Khoản</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Status Footer Toàn Diện */}
      <footer className="relative z-10 w-full border-t border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <span>MathAIO Studio &copy; {new Date().getFullYear()} – Hệ thống Quản trị &amp; Nền tảng Toán học All-in-One</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:inline">Chuẩn Công văn 5512 BGD&amp;ĐT</span>
          <Link
            href={changelogUrl}
            className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted transition font-mono"
            title="Xem Changelog"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <Link href="/geometry" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition">
            Vẽ Hình Học
          </Link>
          <span>•</span>
          <Link href="/lesson-plan" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            Soạn Giáo Án 5512
          </Link>
          <span>•</span>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gemini 3.6 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
