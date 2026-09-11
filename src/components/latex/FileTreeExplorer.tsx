'use client';

import React, { useState, useRef, useMemo } from 'react';
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
  Layers,
  ChevronLeft,
  ListTree,
  Hash,
  Bookmark,
} from 'lucide-react';
import type { StudioFile } from '@/components/latex/StudioTools';

export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  line: number;
}

export interface FileTreeExplorerProps {
  files: StudioFile[];
  activeFileName: string;
  source: string;
  onSelectFile: (fileName: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onUploadAsset: (file: File) => void;
  onJumpToLine?: (line: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function parseTexOutline(source: string): OutlineItem[] {
  if (!source) return [];
  const lines = source.split('\n');
  const items: OutlineItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('%')) continue;

    // Detect \title{...}
    const titleMatch = line.match(/\\title\*?\{([^}]+)\}/);
    if (titleMatch) {
      items.push({
        id: `outline-title-${i}`,
        title: titleMatch[1].replace(/\\\\/g, ' ').trim(),
        level: 1,
        line: i + 1,
      });
      continue;
    }

    // Detect sections: \part, \chapter, \section, \subsection, \subsubsection
    const headingMatch = line.match(/\\(part|chapter|section|subsection|subsubsection)\*?\{([^}]+)\}/);
    if (headingMatch) {
      const type = headingMatch[1];
      const headingTitle = headingMatch[2].replace(/\\\\/g, ' ').trim();
      const level =
        type === 'part' || type === 'chapter' || type === 'section'
          ? 1
          : type === 'subsection'
          ? 2
          : 3;
      items.push({
        id: `outline-${i}`,
        title: headingTitle,
        level,
        line: i + 1,
      });
    }
  }

  return items;
}

export default function FileTreeExplorer({
  files,
  activeFileName,
  source,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onUploadAsset,
  onJumpToLine,
  isCollapsed,
  onToggleCollapse,
}: FileTreeExplorerProps) {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse document outline reactively
  const outlineItems = useMemo(() => parseTexOutline(source), [source]);

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

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const folder = newFolderName.trim();
    if (!folder) return;
    onCreateFile(`${folder}/README.tex`);
    setNewFolderName('');
    setIsAddingFolder(false);
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
      return <FileCode className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
    }
    if (ext === 'tex') {
      return <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  if (isCollapsed) {
    return (
      <div className="w-12 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-2.5 gap-3 select-none transition-all h-full">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Mở rộng cây thư mục & mục lục"
        >
          <Layers className="w-4 h-4 text-cyan-500" />
        </button>
        <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
        {files.slice(0, 5).map((file) => {
          const isActive = file.name === activeFileName;
          return (
            <button
              key={file.name}
              type="button"
              onClick={() => onSelectFile(file.name)}
              className={`p-1.5 rounded-lg transition ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={file.name}
            >
              {getFileIcon(file.name)}
            </button>
          );
        })}
        <div className="w-6 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Mục lục tài liệu (Outline)"
        >
          <ListTree className="w-4 h-4 text-amber-500" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Cột quản lý file và mục lục Overleaf"
      className="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col text-xs select-none transition-all h-full overflow-hidden"
    >
      {/* SECTION 1 (TOP HALF): FILE TREE */}
      <div className="flex flex-col flex-1 min-h-[160px] max-h-[55%] border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* File Tree Header */}
        <div className="px-3 py-2 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-[11px] tracking-wide uppercase">
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
            <span>File tree</span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                setIsAddingFile(true);
                setIsAddingFolder(false);
                setNewFileName('');
              }}
              className="p-1 rounded text-slate-500 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title="Tạo tệp mới (+ File)"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingFolder(true);
                setIsAddingFile(false);
                setNewFolderName('');
              }}
              className="p-1 rounded text-slate-500 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title="Tạo thư mục mới (+ Folder)"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title="Tải tệp / ảnh lên"
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
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition ml-0.5"
              title="Thu gọn cột trái"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* File Tree List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5">
          {/* New File Inline Form */}
          {isAddingFile && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-1.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <FilePlus className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="vd: baitap.tex"
                  className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setIsAddingFile(false)}
                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
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

          {/* New Folder Inline Form */}
          {isAddingFolder && (
            <form
              onSubmit={handleCreateFolderSubmit}
              className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-1.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <FolderPlus className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Tên thư mục (vd: images)"
                  className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setIsAddingFolder(false)}
                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Tạo
                </button>
              </div>
            </form>
          )}

          {/* Files */}
          {files.map((file) => {
            const isActive = file.name === activeFileName;
            const isMain = file.name === 'main.tex';
            const isEditing = editingFileName === file.name;

            return (
              <div
                key={file.name}
                className={`group flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/25 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                onClick={() => {
                  if (!isEditing) onSelectFile(file.name);
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
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

                {/* Main Tag / Action icons */}
                {isMain ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono shrink-0">
                    main
                  </span>
                ) : (
                  !isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFileName(file.name);
                          setRenameInput(file.name);
                        }}
                        className="p-1 rounded hover:text-cyan-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Đổi tên"
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
                        title="Xóa"
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
      </div>

      {/* SECTION 2 (BOTTOM HALF): FILE OUTLINE */}
      <div className="flex flex-col flex-1 min-h-[140px] overflow-hidden bg-slate-50/40 dark:bg-slate-950/20">
        {/* File Outline Header */}
        <div className="px-3 py-2 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-[11px] tracking-wide uppercase">
            <ListTree className="w-3.5 h-3.5 text-indigo-500" />
            <span>File outline</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {outlineItems.length} mục
          </span>
        </div>

        {/* Outline Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5">
          {outlineItems.length > 0 ? (
            outlineItems.map((item) => {
              const paddingLeft =
                item.level === 1 ? 'pl-2' : item.level === 2 ? 'pl-4' : 'pl-6';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onJumpToLine?.(item.line)}
                  className={`w-full text-left flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition group cursor-pointer ${paddingLeft}`}
                  title={`Dòng ${item.line}: ${item.title}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        item.level === 1
                          ? 'bg-cyan-500'
                          : item.level === 2
                          ? 'bg-indigo-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="truncate text-[11px] font-medium group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 ml-1 shrink-0 px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-cyan-500/10 group-hover:text-cyan-600">
                    L{item.line}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-[11px]">
              <Bookmark className="w-4 h-4 mx-auto mb-1 opacity-50" />
              <p>Chưa có \\section hoặc tiêu đề trong tệp hiện tại.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
