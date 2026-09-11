'use client';

import React, { useState, useRef } from 'react';
import {
  FileCode,
  FileText,
  Image as ImageIcon,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Upload,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Sparkles,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import type { StudioFile, StudioImage } from '@/components/latex/StudioTools';

export interface FileTreeExplorerProps {
  files: StudioFile[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onUploadAsset: (file: File) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function FileTreeExplorer({
  files,
  activeFileName,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onUploadAsset,
  isCollapsed,
  onToggleCollapse,
}: FileTreeExplorerProps) {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [isImagesFolderOpen, setIsImagesFolderOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileName.trim();
    if (!name) return;
    if (!name.includes('.')) {
      name = `${name}.tex`;
    }
    if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      alert(`Tệp "${name}" đã tồn tại.`);
      return;
    }
    onCreateFile(name);
    setNewFileName('');
    setIsAddingFile(false);
  };

  const handleRenameSubmit = (oldName: string) => {
    let name = renameInput.trim();
    if (!name || name === oldName) {
      setEditingFileName(null);
      return;
    }
    if (!name.includes('.')) {
      name = `${name}.tex`;
    }
    if (files.some((f) => f.name.toLowerCase() === name.toLowerCase() && f.name !== oldName)) {
      alert(`Tệp "${name}" đã tồn tại.`);
      return;
    }
    onRenameFile(oldName, name);
    setEditingFileName(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAsset(file);
      e.target.value = '';
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (name === 'main.tex') {
      return <FileCode className="w-4 h-4 text-cyan-500 shrink-0" />;
    }
    if (ext === 'tex') {
      return <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  if (isCollapsed) {
    return (
      <div className="w-12 shrink-0 bg-white/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 gap-3 select-none transition-all">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Mở rộng cây thư mục tệp"
        >
          <Layers className="w-4 h-4 text-cyan-500" />
        </button>
        <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-1" />
        {files.map((file) => {
          const isActive = file.name === activeFileName;
          return (
            <button
              key={file.name}
              type="button"
              onClick={() => onSelectFile(file.name)}
              className={`p-2 rounded-xl transition ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-2xs'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={file.name}
            >
              {getFileIcon(file.name)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside
      aria-label="Cây thư mục tệp dự án LaTeX"
      className="w-56 shrink-0 bg-white/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between text-xs select-none backdrop-blur-sm transition-all h-full overflow-hidden"
    >
      {/* Top Header & Actions */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>Tệp Dự Án</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsAddingFile(true);
              setNewFileName('');
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            title="Thêm tệp LaTeX con (+ File)"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            title="Tải ảnh / tệp đính kèm lên"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".tex,.png,.jpg,.jpeg,.svg,.pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition ml-1"
            title="Thu gọn cây thư mục"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File List Tree */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {/* Inline New File Input */}
        {isAddingFile && (
          <form onSubmit={handleCreateSubmit} className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FilePlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="vd: cau_hoi.tex"
                className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsAddingFile(false)}
                className="px-2 py-0.5 rounded text-[10px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-2 py-0.5 rounded text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                Tạo
              </button>
            </div>
          </form>
        )}

        {/* Files and Tree Nodes */}
        {files.map((file) => {
          const isActive = file.name === activeFileName;
          const isMain = file.name === 'main.tex';
          const isEditing = editingFileName === file.name;

          return (
            <div
              key={file.name}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/25 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              onClick={() => {
                if (!isEditing) onSelectFile(file.name);
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file.name)}
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={renameInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(file.name);
                      if (e.key === 'Escape') setEditingFileName(null);
                    }}
                    onBlur={() => handleRenameSubmit(file.name)}
                    className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-cyan-500 rounded px-1 py-0.2 outline-none text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <span className="truncate font-mono text-[11px]" title={file.name}>
                    {file.name}
                  </span>
                )}
              </div>

              {/* Main Badge / Hover Actions */}
              {isMain ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono shrink-0">
                  Main
                </span>
              ) : (
                !isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFileName(file.name);
                        setRenameInput(file.name);
                      }}
                      className="p-1 rounded hover:text-cyan-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Đổi tên tệp"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Xóa tệp "${file.name}"?`)) {
                          onDeleteFile(file.name);
                        }
                      }}
                      className="p-1 rounded hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Xóa tệp"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Tip */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-[10px] text-slate-500 dark:text-slate-400">
        <p className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Mẹo nhúng tệp</span>
        </p>
        <code className="block bg-slate-200/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded font-mono text-[9px] text-cyan-600 dark:text-cyan-400 mt-1">
          \input&#123;cau_hoi.tex&#125;
        </code>
      </div>
    </aside>
  );
}
