'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  GitBranch,
  FolderSync,
  Cloud,
  Check,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBibTeX?: (bibtexContent: string, fileName?: string) => void;
}

export default function IntegrationsModal({
  isOpen,
  onClose,
  onImportBibTeX,
}: IntegrationsModalProps) {
  const [activeTab, setActiveTab] = useState<'zotero' | 'mendeley' | 'github' | 'cloud'>('zotero');
  const [zoteroApiKey, setZoteroApiKey] = useState('');
  const [zoteroUserId, setZoteroUserId] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateZoteroSync = () => {
    setSyncStatus('Đang kết nối Zotero API và tải tài liệu tham khảo...');
    setTimeout(() => {
      const sampleBibTeX = `@article{einstein1905,
  author = {Einstein, Albert},
  title = {Zur Elektrodynamik bewegter K{\\"o}rper},
  journal = {Annalen der Physik},
  volume = {322},
  number = {10},
  pages = {891--921},
  year = {1905}
}

@book{knuth1984texbook,
  author = {Knuth, Donald E.},
  title = {The \\TeX book},
  publisher = {Addison-Wesley},
  year = {1984}
}`;
      onImportBibTeX?.(sampleBibTeX, 'references.bib');
      setSyncStatus('Đã đồng bộ thành công tệp references.bib vào dự án!');
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <FolderSync className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tích hợp & Đồng bộ nguồn ngoài (Integrations)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-slate-50/30 dark:bg-slate-900/30 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('zotero')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'zotero'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Zotero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mendeley')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'mendeley'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mendeley</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'github'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Git / GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`py-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Dropbox & Drive</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 min-h-[220px]">
          {activeTab === 'zotero' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đồng bộ thư viện Zotero</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tự động nhập danh mục tài liệu trích dẫn (.bib) trực tiếp từ tài khoản Zotero của bạn vào dự án.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Zotero User ID
                  </label>
                  <input
                    type="text"
                    value={zoteroUserId}
                    onChange={(e) => setZoteroUserId(e.target.value)}
                    placeholder="VD: 1234567"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API Key / Private Key
                  </label>
                  <input
                    type="password"
                    value={zoteroApiKey}
                    onChange={(e) => setZoteroApiKey(e.target.value)}
                    placeholder="Nhập khóa API Zotero"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://www.zotero.org/settings/keys/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Lấy khóa API Zotero tại đây</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={handleSimulateZoteroSync}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đồng bộ ngay</span>
                </button>
              </div>

              {syncStatus && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncStatus}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mendeley' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đồng bộ Mendeley Reference Manager</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Liên kết thư viện tham khảo Mendeley của bạn để chèn trích dẫn tự động.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Mendeley OAuth 2.0</div>
                  <div className="text-[11px] text-slate-500">Đăng nhập tài khoản Elsevier / Mendeley</div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Chức năng liên kết Mendeley OAuth đang được chuẩn bị.')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                >
                  Kết nối Mendeley
                </button>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đồng bộ Git / GitHub Repository</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Đẩy (Push) hoặc Kéo (Pull) toàn bộ source LaTeX trực tiếp từ kho lưu trữ Git.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Repository URL (HTTPS)
                  </label>
                  <input
                    type="text"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository.git"
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-1/2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nhánh (Branch)
                    </label>
                    <input
                      type="text"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      placeholder="main"
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="w-1/2 flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => alert('Đã bắt đầu tiến trình Git fetch/pull...')}
                      className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Git Pull</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Đã bắt đầu tiến trình Git commit & push...')}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Git Push</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lưu trữ đám mây ngoài</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tự động sao lưu bản PDF và gói ZIP mã nguồn lên Dropbox hoặc Google Drive.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Dropbox</div>
                  <p className="text-[11px] text-slate-500">Đồng bộ hai chiều với thư mục ứng dụng Dropbox</p>
                  <button
                    type="button"
                    onClick={() => alert('Đang kết nối Dropbox...')}
                    className="w-full py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                  >
                    Kết nối Dropbox
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Google Drive</div>
                  <p className="text-[11px] text-slate-500">Tự động xuất tệp PDF sau mỗi lần Recompile</p>
                  <button
                    type="button"
                    onClick={() => alert('Đang kết nối Google Drive...')}
                    className="w-full py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                  >
                    Kết nối Google Drive
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
