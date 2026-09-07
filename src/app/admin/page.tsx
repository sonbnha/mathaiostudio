'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  Users,
  History,
  PlusCircle,
  ChevronRight,
  BarChart3,
  Copy,
  Check,
  UserPlus,
  FileText,
} from 'lucide-react';
import { formatDateVN } from '@/config/version';
import { useAdminContext, getKeyStatus, getMaskedKey } from './AdminContext';

export default function AdminOverviewPage() {
  const {
    currentUser,
    isAdmin,
    isStaff,
    isStaffUnlimited,
    staffCreatedCount,
    staffMaxCredits,
    staffQuotaPercent,
    keys,
    userAccounts,
    changelogs,
    showToast,
  } = useAdminContext();

  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<string>>(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const toggleRevealKey = (id: string) => {
    setRevealedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    showToast('Đã sao chép mã Key!');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const totalKeys = keys.length;
  const activeKeysCount = keys.filter((k) => getKeyStatus(k).label === 'Khả Dụng').length;
  const totalGenerations = keys.reduce((acc, k) => acc + (k.usedCredits || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Collaborator Quota Progress Banner (If CTV role) */}
      {isStaff && (
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Hạn mức License Keys được cấp
              </span>
            </div>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              {isStaffUnlimited
                ? `∞ (Đã tạo ${staffCreatedCount} keys)`
                : `${staffCreatedCount} / ${staffMaxCredits} Key (${staffQuotaPercent}%)`}
            </span>
          </div>

          {!isStaffUnlimited ? (
            <>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${staffQuotaPercent}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bạn còn được phép tạo thêm{' '}
                <strong className="text-cyan-600 dark:text-cyan-400">
                  {Math.max(0, (staffMaxCredits || 50) - staffCreatedCount)}
                </strong>{' '}
                License Key.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tài khoản của bạn được cấp quyền tạo key{' '}
              <strong className="text-purple-600 dark:text-purple-400">∞ vô hạn</strong>.
            </p>
          )}
        </div>
      )}

      {/* Database & Cloud Connection Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">Hệ Thống Dữ Liệu:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Neon Postgres (Cloud DB) - Đang Kết Nối
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Bảo mật RBAC: Active • Auto Sync
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/license-keys"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-cyan-500/50 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng License Keys</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {totalKeys}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/admin/license-keys"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-emerald-500/50 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Keys Khả Dụng</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {activeKeysCount}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition" />
        </Link>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng Ω Đã Dùng</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {totalGenerations} Ω
              </h3>
            </div>
          </div>
        </div>

        {isAdmin && (
          <Link
            href="/admin/users"
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-rose-500/50 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tài Khoản Hệ Thống</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {userAccounts.length}
                </h3>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition" />
          </Link>
        )}
      </div>

      {/* Quick Actions Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/license-keys"
          className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/25 flex flex-col gap-2 hover:border-cyan-500 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">Quản Lý & Tạo License Key</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Cấp mã bản quyền cho khách hàng, hỗ trợ in thẻ VIP Voucher và gửi tin nhắn bàn giao.
          </p>
        </Link>

        {isAdmin && (
          <Link
            href="/admin/users"
            className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/25 flex flex-col gap-2 hover:border-rose-500 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">Quản Lý Tài Khoản</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tạo và quản lý quyền truy cập cho CTV, chỉnh sửa hạn mức và phân quyền hệ thống.
            </p>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/admin/changelog"
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/25 flex flex-col gap-2 hover:border-indigo-500 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">Quản Lý Changelog</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Viết thông báo cập nhật tính năng mới hiển thị trực tiếp trong Changelog Modal.
            </p>
          </Link>
        )}
      </div>

      {/* Recent License Keys Table */}
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>License Keys Mới Tạo Gần Đây</span>
          </h2>
          <Link
            href="/admin/license-keys"
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Xem tất cả ({keys.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-4">License Key</th>
                <th className="py-2.5 px-4">Ω Đã Dùng</th>
                <th className="py-2.5 px-4">Hạn Dùng</th>
                <th className="py-2.5 px-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Chưa có License Key nào.
                  </td>
                </tr>
              ) : (
                keys.slice(0, 5).map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/50 transition">
                    <td className="py-2.5 px-4 whitespace-nowrap w-[200px] min-w-[190px]">
                      <div className="flex items-center justify-between w-[185px] h-[34px] bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-lg px-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        <span
                          onClick={() => toggleRevealKey(k.id)}
                          className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-300 tracking-wide select-all cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 truncate mr-1.5"
                          title="Click để sao chép / xem đầy đủ"
                        >
                          {revealedKeyIds.has(k.id) ? k.key : getMaskedKey(k.key)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyKey(k.key, k.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-xs cursor-pointer"
                          title="Sao chép mã"
                        >
                          {copiedKeyId === k.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono">
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">{k.usedCredits}</span>
                      <span className="text-slate-400"> / {k.totalCredits === -1 ? '∞' : k.totalCredits}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-mono">
                      {k.expiresAt ? formatDateVN(k.expiresAt) : '∞'}
                    </td>
                    <td className="py-2.5 px-4">
                      {(() => {
                        const status = getKeyStatus(k);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${status.className}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                            <span>{status.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
