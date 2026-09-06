'use client';

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Calendar, 
  Zap, 
  KeyRound, 
  Clock, 
  UserCheck, 
  Sparkles,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { formatDateVN } from '@/config/version';

export interface AccountDetailsData {
  user: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
    is_vip?: boolean;
    isVip?: boolean;
    vip_expires_at?: string | Date | null;
    vipExpiresAt?: string | Date | null;
    remaining_quota?: number | null;
    remainingQuota?: number | null;
    max_quota?: number | null;
    maxQuota?: number | null;
    status?: string;
    is_active?: boolean;
    isActive?: boolean;
  };
  licenseKey?: {
    id?: string;
    key: string;
    totalCredits?: number;
    total_credits?: number;
    maxUsage?: number;
    max_usage?: number;
    durationDays?: number;
    duration_days?: number;
    used_at?: string | Date | null;
    usedAt?: string | Date | null;
    created_by_name?: string | null;
    created_by?: {
      id?: string;
      name?: string;
      username?: string;
      role?: string;
    } | null;
    createdBy?: {
      id?: string;
      name?: string;
      username?: string;
      role?: string;
    } | null;
  } | null;
}

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AccountDetailsData | null;
}

/**
 * Format timestamp into HH:mm - DD/MM/YYYY
 */
function formatActivationTime(dateString?: string | Date | null): string {
  if (!dateString) return 'Không rõ thời gian';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

export default function AccountDetailsModal({ isOpen, onClose, data }: AccountDetailsModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen || !data) return null;

  const { user, licenseKey } = data;

  const handleCopyKey = () => {
    if (!licenseKey?.key) return;
    navigator.clipboard.writeText(licenseKey.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const roleLower = (user.role || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const isStaff = roleLower === 'staff' || roleLower === 'ctv';
  const isVip = Boolean(user.is_vip ?? user.isVip) || roleLower === 'vip';

  // Lượt dùng AI
  const remainingQuota = user.remaining_quota ?? user.remainingQuota;
  const isUnlimitedQuota = isAdmin || remainingQuota === null || remainingQuota === -1;
  const quotaDisplay = isUnlimitedQuota ? '∞ Vô hạn' : `${remainingQuota ?? 0} lượt`;

  // Hạn sử dụng VIP
  const vipExpiresAt = user.vip_expires_at || user.vipExpiresAt;
  const expiresDisplay = vipExpiresAt 
    ? formatDateVN(vipExpiresAt) 
    : (isAdmin || isVip ? 'Vĩnh viễn (∞)' : 'Chưa kích hoạt');

  // License Key Details
  const duration = licenseKey?.durationDays ?? licenseKey?.duration_days ?? 30;
  const durationStr = duration === 0 ? 'Vĩnh viễn' : `+${duration} ngày`;
  const usage = licenseKey?.maxUsage ?? licenseKey?.max_usage ?? licenseKey?.totalCredits ?? licenseKey?.total_credits ?? 50;
  const usageStr = usage === -1 ? '+∞ lượt' : `+${usage} lượt`;
  const activationTime = formatActivationTime(licenseKey?.used_at || licenseKey?.usedAt);
  const creatorName = licenseKey?.createdBy?.name || licenseKey?.createdBy?.username || licenseKey?.created_by?.name || licenseKey?.created_by?.username || licenseKey?.created_by_name || 'Quản trị viên';

  // Avatar character
  const displayName = user.name || user.username || 'User';
  const initialChar = displayName.charAt(0).toUpperCase();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="max-w-lg w-full rounded-2xl bg-white dark:bg-[#111622] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-5 text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* PHẦN 1: Header Tài Khoản */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar ký tự tròn */}
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-lg shrink-0 border border-indigo-100 dark:border-indigo-500/30 shadow-xs">
              {initialChar}
            </div>

            {/* Tên hiển thị + Username + Email */}
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </h3>
                {/* Badge quyền hạn chuẩn */}
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1 shrink-0">
                    <Crown className="w-3 h-3" /> Admin
                  </span>
                ) : isStaff ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> CTV
                  </span>
                ) : isVip ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-600/50 flex items-center gap-1 shrink-0 font-extrabold">
                    <span>👑</span> VIP Account
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                    Free
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.username && (
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                    @{user.username}
                  </span>
                )}
                {user.username && user.email && <span>•</span>}
                {user.email && (
                  <span className="truncate">{user.email}</span>
                )}
              </div>
            </div>
          </div>

          {/* Nút Đóng [X] */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PHẦN 2: Trạng Thái Dịch Vụ & Hạn Mức (Lưới 2 ô) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Ô 1: Hạn sử dụng VIP */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Hạn sử dụng VIP:
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 truncate" title={expiresDisplay}>
              {expiresDisplay}
            </span>
          </div>

          {/* Ô 2: Lượt dùng AI */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              Lượt dùng AI:
            </span>
            <span className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {quotaDisplay}
            </span>
          </div>
        </div>

        {/* PHẦN 3: Thông Tin License Key Liên Kết */}
        {licenseKey && licenseKey.key ? (
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-0.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>License Key Kích Hoạt</span>
            </div>

            {/* Dòng 1: Mã key monospace kèm nút Copy */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800">
              <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 tracking-wider">
                {licenseKey.key}
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="p-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 text-[11px] font-medium cursor-pointer shrink-0"
                title="Sao chép mã Key"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px]">Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* Dòng 2: Giá trị gói */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Giá trị gói:
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {durationStr} • {usageStr}
              </span>
            </div>

            {/* Dòng 3: Thời gian kích hoạt */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian kích hoạt:
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {activationTime}
              </span>
            </div>

            {/* Dòng 4: Người tạo key */}
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Người tạo key:
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {creatorName}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-500 dark:text-slate-400 italic text-center">
            Tài khoản được cấp quyền trực tiếp từ Quản trị viên (Không qua License Key).
          </div>
        )}

        {/* Footer: Nút Đóng bo góc xám nhạt tinh tế ở góc phải dưới */}
        <div className="flex items-center justify-end pt-1">
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
