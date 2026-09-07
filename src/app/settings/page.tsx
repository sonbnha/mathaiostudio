'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  AtSign,
  Mail,
  Lock,
  Shield,
  Key,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  Infinity as InfinityIcon,
  Sun,
  Moon,
  Compass,
  Save,
  Zap,
  History,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react';
import { AvatarSelector } from '@/components/AvatarSelector';
import { DEFAULT_AVATAR, sanitizeAvatar, PRESET_AVATARS } from '@/config/avatars';
import { useRenewModal } from '@/context/RenewModalContext';
import { checkHasAuthToken, setClientAuthTokens } from '@/lib/authClient';

export default function SettingsPage() {
  const router = useRouter();
  const { openRenewModal } = useRenewModal();

  // 1. Auth & Profile State
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('mathaio_cached_user');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [loadingUser, setLoadingUser] = useState(true);

  // Form 1: Profile State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form 2: Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'profile' | 'quota' | 'security'>('profile');

  // Handle URL query parameter ?tab=credits or ?tab=quota
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'credits' || tab === 'quota') {
        setActiveTab('quota');
      } else if (tab === 'security') {
        setActiveTab('security');
      }
    }
  }, []);

  // Form 3: License Key Redemption State & History
  const [redeemKeyInput, setRedeemKeyInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [licenseHistory, setLicenseHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchLicenseHistory = async () => {
    if (!checkHasAuthToken()) return;
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/user/license-history');
      if (res.ok) {
        const data = await res.json();
        setLicenseHistory(data.history || []);
      }
    } catch (err) {
      console.warn('Lỗi lấy lịch sử nạp key:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopyKey = (k: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(k);
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatActivationTime = (timeStr?: string | null) => {
    if (!timeStr) return 'Không rõ thời gian';
    try {
      return new Date(timeStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    if (activeTab === 'quota') {
      fetchLicenseHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleRedeemed = () => {
      fetchLicenseHistory();
    };
    window.addEventListener('license-redeemed', handleRedeemed);
    return () => window.removeEventListener('license-redeemed', handleRedeemed);
  }, []);

  // Theme Toggle State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const isDark =
        localStorage.getItem('theme') === 'dark' ||
        document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  };

  // Check auth & fetch latest profile
  useEffect(() => {
    const hasToken = checkHasAuthToken();
    if (!hasToken) {
      router.replace('/login?redirect=/settings');
      return;
    }

    const fetchLatestProfile = async () => {
      if (!checkHasAuthToken()) {
        router.replace('/login?redirect=/settings');
        return;
      }
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            setName(data.user.name || '');
            setAvatar(sanitizeAvatar(data.user.avatar));
            setClientAuthTokens(undefined, data.user);
          } else {
            router.replace('/login?redirect=/settings');
          }
        } else if (res.status === 401) {
          router.replace('/login?redirect=/settings');
        }
      } catch (e) {
        console.warn('Lỗi lấy profile:', e);
      } finally {
        setLoadingUser(false);
      }
    };

    if (currentUser) {
      setName(currentUser.name || '');
      setAvatar(sanitizeAvatar(currentUser.avatar));
    }

    fetchLatestProfile();
  }, [router]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setProfileError('Họ và tên phải có tối thiểu 2 ký tự.');
      return;
    }

    setSavingProfile(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanName,
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật thông tin cá nhân.');
      }

      setProfileSuccess('Đã lưu thông tin cá nhân và cập nhật avatar thành công!');
      if (data.user) {
        const merged = { ...currentUser, ...data.user };
        setCurrentUser(merged);
        setClientAuthTokens(undefined, merged);
        window.dispatchEvent(new CustomEvent('auth-updated', { detail: { user: merged } }));
        window.dispatchEvent(new CustomEvent('user-updated', { detail: merged }));
      }
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    if (currentPassword === newPassword) {
      setPassError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setChangingPass(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi đổi mật khẩu.');
      }

      setPassSuccess('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 5000);
    } catch (err: any) {
      setPassError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setChangingPass(false);
    }
  };

  // Handle Redeem License Key in Tab 2
  const handleRedeemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);

    const cleanKey = redeemKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      setRedeemError('Vui lòng nhập mã License Key.');
      return;
    }

    setRedeeming(true);
    try {
      const res = await fetch('/api/license/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kích hoạt License Key thất bại.');
      }

      setRedeemSuccess(data.message || 'Kích hoạt License Key thành công!');
      setRedeemKeyInput('');
      if (data.user) {
        const merged = { ...currentUser, ...data.user };
        setCurrentUser(merged);
        setClientAuthTokens(undefined, merged);
        window.dispatchEvent(new CustomEvent('auth-updated', { detail: { user: merged } }));
        window.dispatchEvent(new CustomEvent('user-updated', { detail: merged }));
        window.dispatchEvent(new CustomEvent('license-redeemed', { detail: { user: merged } }));
      }
      setTimeout(() => setRedeemSuccess(null), 5000);
    } catch (err: any) {
      setRedeemError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loadingUser && !currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 dark:text-cyan-400" />
          <p className="text-xs text-slate-500">Đang tải cài đặt tài khoản...</p>
        </div>
      </div>
    );
  }

  // Quota computations
  const role = (currentUser?.role || 'user').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const monthlyCredits = Number(currentUser?.monthly_credits ?? currentUser?.subscription_quota ?? 0);
  const monthlyAllowance = Number(currentUser?.monthly_allowance ?? 0);
  const planExp = currentUser?.plan_expires_at || currentUser?.subscription_expires_at || null;
  const resetAt = currentUser?.next_credit_reset_at || null;
  const isPlanActive = Boolean(planExp && new Date(planExp) > new Date());
  const lifetimeCredits = Number(currentUser?.lifetime_credits ?? currentUser?.lifetime_quota ?? 0);
  const hasUnlimitedCredits =
    isAdmin ||
    Boolean(currentUser?.is_unlimited || currentUser?.isUnlimited) ||
    currentUser?.monthly_credits === -1 ||
    currentUser?.remaining_quota === -1 ||
    currentUser?.remaining_credits === -1 ||
    Number(currentUser?.remaining_quota) >= 999;

  const isTrial = Boolean(
    !isAdmin &&
    !Boolean(currentUser?.is_unlimited || currentUser?.isUnlimited) &&
    (!planExp || new Date(planExp) <= new Date()) &&
    monthlyAllowance === 0 &&
    (currentUser?.is_trial || (lifetimeCredits > 0 && !(currentUser as any)?.has_paid && !planExp))
  );

  const hasUnlimitedTime = isAdmin || (!isTrial && hasUnlimitedCredits && !planExp);

  let subDaysRemaining: number | null = null;
  if (planExp) {
    const diffTime = new Date(planExp).getTime() - new Date().getTime();
    subDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  let resetDaysRemaining: number | null = null;
  if (resetAt) {
    const diffReset = new Date(resetAt).getTime() - new Date().getTime();
    resetDaysRemaining = Math.max(0, Math.ceil(diffReset / (1000 * 60 * 60 * 24)));
  }

  const isVip = !isTrial && Boolean(isAdmin || isPlanActive || ((currentUser?.is_vip || currentUser?.isVip) && !(currentUser as any)?.is_trial));

  const formattedPlanExp = planExp
    ? new Date(planExp).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  const formattedResetAt = resetAt
    ? new Date(resetAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <div className="w-full min-h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Quay lại Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              MathAIO
            </span>
            <span className="text-slate-300 dark:text-slate-700 font-light">/</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Cài đặt tài khoản
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            title="Đổi chế độ sáng / tối"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5">
        {/* Page Hero Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Quản lý tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tùy chỉnh hồ sơ cá nhân, kiểm tra 2 ví hạn mức dịch vụ và thiết lập bảo mật tài khoản MathAIO.
          </p>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-300/60 dark:border-slate-700/60 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>👤 Hồ sơ cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quota')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'quota'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>⚡ Hạn mức & Gói dịch vụ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>🔒 Bảo mật & Mật khẩu</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: HỒ SƠ CÁ NHÂN (Profile Tab) */}
        {/* ============================================================ */}
        {activeTab === 'profile' && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Hồ sơ cá nhân & Ảnh đại diện
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Tùy chỉnh họ tên và lựa chọn hình đại diện toán học chuẩn hóa
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback messages */}
            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Bộ chọn Avatar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                <AvatarSelector selectedAvatar={avatar} onSelect={setAvatar} showLargePreview={true} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Họ và tên (Editable) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                </div>

                {/* Tên đăng nhập (Read-only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tên đăng nhập
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" /> Khóa
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={currentUser?.username || currentUser?.email?.split('@')[0] || ''}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none select-none font-mono"
                    />
                  </div>
                </div>

                {/* Địa chỉ Email (Read-only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Địa chỉ Email
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" /> Khóa
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none select-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 2: HẠN MỨC & GÓI DỊCH VỤ (Quota & Subscription Tab) */}
        {/* ============================================================ */}
        {activeTab === 'quota' && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Hạn mức tài khoản & Gói dịch vụ
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Mô hình 2 ví Ω độc lập: Thuê Bao Ω (reset 30 ngày) và Ω Vô Hạn (tích lũy vô hạn)
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    ADMIN
                  </span>
                ) : isVip ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-extrabold border border-amber-400/40 text-xs shadow-xs">
                    <Crown className="w-3.5 h-3.5" />
                    👑 VIP ACCOUNT
                  </span>
                ) : (hasUnlimitedCredits && !hasUnlimitedTime && !isPlanActive) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold">
                    HẾT HẠN VIP
                  </span>
                ) : isTrial ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                    🧪 DÙNG THỬ (TRIAL)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium">
                    THÀNH VIÊN
                  </span>
                )}
              </div>
            </div>

            {/* Khối Thẻ Hạn Mức Ω hoặc Đặc Quyền Quản Trị Viên */}
            {isAdmin ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/30 flex flex-col gap-3 mb-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-rose-950 dark:text-rose-200">
                        Đặc Quyền Quản Trị Viên (Super Admin)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Toàn quyền sử dụng hệ thống vô hạn lượt tạo hình và giáo án (∞)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Toàn quyền (∞)
                  </span>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    ∞
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ω</span>
                </div>

                <div className="pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span>Thời hạn sử dụng:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Trọn đời
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Tài khoản Admin không bị trừ bất kỳ Ω nào khi thực hiện tác vụ.
                  </div>
                </div>
              </div>
            ) : (hasUnlimitedCredits && hasUnlimitedTime && !isAdmin) ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col gap-3 mb-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200">
                        Tài Khoản VIP Vô Hạn
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Đặc quyền VIP vô hạn lượt tạo hình và soạn giáo án toán học (∞)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    VIP Vô Hạn (∞)
                  </span>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                    ∞
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ω</span>
                </div>

                <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span>Thời hạn sử dụng:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Trọn đời
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Tài khoản được miễn phí vô hạn số lượng Ω.
                  </div>
                </div>
              </div>
            ) : (
              /* 2 Khối Thẻ Hạn Mức Ω (LUÔN HIỆN CẢ 2 VÍ) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Card Ví 1: Thuê Bao Ω */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {hasUnlimitedCredits ? (
                          <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                          {hasUnlimitedCredits ? 'Gói VIP Vô Hạn (Monthly Pass)' : 'Thuê Bao Ω (Monthly)'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        hasUnlimitedCredits && isPlanActive
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : isPlanActive
                          ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          : planExp
                          ? 'bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                          : 'bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300'
                      }`}>
                        {hasUnlimitedCredits && isPlanActive
                          ? 'VIP Vô Hạn'
                          : isPlanActive
                          ? 'Đang hoạt động'
                          : planExp
                          ? 'Đã hết hạn'
                          : 'Chưa kích hoạt'}
                      </span>
                    </div>

                    <div className={`text-2xl font-black ${
                      (hasUnlimitedCredits || monthlyCredits === -1) && isPlanActive
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {hasUnlimitedCredits || monthlyCredits === -1
                        ? (isPlanActive ? '∞' : '0')
                        : `${monthlyCredits === -1 ? '∞' : monthlyCredits}${monthlyAllowance > 0 ? ` / ${monthlyAllowance === -1 ? '∞' : monthlyAllowance}` : ''}`}{' '}
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ω</span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {hasUnlimitedCredits
                        ? 'Đặc quyền VIP vô hạn lượt tạo hình và soạn giáo án trong thời hạn sử dụng.'
                        : 'Ω tháng sẽ tự động reset về định mức ban đầu mỗi chu kỳ 30 ngày (không cộng dồn qua tháng).'}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-indigo-200/60 dark:border-indigo-800/50 flex flex-col gap-1 text-xs">
                    {formattedResetAt && isPlanActive && !hasUnlimitedCredits && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Làm mới định mức:</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                          {formattedResetAt}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Hạn sử dụng gói:</span>
                      <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                        {formattedPlanExp ? (
                          isPlanActive ? (
                            `Còn ${subDaysRemaining} ngày • ${formattedPlanExp}`
                          ) : (
                            <span className="text-rose-500">Đã hết hạn ({formattedPlanExp})</span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">Chưa kích hoạt gói</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Ví 2: Ω Vô Hạn */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <InfinityIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                          Ω Vô Hạn
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                        Trọn đời
                      </span>
                    </div>

                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {lifetimeCredits === -1 ? '∞' : lifetimeCredits}{' '}
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ω</span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isPlanActive
                        ? 'Tích lũy vô hạn từ trial và key vô hạn (Dự phòng sử dụng khi hết hạn gói thuê bao).'
                        : 'Tích lũy vô hạn từ trial và key vô hạn. Chỉ tiêu hao khi Thuê Bao Ω đã hết.'}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-amber-200/60 dark:border-amber-800/50 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Thời hạn sử dụng:</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      Trọn đời
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* In-tab Activation Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-yellow-500/10 to-transparent border border-amber-500/20">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Kích hoạt bản quyền License Key
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nhập mã License Key để nạp thêm Ω hoặc kích hoạt / gia hạn gói VIP ngay lập tức.
                  </p>
                </div>
              </div>

              {/* Feedback messages for activation */}
              {redeemSuccess && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{redeemSuccess}</span>
                </div>
              )}
              {redeemError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{redeemError}</span>
                </div>
              )}

              <form onSubmit={handleRedeemKey} className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={redeemKeyInput}
                    onChange={(e) => setRedeemKeyInput(e.target.value.toUpperCase())}
                    placeholder="AIO-VIP-XXXX-XXXX hoặc MV-XXXX-XXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-950 border border-amber-300/80 dark:border-amber-800/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-sm font-mono tracking-wider text-slate-900 dark:text-slate-100 placeholder-slate-400 uppercase outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={redeeming || !redeemKeyInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Kích hoạt ngay</span>
                </button>
              </form>
            </div>

            {/* Lịch sử kích hoạt License Key */}
            <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Lịch sử kích hoạt License Key</span>
                      {licenseHistory.length > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                          {licenseHistory.length}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Danh sách các mã thẻ / bản quyền đã nạp thành công vào tài khoản của bạn.
                    </p>
                  </div>
                </div>

                {loadingHistory && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Đang tải...</span>
                  </div>
                )}
              </div>

              {licenseHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 font-semibold">Mã Key</th>
                        <th className="py-2.5 px-3 font-semibold">Gói bản quyền / Giá trị</th>
                        <th className="py-2.5 px-3 font-semibold">Thời điểm kích hoạt</th>
                        <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {licenseHistory.map((item, idx) => {
                        const isCopied = copiedKey === item.key;
                        const dur = item.durationDays ?? 30;
                        const isLt = dur === 0 || item.key?.startsWith('AIO-LT-');
                        const durText = isLt ? 'Trọn đời' : `+${dur} ngày`;
                        const creditsVal = item.totalCredits ?? 50;
                        const creditsText = creditsVal === -1 ? '∞ Ω' : (isLt ? `+${creditsVal} Ω vô hạn` : `${creditsVal} Ω/tháng`);

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 tracking-wider">
                                {item.key}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 font-medium">
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                                  {durText} • {creditsText}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              {formatActivationTime(item.usedAt || item.createdAt)}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Thành công
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleCopyKey(item.key)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-[11px] font-medium cursor-pointer"
                                title="Sao chép mã Key"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-400" />
                                    <span>Sao chép</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  {loadingHistory ? 'Đang tải lịch sử...' : 'Bạn chưa kích hoạt mã License Key nào trên hệ thống.'}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 3: BẢO MẬT & MẬT KHẨU (Security Tab) */}
        {/* ============================================================ */}
        {activeTab === 'security' && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Bảo mật & Đổi mật khẩu
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Khuyến nghị sử dụng mật khẩu mạnh với ít nhất 6 ký tự để bảo vệ tài khoản
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback messages */}
            {passSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}
            {passError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Mật khẩu hiện tại */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại..."
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu mới (Tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mật khẩu mới..."
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {changingPass ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  <span>Cập nhật mật khẩu</span>
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
