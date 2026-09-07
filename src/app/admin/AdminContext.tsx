'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { checkHasAuthToken, performClientLogout } from '@/lib/authClient';
import { AccountDetailsData } from '@/components/admin/AccountDetailsModal';

export interface ChangelogItem {
  id: string;
  version: string;
  date: string;
  title: string;
  changes: {
    type: 'feat' | 'fix' | 'improve';
    description: string;
  }[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | string;
  maxCredits: number;
  isActive: boolean;
  createdKeysCount?: number;
}

export interface LicenseKeyItem {
  id: string;
  key: string;
  keyCode?: string;
  key_code?: string;
  customerName: string | null;
  customer_name?: string | null;
  credits?: number;
  totalCredits: number;
  total_credits?: number;
  usedCredits: number;
  used_credits?: number;
  durationDays?: number;
  duration_days?: number;
  maxUsage?: number;
  max_usage?: number;
  expiresAt: string | null;
  expires_at?: string | null;
  isActive: boolean;
  is_active?: boolean;
  status?: string;
  used_by?: string | null;
  used_at?: string | null;
  usedAt?: string | null;
  usedBy?: {
    id: string;
    name: string;
    email: string;
    username: string;
    role?: string;
    is_vip?: boolean;
    isVip?: boolean;
    vip_expires_at?: string | null;
    vipExpiresAt?: string | null;
    remaining_quota?: number | null;
    remainingQuota?: number | null;
    max_quota?: number | null;
    maxQuota?: number | null;
    lifetime_quota?: number | null;
    lifetimeQuota?: number | null;
    subscription_quota?: number | null;
    subscriptionQuota?: number | null;
    subscription_expires_at?: string | null;
    subscriptionExpiresAt?: string | null;
    monthly_allowance?: number;
    monthlyAllowance?: number;
    monthly_credits?: number;
    monthlyCredits?: number;
    next_credit_reset_at?: string | null;
    nextCreditResetAt?: string | null;
    plan_expires_at?: string | null;
    planExpiresAt?: string | null;
    lifetime_credits?: number;
    lifetimeCredits?: number;
  } | null;
  createdAt: string;
  createdById?: string | null;
  createdBy?: {
    id: string;
    username: string;
    name: string;
    role: string;
  } | null;
}

export interface UserAccountItem {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  role: string;
  status?: string;
  key_quota?: number;
  keyQuota?: number;
  maxCredits?: number;
  is_vip?: boolean;
  isVip?: boolean;
  is_trial?: boolean;
  isTrial?: boolean;
  vip_expires_at?: string | null;
  vipExpiresAt?: string | null;
  remaining_quota?: number | null;
  remainingQuota?: number | null;
  max_quota?: number | null;
  maxQuota?: number | null;
  lifetime_quota?: number | null;
  lifetimeQuota?: number | null;
  subscription_quota?: number | null;
  subscriptionQuota?: number | null;
  subscription_expires_at?: string | null;
  subscriptionExpiresAt?: string | null;
  monthly_allowance?: number;
  monthlyAllowance?: number;
  monthly_credits?: number;
  monthlyCredits?: number;
  next_credit_reset_at?: string | null;
  nextCreditResetAt?: string | null;
  plan_expires_at?: string | null;
  planExpiresAt?: string | null;
  lifetime_credits?: number;
  lifetimeCredits?: number;
  last_activated_key?: {
    key: string;
    used_at?: string | null;
    usedAt?: string | null;
  } | null;
  lastActivatedKey?: {
    key: string;
    used_at?: string | null;
    usedAt?: string | null;
  } | null;
  isActive: boolean;
  is_active?: boolean;
  api_key?: string | null;
  apiKey?: string | null;
  saved_diagrams_count?: number;
  savedDiagramsCount?: number;
  createdAt: string;
  created_at?: string;
  _count?: {
    keys: number;
  };
}

export function getMaskedKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return key;
  if (key.startsWith('AIO-LT-')) {
    return `AIO-LT-••••-${key.slice(-4)}`;
  }
  if (key.startsWith('AIO-VIP-')) {
    return `AIO-VIP-••••-${key.slice(-4)}`;
  }
  if (key.startsWith('AIO-TR-')) {
    return `AIO-TR-••••-${key.slice(-4)}`;
  }
  if (key.startsWith('AIO-')) {
    return `AIO-••••-${key.slice(-4)}`;
  }
  if (key.startsWith('MV-TR-')) {
    return `MV-TR-••••-${key.slice(-4)}`;
  }
  if (key.startsWith('MV-')) {
    return `MV-••••-${key.slice(-4)}`;
  }
  return `${key.slice(0, 3)}-••••-${key.slice(-4)}`;
}

export function getKeyStatus(k: {
  expiresAt: string | null;
  totalCredits: number;
  usedCredits: number;
  status?: string;
  usedBy?: any;
  used_by?: string | null;
}) {
  if (k.usedBy || k.used_by || k.status === 'used') {
    return {
      label: 'Đã Sử Dụng',
      className: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
      dotClass: 'bg-indigo-500',
    };
  }
  if (k.expiresAt && new Date(k.expiresAt).getTime() < Date.now()) {
    return {
      label: 'Hết Hạn',
      className: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
      dotClass: 'bg-amber-500',
    };
  }
  if (k.totalCredits !== -1 && k.usedCredits >= k.totalCredits) {
    return {
      label: 'Hết Ω',
      className: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
      dotClass: 'bg-rose-500',
    };
  }
  return {
    label: 'Khả Dụng',
    className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500 animate-pulse',
  };
}

export function formatOmega(amount: number | null | undefined): string {
  if (amount === undefined || amount === null) return '0 Ω';
  if (amount === -1 || amount >= 999999) return '∞ Ω';
  return `${amount} Ω`;
}

interface AdminContextType {
  currentUser: AuthUser | null;
  authLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isStaffUnlimited: boolean;
  staffCreatedCount: number;
  staffMaxCredits: number | undefined;
  staffQuotaPercent: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  checkAuth: (showLoading?: boolean) => Promise<void>;
  keys: LicenseKeyItem[];
  setKeys: React.Dispatch<React.SetStateAction<LicenseKeyItem[]>>;
  keysLoading: boolean;
  fetchKeys: (showLoading?: boolean) => Promise<void>;
  userAccounts: UserAccountItem[];
  setUserAccounts: React.Dispatch<React.SetStateAction<UserAccountItem[]>>;
  userAccountsLoading: boolean;
  fetchUserAccounts: (showLoading?: boolean) => Promise<void>;
  changelogs: ChangelogItem[];
  setChangelogs: React.Dispatch<React.SetStateAction<ChangelogItem[]>>;
  changelogsLoading: boolean;
  fetchAdminChangelogs: (showLoading?: boolean) => Promise<void>;
  selectedAccountModal: AccountDetailsData | null;
  setSelectedAccountModal: React.Dispatch<React.SetStateAction<AccountDetailsData | null>>;
  toastMsg: string | null;
  showToast: (msg: string, duration?: number) => void;
  handleLogout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // License Keys State
  const [keys, setKeys] = useState<LicenseKeyItem[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);

  // User Accounts State
  const [userAccounts, setUserAccounts] = useState<UserAccountItem[]>([]);
  const [userAccountsLoading, setUserAccountsLoading] = useState(false);

  // Changelogs State
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [changelogsLoading, setChangelogsLoading] = useState(false);

  // Modal State
  const [selectedAccountModal, setSelectedAccountModal] = useState<AccountDetailsData | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string, duration = 3000) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, duration);
  }, []);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Check Auth Session
  const checkAuth = useCallback(async (showLoading = true) => {
    if (!checkHasAuthToken()) {
      setCurrentUser(null);
      if (showLoading) {
        setAuthLoading(false);
      }
      return;
    }
    if (showLoading) {
      setAuthLoading(true);
    }
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.user) {
        const role = (data.user.role || '').toLowerCase();
        if (role === 'admin' || role === 'ctv' || role === 'staff') {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      if (showLoading) {
        setAuthLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    checkAuth(true);
  }, [checkAuth]);

  // Fetch Keys
  const fetchKeys = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setKeysLoading(true);
    }
    try {
      const res = await fetch('/api/admin/keys');
      const data = await res.json();
      if (res.ok && data.keys) {
        setKeys(data.keys);
      }
    } catch (err) {
      console.error('Lỗi tải keys:', err);
    } finally {
      if (showLoading) {
        setKeysLoading(false);
      }
    }
  }, []);

  // Fetch User Accounts
  const fetchUserAccounts = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setUserAccountsLoading(true);
    }
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setUserAccounts(data.users);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tài khoản:', err);
    } finally {
      if (showLoading) {
        setUserAccountsLoading(false);
      }
    }
  }, []);

  // Fetch Changelogs
  const fetchAdminChangelogs = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setChangelogsLoading(true);
    }
    try {
      const res = await fetch(`/api/admin/changelog?t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.changelogs) {
        setChangelogs(data.changelogs);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách Changelog:', err);
    } finally {
      if (showLoading) {
        setChangelogsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchKeys(false);
      const role = (currentUser.role || '').toLowerCase();
      if (role === 'admin') {
        fetchUserAccounts(false);
        fetchAdminChangelogs(false);
      }
    }
  }, [currentUser?.id, currentUser?.role, fetchKeys, fetchUserAccounts, fetchAdminChangelogs]);

  // Realtime listeners
  useEffect(() => {
    const handleSync = () => {
      if (currentUser) {
        fetchKeys(false);
        const role = (currentUser.role || '').toLowerCase();
        if (role === 'admin') {
          fetchUserAccounts(false);
        }
        checkAuth(false);
      }
    };

    window.addEventListener('auth-updated', handleSync);
    window.addEventListener('user-updated', handleSync);
    window.addEventListener('license-redeemed', handleSync);

    return () => {
      window.removeEventListener('auth-updated', handleSync);
      window.removeEventListener('user-updated', handleSync);
      window.removeEventListener('license-redeemed', handleSync);
    };
  }, [currentUser, fetchKeys, fetchUserAccounts, checkAuth]);

  // Handle Logout
  const handleLogout = async () => {
    setCurrentUser(null);
    setKeys([]);
    setUserAccounts([]);
    await performClientLogout('/login');
  };

  const userRole = (currentUser?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff' || userRole === 'ctv';
  const staffCreatedCount = currentUser?.createdKeysCount || keys.length;
  const isStaffUnlimited = currentUser?.maxCredits === -1;
  const staffMaxCredits = currentUser?.maxCredits;
  const staffQuotaPercent = isStaffUnlimited
    ? 100
    : Math.min(100, Math.round((staffCreatedCount / (staffMaxCredits || 50)) * 100));

  return (
    <AdminContext.Provider
      value={{
        currentUser,
        authLoading,
        isAdmin,
        isStaff,
        isStaffUnlimited,
        staffCreatedCount,
        staffMaxCredits,
        staffQuotaPercent,
        theme,
        toggleTheme,
        checkAuth,
        keys,
        setKeys,
        keysLoading,
        fetchKeys,
        userAccounts,
        setUserAccounts,
        userAccountsLoading,
        fetchUserAccounts,
        changelogs,
        setChangelogs,
        changelogsLoading,
        fetchAdminChangelogs,
        selectedAccountModal,
        setSelectedAccountModal,
        toastMsg,
        showToast,
        handleLogout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
}
