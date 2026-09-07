'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  PlusCircle,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Calendar,
  Loader2,
  X,
  AlertCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminContext, ChangelogItem } from '../AdminContext';

export default function AdminChangelogPage() {
  const {
    isAdmin,
    changelogs,
    setChangelogs,
    changelogsLoading,
    fetchAdminChangelogs,
    showToast,
  } = useAdminContext();

  const [changelogSearch, setChangelogSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Changelog Create/Edit Modal State
  const [isChangelogEditModalOpen, setIsChangelogEditModalOpen] = useState(false);
  const [editingChangelogId, setEditingChangelogId] = useState<string | null>(null);
  const [clVersion, setClVersion] = useState('');
  const [clDate, setClDate] = useState('');
  const [clTitle, setClTitle] = useState('');
  const [clChanges, setClChanges] = useState<{ type: 'feat' | 'fix' | 'improve'; description: string }[]>([
    { type: 'feat', description: '' },
  ]);
  const [clIsPublished, setClIsPublished] = useState(true);
  const [clSaveLoading, setClSaveLoading] = useState(false);
  const [clError, setClError] = useState<string | null>(null);

  // Filter changelogs
  const filteredChangelogs = changelogs.filter((cl) => {
    const q = changelogSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      cl.version.toLowerCase().includes(q) ||
      cl.title.toLowerCase().includes(q) ||
      cl.date.toLowerCase().includes(q) ||
      cl.changes?.some((c) => c.description.toLowerCase().includes(q))
    );
  });

  // Pagination calculations
  const totalItems = filteredChangelogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems > 0 ? (safePage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedChangelogs = filteredChangelogs.slice(startIndex, endIndex);

  const handleOpenCreateChangelogModal = () => {
    setEditingChangelogId(null);
    setClVersion('');
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setClDate(formattedDate);
    setClTitle('');
    setClChanges([{ type: 'feat', description: '' }]);
    setClIsPublished(true);
    setClError(null);
    setIsChangelogEditModalOpen(true);
  };

  const handleOpenEditChangelogModal = (item: ChangelogItem) => {
    setEditingChangelogId(item.id);
    setClVersion(item.version);
    setClDate(item.date);
    setClTitle(item.title);
    setClChanges(
      Array.isArray(item.changes) && item.changes.length > 0
        ? JSON.parse(JSON.stringify(item.changes))
        : [{ type: 'feat', description: '' }]
    );
    setClIsPublished(item.isPublished);
    setClError(null);
    setIsChangelogEditModalOpen(true);
  };

  const handleAddChangeRow = () => {
    setClChanges((prev) => [...prev, { type: 'improve', description: '' }]);
  };

  const handleRemoveChangeRow = (index: number) => {
    setClChanges((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next.length > 0 ? next : [{ type: 'feat', description: '' }];
    });
  };

  const handleChangeRowType = (index: number, type: 'feat' | 'fix' | 'improve') => {
    setClChanges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], type };
      return next;
    });
  };

  const handleChangeRowDesc = (index: number, description: string) => {
    setClChanges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description };
      return next;
    });
  };

  const handleSaveChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    setClError(null);

    if (!clVersion.trim() || !clTitle.trim() || !clDate.trim()) {
      setClError('Vui lòng điền đầy đủ Phiên bản, Tiêu đề và Ngày áp dụng.');
      return;
    }

    const filteredChanges = clChanges.filter((c) => c.description.trim().length > 0);
    if (filteredChanges.length === 0) {
      setClError('Vui lòng thêm ít nhất 1 mục mô tả thay đổi.');
      return;
    }

    setClSaveLoading(true);
    try {
      const isEditing = Boolean(editingChangelogId);
      const url = isEditing
        ? `/api/admin/changelog/${editingChangelogId}`
        : '/api/admin/changelog';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: clVersion.trim(),
          date: clDate.trim(),
          title: clTitle.trim(),
          changes: filteredChanges,
          isPublished: clIsPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu Changelog.');
      }

      await fetchAdminChangelogs(false);
      setIsChangelogEditModalOpen(false);
      showToast(isEditing ? 'Đã cập nhật phiên bản thành công!' : 'Đã thêm phiên bản mới thành công!');
    } catch (err: any) {
      setClError(err.message);
    } finally {
      setClSaveLoading(false);
    }
  };

  const handleToggleChangelogPublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/changelog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      if (res.ok) {
        setChangelogs((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isPublished: !currentStatus } : c))
        );
        showToast(!currentStatus ? 'Đã công khai phiên bản!' : 'Đã chuyển phiên bản về bản nháp!');
      }
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái Changelog:', err);
    }
  };

  const handleDeleteChangelog = async (id: string, version: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bản ghi phiên bản "${version}" không?`)) return;
    try {
      const res = await fetch(`/api/admin/changelog/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Không thể xóa Changelog.');
        return;
      }
      setChangelogs((prev) => prev.filter((c) => c.id !== id));
      showToast(`Đã xóa phiên bản ${version} thành công!`);
    } catch (err) {
      console.error('Lỗi khi xóa Changelog:', err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Khu vực giới hạn
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Bạn không có quyền quản trị tối cao để quản lý lịch sử phiên bản hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Changelog Card Table */}
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col gap-4 transition-colors">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Lịch Sử Phiên Bản & Cập Nhật
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                  {changelogs.length} bản ghi
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Quản lý các bản phát hành hiển thị trong cửa sổ Changelog của người dùng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={changelogSearch}
                onChange={(e) => {
                  setChangelogSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo version, tiêu đề..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-xs text-slate-900 dark:text-slate-200 outline-none w-48 sm:w-60 transition"
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchAdminChangelogs(true)}
              disabled={changelogsLoading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent transition cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${changelogsLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Add New Release Button */}
            <button
              type="button"
              onClick={handleOpenCreateChangelogModal}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Thêm Phiên Bản</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full table-fixed min-w-[750px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 w-[11%]">PHIÊN BẢN</th>
                <th className="py-3 px-4 w-[38%]">TIÊU ĐỀ PHÁT HÀNH</th>
                <th className="py-3 px-4 w-[13%]">NGÀY ÁP DỤNG</th>
                <th className="py-3 px-4 w-[20%]">MỤC THAY ĐỔI</th>
                <th className="py-3 px-4 w-[12%]">TRẠNG THÁI</th>
                <th className="py-3 px-4 w-[6%] text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {changelogsLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Đang tải danh sách phiên bản...</span>
                  </td>
                </tr>
              ) : paginatedChangelogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy phiên bản nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedChangelogs.map((cl) => {
                  const changesArr = Array.isArray(cl.changes) ? cl.changes : [];
                  return (
                    <tr key={cl.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/50 transition">
                      <td className="py-3 px-4 font-mono font-bold w-[11%]">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                          {cl.version}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 truncate w-[38%]" title={cl.title}>
                        {cl.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 w-[13%]">
                        {cl.date}
                      </td>
                      <td className="py-3 px-4 w-[20%]">
                        <div className="flex items-center">
                          <span className="text-slate-400 font-medium text-xs mr-2 shrink-0">
                            {changesArr.length} mục
                          </span>
                          <div className="inline-flex flex-wrap items-center gap-1.5">
                            {changesArr.slice(0, 2).map((ch, chIdx) => (
                              <span
                                key={chIdx}
                                className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold border ${
                                  ch.type === 'feat'
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/80'
                                    : ch.type === 'fix'
                                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/80'
                                    : 'bg-sky-950/60 text-sky-400 border-sky-800/80 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/80'
                                }`}
                              >
                                {ch.type}
                              </span>
                            ))}
                            {changesArr.length > 2 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium">
                                +{changesArr.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 w-[12%]">
                        <button
                          type="button"
                          onClick={() => handleToggleChangelogPublish(cl.id, cl.isPublished)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition ${
                            cl.isPublished
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                          }`}
                          title={cl.isPublished ? 'Bấm để ẩn bản ghi này' : 'Bấm để xuất bản công khai'}
                        >
                          {cl.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{cl.isPublished ? 'Đã Xuất Bản' : 'Bản Nháp (Ẩn)'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right w-[6%]">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditChangelogModal(cl)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-transparent transition flex items-center gap-1 cursor-pointer"
                            title="Chỉnh sửa phiên bản"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteChangelog(cl.id, cl.version)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                            title="Xóa phiên bản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {totalItems === 0 ? (
              'Không tìm thấy phiên bản nào'
            ) : (
              <>
                Đang hiển thị <span className="font-semibold text-slate-700 dark:text-slate-200">{startIndex + 1}</span> - <span className="font-semibold text-slate-700 dark:text-slate-200">{endIndex}</span> trong tổng số <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> phiên bản
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trang trước</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center border transition cursor-pointer ${
                  pageNum === safePage
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Trang sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT CHANGELOG MODAL */}
      {isChangelogEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-h-[88vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {editingChangelogId ? 'Chỉnh Sửa Phiên Bản' : 'Thêm Phiên Bản Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cập nhật các tính năng và sửa lỗi hiển thị trong Changelog
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangelogEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveChangelog} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs">
              {/* Row 1: Version + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Số Phiên Bản</span>
                  </label>
                  <input
                    type="text"
                    value={clVersion}
                    onChange={(e) => setClVersion(e.target.value)}
                    placeholder="Ví dụ: v0.1.3-alpha"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 font-mono outline-none transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ngày Áp Dụng (dd/MM/yyyy)</span>
                  </label>
                  <input
                    type="text"
                    value={clDate}
                    onChange={(e) => setClDate(e.target.value)}
                    placeholder="Ví dụ: 31/08/2026"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 font-mono outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tiêu Đề Phát Hành
                </label>
                <input
                  type="text"
                  value={clTitle}
                  onChange={(e) => setClTitle(e.target.value)}
                  placeholder="Ví dụ: Tối ưu hóa tiến trình & Fix kẹt loading"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition"
                  required
                />
              </div>

              {/* Row 3: Dynamic Changes List */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Danh Sách Thay Đổi ({clChanges.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddChangeRow}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] transition flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Thêm Mục</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-0.5">
                  {clChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2"
                    >
                      {/* Type Select */}
                      <select
                        value={change.type}
                        onChange={(e) => handleChangeRowType(idx, e.target.value as any)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border outline-none cursor-pointer uppercase ${
                          change.type === 'feat'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : change.type === 'fix'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        <option value="feat">FEAT (Tính năng)</option>
                        <option value="fix">FIX (Sửa lỗi)</option>
                        <option value="improve">IMPROVE (Cải tiến)</option>
                      </select>

                      {/* Description Input */}
                      <input
                        type="text"
                        value={change.description}
                        onChange={(e) => handleChangeRowDesc(idx, e.target.value)}
                        placeholder="Mô tả chi tiết nội dung thay đổi..."
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none transition"
                        required
                      />

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveChangeRow(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: Is Published Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Trạng Thái Xuất Bản
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {clIsPublished
                      ? 'Công khai trên popup lịch sử phiên bản người dùng'
                      : 'Bản nháp nội bộ, chưa hiển thị cho người dùng'}
                  </span>
                </div>

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
                  <span>{clIsPublished ? 'Đang Xuất Bản' : 'Bản Nháp (Ẩn)'}</span>
                </button>
              </div>

              {clError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{clError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 mt-1">
                <button
                  type="button"
                  onClick={() => setIsChangelogEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={clSaveLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-950/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {clSaveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingChangelogId ? 'Lưu Thay Đổi' : 'Tạo Phiên Bản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
