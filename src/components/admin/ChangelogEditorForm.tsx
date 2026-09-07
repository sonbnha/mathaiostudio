'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  Tag,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
  Shield,
} from 'lucide-react';
import { useAdminContext } from '@/app/admin/AdminContext';

export interface ChangelogEditorFormProps {
  initialId?: string;
  isNew?: boolean;
}

export function serializeChangesToText(changes?: any[]): string {
  if (!Array.isArray(changes) || changes.length === 0) return '';
  return changes
    .map((c) => {
      const type = (c.type || 'feat').toLowerCase();
      const content = (c.description ?? c.content ?? '').trim();
      return `/${type} ${content}`;
    })
    .join('\n');
}

export function parseChangesText(rawText: string) {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines
    .map((line) => {
      // Strip leading list bullets if any
      const cleaned = line.replace(/^[-*•]\s+/, '').trim();

      // /feat or [FEAT] (case-insensitive)
      const featMatch = cleaned.match(/^(?:\/feat|\[feat\])\s+(.*)$/i);
      if (featMatch) {
        const content = featMatch[1].trim();
        return {
          type: 'feat' as const,
          description: content,
          content: content,
        };
      }

      // /fix or [FIX] (case-insensitive)
      const fixMatch = cleaned.match(/^(?:\/fix|\[fix\])\s+(.*)$/i);
      if (fixMatch) {
        const content = fixMatch[1].trim();
        return {
          type: 'fix' as const,
          description: content,
          content: content,
        };
      }

      // /improve or [IMPROVE] (case-insensitive)
      const improveMatch = cleaned.match(/^(?:\/improve|\[improve\])\s+(.*)$/i);
      if (improveMatch) {
        const content = improveMatch[1].trim();
        return {
          type: 'improve' as const,
          description: content,
          content: content,
        };
      }

      // Default to 'feat'
      return {
        type: 'feat' as const,
        description: cleaned,
        content: cleaned,
      };
    })
    .filter((item) => item.description.length > 0);
}

export default function ChangelogEditorForm({
  initialId,
  isNew = false,
}: ChangelogEditorFormProps) {
  const router = useRouter();
  const { isAdmin, changelogs, fetchAdminChangelogs, showToast } = useAdminContext();

  const [clVersion, setClVersion] = useState('');
  const [clDate, setClDate] = useState('');
  const [clTitle, setClTitle] = useState('');
  const [clChangesText, setClChangesText] = useState('');
  const [clIsPublished, setClIsPublished] = useState(true);

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize data
  useEffect(() => {
    if (isNew) {
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(
        today.getMonth() + 1
      ).padStart(2, '0')}/${today.getFullYear()}`;
      setClDate(formattedDate);
      setIsLoading(false);
      return;
    }

    if (!initialId) return;

    let isMounted = true;

    async function loadData() {
      // First check local context
      const localItem = changelogs.find(
        (c) => c.id === initialId || c.version === initialId
      );
      if (localItem) {
        setClVersion(localItem.version);
        setClDate(localItem.date);
        setClTitle(localItem.title);
        setClChangesText(serializeChangesToText(localItem.changes));
        setClIsPublished(localItem.isPublished);
        setIsLoading(false);
      }

      try {
        const res = await fetch(`/api/admin/changelog/${encodeURIComponent(initialId!)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.changelog && isMounted) {
            setClVersion(data.changelog.version);
            setClDate(data.changelog.date);
            setClTitle(data.changelog.title);
            setClChangesText(serializeChangesToText(data.changelog.changes));
            setClIsPublished(data.changelog.isPublished);
          }
        } else if (!localItem && isMounted) {
          setError('Không tìm thấy bản ghi phiên bản này.');
        }
      } catch (err: any) {
        if (!localItem && isMounted) {
          setError(err.message || 'Lỗi khi tải dữ liệu phiên bản.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialId, isNew, changelogs]);

  // Realtime parsed changes for live preview
  const parsedChanges = useMemo(() => {
    return parseChangesText(clChangesText);
  }, [clChangesText]);

  // Counts for live preview summary
  const counts = useMemo(() => {
    let feat = 0;
    let fix = 0;
    let improve = 0;
    parsedChanges.forEach((c) => {
      if (c.type === 'feat') feat++;
      else if (c.type === 'fix') fix++;
      else if (c.type === 'improve') improve++;
    });
    return { feat, fix, improve, total: parsedChanges.length };
  }, [parsedChanges]);

  // Insert tag at cursor
  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setClChangesText((prev) => (prev.trim() ? `${prev}\n${tag} ` : `${tag} `));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const after = text.substring(end);

    const needsNewlineBefore = before.length > 0 && !before.endsWith('\n');
    const insertText = `${needsNewlineBefore ? '\n' : ''}${tag} `;
    const nextText = before + insertText + after;

    setClChangesText(nextText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clVersion.trim() || !clTitle.trim() || !clDate.trim()) {
      setError('Vui lòng điền đầy đủ Số Phiên Bản, Tiêu Đề và Ngày Áp Dụng.');
      return;
    }

    if (parsedChanges.length === 0) {
      setError('Vui lòng nhập ít nhất một dòng mô tả thay đổi.');
      return;
    }

    setIsSaving(true);
    try {
      const url = isNew
        ? '/api/admin/changelog'
        : `/api/admin/changelog/${encodeURIComponent(initialId!)}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: clVersion.trim(),
          date: clDate.trim(),
          title: clTitle.trim(),
          changes: parsedChanges,
          isPublished: clIsPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu phiên bản Changelog.');
      }

      await fetchAdminChangelogs(false);
      showToast(isNew ? 'Đã tạo phiên bản mới thành công!' : 'Đã cập nhật phiên bản thành công!');
      router.push('/admin/changelog');
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-medium">Đang tải thông tin phiên bản...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Khu vực giới hạn
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Bạn không có quyền quản trị tối cao để chỉnh sửa lịch sử phiên bản hệ thống.
        </p>
        <Link
          href="/admin/changelog"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại</span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* TOP ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        {/* Left: Back button & Streamlined Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/changelog"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors shrink-0"
            title="Quay lại danh sách Changelog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isNew ? 'Tạo Phiên Bản Mới' : 'Chỉnh Sửa Phiên Bản'}
            </h1>
            {clVersion.trim() && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                {clVersion.trim()}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {/* Published Status Toggle */}
          <button
            type="button"
            onClick={() => setClIsPublished(!clIsPublished)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              clIsPublished
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            {clIsPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{clIsPublished ? 'Đã Xuất Bản' : 'Bản Nháp (Ẩn)'}</span>
          </button>

          {/* Cancel */}
          <Link
            href="/admin/changelog"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
          >
            Hủy
          </Link>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isNew ? 'Tạo Phiên Bản Mới' : 'Lưu & Cập Nhật'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-COLUMN BALANCED STUDIO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: UNIFIED STUDIO EDITOR CARD (~58% width: 7/12) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[calc(100vh-190px)] min-h-[620px]">
          {/* Metadata Section */}
          <div className="space-y-3.5 shrink-0">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Thông Tin Bản Phát Hành
              </h2>
            </div>

            {/* Row 1: Version + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Số Phiên Bản</span>
                </label>
                <input
                  type="text"
                  value={clVersion}
                  onChange={(e) => setClVersion(e.target.value)}
                  placeholder="Ví dụ: v1.2.2"
                  className="bg-slate-950/80 border border-slate-700/70 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono outline-none transition"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ngày Áp Dụng (DD/MM/YYYY)</span>
                </label>
                <input
                  type="text"
                  value={clDate}
                  onChange={(e) => setClDate(e.target.value)}
                  placeholder="Ví dụ: 08/09/2026"
                  className="bg-slate-950/80 border border-slate-700/70 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Row 2: Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Tiêu Đề Phát Hành
              </label>
              <input
                type="text"
                value={clTitle}
                onChange={(e) => setClTitle(e.target.value)}
                placeholder="Ví dụ: Tối ưu hóa tiến trình & Fix kẹt loading"
                className="bg-slate-950/80 border border-slate-700/70 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-medium outline-none transition"
                required
              />
            </div>
          </div>

          {/* Subtle separator */}
          <div className="border-t border-slate-800/60 my-4 shrink-0" />

          {/* Quick-tag Editor Section (fills remaining height) */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1 shrink-0">
              <div>
                <label className="text-xs font-semibold text-slate-300 block">
                  Nội dung cập nhật (Mỗi dòng một mục)
                </label>
                <span className="text-[11px] text-slate-400">
                  Gõ /feat, /fix hoặc /improve ở đầu mỗi dòng
                </span>
              </div>

              {/* Quick-insert Chips */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleInsertTag('/feat')}
                  className="px-2.5 py-1 rounded-lg text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800 text-[11px] font-mono font-medium transition cursor-pointer"
                  title="Chèn thẻ /feat"
                >
                  + /feat
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('/fix')}
                  className="px-2.5 py-1 rounded-lg text-rose-400 bg-rose-950/50 hover:bg-rose-900/50 border border-rose-800 text-[11px] font-mono font-medium transition cursor-pointer"
                  title="Chèn thẻ /fix"
                >
                  + /fix
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('/improve')}
                  className="px-2.5 py-1 rounded-lg text-sky-400 bg-sky-950/50 hover:bg-sky-900/50 border border-sky-800 text-[11px] font-mono font-medium transition cursor-pointer"
                  title="Chèn thẻ /improve"
                >
                  + /improve
                </button>
              </div>
            </div>

            {/* Editor Textarea seamlessly filling to the bottom */}
            <textarea
              ref={textareaRef}
              value={clChangesText}
              onChange={(e) => setClChangesText(e.target.value)}
              placeholder={`/feat Hoán đổi trực tiếp thanh Header Canvas\n/fix Khắc phục lỗi kẹt loading khi tải ảnh\n/improve Tối ưu bộ nhớ đệm và tăng tốc độ vẽ SVG`}
              className="flex-1 w-full bg-slate-950/80 border border-slate-700/70 rounded-xl p-3.5 font-mono text-xs text-slate-200 resize-none outline-none focus:border-cyan-500 leading-relaxed"
              required
            />
          </div>
        </div>

        {/* RIGHT COLUMN: BALANCED LIVE PREVIEW PANEL (~42% width: 5/12) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col h-[calc(100vh-190px)] min-h-[620px] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">
                Xem Trước Thực Tế (Giao Diện User)
              </span>
            </div>

            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Preview
            </span>
          </div>

          {/* User Popup Changelog Simulation Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Version Meta */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-slate-100 leading-snug">
                  {clTitle.trim() || 'Chưa đặt tiêu đề phát hành...'}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {clDate.trim() || 'DD/MM/YYYY'}
                  </span>
                  <span>•</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      clIsPublished
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                    }`}
                  >
                    {clIsPublished ? 'Công Khai' : 'Bản Nháp'}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold shrink-0">
                {clVersion.trim() || 'v?.?.?'}
              </span>
            </div>

            {/* Changes List Simulation */}
            <div className="space-y-2.5">
              {parsedChanges.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center gap-2 text-slate-500">
                  <Sparkles className="w-6 h-6 text-slate-600" />
                  <p className="text-xs italic">
                    Chưa có nội dung thay đổi nào...
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Hãy gõ /feat, /fix hoặc /improve ở khung soạn thảo bên trái.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 text-xs">
                  {parsedChanges.map((change, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 leading-relaxed text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60"
                    >
                      {/* Badge Tag */}
                      {change.type === 'feat' && (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wide">
                          FEAT
                        </span>
                      )}
                      {change.type === 'fix' && (
                        <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wide">
                          FIX
                        </span>
                      )}
                      {change.type === 'improve' && (
                        <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wide">
                          IMPROVE
                        </span>
                      )}

                      {/* Content */}
                      <span className="flex-1 break-words">
                        {change.description}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Fixed Bottom Summary Footer */}
          <div className="border-t border-slate-800/80 px-4 py-3 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 shrink-0 font-mono">
            <span>Tổng cộng: {counts.total} mục</span>
            <div className="flex items-center gap-2">
              {counts.feat > 0 && (
                <span className="text-emerald-400">{counts.feat} feat</span>
              )}
              {counts.improve > 0 && (
                <span className="text-sky-400">{counts.improve} improve</span>
              )}
              {counts.fix > 0 && (
                <span className="text-rose-400">{counts.fix} fix</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
