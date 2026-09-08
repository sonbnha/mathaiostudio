'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('theme') as Theme | null;
      if (saved === 'dark') {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
      } else if (saved === 'light') {
        setThemeState('light');
        document.documentElement.classList.remove('dark');
      } else {
        // Fallback to current HTML class or system preference
        const isDark = document.documentElement.classList.contains('dark') ||
          (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const initial = isDark ? 'dark' : 'light';
        setThemeState(initial);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (_) {}
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem('theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
    } catch (_) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
      } catch (_) {}
      return next;
    });
  }, []);

  // Listen to cross-tab storage changes or other windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        if (e.newValue === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light' as Theme,
      resolvedTheme: 'light' as Theme,
      setTheme: (t: Theme) => {
        try {
          localStorage.setItem('theme', t);
          if (t === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (_) {}
      },
      toggleTheme: () => {
        try {
          const isDark = document.documentElement.classList.contains('dark');
          const next = isDark ? 'light' : 'dark';
          localStorage.setItem('theme', next);
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (_) {}
      },
      mounted: true,
    };
  }
  return context;
}
