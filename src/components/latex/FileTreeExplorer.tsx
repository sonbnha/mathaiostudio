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
  HelpCircle,
  CheckSquare,
  Dot,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import type { StudioFile } from '@/components/latex/StudioTools';

export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  type: 'section' | 'part_vn' | 'subsection' | 'question' | 'subsub' | 'item';
  line: number;
}

function cleanTexText(raw: string): string {
  return raw
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\\underline\{([^}]+)\}/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\\\\/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseTexOutline(source: string): OutlineItem[] {
  if (!source) return [];
  const lines = source.split('\n');
  const items: OutlineItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (line.startsWith('%')) continue;

    // 1. \title{...}
    const titleMatch = line.match(/\\title\*?\{([^}]+)\}/);
    if (titleMatch) {
      items.push({
        id: `outline-title-${i}`,
        title: cleanTexText(titleMatch[1]),
        level: 1,
        type: 'section',
        line: i + 1,
      });
      continue;
    }

    // 2. \part, \chapter, \section
    const secMatch = line.match(/\\(part|chapter|section)\*?\{([^}]+)\}/);
    if (secMatch) {
      items.push({
        id: `outline-sec-${i}`,
        title: cleanTexText(secMatch[2]),
        level: 1,
        type: 'section',
        line: i + 1,
      });
      continue;
    }

    // 3. \textbf{PHẦN ...}
    const phanMatch = line.match(/\\textbf\{(PHẦN\s+[^\}]+)\}/i);
    if (phanMatch) {
      items.push({
        id: `outline-phan-${i}`,
        title: cleanTexText(phanMatch[1]),
        level: 1,
        type: 'part_vn',
        line: i + 1,
      });
      continue;
    }

    // 4. \subsection
    const subsecMatch = line.match(/\\subsection\*?\{([^}]+)\}/);
    if (subsecMatch) {
      items.push({
        id: `outline-subsec-${i}`,
        title: cleanTexText(subsecMatch[1]),
        level: 2,
        type: 'subsection',
        line: i + 1,
      });
      continue;
    }

    // 5. \textbf{Câu ...} or standalone Câu \d+
    const cauMatch = line.match(/\\textbf\{(Câu\s+\d+[^}]*)\}/i) || line.match(/^(Câu\s+\d+[\.:]?\s*[^\\]*)/i);
    if (cauMatch) {
      const qText = cleanTexText(cauMatch[1]);
      items.push({
        id: `outline-cau-${i}`,
        title: qText.slice(0, 45) + (qText.length > 45 ? '…' : ''),
        level: 2,
        type: 'question',
        line: i + 1,
      });
      continue;
    }

    // 6. \subsubsection or \paragraph
    const subsubMatch = line.match(/\\(subsubsection|paragraph)\*?\{([^}]+)\}/);
    if (subsubMatch) {
      items.push({
        id: `outline-subsub-${i}`,
        title: cleanTexText(subsubMatch[2]),
        level: 3,
        type: 'subsub',
        line: i + 1,
      });
      continue;
    }

    // 7. \item (with label or descriptive text)
    const itemMatch = line.match(/^\\item(?:\[([^\]]+)\])?\s*(.*)/);
    if (itemMatch) {
      const label = itemMatch[1];
      const text = itemMatch[2];
      if (label) {
        items.push({
          id: `outline-item-${i}`,
          title: cleanTexText(label + (text ? ': ' + text.slice(0, 30) : '')),
          level: 3,
          type: 'item',
          line: i + 1,
        });
      } else if (text && text.length > 4 && !text.startsWith('\\begin')) {
        const itemClean = cleanTexText(text);
        if (itemClean) {
          items.push({
            id: `outline-item-${i}`,
            title: itemClean.slice(0, 38) + (itemClean.length > 38 ? '…' : ''),
            level: 3,
            type: 'item',
            line: i + 1,
          });
        }
      }
    }
  }

  return items;
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

  const getOutlineIcon = (item: OutlineItem) => {
    if (item.type === 'part_vn' || item.type === 'section') {
      return <Bookmark className="w-3 h-3 text-cyan-500 shrink-0" />;
    }
    if (item.type === 'question') {
      return <CheckSquare className="w-3 h-3 text-emerald-500 shrink-0" />;
    }
    if (item.type === 'subsection') {
      return <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0" />;
    }
    return <Dot className="w-4 h-4 text-slate-400 -mx-1 shrink-0" />;
  };

  const [treeHeightPercent, setTreeHeightPercent] = useState<number>(55);
  const [isTreeExpanded, setIsTreeExpanded] = useState<boolean>(true);
  const [isOutlineExpanded, setIsOutlineExpanded] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDownHorizontalSplitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentY = moveEvent.clientY - containerRect.top;
      const totalH = containerRect.height;
      if (totalH <= 0) return;
      const percent = (currentY / totalH) * 100;
      setTreeHeightPercent(Math.min(80, Math.max(20, percent)));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-2.5 gap-3 select-none transition-all h-full">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
              className={`p-1.5 rounded-lg transition cursor-pointer ${
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
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Mục lục tài liệu (Outline)"
        >
          <ListTree className="w-4 h-4 text-amber-500" />
        </button>
      </div>
    );
  }

  const bothExpanded = isTreeExpanded && isOutlineExpanded;

  return (
    <aside
      ref={containerRef}
      aria-label="Cột quản lý file và mục lục Overleaf"
      className="w-full h-full flex flex-col overflow-hidden relative select-none bg-white dark:bg-[#1e2124]"
    >
      {/* SECTION 1 (TOP TIER): FILE TREE */}
      <div
        style={bothExpanded ? { height: `${treeHeightPercent}%` } : undefined}
        className={
          bothExpanded
            ? 'flex flex-col overflow-hidden flex-shrink-0'
            : isTreeExpanded
            ? 'flex-1 min-h-0 h-full flex flex-col overflow-hidden'
            : 'h-8 flex-shrink-0 border-b border-white/5 overflow-hidden flex flex-col'
        }
      >
        {/* File Tree Header */}
        <div className="flex items-center justify-between px-2 h-8 border-b border-white/5 bg-[#181a1d] overflow-hidden select-none shrink-0">
          {/* Left Title Group (Truncates on shrink) */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
            <button
              type="button"
              onClick={() => setIsTreeExpanded(!isTreeExpanded)}
              className="flex items-center text-neutral-400 hover:text-white transition flex-shrink-0 cursor-pointer p-0.5 rounded hover:bg-white/5"
              title="Đóng/Mở File Tree"
            >
              <ChevronRight
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                  isTreeExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
            <span
              onClick={() => setIsTreeExpanded(!isTreeExpanded)}
              className="truncate overflow-hidden whitespace-nowrap text-xs font-semibold text-neutral-300 cursor-pointer uppercase tracking-wider"
              title="CÂY THƯ MỤC"
            >
              CÂY THƯ MỤC
            </span>
          </div>

          {/* Right Action Icons Group (Always preserved at the end) */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => {
                if (!isTreeExpanded) setIsTreeExpanded(true);
                setIsAddingFile(true);
                setIsAddingFolder(false);
                setNewFileName('');
              }}
              className="p-0.5 rounded text-neutral-400 hover:text-cyan-500 hover:bg-white/10 transition cursor-pointer"
              title="Tạo tệp mới (+ File)"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isTreeExpanded) setIsTreeExpanded(true);
                setIsAddingFolder(true);
                setIsAddingFile(false);
                setNewFolderName('');
              }}
              className="p-0.5 rounded text-neutral-400 hover:text-cyan-500 hover:bg-white/10 transition cursor-pointer"
              title="Tạo thư mục mới (+ Folder)"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-0.5 rounded text-neutral-400 hover:text-emerald-500 hover:bg-white/10 transition cursor-pointer"
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
            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng bảng điều khiển"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* File Tree List */}
        {isTreeExpanded && (
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
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
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
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
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
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
                      <span className="truncate font-mono text-xs" title={file.name}>
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
                          className="p-1 rounded hover:text-cyan-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
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
                          className="p-1 rounded hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
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
        )}
      </div>

      {/* HORIZONTAL RESIZER BETWEEN TREE AND OUTLINE */}
      {bothExpanded && (
        <div
          onMouseDown={handleMouseDownHorizontalSplitter}
          className="h-1.5 w-full bg-[#181a1d] hover:bg-emerald-500/40 cursor-row-resize flex-shrink-0 border-y border-white/5 transition-colors z-20"
          title="Kéo phân chia tỷ lệ chiều cao Cây thư mục và Dàn ý"
        />
      )}

      {/* SECTION 2 (BOTTOM TIER): FILE OUTLINE */}
      <div
        className={`flex flex-col border-t border-white/5 bg-[#181a1d] select-none ${
          bothExpanded
            ? 'flex-shrink-0 overflow-hidden'
            : isOutlineExpanded
            ? 'flex-1 min-h-0 h-full overflow-hidden'
            : 'h-8 flex-shrink-0 overflow-hidden'
        }`}
        style={bothExpanded ? { height: `calc(${100 - treeHeightPercent}% - 6px)` } : undefined}
      >
        {/* Header luôn luôn render, không nằm trong điều kiện */}
        <div
          onClick={() => setIsOutlineExpanded(!isOutlineExpanded)}
          className="h-8 px-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none shrink-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <ChevronRight
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                isOutlineExpanded ? 'rotate-90' : ''
              }`}
            />
            <span className="text-[11px] font-semibold tracking-wider text-neutral-300 uppercase truncate">
              Dàn ý tài liệu
            </span>
          </div>
          {outlineItems.length > 0 && (
            <span className="text-[10px] text-neutral-500 pr-1 shrink-0">{outlineItems.length} mục</span>
          )}
        </div>

        {/* Outline Items List */}
        {isOutlineExpanded && (
          <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1 scrollbar-thin">
            {outlineItems.length > 0 ? (
              outlineItems.map((item) => {
                const paddingLeft =
                  item.level === 1 ? 'pl-2' : item.level === 2 ? 'pl-4' : 'pl-6';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onJumpToLine?.(item.line)}
                    className={`w-full text-left flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition group cursor-pointer text-xs ${paddingLeft}`}
                    title={`Dòng ${item.line}: ${item.title}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {getOutlineIcon(item)}
                      <span className="truncate text-xs font-medium group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
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
                <p>Chưa có \section hoặc tiêu đề trong tệp hiện tại.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
