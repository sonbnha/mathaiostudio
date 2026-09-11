'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  WandSparkles,
  Send,
  Loader2,
  ChevronDown,
  BookOpen,
  FileCheck,
  Shapes,
  Sigma,
} from 'lucide-react';

export interface AIAssistantDropdownProps {
  onAI: (action: string, customPrompt?: string) => void;
  aiBusy: boolean;
}

const AI_PRESETS = [
  { id: 'exam', label: 'Soạn 5 câu trắc nghiệm Toán (A-B-C-D)', icon: <BookOpen className="w-3.5 h-3.5 text-cyan-500" /> },
  { id: 'solution', label: 'Viết lời giải chi tiết theo từng bước', icon: <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'tikz', label: 'Tạo khối hình học không gian TikZ', icon: <Shapes className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'table', label: 'Lập bảng biến thiên hàm số', icon: <Sigma className="w-3.5 h-3.5 text-indigo-500" /> },
];

export default function AIAssistantDropdown({ onAI, aiBusy }: AIAssistantDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleRunPreset = (presetId: string) => {
    onAI(presetId);
    setIsOpen(false);
  };

  const handleRunCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onAI('custom', customPrompt.trim());
    setCustomPrompt('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={aiBusy}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 transition shadow-2xs cursor-pointer disabled:opacity-50"
        title="Trợ lý AI soạn thảo & tạo đề toán"
      >
        {aiBusy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        )}
        <span className="hidden sm:inline">Trợ lý AI</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 mb-2">
            <WandSparkles className="w-4 h-4 text-indigo-500" />
            <span>AI Soạn Thảo Toán Học</span>
          </div>

          <div className="space-y-1 mb-3">
            {AI_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleRunPreset(p.id)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                {p.icon}
                <span className="truncate">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Prompt Form */}
          <form onSubmit={handleRunCustom} className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Yêu cầu AI soạn thảo tùy ý..."
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!customPrompt.trim()}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
