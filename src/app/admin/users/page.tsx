'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  User,
  Crown,
  KeyRound,
  Lock,
  Loader2,
  X,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Mail,
  Eye,
  EyeOff,
  Infinity,
  Calendar,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { formatDateVN } from '@/config/version';
import {
  useAdminContext,
  UserAccountItem,
  formatOmega,
} from '../AdminContext';

export default function AdminUsersPage() {
  const {
    currentUser,
    isAdmin,
    userAccounts,
    setUserAccounts,
    fetchUserAccounts,
    keys,
    showToast,
    setSelectedAccountModal,
  } = useAdminContext();

  const [userSearch, setUserSearch] = useState('');

  // Create User Modal State
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [showNewAccPassword, setShowNewAccPassword] = useState(false);
  const [newAccRole, setNewAccRole] = useState<'CTV' | 'ADMIN' | 'USER'>('USER');

  // Dynamic Quota Configuration
  const [newAccPlanType, setNewAccPlanType] = useState<'subscription' | 'lifetime'>('subscription');
  const [newAccOmega, setNewAccOmega] = useState<number>(50);
  const [isNewAccUnlimitedOmega, setIsNewAccUnlimitedOmega] = useState(false);
  const [newAccDurationDays, setNewAccDurationDays] = useState<number>(30);

  // CTV Key Quota
  const [isNewAccUnlimitedCredits, setIsNewAccUnlimitedCredits] = useState(false);
  const [newAccMaxCredits, setNewAccMaxCredits] = useState<number>(50);

  // Edit User Modal State
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccEmail, setEditAccEmail] = useState('');
  const [editAccUsername, setEditAccUsername] = useState('');
  const [editAccPassword, setEditAccPassword] = useState('');
  const [editAccRole, setEditAccRole] = useState<'admin' | 'ctv' | 'user'>('user');
  const [editAccStatus, setEditAccStatus] = useState<'active' | 'banned'>('active');
  const [editAccKeyQuota, setEditAccKeyQuota] = useState<number>(50);
  const [isEditAccUnlimitedQuota, setIsEditAccUnlimitedQuota] = useState(false);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Shield className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Truy Cập Bị Giới Hạn
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Chỉ Quản trị viên (ADMIN) mới có quyền truy cập vào mục Quản lý tài khoản.
        </p>
      </div>
    );
  }

  const handleOpenCreateUserModal = () => {
    setNewAccName('');
    setNewAccEmail('');
    setNewAccUsername('');
    setNewAccPassword('');
    setShowNewAccPassword(false);
    setNewAccRole('USER');
    setNewAccPlanType('subscription');
    setNewAccOmega(50);
    setIsNewAccUnlimitedOmega(false);
    setNewAccDurationDays(30);
    setIsNewAccUnlimitedCredits(false);
    setNewAccMaxCredits(50);
    setCreateAccountError(null);
    setIsCreateUserModalOpen(true);
  };

  const handleCreateUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAccountError(null);

    const emailTrim = newAccEmail.trim().toLowerCase();
    const nameTrim = newAccName.trim();
    const userTrim = newAccUsername.trim().toLowerCase() || (emailTrim.includes('@') ? emailTrim.split('@')[0] : '');

    if (!nameTrim) {
      setCreateAccountError('Vui lòng nhập Họ và Tên.');
      return;
    }
    if (!emailTrim) {
      setCreateAccountError('Vui lòng nhập địa chỉ Email.');
      return;
    }
    if (!newAccPassword.trim()) {
      setCreateAccountError('Vui lòng nhập Mật khẩu khởi tạo.');
      return;
    }

    setCreateAccountLoading(true);

    try {
      const omegaVal = isNewAccUnlimitedOmega ? -1 : (Number(newAccOmega) || 50);
      const durDays = newAccPlanType === 'lifetime' ? 0 : newAccDurationDays;
      const ctvQuotaVal = isNewAccUnlimitedCredits ? -1 : (Number(newAccMaxCredits) || 50);

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: nameTrim,
          name: nameTrim,
          email: emailTrim,
          username: userTrim,
          password: newAccPassword.trim(),
          role: newAccRole === 'CTV' ? 'CTV' : newAccRole,
          tier: newAccRole === 'ADMIN' ? 'VIP' : (omegaVal === -1 || omegaVal > 10 ? 'VIP' : 'TRIAL'),
          plan_type: newAccPlanType,
          monthly_credits: newAccRole === 'ADMIN' ? -1 : omegaVal,
          duration_days: newAccRole === 'ADMIN' ? 0 : durDays,
          key_quota: newAccRole === 'CTV' ? ctvQuotaVal : 0,
          maxCredits: newAccRole === 'CTV' ? ctvQuotaVal : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo tài khoản.');
      }

      await fetchUserAccounts(false);
      setIsCreateUserModalOpen(false);
      showToast('Thêm tài khoản thành công!');
    } catch (err: any) {
      setCreateAccountError(err.message);
    } finally {
      setCreateAccountLoading(false);
    }
  };

  const handleOpenEditUserModal = (userItem: UserAccountItem) => {
    setEditingUserId(userItem.id);
    setEditAccName(userItem.name || '');
    setEditAccEmail(userItem.email || '');
    setEditAccUsername(userItem.username || (userItem.email ? userItem.email.split('@')[0] : ''));
    const normRole = (userItem.role || '').toLowerCase();
    const validRole: 'admin' | 'ctv' | 'user' =
      normRole === 'admin' ? 'admin' : normRole === 'ctv' || normRole === 'staff' ? 'ctv' : 'user';
    setEditAccRole(validRole);
    const isAct =
      userItem.isActive !== false &&
      userItem.is_active !== false &&
      userItem.status !== 'banned';
    setEditAccStatus(isAct ? 'active' : 'banned');
    setEditAccPassword('');

    const rawQuota =
      userItem.key_quota !== undefined
        ? userItem.key_quota
        : userItem.keyQuota !== undefined
        ? userItem.keyQuota
        : userItem.maxCredits !== undefined
        ? userItem.maxCredits
        : 50;

    if (rawQuota === -1 || rawQuota >= 999999) {
      setIsEditAccUnlimitedQuota(true);
      setEditAccKeyQuota(50);
    } else {
      setIsEditAccUnlimitedQuota(false);
      setEditAccKeyQuota(rawQuota > 0 ? rawQuota : 50);
    }

    setEditUserError(null);
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    if (!editAccName.trim()) {
      setEditUserError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!editAccEmail.trim()) {
      setEditUserError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!editAccUsername.trim()) {
      setEditUserError('Vui lòng nhập tên đăng nhập (Username).');
      return;
    }
    if (/\s/.test(editAccUsername.trim())) {
      setEditUserError('Tên đăng nhập không được chứa khoảng trắng (dấu cách).');
      return;
    }

    setEditUserError(null);
    setEditUserLoading(true);

    try {
      const quotaValue =
        editAccRole === 'admin'
          ? -1
          : editAccRole === 'user'
          ? 0
          : isEditAccUnlimitedQuota
          ? -1
          : Number(editAccKeyQuota) || 50;

      const res = await fetch(`/api/admin/users/${editingUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editAccName.trim(),
          email: editAccEmail.trim().toLowerCase(),
          username: editAccUsername.trim(),
          role: editAccRole,
          status: editAccStatus,
          key_quota: quotaValue,
          maxCredits: quotaValue,
          newPassword: editAccPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể cập nhật tài khoản.');
      }

      await fetchUserAccounts(false);
      setIsEditUserModalOpen(false);
      showToast('Cập nhật thông tin tài khoản thành công!');
    } catch (err: any) {
      setEditUserError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus ? 'active' : 'banned';
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, isActive: !currentStatus }),
      });
      if (res.ok) {
        setUserAccounts((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: nextStatus,
                  isActive: !currentStatus,
                  is_active: !currentStatus,
                }
              : u
          )
        );
        showToast(!currentStatus ? 'Đã kích hoạt tài khoản!' : 'Đã khóa tài khoản!');
      }
    } catch (err) {
      console.error('Lỗi khi bật/tắt trạng thái tài khoản:', err);
    }
  };

  const handleDeleteUserAccount = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Không thể xóa tài khoản.');
        return;
      }
      setUserAccounts((prev) => prev.filter((u) => u.id !== id));
      showToast('Đã xóa tài khoản thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa tài khoản:', err);
    }
  };

  const filteredUsers = userAccounts.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col gap-4 transition-colors">
      {/* Header with Search and "+ Thêm tài khoản mới" button */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Danh Sách Tài Khoản Hệ Thống (Admin, CTV & User)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {filteredUsers.length} tài khoản
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân quyền Admin toàn hệ thống, Cộng tác viên (CTV) hoặc Thành viên (User)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Tìm theo tên / username / email..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-rose-500 transition w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreateUserModal}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-950/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80">
        <table className="w-full min-w-[700px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:border-slate-400 uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3 whitespace-nowrap">Họ và Tên</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Tên Đăng Nhập / Email</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Vai Trò</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Hạn Mức Key / Bộ Sưu Tập</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng Thái</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  {userSearch
                    ? 'Không tìm thấy tài khoản nào phù hợp.'
                    : 'Chưa có tài khoản nào trong hệ thống.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const uRole = (u.role || 'user').toLowerCase();
                const isUAdmin = uRole === 'admin';
                const isUStaff = uRole === 'staff' || uRole === 'ctv';
                const isUVip = Boolean(u.is_vip || u.isVip);
                const isUActive = u.isActive ?? u.is_active ?? u.status === 'active';
                const createdCount = u._count?.keys || 0;
                const quotaLimit =
                  u.key_quota !== undefined
                    ? u.key_quota
                    : u.maxCredits !== undefined
                    ? u.maxCredits
                    : 50;
                const isUnlimitedQuota = isUAdmin || quotaLimit === -1;
                const quotaPercent = isUnlimitedQuota
                  ? 100
                  : Math.min(100, Math.round((createdCount / (quotaLimit || 50)) * 100));

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition"
                  >
                    {/* 1. Họ và Tên */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        {(() => {
                          const avatarSrc =
                            u.avatar || u.avatar_url || u.photo_url || (u as any).avatarUrl;
                          if (avatarSrc) {
                            return (
                              <img
                                src={avatarSrc}
                                alt={u.name || u.username || 'Avatar'}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                              />
                            );
                          }
                          return (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white text-[11px] shrink-0 shadow-xs">
                              {u.name?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                          );
                        })()}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {u.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Tên Đăng Nhập / Email */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex flex-col min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            const userKeys = keys.filter(
                              (k) => k.usedBy?.id === u.id || (k as any).used_by === u.id
                            );
                            const matchedKey =
                              userKeys[0] ||
                              keys.find(
                                (k) => k.usedBy?.id === u.id || (k as any).used_by === u.id
                              );
                            const fallbackKey = u.last_activated_key || u.lastActivatedKey;

                            setSelectedAccountModal({
                              user: u,
                              licenseKey: matchedKey
                                ? {
                                    id: matchedKey.id,
                                    key: matchedKey.key,
                                    durationDays: matchedKey.durationDays,
                                    duration_days: matchedKey.duration_days,
                                    maxUsage: matchedKey.maxUsage,
                                    max_usage: matchedKey.max_usage,
                                    totalCredits: matchedKey.totalCredits,
                                    usedAt: matchedKey.usedAt,
                                    used_at: matchedKey.used_at,
                                    createdBy: matchedKey.createdBy,
                                  }
                                : fallbackKey
                                ? {
                                    key: fallbackKey.key,
                                    usedAt: fallbackKey.used_at,
                                    used_at: fallbackKey.used_at,
                                  }
                                : null,
                              licenseKeys: userKeys,
                            });
                          }}
                          className="text-left font-medium text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors block cursor-pointer"
                          title="Bấm để xem hồ sơ tài khoản"
                        >
                          {u.username || u.email}
                        </button>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate max-w-[180px]">
                          {u.email || u.username}
                        </span>
                      </div>
                    </td>

                    {/* 3. Vai Trò */}
                    <td className="py-3 px-3 align-middle">
                      {isUAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] border whitespace-nowrap bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">
                          Quản trị viên (ADMIN)
                        </span>
                      ) : isUStaff ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] border whitespace-nowrap bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                          Cộng tác viên (CTV)
                        </span>
                      ) : isUVip ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] border whitespace-nowrap bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                          <span>👑</span>
                          <span>VIP Account</span>
                        </span>
                      ) : (u.lifetime_quota ?? u.lifetimeQuota ?? 0) > 0 || u.is_trial ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] border whitespace-nowrap bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30">
                          Dùng thử (Trial)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] border whitespace-nowrap bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30">
                          Người dùng (Free)
                        </span>
                      )}
                    </td>

                    {/* 4. Hạn Mức Key / Bộ Sưu Tập */}
                    <td className="py-3 px-3 align-middle">
                      {isUAdmin ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-950/60 text-purple-300 border border-purple-700/50 flex items-center gap-1 w-fit">
                          <span>∞</span> Admin
                        </span>
                      ) : isUStaff ? (
                        quotaLimit === -1 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold text-[11px] whitespace-nowrap">
                            <span>∞</span> ({createdCount} key)
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 min-w-[130px] max-w-[160px] justify-center">
                            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
                              <span>
                                {createdCount} / {quotaLimit} key
                              </span>
                              <span className="font-semibold">{quotaPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                style={{ width: `${quotaPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col gap-1 items-start py-0.5">
                          {/* Thuê bao badge */}
                          {(() => {
                            const subQuota =
                              u.monthly_credits ??
                              u.monthlyCredits ??
                              u.subscription_quota ??
                              u.subscriptionQuota ??
                              0;
                            const subExp =
                              u.plan_expires_at ??
                              u.planExpiresAt ??
                              u.subscription_expires_at ??
                              u.subscriptionExpiresAt;
                            const isSubActive = !!subExp && new Date(subExp) > new Date();
                            if (isSubActive) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-medium text-[11px] whitespace-nowrap">
                                  Thuê bao: {formatOmega(subQuota)} (Hạn: {formatDateVN(subExp)})
                                </span>
                              );
                            } else if (subExp) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium text-[11px] whitespace-nowrap">
                                  Thuê bao: Hết hạn (0 Ω)
                                </span>
                              );
                            }
                            return null;
                          })()}

                          {/* Vĩnh viễn / Dùng thử badge */}
                          {(() => {
                            const ltQuota =
                              u.lifetime_credits ??
                              u.lifetimeCredits ??
                              u.lifetime_quota ??
                              u.lifetimeQuota ??
                              0;
                            if (ltQuota > 0 || ltQuota === -1) {
                              if (isUVip) {
                                return (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium text-[11px] whitespace-nowrap">
                                    👑 VIP Vô hạn: {formatOmega(ltQuota)}
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-medium text-[11px] whitespace-nowrap">
                                    Dùng thử: {formatOmega(ltQuota)}
                                  </span>
                                );
                              }
                            }
                            return null;
                          })()}

                          {/* Bộ sưu tập badge */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-medium text-[11px] whitespace-nowrap">
                            📁 {u.saved_diagrams_count ?? u.savedDiagramsCount ?? 0} hình
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 5. Trạng Thái */}
                    <td className="py-3 px-3 text-center align-middle">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                          isUActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isUActive ? 'Hoạt động' : 'Đang khóa'}
                      </span>
                    </td>

                    {/* 6. Thao Tác */}
                    <td className="py-3 px-3 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit / Reset Password Button */}
                        <button
                          onClick={() => handleOpenEditUserModal(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-transparent transition flex items-center gap-1 cursor-pointer"
                          title="Sửa thông tin hoặc Đổi mật khẩu"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sửa / Đổi MK</span>
                        </button>

                        {/* Toggle Active Button (except self) */}
                        {currentUser && u.id !== currentUser.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, isUActive)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title={isUActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {isUActive ? (
                              <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                            )}
                          </button>
                        )}

                        {/* Delete Button (except self) */}
                        {currentUser && u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUserAccount(u.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: THÊM TÀI KHOẢN MỚI                            */}
      {/* ---------------------------------------------------- */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Thêm Tài Khoản Mới
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Khởi tạo người dùng và thiết lập gói tài nguyên / hạn mức
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUserAccount} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 text-xs">
              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Họ và Tên *</span>
                  </label>
                  <input
                    type="text"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="Ví dụ: Thầy Nguyễn Văn A"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Email (Bắt buộc) *</span>
                  </label>
                  <input
                    type="email"
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    placeholder="example@mathaio.local"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Username + Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên Đăng Nhập (Username)
                  </label>
                  <input
                    type="text"
                    value={newAccUsername}
                    onChange={(e) => setNewAccUsername(e.target.value.replace(/\s+/g, ''))}
                    placeholder="ví dụ: nguyen_van_a"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật Khẩu Khởi Tạo *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewAccPassword ? 'text' : 'password'}
                      value={newAccPassword}
                      onChange={(e) => setNewAccPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl pl-3.5 pr-9 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAccPassword(!showNewAccPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title={showNewAccPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showNewAccPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Role selection */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Vai Trò (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccRole('CTV')}
                    className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      newAccRole === 'CTV'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>CTV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAccRole('ADMIN')}
                    className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      newAccRole === 'ADMIN'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>ADMIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAccRole('USER')}
                    className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      newAccRole === 'USER'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>USER</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC QUOTA SECTION: Render when role is USER or CTV */}
              {(newAccRole === 'USER' || newAccRole === 'CTV') && (
                <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Cấu Hình Hạn Mức & Thời Hạn</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                      Gói Tài Nguyên
                    </span>
                  </div>

                  {/* 1. Phân loại gói */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Loại Gói
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewAccPlanType('subscription');
                          if (newAccDurationDays === 0) setNewAccDurationDays(30);
                        }}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                          newAccPlanType === 'subscription'
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Thuê bao tháng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewAccPlanType('lifetime');
                          setNewAccDurationDays(0);
                        }}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                          newAccPlanType === 'lifetime'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-500 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-200" />
                        <span>Ω Vô hạn (Lifetime)</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Số Lượng Ω Ban Đầu */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-500" />
                        <span>Số Lượng Ω Ban Đầu</span>
                      </label>
                      <input
                        type="text"
                        disabled={isNewAccUnlimitedOmega}
                        value={isNewAccUnlimitedOmega ? '∞' : newAccOmega}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                          setNewAccOmega(isNaN(val) ? 0 : val);
                        }}
                        placeholder="50"
                        className={`w-20 text-center py-1 rounded-lg text-xs font-mono font-bold border transition ${
                          isNewAccUnlimitedOmega
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-sm cursor-not-allowed'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500'
                        }`}
                      />
                    </div>

                    {/* 4 Quick Select Buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[50, 100, 200].map((val) => {
                        const isSelected = !isNewAccUnlimitedOmega && newAccOmega === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setIsNewAccUnlimitedOmega(false);
                              setNewAccOmega(val);
                            }}
                            className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {val} Ω
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setIsNewAccUnlimitedOmega(true);
                          setNewAccOmega(-1);
                        }}
                        className={`py-1.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-0.5 ${
                          isNewAccUnlimitedOmega
                            ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>∞ Ω</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Thời Hạn Tài Khoản */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      <span>Thời Hạn Tài Khoản</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { days: 30, label: '30 ngày' },
                        { days: 90, label: '90 ngày' },
                        { days: 365, label: '1 năm' },
                        { days: 0, label: 'Trọn đời' },
                      ].map((item) => {
                        const isSelected = newAccDurationDays === item.days;
                        return (
                          <button
                            key={item.days}
                            type="button"
                            onClick={() => setNewAccDurationDays(item.days)}
                            className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Hạn mức tạo License Key (Dành riêng cho CTV) */}
                  {newAccRole === 'CTV' && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 mt-0.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-cyan-500" />
                          <span>Hạn Mức Tạo License Key (CTV)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isNewAccUnlimitedCredits}
                            onChange={(e) => setIsNewAccUnlimitedCredits(e.target.checked)}
                            className="rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700"
                          />
                          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                            Vô Hạn (∞) Keys
                          </span>
                        </label>
                      </div>

                      {!isNewAccUnlimitedCredits && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={999999}
                            value={newAccMaxCredits}
                            onChange={(e) =>
                              setNewAccMaxCredits(Math.max(1, Number(e.target.value)))
                            }
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 outline-none"
                          />
                          <span className="text-xs text-slate-400 shrink-0">mã key</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {createAccountError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createAccountError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={createAccountLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-950/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createAccountLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>Tạo Tài Khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SỬA THÔNG TIN & ĐỔI MẬT KHẨU                 */}
      {/* ---------------------------------------------------- */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Chỉnh Sửa Thông Tin Tài Khoản
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cập nhật quyền hạn, thông tin cá nhân và mật khẩu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditUser} className="flex flex-col gap-3.5">
              {/* 1. Tên hiển thị */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Tên hiển thị</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition"
                  required
                />
              </div>

              {/* 2. Email */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Địa chỉ Email</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={editAccEmail}
                  onChange={(e) => setEditAccEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition font-sans"
                  required
                />
              </div>

              {/* 2.1 Tên đăng nhập (Username) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>Tên đăng nhập (Username)</span>
                    <span className="text-rose-500">*</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Không chứa dấu cách
                  </span>
                </label>
                <input
                  type="text"
                  value={editAccUsername}
                  onChange={(e) => setEditAccUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Ví dụ: son_admin, toan_thpt..."
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition font-mono"
                  required
                />
              </div>

              {/* 3. Vai trò (Role) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Vai trò (Role)
                </label>
                <div className="relative">
                  <select
                    value={editAccRole}
                    onChange={(e) =>
                      setEditAccRole(e.target.value as 'admin' | 'ctv' | 'user')
                    }
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none transition cursor-pointer pr-9 font-medium"
                  >
                    <option value="admin">Quản trị viên (Admin)</option>
                    <option value="ctv">Cộng tác viên (CTV)</option>
                    <option value="user">Người dùng (User)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 px-1">
                  {editAccRole === 'admin' && (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      👑 Quản trị viên: Toàn quyền quản trị tài khoản, API key và phiên bản.
                    </span>
                  )}
                  {editAccRole === 'ctv' && (
                    <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                      ⭐ Cộng tác viên: Có quyền phát hành và quản lý License Key.
                    </span>
                  )}
                  {editAccRole === 'user' && (
                    <span className="text-slate-500 font-medium">
                      👤 Người dùng: Lưu trữ và đồng bộ bộ sưu tập hình vẽ lên Neon.
                    </span>
                  )}
                </div>
              </div>

              {/* 3.1 Hạn Mức Tạo License Key */}
              {editAccRole === 'admin' && (
                <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-300 text-xs flex items-center justify-between">
                  <span className="font-medium">Hạn mức tạo License Key:</span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-950/60 text-purple-300 border border-purple-700/50 flex items-center gap-1 w-fit">
                    <span>∞</span> Admin
                  </span>
                </div>
              )}

              {editAccRole === 'ctv' && (
                <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hạn Mức Tạo License Key
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEditAccUnlimitedQuota}
                        onChange={(e) => setIsEditAccUnlimitedQuota(e.target.checked)}
                        className="rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        Vô Hạn (∞)
                      </span>
                    </label>
                  </div>

                  {!isEditAccUnlimitedQuota && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={999999}
                        value={editAccKeyQuota}
                        onChange={(e) =>
                          setEditAccKeyQuota(Math.max(1, Number(e.target.value)))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 outline-none"
                      />
                      <span className="text-xs text-slate-400">keys</span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Trạng thái hoạt động */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Trạng thái tài khoản
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAccStatus('active')}
                    className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      editAccStatus === 'active'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Hoạt động</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditAccStatus('banned')}
                    className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      editAccStatus === 'banned'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Đang khóa</span>
                  </button>
                </div>
              </div>

              {/* 5. Đổi mật khẩu mới (Tùy chọn) */}
              <div className="flex flex-col gap-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Đặt lại Mật Khẩu Mới</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Để trống nếu giữ nguyên
                  </span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={editAccPassword}
                    onChange={(e) => setEditAccPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới nếu muốn đổi..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 rounded-xl pl-8 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none transition"
                  />
                </div>
              </div>

              {editUserError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editUserError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md shadow-cyan-950/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {editUserLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
