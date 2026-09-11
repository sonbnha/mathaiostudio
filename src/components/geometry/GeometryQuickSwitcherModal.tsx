'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderClock,
  Search,
  X,
  Compass,
  Plus,
  Trash2,
  Clock,
  Star,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  ProjectItem,
  getAllProjects,
  deleteProject,
  toggleStarProject,
} from '@/lib/storage/projectStore';

interface GeometryQuickSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocId?: string | null;
  onSelectProject: (project: ProjectItem) => void;
  onCreateNew: () => void;
}

export const GeometryQuickSwitcherModal: React.FC<GeometryQuickSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentDocId,
  onSelectProject,
  onCreateNew,
}) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStarred, setFilterStarred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshList = () => {
    const all = getAllProjects();
    const geo = all.filter((p) => p.type === 'geometry');
    setProjects(geo);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSearchQuery('');
      setFilterStarred(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.metadata?.promptText && p.metadata.promptText.toLowerCase().includes(q)) ||
        (p.metadata?.topic && p.metadata.topic.toLowerCase().includes(q));

      const matchStar = !filterStarred || !!p.isStarred;
      return matchQuery && matchStar;
    });
  }, [projects, searchQuery, filterStarred]);

  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp) return 'Gần đây';
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 2) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa bản vẽ này khỏi kho dự án?')) {
      deleteProject(id);
      refreshList();
    }
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStarProject(id);
    refreshList();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 shadow-xs">
              <FolderClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Lịch Sử Bản Vẽ Đã Lưu
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/20">
                  {projects.length} bản vẽ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mở nhanh và chuyển đổi giữa các bản vẽ hình học từ trung tâm dự án chung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateNew();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vẽ hình mới</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row gap-2 bg-white dark:bg-slate-900">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên bản vẽ, đề bài hoặc chủ đề..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-cyan-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFilterStarred(!filterStarred)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer shrink-0 ${
              filterStarred
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>Đã gắn sao</span>
          </button>
        </div>

        {/* Project Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredProjects.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
                <Compass className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {searchQuery || filterStarred
                  ? 'Không tìm thấy bản vẽ phù hợp'
                  : 'Chưa có bản vẽ hình học nào được lưu'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                {searchQuery || filterStarred
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc đã gắn sao.'
                  : 'Bản vẽ bạn tạo hoặc chỉnh sửa trên Canvas sẽ được tự động lưu trữ tại đây.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredProjects.map((item) => {
                const isActive = item.id === currentDocId;
                const hasSvg = Boolean(item.metadata?.svgCode);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectProject(item);
                      onClose();
                    }}
                    className={`group relative rounded-2xl border p-3.5 flex flex-col gap-3 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/20 shadow-md'
                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 hover:shadow-lg dark:hover:shadow-cyan-950/20'
                    }`}
                  >
                    {/* Visual Preview Box */}
                    <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 flex items-center justify-center p-2 relative overflow-hidden group-hover:scale-[1.01] transition-transform">
                      {hasSvg ? (
                        <div
                          className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: item.metadata!.svgCode! }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                          <Compass className="w-8 h-8 text-cyan-500/60" />
                          <span className="text-[10px] font-mono text-slate-400">SVG Vector</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 shadow-xs backdrop-blur-xs">
                          {item.metadata?.topic || item.metadata?.badge || 'Hình học'}
                        </span>
                      </div>

                      {isActive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                          <Check className="w-3 h-3" />
                          <span>Đang mở</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition line-clamp-1">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(e, item.id)}
                          className="text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 p-0.5 transition shrink-0"
                          title={item.isStarred ? 'Bỏ gắn sao' : 'Gắn sao yêu thích'}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              item.isStarred ? 'fill-amber-500 text-amber-500' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {item.metadata?.promptText && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.metadata.promptText}
                        </p>
                      )}

                      <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.updatedAt)}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            title="Xóa bản vẽ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Tự động đồng bộ với Không Gian Quản Lý Dự Án Trang Chủ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeometryQuickSwitcherModal;
