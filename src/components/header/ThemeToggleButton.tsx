'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface ThemeToggleButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggleButton({ className = '', size = 'md' }: ThemeToggleButtonProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div
        className={`h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse shrink-0 ${className}`}
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Chuyển đổi giao diện sáng tối"
      title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
      className={`h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-sky-500/40 dark:hover:border-sky-500/40 text-slate-700 dark:text-amber-400 transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
}

export default ThemeToggleButton;
