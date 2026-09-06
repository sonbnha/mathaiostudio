'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Crown, 
  Calendar, 
  Zap, 
  KeyRound, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { formatDateTimeVN, formatFullDateTimeVN } from '@/config/version';

export interface VipSubscriptionData {
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
  };
  lastActivatedKey?: {
    id?: string;
    key: string;
    used_at?: string | Date | null;
    usedAt?: string | Date | null;
    durationDays?: number;
    duration_days?: number;
    maxUsage?: number;
    max_usage?: number;
    totalCredits?: number;
  } | null;
}

interface VipSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VipSubscriptionData | null;
}

export default function VipSubscriptionModal({ isOpen, onClose, data }: VipSubscriptionModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen || !data) return null;

  const { user, lastActivatedKey } = data;

  const handleCopyKey = () => {
    if (!lastActivatedKey?.key) return;
    navigator.clipboard.writeText(lastActivatedKey.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const roleLower = (user.role || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const remainingQuota = user.remaining_quota ?? user.remainingQuota;
  const isUnlimitedQuota = isAdmin || remainingQuota === null || remainingQuota === -1;
  const quotaDisplay = isUnlimitedQuota ? 'Vô hạn (∞)' : `${remainingQuota ?? 0} lượt còn lại`;

  const vipExpiresAt = user.vip_expires_at || user.vipExpiresAt;
  const expiresDisplay = vipExpiresAt 
    ? formatDateTimeVN(vipExpiresAt) 
    : 'Vĩnh viễn (∞)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/15 dark:via-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Thông tin Gói VIP Đang Sử Dụng</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chi tiết quyền lợi, thời hạn và trạng thái kích hoạt tài khoản
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
          {/* PHẦN 1: Thông tin tài khoản & Trạng thái VIP */}
          <div className="flex flex-col gap-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tài khoản & Trạng thái VIP</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Tài khoản:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  @{user.username || '—'}
                </span>
                {user.name && user.name !== user.username && (
                  <span className="text-[11px] text-slate-500 block">
                    ({user.name})
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Trạng thái VIP:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang kích hoạt (Active)
                </span>
              </div>
            </div>
          </div>

          {/* PHẦN 2: Hạn sử dụng & Lượt tạo hình */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Hạn sử dụng */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Hạn sử dụng:</span>
              </div>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 truncate" title={expiresDisplay}>
                {expiresDisplay}
              </span>
              <span className="text-[10px] text-slate-400">
                {vipExpiresAt ? 'Thời hạn hiệu lực của gói VIP' : 'Quyền lợi vô thời hạn'}
              </span>
            </div>

            {/* Lượt tạo hình / giáo án */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Zap className="w-3.5 h-3.5 text-cyan-500" />
                <span>Lượt tạo hình / giáo án:</span>
              </div>
              <span className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">
                {quotaDisplay}
              </span>
              <span className="text-[10px] text-slate-400">
                {isUnlimitedQuota ? 'Không giới hạn lượt tạo' : 'Hạn mức còn lại trong chu kỳ'}
              </span>
            </div>
          </div>

          {/* PHẦN 3: Lịch sử nạp gần nhất (nếu có) */}
          <div className="flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Lịch sử nạp gần nhất</span>
            </h4>

            {lastActivatedKey && lastActivatedKey.key ? (
              <div className="flex flex-col gap-2.5 text-xs">
                {/* Mã Key */}
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Mã Key đã nạp:</span>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {lastActivatedKey.key}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                      title="Sao chép mã Key"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Thời gian kích hoạt */}
                <div className="flex items-center justify-between py-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Thời gian kích hoạt:
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {lastActivatedKey.used_at || lastActivatedKey.usedAt
                      ? formatFullDateTimeVN(lastActivatedKey.used_at || lastActivatedKey.usedAt)
                      : 'Không rõ thời gian'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 italic">
                Tài khoản được kích hoạt trực tiếp bởi Quản trị viên (Chưa nạp qua License Key).
              </div>
            )}
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
