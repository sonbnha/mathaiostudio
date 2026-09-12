'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Replace,
  X,
  FileCode,
  ChevronDown,
  ChevronRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import type { StudioFile } from '@/components/latex/StudioTools';

export interface ProjectSearchMatch {
  line: number;
  col: number;
  text: string;
  matchLength: number;
}

export interface FileSearchResults {
  fileName: string;
  matches: ProjectSearchMatch[];
}

interface ProjectSearchPanelProps {
  files: StudioFile[];
  activeFileName: string | null;
  onSelectFileAndLine: (fileName: string, line: number) => void;
  onUpdateFiles: (newFiles: StudioFile[]) => void;
  onClose: () => void;
}

export default function ProjectSearchPanel({
  files,
  activeFileName,
  onSelectFileAndLine,
  onUpdateFiles,
  onClose,
}: ProjectSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(true);
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});

  // Compute search matches across all files
  const searchResults = useMemo<FileSearchResults[]>(() => {
    if (!searchQuery.trim()) return [];

    let regex: RegExp;
    try {
      let pattern = searchQuery;
      if (!useRegex) {
        // Escape regex special chars
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = matchCase ? 'g' : 'gi';
      regex = new RegExp(pattern, flags);
    } catch {
      return [];
    }

    const results: FileSearchResults[] = [];

    for (const file of files) {
      if (!file.content) continue;
      const lines = file.content.split('\n');
      const fileMatches: ProjectSearchMatch[] = [];

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        let m: RegExpExecArray | null;
        regex.lastIndex = 0;

        while ((m = regex.exec(lineText)) !== null) {
          fileMatches.push({
            line: i + 1,
            col: m.index,
            text: lineText,
            matchLength: m[0].length,
          });
          if (!regex.global) break;
        }
      }

      if (fileMatches.length > 0) {
        results.push({
          fileName: file.name,
          matches: fileMatches,
        });
      }
    }

    return results;
  }, [files, searchQuery, matchCase, useRegex, wholeWord]);

  const totalMatches = searchResults.reduce((acc, r) => acc + r.matches.length, 0);

  const toggleFileCollapse = (fileName: string) => {
    setCollapsedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  const handleReplaceInFile = (targetFileName: string) => {
    if (!searchQuery) return;

    let regex: RegExp;
    try {
      let pattern = searchQuery;
      if (!useRegex) pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      regex = new RegExp(pattern, matchCase ? 'g' : 'gi');
    } catch {
      return;
    }

    const updated = files.map((f) => {
      if (f.name === targetFileName) {
        return {
          ...f,
          content: (f.content || '').replace(regex, replaceQuery),
        };
      }
      return f;
    });

    onUpdateFiles(updated);
  };

  const handleReplaceAll = () => {
    if (!searchQuery || totalMatches === 0) return;

    let regex: RegExp;
    try {
      let pattern = searchQuery;
      if (!useRegex) pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      regex = new RegExp(pattern, matchCase ? 'g' : 'gi');
    } catch {
      return;
    }

    const updated = files.map((f) => ({
      ...f,
      content: (f.content || '').replace(regex, replaceQuery),
    }));

    onUpdateFiles(updated);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-xs select-none bg-white dark:bg-slate-950">
      {/* Search Header */}
      <div className="w-full h-8 flex items-center justify-between px-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#181a1d] select-none shrink-0">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
          <Search className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-700 dark:text-neutral-300">
            Tìm & Thay thế toàn dự án
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
          title="Đóng bảng tìm kiếm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Controls & Inputs */}
      <div className="p-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 shrink-0">
        {/* Search Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trong tất cả tệp..."
            className="w-full bg-white dark:bg-[#1e2227] border border-slate-200 dark:border-white/10 rounded-md pl-2.5 pr-20 py-1.5 text-xs text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
          {/* Quick Modifier Icons inside input */}
          <div className="absolute right-1.5 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMatchCase(!matchCase)}
              className={`px-1 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                matchCase
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Khớp hoa / thường (Match Case)"
            >
              Aa
            </button>
            <button
              type="button"
              onClick={() => setWholeWord(!wholeWord)}
              className={`px-1 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                wholeWord
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Khớp nguyên từ (Whole Word)"
            >
              \b
            </button>
            <button
              type="button"
              onClick={() => setUseRegex(!useRegex)}
              className={`px-1 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                useRegex
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Biểu thức chính quy (Regex)"
            >
              .*
            </button>
          </div>
        </div>

        {/* Replace Input */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Thay thế bằng..."
            className="flex-1 bg-white dark:bg-[#1e2227] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={totalMatches === 0 || !searchQuery}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-medium rounded-md transition cursor-pointer shrink-0 shadow-2xs"
            title={`Thay thế tất cả ${totalMatches} vị trí trong toàn bộ dự án`}
          >
            Thay tất cả
          </button>
        </div>
      </div>

      {/* Results Meta Bar */}
      <div className="px-2.5 py-1.5 bg-slate-100/70 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 shrink-0">
        <span>
          {searchQuery
            ? `${totalMatches} kết quả trong ${searchResults.length} tệp`
            : 'Nhập từ khóa để tìm kiếm'}
        </span>
        {totalMatches > 0 && (
          <button
            type="button"
            onClick={() => {
              const allCollapsed = Object.keys(collapsedFiles).length === searchResults.length;
              if (allCollapsed) {
                setCollapsedFiles({});
              } else {
                const coll: Record<string, boolean> = {};
                searchResults.forEach((r) => (coll[r.fileName] = true));
                setCollapsedFiles(coll);
              }
            }}
            className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            {Object.keys(collapsedFiles).length === searchResults.length
              ? 'Mở rộng tất cả'
              : 'Thu gọn tất cả'}
          </button>
        )}
      </div>

      {/* Search Results Tree */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {searchResults.length > 0 ? (
          searchResults.map((group) => {
            const isCollapsed = !!collapsedFiles[group.fileName];
            const isCurrentFile = group.fileName === activeFileName;

            return (
              <div
                key={group.fileName}
                className="rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-2xs"
              >
                {/* File Header */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <button
                    type="button"
                    onClick={() => toggleFileCollapse(group.fileName)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <FileCode className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span
                      className={`text-xs font-mono truncate ${
                        isCurrentFile
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {group.fileName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {group.matches.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReplaceInFile(group.fileName)}
                    className="text-[10px] px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                    title={`Thay thế toàn bộ trong ${group.fileName}`}
                  >
                    Thay tệp này
                  </button>
                </div>

                {/* Match Items in this File */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {group.matches.map((m, idx) => (
                      <button
                        key={`${m.line}-${m.col}-${idx}`}
                        type="button"
                        onClick={() => onSelectFileAndLine(group.fileName, m.line)}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-start gap-2 group text-[11px] font-mono"
                      >
                        <span className="text-slate-400 group-hover:text-emerald-500 font-mono text-[10px] shrink-0 pt-0.5">
                          L{m.line}:
                        </span>
                        <div className="truncate text-slate-600 dark:text-slate-300">
                          {m.text.trim()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : searchQuery ? (
          <div className="text-center py-10 text-slate-400 dark:text-neutral-500 text-xs">
            Không tìm thấy kết quả phù hợp trong dự án
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 dark:text-neutral-500 text-xs">
            Nhập cụm từ để tìm kiếm trên tất cả các tệp
          </div>
        )}
      </div>
    </div>
  );
}
