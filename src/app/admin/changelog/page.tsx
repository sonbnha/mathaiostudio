'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  PlusCircle,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminContext } from '../AdminContext';

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

  // Filter changelogs
  const filteredChangelogs = changelogs.filter((cl) => {
    const q = changelogSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      cl.version.toLowerCase().includes(q) ||
      cl.title.toLowerCase().includes(q) ||
      cl.date.toLowerCase().includes(q) ||
      cl.changes?.some((c) => ((c.description || (c as any).content || '') as string).toLowerCase().includes(q))
    );
  });

  // Pagination calculations
  const totalItems = filteredChangelogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems > 0 ? (safePage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedChangelogs = filteredChangelogs.slice(startIndex, endIndex);

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
            <Link
              href="/admin/changelog/new"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Thêm Phiên Bản</span>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full table-fixed min-w-[750px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 w-[14%] min-w-[125px] whitespace-nowrap">PHIÊN BẢN</th>
                <th className="py-3 px-4 w-[32%]">TIÊU ĐỀ PHÁT HÀNH</th>
                <th className="py-3 px-4 w-[11%] min-w-[95px] whitespace-nowrap">NGÀY ÁP DỤNG</th>
                <th className="py-3 px-4 w-[21%] min-w-[180px]">MỤC THAY ĐỔI</th>
                <th className="py-3 px-4 w-[13%] min-w-[115px] whitespace-nowrap">TRẠNG THÁI</th>
                <th className="py-3 px-4 w-[9%] min-w-[75px] whitespace-nowrap text-right">THAO TÁC</th>
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
                      <td className="py-3 px-4 font-mono font-bold w-[14%] min-w-[125px] whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono whitespace-nowrap">
                          {cl.version}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 truncate w-[32%]" title={cl.title}>
                        {cl.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 w-[11%] min-w-[95px] whitespace-nowrap">
                        {cl.date}
                      </td>
                      <td className="py-3 px-4 w-[21%] min-w-[180px]">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-slate-400 font-medium text-xs mr-1 shrink-0 whitespace-nowrap">
                            {changesArr.length} mục
                          </span>
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            {changesArr.slice(0, 2).map((ch, chIdx) => (
                              <span
                                key={chIdx}
                                className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold border whitespace-nowrap inline-flex ${
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
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium whitespace-nowrap inline-flex">
                                +{changesArr.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 w-[13%] min-w-[115px] whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleChangelogPublish(cl.id, cl.isPublished)}
                          className={`whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                            cl.isPublished
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                          }`}
                          title={cl.isPublished ? 'Bấm để ẩn bản ghi này' : 'Bấm để xuất bản công khai'}
                        >
                          {cl.isPublished ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                          <span className="whitespace-nowrap">{cl.isPublished ? 'Đã Xuất Bản' : 'Bản Nháp (Ẩn)'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right w-[9%] min-w-[75px] whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/changelog/${cl.id}/edit`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-transparent transition flex items-center gap-1 cursor-pointer"
                            title="Chỉnh sửa phiên bản"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </Link>

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
    </div>
  );
}
