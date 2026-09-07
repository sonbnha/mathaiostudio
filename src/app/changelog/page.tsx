import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CHANGELOG, sortChangelogsList, VersionRelease } from '@/config/changelog';
import ChangelogContentRenderer from '@/components/ChangelogContentRenderer';
import ChangelogBackButton from './ChangelogBackButton';

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

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* 1. Thanh Top Navigation */}
        <div className="w-full flex items-center justify-between mb-10 pb-4 border-b border-slate-800/60">
          <Suspense fallback={<div className="h-4 w-20 bg-slate-800/60 rounded animate-pulse" />}>
            <ChangelogBackButton />
          </Suspense>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Updates
          </span>
        </div>

        {/* 2. Khối Header Tiêu Đề (Thẳng hàng tuyệt đối với mép trái Timeline) */}
        <div className="mb-12">
          <span className="text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2 inline-block">
            Nhật Ký Phát Hành
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Cập nhật sản phẩm &amp; Tính năng mới
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed mb-12 text-balance">
            Khám phá tất cả các cập nhật, tính năng mới và cải tiến hiệu năng định kỳ của MathAIO Studio. Nền tảng được tối ưu hóa liên tục để phục vụ công tác giảng dạy &amp; học tập hình học THCS/THPT.
          </p>
        </div>

        {/* 3. Xây dựng Trục Timeline Dọc (Left-Rail Vertical Spine Layout) */}
        <div className="relative border-l border-slate-800/80 ml-2 md:ml-44 space-y-12">
          {releases.map((rel, idx) => {
            const isLatest = idx === 0;

            return (
              <div key={rel.version} className="relative pl-6 md:pl-8 group">
                {/* Điểm neo trên trục (Timeline Node Dot) */}
                <div
                  className={`absolute -left-[5px] top-2.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-950 transition-all duration-300 ${
                    isLatest
                      ? 'bg-cyan-400 ring-cyan-950/80 shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-110'
                      : 'bg-cyan-400 ring-slate-950 group-hover:bg-cyan-300 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                  }`}
                />

                {/* Cột mốc thời gian (Left Sidebar trên desktop, đặt absolute hoặc cố định thẳng hàng) */}
                <div className="hidden md:flex md:flex-col items-baseline md:items-end gap-2 md:absolute md:-left-44 md:top-1.5 md:w-36 md:text-right">
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    {rel.date}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-slate-900 border border-slate-700/80 text-cyan-300">
                      {rel.version}
                    </span>
                  </div>
                  {isLatest && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Mới nhất
                    </span>
                  )}
                </div>

                {/* Mobile Meta Header: Hiện trên màn hình nhỏ */}
                <div className="flex md:hidden items-center gap-2 mb-3 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-slate-900 border border-slate-700/80 text-cyan-300">
                    {rel.version}
                  </span>
                  {isLatest && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Mới nhất
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    • {rel.date}
                  </span>
                </div>

                {/* Khung Card Nội Dung Bản Phát Hành (Nền mờ có chiều sâu) */}
                <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-5 sm:p-7 backdrop-blur-sm shadow-xl shadow-black/20">
                  <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-5">
                    {rel.title}
                  </h2>

                  <ChangelogContentRenderer changes={rel.changes} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
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
