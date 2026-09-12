'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Mail,
  Link as LinkIcon,
  Check,
  Copy,
  Trash2,
  Globe,
  Lock,
  UserCheck,
  Shield,
  Eye,
  Edit3,
} from 'lucide-react';

export interface ProjectShareMember {
  email: string;
  role: 'editor' | 'viewer';
  addedAt: number;
}

export interface ProjectShareSettings {
  isPublicLinkEnabled: boolean;
  editToken: string;
  viewToken: string;
  members: ProjectShareMember[];
}

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  docTitle: string;
  currentUserEmail?: string;
}

const STORAGE_KEY_PREFIX = 'project_share_settings_';

export function loadShareSettings(docId: string): ProjectShareSettings {
  if (typeof window === 'undefined') {
    return {
      isPublicLinkEnabled: false,
      editToken: 'token_edit_' + Math.random().toString(36).substring(2, 10),
      viewToken: 'token_view_' + Math.random().toString(36).substring(2, 10),
      members: [],
    };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${docId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading share settings', e);
  }
  const initial: ProjectShareSettings = {
    isPublicLinkEnabled: false,
    editToken: 'edit_' + Math.random().toString(36).substring(2, 12),
    viewToken: 'view_' + Math.random().toString(36).substring(2, 12),
    members: [],
  };
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${docId}`, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function saveShareSettings(docId: string, settings: ProjectShareSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${docId}`, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving share settings', e);
  }
}

export default function ShareProjectModal({
  isOpen,
  onClose,
  docId,
  docTitle,
  currentUserEmail = 'ban@mathaio.edu.vn',
}: ShareProjectModalProps) {
  const [settings, setSettings] = useState<ProjectShareSettings>(() =>
    loadShareSettings(docId)
  );

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [copiedEditLink, setCopiedEditLink] = useState(false);
  const [copiedViewLink, setCopiedViewLink] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettings(loadShareSettings(docId));
      setEmailError('');
    }
  }, [isOpen, docId]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const editLink = `${origin}/latex?id=${docId}&token=${settings.editToken}&access=edit`;
  const viewLink = `${origin}/latex?id=${docId}&token=${settings.viewToken}&access=view`;

  const handleToggleLinkSharing = () => {
    const next = { ...settings, isPublicLinkEnabled: !settings.isPublicLinkEnabled };
    setSettings(next);
    saveShareSettings(docId, next);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Địa chỉ email không hợp lệ.');
      return;
    }

    if (cleanEmail === currentUserEmail.toLowerCase()) {
      setEmailError('Bạn đã là chủ sở hữu của dự án này.');
      return;
    }

    if (settings.members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setEmailError('Email này đã được mời tham gia.');
      return;
    }

    const nextMembers: ProjectShareMember[] = [
      ...settings.members,
      { email: cleanEmail, role: inviteRole, addedAt: Date.now() },
    ];
    const next = { ...settings, members: nextMembers };
    setSettings(next);
    saveShareSettings(docId, next);
    setInviteEmail('');
    setEmailError('');
  };

  const handleRemoveMember = (email: string) => {
    const nextMembers = settings.members.filter(
      (m) => m.email.toLowerCase() !== email.toLowerCase()
    );
    const next = { ...settings, members: nextMembers };
    setSettings(next);
    saveShareSettings(docId, next);
  };

  const handleChangeMemberRole = (email: string, role: 'editor' | 'viewer') => {
    const nextMembers = settings.members.map((m) =>
      m.email.toLowerCase() === email.toLowerCase() ? { ...m, role } : m
    );
    const next = { ...settings, members: nextMembers };
    setSettings(next);
    saveShareSettings(docId, next);
  };

  const handleCopyLink = (type: 'edit' | 'view') => {
    const link = type === 'edit' ? editLink : viewLink;
    navigator.clipboard.writeText(link);
    if (type === 'edit') {
      setCopiedEditLink(true);
      setTimeout(() => setCopiedEditLink(false), 2000);
    } else {
      setCopiedViewLink(true);
      setTimeout(() => setCopiedViewLink(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-12 sm:pt-16 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 id="share-modal-title" className="font-bold text-sm text-slate-900 dark:text-white">
                Chia sẻ dự án
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                {docTitle || 'main.tex'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 overflow-y-auto text-xs">
          {/* SECTION 1: Mời qua Email (Authenticated) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Mời cộng tác qua Email (Bắt buộc đăng nhập)</span>
              </label>
              <span className="text-[10px] text-slate-400">Xác thực tài khoản</span>
            </div>

            <form onSubmit={handleInvite} className="flex items-center gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="Nhập địa chỉ email đồng nghiệp / học sinh..."
                className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                aria-label="Chọn quyền truy cập cho email"
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 shrink-0"
              >
                <option value="editor">Người chỉnh sửa</option>
                <option value="viewer">Người xem (Chỉ đọc)</option>
              </select>

              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shrink-0 shadow-xs"
              >
                Mời
              </button>
            </form>

            {emailError && (
              <p className="text-[11px] text-rose-500 font-medium">{emailError}</p>
            )}

            {/* Members List */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/20 max-h-40 overflow-y-auto">
              {/* Owner */}
              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    👑
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {currentUserEmail}
                    </p>
                    <p className="text-[10px] text-slate-400">Chủ sở hữu dự án</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Chủ sở hữu
                </span>
              </div>

              {/* Invited Members */}
              {settings.members.map((member) => (
                <div key={member.email} className="flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {member.email}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {member.role === 'editor' ? 'Có quyền chỉnh sửa' : 'Chỉ có quyền xem'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleChangeMemberRole(member.email, e.target.value as any)
                      }
                      aria-label="Thay đổi quyền thành viên"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="editor">Chỉnh sửa</option>
                      <option value="viewer">Chỉ xem</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.email)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Thu hồi quyền truy cập"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Chia sẻ liên kết công khai (Public Link Sharing - Không cần đăng nhập) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Chia sẻ liên kết công khai (Không cần đăng nhập)</span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Bất kỳ ai có đường liên kết này đều có thể mở và xem/sửa dự án trực tiếp.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.isPublicLinkEnabled}
                onClick={handleToggleLinkSharing}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.isPublicLinkEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.isPublicLinkEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Links display when enabled */}
            {settings.isPublicLinkEnabled ? (
              <div className="space-y-3 pt-1">
                {/* Edit Link */}
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      <span>Liên kết Chỉnh sửa (Editor Link)</span>
                    </span>
                    <span className="text-[10px] font-normal text-emerald-600/80">Cho phép sửa code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={editLink}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-mono text-[10px] outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink('edit')}
                      className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      {copiedEditLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEditLink ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                {/* View Link */}
                <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-700 dark:text-cyan-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Liên kết Chỉ xem (Viewer Link)</span>
                    </span>
                    <span className="text-[10px] font-normal text-cyan-600/80">Khóa sửa mã nguồn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={viewLink}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-mono text-[10px] outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink('view')}
                      className="px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      {copiedViewLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedViewLink ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 opacity-60" />
                <span>Chia sẻ liên kết công khai hiện đang tắt. Bật switch ở trên để kích hoạt.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-950/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
