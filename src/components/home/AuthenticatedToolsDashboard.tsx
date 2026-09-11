'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  BookOpen,
  FileCode,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Clock,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Shapes,
  GraduationCap,
  FileText,
  CheckCircle2,
  X,
  Layers,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import AppHeader from '@/components/header/AppHeader';
import { LATEX_TEMPLATES } from '@/components/latex/LaTeXTemplates';
import {
  getAllProjects,
  createNewProject,
  deleteProject,
  duplicateProject,
  renameProject,
  type ProjectItem,
  type ProjectType,
} from '@/lib/storage/projectStore';

export interface AuthenticatedToolsDashboardProps {
  user: any;
  onLogout: () => Promise<void> | void;
}

export default function AuthenticatedToolsDashboard({
  user,
  onLogout,
}: AuthenticatedToolsDashboardProps) {
  const router = useRouter();

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Creation Modals
  const [createType, setCreateType] = useState<ProjectType | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('Toán 10');
  const [selectedTemplateId, setSelectedTemplateId] = useState('thpt_2025');

  // Rename modal
  const [renamingProject, setRenamingProject] = useState<ProjectItem | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // Open action menu popover tracking
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(getAllProjects());
  }, []);

  const refreshProjects = () => {
    setProjects(getAllProjects());
  };

  const displayName =
    user?.name || user?.username || user?.email?.split('@')[0] || 'Thầy/Cô';

  // Filter and search
  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.metadata?.topic && item.metadata.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.metadata?.grade && item.metadata.grade.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (typeFilter === 'all') return true;
      return item.type === typeFilter;
    });
  }, [projects, searchQuery, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const geometry = projects.filter((p) => p.type === 'geometry').length;
    const lessonPlan = projects.filter((p) => p.type === 'lesson-plan').length;
    const latex = projects.filter((p) => p.type === 'latex').length;
    return { total, geometry, lessonPlan, latex };
  }, [projects]);

  // Handle open project
  const handleOpenProject = (item: ProjectItem) => {
    if (item.type === 'geometry') {
      router.push(`/geometry?id=${encodeURIComponent(item.id)}`);
    } else if (item.type === 'lesson-plan') {
      router.push(`/lesson-plan?id=${encodeURIComponent(item.id)}`);
    } else if (item.type === 'latex') {
      router.push(`/latex/${encodeURIComponent(item.id)}`);
    }
  };

  // Handle modal submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createType) return;

    let metadata: Record<string, any> = {};
    if (createType === 'geometry') {
      metadata = { topic: 'Hình học & Đại số trực quan', badge: 'SVG / TikZ' };
    } else if (createType === 'lesson-plan') {
      metadata = { grade: newGrade, badge: 'Chuẩn 5512' };
    } else if (createType === 'latex') {
      const tpl = LATEX_TEMPLATES.find((t) => t.id === selectedTemplateId);
      metadata = { templateId: selectedTemplateId, badge: tpl?.badge || 'XeLaTeX' };
    }

    const created = createNewProject(createType, newTitle, metadata);
    setCreateType(null);
    setNewTitle('');
    refreshProjects();
    handleOpenProject(created);
  };

  // Format relative date
  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffHours = diffMs / 3600000;
    if (diffHours < 1) return 'Vừa cập nhật';
    if (diffHours < 24) return `${Math.floor(diffHours)} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[420px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] bg-indigo-500/10 rounded-full blur-[170px]" />
        <div className="absolute -bottom-20 -left-40 w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-[170px]" />
      </div>

      {/* 1. Global Standardized Header */}
      <AppHeader
        badge="Workspace Hub"
        subtitle="Trung tâm Quản lý Dự án &amp; Hệ sinh thái Toán học"
      />

      {/* 2. Main Workspace Hub Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Welcome Greeting & Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-cyan-900 to-indigo-900 dark:from-white dark:via-cyan-200 dark:to-indigo-300 bg-clip-text text-transparent">
                Xin chào, {displayName}!
              </span>
              <span className="text-xl">👋</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Quản lý toàn bộ tệp hình học, giáo án bài dạy và tài liệu LaTeX của bạn tại một nơi tập trung.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tổng số tệp:</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">{stats.total}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-slate-600 dark:text-slate-400">Hình:</span>
              <span className="font-bold font-mono">{stats.geometry}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Giáo án:</span>
              <span className="font-bold font-mono">{stats.lessonPlan}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-400">LaTeX:</span>
              <span className="font-bold font-mono">{stats.latex}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Quick Create Ribbon / Template Launcher (3 Big Cards) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>Khởi tạo dự án &amp; Công cụ mới</span>
            </h2>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Chọn công cụ để mở không gian làm việc chuyên biệt
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {/* Card 1: Geometry Canvas */}
            <div
              onClick={() => {
                setCreateType('geometry');
                setNewTitle(`Hinh_hoc_${new Date().toISOString().slice(0, 10)}`);
              }}
              className="group relative p-6 rounded-3xl border border-cyan-200/80 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-500/10 via-white to-blue-500/5 dark:from-cyan-950/40 dark:via-slate-900/70 dark:to-blue-950/30 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                    SVG &amp; TikZ
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Tạo Hình Học Mới
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Dựng hình phẳng, không gian, tự động tính toạ độ và xuất mã TikZ &amp; SVG chuẩn nét.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-cyan-100 dark:border-cyan-900/40 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Khởi tạo Canvas</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Lesson Plan 5512 */}
            <div
              onClick={() => {
                setCreateType('lesson-plan');
                setNewTitle(`Giao_an_Toan_${new Date().toISOString().slice(0, 10)}`);
              }}
              className="group relative p-6 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/5 dark:from-emerald-950/40 dark:via-slate-900/70 dark:to-teal-950/30 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Chuẩn 5512
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Tạo Giáo Án Mới
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Biên soạn kế hoạch bài dạy chuẩn 4 hoạt động BGD&amp;ĐT, tích hợp ma trận đề và xuất Word (.docx).
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Soạn giáo án</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: LaTeX Document Studio */}
            <div
              onClick={() => {
                setCreateType('latex');
                setNewTitle(`De_thi_Toan_${new Date().toISOString().slice(0, 10)}.tex`);
              }}
              className="group relative p-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-rose-500/10 via-white to-purple-500/5 dark:from-rose-950/40 dark:via-slate-900/70 dark:to-purple-950/30 hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
                    <span className="font-serif font-bold text-xl">TeX</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    XeLaTeX PDF
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Tạo Tài Liệu LaTeX
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Soạn đề thi trắc nghiệm GDPT 2018, chuyên đề bồi dưỡng, biên dịch và xuất PDF A4 tức thì.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Soạn LaTeX</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Unified Recent Documents Hub */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Quản Lý Tệp &amp; Dự Án Gần Đây</span>
              </h2>
              <p className="text-xs text-slate-500">
                Hiển thị {filteredProjects.length} trên tổng số {projects.length} tệp tài liệu
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Dạng lưới (Grid)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Dạng danh sách (List)"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="p-3 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên tài liệu, chủ đề hoặc khối lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'Tất cả tệp', count: stats.total },
                { id: 'geometry', label: '📐 Hình học', count: stats.geometry },
                { id: 'lesson-plan', label: '📚 Giáo án 5512', count: stats.lessonPlan },
                { id: 'latex', label: '📄 Tài liệu LaTeX', count: stats.latex },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    typeFilter === tab.id
                      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Render Document Grid or List */}
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Chưa tìm thấy tệp phù hợp
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy tạo tài liệu mới từ thanh khởi tạo phía trên hoặc điều chỉnh bộ lọc tìm kiếm.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredProjects.map((item) => {
                const isGeo = item.type === 'geometry';
                const isLp = item.type === 'lesson-plan';
                const isLatex = item.type === 'latex';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenProject(item)}
                    className="group relative p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 hover:border-cyan-500/60 transition-all duration-200 shadow-2xs hover:shadow-xl hover:shadow-cyan-500/5 cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Type Badge + Actions Menu */}
                      <div className="flex items-center justify-between">
                        {isGeo && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                            <Compass className="w-3.5 h-3.5 text-cyan-500" />
                            Hình học
                          </span>
                        )}
                        {isLp && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                            Giáo án 5512
                          </span>
                        )}
                        {isLatex && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            <span className="font-serif font-bold text-xs">TeX</span>
                            LaTeX Studio
                          </span>
                        )}

                        {/* Direct Action Icons */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingProject(item);
                              setRenameTitleInput(item.title);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Đổi tên"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateProject(item.id);
                              refreshProjects();
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Nhân bản"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Bạn có chắc muốn xóa tệp "${item.title}"?`)) {
                                deleteProject(item.id);
                                refreshProjects();
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {item.title}
                      </h3>

                      {/* Content / Metadata Snippet Preview */}
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 font-mono overflow-hidden max-h-16 line-clamp-2">
                        {item.metadata?.promptText ||
                          item.metadata?.previewSnippet ||
                          item.metadata?.topic ||
                          'Dự án toán học MathAIO'}
                      </div>
                    </div>

                    {/* Bottom Metadata Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatRelativeTime(item.updatedAt)}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Mở tệp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table / List View */
            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 overflow-hidden shadow-2xs">
              {filteredProjects.map((item) => {
                const isGeo = item.type === 'geometry';
                const isLp = item.type === 'lesson-plan';
                const isLatex = item.type === 'latex';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenProject(item)}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Type Icon Box */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                          isGeo
                            ? 'bg-cyan-500/15 text-cyan-600'
                            : isLp
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-rose-500/15 text-rose-600'
                        }`}
                      >
                        {isGeo && <Compass className="w-5 h-5" />}
                        {isLp && <BookOpen className="w-5 h-5" />}
                        {isLatex && <span className="font-serif font-bold text-sm">TeX</span>}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-medium">
                            {isGeo ? 'Hình học' : isLp ? 'Giáo án 5512' : 'Tài liệu LaTeX'}
                          </span>
                          <span>•</span>
                          <span>{formatRelativeTime(item.updatedAt)}</span>
                          {item.metadata?.grade && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                {item.metadata.grade}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingProject(item);
                          setRenameTitleInput(item.title);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Đổi tên"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateProject(item.id);
                          refreshProjects();
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Nhân bản"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc muốn xóa tệp "${item.title}"?`)) {
                            deleteProject(item.id);
                            refreshProjects();
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenProject(item)}
                        className="ml-2 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>Mở</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Quick Create Modal */}
      {createType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                    createType === 'geometry'
                      ? 'bg-cyan-500/15 text-cyan-600'
                      : createType === 'lesson-plan'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-rose-500/15 text-rose-600'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {createType === 'geometry' && 'Khởi Tạo Dự Án Hình Học Mới'}
                  {createType === 'lesson-plan' && 'Khởi Tạo Kế Hoạch Bài Dạy 5512'}
                  {createType === 'latex' && 'Khởi Tạo Tài Liệu LaTeX Mới'}
                </h3>
              </div>
              <button
                onClick={() => setCreateType(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tên tệp / Bài học:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tên tài liệu..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Specific inputs for Lesson Plan */}
              {createType === 'lesson-plan' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Khối lớp áp dụng:
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option>Toán 10 (Chương trình mới 2018)</option>
                    <option>Toán 11 (Chương trình mới 2018)</option>
                    <option>Toán 12 (Chương trình mới 2018)</option>
                    <option>Toán THCS (Lớp 6 - 9)</option>
                  </select>
                </div>
              )}

              {/* Specific inputs for LaTeX */}
              {createType === 'latex' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chọn mẫu khởi tạo sẵn:
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {LATEX_TEMPLATES.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          selectedTemplateId === tpl.id
                            ? 'bg-rose-500/15 border-rose-500/40 font-bold text-rose-900 dark:text-rose-200 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span>{tpl.name}</span>
                          <p className="text-[10px] text-slate-500 font-normal">{tpl.description}</p>
                        </div>
                        {selectedTemplateId === tpl.id && (
                          <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Khởi tạo &amp; Vào việc ngay →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Đổi Tên Tệp */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Đổi Tên Dự Án
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (renamingProject && renameTitleInput.trim()) {
                  renameProject(renamingProject.id, renameTitleInput);
                  setRenamingProject(null);
                  refreshProjects();
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                required
                value={renameTitleInput}
                onChange={(e) => setRenameTitleInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingProject(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Footer */}
      <footer className="relative z-10 shrink-0 px-4 md:px-8 py-3.5 border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>MathAIO Studio &copy; {new Date().getFullYear()} – Không Gian Quản Lý Dự Án Toán Học Toàn Diện</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <Link
            href="/changelog?from=%2F"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted font-mono text-[11px]"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống sẵn sàng</span>
        </div>
      </footer>
    </div>
  );
}
