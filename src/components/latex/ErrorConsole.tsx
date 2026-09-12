'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  WandSparkles,
  Copy,
  Check,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Code2,
} from 'lucide-react';

export interface ParsedTeXIssue {
  id: string;
  type: 'error' | 'warning';
  line?: number;
  file?: string;
  message: string;
  rawSnippet?: string;
}

export function parseTeXLog(
  logText: string,
  currentFile = 'main.tex'
): { errors: ParsedTeXIssue[]; warnings: ParsedTeXIssue[] } {
  const errors: ParsedTeXIssue[] = [];
  const warnings: ParsedTeXIssue[] = [];
  if (!logText) return { errors, warnings };

  const lines = logText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. Check for standard file:line:message format
    const fileLineMatch = line.match(/(?:(?:\.\/)?([a-zA-Z0-9_\-.]+\.tex)):(\d+):\s*(.*)$/);
    if (fileLineMatch) {
      let fileName = fileLineMatch[1] || currentFile;
      if (fileName.includes('__main_document__')) {
        fileName = currentFile;
      }
      const lineNum = parseInt(fileLineMatch[2], 10);
      const msg = fileLineMatch[3] || line;
      errors.push({
        id: `err-${i}-${lineNum}`,
        type: 'error',
        line: lineNum,
        file: fileName,
        message: msg.trim(),
        rawSnippet: line,
      });
      continue;
    }

    // 2. Check for TeX exclamation mark error line: "! Missing $ inserted.", "! LaTeX Error: ...", "! Undefined control sequence."
    if (
      line.startsWith('!') ||
      line.startsWith('LaTeX Error:') ||
      line.startsWith('Fatal error') ||
      line.includes('Missing $ inserted') ||
      line.includes('Undefined control sequence')
    ) {
      let message = line.replace(/^!\s*/, '');
      let lineNum: number | undefined;
      let rawSnippet = line;

      // Look ahead up to 12 lines for "l.<line_number> ..."
      for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
        const aheadLine = lines[j];
        if (aheadLine.startsWith('!')) break;

        const lineMatch = aheadLine.match(/^\s*l\.(\d+)\s*(.*)$/);
        if (lineMatch) {
          lineNum = parseInt(lineMatch[1], 10);
          const codePart = lineMatch[2]?.trim();
          if (codePart && !message.includes(codePart)) {
            rawSnippet = `${line}\n${aheadLine}`;
          }
          break;
        }
      }

      errors.push({
        id: `err-${i}-${lineNum || 'gen'}`,
        type: 'error',
        line: lineNum,
        file: currentFile,
        message: message.trim(),
        rawSnippet,
      });
    } else if (
      line.includes('LaTeX Warning:') ||
      (line.includes('Package ') && line.includes('Warning:')) ||
      line.includes('Overfull \\hbox') ||
      line.includes('Underfull \\hbox')
    ) {
      let message = line.replace(/.*Warning:\s*/, '').trim();
      if (line.includes('Overfull \\hbox')) message = 'Cảnh báo lề: ' + line.trim();
      if (line.includes('Underfull \\hbox')) message = 'Cảnh báo ngắt dòng: ' + line.trim();

      const matchLine = line.match(/(?:input line|lines?)\s*(\d+)/i);
      const lineNum = matchLine ? parseInt(matchLine[1], 10) : undefined;

      warnings.push({
        id: `warn-${i}-${lineNum || 'gen'}`,
        type: 'warning',
        line: lineNum,
        file: currentFile,
        message: message || line.trim(),
        rawSnippet: line,
      });
    }
  }

  // Deduplicate errors by line and message
  const uniqueErrors: ParsedTeXIssue[] = [];
  const seenErrorKeys = new Set<string>();
  for (const err of errors) {
    const key = `${err.line || 0}-${err.message}`;
    if (!seenErrorKeys.has(key)) {
      seenErrorKeys.add(key);
      uniqueErrors.push(err);
    }
  }

  if (
    uniqueErrors.length === 0 &&
    (logText.toLowerCase().includes('lỗi') ||
      logText.toLowerCase().includes('fail') ||
      logText.toLowerCase().includes('emergency stop') ||
      logText.toLowerCase().includes('fatal error'))
  ) {
    uniqueErrors.push({
      id: `err-general-${Date.now()}`,
      type: 'error',
      message: logText.slice(0, 400),
      file: currentFile,
    });
  }

  return { errors: uniqueErrors, warnings };
}

export interface ErrorConsoleProps {
  log: string;
  onJumpToLine: (line: number, file?: string) => void;
  onAIFix: () => void;
  fixBusy: boolean;
  onClose?: () => void;
}

export default function ErrorConsole({
  log,
  onJumpToLine,
  onAIFix,
  fixBusy,
  onClose,
}: ErrorConsoleProps) {
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'raw'>('errors');
  const [copied, setCopied] = useState(false);

  const { errors, warnings } = parseTeXLog(log);

  const handleCopyLog = () => {
    navigator.clipboard.writeText(log);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs font-sans overflow-hidden">
      {/* Console Header Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'errors'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Lỗi ({errors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warnings')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'warnings'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Cảnh báo ({warnings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'raw'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nhật ký thô (Raw)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {errors.length > 0 && (
            <button
              type="button"
              disabled={fixBusy}
              onClick={onAIFix}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <WandSparkles className="w-3.5 h-3.5" />
              <span>{fixBusy ? 'AI đang sửa…' : 'Tự sửa lỗi với AI'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLog}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Sao chép toàn bộ nhật ký"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Đóng Console"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Console Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
        {activeTab === 'errors' && (
          errors.length === 0 ? (
            <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Check className="w-6 h-6 text-emerald-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Không có lỗi nghiêm trọng nào!</p>
              <p className="text-[11px]">Mã TeX đã hợp lệ và sẵn sàng xuất bản PDF.</p>
            </div>
          ) : (
            errors.map((err) => (
              <div
                key={err.id}
                onClick={() => err.line && onJumpToLine(err.line, err.file)}
                className={`p-3 rounded-xl border border-rose-300/80 dark:border-rose-900/80 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 transition ${
                  err.line ? 'cursor-pointer hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-xs' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {err.line ? (
                      <span className="bg-rose-500/20 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        Dòng {err.line}
                      </span>
                    ) : (
                      <span className="bg-rose-500/20 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        Lỗi chung
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {err.file}
                    </span>
                  </div>

                  {err.line && (
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5 shrink-0">
                      <span>Đến dòng</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed break-words">
                  {err.message}
                </p>
              </div>
            ))
          )
        )}

        {activeTab === 'warnings' && (
          warnings.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Không có cảnh báo nào</p>
            </div>
          ) : (
            warnings.map((warn) => (
              <div
                key={warn.id}
                onClick={() => warn.line && onJumpToLine(warn.line, warn.file)}
                className={`p-3 rounded-xl border border-amber-300/80 dark:border-amber-900/80 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 transition ${
                  warn.line ? 'cursor-pointer hover:border-amber-400 dark:hover:border-amber-700' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {warn.line && (
                      <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        Dòng {warn.line}
                      </span>
                    )}
                  </div>
                  {warn.line && (
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5">
                      <span>Đến dòng</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed break-words">
                  {warn.message}
                </p>
              </div>
            ))
          )
        )}

        {activeTab === 'raw' && (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 overflow-x-auto select-text leading-relaxed">
            {log || 'Chưa có dữ liệu nhật ký biên dịch.'}
          </pre>
        )}
      </div>
    </div>
  );
}
