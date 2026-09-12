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
  Quote,
  FolderPlus,
  MoreHorizontal,
  Image as ImageIcon,
  FileArchive,
  MessageSquare,
  MessageCircle,
  FolderSync,
  Bookmark,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { APP_VERSION } from '@/config/version';
import { useTheme } from '@/context/ThemeContext';
import type { StudioFile, StudioImage, RestorePoint } from '@/components/latex/StudioTools';
import FileTreeExplorer from '@/components/latex/FileTreeExplorer';
import ErrorConsole, { parseTeXLog } from '@/components/latex/ErrorConsole';
import MathSymbolsPopover from '@/components/latex/MathSymbolsPopover';
import AIAssistantDropdown from '@/components/latex/AIAssistantDropdown';
import ReviewPanel, { type CommentItem } from '@/components/latex/ReviewPanel';
import ChatPanel, { type ChatMessage } from '@/components/latex/ChatPanel';
import IntegrationsModal from '@/components/latex/IntegrationsModal';
import InsertDialogs, { type InsertDialogType } from '@/components/latex/InsertDialogs';
import { LATEX_TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplateById } from '@/components/latex/LaTeXTemplates';
import {
  EDITOR_COMMANDS,
  LATEX_SNIPPETS,
  type EditorExecutionContext,
} from '@/components/latex/editorCommands';
import { getDocumentById, saveDocument, type LatexDocumentItem } from '@/lib/latexStorage';
import {
  getProjectById,
  saveProject,
  createNewProject,
  type ProjectItem,
} from '@/lib/storage/projectStore';
import {
  ProjectSettings,
  DEFAULT_PROJECT_SETTINGS,
  loadProjectSettings,
  saveProjectSettings,
} from '@/components/latex/projectSettings';
import ProjectSettingsModal from '@/components/latex/ProjectSettingsModal';
import ShareProjectModal from '@/components/latex/ShareProjectModal';
import AddFilesModal, { type AddFilesTab } from '@/components/latex/AddFilesModal';
import ProjectHistoryView from '@/components/latex/ProjectHistoryView';
import { createSnapshot, type ProjectSnapshot } from '@/lib/projectHistory';
import { useAuth } from '@/context/AuthContext';
import MathAIOLogo from '@/components/common/MathAIOLogo';

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
  const [activeFileName, setActiveFileName] = useState<string | null>('main.tex');
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
  const { user } = useAuth();
  const [insertRequest, setInsertRequest] = useState<{ id: number; text: string } | undefined>(undefined);
  const [editorActionRequest, setEditorActionRequest] = useState<{ id: number; action: string } | undefined>(undefined);
  const [isPresentation, setIsPresentation] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isHistoryView, setIsHistoryView] = useState<boolean>(false);
  const [historyToast, setHistoryToast] = useState<string | null>(null);
  const [storageNotice, setStorageNotice] = useState<string>('Tự động lưu');
  const [cloudRevision, setCloudRevision] = useState<number>(1);
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'reviewer' | 'viewer'>('owner');
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'offline' | 'conflict' | 'error'>('saved');

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
  const [activeActivityTab, setActiveActivityTab] = useState<'files' | 'search' | 'review' | 'chat' | 'ai'>('files');
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState<boolean>(false);
  const [insertDialogType, setInsertDialogType] = useState<InsertDialogType>(null);
  const [trackChangesEnabled, setTrackChangesEnabled] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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
  const editorViewRef = useRef<any>(null);
  const [isProjectLoaded, setIsProjectLoaded] = useState<boolean>(false);
  const mainContainerRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const pdfSectionRef = useRef<HTMLElement>(null);
  const [pdfWidth, setPdfWidth] = useState<number>(600);
  const compileAbortControllerRef = useRef<AbortController | null>(null);
  const compileRevisionRef = useRef<number>(0);

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

  const handleActivityTabClick = (tab: 'files' | 'search' | 'review' | 'chat' | 'ai') => {
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

  // Comments management
  const handleAddComment = (comment: Omit<CommentItem, 'id' | 'createdAt' | 'resolved'>) => {
    const newComment: CommentItem = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      resolved: false,
    };
    setComments((prev) => [newComment, ...prev]);
  };

  const handleResolveComment = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  };

  const handleDeleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReplyComment = (commentId: string, replyText: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const newReply = {
          id: `reply_${Date.now()}`,
          author: user?.email || 'Bạn',
          content: replyText,
          createdAt: Date.now(),
        };
        return {
          ...c,
          replies: [...(c.replies || []), newReply],
        };
      })
    );
  };

  // Chat management
  const handleSendMessage = (text: string, snippet?: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: user?.email || 'Bạn',
      text,
      snippet,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  // Import BibTeX from Zotero/Mendeley
  const handleImportBibTeX = (bibtexContent: string, fileName = 'references.bib') => {
    const existingIndex = files.findIndex((f) => f.name === fileName);
    if (existingIndex >= 0) {
      setFiles((prev) =>
        prev.map((f, i) => (i === existingIndex ? { ...f, content: `${f.content}\n\n${bibtexContent}` } : f))
      );
    } else {
      setFiles((prev) => [...prev, { name: fileName, content: bibtexContent }]);
      setOpenTabs((prev) => [...prev, fileName]);
    }
    setHistoryToast(`Đã đồng bộ thành công ${fileName}!`);
    setTimeout(() => setHistoryToast(null), 3000);
  };

  // Persist user layout and panel state per-project in localStorage
  useEffect(() => {
    const projectId = currentDocId || docId || 'default';
    try {
      const savedLayout = localStorage.getItem(`latex_layout_${projectId}`);
      if (savedLayout) {
        const parsed = JSON.parse(savedLayout);
        if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
        if (typeof parsed.editorRatio === 'number') setEditorRatio(parsed.editorRatio);
        if (typeof parsed.sidebarWidth === 'number') setSidebarWidth(parsed.sidebarWidth);
        if (parsed.activeActivityTab) setActiveActivityTab(parsed.activeActivityTab);
      }
      const savedComments = localStorage.getItem(`latex_comments_${projectId}`);
      if (savedComments) setComments(JSON.parse(savedComments));
      const savedChat = localStorage.getItem(`latex_chat_${projectId}`);
      if (savedChat) setChatMessages(JSON.parse(savedChat));
    } catch {
      // Ignore parse error
    }
  }, [currentDocId, docId]);

  useEffect(() => {
    const projectId = currentDocId || docId || 'default';
    try {
      localStorage.setItem(
        `latex_layout_${projectId}`,
        JSON.stringify({ layoutMode, editorRatio, sidebarWidth, activeActivityTab })
      );
    } catch {}
  }, [layoutMode, editorRatio, sidebarWidth, activeActivityTab, currentDocId, docId]);

  useEffect(() => {
    const projectId = currentDocId || docId || 'default';
    try {
      localStorage.setItem(`latex_comments_${projectId}`, JSON.stringify(comments));
    } catch {}
  }, [comments, currentDocId, docId]);

  useEffect(() => {
    const projectId = currentDocId || docId || 'default';
    try {
      localStorage.setItem(`latex_chat_${projectId}`, JSON.stringify(chatMessages));
    } catch {}
  }, [chatMessages, currentDocId, docId]);

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
  const { resolvedTheme, toggleTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(() =>
    loadProjectSettings(docId || undefined)
  );

  const handleUpdateSettings = useCallback(
    (newPartial: Partial<ProjectSettings>) => {
      setProjectSettings((prev) => {
        const next = { ...prev, ...newPartial };
        saveProjectSettings(next, currentDocId);
        if (newPartial.compiler && newPartial.compiler !== engine) {
          setEngine(newPartial.compiler);
        }
        if (newPartial.fontSize && newPartial.fontSize !== fontSize) {
          setFontSize(newPartial.fontSize);
        }
        const targetTheme = newPartial.overallTheme || newPartial.theme;
        if (
          targetTheme &&
          targetTheme !== (resolvedTheme === 'dark' ? 'dark' : 'light')
        ) {
          setTheme?.(targetTheme);
        }
        return next;
      });
    },
    [currentDocId, engine, fontSize, resolvedTheme, setTheme]
  );

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(docTitle);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeDesktopMenu, setActiveDesktopMenu] = useState<'file' | 'edit' | 'insert' | 'view' | 'format' | 'help' | null>(null);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [activeToolbarPopover, setActiveToolbarPopover] = useState<'heading' | 'math' | 'image' | 'table' | null>(null);
  const [tableHoverSize, setTableHoverSize] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [addFilesModal, setAddFilesModal] = useState<{
    isOpen: boolean;
    defaultTab: AddFilesTab;
  }>({ isOpen: false, defaultTab: 'new_file' });
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Parse URL access permissions (Viewer / Editor / Read-only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const access = urlParams.get('access');
      const role = urlParams.get('role');
      const token = urlParams.get('token');
      if (access === 'view' || role === 'viewer' || (token && token.startsWith('token_view_'))) {
        setIsReadOnly(true);
      }
    }
  }, []);

  // Global shortcut for Settings (Ctrl/Cmd + ,)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      if (isProjectMenuOpen && projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
      if (activeToolbarPopover && toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveToolbarPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeDesktopMenu, isLayoutMenuOpen, isProjectMenuOpen, activeToolbarPopover]);

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
    setIsProjectLoaded(false);
    setPdf((oldPdf) => {
      if (oldPdf) URL.revokeObjectURL(oldPdf);
      return null;
    });

    if (docId) {
      const proj = getProjectById(docId);
      const stored = getDocumentById(docId);
      const loadedSettings = loadProjectSettings(docId);
      setProjectSettings(loadedSettings);
      if (loadedSettings.compiler) setEngine(loadedSettings.compiler);
      if (loadedSettings.fontSize) setFontSize(loadedSettings.fontSize);

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

      const loadedSettings = loadProjectSettings(newDoc.id);
      setProjectSettings(loadedSettings);
      if (loadedSettings.compiler) setEngine(loadedSettings.compiler);
      if (loadedSettings.fontSize) setFontSize(loadedSettings.fontSize);

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
    setIsProjectLoaded(true);

    // Cloud fetch & permission validation
    const effectiveId = docId || currentDocId;
    if (effectiveId && typeof window !== 'undefined') {
      fetch(`/api/latex/projects/${encodeURIComponent(effectiveId)}`)
        .then((res) => {
          if (res.ok) return res.json();
          if (res.status === 404 && user) {
            // Not in cloud yet -> auto-migrate to cloud
            const localP = getProjectById(effectiveId);
            if (localP) {
              fetch('/api/latex/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: localP.id,
                  title: localP.title,
                  templateId: localP.metadata?.templateId || 'blank',
                  mainDocument: localP.metadata?.mainDocument || 'main.tex',
                  compilerEngine: engine,
                  files: localP.files || [{ name: 'main.tex', content: localP.content || '' }],
                  metadata: localP.metadata || {},
                  settings: projectSettings,
                  isStarred: localP.isStarred,
                }),
              }).catch(() => {});
            }
          }
          return null;
        })
        .then((data) => {
          if (data?.project) {
            setCloudRevision(data.project.revision || 1);
            if (data.userRole) setUserRole(data.userRole);
            if (data.isReadOnly) setIsReadOnly(true);
            setSyncStatus('saved');
            setStorageNotice('Đã đồng bộ đám mây');
          }
        })
        .catch(() => {});
    }
  }, [docId, user]);


  // Debounced Auto-save (2 seconds)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentDocId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const existingProj = getProjectById(currentDocId);
        const targetMain = projectSettings.mainDocument || 'main.tex';
        const mainContent = files.find((f) => f.name === targetMain)?.content || source;

        const itemToSave: ProjectItem = {
          id: currentDocId,
          title: docTitle,
          type: 'latex',
          updatedAt: Date.now(),
          createdAt: existingProj?.createdAt || Date.now(),
          isStarred: existingProj?.isStarred || false,
          metadata: {
            ...(existingProj?.metadata || {}),
            templateId: template,
            badge: getTemplateById(template)?.badge || 'XeLaTeX',
            previewSnippet: mainContent.slice(0, 120),
            mainDocument: targetMain,
            files,
          },
          content: mainContent,
          files,
        };
        saveProject(itemToSave);

        const docItem: LatexDocumentItem = {
          id: currentDocId,
          title: docTitle,
          templateId: template,
          createdAt: existingProj?.createdAt || Date.now(),
          updatedAt: Date.now(),
          source: mainContent,
          files,
          images,
          history,
        };
        saveDocument(docItem);

        // Also sync to Cloud API if user is logged in
        if (user && !isReadOnly) {
          setSyncStatus('saving');
          fetch(`/api/latex/projects/${encodeURIComponent(currentDocId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: docTitle,
              templateId: template,
              mainDocument: targetMain,
              compilerEngine: engine,
              files,
              images,
              metadata: itemToSave.metadata,
              settings: projectSettings,
              isStarred: itemToSave.isStarred,
              clientRevision: cloudRevision,
            }),
          })
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                if (data.revision) setCloudRevision(data.revision);
                setSyncStatus('saved');
                setStorageNotice(`Đã lưu đám mây (${new Date().toLocaleTimeString('vi-VN')})`);
              } else if (res.status === 409) {
                setSyncStatus('conflict');
                setStorageNotice('Xung đột phiên bản đám mây');
              } else {
                setSyncStatus('offline');
                setStorageNotice(`Đã lưu cục bộ (${new Date().toLocaleTimeString('vi-VN')})`);
              }
            })
            .catch(() => {
              setSyncStatus('offline');
              setStorageNotice(`Đã lưu cục bộ (${new Date().toLocaleTimeString('vi-VN')})`);
            });
        } else {
          setSyncStatus('offline');
          setStorageNotice(`Đã lưu cục bộ (${new Date().toLocaleTimeString('vi-VN')})`);
        }
      } catch {
        // quota
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [source, docTitle, template, files, activeFileName, images, history, currentDocId, user, isReadOnly, cloudRevision, engine, projectSettings]);

  // Insert helper
  const handleInsert = useCallback((text: string) => {
    setInsertRequest({ id: Date.now(), text });
  }, []);
  const insertLatexCode = handleInsert;

  const generateTableLatex = useCallback((rows: number = 3, cols: number = 3) => {
    return LATEX_SNIPPETS.table(rows, cols);
  }, []);

  // Trigger Ribbon action
  const triggerEditorAction = useCallback((action: string) => {
    setEditorActionRequest({ id: Date.now(), action });
  }, []);


  // Compile LaTeX to PDF
  const compile = useCallback(
    async (sourceToCompile?: string) => {
      // Abort previous in-flight compilation request
      if (compileAbortControllerRef.current) {
        compileAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      compileAbortControllerRef.current = controller;
      const currentRevision = ++compileRevisionRef.current;

      const currentActiveText = editorViewRef.current?.state?.doc?.toString() ?? source;
      const targetMain = projectSettings.mainDocument || 'main.tex';

      // Synchronize current editor state into files snapshot
      const filesSnapshot = files.map((f) => ({
        name: f.name,
        content: f.name === activeFileName ? currentActiveText : f.content,
      }));

      // Always compile the designated main document
      const mainFile =
        filesSnapshot.find((f) => f.name === targetMain) ||
        filesSnapshot.find((f) => f.name === 'main.tex') ||
        filesSnapshot[0];

      const mainContent = sourceToCompile || mainFile?.content || currentActiveText;
      if (!mainContent?.trim()) return;

      setStatus('compiling');
      setErrorLog('');

      try {
        // Build multi-file resources array including sub-files and images
        const resources: Array<{ path: string; content?: string; data?: string; main?: boolean }> =
          filesSnapshot.map((f) => ({
            path: f.name,
            content: f.name === (mainFile?.name || targetMain) ? mainContent : f.content,
            main: f.name === (mainFile?.name || targetMain),
          }));

        // Include uploaded images as binary resources (base64)
        images.forEach((img) => {
          const dataUri = img.dataUrl || img.url || '';
          if (dataUri.startsWith('data:')) {
            const base64Data = dataUri.split(',')[1];
            if (base64Data) {
              resources.push({
                path: img.name,
                data: base64Data,
              });
              if (!img.name.startsWith('images/')) {
                resources.push({
                  path: `images/${img.name}`,
                  data: base64Data,
                });
              }
            }
          }
        });

        const res = await fetch('/api/latex/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            source: mainContent,
            code: mainContent,
            compiler: engine,
            engine,
            mainDocument: mainFile?.name || targetMain,
            draftMode: projectSettings.draftMode,
            stopOnError: projectSettings.stopOnError,
            resources,
            files: filesSnapshot,
            projectId: currentDocId || docId || 'default',
          }),
        });

        if (compileRevisionRef.current !== currentRevision) {
          return;
        }

        if (!res.ok) {
          let errData: any = {};
          try {
            errData = await res.json();
          } catch {
            errData = { error: 'Lỗi máy chủ biên dịch.' };
          }
          const errorLogMessage = errData.log || errData.error || 'Biên dịch thất bại.';
          throw new Error(errorLogMessage);
        }

        const blob = await res.blob();
        if (compileRevisionRef.current !== currentRevision) return;

        if (pdf) URL.revokeObjectURL(pdf);
        const url = URL.createObjectURL(blob);
        setPdf(url);
        setCompiledSource(mainContent);
        setStatus('success');
        setOutputView('pdf');

        // Create LocalStorage project snapshot on compile success
        const filesMap: Record<string, string> = {};
        filesSnapshot.forEach((f) => {
          filesMap[f.name] = f.content;
        });
        createSnapshot(currentDocId || docId || 'default', filesMap, user?.email || 'Bạn', 'Biên dịch thành công');

        setHistory((prev) => [
          ...prev,
          { at: Date.now(), source: mainContent, label: 'Biên dịch thành công' },
        ]);
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          return;
        }
        if (compileRevisionRef.current !== currentRevision) return;
        setStatus('error');
        const rawLog = err?.message || 'Lỗi không xác định khi biên dịch.';
        setErrorLog(rawLog);
        setOutputView('console');
      }
    },
    [
      source,
      files,
      images,
      activeFileName,
      pdf,
      engine,
      projectSettings.mainDocument,
      projectSettings.draftMode,
      projectSettings.stopOnError,
      currentDocId,
      docId,
      user?.email,
    ]
  );

  // Auto-recompile immediately on project load or document switch (Client-side Navigation)
  const lastCompiledProjectIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentProjectId = currentDocId || docId;
    const content = (activeFileName === 'main.tex' ? source : files.find((f) => f.name === 'main.tex')?.content) || source || '';

    // Chưa tải xong ID hoặc nội dung rỗng/quá ngắn thì bỏ qua
    if (!currentProjectId || !isProjectLoaded || !content.trim() || content.trim().length <= 10) return;

    // Nếu ID tài liệu này đã được biên dịch rồi thì không tự chạy lại
    if (lastCompiledProjectIdRef.current === currentProjectId) return;

    // Đánh dấu dự án này đang được xử lý biên dịch
    lastCompiledProjectIdRef.current = currentProjectId;

    const timer = setTimeout(() => {
      void compile(content);
    }, 200);

    return () => clearTimeout(timer);
  }, [currentDocId, docId, isProjectLoaded, source, files, activeFileName, compile]);

  // Clean up any pending compilation request on unmount
  useEffect(() => {
    return () => {
      if (compileAbortControllerRef.current) {
        compileAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Periodic Auto-Snapshot (every 5 minutes if content changed)
  const lastSnapshotSourceRef = useRef<string>(source);
  useEffect(() => {
    const interval = setInterval(() => {
      if (source !== lastSnapshotSourceRef.current) {
        const filesMap: Record<string, string> = {};
        files.forEach((f) => {
          filesMap[f.name] = f.name === activeFileName ? source : f.content;
        });
        createSnapshot(currentDocId || docId || 'default', filesMap, user?.email || 'Bạn', 'Tự động lưu');
        lastSnapshotSourceRef.current = source;
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [source, files, activeFileName, currentDocId, docId, user?.email]);

  // Handle snapshot restore
  const handleRestoreSnapshot = useCallback(
    (snapshot: ProjectSnapshot) => {
      if (!snapshot.files) return;
      const restoredFiles: StudioFile[] = Object.entries(snapshot.files).map(([name, content]) => ({
        name,
        content,
      }));
      setFiles(restoredFiles);
      const targetName = (activeFileName && restoredFiles.some((f) => f.name === activeFileName))
        ? activeFileName
        : restoredFiles[0]?.name || 'main.tex';
      setActiveFileName(targetName);
      const mainContent =
        (targetName ? snapshot.files[targetName] : undefined) ||
        snapshot.files['main.tex'] ||
        Object.values(snapshot.files)[0] ||
        '';
      setSource(mainContent);
      setIsHistoryView(false);
      setHistoryToast(`Đã khôi phục thành công phiên bản ${snapshot.dateFormatted}`);
      setTimeout(() => setHistoryToast(null), 4000);
    },
    [activeFileName]
  );

  // Debounced Auto-compile (2.5 seconds after stopping typing)
  const autoCompileTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!projectSettings.autoCompile) return;
    if (autoCompileTimerRef.current) clearTimeout(autoCompileTimerRef.current);
    autoCompileTimerRef.current = setTimeout(() => {
      void compile();
    }, 2500);
    return () => {
      if (autoCompileTimerRef.current) clearTimeout(autoCompileTimerRef.current);
    };
  }, [source, projectSettings.autoCompile, compile]);

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

  // Download PDF
  const handleDownloadPDF = useCallback(() => {
    setIsProjectMenuOpen(false);
    if (pdf) {
      const link = document.createElement('a');
      link.href = pdf;
      link.download = `${docTitle.replace(/\.tex$/, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      void compile();
    }
  }, [pdf, docTitle, compile]);

  // Download project as ZIP
  const handleDownloadZip = useCallback(async () => {
    setIsProjectMenuOpen(false);
    try {
      const zip = new JSZip();
      const currentActiveText = editorViewRef.current?.state?.doc?.toString() ?? source;
      files.forEach((file) => {
        const fileContent = file.name === activeFileName ? currentActiveText : file.content;
        zip.file(file.name, fileContent);
      });
      images.forEach((img) => {
        const dataUri = img.dataUrl || img.url || '';
        if (dataUri.startsWith('data:')) {
          const base64Data = dataUri.split(',')[1];
          if (base64Data) {
            const imgPath = img.name.startsWith('images/') ? img.name : `images/${img.name}`;
            zip.file(imgPath, base64Data, { base64: true });
          }
        }
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const zipName = `${docTitle.replace(/\.tex$/, '')}.zip`;
      saveAs(blob, zipName);
    } catch (err) {
      console.error('Lỗi khi nén tệp zip:', err);
      alert('Không thể tạo tệp nén ZIP.');
    }
  }, [files, images, activeFileName, source, docTitle]);

  // Export document using format endpoint (docx, md, html)
  const handleExportFormat = useCallback(async (format: 'docx' | 'md' | 'html') => {
    setIsProjectMenuOpen(false);
    try {
      const res = await fetch('/api/latex/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          format,
          title: docTitle.replace(/\.tex$/, ''),
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Xuất tài liệu thất bại');
      }
      const blob = await res.blob();
      const ext = format === 'docx' ? 'docx' : format === 'md' ? 'md' : 'html';
      saveAs(blob, `${docTitle.replace(/\.tex$/, '')}.${ext}`);
    } catch (err: any) {
      console.error(`Lỗi xuất ${format}:`, err);
      alert(`Lỗi xuất sang ${format.toUpperCase()}: ${err.message || 'Thất bại'}`);
    }
  }, [source, docTitle]);

  // Make a copy of project
  const handleDuplicateProject = useCallback(() => {
    setIsProjectMenuOpen(false);
    const baseTitle = docTitle.replace(/\.tex$/, '');
    const newTitle = `${baseTitle} (Bản sao).tex`;
    const newProject = createNewProject('latex', newTitle, { templateId: template }, files[0]?.content || source);
    newProject.files = files;
    saveProject(newProject);
    router.push(`/latex?id=${newProject.id}`);
  }, [docTitle, files, source, template, router]);

  // Start inline rename
  const handleStartRename = useCallback(() => {
    setIsProjectMenuOpen(false);
    setTitleInput(docTitle);
    setIsEditingTitle(true);
  }, [docTitle]);

  // Multi-file management
  const handleSelectFile = (fileName: string) => {
    const targetFile = files.find((f) => f.name === fileName);
    if (!targetFile) return;

    if (activeFileName) {
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFileName ? { ...f, content: source } : f))
      );
    }

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
    const remainingFiles = files.filter((f) => f.name !== fileName);
    setFiles(remainingFiles);
    const nextTabs = openTabs.filter((t) => t !== fileName);
    setOpenTabs(nextTabs);

    if (activeFileName === fileName) {
      if (remainingFiles.length > 0) {
        const nextFile = nextTabs.length > 0
          ? remainingFiles.find((f) => f.name === nextTabs[nextTabs.length - 1]) || remainingFiles[0]
          : remainingFiles[0];
        setActiveFileName(nextFile.name);
        setSource(nextFile.content);
        if (!nextTabs.includes(nextFile.name)) {
          setOpenTabs([...nextTabs, nextFile.name]);
        }
      } else {
        setActiveFileName(null);
        setSource('');
        setOpenTabs([]);
      }
    }
  };

  const handleRenameFile = (oldName: string, newName: string) => {
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
    setOpenTabs(nextTabs);
    if (activeFileName === tabName) {
      if (nextTabs.length > 0) {
        handleSelectFile(nextTabs[nextTabs.length - 1]);
      } else {
        setActiveFileName(null);
        setSource('');
      }
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

  const handleOpenAddFilesModal = (tab: AddFilesTab = 'new_file') => {
    setAddFilesModal({ isOpen: true, defaultTab: tab });
  };

  const handleAddFileWithContent = (fileName: string, content?: string) => {
    if (files.some((f) => f.name.toLowerCase() === fileName.toLowerCase())) {
      handleSelectFile(fileName);
      return;
    }
    const newFile: StudioFile = {
      name: fileName,
      content: content !== undefined ? content : `% Tệp: ${fileName}\n% Được nhúng bằng: \\input{${fileName}}\n`,
    };
    setFiles((prev) => [...prev, newFile]);
    setOpenTabs((prev) => (prev.includes(fileName) ? prev : [...prev, fileName]));
    setActiveFileName(fileName);
    setSource(newFile.content);
  };

  const handleUploadMultipleAssets = async (uploadedFiles: File[]) => {
    for (const file of uploadedFiles) {
      if (
        file.name.endsWith('.tex') ||
        file.name.endsWith('.bib') ||
        file.name.endsWith('.cls') ||
        file.name.endsWith('.sty')
      ) {
        const text = await file.text();
        const newFile: StudioFile = { name: file.name, content: text };
        setFiles((prev) => [...prev.filter((f) => f.name !== file.name), newFile]);
        setActiveFileName(file.name);
        setSource(text);
        setOpenTabs((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]));
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setImages((prev) => [...prev, { name: file.name, dataUrl }]);
          handleInsert(`\n\\includegraphics[width=0.7\\linewidth]{${file.name}}\n`);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSetMainDocument = useCallback(
    (fileName: string) => {
      setProjectSettings((prev) => {
        const next = { ...prev, mainDocument: fileName };
        saveProjectSettings(next, currentDocId || docId);
        return next;
      });
      if (currentDocId) {
        try {
          const p = getProjectById(currentDocId);
          if (p) {
            p.metadata = { ...p.metadata, mainDocument: fileName };
            saveProject(p);
          }
        } catch {}
      }
      setHistoryToast(`Đã đặt "${fileName}" làm tài liệu chính`);
      setTimeout(() => setHistoryToast(null), 3000);
    },
    [currentDocId, docId]
  );

  // Centralized Command Execution Context
  const editorCtx: EditorExecutionContext = useMemo(
    () => ({
      insert: handleInsert,
      triggerAction: triggerEditorAction,
      openPopover: setActiveToolbarPopover,
      toggleSymbols: () => setIsSymbolsOpen((prev) => !prev),
      files,
      uploadAsset: handleUploadAsset,
    }),
    [handleInsert, triggerEditorAction, files, handleUploadAsset]
  );

  // Centralized runner for any command from Menu Bar or Toolbar
  const runCommand = useCallback(
    (commandId: string, params?: any) => {
      setActiveDesktopMenu(null);
      const cmd = EDITOR_COMMANDS[commandId];
      if (cmd) {
        cmd.execute(editorCtx, params);
      }
    },
    [editorCtx]
  );

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

      // Trigger CodeMirror layout update
      editorViewRef.current?.requestMeasure?.();
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

      // Trigger editor layout update
      editorViewRef.current?.requestMeasure?.();
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const { errors, warnings } = parseTeXLog(errorLog);

  if (isHistoryView) {
    return (
      <ProjectHistoryView
        projectId={currentDocId || docId || 'default'}
        docTitle={docTitle}
        files={files}
        onBackToEditor={() => setIsHistoryView(false)}
        onRestoreSnapshot={handleRestoreSnapshot}
        currentUserEmail={user?.email}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Overleaf Single Desktop Topbar (h-10) */}
      <header className="h-10 px-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 z-30 select-none text-xs text-slate-800 dark:text-slate-200">
        {/* Left Side: Brand Logo + Desktop Dropdown Menus */}
        <div className="flex items-center gap-1 min-w-0" ref={desktopMenuRef}>
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs tracking-tight transition shrink-0 mr-1.5 group"
            title="Về trang chủ MathAIO Studio"
          >
            <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              <MathAIOLogo className="w-full h-full" />
            </div>
            <span className="hidden sm:inline font-bold tracking-tight text-[13px] text-slate-800 dark:text-slate-100">MathAIO</span>
          </Link>

          {/* Desktop Dropdown Menus: File, Edit, Insert, View, Format, Help */}
          <div className="flex items-center gap-0.5 text-slate-700 dark:text-neutral-300 text-xs">
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
                    ? 'bg-slate-100 dark:bg-[#2a2e33] text-slate-900 dark:text-white font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-[#2a2e33] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tệp
              </button>

              {activeDesktopMenu === 'file' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded shadow-xl py-1 text-[13px] text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleOpenAddFilesModal('new_file');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Thư mục mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleOpenAddFilesModal('upload');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span>{ocrBusy ? 'Đang nhận diện OCR…' : 'Nhận diện công thức từ ảnh (OCR)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      wordInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Nhập từ Word (.docx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsIntegrationsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tích hợp ngoài (Zotero, Git…)</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      const newName = `${docTitle.replace(/\.tex$/, '')}_copy.tex`;
                      setDocTitle(newName);
                      setStorageNotice('Đã nhân bản tài liệu');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tạo bản sao</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsHistoryView(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Thống kê từ</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsShareModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Nộp bài / Xuất bản</span>
                  </button>

                  {pdf && (
                    <a
                      href={pdf}
                      download={`${docTitle.replace(/\.tex$/, '')}.pdf`}
                      onClick={() => setActiveDesktopMenu(null)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tải xuống mã nguồn (.tex)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleExportWord();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tải xuống Word (.docx)</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
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
                    ? 'bg-slate-100 dark:bg-[#2a2e33] text-slate-900 dark:text-white font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-[#2a2e33] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Chỉnh sửa
              </button>

              {activeDesktopMenu === 'edit' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded shadow-xl py-1 text-[13px] text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => runCommand('undo')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Hoàn tác</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">Ctrl+Z</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runCommand('redo')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Làm lại</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">Ctrl+Y</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => runCommand('find')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tìm kiếm & Thay thế</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">Ctrl+F</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runCommand('selectAll')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Chọn tất cả</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">Ctrl+A</span>
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
                    ? 'bg-slate-100 dark:bg-[#2a2e33] text-slate-900 dark:text-white font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-[#2a2e33] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Chèn
              </button>

              {activeDesktopMenu === 'insert' && (
                <div className="absolute left-0 top-full mt-1 w-60 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded shadow-xl py-1 text-[13px] text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => runCommand('symbols')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Ký hiệu toán học</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">Ω</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setInsertDialogType('equation');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Công thức toán học…</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">∑</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setInsertDialogType('image');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Hình ảnh (Figure)…</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setInsertDialogType('table');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Bảng biểu (Table)…</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setInsertDialogType('citation');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Trích dẫn (\cite)…</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\cite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setInsertDialogType('crossref');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tham chiếu chéo (\ref)…</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\ref</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runCommand('link')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Liên kết (\href)</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\href</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('% ');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Ghi chú (%)</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">%</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\begin{abstract}\n  \n\\end{abstract}\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tóm tắt (Abstract)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\textbf{Keywords:} LaTeX, MathAIO.\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Từ khóa (Keywords)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      handleInsert('\n\\title{Tiêu đề tài liệu}\n\\author{Tác giả}\n\\date{\\today}\n\\maketitle\n');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
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
                    ? 'bg-slate-100 dark:bg-[#2a2e33] text-slate-900 dark:text-white font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-[#2a2e33] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hiển thị
              </button>

              {activeDesktopMenu === 'view' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded shadow-xl py-1 text-[13px] text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setLayoutMode('split');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={layoutMode === 'split' ? 'text-slate-900 dark:text-white font-medium' : ''}>Chế độ chia đôi</span>
                    {layoutMode === 'split' && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLayoutMode('code');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={layoutMode === 'code' ? 'text-slate-900 dark:text-white font-medium' : ''}>Chỉ trình soạn thảo</span>
                    {layoutMode === 'code' && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLayoutMode('pdf');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={layoutMode === 'pdf' ? 'text-slate-900 dark:text-white font-medium' : ''}>Chỉ xem PDF</span>
                    {layoutMode === 'pdf' && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    disabled={!pdf}
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      if (pdf) window.open(pdf, '_blank');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span>Mở PDF trong tab mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      toggleFullscreen();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Chế độ tập trung</span>
                    {isFullscreen && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen((prev) => !prev);
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={isSidebarOpen ? 'text-slate-900 dark:text-white font-medium' : ''}>Bật/Tắt Cây thư mục</span>
                    {isSidebarOpen && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleActivityTabClick('review');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Bật/Tắt Panel Đánh giá</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleActivityTabClick('chat');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Bật/Tắt Panel Trò chuyện</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('code');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={editorMode === 'code' ? 'text-slate-900 dark:text-white font-medium' : ''}>Chế độ mã nguồn</span>
                    {editorMode === 'code' && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditorMode('visual');
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={editorMode === 'visual' ? 'text-slate-900 dark:text-white font-medium' : ''}>Chế độ trực quan (Visual)</span>
                    {editorMode === 'visual' && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen((prev) => !prev);
                      setActiveDesktopMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span className={isSidebarOpen ? 'text-slate-900 dark:text-white font-medium' : ''}>Hiện cây thư mục</span>
                    {isSidebarOpen && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    disabled={!pdf}
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsPresentation(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span>Chế độ trình chiếu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Giao diện tối</span>
                    {isDark && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>}
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
                    ? 'bg-slate-100 dark:bg-[#2a2e33] text-slate-900 dark:text-white font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-[#2a2e33] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Định dạng
              </button>

              {activeDesktopMenu === 'format' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded shadow-xl py-1 text-[13px] text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('bold');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>In đậm</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">Ctrl+B</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('italic');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>In nghiêng</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">Ctrl+I</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('underline');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Gạch chân</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\\underline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('typewriter');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Font máy đánh chữ</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\\texttt</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('listBullet');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Danh sách dấu chấm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('listNumbered');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Danh sách đánh số</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('section');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Mục chính (Section)</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\\section</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('subsection');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Mục con (Subsection)</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\\subsection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('subsubsection');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Mục con cấp 2 (Subsubsection)</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\\subsubsection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      runCommand('paragraph');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Đoạn văn (Paragraph)</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">\\paragraph</span>
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
                    ? 'bg-slate-100 dark:bg-[#2a2e33] text-slate-900 dark:text-white font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-[#2a2e33] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Trợ giúp
              </button>

              {activeDesktopMenu === 'help' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded shadow-xl py-1 text-[13px] text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsShortcutsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Phím tắt bàn phím</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      window.open('https://www.overleaf.com/learn', '_blank');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Tài liệu hướng dẫn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
                  >
                    <span>Cài đặt</span>
                  </button>

                  <div className="border-b border-slate-200 dark:border-white/10 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      window.open('/', '_blank');
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white text-left text-[13px] transition-colors cursor-pointer"
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

        {/* Center Side: Document Title Dropdown Actions & Autosave / Read-only Status */}
        <div className="flex items-center gap-2 min-w-0 max-w-[42%] justify-center">
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
              className="bg-slate-50 dark:bg-[#2a2e33] text-slate-900 dark:text-white border border-emerald-500 rounded px-2 py-0.5 text-xs font-semibold outline-none text-center truncate max-w-full"
            />
          ) : (
            <div className="relative" ref={projectMenuRef}>
              <button
                type="button"
                onClick={() => setIsProjectMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2a2e33] transition truncate max-w-full cursor-pointer group"
                title="Tác vụ dự án (Tải về, Xuất bản, Đổi tên...)"
              >
                <span className="truncate max-w-[160px] sm:max-w-[240px] md:max-w-[300px]">{docTitle}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0 transition" />
              </button>

              {isProjectMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-52 py-1 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                  >
                    Tải xuống PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                  >
                    Tải mã nguồn (.zip)
                  </button>

                  <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={() => handleExportFormat('docx')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                  >
                    Xuất sang Word (.docx)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportFormat('md')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                  >
                    Xuất sang Markdown (.md)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportFormat('html')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                  >
                    Xuất sang HTML (.html)
                  </button>

                  <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={handleDuplicateProject}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                  >
                    Tạo bản sao
                  </button>

                  <button
                    type="button"
                    onClick={handleStartRename}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                  >
                    Đổi tên
                  </button>
                </div>
              )}
            </div>
          )}

          {isReadOnly ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0 select-none">
              <Eye className="w-3 h-3" />
              <span>Chỉ xem</span>
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{storageNotice || 'Tự động lưu'}</span>
            </span>
          )}
        </div>

        {/* Right Side: History, Layout, Share, Theme Toggle, Fullscreen Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {/* History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryView(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2a2e33] transition cursor-pointer"
            title="Lịch sử phiên bản (History)"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Layout Dropdown */}
          <div className="relative" ref={layoutMenuRef}>
            <button
              type="button"
              onClick={() => setIsLayoutMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2a2e33] transition cursor-pointer"
              title="Bố cục hiển thị (Layout)"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
              <span className="hidden sm:inline">Layout</span>
              <ChevronDown className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
            </button>

            {isLayoutMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1e2124] border border-slate-200 dark:border-[#3e444b] rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in duration-100 select-none text-slate-700 dark:text-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('code');
                    setIsLayoutMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition cursor-pointer ${
                    layoutMode === 'code' ? 'bg-slate-100 dark:bg-[#2a2e33] text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2a2e33] hover:text-slate-900 dark:hover:text-white'
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
                    layoutMode === 'split' ? 'bg-slate-100 dark:bg-[#2a2e33] text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2a2e33] hover:text-slate-900 dark:hover:text-white'
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
                    layoutMode === 'pdf' ? 'bg-slate-100 dark:bg-[#2a2e33] text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2a2e33] hover:text-slate-900 dark:hover:text-white'
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-[#2a2e33] hover:bg-emerald-100 dark:hover:bg-[#343a40] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
            title="Chia sẻ & Xuất bản"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất bản</span>
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
          className="w-11 h-full bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col justify-between items-center py-2.5 z-30 select-none"
        >
          {/* Top Group: Files, Search, AI Assistant */}
          <div className="flex flex-col items-center gap-2 w-full">
            {/* File button */}
            <button
              type="button"
              onClick={() => handleActivityTabClick('files')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center ${
                isSidebarOpen && activeActivityTab === 'files'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
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
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
              title="Tìm kiếm & Thay thế toàn dự án (Search)"
            >
              {isSidebarOpen && activeActivityTab === 'search' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
              )}
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Review / Comments button */}
            <button
              type="button"
              onClick={() => handleActivityTabClick('review')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center ${
                isSidebarOpen && activeActivityTab === 'review'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
              title="Đánh giá & Bình luận (Review & Track Changes)"
            >
              {isSidebarOpen && activeActivityTab === 'review' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
              )}
              <MessageSquare className="w-4.5 h-4.5" />
              {comments.filter((c) => !c.resolved).length > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {comments.filter((c) => !c.resolved).length}
                </span>
              )}
            </button>

            {/* Chat button */}
            <button
              type="button"
              onClick={() => handleActivityTabClick('chat')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center ${
                isSidebarOpen && activeActivityTab === 'chat'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
              title="Trò chuyện nhóm (Project Chat)"
            >
              {isSidebarOpen && activeActivityTab === 'chat' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
              )}
              <MessageCircle className="w-4.5 h-4.5" />
            </button>

            {/* Integrations button */}
            <button
              type="button"
              onClick={() => setIsIntegrationsOpen(true)}
              className="relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100"
              title="Tích hợp nguồn ngoài (Zotero, Mendeley, Git, Cloud)"
            >
              <FolderSync className="w-4.5 h-4.5" />
            </button>

            {/* AI Assistant button */}
            <button
              type="button"
              onClick={() => handleActivityTabClick('ai')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer group flex items-center justify-center ${
                isSidebarOpen && activeActivityTab === 'ai'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-indigo-600/80 dark:text-indigo-400/80 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-700 dark:hover:text-indigo-300'
              }`}
              title="Trợ lý AI soạn thảo & sửa lỗi"
            >
              {isSidebarOpen && activeActivityTab === 'ai' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r" />
              )}
              {aiBusy ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-500" />
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
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  isSettingsOpen
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Cài đặt dự án (Ctrl+,)"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Help / Shortcuts button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsShortcutsOpen((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  isShortcutsOpen
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Phím tắt thao tác & Trợ giúp"
              >
                <HelpCircle className="w-4.5 h-4.5" />
              </button>

              {isShortcutsOpen && (
                <div className="absolute left-full bottom-0 ml-2 w-72 bg-white dark:bg-[#1e2124] border border-slate-200 dark:border-[#3e444b] rounded-xl shadow-2xl p-3.5 z-50 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10 font-bold">
                    <span>Phím tắt thao tác nhanh</span>
                    <button
                      type="button"
                      onClick={() => setIsShortcutsOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400">Biên dịch mã (Recompile)</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#2a2e33] rounded text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">Ctrl + Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400">Tìm kiếm & Thay thế</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#2a2e33] rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">Ctrl + F</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400">Hoàn tác / Làm lại</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#2a2e33] rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">Ctrl + Z / Y</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400">In đậm / In nghiêng</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#2a2e33] rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">Ctrl + B / I</kbd>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400">Đồng bộ SyncTeX</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-mono text-[10px]">Cụm nút giữa 2 cột</span>
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
            className="file-tree-sidebar h-full overflow-hidden border-r border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col flex-shrink-0 shrink-0 bg-white dark:bg-slate-950"
          >
            {activeActivityTab === 'files' && (
              <FileTreeExplorer
                files={files}
                activeFileName={activeFileName}
                mainDocument={projectSettings.mainDocument || 'main.tex'}
                source={source}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onSetMainDocument={handleSetMainDocument}
                onUploadAsset={handleUploadAsset}
                onOpenAddFilesModal={handleOpenAddFilesModal}
                onJumpToLine={(line) => setTargetLine(line)}
                isCollapsed={false}
                onToggleCollapse={() => setIsSidebarOpen(false)}
              />
            )}

            {activeActivityTab === 'search' && (
              <div className="h-full flex flex-col overflow-hidden text-xs select-none">
                {/* Search Header */}
                <div className="w-full h-8 flex items-center justify-between px-2 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#181a1d] select-none flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
                    <Search className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-700 dark:text-neutral-300">Tìm kiếm</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                    title="Đóng bảng điều khiển"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search Form (Overleaf Style) */}
                <div className="border-b border-slate-200 dark:border-white/5 shrink-0">
                  {/* Row 1: Input + Green Search Button */}
                  <div className="flex items-center gap-1.5 px-2 pt-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm trong tất cả tệp..."
                      className="flex-1 bg-slate-100 dark:bg-[#1e2227] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {}}
                      className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      Tìm kiếm
                    </button>
                  </div>

                  {/* Row 2: Aa, .*, W filter toggle buttons */}
                  <div className="flex items-center gap-1 px-2 pt-1.5 pb-2">
                    <button
                      type="button"
                      onClick={() => setMatchCase(!matchCase)}
                      className={`px-1.5 py-0.5 text-[11px] rounded font-mono border transition-colors cursor-pointer ${
                        matchCase
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/50'
                          : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-white/5'
                      }`}
                      title="Khớp chữ hoa/thường (Match Case)"
                    >
                      Aa
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseRegex(!useRegex)}
                      className={`px-1.5 py-0.5 text-[11px] rounded font-mono border transition-colors cursor-pointer ${
                        useRegex
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/50'
                          : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-white/5'
                      }`}
                      title="Biểu thức chính quy (Regex)"
                    >
                      .*
                    </button>
                    <button
                      type="button"
                      onClick={() => setWholeWord(!wholeWord)}
                      className={`px-1.5 py-0.5 text-[11px] rounded font-mono border transition-colors cursor-pointer ${
                        wholeWord
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/50'
                          : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-white/5'
                      }`}
                      title="Khớp nguyên từ (Whole Word)"
                    >
                      W
                    </button>
                  </div>
                </div>

                {/* Match Results Count & List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Kết quả ({searchMatches.length})</span>
                    {searchQuery && (
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
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
                        className="w-full text-left p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#252a2e] text-slate-700 dark:text-slate-300 transition text-[11px] font-mono cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                      >
                        <span className="text-cyan-600 dark:text-cyan-500 font-bold mr-1.5">L{m.line}:</span>
                        <span className="truncate">{m.text.trim()}</span>
                      </button>
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-6 text-slate-400 dark:text-neutral-500 text-xs">
                      Không tìm thấy kết quả phù hợp
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 dark:text-neutral-500 text-xs">
                      Nhập từ khóa để bắt đầu tìm kiếm
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeActivityTab === 'ai' && (
              <div className="h-full flex flex-col overflow-hidden text-xs select-none">
                {/* AI Header */}
                <div className="w-full h-8 flex items-center justify-between px-2 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#181a1d] select-none flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-semibold text-[11px] uppercase tracking-wider">TRỢ LÝ AI SOẠN THẢO</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                    title="Đóng bảng điều khiển"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* AI Prompts & Chat Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3">
                  {/* Preset quick actions */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Gợi ý tác vụ nhanh
                    </span>
                    <div className="space-y-1">
                      {[
                        { id: 'exam', label: 'Soạn 5 câu trắc nghiệm Toán (A-B-C-D)', icon: <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> },
                        { id: 'solution', label: 'Viết lời giải chi tiết theo từng bước', icon: <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> },
                        { id: 'tikz', label: 'Tạo khối hình học không gian TikZ', icon: <Shapes className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> },
                        { id: 'table', label: 'Lập bảng biến thiên hàm số', icon: <Sigma className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> },
                        { id: 'fix', label: 'Tự động sửa lỗi cú pháp LaTeX', icon: <WandSparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> },
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
                          className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252a2e] hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/5 disabled:opacity-50 text-[11px]"
                        >
                          {p.icon}
                          <span className="truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Status / Output Notice */}
                  {aiBusy && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500 dark:text-indigo-400 shrink-0" />
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
                  className="p-2 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-slate-950/30"
                >
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={aiPromptText}
                      onChange={(e) => setAiPromptText(e.target.value)}
                      placeholder="Nhập yêu cầu cho AI (vd: tạo bài toán ma trận, vẽ hình chóp...)"
                      className="w-full bg-slate-100 dark:bg-[#141618] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-neutral-500 outline-none pr-8 resize-none focus:border-indigo-500"
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

            {activeActivityTab === 'review' && (
              <ReviewPanel
                comments={comments}
                onAddComment={handleAddComment}
                onResolveComment={handleResolveComment}
                onDeleteComment={handleDeleteComment}
                onReplyComment={handleReplyComment}
                onJumpToLine={(line, file) => {
                  if (file && file !== activeFileName && files.some((f) => f.name === file)) {
                    handleSelectFile(file);
                  }
                  setTargetLine(line);
                  if (layoutMode === 'pdf') {
                    setLayoutMode('split');
                  }
                }}
                activeFileName={activeFileName || 'main.tex'}
                trackChangesEnabled={trackChangesEnabled}
                onToggleTrackChanges={(en) => setTrackChangesEnabled(en)}
                currentUserEmail={user?.email}
              />
            )}

            {activeActivityTab === 'chat' && (
              <ChatPanel
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onInsertCodeSnippet={(snip) => handleInsert(snip)}
                currentUserEmail={user?.email || 'Bạn'}
              />
            )}
          </div>
        )}

        {/* RESIZER 1: SIDEBAR RESIZER (60px - 450px, snap 20px) */}
        <div
          onMouseDown={handleMouseDownSidebarDivider}
          className={`relative w-2 flex-shrink-0 shrink-0 flex flex-col items-center justify-center cursor-col-resize select-none transition-colors z-30 group ${
            resizingTarget === 'sidebar'
              ? 'bg-neutral-400 dark:bg-neutral-600/50'
              : 'bg-slate-200 dark:bg-[#1e2124] hover:bg-slate-300 dark:hover:bg-neutral-600/50 border-r border-slate-300 dark:border-white/5'
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
              className="w-3 h-10 bg-white dark:bg-[#20262b] border border-slate-300 dark:border-white/10 rounded-[2px] text-slate-600 dark:text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto z-40 relative shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300 hover:shadow-[0_0_8px_rgba(34,197,94,0.45)]"
              title={sidebarWidth <= 0 ? "Mở rộng bảng điều khiển" : "Thu gọn bảng điều khiển"}
            >
              {sidebarWidth <= 0 ? (
                <ChevronRight className="w-2.5 h-2.5" />
              ) : (
                <ChevronLeft className="w-2.5 h-2.5" />
              )}
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 dark:bg-[#111315] border border-slate-700 dark:border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/sbc:opacity-100 transition-opacity duration-150 z-50">
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
            {!activeFileName ? (
              <div className="flex-1 w-full h-full flex flex-col items-center justify-start bg-[#0b0f19] dark:bg-[#090d16] select-none pt-24 overflow-hidden">
                <p className="text-slate-400 text-base text-center select-none px-4">
                  Hiện tại chưa có tệp nào được chọn. Vui lòng chọn một tệp từ cây thư mục.
                </p>
                <div className="w-64 h-64 opacity-10 select-none pointer-events-none mt-16 flex items-center justify-center">
                  <MathAIOLogo className="w-full h-full" />
                </div>
              </div>
            ) : (
              <>
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
                  onClick={() => handleOpenAddFilesModal('new_file')}
                  className="p-0.5 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
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
                <div className="absolute inset-0 z-30 bg-slate-100 dark:bg-[#1e2327] select-none pointer-events-none" />
              )}

              <div className={`flex flex-col h-full w-full overflow-hidden ${isResizing ? 'invisible pointer-events-none' : ''}`}>
                {/* Overleaf Flat Editor Ribbon */}
                <div
                  ref={toolbarRef}
                  className="h-9 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 select-none z-30 relative shrink-0 text-slate-700 dark:text-slate-200"
                >
                  {/* Left tools group */}
                  <div className="flex items-center gap-0.5 relative">
                    {/* Undo & Redo */}
                    <button
                      type="button"
                      onClick={() => runCommand('undo')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 transition cursor-pointer"
                      title="Hoàn tác (Undo / Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => runCommand('redo')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 transition cursor-pointer"
                      title="Làm lại (Redo / Ctrl+Y)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="h-3 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

                    {/* Heading Dropdown (T^v) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveToolbarPopover(
                            activeToolbarPopover === 'heading' ? null : 'heading'
                          )
                        }
                        className={`px-1.5 h-6 flex items-center gap-0.5 rounded-sm transition cursor-pointer text-xs ${
                          activeToolbarPopover === 'heading'
                            ? 'bg-slate-100 dark:bg-white/15 text-slate-900 dark:text-white font-medium'
                            : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300'
                        }`}
                        title="Tiêu đề & Đề mục (Heading)"
                      >
                        <Type className="w-3.5 h-3.5" />
                        <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                      </button>

                      {activeToolbarPopover === 'heading' && (
                        <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded-lg shadow-2xl py-1 text-xs text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                          <button
                            type="button"
                            onClick={() => setActiveToolbarPopover(null)}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-[#2c3238] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-xs"
                          >
                            Văn bản thường (Normal)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('section');
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-[#2c3238] text-slate-900 dark:text-neutral-100 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer font-bold text-sm"
                          >
                            Section
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('subsection');
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-[#2c3238] text-slate-800 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer font-semibold text-xs"
                          >
                            Subsection
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('subsubsection');
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-[#2c3238] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer font-medium text-[11px]"
                          >
                            Subsubsection
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="h-3 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

                    {/* Bold */}
                    <button
                      type="button"
                      onClick={() => runCommand('bold')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm font-bold hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 font-serif text-xs transition cursor-pointer"
                      title="In đậm (\textbf{...})"
                    >
                      B
                    </button>

                    {/* Italic */}
                    <button
                      type="button"
                      onClick={() => runCommand('italic')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm italic font-serif hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 text-xs transition cursor-pointer"
                      title="In nghiêng (\textit{...})"
                    >
                      I
                    </button>

                    <span className="h-3 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

                    {/* Math Button with Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveToolbarPopover(
                            activeToolbarPopover === 'math' ? null : 'math'
                          )
                        }
                        className={`p-1 h-6 w-6 flex items-center justify-center rounded-sm transition cursor-pointer ${
                          activeToolbarPopover === 'math'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300'
                        }`}
                        title="Chèn công thức toán (Insert math)"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <path d="M7 8h4M14 7l4 4m0-4l-4 4M7 16h4M9 14v4M14 15.5h4M14 18h4" />
                        </svg>
                      </button>

                      {activeToolbarPopover === 'math' && (
                        <div className="absolute left-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1e2227] border border-slate-200 dark:border-white/10 rounded shadow-xl p-1 text-xs text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                          <div className="text-slate-500 dark:text-neutral-400 text-xs px-2 py-1 font-medium">
                            Insert math
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('symbols');
                            }}
                            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors text-left cursor-pointer text-xs font-medium"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <span>✨ From text or image</span>
                          </button>
                          <div className="border-t border-slate-200 dark:border-white/5 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('mathInline');
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#2c3238] text-slate-800 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">\(x\)</span>
                              <span>Inline</span>
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">\( | \)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('mathDisplay');
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#2c3238] text-slate-800 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">\[x\]</span>
                              <span>Display</span>
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">\[\n \n\]</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Symbol Button (Ω) - Directly toggles Bottom Panel */}
                    <button
                      type="button"
                      onClick={() => runCommand('symbols')}
                      className={`p-1 h-6 w-6 flex items-center justify-center rounded-sm font-serif font-bold text-xs transition cursor-pointer ${
                        isSymbolsOpen
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40 shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300'
                      }`}
                      title="Bảng ký hiệu toán học MathType (Omega Ω)"
                    >
                      Ω
                    </button>

                    {/* Image Button with Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveToolbarPopover(
                            activeToolbarPopover === 'image' ? null : 'image'
                          )
                        }
                        className={`p-1 h-6 w-6 flex items-center justify-center rounded-sm transition cursor-pointer ${
                          activeToolbarPopover === 'image'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300'
                        }`}
                        title="Chèn hình ảnh (Insert image)"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>

                      {activeToolbarPopover === 'image' && (
                        <div className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded-lg shadow-2xl py-1.5 text-xs text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                          <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/5 mb-1">
                            Insert image
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('imageUpload');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <span>Upload from computer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('imageFromProject');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                          >
                            <Files className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <span>From project files</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('figure');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                          >
                            <FolderPlus className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>From another project</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('imageFromUrl');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2c3238] hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                          >
                            <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>From URL</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Table Button with 10x10 Matrix Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveToolbarPopover(
                            activeToolbarPopover === 'table' ? null : 'table'
                          )
                        }
                        className={`p-1 h-6 w-6 flex items-center justify-center rounded-sm transition cursor-pointer ${
                          activeToolbarPopover === 'table'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300'
                        }`}
                        title="Chèn bảng (Insert table)"
                      >
                        <Table className="w-3.5 h-3.5" />
                      </button>

                      {activeToolbarPopover === 'table' && (
                        <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-white/10 rounded-lg shadow-2xl p-3 text-xs text-slate-700 dark:text-neutral-300 z-50 select-none animate-in fade-in duration-100">
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                            Insert table
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveToolbarPopover(null);
                              runCommand('table', { rows: 3, cols: 3 });
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors text-left cursor-pointer mb-2.5 border border-emerald-500/20"
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium text-[11px]">✨ From text or image</span>
                          </button>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1.5 font-medium">
                            <span>Select size</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {tableHoverSize.rows > 0 && tableHoverSize.cols > 0
                                ? `${tableHoverSize.rows} × ${tableHoverSize.cols}`
                                : '10 × 10'}
                            </span>
                          </div>

                          {/* 10x10 Matrix Grid */}
                          <div
                            className="grid grid-cols-10 gap-1 p-1.5 bg-slate-50 dark:bg-[#141618] rounded border border-slate-200 dark:border-white/5"
                            onMouseLeave={() => setTableHoverSize({ rows: 0, cols: 0 })}
                          >
                            {Array.from({ length: 10 }).map((_, rIdx) =>
                              Array.from({ length: 10 }).map((_, cIdx) => {
                                const r = rIdx + 1;
                                const c = cIdx + 1;
                                const isHighlighted =
                                  r <= tableHoverSize.rows && c <= tableHoverSize.cols;
                                return (
                                  <div
                                    key={`${r}-${c}`}
                                    onMouseEnter={() =>
                                      setTableHoverSize({ rows: r, cols: c })
                                    }
                                    onClick={() => {
                                      setActiveToolbarPopover(null);
                                      runCommand('table', { rows: r, cols: c });
                                    }}
                                    className={`w-4 h-4 rounded-xs border cursor-pointer transition-colors ${
                                      isHighlighted
                                        ? 'bg-emerald-500/40 border-emerald-500'
                                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/50'
                                    }`}
                                    title={`${r} hàng × ${c} cột`}
                                  />
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Link */}
                    <button
                      type="button"
                      onClick={() => runCommand('link')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 transition cursor-pointer"
                      title="Chèn liên kết (\href{...})"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Quote */}
                    <button
                      type="button"
                      onClick={() => runCommand('quote')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 transition cursor-pointer"
                      title="Trích dẫn (\begin{quote}...)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>

                    {/* Code */}
                    <button
                      type="button"
                      onClick={() => runCommand('typewriter')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 transition cursor-pointer"
                      title="Đoạn mã (\texttt{...})"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>

                    {/* More (...) */}
                    <button
                      type="button"
                      onClick={() => runCommand('symbols')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 transition cursor-pointer"
                      title="Thêm công cụ / Bảng ký hiệu"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right tools group: [ Code | Visual ], [ Editing / Reviewing ], Search */}
                  <div className="flex items-center gap-2">
                    {/* Pill Toggle Code | Visual */}
                    <div className="flex items-center bg-slate-100 dark:bg-[#181a1d] p-0.5 rounded border border-slate-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditorMode('code')}
                        className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          editorMode === 'code'
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('visual')}
                        className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          editorMode === 'visual'
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Visual
                      </button>
                    </div>

                    {/* Review Mode Dropdown */}
                    <select
                      aria-label="Chế độ làm việc"
                      value={reviewMode}
                      onChange={(e) => setReviewMode(e.target.value as any)}
                      className="h-6 bg-slate-100 dark:bg-[#181a1d] border border-slate-200 dark:border-white/10 rounded px-1.5 text-xs font-medium text-slate-700 dark:text-neutral-300 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-white/20"
                    >
                      <option value="editing" className="bg-white dark:bg-[#1e2226] text-slate-800 dark:text-slate-200">Editing ▾</option>
                      <option value="reviewing" className="bg-white dark:bg-[#1e2226] text-slate-800 dark:text-slate-200">Reviewing</option>
                    </select>

                    {/* Search in File */}
                    <button
                      type="button"
                      onClick={() => runCommand('find')}
                      className="p-1 h-6 w-6 flex items-center justify-center rounded text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                      title="Tìm kiếm trong tệp (Ctrl+F)"
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
                fontSize={projectSettings.fontSize || fontSize}
                settings={projectSettings}
                readOnly={isReadOnly}
                onCompile={compile}
                insertRequest={insertRequest}
                editorActionRequest={editorActionRequest}
                onCursorLine={handleSyncCodeToPDF}
                targetLine={targetLine}
                errors={errors}
                onMount={(view) => {
                  editorViewRef.current = view;
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
    </>
  )}
</section>

        {/* RESIZER 2: SPLIT RESIZER & SYNCTEX ARROWS (Overleaf Split Gutter) */}
        {layoutMode !== 'pdf' && (
          <div
            onMouseDown={handleMouseDownEditorPdfDivider}
            className={`relative w-2 flex-shrink-0 shrink-0 flex flex-col items-center justify-center cursor-col-resize select-none transition-colors z-30 group ${
              resizingTarget === 'editor-pdf'
                ? 'bg-neutral-400 dark:bg-neutral-600/50'
                : 'bg-slate-200 dark:bg-[#1e2124] hover:bg-slate-300 dark:hover:bg-neutral-600/50 border-x border-slate-300 dark:border-white/5'
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
                    className="w-5 h-5 bg-white dark:bg-[#20262b] border border-slate-200 dark:border-white/10 rounded-[3px] text-slate-600 dark:text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300"
                    title="Nhảy đến vị trí trong PDF"
                  >
                    <ArrowRight className="w-3 h-3 text-slate-500 dark:text-neutral-400 group-hover/synctop:text-emerald-600 dark:group-hover/synctop:text-emerald-300 transition-colors" />
                  </button>
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 dark:bg-[#111315] border border-slate-700 dark:border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/synctop:opacity-100 transition-opacity duration-150 z-50">
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
                    className="w-5 h-5 bg-white dark:bg-[#20262b] border border-slate-200 dark:border-white/10 rounded-[3px] text-slate-600 dark:text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300"
                    title="Nhảy đến dòng mã nguồn"
                  >
                    <ArrowLeft className="w-3 h-3 text-slate-500 dark:text-neutral-400 group-hover/syncbot:text-emerald-600 dark:group-hover/syncbot:text-emerald-300 transition-colors" />
                  </button>
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 dark:bg-[#111315] border border-slate-700 dark:border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/syncbot:opacity-100 transition-opacity duration-150 z-50">
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
                className="w-3 h-10 bg-white dark:bg-[#20262b] border border-slate-200 dark:border-white/10 rounded-[2px] text-slate-600 dark:text-neutral-400 flex items-center justify-center cursor-pointer pointer-events-auto z-40 relative shadow-xs transition-all duration-150 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300"
                title={layoutMode === 'code' ? 'Mở rộng khung PDF' : 'Thu gọn khung PDF'}
              >
                {layoutMode === 'code' ? (
                  <ChevronLeft className="w-2.5 h-2.5" />
                ) : (
                  <ChevronRight className="w-2.5 h-2.5" />
                )}
              </button>
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 dark:bg-[#111315] border border-slate-700 dark:border-white/10 rounded text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover/pdfcol:opacity-100 transition-opacity duration-150 z-50">
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
            flex: '1 1 0%',
            minWidth: 0,
            minHeight: 0,
            height: '100%',
            overflow: 'hidden',
          }}
          className={`min-w-[60px] flex-1 min-h-0 h-full overflow-hidden relative flex flex-col bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs ${
            isResizing ? 'select-none pointer-events-none' : ''
          }`}
        >
          {/* Solid Blank Canvas during Dragging */}
          {isResizing && (
            <div className="absolute inset-0 z-30 bg-slate-100 dark:bg-[#1e2327] select-none pointer-events-none" />
          )}

          <div className={`flex flex-col h-full w-full overflow-hidden ${isResizing ? 'invisible pointer-events-none' : ''}`}>
            {/* Overleaf Authentic Viewer Toolbar */}
          <div className="flex justify-between items-center px-2.5 h-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 text-xs overflow-hidden select-none text-slate-700 dark:text-slate-200">
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
                  {projectSettings.draftMode && (
                    <span className="text-[9px] font-semibold bg-emerald-900/60 text-emerald-200 px-1 py-0.2 rounded">Draft</span>
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

              {/* Quick Download PDF & Popout PDF */}
              {pdf && (
                <>
                  <a
                    href={pdf}
                    download={`${docTitle.replace(/\.tex$/, '')}.pdf`}
                    className="h-6 w-6 flex items-center justify-center rounded-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shrink-0"
                    title="Tải PDF nhanh về máy"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (pdf) {
                        window.open(pdf, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shrink-0"
                    title="Mở PDF trong tab / cửa sổ mới (Overleaf PDF Popout)"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  </button>
                </>
              )}

              {/* Overleaf Logs Button with Badge */}
              <button
                type="button"
                onClick={() => setOutputView(outputView === 'console' ? 'pdf' : 'console')}
                className={`h-6 inline-flex items-center gap-1.5 px-2 rounded-sm text-[11px] font-medium transition cursor-pointer border shrink-0 ${
                  errors.length > 0 || status === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25'
                    : warnings.length > 0
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25'
                }`}
                title={outputView === 'console' ? 'Quay lại xem PDF' : 'Mở bảng nhật ký & lỗi biên dịch'}
              >
                {errors.length > 0 || status === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                ) : warnings.length > 0 ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                {pdfWidth >= 400 && <span>Logs</span>}
                <div className="flex items-center gap-1">
                  {(errors.length > 0 || status === 'error') && (
                    <span className="px-1 py-0.1 rounded-full text-[9px] font-bold bg-rose-500 text-white">
                      {errors.length > 0 ? errors.length : 1}
                    </span>
                  )}
                  {warnings.length > 0 && (
                    <span className="px-1 py-0.1 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 dark:text-slate-900">
                      {warnings.length}
                    </span>
                  )}
                  {errors.length === 0 && status !== 'error' && warnings.length === 0 && (
                    <span className="px-1 py-0.1 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                      0
                    </span>
                  )}
                </div>
              </button>

              {outputView === 'console' && (
                <button
                  type="button"
                  onClick={() => setOutputView('pdf')}
                  className="h-6 px-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
                >
                  Xem PDF
                </button>
              )}
            </div>

            {/* Right Group: Page Navigator + Zoom */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Horizontal Page Counter: < Trang 1 / 1 > */}
              <div className="h-6 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-sm px-1 border border-slate-200 dark:border-slate-700 shrink-0 text-[11px] font-mono text-slate-700 dark:text-slate-200">
                <button
                  type="button"
                  disabled={pdfCurrentPage <= 1}
                  onClick={() => {
                    const prev = Math.max(1, pdfCurrentPage - 1);
                    setPdfCurrentPage(prev);
                    setJumpToPage(prev);
                  }}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>

                <div className="flex items-center px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-200">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1 font-sans">Trang</span>
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
                    className="w-4 text-center bg-transparent border-0 outline-none text-[11px] font-mono text-slate-800 dark:text-slate-100 p-0"
                  />
                  <span className="text-slate-400 dark:text-slate-500">/</span>
                  <span className="ml-0.5 text-slate-500 dark:text-slate-400">{pdfTotalPages || 1}</span>
                </div>

                <button
                  type="button"
                  disabled={pdfCurrentPage >= (pdfTotalPages || 1)}
                  onClick={() => {
                    const next = Math.min(pdfTotalPages || 1, pdfCurrentPage + 1);
                    setPdfCurrentPage(next);
                    setJumpToPage(next);
                  }}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Trang kế tiếp"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Zoom Controls: - [%] + */}
              <div className="h-6 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-sm px-1 border border-slate-200 dark:border-slate-700 shrink-0 text-[11px] text-slate-700 dark:text-slate-200">
                <button
                  type="button"
                  disabled={!pdf}
                  onClick={() => setZoom((z) => Math.max(25, (typeof z === 'number' ? z : 100) - 25))}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>

                <span className="font-mono text-[10px] px-1 text-slate-700 dark:text-slate-200 min-w-6 text-center">
                  {typeof zoom === 'number' ? `${zoom}%` : 'Rộng'}
                </span>

                <button
                  type="button"
                  disabled={!pdf}
                  onClick={() => setZoom((z) => Math.min(300, (typeof z === 'number' ? z : 100) + 25))}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Output Body */}
          <div className="flex-1 min-h-0 w-full h-full flex flex-col relative overflow-hidden bg-slate-200 dark:bg-[#525659]">
            {outputView === 'pdf' ? (
              pdf ? (
                <div className="flex-1 min-h-0 w-full h-full flex flex-col relative overflow-hidden bg-slate-200 dark:bg-[#525659]">
                  {source !== compiledSource && (
                    <div
                      role="status"
                      className="text-xs px-3 py-1 bg-amber-500/20 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center justify-between shrink-0 w-full z-10"
                    >
                      <span className="truncate">Mã nguồn đã sửa đổi. Bấm Recompile để cập nhật PDF.</span>
                      <button
                        onClick={() => void compile()}
                        className="underline font-bold hover:text-amber-950 dark:hover:text-white cursor-pointer ml-2 shrink-0"
                      >
                        Cập nhật
                      </button>
                    </div>
                  )}
                  <PDFPreview
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
                    invertColors={projectSettings.pdfInvertColors}
                  />
                </div>
              ) : status === 'compiling' ? (
                <div className="flex-1 min-h-0 w-full h-full flex flex-col justify-center items-center p-6 text-center text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900">
                  <div className="w-full max-w-sm flex flex-col items-center p-8 text-center bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-3 animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Đang biên dịch tài liệu…
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hệ thống đang xử lý mã LaTeX và tạo trang PDF xem trước.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 w-full h-full overflow-y-auto flex flex-col justify-center items-center p-4 text-center text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900">
                  <div className="w-full max-w-sm flex flex-col items-center p-6 text-center bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center mb-3 shadow-xs shrink-0">
                      <FileText className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Chưa có tài liệu PDF
                    </p>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-4 max-w-full">
                      Bấm nút <strong className="text-emerald-600 dark:text-emerald-400">“Recompile”</strong> màu xanh phía trên (Ctrl+Enter) để biên dịch tài liệu PDF.
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
                onJumpToLine={(line, file) => {
                  if (file && file !== activeFileName && files.some((f) => f.name === file)) {
                    handleSelectFile(file);
                  }
                  setTargetLine(line);
                  if (layoutMode === 'pdf') {
                    setLayoutMode('split');
                  }
                }}
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

      {/* Toast Notification */}
      {historyToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{historyToast}</span>
        </div>
      )}

      {/* Share / Phân quyền Modal */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        docId={currentDocId || docId || 'default'}
        docTitle={docTitle}
      />

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
            {syncStatus === 'saving' && <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />}
            {syncStatus === 'saved' && <Check className="w-3 h-3 text-emerald-400" />}
            {syncStatus === 'offline' && <Save className="w-3 h-3 text-amber-400" />}
            {syncStatus === 'conflict' && <AlertTriangle className="w-3 h-3 text-red-400" />}
            {syncStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
            <span
              className={
                syncStatus === 'conflict'
                  ? 'text-red-400 font-semibold'
                  : syncStatus === 'saved'
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {storageNotice}
            </span>
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
      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={projectSettings}
        onUpdateSettings={handleUpdateSettings}
        texFiles={files.filter((f) => f.name.endsWith('.tex')).map((f) => f.name)}
      />

      {/* Add Files Modal (Overleaf 4-tab style) */}
      <AddFilesModal
        isOpen={addFilesModal.isOpen}
        onClose={() => setAddFilesModal((prev) => ({ ...prev, isOpen: false }))}
        defaultTab={addFilesModal.defaultTab}
        currentDocId={currentDocId || docId}
        existingFileNames={files.map((f) => f.name)}
        onAddFile={handleAddFileWithContent}
        onUploadFiles={handleUploadMultipleAssets}
      />

      {/* Integrations Modal (Zotero, Mendeley, Git, Cloud Export) */}
      <IntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        onImportBibTeX={handleImportBibTeX}
      />

      {/* Insert Dialogs (Table, Figure, Equation, Citation, Cross-Ref) */}
      <InsertDialogs
        type={insertDialogType}
        onClose={() => setInsertDialogType(null)}
        onInsertText={handleInsert}
        projectImages={images}
      />
    </div>
  );
}
