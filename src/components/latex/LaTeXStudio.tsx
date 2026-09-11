'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Code2,
  Download,
  FileText,
  Loader2,
  Play,
  Save,
  WandSparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCode,
  Layers,
  Plus,
  Tv,
  Eye,
  Terminal,
  Sigma,
  Camera,
  FileDown,
  Upload,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Search,
  Type,
  Link as LinkIcon,
  Table,
  Columns,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  History,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
  Edit2,
  Files,
  Settings,
  HelpCircle,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  BookOpen,
  FileCheck,
  Shapes,
  Send,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import { useTheme } from '@/context/ThemeContext';
import type { StudioFile, StudioImage, RestorePoint } from '@/components/latex/StudioTools';
import FileTreeExplorer from '@/components/latex/FileTreeExplorer';
import ErrorConsole, { parseTeXLog } from '@/components/latex/ErrorConsole';
import MathSymbolsPopover from '@/components/latex/MathSymbolsPopover';
import AIAssistantDropdown from '@/components/latex/AIAssistantDropdown';
import { LATEX_TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplateById } from '@/components/latex/LaTeXTemplates';
import { getDocumentById, saveDocument, type LatexDocumentItem } from '@/lib/latexStorage';
import {
  getProjectById,
  saveProject,
  createNewProject,
  type ProjectItem,
} from '@/lib/storage/projectStore';

const TeXEditor = dynamic(() => import('@/components/latex/TeXEditor'), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-xs text-slate-500">Đang tải trình soạn thảo Monaco…</div>
  ),
});

const PDFPreview = dynamic(() => import('@/components/latex/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-xs text-slate-500">Đang tải trình xem PDF…</div>
  ),
});

const ribbonButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shrink-0';

export default function LaTeXStudio({
  docId,
  engineLabel = 'XeLaTeX Engine',
}: {
  docId?: string;
  engineLabel?: string;
}) {
  const router = useRouter();
  const defaultTpl = getTemplateById(DEFAULT_TEMPLATE_ID) || LATEX_TEMPLATES[0];

  // Document metadata & project state
  const [currentDocId, setCurrentDocId] = useState<string>(docId || '');
  const [docTitle, setDocTitle] = useState<string>('Tai_lieu_Toan_chua_dat_ten.tex');
  const [template, setTemplate] = useState<string>(defaultTpl.id);
  const [source, setSource] = useState<string>(defaultTpl.source);

  // Multi-file state
  const [activeFileName, setActiveFileName] = useState<string>('main.tex');
  const [openTabs, setOpenTabs] = useState<string[]>(['main.tex']);
  const [files, setFiles] = useState<StudioFile[]>([
    { name: 'main.tex', content: defaultTpl.source },
  ]);
  const [images, setImages] = useState<StudioImage[]>([]);
  const [history, setHistory] = useState<RestorePoint[]>([]);
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState<boolean>(false);

  // Popover state
  const [isSymbolsOpen, setIsSymbolsOpen] = useState(false);

  // Compiler state
  const [status, setStatus] = useState<'ready' | 'compiling' | 'success' | 'error'>('ready');
  const [errorLog, setErrorLog] = useState<string>('');
  const [pdf, setPdf] = useState<string | null>(null);
  const [compiledSource, setCompiledSource] = useState<string>('');
  const [zoom, setZoom] = useState<number | 'page-width'>('page-width');
  const [fontSize, setFontSize] = useState<number>(14);

  // Output view: 'pdf' or 'console'
  const [outputView, setOutputView] = useState<'pdf' | 'console'>('pdf');

  // SyncTeX & Tools state
  const [targetLine, setTargetLine] = useState<number | undefined>(defaultTpl.id === 'blank' ? 9 : undefined);
  const [cursorLine, setCursorLine] = useState<number>(9);
  const [highlightPage, setHighlightPage] = useState<number | undefined>(undefined);
  const [jumpToPage, setJumpToPage] = useState<number | undefined>(undefined);
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [insertRequest, setInsertRequest] = useState<{ id: number; text: string } | undefined>(undefined);
  const [editorActionRequest, setEditorActionRequest] = useState<{ id: number; action: string } | undefined>(undefined);
  const [isPresentation, setIsPresentation] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [storageNotice, setStorageNotice] = useState<string>('Tự động lưu');

  // Overleaf Layout & Ribbon Modes
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('code');
  const [reviewMode, setReviewMode] = useState<'editing' | 'reviewing'>('editing');
  const [layoutMode, setLayoutMode] = useState<'split' | 'code' | 'pdf'>('split');
  const [editorRatio, setEditorRatio] = useState<number>(0.5); // 0.25 to 0.75
  const [lastEditorRatio, setLastEditorRatio] = useState<number>(0.5);
  const splitRatio = editorRatio * 100;
  const [engine, setEngine] = useState<'xelatex' | 'pdflatex' | 'lualatex'>('xelatex');

  // AI & Async busy flags
  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [ocrBusy, setOcrBusy] = useState<boolean>(false);
  const [fixBusy, setFixBusy] = useState<boolean>(false);

  // File Inputs
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // Sidebar & Dual resizers state
  const [activeActivityTab, setActiveActivityTab] = useState<'files' | 'search' | 'ai'>('files');
  const [sidebarWidth, setSidebarWidth] = useState<number>(260); // 180px - 360px (0 when collapsed)
  const [lastSidebarWidth, setLastSidebarWidth] = useState<number>(260);
  const isSidebarOpen = sidebarWidth > 0;
  const setIsSidebarOpen = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setSidebarWidth((cur) => {
      const isCurrentlyOpen = cur > 0;
      const nextOpen = typeof open === 'function' ? open(isCurrentlyOpen) : open;
      if (nextOpen) {
        return lastSidebarWidth > 0 ? lastSidebarWidth : 260;
      } else {
        if (cur > 0) setLastSidebarWidth(cur);
        return 0;
      }
    });
  }, [lastSidebarWidth]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [resizingTarget, setResizingTarget] = useState<'sidebar' | 'editor-pdf' | null>(null);
  const isResizing = Boolean(resizingTarget);
  const resizingTargetRef = useRef<'sidebar' | 'editor-pdf' | null>(null);
  const monacoEditorRef = useRef<any>(null);
  const mainContainerRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const pdfSectionRef = useRef<HTMLElement>(null);
  const [pdfWidth, setPdfWidth] = useState<number>(600);

  // Search & Replace within Primary Sidebar
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');

  const searchMatches = useMemo(() => {
    if (!searchQuery) return [];
    const lines = source.split('\n');
    const results: Array<{ line: number; text: string }> = [];
    try {
      let pattern: RegExp;
      if (useRegex) {
        pattern = new RegExp(searchQuery, matchCase ? 'g' : 'gi');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBound = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBound, matchCase ? 'g' : 'gi');
      }
      lines.forEach((lineText, idx) => {
        if (pattern.test(lineText)) {
          results.push({ line: idx + 1, text: lineText });
        }
      });
    } catch {
      // Regex parsing error fallback
    }
    return results;
  }, [source, searchQuery, matchCase, wholeWord, useRegex]);

  const handleReplaceNext = () => {
    if (!searchQuery) return;
    try {
      let pattern: RegExp;
      if (useRegex) {
        pattern = new RegExp(searchQuery, matchCase ? '' : 'i');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBound = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBound, matchCase ? '' : 'i');
      }
      const newSource = source.replace(pattern, replaceQuery);
      setSource(newSource);
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFileName ? { ...f, content: newSource } : f))
      );
    } catch (err) {
      console.error('Replace error:', err);
    }
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    try {
      let pattern: RegExp;
      if (useRegex) {
        pattern = new RegExp(searchQuery, matchCase ? 'g' : 'gi');
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBound = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBound, matchCase ? 'g' : 'gi');
      }
      const newSource = source.replace(pattern, replaceQuery);
      setSource(newSource);
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFileName ? { ...f, content: newSource } : f))
      );
    } catch (err) {
      console.error('Replace all error:', err);
    }
  };

  const handleActivityTabClick = (tab: 'files' | 'search' | 'ai') => {
    if (sidebarWidth > 0 && activeActivityTab === tab) {
      setLastSidebarWidth(sidebarWidth);
      setSidebarWidth(0);
    } else {
      setActiveActivityTab(tab);
      if (sidebarWidth <= 0) {
        setSidebarWidth(lastSidebarWidth > 0 ? lastSidebarWidth : 260);
      }
    }
  };

  // Measure PDF panel width for responsive toolbar
  useEffect(() => {
    const el = pdfSectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      if (entries[0]) {
        setPdfWidth(entries[0].contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Topbar and utility state
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(docTitle);
  const [activeDesktopMenu, setActiveDesktopMenu] = useState<'file' | 'edit' | 'insert' | 'view' | 'format' | 'help' | null>(null);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  // Sync titleInput when docTitle changes
  useEffect(() => {
    setTitleInput(docTitle);
  }, [docTitle]);

  // Close popover menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (activeDesktopMenu && desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setActiveDesktopMenu(null);
      }
      if (isLayoutMenuOpen && layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setIsLayoutMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeDesktopMenu, isLayoutMenuOpen]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Initial load
  useEffect(() => {
    if (docId) {
      const proj = getProjectById(docId);
      const stored = getDocumentById(docId);

      if (proj) {
        setCurrentDocId(proj.id);
        setDocTitle(proj.title);
        const tplId = proj.metadata?.templateId || stored?.templateId || DEFAULT_TEMPLATE_ID;
        setTemplate(tplId);
        const src = proj.content || stored?.source || getTemplateById(tplId)?.source || defaultTpl.source;
        setSource(src);
        const initialFiles =
          proj.files && proj.files.length > 0
            ? (proj.files as StudioFile[])
            : stored?.files && stored.files.length > 0
            ? stored.files
            : [{ name: 'main.tex', content: src }];
        setFiles(initialFiles);
        setOpenTabs(['main.tex']);
        setActiveFileName('main.tex');
        setImages(stored?.images || []);
        setHistory(stored?.history || []);
        setStorageNotice('Đã tải từ dự án');
      } else if (stored) {
        setCurrentDocId(stored.id);
        setDocTitle(stored.title);
        setTemplate(stored.templateId);
        setSource(stored.source);
        const initialFiles =
          stored.files && stored.files.length > 0
            ? stored.files
            : [{ name: 'main.tex', content: stored.source }];
        setFiles(initialFiles);
        setOpenTabs(['main.tex']);
        setActiveFileName('main.tex');
        setImages(stored?.images || []);
        setHistory(stored?.history || []);
        setStorageNotice('Đã tải từ kho lưu trữ');
      } else {
        setCurrentDocId(docId);
        setStorageNotice('Bản nháp mới');
      }
    } else {
      const newDoc = createNewProject(
        'latex',
        `Tai_lieu_Toan_${new Date().toISOString().slice(0, 10)}.tex`,
        {
          templateId: defaultTpl.id,
          badge: defaultTpl.badge || 'XeLaTeX',
        },
        defaultTpl.source
      );

      setCurrentDocId(newDoc.id);
      setDocTitle(newDoc.title);
      setTemplate(defaultTpl.id);
      setSource(defaultTpl.source);
      setFiles([{ name: 'main.tex', content: defaultTpl.source }]);
      setOpenTabs(['main.tex']);
      setActiveFileName('main.tex');
      setStorageNotice('Đã tạo bản nháp mới');
      if (defaultTpl.id === 'blank') {
        setTargetLine(9);
      }

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/latex?id=${encodeURIComponent(newDoc.id)}`);
      }
    }
  }, [docId]);

  // Debounced Auto-save (2 seconds)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentDocId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const itemToSave: ProjectItem = {
          id: currentDocId,
          title: docTitle,
          type: 'latex',
          updatedAt: Date.now(),
          createdAt: Date.now(),
          isStarred: false,
          metadata: {
            templateId: template,
            badge: getTemplateById(template)?.badge || 'XeLaTeX',
            previewSnippet: source.slice(0, 120),
          },
          content: source,
          files,
        };
        saveProject(itemToSave);

        const docItem: LatexDocumentItem = {
          id: currentDocId,
          title: docTitle,
          templateId: template,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          source,
          files,
          images,
          history,
        };
        saveDocument(docItem);
        setStorageNotice(`Đã lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`);
      } catch {
        // quota
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [source, docTitle, template, files, activeFileName, images, history, currentDocId]);

  // Insert helper
  const handleInsert = useCallback((text: string) => {
    setInsertRequest({ id: Date.now(), text });
  }, []);

  // Trigger Ribbon action
  const triggerEditorAction = (action: string) => {
    setEditorActionRequest({ id: Date.now(), action });
  };

  // Compile LaTeX to PDF
  const compile = useCallback(
    async (sourceToCompile?: string) => {
      let code = sourceToCompile;
      if (!code) {
        const mainFile = files.find((f) => f.name === 'main.tex');
        code = activeFileName === 'main.tex' ? source : mainFile?.content || source;
      }

      if (!code?.trim()) return;

      console.log('=== PAYLOAD GUI DI ===', code);
      setStatus('compiling');
      setErrorLog('');

      try {
        const res = await fetch('/api/latex/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: code, compiler: engine }),
        });

        if (!res.ok) {
          let errData: any = {};
          try {
            errData = await res.json();
          } catch {
            errData = { error: 'Lỗi máy chủ biên dịch.' };
          }
          const errorLogMessage = errData.log || errData.error || 'Biên dịch thất bại.';
          console.log('=== RAW LATEX LOG ===', errorLogMessage);
          throw new Error(errorLogMessage);
        }

        const blob = await res.blob();
        if (pdf) URL.revokeObjectURL(pdf);
        const url = URL.createObjectURL(blob);
        setPdf(url);
        setCompiledSource(code);
        setStatus('success');
        setOutputView('pdf');

        setHistory((prev) => [
          ...prev,
          { at: Date.now(), source: code!, label: 'Biên dịch thành công' },
        ]);
      } catch (err: any) {
        setStatus('error');
        const rawLog = err.message || 'Lỗi không xác định khi biên dịch.';
        console.log('=== RAW LATEX LOG ===', rawLog);
        setErrorLog(rawLog);
        setOutputView('console');
      }
    },
    [source, files, activeFileName, pdf, engine]
  );

  // 1-Click AI Auto-Fix
  const handleAIFix = async () => {
    if (!errorLog) {
      alert('Chưa phát hiện lỗi biên dịch để sửa.');
      return;
    }
    setFixBusy(true);
    try {
      const res = await fetch('/api/latex/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, errorLog }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI không thể sửa mã.');

      if (data.fixedSource) {
        setSource(data.fixedSource);
        setFiles((prev) =>
          prev.map((f) => (f.name === activeFileName ? { ...f, content: data.fixedSource } : f))
        );
        void compile(data.fixedSource);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối AI Fix.');
    } finally {
      setFixBusy(false);
    }
  };

  // AI Assistant Action
  const handleAI = async (action: string, customPrompt?: string) => {
    setAiBusy(true);
    try {
      const res = await fetch('/api/latex/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, customPrompt, currentSource: source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Assistant gặp lỗi.');

      if (data.generatedLatex) {
        handleInsert('\n' + data.generatedLatex + '\n');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối AI Assistant.');
    } finally {
      setAiBusy(false);
    }
  };

  // OCR Upload
  const handleOCR = async (file: File) => {
    setOcrBusy(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/latex/ocr', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR thất bại.');

      if (data.latex) {
        handleInsert('\n' + data.latex + '\n');
      }
    } catch (err: any) {
      alert(err.message || 'Không thể nhận diện công thức từ ảnh.');
    } finally {
      setOcrBusy(false);
    }
  };

  // Import Word .docx
  const handleImportWord = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/latex/word', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chuyển đổi Word thất bại.');

      if (data.latex) {
        setSource(data.latex);
        setFiles((prev) =>
          prev.map((f) => (f.name === activeFileName ? { ...f, content: data.latex } : f))
        );
        void compile(data.latex);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nhập tệp Word.');
    }
  };

  // Export Word .docx
  const handleExportWord = async () => {
    try {
      const res = await fetch('/api/latex/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, title: docTitle }),
      });
      if (!res.ok) throw new Error('Xuất Word thất bại.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.replace(/\.tex$/, '')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất Word.');
    }
  };

  // Export .tex
  const exportTex = () => {
    const blob = new Blob([source], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docTitle;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Multi-file management
  const handleSelectFile = (fileName: string) => {
    const targetFile = files.find((f) => f.name === fileName);
    if (!targetFile) return;

    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: source } : f))
    );

    setActiveFileName(fileName);
    setSource(targetFile.content);

    if (!openTabs.includes(fileName)) {
      setOpenTabs((prev) => [...prev, fileName]);
    }
  };

  const handleCreateFile = (newFileName: string) => {
    if (files.some((f) => f.name === newFileName)) return;
    const newFile: StudioFile = {
      name: newFileName,
      content: `% Tệp con: ${newFileName}\n% Được nhúng bằng: \\input{${newFileName}}\n`,
    };
    setFiles((prev) => [...prev, newFile]);
    setOpenTabs((prev) => [...prev, newFileName]);
    handleSelectFile(newFileName);
  };

  const handleDeleteFile = (fileName: string) => {
    if (fileName === 'main.tex') {
      alert('Không thể xóa tệp chính main.tex');
      return;
    }
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setOpenTabs((prev) => prev.filter((t) => t !== fileName));
    if (activeFileName === fileName) {
      handleSelectFile('main.tex');
    }
  };

  const handleRenameFile = (oldName: string, newName: string) => {
    if (oldName === 'main.tex') {
      alert('Không thể đổi tên tệp chính main.tex');
      return;
    }
    setFiles((prev) =>
      prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f))
    );
    setOpenTabs((prev) => prev.map((t) => (t === oldName ? newName : t)));
    if (activeFileName === oldName) {
      setActiveFileName(newName);
    }
  };

  const handleCloseTab = (tabName: string) => {
    const nextTabs = openTabs.filter((t) => t !== tabName);
    if (nextTabs.length === 0) {
      setOpenTabs(['main.tex']);
      handleSelectFile('main.tex');
      return;
    }
    setOpenTabs(nextTabs);
    if (activeFileName === tabName) {
      handleSelectFile(nextTabs[nextTabs.length - 1]);
    }
  };

  const handleUploadAsset = async (file: File) => {
    if (file.name.endsWith('.tex')) {
      const text = await file.text();
      const newFile: StudioFile = { name: file.name, content: text };
      setFiles((prev) => [...prev.filter((f) => f.name !== file.name), newFile]);
      handleSelectFile(file.name);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImages((prev) => [...prev, { name: file.name, dataUrl }]);
        handleInsert(`\n\\includegraphics[width=0.7\\linewidth]{${file.name}}\n`);
      };
      reader.readAsDataURL(file);
    }
  };

  // SyncTeX Handlers
  const handleSyncPDFToCode = (page: number, ratio: number) => {
    const lines = source.split('\n');
    const estimatedTotalPages = Math.max(1, pdfTotalPages || Math.ceil(lines.length / 45));
    const linesPerPage = Math.ceil(lines.length / estimatedTotalPages);
    const line = Math.min(lines.length, Math.max(1, Math.round((page - 1) * linesPerPage + ratio * linesPerPage)));
    setTargetLine(line);
    setCursorLine(line);
  };

  const handleSyncCodeToPDF = (lineNumber: number) => {
    setCursorLine(lineNumber);
    const lines = source.split('\n');
    const estimatedTotalPages = Math.max(1, pdfTotalPages || Math.ceil(lines.length / 45));
    const linesPerPage = Math.ceil(lines.length / estimatedTotalPages);
    const page = Math.min(estimatedTotalPages, Math.max(1, Math.ceil(lineNumber / linesPerPage)));
    setHighlightPage(page);
    setPdfCurrentPage(page);
    setJumpToPage(page);
  };

  // Resizer 1: Left Sidebar Divider (60px - 450px, offset by Activity Bar 44px, Snap below 20px)
  const handleMouseDownSidebarDivider = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingTargetRef.current = 'sidebar';
    setResizingTarget('sidebar');
    const activityBarWidth = 44; // w-11 = 44px

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (resizingTargetRef.current !== 'sidebar') return;
      const rawWidth = moveEvent.clientX - activityBarWidth;
      if (rawWidth < 20) {
        setSidebarWidth(0);
      } else {
        const clampedWidth = Math.min(450, Math.max(60, rawWidth));
        setSidebarWidth(clampedWidth);
        setLastSidebarWidth(clampedWidth);
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      resizingTargetRef.current = null;
      setResizingTarget(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const rawWidth = upEvent.clientX - activityBarWidth;
      if (rawWidth < 20) {
        setSidebarWidth(0);
      }

      // Trigger Monaco Editor layout update
      monacoEditorRef.current?.layout();
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Resizer 2: Editor & PDF Preview Split Divider (allows down to 60px, Snap PDF if < 20px from right)
  const handleMouseDownEditorPdfDivider = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingTargetRef.current = 'editor-pdf';
    setResizingTarget('editor-pdf');

    const wsEl = workspaceRef.current;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (resizingTargetRef.current !== 'editor-pdf') return;
      if (!wsEl) return;
      const wsRect = wsEl.getBoundingClientRect();
      const distFromRight = wsRect.right - moveEvent.clientX;

      if (distFromRight < 20) {
        // Snap PDF to 0 and expand Editor 100%
        setLayoutMode('code');
      } else {
        const wsWidth = wsRect.width;
        if (wsWidth <= 0) return;

        setLayoutMode('split');
        const relativeX = moveEvent.clientX - wsRect.left;
        let newRatio = relativeX / wsWidth;

        // Allow natural shrink down to 60px for both Editor and PDF before snap
        const minRatio = 60 / wsWidth;
        const maxRatio = 1 - 60 / wsWidth;
        if (minRatio < maxRatio) {
          newRatio = Math.min(maxRatio, Math.max(minRatio, newRatio));
        }

        setEditorRatio(newRatio);
        setLastEditorRatio(newRatio);
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      resizingTargetRef.current = null;
      setResizingTarget(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (wsEl) {
        const wsRect = wsEl.getBoundingClientRect();
        const distFromRight = wsRect.right - upEvent.clientX;
        if (distFromRight < 20) {
          setLayoutMode('code');
        }
      }

      // Trigger editor.layout() of Monaco Editor to adapt immediately to new size
      monacoEditorRef.current?.layout();
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const { errors, warnings } = parseTeXLog(errorLog);

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Overleaf Single Desktop Topbar (h-10) */}
      <header className="h-10 px-2.5 bg-[#1e2124] border-b border-[#2d3136] flex items-center justify-between gap-2 shrink-0 z-30 select-none text-xs text-slate-200">
        {/* Left Side: Brand Logo + Desktop Dropdown Menus */}
        <div className="flex items-center gap-1 min-w-0" ref={desktopMenuRef}>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-white hover:text-emerald-400 font-bold text-xs tracking-tight transition shrink-0 mr-1.5"
            title="Về trang chủ MathAIO Studio"
          >
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-white font-serif font-black text-xs shadow-xs">
              T
            </div>
            <span className="hidden lg:inline font-semibold">LaTeX Studio</span>
          </Link>

          {/* Desktop Dropdown Menus: File, Edit, Insert, View, Format, Help */}
          <div className="flex items-center gap-0.5 text-neutral-300 text-xs">
            {/* FILE MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDesktopMenu(activeDesktopMenu === 'file' ? null : 'file')}
                onMouseEnter={() => {
                  if (activeDesktopMenu) setActiveDesktopMenu('file');
                }}
                className={`px-2 py-1 rounded-sm transition cursor-pointer text-xs font-normal ${
                  activeDesktopMenu === 'file'
                    ? 'bg-[#2a2e33] text-white'
                    : 'hover:bg-[#2a2e33] hover:text-white'
                }`}
              >
                Tệp
              </button>

              {activeDesktopMenu === 'file' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e2226] border border-white/10 rounded shadow-xl py-1 text-[13px] text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      const name = prompt('Nhập tên tệp LaTeX mới (vd: baitap.tex):');
                      if (name) handleCreateFile(name);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tệp mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      const folderName = prompt('Nhập tên thư mục mới (vd: figures, sections):');
                      if (folderName) handleCreateFile(`${folderName}/main.tex`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Thư mục mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.tex,.png,.jpg,.jpeg,.pdf,.svg,.bib,.cls,.sty';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type.startsWith('image/')) {
                            handleUploadAsset(file);
                          } else {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const content = String(reader.result || '');
                              const newFiles = [...files, { name: file.name, content }];
                              setFiles(newFiles);
                              setActiveFileName(file.name);
                              setSource(content);
                              if (!openTabs.includes(file.name)) {
                                setOpenTabs([...openTabs, file.name]);
                              }
                            };
                            reader.readAsText(file);
                          }
                        }
                      };
                      input.click();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tải lên tệp</span>
                  </button>

                  <button
                    type="button"
                    disabled={ocrBusy}
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      ocrInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span>{ocrBusy ? 'Đang nhận diện OCR…' : 'Nhận diện công thức từ ảnh (OCR)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      wordInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Nhập từ Word (.docx)</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      const newName = `${docTitle.replace(/\.tex$/, '')}_copy.tex`;
                      setDocTitle(newName);
                      setStorageNotice('Đã nhân bản tài liệu');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tạo bản sao</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsHistoryOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Lịch sử phiên bản</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      const words = source.trim().split(/\s+/).filter(Boolean).length;
                      const chars = source.length;
                      const lines = source.split('\n').length;
                      alert(`Thống kê tài liệu:\n- Số từ: ${words.toLocaleString()}\n- Số ký tự: ${chars.toLocaleString()}\n- Số dòng: ${lines.toLocaleString()}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Thống kê từ</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsShareModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Nộp bài / Xuất bản</span>
                  </button>

                  {pdf && (
                    <a
                      href={pdf}
                      download={`${docTitle.replace(/\.tex$/, '')}.pdf`}
                      onClick={() => setActiveDesktopMenu(null)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                    >
                      <span>Tải xuống PDF</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      exportTex();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tải xuống mã nguồn (.tex)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleExportWord();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tải xuống Word (.docx)</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Cài đặt</span>
                  </button>
                </div>
              )}
            </div>

            {/* EDIT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDesktopMenu(activeDesktopMenu === 'edit' ? null : 'edit')}
                onMouseEnter={() => {
                  if (activeDesktopMenu) setActiveDesktopMenu('edit');
                }}
                className={`px-2 py-1 rounded-sm transition cursor-pointer text-xs font-normal ${
                  activeDesktopMenu === 'edit'
                    ? 'bg-[#2a2e33] text-white'
                    : 'hover:bg-[#2a2e33] hover:text-white'
                }`}
              >
                Chỉnh sửa
              </button>

              {activeDesktopMenu === 'edit' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e2226] border border-white/10 rounded shadow-xl py-1 text-[13px] text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('undo');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Hoàn tác</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ctrl+Z</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('redo');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Làm lại</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ctrl+Y</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('find');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tìm kiếm & Thay thế</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ctrl+F</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('select-all');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Chọn tất cả</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ctrl+A</span>
                  </button>
                </div>
              )}
            </div>

            {/* INSERT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDesktopMenu(activeDesktopMenu === 'insert' ? null : 'insert')}
                onMouseEnter={() => {
                  if (activeDesktopMenu) setActiveDesktopMenu('insert');
                }}
                className={`px-2 py-1 rounded-sm transition cursor-pointer text-xs font-normal ${
                  activeDesktopMenu === 'insert'
                    ? 'bg-[#2a2e33] text-white'
                    : 'hover:bg-[#2a2e33] hover:text-white'
                }`}
              >
                Chèn
              </button>

              {activeDesktopMenu === 'insert' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e2226] border border-white/10 rounded shadow-xl py-1 text-[13px] text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsSymbolsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Ký hiệu toán học</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ω</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert(' $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ ');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Công thức toán</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ctrl+M</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.7\\linewidth]{example-image}\n  \\caption{Caption}\n  \\label{fig:sample}\n\\end{figure}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Hình ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('table');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Bảng biểu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\\cite{key}');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Trích dẫn</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\cite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('link');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Liên kết</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\href</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\\ref{sec:label}');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tham chiếu chéo</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\ref</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('% ');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Ghi chú</span>
                    <span className="text-neutral-500 font-mono text-[11px]">%</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\begin{abstract}\n  \n\\end{abstract}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tóm tắt (Abstract)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\textbf{Keywords:} LaTeX, MathAIO.\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Từ khóa (Keywords)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\title{Tiêu đề tài liệu}\n\\author{Tác giả}\n\\date{\\today}\n\\maketitle\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tiêu đề (Title)</span>
                  </button>
                </div>
              )}
            </div>

            {/* VIEW MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDesktopMenu(activeDesktopMenu === 'view' ? null : 'view')}
                onMouseEnter={() => {
                  if (activeDesktopMenu) setActiveDesktopMenu('view');
                }}
                className={`px-2 py-1 rounded-sm transition cursor-pointer text-xs font-normal ${
                  activeDesktopMenu === 'view'
                    ? 'bg-[#2a2e33] text-white'
                    : 'hover:bg-[#2a2e33] hover:text-white'
                }`}
              >
                Hiển thị
              </button>

              {activeDesktopMenu === 'view' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e2226] border border-white/10 rounded shadow-xl py-1 text-[13px] text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setLayoutMode('split');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={layoutMode === 'split' ? 'text-white font-medium' : ''}>Chế độ chia đôi</span>
                    {layoutMode === 'split' && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLayoutMode('code');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={layoutMode === 'code' ? 'text-white font-medium' : ''}>Chỉ trình soạn thảo</span>
                    {layoutMode === 'code' && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLayoutMode('pdf');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={layoutMode === 'pdf' ? 'text-white font-medium' : ''}>Chỉ xem PDF</span>
                    {layoutMode === 'pdf' && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    disabled={!pdf}
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      if (pdf) window.open(pdf, '_blank');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span>Mở PDF trong tab mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      toggleFullscreen();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Chế độ tập trung</span>
                    {isFullscreen && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('code');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={editorMode === 'code' ? 'text-white font-medium' : ''}>Chế độ mã nguồn</span>
                    {editorMode === 'code' && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('visual');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={editorMode === 'visual' ? 'text-white font-medium' : ''}>Chế độ trực quan (Visual)</span>
                    {editorMode === 'visual' && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen((prev) => !prev);
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={isSidebarOpen ? 'text-white font-medium' : ''}>Hiện cây thư mục</span>
                    {isSidebarOpen && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    disabled={!pdf}
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsPresentation(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span>Chế độ trình chiếu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Giao diện tối</span>
                    {isDark && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* FORMAT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDesktopMenu(activeDesktopMenu === 'format' ? null : 'format')}
                onMouseEnter={() => {
                  if (activeDesktopMenu) setActiveDesktopMenu('format');
                }}
                className={`px-2 py-1 rounded-sm transition cursor-pointer text-xs font-normal ${
                  activeDesktopMenu === 'format'
                    ? 'bg-[#2a2e33] text-white'
                    : 'hover:bg-[#2a2e33] hover:text-white'
                }`}
              >
                Định dạng
              </button>

              {activeDesktopMenu === 'format' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e2226] border border-white/10 rounded shadow-xl py-1 text-[13px] text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('bold');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>In đậm</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ctrl+B</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      triggerEditorAction('italic');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>In nghiêng</span>
                    <span className="text-neutral-500 font-mono text-[11px]">Ctrl+I</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\\underline{text}');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Gạch chân</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\underline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\\texttt{code}');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Font máy đánh chữ</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\texttt</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\begin{itemize}\n  \\item \n\\end{itemize}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Danh sách dấu chấm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\begin{enumerate}\n  \\item \n\\end{enumerate}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Danh sách đánh số</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\section{Tiêu đề Section}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Mục chính (Section)</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\section</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\subsection{Tiêu đề Subsection}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Mục con (Subsection)</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\subsection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\subsubsection{Tiêu đề Subsubsection}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Mục con cấp 2 (Subsubsection)</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\subsubsection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\paragraph{Đoạn văn:}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Đoạn văn (Paragraph)</span>
                    <span className="text-neutral-500 font-mono text-[11px]">\\paragraph</span>
                  </button>
                </div>
              )}
            </div>

            {/* HELP MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDesktopMenu(activeDesktopMenu === 'help' ? null : 'help')}
                onMouseEnter={() => {
                  if (activeDesktopMenu) setActiveDesktopMenu('help');
                }}
                className={`px-2 py-1 rounded-sm transition cursor-pointer text-xs font-normal ${
                  activeDesktopMenu === 'help'
                    ? 'bg-[#2a2e33] text-white'
                    : 'hover:bg-[#2a2e33] hover:text-white'
                }`}
              >
                Trợ giúp
              </button>

              {activeDesktopMenu === 'help' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e2226] border border-white/10 rounded shadow-xl py-1 text-[13px] text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsShortcutsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Phím tắt bàn phím</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      window.open('https://www.overleaf.com/learn', '_blank');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tài liệu hướng dẫn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Cài đặt</span>
                  </button>

                  <div className="border-b border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      window.open('/', '_blank');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-neutral-300 hover:bg-[#2c3238] hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Giới thiệu MathAIO Studio</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hidden file inputs for OCR and Word */}
          <input
            ref={ocrInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleOCR(f);
              e.target.value = '';
            }}
          />
          <input
            ref={wordInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportWord(f);
              e.target.value = '';
            }}
          />
        </div>

        {/* Center Side: Document Title (Click-to-rename) & Autosave Status */}
        <div className="flex items-center gap-2 min-w-0 max-w-[38%] justify-center">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={() => {
                const clean = titleInput.trim();
                if (clean) setDocTitle(clean.endsWith('.tex') ? clean : `${clean}.tex`);
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const clean = titleInput.trim();
                  if (clean) setDocTitle(clean.endsWith('.tex') ? clean : `${clean}.tex`);
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setTitleInput(docTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-[#2a2e33] text-white border border-emerald-500 rounded px-2 py-0.5 text-xs font-semibold outline-none text-center truncate max-w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleInput(docTitle);
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#2a2e33] transition truncate max-w-full cursor-pointer group"
              title="Bấm để đổi tên tài liệu"
            >
              <span className="truncate">{docTitle}</span>
              <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 shrink-0 opacity-60 group-hover:opacity-100 transition" />
            </button>
          )}

          <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400 shrink-0 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{storageNotice || 'Tự động lưu'}</span>
          </span>
        </div>

        {/* Right Side: History, Layout, Share, Theme Toggle, Fullscreen Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {/* History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#2a2e33] transition cursor-pointer"
            title="Lịch sử phiên bản (History)"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Layout Dropdown */}
          <div className="relative" ref={layoutMenuRef}>
            <button
              type="button"
              onClick={() => setIsLayoutMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#2a2e33] transition cursor-pointer"
              title="Bố cục hiển thị (Layout)"
            >
              <Columns className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Layout</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isLayoutMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#1e2124] border border-[#3e444b] rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in duration-100 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('code');
                    setIsLayoutMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition cursor-pointer ${
                    layoutMode === 'code' ? 'bg-[#2a2e33] text-emerald-400 font-semibold' : 'text-neutral-300 hover:bg-[#2a2e33] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Chỉ Code</span>
                  </div>
                  {layoutMode === 'code' && <span className="text-[10px]">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('split');
                    setIsLayoutMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition cursor-pointer ${
                    layoutMode === 'split' ? 'bg-[#2a2e33] text-emerald-400 font-semibold' : 'text-neutral-300 hover:bg-[#2a2e33] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Columns className="w-3.5 h-3.5" />
                    <span>Code + PDF</span>
                  </div>
                  {layoutMode === 'split' && <span className="text-[10px]">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('pdf');
                    setIsLayoutMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition cursor-pointer ${
                    layoutMode === 'pdf' ? 'bg-[#2a2e33] text-emerald-400 font-semibold' : 'text-neutral-300 hover:bg-[#2a2e33] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Chỉ PDF</span>
                  </div>
                  {layoutMode === 'pdf' && <span className="text-[10px]">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Share / Xuất bản Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2a2e33] hover:bg-[#343a40] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
            title="Chia sẻ & Xuất bản"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất bản</span>
          </button>

          <span className="h-3.5 w-px bg-[#2d3136] mx-0.5" />

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-[#2a2e33] transition cursor-pointer"
            title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-[#2a2e33] transition cursor-pointer"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>
        </div>
      </header>

      {/* 3. Main Overleaf Authentic Workspace */}
      <main
        ref={mainContainerRef}
        className="relative z-10 flex flex-row w-full h-[calc(100vh-40px)] overflow-hidden"
      >
        {/* VERTICAL ACTIVITY BAR (Outer Left, w-11 / 44px) */}
        <aside
          aria-label="Thanh điều hướng Activity Bar"
          className="w-11 h-full bg-[#181a1d] border-r border-white/10 flex-shrink-0 flex flex-col justify-between items-center py-2.5 z-30 select-none"
        >
          {/* Top Group: Files, Search, AI Assistant */}
          <div className="flex flex-col items-center gap-2 w-full">
            {/* File button */}
            <button
              type="button"
              onClick={() => handleActivityTabClick('files')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center ${
                isSidebarOpen && activeActivityTab === 'files'
                  ? 'text-white bg-white/10 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="Tệp & Dàn ý tài liệu (Files & Outline)"
            >
              {isSidebarOpen && activeActivityTab === 'files' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
              )}
              <Files className="w-4.5 h-4.5" />
            </button>

            {/* Search button */}
            <button
              type="button"
              onClick={() => handleActivityTabClick('search')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center ${
                isSidebarOpen && activeActivityTab === 'search'
                  ? 'text-white bg-white/10 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="Tìm kiếm & Thay thế toàn dự án (Search)"
            >
              {isSidebarOpen && activeActivityTab === 'search' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
              )}
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* AI Assistant button */}
            <button
              type="button"
              onClick={() => handleActivityTabClick('ai')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center ${
                isSidebarOpen && activeActivityTab === 'ai'
                  ? 'text-indigo-400 bg-white/10 shadow-xs'
                  : 'text-indigo-400/80 hover:text-indigo-300 hover:bg-white/5'
              }`}
              title="Trợ lý AI soạn thảo & sửa lỗi"
            >
              {isSidebarOpen && activeActivityTab === 'ai' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
              )}
              {aiBusy ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400" />
              ) : (
                <Sparkles className="w-4.5 h-4.5" />
              )}
            </button>
          </div>

          {/* Bottom Group: Settings, Shortcuts/Help */}
          <div className="flex flex-col items-center gap-2 w-full">
            {/* Settings button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  isSettingsOpen
                    ? 'text-white bg-white/10'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
                title="Cài đặt biên dịch & cỡ chữ"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>

              {isSettingsOpen && (
                <div className="absolute left-full bottom-0 ml-2 w-64 bg-[#1e2124] border border-[#3e444b] rounded-xl shadow-2xl p-3 z-50 text-xs text-slate-200 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 font-bold">
                    <span>Cài đặt trình soạn thảo</span>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-[11px]">
                    <div>
                      <label className="text-slate-400 block mb-1">Trình biên dịch:</label>
                      <select
                        value={engine}
                        onChange={(e) => setEngine(e.target.value as any)}
                        className="w-full bg-[#2a2e33] border border-white/10 rounded px-2 py-1 outline-none text-white cursor-pointer"
                      >
                        <option value="xelatex">XeLaTeX (Khuyên dùng - Chuẩn tiếng Việt)</option>
                        <option value="pdflatex">pdfLaTeX (Biên dịch nhanh)</option>
                        <option value="lualatex">LuaLaTeX</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Cỡ chữ soạn thảo:</label>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full bg-[#2a2e33] border border-white/10 rounded px-2 py-1 outline-none text-white cursor-pointer"
                      >
                        {[12, 13, 14, 15, 16, 18, 20].map((s) => (
                          <option key={s} value={s}>{s}px</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help / Shortcuts button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsShortcutsOpen((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  isShortcutsOpen
                    ? 'text-white bg-white/10'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
                title="Phím tắt thao tác & Trợ giúp"
              >
                <HelpCircle className="w-4.5 h-4.5" />
              </button>

              {isShortcutsOpen && (
                <div className="absolute left-full bottom-0 ml-2 w-72 bg-[#1e2124] border border-[#3e444b] rounded-xl shadow-2xl p-3.5 z-50 text-xs text-slate-200 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 font-bold">
                    <span>Phím tắt thao tác nhanh</span>
                    <button
                      type="button"
                      onClick={() => setIsShortcutsOpen(false)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Biên dịch mã (Recompile)</span>
                      <kbd className="px-1.5 py-0.5 bg-[#2a2e33] rounded text-emerald-400 font-mono text-[10px]">Ctrl + Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Tìm kiếm & Thay thế</span>
                      <kbd className="px-1.5 py-0.5 bg-[#2a2e33] rounded text-slate-300 font-mono text-[10px]">Ctrl + F</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Hoàn tác / Làm lại</span>
                      <kbd className="px-1.5 py-0.5 bg-[#2a2e33] rounded text-slate-300 font-mono text-[10px]">Ctrl + Z / Y</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">In đậm / In nghiêng</span>
                      <kbd className="px-1.5 py-0.5 bg-[#2a2e33] rounded text-slate-300 font-mono text-[10px]">Ctrl + B / I</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Đồng bộ SyncTeX</span>
                      <span className="text-cyan-400 font-mono text-[10px]">Cụm nút giữa 2 cột</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* COLUMN 1: UNIFIED PRIMARY SIDEBAR (Files | Search | AI) */}
        {isSidebarOpen && (
          <div
            style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}
            className="file-tree-sidebar h-full overflow-hidden border-r border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col flex-shrink-0 shrink-0 bg-white dark:bg-[#1e2124]"
          >
            {activeActivityTab === 'files' && (
              <FileTreeExplorer
                files={files}
                activeFileName={activeFileName}
                source={source}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onUploadAsset={handleUploadAsset}
                onJumpToLine={(line) => setTargetLine(line)}
                isCollapsed={false}
                onToggleCollapse={() => setIsSidebarOpen(false)}
              />
            )}

            {activeActivityTab === 'search' && (
              <div className="h-full flex flex-col overflow-hidden text-xs select-none">
                {/* Search Header */}
                <div className="flex items-center justify-between px-2.5 py-2 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0 font-semibold text-[11px] uppercase tracking-wider text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-cyan-500" />
                    <span>TÌM KIẾM TOÀN DỰ ÁN</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                    title="Thu gọn"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search Inputs Form */}
                <div className="p-2 space-y-2 border-b border-slate-200 dark:border-white/10 shrink-0">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm trong tài liệu..."
                      className="w-full bg-slate-100 dark:bg-[#141618] border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none pr-16 focus:border-cyan-500"
                    />
                    <div className="absolute right-1 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setMatchCase(!matchCase)}
                        className={`px-1 py-0.5 text-[10px] font-mono rounded transition cursor-pointer ${
                          matchCase ? 'bg-cyan-500 text-white' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Khớp chữ hoa/thường (Match Case)"
                      >
                        Aa
                      </button>
                      <button
                        type="button"
                        onClick={() => setWholeWord(!wholeWord)}
                        className={`px-1 py-0.5 text-[10px] font-mono rounded transition cursor-pointer ${
                          wholeWord ? 'bg-cyan-500 text-white' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Khớp nguyên từ (Whole Word)"
                      >
                        \b
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseRegex(!useRegex)}
                        className={`px-1 py-0.5 text-[10px] font-mono rounded transition cursor-pointer ${
                          useRegex ? 'bg-cyan-500 text-white' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Biểu thức chính quy (Regex)"
                      >
                        .*
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      placeholder="Thay thế bằng..."
                      className="flex-1 bg-slate-100 dark:bg-[#141618] border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
                    <button
                      type="button"
                      disabled={!searchQuery}
                      onClick={handleReplaceNext}
                      className="flex-1 py-1 px-2 rounded bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-[11px] font-medium transition cursor-pointer disabled:opacity-40"
                    >
                      Thay thế
                    </button>
                    <button
                      type="button"
                      disabled={!searchQuery}
                      onClick={handleReplaceAll}
                      className="flex-1 py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 shadow-xs"
                    >
                      Thay tất cả
                    </button>
                  </div>
                </div>

                {/* Match Results Count & List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                  <div className="text-[11px] font-mono text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Kết quả ({searchMatches.length})</span>
                    {searchQuery && (
                      <span className="text-[10px] text-cyan-400">
                        {activeFileName}
                      </span>
                    )}
                  </div>
                  {searchMatches.length > 0 ? (
                    searchMatches.map((m, idx) => (
                      <button
                        key={`${m.line}-${idx}`}
                        type="button"
                        onClick={() => setTargetLine(m.line)}
                        className="w-full text-left p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#252a2e] text-slate-700 dark:text-slate-300 transition text-[11px] font-mono cursor-pointer border border-transparent hover:border-white/5"
                      >
                        <span className="text-cyan-500 font-bold mr-1.5">L{m.line}:</span>
                        <span className="truncate">{m.text.trim()}</span>
                      </button>
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      Không tìm thấy kết quả phù hợp
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      Nhập từ khóa để bắt đầu tìm kiếm
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeActivityTab === 'ai' && (
              <div className="h-full flex flex-col overflow-hidden text-xs select-none">
                {/* AI Header */}
                <div className="flex items-center justify-between px-2.5 py-2 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0 font-semibold text-[11px] uppercase tracking-wider text-neutral-400">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>TRỢ LÝ AI SOẠN THẢO</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                    title="Thu gọn"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* AI Prompts & Chat Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3">
                  {/* Preset quick actions */}
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Gợi ý tác vụ nhanh
                    </span>
                    <div className="space-y-1">
                      {[
                        { id: 'exam', label: 'Soạn 5 câu trắc nghiệm Toán (A-B-C-D)', icon: <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> },
                        { id: 'solution', label: 'Viết lời giải chi tiết theo từng bước', icon: <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> },
                        { id: 'tikz', label: 'Tạo khối hình học không gian TikZ', icon: <Shapes className="w-3.5 h-3.5 text-amber-400" /> },
                        { id: 'table', label: 'Lập bảng biến thiên hàm số', icon: <Sigma className="w-3.5 h-3.5 text-indigo-400" /> },
                        { id: 'fix', label: 'Tự động sửa lỗi cú pháp LaTeX', icon: <WandSparkles className="w-3.5 h-3.5 text-rose-400" /> },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          disabled={aiBusy}
                          onClick={() => {
                            if (p.id === 'fix') {
                              handleAIFix();
                            } else {
                              handleAI(p.id);
                            }
                          }}
                          className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252a2e] hover:text-indigo-400 transition cursor-pointer border border-transparent hover:border-white/5 disabled:opacity-50 text-[11px]"
                        >
                          {p.icon}
                          <span className="truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Status / Output Notice */}
                  {aiBusy && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                      <span>AI đang suy nghĩ và tạo mã LaTeX...</span>
                    </div>
                  )}
                </div>

                {/* AI Input Form Footer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!aiPromptText.trim() || aiBusy) return;
                    handleAI('custom', aiPromptText.trim());
                    setAiPromptText('');
                  }}
                  className="p-2 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-slate-950/30"
                >
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={aiPromptText}
                      onChange={(e) => setAiPromptText(e.target.value)}
                      placeholder="Nhập yêu cầu cho AI (vd: tạo bài toán ma trận, vẽ hình chóp...)"
                      className="w-full bg-slate-100 dark:bg-[#141618] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 outline-none pr-8 resize-none focus:border-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (aiPromptText.trim() && !aiBusy) {
                            handleAI('custom', aiPromptText.trim());
                            setAiPromptText('');
                          }
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!aiPromptText.trim() || aiBusy}
                      className="absolute right-2 bottom-2.5 p-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition cursor-pointer"
                      title="Gửi yêu cầu"
                    >
                      {aiBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* RESIZER 1: SIDEBAR RESIZER (60px - 450px, snap 20px) */}
        <div
          onMouseDown={handleMouseDownSidebarDivider}
          className={`relative w-2 flex-shrink-0 shrink-0 flex flex-col items-center justify-center cursor-col-resize select-none transition-colors z-30 group ${
            resizingTarget === 'sidebar'
              ? 'bg-neutral-600/50'
              : 'bg-[#1e2124] hover:bg-neutral-600/50 border-r border-white/5'
          }`}
          title={sidebarWidth <= 0 ? "Kéo sang phải để mở rộng Sidebar" : "Kéo chỉnh độ rộng Sidebar (60px - 450px)"}
        >
          {/* Flush Handle: Separated hitbox, pointer-events-auto, z-40 */}
          <div className="absolute top-1/2 -translate-y-1/2 z-40 pointer-events-auto group/sbc">
            <button
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation();
                /* TUYỆT ĐỐI KHÔNG dùng e.preventDefault() ở đây */
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Toggle Sidebar
                if (sidebarWidth <= 0) {
                  setSidebarWidth(lastSidebarWidth > 0 ? lastSidebarWidth : 250);
                } else {
                  setLastSidebarWidth(sidebarWidth);
                  setSidebarWidth(0);
                }
              }}
              className="w-3 h-10 bg-[#20262b] border border-white/10 rounded-[2px] text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto z-40 relative shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-300 hover:shadow-[0_0_8px_rgba(34,197,94,0.45)]"
              title={sidebarWidth <= 0 ? "Mở rộng bảng điều khiển" : "Thu gọn bảng điều khiển"}
            >
              {sidebarWidth <= 0 ? (
                <ChevronRight className="w-2.5 h-2.5" />
              ) : (
                <ChevronLeft className="w-2.5 h-2.5" />
              )}
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#111315] border border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/sbc:opacity-100 transition-opacity duration-150 z-50">
              {sidebarWidth <= 0 ? 'Mở rộng bảng điều khiển' : 'Thu gọn bảng điều khiển'}
            </div>
          </div>
        </div>

        {/* WORKSPACE CONTAINER: EDITOR + RESIZER 2 + PDF */}
        <div
          ref={workspaceRef}
          className="relative flex-1 min-w-0 h-full flex flex-row overflow-hidden p-1.5 gap-1.5"
        >
          {/* COLUMN 2: CODE EDITOR PANEL (Center) */}
          <section
            aria-label="Trình soạn thảo mã LaTeX"
            style={{
              display: layoutMode === 'pdf' ? 'none' : 'flex',
              width: layoutMode === 'split' ? `${editorRatio * 100}%` : undefined,
            }}
            className={`min-w-[60px] flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden h-full flex flex-shrink-0 shrink-0 relative ${
              layoutMode === 'code' ? 'flex-1 min-w-0' : ''
            }`}
          >
            {/* File Tabs Bar - ALWAYS VISIBLE OUTSIDE MASK */}
            <div className="flex items-center justify-between px-2 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0 h-8 z-10">
              <div className="flex items-center gap-1 overflow-x-auto min-w-0 py-0.5">
                {openTabs.map((tab) => {
                  const isActive = tab === activeFileName;
                  return (
                    <div
                      key={tab}
                      onClick={() => handleSelectFile(tab)}
                      className={`group flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer font-mono text-[11px] transition shrink-0 ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <FileCode className="w-3 h-3 text-cyan-500" />
                      <span>{tab}</span>
                      {openTabs.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(tab);
                          }}
                          className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Nhập tên tệp LaTeX mới (vd: baitap.tex):');
                    if (name) handleCreateFile(name);
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                  title="Tạo tệp mới"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Area below Tabs Bar (Ribbon + Editor) with Solid Mask during Dragging */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
              {/* Solid Blank Canvas during Dragging */}
              {isResizing && (
                <div className="absolute inset-0 z-30 bg-[#1e2327] select-none pointer-events-none" />
              )}

              <div className={`flex flex-col h-full w-full overflow-hidden ${isResizing ? 'invisible pointer-events-none' : ''}`}>
                {/* Overleaf Flat Editor Ribbon */}
                <div className="h-8 px-2 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-1 text-xs shrink-0 select-none overflow-x-auto">
                  {/* Left icons group */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => triggerEditorAction('undo')}
                  className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                  title="Hoàn tác (Undo / Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => triggerEditorAction('redo')}
                  className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                  title="Làm lại (Redo / Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>

                <span className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <button
                  type="button"
                  onClick={() => triggerEditorAction('find')}
                  className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                  title="Tìm kiếm & Thay thế (Ctrl+F)"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                <span className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                {/* Font size TT */}
                <div className="flex items-center gap-0.5 px-0.5 text-slate-600 dark:text-slate-300">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    aria-label="Cỡ chữ soạn thảo"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="bg-transparent border-0 text-[11px] font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-0.5"
                    title="Cỡ chữ soạn thảo (TT)"
                  >
                    {[12, 13, 14, 15, 16, 18, 20].map((s) => (
                      <option key={s} value={s} className="dark:bg-slate-900">
                        {s}px
                      </option>
                    ))}
                  </select>
                </div>

                <span className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <button
                  type="button"
                  onClick={() => triggerEditorAction('bold')}
                  className="p-1 h-6 w-6 flex items-center justify-center rounded-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-serif text-xs transition"
                  title="In đậm (\textbf{...})"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => triggerEditorAction('italic')}
                  className="p-1 h-6 w-6 flex items-center justify-center rounded-sm italic font-serif hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs transition"
                  title="In nghiêng (\textit{...})"
                >
                  I
                </button>

                {/* Math symbols palette launcher (Omega Ω) */}
                <button
                  type="button"
                  onClick={() => setIsSymbolsOpen((prev) => !prev)}
                  className={`p-1 h-6 w-6 flex items-center justify-center rounded-sm font-serif font-bold text-xs transition cursor-pointer ${
                    isSymbolsOpen
                      ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40 shadow-2xs'
                      : 'hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                  title="Bảng ký hiệu toán học MathType (Omega Ω)"
                >
                  Ω
                </button>

                <button
                  type="button"
                  onClick={() => triggerEditorAction('link')}
                  className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                  title="Chèn liên kết (\href{...})"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => triggerEditorAction('table')}
                  className="p-1 rounded-sm hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                  title="Chèn bảng (\begin{tabular}...)"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right icons group: [ Code | Visual ], [ Editing / Reviewing ], Search */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center h-6 p-0.5 rounded bg-slate-200/80 dark:bg-slate-800/80 text-[11px] font-medium border border-slate-300/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setEditorMode('code')}
                    className={`h-5 px-2 flex items-center rounded transition cursor-pointer text-[11px] ${
                      editorMode === 'code'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('visual')}
                    className={`h-5 px-2 flex items-center rounded transition cursor-pointer text-[11px] ${
                      editorMode === 'visual'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Visual
                  </button>
                </div>

                <select
                  aria-label="Chế độ làm việc"
                  value={reviewMode}
                  onChange={(e) => setReviewMode(e.target.value as any)}
                  className="h-6 bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="editing" className="dark:bg-slate-900">Editing ▾</option>
                  <option value="reviewing" className="dark:bg-slate-900">Reviewing</option>
                </select>

                <button
                  type="button"
                  onClick={() => triggerEditorAction('find')}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title="Tìm kiếm trong tệp"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          {/* Monaco Editor Canvas or Visual Mode */}
          <div className="flex-1 min-h-0 relative">
            {editorMode === 'code' ? (
              <TeXEditor
                source={source}
                onChange={(newSource) => {
                  setSource(newSource);
                  setFiles((prev) =>
                    prev.map((f) => (f.name === activeFileName ? { ...f, content: newSource } : f))
                  );
                }}
                fontSize={fontSize}
                onCompile={compile}
                insertRequest={insertRequest}
                editorActionRequest={editorActionRequest}
                onCursorLine={handleSyncCodeToPDF}
                targetLine={targetLine}
                errors={errors}
                onMount={(editor) => {
                  monacoEditorRef.current = editor;
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                <FileText className="w-12 h-12 text-cyan-500 mb-3 opacity-70" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                  Chế độ xem trước trực quan (Visual Editor)
                </p>
                <p className="text-xs max-w-sm text-slate-500 dark:text-slate-400 mb-4">
                  Đang hiển thị chế độ phân giải nhanh văn bản LaTeX. Bạn có thể bấm nút Code để chỉnh sửa mã nguồn trực tiếp.
                </p>
                <button
                  type="button"
                  onClick={() => setEditorMode('code')}
                  className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-xs hover:bg-cyan-500 transition"
                >
                  Chuyển sang chế độ Code
                </button>
              </div>
            )}

            {/* Bottom Drawer Math Symbol Palette */}
            <MathSymbolsPopover
              isOpen={isSymbolsOpen}
              onClose={() => setIsSymbolsOpen(false)}
              onInsert={handleInsert}
              position="bottom-drawer"
            />
          </div>
        </div>
      </div>
    </section>

        {/* RESIZER 2: SPLIT RESIZER & SYNCTEX ARROWS (Overleaf Split Gutter) */}
        {layoutMode !== 'pdf' && (
          <div
            onMouseDown={handleMouseDownEditorPdfDivider}
            className={`relative w-2 flex-shrink-0 shrink-0 flex flex-col items-center justify-center cursor-col-resize select-none transition-colors z-30 group ${
              resizingTarget === 'editor-pdf'
                ? 'bg-neutral-600/50'
                : 'bg-[#1e2124] hover:bg-neutral-600/50 border-x border-white/5'
            }`}
            title={layoutMode === 'code' ? "Kéo sang trái để mở rộng PDF" : "Kéo giãn tỷ lệ giữa Code và PDF (Overleaf Split Gutter)"}
          >
            {/* SyncTeX Arrows - Anchored at top-[72px] (aligning with code editor lines) */}
            {layoutMode === 'split' && (
              <div className="absolute top-[72px] flex flex-col items-center gap-1 z-30">
                {/* SyncTeX Code -> PDF */}
                <div className="relative group/synctop flex items-center justify-center">
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncCodeToPDF(cursorLine || targetLine || 1);
                    }}
                    className="w-5 h-5 bg-[#20262b] border border-white/10 rounded-[3px] text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-300 hover:shadow-[0_0_8px_rgba(34,197,94,0.45)]"
                    title="Nhảy đến vị trí trong PDF"
                  >
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover/synctop:text-emerald-300 transition-colors" />
                  </button>
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#111315] border border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/synctop:opacity-100 transition-opacity duration-150 z-50">
                    Nhảy đến vị trí trong PDF
                  </div>
                </div>

                {/* SyncTeX PDF -> Code */}
                <div className="relative group/syncbot flex items-center justify-center">
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncPDFToCode(pdfCurrentPage || 1, 0.2);
                    }}
                    className="w-5 h-5 bg-[#20262b] border border-white/10 rounded-[3px] text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-300 hover:shadow-[0_0_8px_rgba(34,197,94,0.45)]"
                    title="Nhảy đến dòng mã nguồn"
                  >
                    <ArrowLeft className="w-3 h-3 text-neutral-400 group-hover/syncbot:text-emerald-300 transition-colors" />
                  </button>
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#111315] border border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/syncbot:opacity-100 transition-opacity duration-150 z-50">
                    Nhảy đến dòng mã nguồn
                  </div>
                </div>
              </div>
            )}

            {/* PDF Flush Collapse / Expand Handle - Centered at top-1/2 */}
            <div className="absolute top-1/2 -translate-y-1/2 z-40 pointer-events-auto group/pdfcol">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  /* TUYỆT ĐỐI KHÔNG dùng e.preventDefault() ở đây */
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle PDF
                  if (layoutMode === 'code') {
                    setLayoutMode('split');
                    setEditorRatio(lastEditorRatio > 0.15 && lastEditorRatio < 0.85 ? lastEditorRatio : 0.5);
                  } else {
                    setLastEditorRatio(editorRatio);
                    setLayoutMode('code');
                  }
                }}
                className="w-3 h-10 bg-[#20262b] border border-white/10 rounded-[2px] text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto z-40 relative shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-300 hover:shadow-[0_0_8px_rgba(34,197,94,0.45)]"
                title={layoutMode === 'code' ? 'Mở rộng khung PDF' : 'Thu gọn khung PDF'}
              >
                {layoutMode === 'code' ? (
                  <ChevronLeft className="w-2.5 h-2.5" />
                ) : (
                  <ChevronRight className="w-2.5 h-2.5" />
                )}
              </button>
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#111315] border border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/pdfcol:opacity-100 transition-opacity duration-150 z-50">
                {layoutMode === 'code' ? 'Mở rộng khung PDF' : 'Thu gọn khung PDF'}
              </div>
            </div>
          </div>
        )}

        {/* COLUMN 4: PDF PREVIEW & VIEWER TOOLBAR (Right) */}
        <section
          ref={pdfSectionRef}
          aria-label="Khung xem trước PDF và Nhật ký Overleaf"
          style={{
            display: layoutMode === 'code' ? 'none' : 'flex',
            width: layoutMode === 'split' ? `${(1 - editorRatio) * 100}%` : '100%',
          }}
          className={`min-w-[60px] flex-1 overflow-hidden relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs h-full ${
            isResizing ? 'select-none pointer-events-none' : ''
          }`}
        >
          {/* Solid Blank Canvas during Dragging */}
          {isResizing && (
            <div className="absolute inset-0 z-30 bg-[#1e2327] select-none pointer-events-none" />
          )}

          <div className={`flex flex-col h-full w-full overflow-hidden ${isResizing ? 'invisible pointer-events-none' : ''}`}>
            {/* Overleaf Authentic Viewer Toolbar */}
          <div className="flex justify-between items-center px-2.5 h-8 border-b border-white/10 bg-[#1e2124] shrink-0 text-xs overflow-hidden select-none">
            {/* Left Group: Green Recompile + Engine + Download + Logs */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Overleaf Green Recompile Button */}
              <div className="inline-flex items-center rounded-sm overflow-hidden bg-[#2d884d] hover:bg-[#246e3e] transition h-6">
                <button
                  type="button"
                  onClick={() => void compile()}
                  disabled={status === 'compiling'}
                  className="h-6 bg-[#2d884d] hover:bg-[#246e3e] text-white font-normal text-xs px-2.5 py-0.5 rounded-sm flex items-center gap-1 cursor-pointer active:bg-[#1f5f36] transition"
                  title="Biên dịch tài liệu (Ctrl+Enter)"
                >
                  <RefreshCw className={`w-3 h-3 ${status === 'compiling' ? 'animate-spin' : ''}`} />
                  {pdfWidth >= 380 && (
                    <span className="text-[11px]">{status === 'compiling' ? 'Đang dịch…' : 'Recompile'}</span>
                  )}
                </button>

                {/* Engine Dropdown */}
                {pdfWidth >= 360 && (
                  <select
                    aria-label="Chọn engine biên dịch"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value as any)}
                    className="h-6 bg-[#246e3e] hover:bg-[#1f5f36] text-white border-l border-emerald-700/50 text-[10px] font-medium px-1 outline-none cursor-pointer"
                    title="Trình biên dịch TeX Engine"
                  >
                    <option value="xelatex" className="text-slate-900 bg-white">{pdfWidth < 440 ? 'Xe' : 'XeLaTeX'}</option>
                    <option value="pdflatex" className="text-slate-900 bg-white">{pdfWidth < 440 ? 'pdf' : 'pdfLaTeX'}</option>
                    <option value="lualatex" className="text-slate-900 bg-white">{pdfWidth < 440 ? 'Lua' : 'LuaLaTeX'}</option>
                  </select>
                )}
              </div>

              {/* Quick Download PDF */}
              {pdf && (
                <a
                  href={pdf}
                  download={`${docTitle.replace(/\.tex$/, '')}.pdf`}
                  className="h-6 w-6 flex items-center justify-center rounded-sm border border-slate-700 hover:bg-slate-800 text-slate-300 transition shrink-0"
                  title="Tải PDF nhanh về máy"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              )}

              {/* Overleaf Logs Button with Badge */}
              <button
                type="button"
                onClick={() => setOutputView(outputView === 'console' ? 'pdf' : 'console')}
                className={`h-6 inline-flex items-center gap-1 px-2 rounded-sm text-[11px] font-medium transition cursor-pointer border shrink-0 ${
                  errors.length > 0 || status === 'error'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                title={outputView === 'console' ? 'Quay lại xem PDF' : 'Mở bảng nhật ký & lỗi biên dịch'}
              >
                {errors.length > 0 || status === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {pdfWidth >= 400 && <span>Logs</span>}
                <span
                  className={`px-1 py-0.1 rounded-full text-[9px] font-bold ${
                    errors.length > 0 || status === 'error'
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {errors.length > 0
                    ? (pdfWidth < 460 ? `${errors.length}` : `${errors.length} Errors`)
                    : status === 'error'
                    ? (pdfWidth < 460 ? '1' : '1 Error')
                    : (pdfWidth < 460 ? '0' : '0 Errors')}
                </span>
              </button>

              {outputView === 'console' && (
                <button
                  type="button"
                  onClick={() => setOutputView('pdf')}
                  className="h-6 px-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer shrink-0"
                >
                  Xem PDF
                </button>
              )}
            </div>

            {/* Right Group: Page Navigator + Zoom */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Horizontal Page Counter: < Trang 1 / 1 > */}
              <div className="h-6 flex items-center gap-0.5 bg-slate-800/90 rounded-sm px-1 border border-slate-700 shrink-0 text-[11px] font-mono">
                <button
                  type="button"
                  disabled={pdfCurrentPage <= 1}
                  onClick={() => {
                    const prev = Math.max(1, pdfCurrentPage - 1);
                    setPdfCurrentPage(prev);
                    setJumpToPage(prev);
                  }}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>

                <div className="flex items-center px-1.5 py-0.5 font-mono text-[11px] text-slate-200">
                  <span className="text-[10px] text-slate-400 mr-1 font-sans">Trang</span>
                  <input
                    type="number"
                    min={1}
                    max={pdfTotalPages || 1}
                    value={pdfCurrentPage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= (pdfTotalPages || 1)) {
                        setPdfCurrentPage(val);
                        setJumpToPage(val);
                      }
                    }}
                    className="w-4 text-center bg-transparent border-0 outline-none text-[11px] font-mono text-slate-100 p-0"
                  />
                  <span className="text-slate-500">/</span>
                  <span className="ml-0.5 text-slate-400">{pdfTotalPages || 1}</span>
                </div>

                <button
                  type="button"
                  disabled={pdfCurrentPage >= (pdfTotalPages || 1)}
                  onClick={() => {
                    const next = Math.min(pdfTotalPages || 1, pdfCurrentPage + 1);
                    setPdfCurrentPage(next);
                    setJumpToPage(next);
                  }}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Trang kế tiếp"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Zoom Controls: - [%] + */}
              <div className="h-6 flex items-center gap-0.5 bg-slate-800/90 rounded-sm px-1 border border-slate-700 shrink-0 text-[11px]">
                <button
                  type="button"
                  disabled={!pdf}
                  onClick={() => setZoom((z) => Math.max(25, (typeof z === 'number' ? z : 100) - 25))}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>

                <span className="font-mono text-[10px] px-1 text-slate-200 min-w-6 text-center">
                  {typeof zoom === 'number' ? `${zoom}%` : 'Rộng'}
                </span>

                <button
                  type="button"
                  disabled={!pdf}
                  onClick={() => setZoom((z) => Math.min(300, (typeof z === 'number' ? z : 100) + 25))}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Output Body */}
          <div className="flex-1 min-h-0 w-full h-full flex flex-col relative overflow-hidden bg-[#525659]">
            {outputView === 'pdf' ? (
              pdf ? (
                <div className="flex-1 min-h-0 w-full h-full overflow-auto flex flex-col justify-center items-center p-4 bg-[#525659]">
                  {source !== compiledSource && (
                    <div
                      role="status"
                      className="text-xs px-3 py-1 bg-amber-500/20 border-b border-amber-500/30 text-amber-200 flex items-center justify-between shrink-0 w-full mb-2 rounded"
                    >
                      <span className="truncate">Mã nguồn đã sửa đổi. Bấm Recompile để cập nhật PDF.</span>
                      <button
                        onClick={() => void compile()}
                        className="underline font-bold hover:text-white cursor-pointer ml-2 shrink-0"
                      >
                        Cập nhật
                      </button>
                    </div>
                  )}
                  <PDFPreview
                    key={pdf}
                    url={pdf}
                    zoom={zoom}
                    setZoom={setZoom}
                    onSync={handleSyncPDFToCode}
                    highlightPage={highlightPage}
                    jumpToPage={jumpToPage}
                    onTotalPagesChange={(total) => setPdfTotalPages(total)}
                    onActivePageChange={(page) => setPdfCurrentPage(page)}
                    isPresentation={isPresentation}
                    onClosePresentation={() => setIsPresentation(false)}
                  />
                </div>
              ) : (
                <div className="flex-1 w-full h-full overflow-auto flex flex-col justify-center items-center p-4 text-center text-slate-300 bg-[#525659]">
                  <div className="w-full max-w-xs flex flex-col items-center px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl border border-slate-500 bg-slate-700/80 flex items-center justify-center mb-3 shadow-md shrink-0">
                      <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">
                      Chưa có tài liệu PDF
                    </p>
                    <p className="text-xs leading-relaxed text-slate-300 mb-4 max-w-full">
                      Bấm nút <strong className="text-emerald-400">“Recompile”</strong> màu xanh phía trên (Ctrl+Enter) để biên dịch tài liệu PDF.
                    </p>
                    <button
                      type="button"
                      onClick={() => void compile()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2d884d] hover:bg-[#246e3e] text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Recompile ngay</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <ErrorConsole
                log={errorLog}
                onJumpToLine={(line) => setTargetLine(line)}
                onAIFix={handleAIFix}
                fixBusy={fixBusy}
                onClose={() => setOutputView('pdf')}
              />
            )}
          </div>
        </div>
      </section>
      </div>
      </main>

      {/* 4. History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-4 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100">
                <History className="w-4 h-4 text-cyan-500" />
                <span>Lịch sử phiên bản (Restore Points)</span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {history.length > 0 ? (
                history.slice().reverse().map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label || 'Bản lưu tự động'}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(item.at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSource(item.source);
                        setFiles((prev) =>
                          prev.map((f) => (f.name === activeFileName ? { ...f, content: item.source } : f))
                        );
                        setIsHistoryOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition cursor-pointer"
                    >
                      Khôi phục
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Chưa có điểm khôi phục nào.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share / Xuất bản Modal */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="bg-[#1e2124] border border-[#3e444b] text-slate-100 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Chia sẻ & Xuất bản dự án</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Share Link */}
              <div>
                <label className="text-slate-400 font-medium block mb-1.5">Liên kết chia sẻ trực tiếp:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="flex-1 bg-[#141618] border border-white/10 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px] outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.href);
                        setCopiedShareLink(true);
                        setTimeout(() => setCopiedShareLink(false), 2000);
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedShareLink ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Export Options */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-slate-400 font-medium mb-2.5">Tải xuống & Xuất bản tệp:</p>
                <div className="grid grid-cols-2 gap-2">
                  {pdf ? (
                    <a
                      href={pdf}
                      download={`${docTitle.replace(/\.tex$/, '')}.pdf`}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-[#2a2e33] hover:bg-[#343a40] text-slate-200 transition cursor-pointer border border-white/5"
                    >
                      <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">Tải PDF</div>
                        <div className="text-[10px] text-slate-400">Tài liệu đã biên dịch</div>
                      </div>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsShareModalOpen(false);
                        void compile();
                      }}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-[#2a2e33] hover:bg-[#343a40] text-slate-200 transition cursor-pointer border border-white/5 text-left"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">Biên dịch PDF</div>
                        <div className="text-[10px] text-slate-400">Recompile để tải</div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      exportTex();
                      setIsShareModalOpen(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#2a2e33] hover:bg-[#343a40] text-slate-200 transition cursor-pointer border border-white/5 text-left"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Mã nguồn TeX</div>
                      <div className="text-[10px] text-slate-400">Tệp .tex gốc</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleExportWord();
                      setIsShareModalOpen(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#2a2e33] hover:bg-[#343a40] text-slate-200 transition cursor-pointer border border-white/5 text-left"
                  >
                    <FileDown className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Xuất Word</div>
                      <div className="text-[10px] text-slate-400">Định dạng .docx</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!pdf}
                    onClick={() => {
                      setIsShareModalOpen(false);
                      setIsPresentation(true);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#2a2e33] hover:bg-[#343a40] text-slate-200 transition cursor-pointer border border-white/5 text-left disabled:opacity-40"
                  >
                    <Tv className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Trình chiếu</div>
                      <div className="text-[10px] text-slate-400">Máy chiếu / Fullscreen</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Transparent Pointer Shield during Dragging */}
      {isResizing && (
        <div
          className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        />
      )}

      {/* 5. Footer Status Bar */}
      <footer className="relative z-10 shrink-0 px-3 py-1 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 h-7">
        <div className="flex items-center gap-2.5">
          <span>MathAIO Studio © {new Date().getFullYear()}</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px]">
            <Save className="w-3 h-3 text-emerald-500" />
            {storageNotice}
          </span>
          <Link
            href="/changelog?from=%2Flatex"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted font-mono text-[10px]"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px]">{engine.toUpperCase()} qua {engineLabel}</span>
        </div>
      </footer>
    </div>
  );
}
