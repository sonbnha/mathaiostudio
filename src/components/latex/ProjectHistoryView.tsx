'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  RotateCcw,
  Clock,
  Tag,
  Check,
  MoreVertical,
  Trash2,
  Edit2,
  FileCode,
  Sparkles,
  User,
  History as HistoryIcon,
} from 'lucide-react';
import {
  ProjectSnapshot,
  getProjectSnapshots,
  createSnapshot,
  updateSnapshotLabel,
  deleteSnapshot,
  formatTime,
} from '@/lib/projectHistory';
import type { StudioFile } from '@/components/latex/StudioTools';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TeXEditor = dynamic(() => import('@/components/latex/TeXEditor'), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-xs text-slate-500">Đang tải bản xem lịch sử…</div>
  ),
});

interface ProjectHistoryViewProps {
  projectId: string;
  docTitle: string;
  files: StudioFile[];
  onBackToEditor: () => void;
  onRestoreSnapshot: (snapshot: ProjectSnapshot) => void;
  currentUserEmail?: string;
}

export default function ProjectHistoryView({
  projectId,
  docTitle,
  files,
  onBackToEditor,
  onRestoreSnapshot,
  currentUserEmail,
}: ProjectHistoryViewProps) {
  const { user } = useAuth();
  const authorName = currentUserEmail || user?.email || 'Bạn';
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [activeHistoryFile, setActiveHistoryFile] = useState<string>('main.tex');
  const [activeTab, setActiveTab] = useState<'all' | 'labels'>('all');
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState<string>('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Load snapshots on mount. If empty, create initial snapshot
  useEffect(() => {
    let list = getProjectSnapshots(projectId);
    if (list.length === 0 && files.length > 0) {
      const filesMap: Record<string, string> = {};
      files.forEach((f) => {
        filesMap[f.name] = f.content;
      });
      const initial = createSnapshot(projectId, filesMap, authorName, 'Phiên bản khởi tạo');
      list = [initial];
    }
    setSnapshots(list);
    if (list.length > 0) {
      setSelectedSnapshotId(list[0].id);
      const availableFiles = Object.keys(list[0].files || {});
      if (availableFiles.length > 0 && !availableFiles.includes(activeHistoryFile)) {
        setActiveHistoryFile(availableFiles[0]);
      }
    }
  }, [projectId]);

  const selectedSnapshot = useMemo(() => {
    return snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];
  }, [snapshots, selectedSnapshotId]);

  // Available files in selected snapshot
  const snapshotFiles = useMemo(() => {
    if (!selectedSnapshot?.files) return ['main.tex'];
    return Object.keys(selectedSnapshot.files);
  }, [selectedSnapshot]);

  // Current file content to display
  const currentFileContent = useMemo(() => {
    if (!selectedSnapshot?.files) return '';
    return selectedSnapshot.files[activeHistoryFile] ?? selectedSnapshot.files['main.tex'] ?? '';
  }, [selectedSnapshot, activeHistoryFile]);

  // Filtered snapshots by tab
  const filteredSnapshots = useMemo(() => {
    if (activeTab === 'labels') {
      return snapshots.filter((s) => Boolean(s.label));
    }
    return snapshots;
  }, [snapshots, activeTab]);

  // Group snapshots by groupDate
  const groupedSnapshots = useMemo(() => {
    const groups: Record<string, ProjectSnapshot[]> = {};
    filteredSnapshots.forEach((snap) => {
      const g = snap.groupDate || 'Lịch sử trước đó';
      if (!groups[g]) groups[g] = [];
      groups[g].push(snap);
    });
    return groups;
  }, [filteredSnapshots]);

  const handleSaveLabel = (snapshotId: string) => {
    const clean = labelInput.trim();
    const updated = updateSnapshotLabel(projectId, snapshotId, clean);
    setSnapshots(updated);
    setEditingLabelId(null);
    setLabelInput('');
  };

  const handleDelete = (snapshotId: string) => {
    const updated = deleteSnapshot(projectId, snapshotId);
    setSnapshots(updated);
    if (selectedSnapshotId === snapshotId && updated.length > 0) {
      setSelectedSnapshotId(updated[0].id);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 select-none">
      {/* 1. Dedicated History Header */}
      <header className="h-11 px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between z-20 shrink-0">
        {/* Left: Back to editor */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToEditor}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trình soạn thảo</span>
          </button>
        </div>

        {/* Center: Title & Revision Info */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
              {docTitle}
            </span>
          </div>
          {selectedSnapshot && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                Đang xem bản ghi: <strong>{selectedSnapshot.dateFormatted}</strong> ({selectedSnapshot.author})
              </span>
              {selectedSnapshot.label && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {selectedSnapshot.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Restore Version button */}
        <div className="flex items-center gap-2">
          {selectedSnapshot && (
            <button
              type="button"
              onClick={() => onRestoreSnapshot(selectedSnapshot)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục phiên bản này</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main History Content (Code Canvas Left + Timeline Sidebar Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Read-Only Code Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* File tabs bar */}
          <div className="h-9 px-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1">
              {snapshotFiles.map((fname) => (
                <button
                  key={fname}
                  type="button"
                  onClick={() => setActiveHistoryFile(fname)}
                  className={`px-3 py-1 text-xs font-medium rounded-t border-t-2 transition-colors flex items-center gap-1.5 ${
                    activeHistoryFile === fname
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-emerald-500 border-b-transparent shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 border-t-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{fname}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400">
                    Đã chỉnh sửa
                  </span>
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 font-mono italic pr-2">
              (Chế độ chỉ đọc)
            </span>
          </div>

          {/* CodeMirror 6 Read-only View */}
          <div className="flex-1 min-h-0 relative">
            <TeXEditor
              source={currentFileContent}
              onChange={() => {}}
              fontSize={14}
              onCompile={() => {}}
              readOnly={true}
            />
          </div>
        </div>

        {/* Right: History Timeline Sidebar (300px) */}
        <aside
          aria-label="Dòng thời gian lịch sử dự án"
          className="w-80 h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none z-10"
        >
          {/* Top Tabs: Tất cả lịch sử / Nhãn */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 pt-2 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-t transition-colors text-center ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tất cả lịch sử
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('labels')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-t transition-colors text-center flex items-center justify-center gap-1 ${
                activeTab === 'labels'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>Nhãn / Đánh dấu</span>
            </button>
          </div>

          {/* Timeline List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
            {Object.keys(groupedSnapshots).length > 0 ? (
              Object.entries(groupedSnapshots).map(([groupName, snaps]) => (
                <div key={groupName}>
                  {/* Group Header */}
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/80 dark:bg-slate-900/80 sticky top-0 z-10 border-b border-slate-200/50 dark:border-slate-800/50">
                    {groupName}
                  </div>

                  {/* Snapshots in Group */}
                  <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                    {snaps.map((snap) => {
                      const isSelected = snap.id === selectedSnapshotId;
                      const isEditing = editingLabelId === snap.id;

                      return (
                        <div
                          key={snap.id}
                          onClick={() => setSelectedSnapshotId(snap.id)}
                          className={`p-3 transition-colors cursor-pointer relative group ${
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-l-emerald-600 dark:border-l-emerald-500'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-900/60 border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            {/* Left: Time & Author */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                  {formatTime(snap.timestamp)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Đã chỉnh sửa
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {snap.author.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate">{snap.author}</span>
                              </div>

                              {/* Label view / edit */}
                              {isEditing ? (
                                <div
                                  className="mt-2 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="text"
                                    autoFocus
                                    value={labelInput}
                                    onChange={(e) => setLabelInput(e.target.value)}
                                    placeholder="Tên nhãn..."
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveLabel(snap.id);
                                      if (e.key === 'Escape') setEditingLabelId(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveLabel(snap.id)}
                                    className="p-1 bg-emerald-600 text-white rounded text-xs"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : snap.label ? (
                                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>{snap.label}</span>
                                </div>
                              ) : null}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLabelId(snap.id);
                                  setLabelInput(snap.label || '');
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition opacity-0 group-hover:opacity-100"
                                title="Gắn nhãn phiên bản"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRestoreSnapshot(snap);
                                }}
                                className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition opacity-0 group-hover:opacity-100 font-medium text-[11px]"
                                title="Khôi phục phiên bản này"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <HistoryIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p>Chưa có bản ghi lịch sử nào phù hợp.</p>
              </div>
            )}
          </div>

          {/* Bottom Upgrade Banner */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Nâng cấp gói MathAIO Pro
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Để xem toàn bộ lịch sử không giới hạn và đồng bộ GitHub/Dropbox.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
