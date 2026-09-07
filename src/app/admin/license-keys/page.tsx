'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Users,
  CreditCard,
  AlertCircle,
  Clock,
  User,
  Search,
  Loader2,
  X,
  Shield,
  Filter,
  Send,
  Globe,
  Zap,
  ExternalLink,
  Share2,
  HelpCircle,
} from 'lucide-react';
import {
  useAdminContext,
  LicenseKeyItem,
  getMaskedKey,
} from '../AdminContext';

export default function AdminLicenseKeysPage() {
  const {
    keys,
    setKeys,
    fetchKeys,
    checkAuth,
    isStaff,
    isStaffUnlimited,
    staffCreatedCount,
    staffMaxCredits,
    userAccounts,
    showToast,
    setSelectedAccountModal,
  } = useAdminContext();

  // Search & Filter State
  const [keySearch, setKeySearch] = useState('');
  const [creatorFilter, setCreatorFilter] = useState<string>('ALL');
  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<string>>(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedCustomerKeyId, setCopiedCustomerKeyId] = useState<string | null>(null);

  // Create Key Modal State
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [createKeyLoading, setCreateKeyLoading] = useState(false);
  const [keyActionError, setKeyActionError] = useState<string | null>(null);
  const [isUnlimitedCredits, setIsUnlimitedCredits] = useState(false);
  const [customCreditCount, setCustomCreditCount] = useState<number>(50);
  const [durationDays, setDurationDays] = useState<number>(30); // 30, 90, 365, 0 (Vô hạn)

  // Newly Created Key Success Modal State
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<LicenseKeyItem | null>(null);
  const [copiedSuccessKey, setCopiedSuccessKey] = useState(false);
  const [copiedCustomerMessage, setCopiedCustomerMessage] = useState(false);

  const toggleRevealKey = (id: string) => {
    setRevealedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    showToast('Đã sao chép mã Key!');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopySuccessKey = () => {
    if (!newlyCreatedKey) return;
    navigator.clipboard.writeText(newlyCreatedKey.key);
    setCopiedSuccessKey(true);
    showToast('Đã sao chép mã Key!');
    setTimeout(() => setCopiedSuccessKey(false), 2500);
  };

  const handleCopyCustomerMessage = () => {
    if (!newlyCreatedKey) return;

    const appUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const durDays = newlyCreatedKey.durationDays ?? newlyCreatedKey.duration_days ?? 30;
    const isLifetime = durDays === 0 || newlyCreatedKey.key?.startsWith('AIO-LT-');
    const creditsCount = newlyCreatedKey.credits ?? newlyCreatedKey.totalCredits ?? 50;
    const creditsStr =
      creditsCount === -1
        ? '∞ Ω'
        : isLifetime
        ? `${creditsCount} Ω vô hạn`
        : `${creditsCount} Ω/tháng`;

    const expireStr = isLifetime
      ? 'Vô hạn (∞)'
      : newlyCreatedKey.expiresAt
      ? new Date(newlyCreatedKey.expiresAt).toLocaleDateString('vi-VN')
      : `+${durDays} ngày`;

    const message = `🎉 KÍCH HOẠT BẢN QUYỀN MATHAIO
- Mã License Key: ${newlyCreatedKey.key}
- Định mức Ω: ${creditsStr}
- Thời hạn gói: ${expireStr}
👉 Kích hoạt key tại: ${appUrl}/settings`;

    navigator.clipboard.writeText(message);
    setCopiedCustomerMessage(true);
    showToast('Đã sao chép tin nhắn bàn giao!');
    setTimeout(() => setCopiedCustomerMessage(false), 2500);
  };

  const handleCopyKeyCustomerMessage = (keyItem: LicenseKeyItem) => {
    const appUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const durDays = keyItem.durationDays ?? keyItem.duration_days ?? 30;
    const isLifetime = durDays === 0 || keyItem.key?.startsWith('AIO-LT-');
    const creditsCount = keyItem.credits ?? keyItem.totalCredits ?? 50;
    const creditsStr =
      creditsCount === -1
        ? '∞ Ω'
        : isLifetime
        ? `${creditsCount} Ω vô hạn`
        : `${creditsCount} Ω/tháng`;

    const expireStr = isLifetime
      ? 'Vô hạn (∞)'
      : keyItem.expiresAt
      ? new Date(keyItem.expiresAt).toLocaleDateString('vi-VN')
      : `+${durDays} ngày`;

    const message = `🎉 KÍCH HOẠT BẢN QUYỀN MATHAIO
- Mã License Key: ${keyItem.key}
- Định mức Ω: ${creditsStr}
- Thời hạn gói: ${expireStr}
👉 Kích hoạt key tại: ${appUrl}/settings`;

    navigator.clipboard.writeText(message);
    setCopiedCustomerKeyId(keyItem.id);
    showToast('Đã sao chép tin nhắn bàn giao!');
    setTimeout(() => setCopiedCustomerKeyId(null), 2500);
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa License Key này?')) return;
    try {
      const res = await fetch(`/api/admin/keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        fetchKeys(false);
        checkAuth(false);
        showToast('Đã xóa License Key thành công!');
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xóa License Key.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa key:', err);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyActionError(null);
    setCreateKeyLoading(true);

    try {
      const maxUsageValue = isUnlimitedCredits
        ? -1
        : Number(customCreditCount) || 50;

      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: null,
          keyType: 'VIP',
          totalCredits: maxUsageValue,
          maxUsage: maxUsageValue,
          durationDays: Number(durationDays),
          prefix: Number(durationDays) === 0 ? 'AIO-LT' : 'AIO-VIP',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo License Key.');
      }

      // 1. Optimistic Update
      if (data.key) {
        setKeys((prev) => [data.key, ...prev.filter((k) => k.id !== data.key.id)]);
      }

      // Close create key modal
      setIsCreateKeyModalOpen(false);

      // 2. Open Success Modal
      setNewlyCreatedKey(data.key);
      setCopiedSuccessKey(false);
      setCopiedCustomerMessage(false);

      // 3. Trigger Toast Notification
      showToast('Tạo License Key thành công!');

      // 4. Reset form
      setIsUnlimitedCredits(false);
      setCustomCreditCount(50);
      setDurationDays(30);

      // 5. Silent background refresh
      fetchKeys(false);
      checkAuth(false);
    } catch (err: any) {
      setKeyActionError(err.message);
    } finally {
      setCreateKeyLoading(false);
    }
  };

  const ctvUsers = userAccounts.filter(
    (u) =>
      (u.role || '').toLowerCase() === 'staff' ||
      (u.role || '').toLowerCase() === 'ctv'
  );

  const filteredKeys = keys.filter((k) => {
    if (creatorFilter !== 'ALL') {
      if (creatorFilter === 'SYSTEM') {
        if (k.createdById !== null && k.createdBy !== null) return false;
      } else if (creatorFilter === 'ADMIN') {
        if (!k.createdBy || (k.createdBy.role || '').toLowerCase() !== 'admin') return false;
      } else {
        if (k.createdById !== creatorFilter && k.createdBy?.id !== creatorFilter) return false;
      }
    }

    if (!keySearch.trim()) return true;
    const q = keySearch.toLowerCase();
    return (
      k.key.toLowerCase().includes(q) ||
      (k.createdBy?.name && k.createdBy.name.toLowerCase().includes(q)) ||
      (k.createdBy?.username && k.createdBy.username.toLowerCase().includes(q)) ||
      (k.usedBy?.name && k.usedBy.name.toLowerCase().includes(q)) ||
      (k.usedBy?.username && k.usedBy.username.toLowerCase().includes(q)) ||
      (k.usedBy?.email && k.usedBy.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs flex flex-col transition-colors w-full overflow-hidden">
      {/* Header Filter / Search / Create Key Button */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{isStaff ? 'License Keys Của Tôi' : 'Tất Cả License Keys'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-medium">
              {filteredKeys.length} keys
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Creator Filter Dropdown for ADMIN */}
          {!isStaff && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer font-medium"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  Tất cả người tạo
                </option>
                <option value="ADMIN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  Chỉ key của Admin
                </option>
                <option value="SYSTEM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  Key Hệ thống (Cũ)
                </option>
                {ctvUsers.map((ctv) => (
                  <option
                    key={ctv.id}
                    value={ctv.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    CTV: {ctv.name} ({ctv.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keySearch}
              onChange={(e) => setKeySearch(e.target.value)}
              placeholder="Tìm theo mã key..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-cyan-500 transition w-36 sm:w-48"
            />
          </div>

          {/* Nút Nổi Bật: + Tạo License Key Mới */}
          <button
            type="button"
            onClick={() => {
              setKeyActionError(null);
              setIsCreateKeyModalOpen(true);
            }}
            className="h-9 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tạo License Key Mới</span>
          </button>
        </div>
      </div>

      {/* Table Scrollable Body */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[880px] border-collapse text-left text-xs">
          <colgroup>
            <col className="w-[220px]" />
            <col className="w-[23%]" />
            <col className="w-[25%]" />
            <col className="w-[25%]" />
            <col className="w-[110px]" />
          </colgroup>
          <thead className="bg-slate-50/95 dark:bg-[#151c2c]/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs font-bold shadow-xs">
            <tr>
              <th className="py-3.5 px-5 w-[220px] whitespace-nowrap">Mã Key</th>
              <th className="py-3.5 px-5 whitespace-nowrap">Người Tạo</th>
              <th className="py-3.5 px-5 whitespace-nowrap">NGƯỜI NẠP</th>
              <th className="py-3.5 px-5 whitespace-nowrap">ĐỊNH MỨC Ω</th>
              <th className="py-3.5 px-4 text-center sticky right-0 z-30 bg-slate-100 dark:bg-[#182030] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] w-[110px] whitespace-nowrap">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
            {filteredKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  {keySearch || creatorFilter !== 'ALL'
                    ? 'Không tìm thấy kết quả phù hợp.'
                    : 'Chưa có License Key nào.'}
                </td>
              </tr>
            ) : (
              filteredKeys.map((k) => (
                <tr key={k.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  {/* 1. Mã Key */}
                  <td className="px-5 py-3.5 align-middle whitespace-nowrap w-[220px]">
                    <div className="flex items-center justify-between w-[195px] h-[34px] bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-lg px-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      <span
                        onClick={() => toggleRevealKey(k.id)}
                        className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-300 tracking-wide select-all cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 truncate mr-1.5"
                        title="Click để sao chép / xem đầy đủ"
                      >
                        {revealedKeyIds.has(k.id) ? k.key : getMaskedKey(k.key)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyKey(k.key, k.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-xs cursor-pointer"
                        title="Sao chép mã"
                      >
                        {copiedKeyId === k.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 2. Người Tạo */}
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 align-middle whitespace-nowrap">
                    {k.createdBy ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          k.createdBy.role === 'admin'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        {k.createdBy.role === 'admin' ? (
                          <Shield className="w-3 h-3 text-rose-500" />
                        ) : (
                          <User className="w-3 h-3 text-cyan-500" />
                        )}
                        <span className="truncate max-w-[150px]">{k.createdBy.name || k.createdBy.username}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Hệ thống</span>
                    )}
                  </td>

                  {/* 3. Người Nạp (Used By) */}
                  <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                    {k.usedBy ? (
                      <button
                        type="button"
                        onClick={() => {
                          const fullUser = userAccounts.find((u) => u.id === k.usedBy?.id);
                          setSelectedAccountModal({
                            user: {
                              ...k.usedBy,
                              ...(fullUser || {}),
                            },
                            licenseKey: {
                              id: k.id,
                              key: k.key,
                              totalCredits: k.totalCredits,
                              credits: k.credits ?? k.totalCredits,
                              durationDays: k.durationDays,
                              duration_days: k.duration_days,
                              maxUsage: k.maxUsage,
                              max_usage: k.max_usage,
                              usedAt: k.usedAt || k.used_at,
                              used_at: k.used_at || k.usedAt,
                              createdBy: k.createdBy,
                            },
                          });
                        }}
                        className="inline-flex items-center gap-2 font-medium text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer text-left"
                        title="Xem chi tiết tài khoản"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{k.usedBy.name || k.usedBy.username}</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 italic">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        <span>Chưa sử dụng</span>
                      </div>
                    )}
                  </td>

                  {/* 4. ĐỊNH MỨC Ω */}
                  <td className="px-5 py-3.5 pr-6 align-middle whitespace-nowrap">
                    <div className="flex flex-col justify-center">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {(() => {
                          const creditsCount = k.credits ?? k.totalCredits ?? k.maxUsage ?? 50;
                          const durDays = k.durationDays ?? k.duration_days ?? 30;
                          const isLifetime = durDays === 0 || k.key?.startsWith('AIO-LT-');
                          if (creditsCount === -1) {
                            return isLifetime ? '∞ Ω' : '∞ Ω/tháng';
                          }
                          return isLifetime ? `${creditsCount} Ω` : `${creditsCount} Ω/tháng`;
                        })()}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        {(() => {
                          const durDays = k.durationDays ?? k.duration_days ?? 30;
                          const isLifetime = durDays === 0 || k.key?.startsWith('AIO-LT-');
                          return isLifetime ? 'Vô hạn (∞)' : `Hạn: ${durDays} ngày`;
                        })()}
                      </div>
                    </div>
                  </td>

                  {/* 5. Thao Tác (Ghim cố định bên phải - Sticky Right) */}
                  <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap sticky right-0 z-10 bg-white group-hover:bg-slate-50 dark:bg-[#111622] dark:group-hover:bg-[#182030] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] w-[110px] min-w-[110px] transition-colors">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Copy Customer Handover Message Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyKeyCustomerMessage(k)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 transition shadow-2xs"
                        title="Copy tin nhắn bàn giao gửi khách"
                      >
                        {copiedCustomerKeyId === k.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Key Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition shadow-2xs"
                        title="Xóa Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: TẠO LICENSE KEY MỚI                           */}
      {/* ---------------------------------------------------- */}
      {isCreateKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col gap-4 text-slate-900 dark:text-slate-100 transition-colors">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Tạo License Key Mới
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cấp mã bản quyền kích hoạt tài nguyên Ω
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateKey} className="flex flex-col gap-4">
              {/* Quota Section: Label + Input + 4 Quick-Select Buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Số Lượng Ω</span>
                    <span
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help inline-flex items-center ml-0.5"
                      title={Number(durationDays) === 0 ? '⚡ Ω nạp vô hạn (Ω Vô Hạn)' : '🔄 Ω cấp mỗi tháng (Monthly Allowance - Làm mới mỗi 30 ngày)'}
                    >
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  </label>

                  <input
                    type={isUnlimitedCredits ? 'text' : 'number'}
                    min={1}
                    max={99999}
                    value={isUnlimitedCredits ? '∞' : customCreditCount}
                    onChange={(e) => {
                      if (!isUnlimitedCredits) setCustomCreditCount(Math.max(1, Number(e.target.value)));
                    }}
                    disabled={isUnlimitedCredits}
                    placeholder="Số Ω..."
                    className={`w-24 h-8 border rounded-lg px-2 text-center text-xs font-medium outline-none transition ${
                      isUnlimitedCredits
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-300 cursor-default font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white'
                    }`}
                    required={!isUnlimitedCredits}
                  />
                </div>

                {/* 4 Quick-Select Buttons: 50 Ω, 100 Ω, 200 Ω, Vô hạn Ω */}
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setIsUnlimitedCredits(false);
                        setCustomCreditCount(count);
                      }}
                      className={`py-2 rounded-lg text-xs font-medium border text-center transition-all whitespace-nowrap cursor-pointer ${
                        !isUnlimitedCredits && customCreditCount === count
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 dark:bg-cyan-950/40 font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {count} Ω
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsUnlimitedCredits(true)}
                    className={`py-2 rounded-lg text-xs font-medium border text-center transition-all whitespace-nowrap cursor-pointer ${
                      isUnlimitedCredits
                        ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 dark:bg-purple-950/40 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    ∞ Ω
                  </button>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Thời Hạn Gói</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[
                    { label: '30 ngày', value: 30 },
                    { label: '90 ngày', value: 90 },
                    { label: '1 năm', value: 365 },
                    { label: 'Vô hạn', value: 0 },
                  ].map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setDurationDays(dur.value)}
                      className={`py-2 text-xs font-medium text-center rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        durationDays === dur.value
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {keyActionError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{keyActionError}</span>
                </div>
              )}

              {/* Preview mã key mới */}
              <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Định dạng key:</span>
                <span className={`font-mono font-bold ${Number(durationDays) === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {Number(durationDays) === 0 ? 'AIO-LT-••••-••••' : 'AIO-VIP-••••-••••'}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createKeyLoading || (isStaff && !isStaffUnlimited && staffCreatedCount >= (staffMaxCredits || 50))}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {createKeyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang sinh mã Key...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo License Key Mới</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: TẠO KEY THÀNH CÔNG (THẺ VIP VOUCHER CARD)     */}
      {/* ---------------------------------------------------- */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/35 rounded-3xl shadow-2xl shadow-slate-950/20 dark:shadow-indigo-500/15 p-6 sm:p-7 flex flex-col gap-5 text-slate-900 dark:text-slate-100 transition-colors">
            {/* Modal Close Button */}
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Thẻ */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] tracking-widest font-bold text-indigo-600 dark:text-amber-400 uppercase">
                  Bản Quyền Kích Hoạt Trực Tuyến
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide uppercase">
                  KÍCH HOẠT BẢN QUYỀN MATHAIO
                </h3>
              </div>
            </div>

            {/* Khung hiển thị Mã Key */}
            <div className="bg-indigo-50/80 dark:bg-slate-950/80 border border-indigo-200/90 dark:border-indigo-500/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner relative overflow-hidden transition-colors">
              <div className="absolute -top-10 -left-10 w-28 h-28 bg-indigo-500/10 dark:bg-amber-500/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-blue-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl"></div>

              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600/80 dark:text-amber-400/80">
                MÃ LICENSE KEY
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-indigo-700 dark:text-amber-400 tracking-wider select-all dark:drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                {newlyCreatedKey.key}
              </span>
            </div>

            {/* Danh Sách Thông Tin Chi Tiết */}
            <div className="flex flex-col gap-2.5 text-xs bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 transition-colors">
              {/* Định mức Ω */}
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Định mức Ω:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                    newlyCreatedKey.totalCredits === -1
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {(() => {
                    const durDays = newlyCreatedKey.durationDays ?? newlyCreatedKey.duration_days ?? 30;
                    const isLifetime = durDays === 0 || newlyCreatedKey.key?.startsWith('AIO-LT-');
                    const creditsCount = newlyCreatedKey.credits ?? newlyCreatedKey.totalCredits ?? 50;
                    if (creditsCount === -1) return '∞ Ω';
                    return isLifetime ? `${creditsCount} Ω vô hạn` : `${creditsCount} Ω/tháng`;
                  })()}
                </span>
              </div>

              {/* Thời hạn gói */}
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Thời hạn gói:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {(() => {
                    const durDays = newlyCreatedKey.durationDays ?? newlyCreatedKey.duration_days ?? 30;
                    const isLifetime = durDays === 0 || newlyCreatedKey.key?.startsWith('AIO-LT-');
                    if (isLifetime) return 'Vô hạn (∞)';
                    return newlyCreatedKey.expiresAt
                      ? new Date(newlyCreatedKey.expiresAt).toLocaleDateString('vi-VN')
                      : `${durDays} ngày`;
                  })()}
                </span>
              </div>

              {/* Link truy cập */}
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Link truy cập:
                </span>
                <a
                  href={typeof window !== 'undefined' ? window.location.origin : '/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline flex items-center gap-1 font-medium transition"
                >
                  <span className="truncate max-w-[200px]">
                    {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopySuccessKey}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
              >
                {copiedSuccessKey ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">✓ Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                    <span>📋 Sao chép mã Key</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyCustomerMessage}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/40"
              >
                {copiedCustomerMessage ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>✓ Đã sao chép tin nhắn!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>✨ Sao chép nội dung gửi khách</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
