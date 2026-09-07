import React from 'react';

export default function ChangelogLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        {/* 1. Top Nav Skeleton */}
        <div className="w-full flex items-center justify-between mb-10 pb-4 border-b border-slate-800/60">
          <div className="h-4 w-36 bg-slate-800/80 rounded-md" />
          <div className="h-6 w-24 bg-slate-800/80 rounded-full" />
        </div>

        {/* 2. Header Skeleton */}
        <div className="mb-12 space-y-3">
          <div className="h-3 w-28 bg-slate-800/80 rounded" />
          <div className="h-9 w-80 max-w-full bg-slate-800 rounded-lg" />
          <div className="h-4 w-full max-w-3xl bg-slate-800/60 rounded" />
          <div className="h-4 w-2/3 max-w-xl bg-slate-800/60 rounded" />
        </div>

        {/* 3. Timeline Spine Skeleton */}
        <div className="relative border-l border-slate-800/80 ml-2 md:ml-44 space-y-12">
          {[1, 2].map((i) => (
            <div key={i} className="relative pl-6 md:pl-8">
              {/* Timeline Dot Skeleton */}
              <div className="absolute -left-[5px] top-2.5 w-2.5 h-2.5 rounded-full bg-slate-700 ring-4 ring-slate-950" />

              {/* Left Date/Badge Skeleton (Desktop) */}
              <div className="hidden md:flex md:flex-col items-baseline md:items-end gap-2 md:absolute md:-left-44 md:top-1.5 md:w-36 md:text-right">
                <div className="h-3.5 w-16 bg-slate-800 rounded" />
                <div className="h-5 w-14 bg-slate-800/90 rounded-md" />
              </div>

              {/* Mobile Meta Skeleton */}
              <div className="flex md:hidden items-center gap-2 mb-3">
                <div className="h-5 w-14 bg-slate-800/90 rounded-md" />
                <div className="h-3.5 w-16 bg-slate-800 rounded" />
              </div>

              {/* Card Body Skeleton */}
              <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-5 sm:p-7 space-y-5 backdrop-blur-sm shadow-xl shadow-black/20">
                <div className="h-6 w-3/5 bg-slate-800 rounded-md" />
                <div className="space-y-3 pt-2">
                  <div className="h-3 w-28 bg-slate-800/70 rounded" />
                  <div className="h-4 w-11/12 bg-slate-800/50 rounded" />
                  <div className="h-4 w-4/5 bg-slate-800/50 rounded" />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="h-3 w-36 bg-slate-800/70 rounded" />
                  <div className="h-4 w-5/6 bg-slate-800/50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
