'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Sparkles,
  ChevronDown,
  Bookmark,
  Zap,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react';
import { performClientLogout } from '@/lib/authClient';

export interface UserProfileDropdownProps {
  user?: any;
  collectionsCount?: number;
  onOpenCollection?: () => void;
  onLogout?: () => Promise<void> | void;
  align?: 'left' | 'right';
  className?: string;
}

function formatDateVN(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '';
  }
}

export default function UserProfileDropdown({
  user,
  collectionsCount,
  onOpenCollection,
  onLogout,
  align = 'right',
  className = '',
}: UserProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [internalCollectionsCount, setInternalCollectionsCount] = useState<number>(() => {
    if (typeof collectionsCount === 'number') return collectionsCount;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('user_collection') || localStorage.getItem('mathviz_history_items');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed.length;
        }
      } catch {}
    }
    return 0;
  });

  // Fetch collections count if not provided
  useEffect(() => {
    if (typeof collectionsCount === 'number') {
      setInternalCollectionsCount(collectionsCount);
      return;
    }
    if (!user || !user.id) return;
    let isMounted = true;
    fetch('/api/user/collection')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          const items = data.collection || data.diagrams || data.items || [];
          setInternalCollectionsCount(items.length);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user?.id, collectionsCount]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Quyền hạn & Trạng thái tài khoản
  const r = (user.role || 'user').toLowerCase();
  const isAdmin = r === 'admin' || r === 'superadmin' || Boolean(user.is_admin);

  const monthlyCredits = Number(
    user.monthly_credits ??
    user.monthlyCredits ??
    user.subscription_quota ??
    user.subscriptionQuota ??
    0
  );
  const monthlyAllowance = Number(
    user.monthly_allowance ??
    user.monthlyAllowance ??
    0
  );
  const lifetimeCredits = Number(
    user.lifetime_credits ??
    user.lifetimeCredits ??
    user.lifetime_quota ??
    user.lifetimeQuota ??
    0
  );
  const hasDualWallet =
    user.monthly_credits !== undefined ||
    user.lifetime_credits !== undefined ||
    user.subscription_quota !== undefined ||
    user.lifetime_quota !== undefined;

  const planExp =
    user.plan_expires_at ||
    user.planExpiresAt ||
    user.subscription_expires_at ||
    user.subscriptionExpiresAt;

  const resetAt = user.next_credit_reset_at || user.nextCreditResetAt;
  const isPlanActive = Boolean(planExp && new Date(planExp) > new Date());

  const isFreeAccount =
    !isAdmin &&
    (!planExp || new Date(planExp) <= new Date()) &&
    monthlyCredits <= 0 &&
    lifetimeCredits <= 0;

  const isUnlimitedCreditsFlag = Boolean(
    user.is_unlimited ||
    user.isUnlimited ||
    user.monthly_credits === -1 ||
    user.monthlyCredits === -1 ||
    user.remaining_quota === -1 ||
    user.remainingQuota === -1 ||
    user.remaining_credits === -1
  );

  const isTrial =
    !isAdmin &&
    !isUnlimitedCreditsFlag &&
    (!planExp || new Date(planExp) <= new Date()) &&
    monthlyAllowance === 0 &&
    Boolean(
      user.is_trial ||
      user.isTrial ||
      (lifetimeCredits > 0 && !user.has_paid && !user.hasPaid && !planExp)
    );

  const hasUnlimitedCredits =
    !isFreeAccount &&
    !isTrial &&
    (isAdmin || isUnlimitedCreditsFlag || Number(user.remaining_quota) >= 999);

  const hasUnlimitedTime =
    isAdmin ||
    (!isFreeAccount && !isTrial && isUnlimitedCreditsFlag && !planExp);

  let subDaysRemaining: number | null = null;
  if (planExp) {
    const diffTime = new Date(planExp).getTime() - new Date().getTime();
    subDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const isVipFlag = Boolean((user.isVip || user.is_vip) && !user.is_trial && !user.isTrial);
  const vipExp = user.vipExpiresAt || user.vip_expires_at;
  const isVipExpired = Boolean(
    (!hasUnlimitedTime && planExp && !isPlanActive) ||
    (vipExp && new Date(vipExp) <= new Date() && !isPlanActive && !hasUnlimitedTime)
  );
  const isVipActive = !isFreeAccount && !isTrial && (isAdmin || isPlanActive || (isVipFlag && !isVipExpired));

  const isVip = !isFreeAccount && !isTrial && (
    isAdmin ||
    isPlanActive ||
    (isVipFlag && !isVipExpired) ||
    monthlyCredits > 0 ||
    hasUnlimitedCredits
  ) && !isVipExpired;

  const rawRem = hasDualWallet
    ? ((isPlanActive ? monthlyCredits : 0) + lifetimeCredits)
    : typeof user.remaining_quota === 'number'
    ? user.remaining_quota
    : typeof user.remainingQuota === 'number'
    ? user.remainingQuota
    : typeof user.remainingCredits === 'number'
    ? user.remainingCredits
    : 10;

  const remainingCredits = isFreeAccount ? 0 : (hasUnlimitedCredits ? -1 : rawRem);
  const totalCredits = remainingCredits;
  const isUnlimitedActive = !isFreeAccount && !isTrial && hasUnlimitedCredits && (hasUnlimitedTime || isPlanActive);

  // Hiển thị tên định dạng
  const baseName = user.name || user.username || user.email?.split('@')[0] || 'User';
  const displayName = isAdmin
    ? (baseName.includes('Super Admin') ? baseName : `Super Admin (${baseName})`)
    : baseName;

  const usernameHandle = user.username
    ? `@${user.username}`
    : user.email
    ? user.email
    : `@${baseName.toLowerCase().replace(/\s+/g, '')}`;

  const isVipAccountForNapThem =
    !isFreeAccount &&
    !isTrial &&
    (isAdmin ||
      Boolean(user.is_vip || user.isVip) ||
      monthlyCredits > 0 ||
      Boolean(user.is_unlimited || user.isUnlimited) ||
      Boolean(planExp && new Date(planExp) > new Date()));

  const handleOpenCollectionClick = () => {
    setIsOpen(false);
    if (onOpenCollection) {
      onOpenCollection();
      return;
    }
    try {
      localStorage.setItem('saved_collection_collapsed', 'false');
      window.dispatchEvent(new Event('expand-saved-collection'));
    } catch {}
    const collectionEl = document.getElementById('saved-collection-section');
    if (collectionEl) {
      collectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      router.push('/geometry?action=open-collection');
    }
  };

  const handleLogoutClick = async () => {
    setIsOpen(false);
    if (onLogout) {
      await onLogout();
    } else {
      await performClientLogout('/login');
    }
  };

  const badgeBase =
    'text-[11px] font-medium leading-none px-2 py-1 rounded-md tracking-normal inline-flex items-center justify-center shrink-0';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* TRIGGER BUTTON (Đồng bộ hoàn toàn giữa các trang) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-1.5 pr-2.5 py-1 shadow-xs transition-all cursor-pointer"
      >
        {/* Avatar với viền vàng nổi bật nếu VIP/Admin */}
        <div
          className={`w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${
            !isFreeAccount && (isVip || isAdmin)
              ? 'ring-2 ring-amber-400 shadow-amber-500/25 shadow-sm'
              : 'ring-1 ring-slate-200 dark:ring-slate-700'
          }`}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full ${
                isAdmin
                  ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500'
                  : !isFreeAccount && isVip
                  ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black'
                  : r === 'ctv'
                  ? 'bg-gradient-to-tr from-blue-500 to-cyan-600'
                  : 'bg-gradient-to-tr from-slate-600 to-slate-800'
              } text-white font-bold text-xs flex items-center justify-center`}
            >
              {(user.name || user.username || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Cụm Tên người dùng & Vương miện */}
        <div className="hidden sm:flex flex-col text-left">
          <div
            className={`text-xs font-semibold flex items-center gap-1.5 leading-tight ${
              isFreeAccount
                ? 'text-slate-700 dark:text-slate-200'
                : isVip || isAdmin
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {!isFreeAccount && (isVip || isAdmin) && (
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
            )}
            <span className="max-w-[125px] truncate">
              {displayName}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 max-w-[110px] truncate leading-tight font-mono">
            {usernameHandle}
          </span>
        </div>

        {/* Badge Số Lượng Credit */}
        {isFreeAccount ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
            0 Ω
          </span>
        ) : isUnlimitedActive || totalCredits === -1 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
            ∞ Ω
          </span>
        ) : isVipExpired && totalCredits <= 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shrink-0">
            Hết hạn
          </span>
        ) : (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              isVip || isAdmin
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {totalCredits === -1 ? '∞ Ω' : (totalCredits > 0 ? `${totalCredits} Ω` : '0 Ω')}
          </span>
        )}

        {/* Icon mũi tên xoay */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* DROPDOWN POPUP MENU */}
      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md`}
        >
          {/* Header Dropdown: Avatar tròn + Tên người dùng + Username mờ + Badge */}
          <div className="px-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden shadow-xs">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Avatar'}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs text-white ${
                      isAdmin
                        ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500'
                        : isVip
                        ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black'
                        : 'bg-gradient-to-tr from-slate-600 to-slate-800'
                    }`}
                  >
                    {(user.name || user.username || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {displayName}
                  </p>
                  <span
                    className={`${badgeBase} uppercase ${
                      isAdmin
                        ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 font-semibold'
                        : r === 'ctv'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 font-semibold'
                        : isFreeAccount
                        ? 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        : isTrial
                        ? 'bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 font-semibold'
                        : isVipActive
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 font-semibold'
                        : isVipExpired
                        ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 font-semibold'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {isAdmin
                      ? 'ADMIN'
                      : r === 'ctv'
                      ? 'CTV'
                      : isFreeAccount
                      ? 'GÓI FREE'
                      : isTrial
                      ? 'TRIAL'
                      : isVipActive
                      ? '⭐ VIP'
                      : isVipExpired
                      ? 'HẾT HẠN'
                      : 'FREE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  {usernameHandle}
                </p>
              </div>
            </div>
          </div>

          {/* Hạn mức tổng quan (Tổng hạn mức khả dụng banner) */}
          <div
            className={`mx-2.5 my-2 px-3 py-2 rounded-xl flex items-center justify-between text-xs ${
              isFreeAccount
                ? 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700'
                : isTrial
                ? 'bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50'
                : 'bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-emerald-500/10 border border-indigo-500/20'
            }`}
          >
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isFreeAccount
                ? 'Tài Khoản Miễn Phí (Gói Free):'
                : isTrial
                ? 'Hạn mức dùng thử:'
                : 'Tổng hạn mức khả dụng:'}
            </span>
            <span
              className={`font-bold text-xs ${
                isFreeAccount
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : isTrial
                  ? 'text-sky-600 dark:text-sky-400 font-mono'
                  : 'text-cyan-400 font-mono font-semibold'
              }`}
            >
              {isFreeAccount
                ? '0 Ω (Hạn mức đã hết)'
                : isAdmin ||
                  (hasUnlimitedCredits && isPlanActive) ||
                  (hasUnlimitedCredits && hasUnlimitedTime) ||
                  remainingCredits === -1
                ? '∞ Ω'
                : `${remainingCredits} Ω`}
            </span>
          </div>

          {/* Danh sách 2 Thẻ Gói Đang Sở Hữu (Cả 2 ví độc lập) */}
          <div className="mx-2.5 mb-2 flex flex-col gap-2">
            {/* CARD 1: GÓI QUẢN TRỊ VIÊN / GÓI THUÊ BAO */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${
                isAdmin
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40'
                  : isFreeAccount || isTrial
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  : hasUnlimitedCredits && isPlanActive
                  ? 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-800/60'
                  : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Crown
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isAdmin
                        ? 'text-rose-500 fill-rose-500'
                        : hasUnlimitedCredits && isPlanActive
                        ? 'text-amber-500 fill-amber-500'
                        : isPlanActive
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-400 fill-slate-300 dark:fill-slate-600'
                    }`}
                  />
                  <span>
                    {isAdmin
                      ? 'Gói Quản Trị Viên'
                      : isFreeAccount
                      ? 'Gói Thuê Bao'
                      : isTrial
                      ? 'Gói Thuê Bao'
                      : hasUnlimitedCredits
                      ? 'Gói VIP Vô Hạn'
                      : 'Gói Thuê Bao'}
                  </span>
                </span>
                <span
                  className={`${
                    isAdmin
                      ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60'
                      : isFreeAccount
                      ? 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      : 'bg-amber-100 text-amber-900 border border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60'
                  } font-bold text-xs px-2.5 py-0.5 rounded-full shrink-0 shadow-xs font-mono`}
                >
                  {isAdmin || (hasUnlimitedCredits && isPlanActive) || monthlyCredits === -1
                    ? '∞ Ω'
                    : isFreeAccount || isTrial
                    ? '0 Ω'
                    : hasUnlimitedCredits
                    ? isPlanActive
                      ? '∞ Ω'
                      : '0 Ω'
                    : `${monthlyCredits} Ω`}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Hạn gói:</span>
                <span className="text-xs font-medium text-right">
                  {isAdmin ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Trọn đời
                    </span>
                  ) : hasUnlimitedCredits && (!planExp || hasUnlimitedTime) ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Trọn đời
                    </span>
                  ) : isFreeAccount ? (
                    <span className="text-slate-400 italic">
                      {planExp ? `Đã hết hạn (${formatDateVN(planExp)})` : 'Chưa đăng ký'}
                    </span>
                  ) : isTrial ? (
                    <span className="text-slate-400 italic">Chưa đăng ký</span>
                  ) : isPlanActive && planExp ? (
                    <span
                      className={
                        hasUnlimitedCredits
                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }
                    >
                      Còn {subDaysRemaining} ngày • {formatDateVN(planExp)}
                    </span>
                  ) : planExp ? (
                    <span className="text-rose-500 font-medium">
                      Hết hạn ({formatDateVN(planExp)})
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Chưa đăng ký</span>
                  )}
                </span>
              </div>
            </div>

            {/* CARD 2: Ω VÔ HẠN / Ω DÙNG THỬ (TRIAL) */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${
                isFreeAccount
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  : isTrial
                  ? 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-800/50'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {isFreeAccount ? (
                    <Crown className="w-3.5 h-3.5 text-slate-400 fill-slate-300 dark:fill-slate-600 shrink-0" />
                  ) : isTrial ? (
                    <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  ) : (
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  <span>{isTrial ? 'Ω Dùng Thử (Trial)' : 'Ω Vô Hạn'}</span>
                </span>
                <span
                  className={`${
                    isFreeAccount
                      ? 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                  } font-bold text-xs px-2.5 py-0.5 rounded-full shrink-0 shadow-xs font-mono`}
                >
                  {isAdmin || lifetimeCredits === -1 ? '∞ Ω' : `${lifetimeCredits || 0} Ω`}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Hạn dùng:</span>
                <span
                  className={`text-xs font-medium text-right ${
                    isFreeAccount
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400 font-medium'
                  }`}
                >
                  {isFreeAccount ? 'Đã dùng hết' : 'Trọn đời'}
                </span>
              </div>

              {/* Ghi chú phụ nếu đang có gói thuê bao active */}
              {!isFreeAccount && !isTrial && isPlanActive && !isAdmin && (
                <div className="pt-1 border-t border-amber-200/50 dark:border-amber-900/30 text-[10px] text-amber-700/80 dark:text-amber-400/80 italic">
                  (Dự phòng sử dụng khi hết hạn gói thuê bao)
                </div>
              )}
            </div>
          </div>

          {/* Menu Tiện ích & Thao tác */}
          <div className="px-1.5 pt-1 flex flex-col gap-0.5">
            {/* Mục 1: Bộ sưu tập của tôi */}
            <button
              type="button"
              onClick={handleOpenCollectionClick}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 shrink-0 text-cyan-500" />
                <span>Bộ sưu tập của tôi</span>
              </div>
              <span
                className={`${badgeBase} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal border border-slate-200/70 dark:border-slate-700`}
              >
                {internalCollectionsCount} hình
              </span>
            </button>

            {/* Mục 2: Nạp thêm Ω / Gia hạn */}
            <Link
              href="/settings?tab=credits"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 shrink-0 text-amber-500 fill-amber-500/20" />
                <span>
                  {isVipAccountForNapThem ? 'Nạp thêm Ω / Gia hạn' : 'Nâng cấp VIP / Nạp Ω'}
                </span>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono tracking-wide">
                {isVipAccountForNapThem ? 'NẠP THÊM' : 'NÂNG CẤP'}
              </span>
            </Link>

            {/* Đường phân cách */}
            <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

            {/* Mục 3: Quản trị hệ thống (Admin Panel) - Chỉ hiện nếu là Admin */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>Quản trị hệ thống (Admin Panel)</span>
                </div>
              </Link>
            )}

            {/* Mục 4: Cài đặt tài khoản */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <span>Cài đặt tài khoản</span>
              </div>
            </Link>

            {/* Đường phân cách */}
            <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

            {/* Mục 5: Đăng xuất */}
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Đăng xuất</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
