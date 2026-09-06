'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, User, AtSign, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { setClientAuthTokens } from '@/lib/authClient';
import { AvatarSelector } from '@/components/AvatarSelector';
import { DEFAULT_AVATAR } from '@/config/avatars';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || searchParams.get('callbackUrl') || '/';
  const redirectTarget = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // 1. Kiểm tra họ và tên
    const cleanFullName = fullName.trim();
    if (!cleanFullName || cleanFullName.length < 2) {
      setError('Vui lòng nhập họ và tên (tối thiểu 2 ký tự).');
      return;
    }

    // 2. Kiểm tra tên đăng nhập
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    const usernameRegex = /^[a-z0-9_.-]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError('Tên đăng nhập từ 3 - 30 ký tự, viết thường, không dấu và không khoảng cách (ví dụ: nguyenvana).');
      return;
    }

    // 3. Kiểm tra email
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Địa chỉ email không đúng định dạng.');
      return;
    }

    // 4. Kiểm tra mật khẩu
    if (!password || password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    // 5. Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanFullName,
          username: cleanUsername,
          email: cleanEmail,
          password,
          avatar,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đã có lỗi xảy ra khi tạo tài khoản.');
      }

      setSuccessMsg('🎉 Đăng ký tài khoản thành công! Tặng bạn 10 lượt Trial trọn đời. Đang chuyển hướng...');

      // 1. Cập nhật trực tiếp State Auth toàn cục ngay tại Client & lưu Cache và Token
      if (typeof window !== 'undefined' && data.user) {
        setClientAuthTokens(data.token, data.user);
        window.dispatchEvent(new CustomEvent('auth-updated', { detail: data }));
        window.dispatchEvent(new CustomEvent('user-updated', { detail: data.user }));
      }

      // 2. Làm mới Server Cache & Cookie
      router.refresh();

      // 3. Chuyển hướng ngay về trang đích (0ms delay)
      router.replace(redirectTarget);
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý đăng ký tài khoản.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden p-6 sm:p-8 transition-all">
      {/* Form Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-600 dark:text-cyan-400 mb-3 border border-cyan-500/30 shadow-inner">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Tạo tài khoản dùng thử
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Nhận ngay 10 lượt tạo hình & mô hình toán học miễn phí
        </p>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Thông báo thành công */}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Bộ chọn Avatar Preset */}
        <AvatarSelector selectedAvatar={avatar} onSelect={setAvatar} />

        {/* Trường 1: Họ và tên */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              required
              autoFocus
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
            />
          </div>
        </div>

        {/* Trường 2: Tên đăng nhập */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tên đăng nhập <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <AtSign className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="Ví dụ: nguyenvana (viết liền không dấu)"
              required
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition font-mono"
            />
          </div>
        </div>

        {/* Trường 3: Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Địa chỉ Email <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
            />
          </div>
        </div>

        {/* Trường 4: Mật khẩu */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Trường 5: Xác nhận mật khẩu */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Xác nhận mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại chính xác mật khẩu trên"
              required
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký & Nhận 10 lượt Trial</span>
            </>
          )}
        </button>
      </form>

      {/* Trial Note Banner */}
      <div className="mt-5 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          🎁 <span className="font-bold text-emerald-700 dark:text-emerald-400">Đăng ký ngay nhận ngay 10 lượt tạo hình miễn phí trọn đời (Trial)</span> trong Ví Vĩnh Viễn.
        </p>
      </div>

      {/* Switch to Login */}
      <div className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <span>Đã có tài khoản? </span>
        <Link
          href={`/login${redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
          className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
        >
          Đăng nhập ngay →
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          <span className="text-xs text-slate-500">Đang tải trang đăng ký...</span>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
