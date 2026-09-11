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
  // Appearance
  theme: 'light' | 'dark';
  fontSize: number; // 12, 13, 14, 15, 16, 18
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
  theme: 'dark',
  fontSize: 14,
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
