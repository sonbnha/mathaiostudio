'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  Copy, 
  Check, 
  Calendar, 
  Image as ImageIcon, 
  Crown,
  KeyRound,
  Activity,
  Fingerprint
} from 'lucide-react';
import { formatFullDateTimeVN, formatDateVN } from '@/config/version';

export interface UserProfileData {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
  is_active?: boolean;
  isActive?: boolean;
  is_vip?: boolean;
  isVip?: boolean;
  vip_expires_at?: string | Date | null;
  vipExpiresAt?: string | Date | null;
  remaining_quota?: number | null;
  remainingQuota?: number | null;
  max_quota?: number | null;
  maxQuota?: number | null;
  key_quota?: number;
  keyQuota?: number;
  saved_diagrams_count?: number;
  savedDiagramsCount?: number;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
  _count?: {
    keys?: number;
  };
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileData | null;
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen || !user) return null;

  const handleCopyId = () => {
    if (!user.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!user.email) return;
    navigator.clipboard.writeText(user.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const roleLower = (user.role || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const isStaff = roleLower === 'staff' || roleLower === 'ctv';
  const isVip = Boolean(user.is_vip ?? user.isVip) || roleLower === 'vip';
  const isActive = user.isActive ?? user.is_active ?? (user.status === 'active');
  const diagramsCount = user.saved_diagrams_count ?? user.savedDiagramsCount ?? 0;
  const createdAt = user.created_at || user.createdAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Thông tin hồ sơ tài khoản
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chi tiết hồ sơ định danh và thông số hoạt động của người dùng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* PHẦN 1: Thông tin định danh */}
          <div className="flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
              <span>Định danh & Tài khoản</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Họ và Tên:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {user.name || user.username || 'Chưa cập nhật tên'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Tên đăng nhập (Username):</span>
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  @{user.username || '—'}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Email tài khoản:</span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email || 'Chưa có email'}</span>
                  </span>
                  {user.email && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="p-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition shrink-0"
                      title="Sao chép Email"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">ID Tài khoản:</span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {user.id}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition shrink-0"
                    title="Sao chép ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN 2: Vai trò & Trạng thái hệ thống */}
          <div className="flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Vai trò & Trạng thái</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Vai trò hệ thống:</span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    <Crown className="w-3 h-3" /> Quản trị viên (Admin)
                  </span>
                ) : isStaff ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                    <KeyRound className="w-3 h-3" /> Cộng tác viên (CTV)
                  </span>
                ) : isVip ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold">
                    <span>👑</span> VIP Account
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Người dùng (Free)
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Trạng thái tài khoản:</span>
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Đang hoạt động (Active)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Đã tạm khóa (Suspended)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PHẦN 3: Dữ liệu sử dụng & Thời gian */}
          <div className="flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
              <span>Dữ liệu & Thời gian</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />
                  Bộ sưu tập hình vẽ:
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                  {diagramsCount} hình đã lưu
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ngày tạo tài khoản:
                </span>
                <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 truncate" title={createdAt ? formatFullDateTimeVN(createdAt) : '—'}>
                  {createdAt ? formatDateVN(createdAt) : 'Chưa có thông tin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
