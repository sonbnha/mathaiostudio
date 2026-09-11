import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight } from '@uiw/codemirror-theme-github';
import { eclipse } from '@uiw/codemirror-theme-eclipse';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { nord } from '@uiw/codemirror-theme-nord';
import { sublime } from '@uiw/codemirror-theme-sublime';

export interface EditorThemeOption {
  id: string;
  name: string;
  category: 'light' | 'dark';
}

export const EDITOR_THEMES: EditorThemeOption[] = [
  // Light
  { id: 'overleaf-light', name: 'Theme sáng chuẩn (Overleaf Light)', category: 'light' },
  { id: 'github-light', name: 'GitHub Light', category: 'light' },
  { id: 'eclipse', name: 'Eclipse', category: 'light' },
  // Dark
  { id: 'one-dark', name: 'One Dark (Mặc định)', category: 'dark' },
  { id: 'dracula', name: 'Dracula', category: 'dark' },
  { id: 'monokai', name: 'Monokai', category: 'dark' },
  { id: 'nord', name: 'Nord', category: 'dark' },
  { id: 'sublime', name: 'Sublime / Cobalt', category: 'dark' },
];

export const isDarkEditorTheme = (themeId: string): boolean => {
  const found = EDITOR_THEMES.find((t) => t.id === themeId);
  if (found) return found.category === 'dark';
  return themeId !== 'overleaf-light' && themeId !== 'github-light' && themeId !== 'eclipse';
};

export function getEditorThemeExtension(
  themeId: string = 'one-dark',
  isDarkOverall: boolean = true,
  fontFamily: string = 'JetBrains Mono',
  nonBlinkingCursor: boolean = false,
  lineHeight: string = '1.5'
): Extension[] {
  const effectiveThemeId = themeId || (isDarkOverall ? 'one-dark' : 'overleaf-light');
  const isDark = isDarkEditorTheme(effectiveThemeId);

  const fontStack =
    fontFamily === 'monospace'
      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      : `"${fontFamily}", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

  const baseTheme = EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: isDark ? '#020617' : '#ffffff',
      color: isDark ? '#cbd5e1' : '#1e293b',
    },
    '.cm-content': {
      fontFamily: fontStack,
      padding: '12px 0',
      caretColor: isDark ? '#22d3ee' : '#0284c7',
      lineHeight: lineHeight || '1.5',
    },
    '.cm-cursor': nonBlinkingCursor
      ? {
          animation: 'none !important',
        }
      : {},
    '.cm-gutters': {
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderRight: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      color: isDark ? '#64748b' : '#94a3b8',
      minWidth: '40px',
      fontFamily: fontStack,
    },
    '.cm-activeLineGutter': {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0 !important',
      color: isDark ? '#22d3ee' : '#0284c7',
    },
    '.cm-activeLine': {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9 !important',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: isDark ? 'rgba(22, 78, 99, 0.6) !important' : '#bae6fd !important',
    },
    '.cm-latex-error-line': {
      backgroundColor: 'rgba(239, 68, 68, 0.12) !important',
    },
  });

  // Map specific theme packages
  let themeExtension: Extension;
  switch (effectiveThemeId) {
    case 'github-light':
      themeExtension = githubLight;
      break;
    case 'eclipse':
      themeExtension = eclipse;
      break;
    case 'dracula':
      themeExtension = dracula;
      break;
    case 'monokai':
      themeExtension = monokai;
      break;
    case 'nord':
      themeExtension = nord;
      break;
    case 'sublime':
      themeExtension = sublime;
      break;
    case 'one-dark':
      themeExtension = oneDark;
      break;
    case 'overleaf-light':
    default:
      themeExtension = [];
      break;
  }

  return [baseTheme, themeExtension];
}
