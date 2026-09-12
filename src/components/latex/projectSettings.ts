'use client';

export interface ProjectSettings {
  // Editor
  autoCloseBrackets: boolean;
  autoComplete: boolean;
  nonBlinkingCursor: boolean;
  keybindings: 'standard' | 'vim';
  // Compiler
  mainDocument: string;
  compiler: 'xelatex' | 'pdflatex' | 'lualatex';
  autoCompile: boolean;
  draftMode?: boolean;
  stopOnError?: boolean;
  texLiveVersion?: string;
  // Appearance
  theme: 'light' | 'dark'; // Overall Theme
  overallTheme?: 'light' | 'dark';
  editorTheme: string; // 'dracula' | 'monokai' | 'one-dark' | 'github-light' | 'eclipse' | 'overleaf-light' | 'nord' | 'sublime'
  pdfInvertColors: boolean; // Dark mode PDF preview (invert canvas colors)
  fontSize: number; // 12, 14, 16, 18
  editorFontSize?: number;
  lineHeight: string; // '1.2' | '1.5' | '1.8'
  editorLineHeight?: string;
  fontFamily: string; // 'JetBrains Mono', 'Fira Code', 'monospace'
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  autoCloseBrackets: true,
  autoComplete: true,
  nonBlinkingCursor: false,
  keybindings: 'standard',
  mainDocument: 'main.tex',
  compiler: 'xelatex',
  autoCompile: false,
  draftMode: false,
  stopOnError: false,
  texLiveVersion: '2024',
  theme: 'dark',
  overallTheme: 'dark',
  editorTheme: 'one-dark',
  pdfInvertColors: false,
  fontSize: 14,
  editorFontSize: 14,
  lineHeight: '1.5',
  editorLineHeight: '1.5',
  fontFamily: 'JetBrains Mono',
};

const STORAGE_PREFIX = 'project_settings_';

export function loadProjectSettings(projectId?: string | null): ProjectSettings {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_SETTINGS;
  try {
    const key = `${STORAGE_PREFIX}${projectId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_PROJECT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROJECT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PROJECT_SETTINGS;
  }
}

export function saveProjectSettings(settings: ProjectSettings, projectId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}${projectId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
