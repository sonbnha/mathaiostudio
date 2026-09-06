'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Lock, User, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || searchParams.get('callbackUrl') || '/';
  const redirectTarget = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          usernameOrEmail: cleanIdentifier,
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }

      setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');

      // 1. Cập nhật trực tiếp State Auth toàn cục ngay tại Client & lưu Cache
      if (typeof window !== 'undefined' && data.user) {
        try {
          localStorage.setItem('mathaio_cached_user', JSON.stringify(data.user));
        } catch {}
        window.dispatchEvent(new CustomEvent('auth-updated', { detail: data }));
        window.dispatchEvent(new CustomEvent('user-updated', { detail: data.user }));
      }

      // 2. Làm mới Server Cache & Cookie
      router.refresh();

      // 3. Chuyển hướng ngay về trang đích (0ms delay)
      router.replace(redirectTarget);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi đăng nhập.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden p-6 sm:p-8 transition-all">
      {/* Form Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-600 dark:text-cyan-400 mb-3 border border-cyan-500/30 shadow-inner">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Đăng nhập tài khoản
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Nền tảng Toán học All-in-One – MathAIO Studio
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Trường 1: Identifier (Username / Email) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tên đăng nhập hoặc Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="nguyenvana hoặc email@example.com"
              required
              autoFocus
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
            />
          </div>
        </div>

        {/* Trường 2: Mật khẩu */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
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

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 select-none">
              Ghi nhớ đăng nhập
            </span>
          </label>
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
              <span>Đang kiểm tra...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập ngay</span>
            </>
          )}
        </button>
      </form>

      {/* Trial Note Banner */}
      <div className="mt-6 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          Chưa có tài khoản? Đăng ký ngay để nhận <span className="font-bold text-amber-600 dark:text-amber-400">10 lượt tạo hình miễn phí trọn đời (Trial)</span>.
        </p>
      </div>

      {/* Switch to Register */}
      <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <span>Chưa có tài khoản? </span>
        <Link
          href={`/register${redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
          className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
        >
          Đăng ký dùng thử ngay →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          <span className="text-xs text-slate-500">Đang tải trang đăng nhập...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
