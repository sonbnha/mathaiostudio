'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [engine, setEngine] = useState<'xelatex' | 'pdflatex' | 'lualatex'>('xelatex');

  // AI & Async busy flags
  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [ocrBusy, setOcrBusy] = useState<boolean>(false);
  const [fixBusy, setFixBusy] = useState<boolean>(false);

  // File Inputs
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // Resizer dragging state
  const isDraggingRef = useRef(false);
  const mainContainerRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const pdfSectionRef = useRef<HTMLElement>(null);
  const [pdfWidth, setPdfWidth] = useState<number>(600);

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
  const [isUtilsMenuOpen, setIsUtilsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const utilsMenuRef = useRef<HTMLDivElement>(null);

  // Sync titleInput when docTitle changes
  useEffect(() => {
    setTitleInput(docTitle);
  }, [docTitle]);

  // Close utils menu on outside click
  useEffect(() => {
    if (!isUtilsMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (utilsMenuRef.current && !utilsMenuRef.current.contains(e.target as Node)) {
        setIsUtilsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isUtilsMenuOpen]);

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

  // Divider dragging with strict min-width constraints (Editor >= 350px, PDF >= 350px, 30% - 70%)
  const handleMouseDownDivider = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startX = e.clientX;
    const initialRatio = splitRatio;

    const wsEl = workspaceRef.current;
    const wsWidth = wsEl ? wsEl.clientWidth : (window.innerWidth - (isFileTreeCollapsed ? 48 : 256) - 16);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = wsWidth > 0 ? (deltaX / wsWidth) * 100 : 0;
      let targetRatio = initialRatio + deltaPercent;

      // Bound between 30% and 70%
      targetRatio = Math.min(70, Math.max(30, targetRatio));

      // Strictly ensure Editor >= 350px and PDF >= 350px
      if (wsWidth > 0) {
        const minPercent = (350 / wsWidth) * 100;
        const maxPercent = 100 - (350 / wsWidth) * 100;
        if (minPercent < maxPercent) {
          targetRatio = Math.min(maxPercent, Math.max(minPercent, targetRatio));
        } else {
          targetRatio = 50;
        }
      }

      setSplitRatio(targetRatio);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const { errors, warnings } = parseTeXLog(errorLog);

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Overleaf Single Desktop Topbar (h-10) */}
      <header className="h-10 px-3 bg-[#1e2124] border-b border-[#2d3136] flex items-center justify-between gap-2 shrink-0 z-30 select-none text-xs text-slate-200">
        {/* Left Side: Brand Logo, Template Picker, "Tiện ích ▾" Dropdown */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-white hover:text-emerald-400 font-bold text-xs tracking-tight transition shrink-0 mr-1"
            title="Về trang chủ MathAIO Studio"
          >
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-white font-serif font-black text-xs shadow-xs">
              T
            </div>
            <span className="hidden sm:inline font-semibold">LaTeX Studio</span>
          </Link>

          {/* Templates Dropdown */}
          <div className="relative shrink-0">
            <select
              aria-label="Chọn mẫu tài liệu"
              value={template}
              disabled={status === 'compiling'}
              className="bg-[#2a2e33] hover:bg-[#32373e] text-slate-200 border border-[#3e444b] rounded-md px-2 py-1 text-[11px] font-medium outline-none cursor-pointer max-w-36 sm:max-w-44 truncate transition"
              onChange={(e) => {
                const selected = LATEX_TEMPLATES.find((t) => t.id === e.target.value);
                if (selected) {
                  if (
                    source === LATEX_TEMPLATES.find((t) => t.id === template)?.source ||
                    window.confirm(
                      `Chuyển sang mẫu "${selected.name}"? Nội dung hiện tại sẽ được lưu vào lịch sử nháp.`
                    )
                  ) {
                    setTemplate(selected.id);
                    setSource(selected.source);
                    setFiles((prev) =>
                      prev.map((f) => (f.name === activeFileName ? { ...f, content: selected.source } : f))
                    );
                    if (selected.id === 'blank') {
                      setTargetLine(9);
                    }
                  }
                }
              }}
            >
              {LATEX_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#1e2124] text-slate-200">
                  {t.badge ? `[${t.badge}] ` : ''}
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* "Tiện ích ▾" Popover Dropdown */}
          <div className="relative shrink-0" ref={utilsMenuRef}>
            <button
              type="button"
              onClick={() => setIsUtilsMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 bg-[#2a2e33] hover:bg-[#32373e] text-slate-200 border border-[#3e444b] rounded-md px-2 py-1 text-[11px] font-medium outline-none cursor-pointer transition"
              title="Tiện ích mở rộng (OCR, Word, Tex...)"
            >
              <span>Tiện ích</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isUtilsMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e2124] border border-[#3e444b] rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in duration-100">
                <button
                  type="button"
                  disabled={ocrBusy}
                  onClick={() => {
                    setIsUtilsMenuOpen(false);
                    ocrInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#2a2e33] hover:text-white text-left transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-violet-400" />
                  <span>{ocrBusy ? 'Đang OCR ảnh…' : 'OCR ảnh công thức'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUtilsMenuOpen(false);
                    wordInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#2a2e33] hover:text-white text-left transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Nhập Word (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUtilsMenuOpen(false);
                    handleExportWord();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#2a2e33] hover:text-white text-left transition cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-400" />
                  <span>Xuất Word (.docx)</span>
                </button>

                <div className="h-px bg-[#2d3136] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsUtilsMenuOpen(false);
                    exportTex();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#2a2e33] hover:text-white text-left transition cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Xuất mã nguồn (.tex)</span>
                </button>

                <button
                  type="button"
                  disabled={!pdf}
                  onClick={() => {
                    setIsUtilsMenuOpen(false);
                    setIsPresentation(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#2a2e33] hover:text-white text-left transition cursor-pointer disabled:opacity-40"
                >
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Trình chiếu máy chiếu</span>
                </button>
              </div>
            )}
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
        <div className="flex items-center gap-2 min-w-0 max-w-[40%] justify-center">
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

        {/* Right Side: Theme Toggle, Fullscreen Toggle, AI Assistant Launcher */}
        <div className="flex items-center gap-1.5 shrink-0">
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

          <span className="h-3.5 w-px bg-[#2d3136] mx-0.5" />

          {/* AI Assistant Button */}
          <AIAssistantDropdown
            onAI={handleAI}
            aiBusy={aiBusy}
            align="right"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-300 border border-indigo-500/40 transition cursor-pointer disabled:opacity-50"
          />
        </div>
      </header>

      {/* 3. Main Overleaf Authentic Workspace */}
      <main
        ref={mainContainerRef}
        className="relative z-10 flex flex-row w-full h-[calc(100vh-40px)] overflow-hidden p-1.5 gap-1.5"
      >
        {/* COLUMN 1: LEFT SIDEBAR (File tree + File outline) */}
        <div
          className={`file-tree-sidebar h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-shrink-0 shrink-0 ${
            isFileTreeCollapsed ? 'w-12' : 'w-64'
          }`}
        >
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
            isCollapsed={isFileTreeCollapsed}
            onToggleCollapse={() => setIsFileTreeCollapsed(!isFileTreeCollapsed)}
          />
        </div>

        {/* WORKSPACE CONTAINER: EDITOR + DIVIDER + PDF */}
        <div
          ref={workspaceRef}
          className="flex-1 min-w-0 h-full flex flex-row overflow-hidden gap-1.5"
        >
          {/* COLUMN 2: CODE EDITOR PANEL (Center) */}
          <section
            aria-label="Trình soạn thảo mã LaTeX"
            style={{
              display: layoutMode === 'pdf' ? 'none' : 'flex',
              width: layoutMode === 'code' ? '100%' : `${splitRatio}%`,
            }}
            className="min-w-[350px] flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden h-full flex flex-shrink-0 shrink-0"
          >
            {/* File Tabs Bar */}
            <div className="flex items-center justify-between px-2 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0 h-9">
            <div className="flex items-center gap-1 overflow-x-auto min-w-0 py-0.5">
              {openTabs.map((tab) => {
                const isActive = tab === activeFileName;
                return (
                  <div
                    key={tab}
                    onClick={() => handleSelectFile(tab)}
                    className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer font-mono text-[11px] transition shrink-0 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 font-bold border border-slate-200 dark:border-slate-700 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-500" />
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
                        <X className="w-3 h-3" />
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
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                title="Tạo tệp mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Overleaf Flat Editor Ribbon */}
          <div className="h-9 px-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 text-xs shrink-0 select-none overflow-x-auto">
            {/* Left icons group */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => triggerEditorAction('undo')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Hoàn tác (Undo / Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => triggerEditorAction('redo')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Làm lại (Redo / Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => triggerEditorAction('find')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Tìm kiếm & Thay thế (Ctrl+F)"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              {/* Font size TT */}
              <div className="flex items-center gap-1 px-1 text-slate-600 dark:text-slate-300">
                <Type className="w-3.5 h-3.5 text-slate-400" />
                <select
                  aria-label="Cỡ chữ soạn thảo"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="bg-transparent border-0 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-1"
                  title="Cỡ chữ soạn thảo (TT)"
                >
                  {[12, 13, 14, 15, 16, 18, 20].map((s) => (
                    <option key={s} value={s} className="dark:bg-slate-900">
                      {s}px
                    </option>
                  ))}
                </select>
              </div>

              <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => triggerEditorAction('bold')}
                className="px-2 py-1 rounded font-bold hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-serif text-xs transition"
                title="In đậm (\textbf{...})"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => triggerEditorAction('italic')}
                className="px-2 py-1 rounded italic font-serif hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition"
                title="In nghiêng (\textit{...})"
              >
                I
              </button>

              {/* Math symbols palette launcher (Sigma/Omega) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSymbolsOpen((prev) => !prev)}
                  className="p-1.5 rounded hover:bg-cyan-500/15 hover:text-cyan-600 text-slate-700 dark:text-slate-300 transition"
                  title="Bảng ký hiệu toán học MathType (Omega/Sigma)"
                >
                  <Sigma className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </button>

                <MathSymbolsPopover
                  isOpen={isSymbolsOpen}
                  onClose={() => setIsSymbolsOpen(false)}
                  onInsert={handleInsert}
                />
              </div>

              <button
                type="button"
                onClick={() => triggerEditorAction('link')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Chèn liên kết (\href{...})"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => triggerEditorAction('table')}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Chèn bảng (\begin{tabular}...)"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right icons group: [ Code | Visual ], [ Editing / Reviewing ], Search */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-[11px] font-medium border border-slate-300/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditorMode('code')}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
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
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
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
                className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
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
          </div>
        </section>

        {/* COLUMN 3: SPLIT RESIZER & SYNCTEX ARROWS */}
        {layoutMode === 'split' && (
          <div
            onMouseDown={handleMouseDownDivider}
            className="relative w-3 flex-shrink-0 shrink-0 flex flex-col items-center justify-center cursor-col-resize group select-none hover:bg-cyan-500/10 transition-colors"
            title="Kéo giãn tỷ lệ giữa Code và PDF"
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-200 dark:bg-slate-800 group-hover:bg-cyan-500 transition-colors" />

            {/* SyncTeX Navigation Circles */}
            <div className="relative z-20 flex flex-col items-center gap-2 py-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSyncCodeToPDF(cursorLine || targetLine || 1);
                }}
                className="w-5.5 h-5.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-600 hover:border-cyan-500 transition cursor-pointer"
                title="Chuyển từ con trỏ Code sang vị trí PDF (SyncTeX ->)"
              >
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSyncPDFToCode(pdfCurrentPage || 1, 0.2);
                }}
                className="w-5.5 h-5.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-600 hover:border-cyan-500 transition cursor-pointer"
                title="Chuyển từ trang PDF sang dòng Code tương ứng (SyncTeX <-)"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* COLUMN 4: PDF PREVIEW & VIEWER TOOLBAR (Right) */}
        <section
          ref={pdfSectionRef}
          aria-label="Khung xem trước PDF và Nhật ký Overleaf"
          style={{
            display: layoutMode === 'code' ? 'none' : 'flex',
          }}
          className="flex-1 min-w-[350px] overflow-hidden relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs h-full"
        >
          {/* Overleaf Authentic Viewer Toolbar */}
          <div className="flex justify-between items-center px-3 py-1.5 border-b border-white/10 bg-[#1e2124] shrink-0 min-h-9 text-xs overflow-hidden select-none">
            {/* Left Group: Green Recompile + Engine + Download + Logs */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Overleaf Green Recompile Button */}
              <div className="inline-flex items-center rounded-md shadow-xs overflow-hidden bg-[#2d884d] hover:bg-[#246e3e] transition">
                <button
                  type="button"
                  onClick={() => void compile()}
                  disabled={status === 'compiling'}
                  className={`inline-flex items-center justify-center text-xs font-bold text-white cursor-pointer active:bg-[#1f5f36] transition ${
                    pdfWidth < 380 ? 'p-1.5' : 'px-2.5 py-1 gap-1.5'
                  }`}
                  title="Biên dịch tài liệu (Ctrl+Enter)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${status === 'compiling' ? 'animate-spin' : ''}`} />
                  {pdfWidth >= 380 && (
                    <span>{status === 'compiling' ? 'Đang dịch…' : 'Recompile'}</span>
                  )}
                </button>

                {/* Engine Dropdown */}
                {pdfWidth >= 360 && (
                  <select
                    aria-label="Chọn engine biên dịch"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value as any)}
                    className="bg-[#246e3e] hover:bg-[#1f5f36] text-white border-l border-emerald-700/50 text-[10px] font-bold px-1.5 py-1 outline-none cursor-pointer"
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
                  className="p-1 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-300 transition shrink-0"
                  title="Tải PDF nhanh về máy"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              )}

              {/* Overleaf Logs Button with Badge */}
              <button
                type="button"
                onClick={() => setOutputView(outputView === 'console' ? 'pdf' : 'console')}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer border shrink-0 ${
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
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  Xem PDF
                </button>
              )}
            </div>

            {/* Right Group: Page Navigator + Zoom (+ History & Layout Switcher if space permits) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* History Button (shown if width >= 620) */}
              {pdfWidth >= 620 && (
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
                  title="Xem lịch sử phiên bản (History)"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>History</span>
                </button>
              )}

              {/* Layout Switcher: Split / Code / PDF (shown if width >= 680) */}
              {pdfWidth >= 680 && (
                <div className="hidden md:flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('split')}
                    className={`p-1 rounded transition cursor-pointer ${
                      layoutMode === 'split' ? 'bg-slate-900 text-cyan-400 shadow-2xs' : 'text-slate-400'
                    }`}
                    title="Chia 2 cột (Split)"
                  >
                    <Columns className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('code')}
                    className={`p-1 rounded transition cursor-pointer ${
                      layoutMode === 'code' ? 'bg-slate-900 text-cyan-400 shadow-2xs' : 'text-slate-400'
                    }`}
                    title="Toàn màn hình Code"
                  >
                    <Code2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('pdf')}
                    className={`p-1 rounded transition cursor-pointer ${
                      layoutMode === 'pdf' ? 'bg-slate-900 text-cyan-400 shadow-2xs' : 'text-slate-400'
                    }`}
                    title="Toàn màn hình PDF"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Horizontal Page Counter: < 1 / X > */}
              <div className="flex items-center gap-0.5 bg-slate-800/90 rounded-md p-0.5 border border-slate-700 shrink-0">
                <button
                  type="button"
                  disabled={pdfCurrentPage <= 1}
                  onClick={() => {
                    const prev = Math.max(1, pdfCurrentPage - 1);
                    setPdfCurrentPage(prev);
                    setJumpToPage(prev);
                  }}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center px-1 font-mono text-[11px] text-slate-200 font-bold">
                  {pdfWidth >= 440 && (
                    <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Trang</span>
                  )}
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
                    className="w-5 text-center bg-transparent border-0 outline-none text-[11px] font-mono font-bold text-slate-100"
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
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Trang kế tiếp"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom Controls: - [%] + */}
              <div className="flex items-center gap-0.5 bg-slate-800/90 rounded-md p-0.5 border border-slate-700 shrink-0">
                <button
                  type="button"
                  disabled={!pdf}
                  onClick={() => setZoom((z) => Math.max(25, (typeof z === 'number' ? z : 100) - 25))}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <span className="font-mono text-[10px] font-bold px-1 text-slate-200 min-w-7 text-center">
                  {typeof zoom === 'number' ? `${zoom}%` : 'Rộng'}
                </span>

                <button
                  type="button"
                  disabled={!pdf}
                  onClick={() => setZoom((z) => Math.min(300, (typeof z === 'number' ? z : 100) + 25))}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
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
