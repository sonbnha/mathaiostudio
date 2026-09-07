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
    lifetime_quota?: number | null;
    lifetimeQuota?: number | null;
    subscription_quota?: number | null;
    subscriptionQuota?: number | null;
    subscription_expires_at?: string | Date | null;
    subscriptionExpiresAt?: string | Date | null;
    monthly_allowance?: number;
    monthlyAllowance?: number;
    monthly_credits?: number;
    monthlyCredits?: number;
    next_credit_reset_at?: string | Date | null;
    nextCreditResetAt?: string | Date | null;
    plan_expires_at?: string | Date | null;
    planExpiresAt?: string | Date | null;
    lifetime_credits?: number;
    lifetimeCredits?: number;
    status?: string;
    is_active?: boolean;
    isActive?: boolean;
  };
  licenseKey?: {
    id?: string;
    key: string;
    credits?: number;
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

  // Dual-wallet credit values
  const monthlyAllowance = Number(user.monthly_allowance ?? user.monthlyAllowance ?? 0);
  const monthlyCredits = Number(user.monthly_credits ?? user.monthlyCredits ?? user.subscription_quota ?? user.subscriptionQuota ?? 0);
  const lifetimeCredits = Number(user.lifetime_credits ?? user.lifetimeCredits ?? user.lifetime_quota ?? user.lifetimeQuota ?? 0);
  const planExpiresAt = user.plan_expires_at || user.planExpiresAt || user.subscription_expires_at || user.subscriptionExpiresAt || user.vip_expires_at || user.vipExpiresAt || null;
  const nextCreditResetAt = user.next_credit_reset_at || user.nextCreditResetAt || null;

  const now = new Date();
  const isPlanActive = Boolean(planExpiresAt && new Date(planExpiresAt) > now);

  // Remaining total
  const remainingQuota = user.remaining_quota ?? user.remainingQuota;
  const isUnlimitedQuota = isAdmin || remainingQuota === null || remainingQuota === -1;
  const totalAvailable = isUnlimitedQuota
    ? '∞'
    : `${(isPlanActive ? monthlyCredits : 0) + lifetimeCredits} Ω`;

  // License Key Details
  const duration = licenseKey?.durationDays ?? licenseKey?.duration_days ?? 30;
  const isKeyLifetime = duration === 0 || licenseKey?.key?.startsWith('AIO-LT-');
  const durationStr = isKeyLifetime ? 'Vô hạn (∞)' : `+${duration} ngày`;
  const usage = licenseKey?.credits ?? licenseKey?.maxUsage ?? licenseKey?.max_usage ?? licenseKey?.totalCredits ?? licenseKey?.total_credits ?? 50;
  const usageStr = usage === -1 
    ? '∞ Ω' 
    : (isKeyLifetime ? `+${usage} Ω vô hạn` : `${usage} Ω/tháng`);
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
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 shrink-0">
                    Tài khoản dùng thử (Trial)
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

        {/* PHẦN 2: Trạng Thái Dịch Vụ & 2 Ví Ω (Thuê Bao Ω & Ω Vô Hạn) */}
        <div className="flex flex-col gap-2.5">
          {/* Thanh tổng quan khả dụng */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              Tổng Ω khả dụng:
            </span>
            <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
              {totalAvailable}
            </span>
          </div>

          {/* Lưới 2 Khối Ví */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Khối 1: [Thuê Bao Ω] */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-1 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Thuê Bao Ω:
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isAdmin
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : isPlanActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500'
                }`}>
                  {isAdmin ? 'Vô hạn' : isPlanActive ? 'Còn hạn' : (planExpiresAt ? 'Hết hạn' : 'Chưa có')}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Khả dụng / Định mức:</span>
                <span className="text-sm font-bold font-mono text-blue-700 dark:text-blue-400">
                  {isAdmin ? '∞' : `${monthlyCredits} / ${monthlyAllowance} Ω`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/50 dark:border-blue-900/30 text-slate-500 dark:text-slate-400">
                <span>Làm mới chu kỳ:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {isAdmin ? '∞' : (nextCreditResetAt ? formatDateVN(nextCreditResetAt) : 'Chưa kích hoạt')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Hạn gói:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {isAdmin ? '∞' : (planExpiresAt ? formatDateVN(planExpiresAt) : 'Chưa kích hoạt')}
                </span>
              </div>
            </div>

            {/* Khối 2: [Ω Vô Hạn VIP / Ví Dùng Thử] */}
            {isVip || isAdmin ? (
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Ω Vô Hạn:
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Vô hạn (∞)
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Số dư tích lũy:</span>
                  <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
                    {isAdmin ? '∞' : `${lifetimeCredits} Ω`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/50 dark:border-amber-900/30 text-slate-500 dark:text-slate-400">
                  <span>Thời hạn:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                    Vô hạn
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/40 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    Ω Dùng Thử:
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                    Dùng thử (Trial)
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Được cấp:</span>
                  <span className="text-sm font-bold font-mono text-sky-700 dark:text-sky-400">
                    {lifetimeCredits} Ω
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-sky-200/50 dark:border-sky-900/30 text-slate-500 dark:text-slate-400">
                  <span>Thời hạn:</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400 font-mono">
                    Không thời hạn
                  </span>
                </div>
              </div>
            )}
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
