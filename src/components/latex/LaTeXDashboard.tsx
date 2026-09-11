'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCode,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  ArrowRight,
  FileText,
  Shapes,
  GraduationCap,
  Clock,
  Layers,
  CheckCircle2,
  FolderTree,
  LayoutGrid,
  List as ListIcon,
  X,
  BookOpen,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import AppHeader from '@/components/header/AppHeader';
import { LATEX_TEMPLATES, getTemplateById } from '@/components/latex/LaTeXTemplates';
import {
  getStoredDocuments,
  createNewDocument,
  duplicateDocument,
  deleteDocument,
  renameDocument,
  type LatexDocumentItem,
} from '@/lib/latexStorage';

export default function LaTeXDashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState<LatexDocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('De_thi_Toan_chua_dat_ten.tex');
  const [selectedTemplateId, setSelectedTemplateId] = useState('thpt_2025');

  // Rename modal
  const [renamingDoc, setRenamingDoc] = useState<LatexDocumentItem | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Load documents on mount
  useEffect(() => {
    setDocuments(getStoredDocuments());
  }, []);

  const refreshDocuments = () => {
    setDocuments(getStoredDocuments());
  };

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.templateId.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (categoryFilter === 'all') return true;

      const tpl = getTemplateById(doc.templateId);
      return tpl?.category === categoryFilter;
    });
  }, [documents, searchQuery, categoryFilter]);

  // Handle create new document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createNewDocument(newTitle, selectedTemplateId);
    setIsCreateModalOpen(false);
    router.push(`/latex/${created.id}`);
  };

  // Handle duplicate
  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateDocument(id);
    refreshDocuments();
  };

  // Handle delete
  const handleDelete = (doc: LatexDocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa tài liệu "${doc.title}" không?`)) {
      deleteDocument(doc.id);
      refreshDocuments();
    }
  };

  // Handle rename submit
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingDoc && renameInput.trim()) {
      renameDocument(renamingDoc.id, renameInput);
      setRenamingDoc(null);
      refreshDocuments();
    }
  };

  // Format date helper
  const formatDate = (timestamp: number) => {
    const diffHours = (Date.now() - timestamp) / 3600000;
    if (diffHours < 1) return 'Vừa cập nhật';
    if (diffHours < 24) return `${Math.floor(diffHours)} giờ trước`;
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('vi-VN')} lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Unified Global Header */}
      <AppHeader
        badge="LaTeX Studio"
        subtitle="Quản lý dự án &amp; Biên soạn xuất bản PDF A4"
      />

      {/* Main Dashboard Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section & Quick Start */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 text-white overflow-hidden shadow-xl shadow-cyan-900/10">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Hệ Thống Biên Soạn Toán Học Cao Cấp</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản Lý Dự Án &amp; Tài Liệu LaTeX
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed">
              Khởi tạo đề thi chuẩn cấu trúc 2025, chuyên đề bồi dưỡng, hình học TikZ hoặc tiếp tục chỉnh sửa các bản thảo đã lưu trong bộ nhớ máy.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setNewTitle(`De_thi_Toan_${new Date().toISOString().slice(0, 10)}.tex`);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-cyan-50 font-bold text-xs shadow-lg shadow-black/10 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-600" />
                <span>Tạo Tài Liệu Mới</span>
              </button>

              <button
                onClick={() => {
                  if (documents.length > 0) {
                    router.push(`/latex/${documents[0].id}`);
                  } else {
                    const doc = createNewDocument('Tai_lieu_toan_moi.tex', 'thpt_2025');
                    router.push(`/latex/${doc.id}`);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs backdrop-blur-md transition-colors cursor-pointer"
              >
                <span>Mở Bản Nháp Gần Nhất →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Templates Shelf */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-cyan-500" />
              <span>Khởi tạo nhanh từ Mẫu chuẩn (Templates)</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {LATEX_TEMPLATES.length} mẫu có sẵn
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {LATEX_TEMPLATES.slice(0, 4).map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplateId(tpl.id);
                  setNewTitle(`${tpl.name.replace(/[^a-zA-Z0-9]/g, '_')}.tex`);
                  setIsCreateModalOpen(true);
                }}
                className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 hover:border-cyan-500/50 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-serif font-bold text-xs flex items-center justify-center">
                      TeX
                    </span>
                    {tpl.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        {tpl.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Dùng mẫu này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document History & Search / Filter Controls */}
        <div className="space-y-4 pt-2">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu theo tên hoặc mẫu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'gdpt2018', label: 'GDPT 2018' },
                { id: 'exam', label: 'Đề thi' },
                { id: 'topic', label: 'Chuyên đề' },
                { id: 'tikz', label: 'TikZ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    categoryFilter === tab.id
                      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
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
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dạng danh sách (List)"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document List / Grid Render */}
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Chưa tìm thấy tài liệu phù hợp
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy tạo tài liệu mới hoặc chọn mẫu chuẩn có sẵn để bắt đầu biên soạn.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Khởi tạo tài liệu ngay</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const tpl = getTemplateById(doc.templateId);
                const lineCount = doc.source.split('\n').length;
                return (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/latex/${doc.id}`)}
                    className="group relative p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 hover:border-cyan-500/60 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {tpl?.name || 'LaTeX Document'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingDoc(doc);
                              setRenameInput(doc.title);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Đổi tên"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(doc.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Nhân bản"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(doc, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                        {doc.title}
                      </h3>

                      {/* Code preview snippet */}
                      <pre className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/70 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden max-h-16">
                        {doc.source.slice(0, 140)}...
                      </pre>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(doc.updatedAt)}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {lineCount} dòng TeX
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 overflow-hidden shadow-2xs">
              {filteredDocuments.map((doc) => {
                const tpl = getTemplateById(doc.templateId);
                return (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/latex/${doc.id}`)}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0 font-serif font-bold text-xs">
                        TeX
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {doc.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{tpl?.name || 'Mẫu tự chọn'}</span>
                          <span>•</span>
                          <span>{formatDate(doc.updatedAt)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingDoc(doc);
                          setRenameInput(doc.title);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Đổi tên"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(doc.id, e)}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Nhân bản"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(doc, e)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/latex/${doc.id}`)}
                        className="ml-2 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <span>Soạn thảo</span>
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

      {/* Modal: Tạo Tài Liệu Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold text-sm">
                  +
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tạo Tài Liệu LaTeX Mới
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tên tệp tài liệu (.tex):
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: De_thi_Khao_sat_Toan_12.tex"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chọn mẫu khởi tạo sẵn:
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {LATEX_TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        selectedTemplateId === tpl.id
                          ? 'bg-cyan-500/15 border-cyan-500/40 font-bold text-cyan-900 dark:text-cyan-200 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{tpl.name}</span>
                          {tpl.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-600 border border-cyan-300">
                              {tpl.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {tpl.description}
                        </p>
                      </div>
                      {selectedTemplateId === tpl.id && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Khởi tạo &amp; Soạn thảo →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi Tên Tài Liệu */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Đổi Tên Tài Liệu
            </h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
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

      {/* Footer */}
      <footer className="shrink-0 px-4 md:px-8 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-xs text-slate-500 flex items-center justify-between">
        <span>MathAIO Studio &copy; {new Date().getFullYear()} · LaTeX Document Workspace</span>
        <span className="font-mono text-[11px]">{APP_VERSION.fullString}</span>
      </footer>
    </div>
  );
}
