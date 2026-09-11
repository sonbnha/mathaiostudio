'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Star,
  ChevronDown,
  Zap,
  Check,
  FolderOpen,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import AppHeader from '@/components/header/AppHeader';
import { LATEX_TEMPLATES, getTemplateById } from '@/components/latex/LaTeXTemplates';
import {
  getAllProjects,
  createNewProject,
  deleteProject,
  duplicateProject,
  renameProject,
  toggleStarProject,
  generateDefaultGeometryTitle,
  type ProjectItem,
  type ProjectType,
} from '@/lib/storage/projectStore';

export interface AuthenticatedToolsDashboardProps {
  user: any;
  onLogout: () => Promise<void> | void;
}

// 1-Click Quick Template Presets
const QUICK_TEMPLATES = [
  {
    id: 'tpl-thpt-2025',
    title: 'Đề thi TN THPT Cấu trúc 2025',
    type: 'latex' as ProjectType,
    badge: 'GDPT 2018',
    gradient: 'from-rose-500/10 via-pink-500/5 to-indigo-500/10',
    border: 'hover:border-rose-500/50',
    tagColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    description: '3 phần: Trắc nghiệm 4 đáp án, Đúng/Sai, Trả lời ngắn',
    icon: <span className="font-serif font-bold text-xs">TeX</span>,
    action: { templateId: 'thpt_2025', target: 'latex' },
  },
  {
    id: 'tpl-geo-3d',
    title: 'Hình không gian & Trục Oxyz',
    type: 'geometry' as ProjectType,
    badge: '3D Vector',
    gradient: 'from-cyan-500/10 via-sky-500/5 to-blue-500/10',
    border: 'hover:border-cyan-500/50',
    tagColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    description: 'Dựng hình chóp, khối lăng trụ, xuất mã TikZ & SVG',
    icon: <Compass className="w-4 h-4 text-cyan-500" />,
    action: { promptText: 'Cho hình chóp S.ABC có đáy ABC là tam giác vuông...', target: 'geometry' },
  },
  {
    id: 'tpl-lp-5512',
    title: 'Giáo án 4 hoạt động BGD&ĐT',
    type: 'lesson-plan' as ProjectType,
    badge: 'Công văn 5512',
    gradient: 'from-emerald-500/10 via-teal-500/5 to-emerald-500/10',
    border: 'hover:border-emerald-500/50',
    tagColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    description: 'Khởi động, Khám phá, Luyện tập, Vận dụng chuẩn Bộ GD',
    icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    action: { grade: 'Toán 10', target: 'lesson-plan' },
  },
  {
    id: 'tpl-analysis-plot',
    title: 'Bảng biến thiên & Khảo sát hàm số',
    type: 'latex' as ProjectType,
    badge: 'Giải tích',
    gradient: 'from-indigo-500/10 via-purple-500/5 to-indigo-500/10',
    border: 'hover:border-indigo-500/50',
    tagColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    description: 'Khảo sát cực trị, điểm uốn, đồ thị và bảng biến thiên',
    icon: <span className="font-serif font-bold text-xs">f(x)</span>,
    action: { templateId: 'topic_advanced', target: 'latex' },
  },
  {
    id: 'tpl-geo-2d',
    title: 'Hình học phẳng & Đường tròn (O)',
    type: 'geometry' as ProjectType,
    badge: 'Hình phẳng',
    gradient: 'from-amber-500/10 via-orange-500/5 to-amber-500/10',
    border: 'hover:border-amber-500/50',
    tagColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    description: 'Tam giác nội/ngoại tiếp, đường cao, trung tuyến, phân giác',
    icon: <Shapes className="w-4 h-4 text-amber-500" />,
    action: { promptText: 'Cho tam giác ABC nhọn nội tiếp đường tròn (O)...', target: 'geometry' },
  },
];

export default function AuthenticatedToolsDashboard({
  user,
  onLogout,
}: AuthenticatedToolsDashboardProps) {
  const router = useRouter();

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'geometry' | 'lesson-plan' | 'latex' | 'starred'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New Dropdown state
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // Creation Modals
  const [createType, setCreateType] = useState<ProjectType | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('Toán 10');
  const [selectedTemplateId, setSelectedTemplateId] = useState('thpt_2025');

  // Rename modal
  const [renamingProject, setRenamingProject] = useState<ProjectItem | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // Close split menu when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setProjects(getAllProjects());
  }, []);

  const refreshProjects = () => {
    setProjects(getAllProjects());
  };

  const displayName =
    user?.name || user?.username || user?.email?.split('@')[0] || 'Thầy/Cô';

  // Toggle Star
  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStarProject(id);
    refreshProjects();
  };

  // Filter and sort
  const filteredProjects = useMemo(() => {
    let list = projects.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.metadata?.topic && item.metadata.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.metadata?.grade && item.metadata.grade.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (activeFilter === 'all') return true;
      if (activeFilter === 'starred') return Boolean(item.isStarred);
      return item.type === activeFilter;
    });

    if (sortBy === 'newest') {
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [projects, searchQuery, activeFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const geometry = projects.filter((p) => p.type === 'geometry').length;
    const lessonPlan = projects.filter((p) => p.type === 'lesson-plan').length;
    const latex = projects.filter((p) => p.type === 'latex').length;
    const starred = projects.filter((p) => p.isStarred).length;
    return { total, geometry, lessonPlan, latex, starred };
  }, [projects]);

  // Open workspace handler
  const handleOpenProject = (item: ProjectItem) => {
    if (item.type === 'geometry') {
      router.push(`/geometry?id=${encodeURIComponent(item.id)}`);
    } else if (item.type === 'lesson-plan') {
      router.push(`/lesson-plan?id=${encodeURIComponent(item.id)}`);
    } else if (item.type === 'latex') {
      router.push(`/latex?id=${encodeURIComponent(item.id)}`);
    }
  };

  // Quick 1-click template starter
  const handleQuickStartTemplate = (tpl: (typeof QUICK_TEMPLATES)[0]) => {
    let metadata: Record<string, any> = {};
    if (tpl.type === 'latex') {
      metadata = { templateId: tpl.action.templateId, badge: tpl.badge };
    } else if (tpl.type === 'geometry') {
      metadata = { promptText: tpl.action.promptText, badge: tpl.badge };
    } else if (tpl.type === 'lesson-plan') {
      metadata = { grade: tpl.action.grade, badge: tpl.badge };
    }

    const created = createNewProject(tpl.type, tpl.title, metadata);
    refreshProjects();
    handleOpenProject(created);
  };

  // Handle modal submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createType) return;

    let metadata: Record<string, any> = {};
    if (createType === 'geometry') {
      metadata = { topic: 'Hình học phẳng & Không gian', badge: 'SVG / TikZ' };
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

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffHours = diffMs / 3600000;
    if (diffHours < 0.1) return 'Vừa xong';
    if (diffHours < 1) return `${Math.floor(diffMs / 60000)} phút trước`;
    if (diffHours < 24) return `${Math.floor(diffHours)} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  // Helper to extract LaTeX title and clean question lines from real TeX code
  const getLatexCardPreview = (item: ProjectItem): { title: string; lines: string[] } => {
    const content = item.content || item.metadata?.source || item.thumbnail || item.metadata?.previewSnippet || '';
    if (!content) {
      return {
        title: item.title.replace(/\.tex$/i, ''),
        lines: ['(Chưa có nội dung văn bản TeX)'],
      };
    }

    // Extract \title{...}
    const titleMatch = content.match(/\\title\{([^}]+)\}/);
    let docTitle = titleMatch ? titleMatch[1].trim() : '';

    if (!docTitle) {
      const secMatch = content.match(/\\section\*?\{([^}]+)\}/);
      if (secMatch) docTitle = secMatch[1].trim();
    }
    if (!docTitle) {
      docTitle = item.title.replace(/\.tex$/i, '');
    }

    // Extract non-header content lines
    const rawLines = content.split('\n');
    const cleanLines: string[] = [];

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('%')) continue;
      if (trimmed.startsWith('\\documentclass') || trimmed.startsWith('\\usepackage')) continue;
      if (trimmed.startsWith('\\begin{document}') || trimmed.startsWith('\\end{document}')) continue;
      if (trimmed.startsWith('\\maketitle') || trimmed.startsWith('\\title')) continue;
      if (trimmed.startsWith('\\section') || trimmed.startsWith('\\subsection')) continue;

      // Clean inline latex commands for readability
      const sanitized = trimmed
        .replace(/\\textbf\{([^}]+)\}/g, '$1')
        .replace(/\\textit\{([^}]+)\}/g, '$1')
        .replace(/\\underline\{([^}]+)\}/g, '$1')
        .replace(/\$([^$]+)\$/g, '$1')
        .replace(/\\[a-zA-Z]+/g, ' ')
        .replace(/[{}\\]/g, '')
        .trim();

      if (sanitized.length > 2) {
        cleanLines.push(sanitized);
        if (cleanLines.length >= 2) break;
      }
    }

    return {
      title: docTitle,
      lines: cleanLines.length > 0 ? cleanLines : ['Tài liệu biên soạn chuẩn XeLaTeX A4'],
    };
  };

  // Helper to extract real Lesson Plan activities
  const getLessonPlanCardPreview = (item: ProjectItem): { grade: string; topic: string; activities: string[] } => {
    const grade = item.metadata?.grade || 'Toán THPT';
    const topic = item.metadata?.topic || item.title;

    let activities: string[] = [];
    if (item.metadata?.activities && Array.isArray(item.metadata.activities) && item.metadata.activities.length > 0) {
      activities = item.metadata.activities;
    } else {
      const text = item.content || item.thumbnail || item.metadata?.lessonContent || item.metadata?.previewSnippet || '';
      if (text) {
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (
            trimmed.toLowerCase().includes('hoạt động 1') ||
            trimmed.toLowerCase().includes('hoạt động 2') ||
            trimmed.toLowerCase().includes('hoạt động 3') ||
            trimmed.toLowerCase().includes('hoạt động 4') ||
            trimmed.toLowerCase().includes('hđ 1') ||
            trimmed.toLowerCase().includes('hđ 2') ||
            trimmed.toLowerCase().includes('hđ 3') ||
            trimmed.toLowerCase().includes('hđ 4') ||
            trimmed.startsWith('1. Khởi động') ||
            trimmed.startsWith('2. Hình thành') ||
            trimmed.startsWith('3. Luyện tập') ||
            trimmed.startsWith('4. Vận dụng')
          ) {
            activities.push(trimmed.replace(/^[-*#\s]+/, '').slice(0, 42));
            if (activities.length >= 3) break;
          }
        }
      }
    }

    if (activities.length === 0) {
      activities = [
        '1. Khởi động: Tiếp cận vấn đề & tạo động cơ',
        '2. Hình thành kiến thức: Xây dựng bài học mới',
        '3. Luyện tập & Vận dụng: Củng cố kỹ năng',
      ];
    }

    return { grade, topic, activities };
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

      {/* 2. Main Two-Column Container (Canvas-First Launcher Layout) */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)] max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* LEFT COLUMN: Compact Tool Dock (Sidebar w-60 shrink-0) */}
        <aside className="w-full md:w-60 shrink-0 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Split / Dropdown "+ Tạo mới" Button */}
            <div className="relative" ref={newMenuRef}>
              <button
                type="button"
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-between transition-all duration-200 cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Tạo dự án mới</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isNewMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Split Menu Dropdown */}
              {isNewMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      const title = generateDefaultGeometryTitle();
                      const created = createNewProject('geometry', title, {
                        topic: 'Hình học phẳng & Không gian',
                        badge: 'SVG Vector',
                      });
                      refreshProjects();
                      router.push(`/geometry?id=${encodeURIComponent(created.id)}`);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-cyan-500/10 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold">Vẽ hình học</p>
                      <p className="text-[10px] text-slate-400 font-normal">Canvas SVG &amp; TikZ</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setCreateType('lesson-plan');
                      setNewTitle(`Giao_an_Toan_${new Date().toISOString().slice(0, 10)}`);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-500/10 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold">Soạn giáo án 5512</p>
                      <p className="text-[10px] text-slate-400 font-normal">4 hoạt động BGD</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setCreateType('latex');
                      setNewTitle(`De_thi_Toan_${new Date().toISOString().slice(0, 10)}.tex`);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-rose-500/10 text-left text-xs font-semibold flex items-center gap-2.5 text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0 font-serif font-bold text-xs">
                      TeX
                    </div>
                    <div>
                      <p className="font-bold">Tài liệu LaTeX</p>
                      <p className="text-[10px] text-slate-400 font-normal">Xuất bản PDF A4</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Category Filter List */}
            <nav className="space-y-1" aria-label="Bộ lọc không gian làm việc">
              {[
                { id: 'all', label: 'Gần đây (Tất cả)', icon: <Clock className="w-4 h-4" />, count: stats.total },
                { id: 'geometry', label: 'Hình học', icon: <Compass className="w-4 h-4 text-cyan-500" />, count: stats.geometry },
                { id: 'lesson-plan', label: 'Giáo án 5512', icon: <BookOpen className="w-4 h-4 text-emerald-500" />, count: stats.lessonPlan },
                { id: 'latex', label: 'LaTeX Studio', icon: <span className="font-serif font-bold text-xs text-rose-500">TeX</span>, count: stats.latex },
                { id: 'starred', label: 'Đã đánh dấu sao', icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500/30" />, count: stats.starred },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveFilter(item.id as any)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeFilter === item.id
                      ? 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800/50">
                    {item.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Resource Quota Card at Sidebar Bottom */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/90 to-cyan-50/50 dark:from-slate-900/80 dark:to-cyan-950/20 border border-slate-200 dark:border-slate-800/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Hạn mức tài nguyên
              </span>
              <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
                ∞ Ω
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Hạn gói:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Trọn đời</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full w-full rounded-full" />
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Main Workspace Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TẦNG 1: Quick Template Strip (Bắt đầu nhanh từ mẫu chuẩn) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bắt đầu nhanh từ mẫu chuẩn</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">1-Click Launcher</span>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-2 pr-1 no-scrollbar">
              {QUICK_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleQuickStartTemplate(tpl)}
                  className={`shrink-0 w-64 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-gradient-to-br ${tpl.gradient} bg-white/70 dark:bg-slate-900/60 ${tpl.border} hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
                        {tpl.icon}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tpl.tagColor}`}>
                        {tpl.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {tpl.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                        {tpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Khởi tạo ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TẦNG 2: Recent Documents with Live Visual Preview */}
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-3 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tài liệu, hình học, bài giảng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Sort & View Mode Switcher */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                  aria-label="Sắp xếp tệp"
                >
                  <option value="newest">Mới cập nhật</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name">Tên A-Z</option>
                </select>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Lưới Card Trực Quan"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Danh Sách Rút Gọn"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Cards Render */}
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 mx-auto flex items-center justify-center">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Không tìm thấy tài liệu phù hợp
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy thử đổi từ khóa tìm kiếm hoặc bấm nút &ldquo;+ Tạo dự án mới&rdquo; ở thanh bên trái.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID WITH LIVE VISUAL PREVIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {filteredProjects.map((item) => {
                  const isGeo = item.type === 'geometry';
                  const isLp = item.type === 'lesson-plan';
                  const isLatex = item.type === 'latex';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenProject(item)}
                      className="group relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-cyan-500/60 transition-all duration-200 shadow-2xs hover:shadow-xl hover:shadow-cyan-500/5 cursor-pointer flex flex-col overflow-hidden"
                    >
                      {/* 1. Top Section: Live Visual Miniature Thumbnail (Light Paper Canvas) */}
                      <div className="h-32 bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 relative flex items-center justify-center p-2.5 overflow-hidden">
                        {/* 1. GEOMETRY LIVE PREVIEW */}
                        {isGeo &&
                          (() => {
                            const svgContent =
                              item.thumbnail ||
                              item.metadata?.svgCode ||
                              (typeof item.content === 'string' && item.content.includes('<svg')
                                ? item.content
                                : null);

                            return (
                              <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-50 border border-slate-200/90 dark:border-slate-300 shadow-2xs relative flex items-center justify-center p-2 overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:10px_10px] group-hover:scale-[1.01] transition-transform">
                                {svgContent && svgContent.includes('<svg') ? (
                                  <div
                                    className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto pointer-events-none transition-transform group-hover:scale-[1.02]"
                                    dangerouslySetInnerHTML={{ __html: svgContent }}
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-xl border border-dashed border-cyan-400/40 bg-cyan-50/60 flex flex-col items-center justify-center gap-1 text-cyan-700">
                                    <Compass className="w-5 h-5 stroke-[1.5]" />
                                    <span className="text-[10px] font-mono font-bold">Bản vẽ trống</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                        {/* 2. LESSON PLAN LIVE PREVIEW */}
                        {isLp &&
                          (() => {
                            const { grade, topic, activities } = getLessonPlanCardPreview(item);

                            return (
                              <div className="w-full max-w-[240px] h-[106px] bg-white dark:bg-slate-50 rounded-xl border border-emerald-300/80 dark:border-emerald-300 shadow-xs p-2 flex flex-col justify-between text-[8px] font-sans select-none overflow-hidden group-hover:border-emerald-500 transition-colors">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[8px]">
                                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {grade}
                                  </span>
                                  <span className="text-[7px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold border border-emerald-200">
                                    Chuẩn 5512
                                  </span>
                                </div>

                                <div className="space-y-0.5 text-slate-700 text-[8px] py-0.5 overflow-hidden leading-tight font-medium">
                                  {activities.slice(0, 3).map((act, idx) => (
                                    <div key={idx} className="flex items-center gap-1 truncate">
                                      <span className="w-3 h-3 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex items-center justify-center font-bold text-[7px] shrink-0 font-mono">
                                        {idx + 1}
                                      </span>
                                      <span className="truncate">{act}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-between items-center text-[7px] text-slate-500 font-mono border-t border-slate-200 pt-0.5">
                                  <span className="truncate max-w-[130px] font-semibold text-slate-700">{topic}</span>
                                  <span className="text-emerald-700 font-bold shrink-0">4 Hoạt động</span>
                                </div>
                              </div>
                            );
                          })()}

                        {/* 3. LATEX LIVE PREVIEW */}
                        {isLatex &&
                          (() => {
                            const isImageDataUrl =
                              item.thumbnail &&
                              (item.thumbnail.startsWith('data:image/') || item.thumbnail.startsWith('http'));

                            if (isImageDataUrl) {
                              return (
                                <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-50 border border-slate-200/90 dark:border-slate-300 p-1 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-full h-full object-contain pointer-events-none rounded-lg"
                                  />
                                </div>
                              );
                            }

                            const { title: latexTitle, lines } = getLatexCardPreview(item);

                            return (
                              <div className="w-full max-w-[220px] h-[106px] bg-white dark:bg-slate-50 rounded-xl border border-rose-300/80 dark:border-rose-300 shadow-xs p-2 flex flex-col justify-between text-[8px] font-sans select-none relative overflow-hidden group-hover:border-rose-400 transition-colors">
                                <div className="border-b border-slate-200 pb-1">
                                  <div className="flex items-center justify-between gap-1 text-[7px] text-rose-700 font-mono font-bold">
                                    <span className="truncate">{item.metadata?.badge || 'XeLaTeX A4'}</span>
                                    <span className="shrink-0 font-serif font-bold text-rose-800">TeX</span>
                                  </div>
                                  <p className="font-bold text-[9px] text-slate-900 truncate mt-0.5">
                                    {latexTitle}
                                  </p>
                                </div>

                                <div className="space-y-0.5 text-slate-600 text-[8px] font-mono leading-tight flex-1 py-0.5 overflow-hidden font-medium">
                                  {lines.slice(0, 2).map((l, idx) => (
                                    <p key={idx} className="truncate">
                                      {l}
                                    </p>
                                  ))}
                                </div>

                                <div className="flex justify-between items-center text-[7px] text-slate-500 font-mono border-t border-slate-200 pt-0.5">
                                  <span className="font-semibold text-slate-600">Trang 1/A4</span>
                                  <span className="text-rose-700 font-bold">PDF Ready</span>
                                </div>
                              </div>
                            );
                          })()}

                        {/* Star Toggle on top right of thumbnail */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(item.id, e)}
                          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 shadow-xs transition cursor-pointer"
                          title={item.isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao yêu thích'}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                      </div>

                      {/* 2. Bottom Section: Metadata & Quick Actions */}
                      <div className="p-4 flex flex-col justify-between gap-3 flex-1">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            {isGeo && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                                Hình học
                              </span>
                            )}
                            {isLp && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                Giáo án 5512
                              </span>
                            )}
                            {isLatex && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                                LaTeX TeX
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(item.updatedAt)}
                            </span>
                          </div>

                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                        </div>

                        {/* Action buttons row */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-slate-400">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingProject(item);
                                setRenameTitleInput(item.title);
                              }}
                              className="p-1 rounded hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                              className="p-1 rounded hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Nhân bản"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Xóa tệp "${item.title}"?`)) {
                                  deleteProject(item.id);
                                  refreshProjects();
                                }
                              }}
                              className="p-1 rounded hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="font-bold text-cyan-600 dark:text-cyan-400 text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            <span>Mở workspace</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 overflow-hidden shadow-2xs">
                {filteredProjects.map((item) => {
                  const isGeo = item.type === 'geometry';
                  const isLp = item.type === 'lesson-plan';
                  const isLatex = item.type === 'latex';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenProject(item)}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={(e) => handleToggleStar(item.id, e)}
                          className="p-1 text-slate-400 hover:text-amber-500 transition shrink-0"
                        >
                          <Star className={`w-4 h-4 ${item.isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>

                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isGeo
                              ? 'bg-cyan-500/15 text-cyan-600'
                              : isLp
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-rose-500/15 text-rose-600 font-serif text-sm'
                          }`}
                        >
                          {isGeo && <Compass className="w-4 h-4" />}
                          {isLp && <BookOpen className="w-4 h-4" />}
                          {isLatex && 'TeX'}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-medium">
                              {isGeo ? 'Hình học' : isLp ? 'Giáo án 5512' : 'Tài liệu LaTeX'}
                            </span>
                            <span>•</span>
                            <span>{formatRelativeTime(item.updatedAt)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingProject(item);
                            setRenameTitleInput(item.title);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Nhân bản"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Xóa tệp "${item.title}"?`)) {
                              deleteProject(item.id);
                              refreshProjects();
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenProject(item)}
                          className="ml-1.5 px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
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
      </div>

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
                      : 'bg-rose-500/15 text-rose-600 font-serif'
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
          <span>MathAIO Studio &copy; {new Date().getFullYear()} – Canvas-First Workspace &amp; Project Hub</span>
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
