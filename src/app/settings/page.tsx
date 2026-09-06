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
    if (!hasToken && !currentUser) {
      router.replace('/login?redirect=/settings');
      return;
    }

    const fetchLatestProfile = async () => {
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
  const subQuota = Number(currentUser?.subscription_quota ?? 0);
  const subExp = currentUser?.subscription_expires_at || null;
  const isSubActive = Boolean(subExp && new Date(subExp) > new Date());
  const ltQuota = Number(currentUser?.lifetime_quota ?? 0);
  const isVip = Boolean(currentUser?.is_vip || currentUser?.isVip || isSubActive || isAdmin);
  const isTrial = Boolean(currentUser?.is_trial && !isVip);

  const formattedSubExp = subExp
    ? new Date(subExp).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Page Hero Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Quản lý tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tùy chỉnh thông tin cá nhân, thay đổi hình đại diện toán học và kiểm tra trạng thái 2 ví hạn mức của bạn.
          </p>
        </div>

        {/* ============================================================ */}
        {/* PHẦN 1: THÔNG TIN CÁ NHÂN & CHỌN LẠI AVATAR */}
        {/* ============================================================ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Thông tin cá nhân & Ảnh đại diện
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Ảnh đại diện được chọn từ bộ biểu tượng toán học vector chuẩn hóa
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
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
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
                    value={currentUser?.username || ''}
                    disabled
                    readOnly
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
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
                    disabled
                    readOnly
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
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

        {/* ============================================================ */}
        {/* PHẦN 2: ĐỔI MẬT KHẨU (SECURITY) */}
        {/* ============================================================ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Bảo mật & Đổi mật khẩu
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Cập nhật mật khẩu mới để bảo vệ tài khoản MathAIO của bạn
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
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
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

        {/* ============================================================ */}
        {/* PHẦN 3: TRẠNG THÁI TÀI KHOẢN & HẠN MỨC (READ-ONLY OVERVIEW) */}
        {/* ============================================================ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Trạng thái tài khoản & Hạn mức ví
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Mô hình 2 ví độc lập (Gói thuê bao & Ví vĩnh viễn tích lũy)
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Ví 1: Gói Thuê Bao (Subscription Quota) */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Ví Gói Thuê Bao
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                    Theo tháng
                  </span>
                </div>

                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {subQuota} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">lượt</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Thời hạn sử dụng:</span>
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                  {formattedSubExp ? (
                    isSubActive ? (
                      `Hết hạn: ${formattedSubExp}`
                    ) : (
                      <span className="text-rose-500">Đã hết hạn ({formattedSubExp})</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic">Chưa đăng ký gói</span>
                  )}
                </span>
              </div>
            </div>

            {/* Card Ví 2: Ví Vĩnh Viễn (Lifetime Quota) */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/60 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <InfinityIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Ví Vĩnh Viễn (Tích Lũy)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    Trọn đời
                  </span>
                </div>

                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {ltQuota} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">lượt</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-amber-200/60 dark:border-amber-800/50 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Thời hạn sử dụng:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <span>Không bao giờ hết hạn</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTA to Redeem / Renew Key */}
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Bạn có mã kích hoạt License Key?
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Nạp mã để cộng dồn thêm số lượt vĩnh viễn hoặc gia hạn gói VIP ngay lập tức.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openRenewModal()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-sm transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Nạp thêm License Key</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
