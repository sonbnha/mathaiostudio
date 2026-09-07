import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { CHANGELOG, sortChangelogsList, VersionRelease } from '@/config/changelog';
import ChangelogContentRenderer from '@/components/ChangelogContentRenderer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Nhật Ký Phát Hành & Tính Năng Mới – MathAIO Studio',
  description:
    'Khám phá tất cả các cập nhật, tính năng mới và cải tiến hiệu năng định kỳ của MathAIO Studio.',
};

async function getChangelogs(): Promise<VersionRelease[]> {
  try {
    const dbItems = await prisma.changelog.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    if (dbItems && dbItems.length > 0) {
      const mapped = dbItems.map((c) => ({
        version: c.version,
        date: c.date,
        title: c.title,
        changes: Array.isArray(c.changes) ? (c.changes as any) : [],
        createdAt: c.createdAt,
      }));
      return sortChangelogsList(mapped);
    }
  } catch (error) {
    console.warn('Error fetching changelogs from DB in /changelog page, using static fallback:', error);
  }

  return sortChangelogsList(CHANGELOG);
}

export default async function ChangelogPage() {
  const releases = await getChangelogs();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800/60">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition shadow-xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại MathAIO Studio</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Updates
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="space-y-4 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nhật Ký Phát Hành</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Cập nhật sản phẩm & Tính năng mới
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Khám phá tất cả các cập nhật, tính năng mới và cải tiến hiệu năng định kỳ của MathAIO Studio. Nền tảng được tối ưu hóa liên tục để phục vụ công tác giảng dạy & học tập hình học THCS/THPT.
          </p>
        </div>

        {/* Vertical Timeline Axis */}
        <div className="relative border-l border-slate-800/80 ml-4 md:ml-48 pl-6 md:pl-10 space-y-16">
          {releases.map((rel, idx) => {
            const isLatest = idx === 0;

            return (
              <div key={rel.version} className="relative group">
                {/* Timeline Dot on the Axis */}
                <div
                  className={`absolute -left-[31px] md:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 transition-all duration-300 ${
                    isLatest
                      ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)] scale-110'
                      : 'border-slate-600 group-hover:border-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  }`}
                />

                {/* Desktop Left Column: Date + Version Badge (aligned outside timeline) */}
                <div className="hidden md:flex flex-col items-end gap-1.5 absolute -left-48 w-36 text-right top-0.5">
                  <span className="font-mono text-xs text-slate-400">{rel.date}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900/90 text-cyan-300 border border-slate-700/80 shadow-xs">
                      {rel.version}
                    </span>
                  </div>
                  {isLatest && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Mới nhất
                    </span>
                  )}
                </div>

                {/* Mobile Meta Header: Shown only on small screens */}
                <div className="flex md:hidden items-center gap-2 mb-3 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                    {rel.version}
                  </span>
                  {isLatest && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Mới nhất
                    </span>
                  )}
                  <span className="text-slate-400 text-xs font-mono">• {rel.date}</span>
                </div>

                {/* Main Content Card */}
                <div className="bg-slate-900/40 border border-slate-800/70 hover:border-slate-700/80 rounded-2xl p-5 md:p-6 transition shadow-sm backdrop-blur-xs">
                  {/* Release Title */}
                  <h2 className="text-base md:text-lg font-bold text-slate-100 mb-4 leading-snug">
                    {rel.title}
                  </h2>

                  {/* Grouped Changes Renderer */}
                  <ChangelogContentRenderer changes={rel.changes} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Footer Section */}
        <div className="mt-20 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MathAIO Studio. Chuẩn Công văn 5512 BGD&ĐT.</p>
          <Link
            href="/"
            className="hover:text-cyan-400 transition underline decoration-dotted"
          >
            Quay lại trải nghiệm vẽ hình học AI →
          </Link>
        </div>
      </div>
    </div>
  );
}
