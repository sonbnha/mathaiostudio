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
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import AppHeader from '@/components/header/AppHeader';
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
  const [targetLine, setTargetLine] = useState<number | undefined>(undefined);
  const [highlightPage, setHighlightPage] = useState<number | undefined>(undefined);
  const [insertRequest, setInsertRequest] = useState<{ id: number; text: string } | undefined>(undefined);
  const [isPresentation, setIsPresentation] = useState<boolean>(false);
  const [storageNotice, setStorageNotice] = useState<string>('Tự động lưu');

  // AI & Async busy flags
  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [ocrBusy, setOcrBusy] = useState<boolean>(false);
  const [fixBusy, setFixBusy] = useState<boolean>(false);

  // File Inputs
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    if (docId) {
      const proj = getProjectById(docId);
      const stored = getDocumentById(docId);

      if (proj) {
        setCurrentDocId(proj.id);
        setDocTitle(proj.title);
        const tplId = proj.metadata?.templateId || stored?.templateId || 'thpt_2025';
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
        const updatedFiles = files.map((f) =>
          f.name === activeFileName ? { ...f, content: source } : f
        );

        const mainFile = updatedFiles.find((f) => f.name === 'main.tex');
        const mainSource = mainFile ? mainFile.content : source;

        const itemToSave: LatexDocumentItem = {
          id: currentDocId,
          title: docTitle,
          templateId: template,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          source: mainSource,
          files: updatedFiles,
          images,
          history: history.slice(-25),
        };
        saveDocument(itemToSave);

        // Also save to unified project store
        const projItem: ProjectItem = {
          id: currentDocId,
          title: docTitle,
          type: 'latex',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: updatedFiles,
          metadata: {
            templateId: template,
            badge: getTemplateById(template)?.badge || 'XeLaTeX',
            previewSnippet: mainSource.slice(0, 140),
            source: mainSource,
            files: updatedFiles,
          },
          content: mainSource,
        };
        saveProject(projItem);

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
          body: JSON.stringify({ source: code }),
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
    [source, files, activeFileName, pdf]
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tự sửa lỗi.');
      }

      setSource(data.fixedSource);
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFileName ? { ...f, content: data.fixedSource } : f))
      );
      await compile(data.fixedSource);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi AI sửa mã.');
    } finally {
      setFixBusy(false);
    }
  };

  // AI Assistant Actions
  const handleAI = async (action: string, customPrompt?: string) => {
    setAiBusy(true);
    try {
      const res = await fetch('/api/latex/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, source, customPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI không thể hoàn thành yêu cầu.');
      }

      handleInsert(`\n\n% --- AI generated content ---\n${data.result}\n`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gọi trợ lý AI.');
    } finally {
      setAiBusy(false);
    }
  };

  // OCR Image to LaTeX
  const handleOCR = async (file: File) => {
    setOcrBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/latex/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể nhận diện ảnh.');
      }

      handleInsert(`\n\n% --- OCR từ ảnh ${file.name} ---\n${data.latex}\n`);
    } catch (err: any) {
      alert(err.message || 'Lỗi nhận diện OCR ảnh.');
    } finally {
      setOcrBusy(false);
    }
  };

  // Import Word (.docx) to LaTeX
  const handleImportWord = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/latex/word', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể nhập file Word.');
      }

      if (window.confirm(`Thay thế tài liệu bằng nội dung từ file Word "${file.name}"?`)) {
        setSource(data.latex);
        setFiles((prev) =>
          prev.map((f) => (f.name === activeFileName ? { ...f, content: data.latex } : f))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi chuyển đổi file Word.');
    }
  };

  // Export LaTeX to Word (.docx)
  const handleExportWord = async () => {
    try {
      const cleanTitle = docTitle.replace(/\.tex$/, '');
      const res = await fetch('/api/latex/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, title: cleanTitle }),
      });
      if (!res.ok) throw new Error('Không thể tạo file Word.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Lỗi xuất file Word.');
    }
  };

  // Export .tex file
  const exportTex = () => {
    const blob = new Blob([source], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docTitle || activeFileName || 'document.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Multi-file management actions
  const handleSelectFile = (fileName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: source } : f))
    );

    const targetFile = files.find((f) => f.name === fileName);
    if (targetFile) {
      setActiveFileName(fileName);
      setSource(targetFile.content);
      if (!openTabs.includes(fileName)) {
        setOpenTabs((prev) => [...prev, fileName]);
      }
    }
  };

  const handleCreateFile = (fileName: string) => {
    const initialContent = `% ${fileName}\n\\section{${fileName.replace(/\.tex$/, '')}}\n% Nội dung phần mở rộng...\n`;
    const newFile: StudioFile = { name: fileName, content: initialContent };
    setFiles((prev) => [...prev, newFile]);
    setOpenTabs((prev) => [...prev, fileName]);
    setActiveFileName(fileName);
    setSource(initialContent);
  };

  const handleDeleteFile = (fileName: string) => {
    if (fileName === 'main.tex') {
      alert('Không thể xóa tệp chính main.tex.');
      return;
    }
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setOpenTabs((prev) => prev.filter((t) => t !== fileName));

    if (activeFileName === fileName) {
      handleSelectFile('main.tex');
    }
  };

  const handleRenameFile = (oldName: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f))
    );
    setOpenTabs((prev) =>
      prev.map((t) => (t === oldName ? newName : t))
    );
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

  // SyncTeX Click Handlers
  const handleSyncPDFToCode = (page: number, ratio: number) => {
    const lines = source.split('\n');
    const estimatedTotalPages = Math.max(1, Math.ceil(lines.length / 45));
    const linesPerPage = Math.ceil(lines.length / estimatedTotalPages);
    const line = Math.min(lines.length, Math.max(1, Math.round((page - 1) * linesPerPage + ratio * linesPerPage)));
    setTargetLine(line);
  };

  const handleSyncCodeToPDF = (lineNumber: number) => {
    const lines = source.split('\n');
    const estimatedTotalPages = Math.max(1, Math.ceil(lines.length / 45));
    const linesPerPage = Math.ceil(lines.length / estimatedTotalPages);
    const page = Math.min(estimatedTotalPages, Math.max(1, Math.ceil(lineNumber / linesPerPage)));
    setHighlightPage(page);
  };

  const { errors, warnings } = parseTeXLog(errorLog);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Standard Header with Breadcrumb & Inline Title */}
      <AppHeader
        docTitle={docTitle}
        onDocTitleChange={(newTitle) => setDocTitle(newTitle)}
        saveStatus="saved"
        saveStatusLabel={storageNotice || 'Đã lưu'}
        toolType="latex"
      />

      {/* 2. Single-Tier Compact Ribbon (Max 38px, No multi-tier stacking) */}
      <div className="relative z-30 mx-2 sm:mx-3 my-1 px-2.5 py-1 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs backdrop-blur-sm flex items-center justify-between gap-2 shrink-0 h-9 overflow-visible">
        {/* Left Side: Template selector & Popover Launcher for Math Symbols & AI */}
        <div className="flex items-center gap-1.5 min-w-0 overflow-visible">
          {/* Template Selector */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Mẫu:
            </span>
            <select
              aria-label="Chọn mẫu tài liệu"
              value={template}
              disabled={status === 'compiling'}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none max-w-36 sm:max-w-44 truncate"
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
                  }
                }
              }}
            >
              {LATEX_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.badge ? `[${t.badge}] ` : ''}
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Floating Math Symbols Button (Opens Popover anchored directly below) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSymbolsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 transition shrink-0 cursor-pointer shadow-2xs"
              title="Mở bảng ký hiệu toán học (MathType Palette)"
            >
              <Sigma className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Ký hiệu Toán</span>
            </button>

            {/* Anchored Math Symbols Popover */}
            <MathSymbolsPopover
              isOpen={isSymbolsOpen}
              onClose={() => setIsSymbolsOpen(false)}
              onInsert={handleInsert}
            />
          </div>

          {/* AI Assistant Dropdown */}
          <AIAssistantDropdown onAI={handleAI} aiBusy={aiBusy} />
        </div>

        {/* Right Side: Utility Tools (OCR, Word, Presentation, Export) */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* OCR Image Button */}
          <button
            type="button"
            disabled={ocrBusy}
            onClick={() => ocrInputRef.current?.click()}
            className={ribbonButton}
            title="Quét ảnh công thức/đề thi thành mã LaTeX"
          >
            <Camera className="w-3.5 h-3.5 text-violet-500" />
            <span className="hidden md:inline">{ocrBusy ? 'Đang OCR…' : 'OCR ảnh'}</span>
          </button>
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

          {/* Word Import Button */}
          <button
            type="button"
            onClick={() => wordInputRef.current?.click()}
            className={ribbonButton}
            title="Nhập tài liệu Word (.docx) sang LaTeX"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden lg:inline">Nhập Word</span>
          </button>
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

          {/* Word Export Button */}
          <button
            type="button"
            onClick={handleExportWord}
            className={ribbonButton}
            title="Xuất tài liệu sang file Word (.docx)"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden lg:inline">Xuất Word</span>
          </button>

          {/* Presentation Mode Button */}
          <button
            type="button"
            disabled={!pdf}
            onClick={() => setIsPresentation(true)}
            className={ribbonButton}
            title="Trình chiếu toàn màn hình cho máy chiếu"
          >
            <Tv className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden xl:inline">Trình chiếu</span>
          </button>

          <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:inline" />

          {/* Export .tex & Download PDF */}
          <button
            type="button"
            onClick={exportTex}
            className={ribbonButton}
            title="Tải mã nguồn .tex về máy"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">Xuất .tex</span>
          </button>

          {pdf ? (
            <a
              href={pdf}
              download={`${docTitle.replace(/\.tex$/, '')}.pdf`}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold shadow-xs transition"
              title="Tải tài liệu PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải PDF</span>
            </a>
          ) : (
            <button className={ribbonButton} disabled>
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Tải PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Overleaf Workspace (Edge-to-Edge Fill Height) */}
      <main className="relative z-10 flex-1 min-h-0 w-full px-2 sm:px-3 pb-1 flex flex-row gap-2 overflow-hidden">
        {/* COLUMN 1: File Tree Explorer (Left - Collapsible) */}
        <div className="h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs flex shrink-0">
          <FileTreeExplorer
            files={files}
            activeFileName={activeFileName}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
            onUploadAsset={handleUploadAsset}
            isCollapsed={isFileTreeCollapsed}
            onToggleCollapse={() => setIsFileTreeCollapsed(!isFileTreeCollapsed)}
          />
        </div>

        {/* COLUMN 2: Code Editor Panel (Center - Flex 1) */}
        <section
          aria-label="Trình soạn thảo mã LaTeX"
          className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden h-full"
        >
          {/* Unified Tab Bar: File Tabs + Overleaf Green Recompile Button */}
          <div className="flex items-center justify-between px-2.5 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0 h-10">
            {/* File Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto min-w-0 py-1">
              {openTabs.map((tab) => {
                const isActive = tab === activeFileName;
                return (
                  <div
                    key={tab}
                    onClick={() => handleSelectFile(tab)}
                    className={`group flex items-center gap-1.5 px-3 py-1 rounded-xl cursor-pointer font-mono text-[11px] transition shrink-0 ${
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

              {/* Quick Add File Tab Button */}
              <button
                type="button"
                onClick={() => {
                  const name = prompt('Nhập tên tệp LaTeX mới (vd: cau_hoi.tex):');
                  if (name) handleCreateFile(name);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                title="Tạo tệp mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Center / Right: Prominent Green Recompile Button & Font Size */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {/* Green Recompile Button right in Tab Bar */}
              <button
                type="button"
                onClick={() => void compile()}
                disabled={status === 'compiling'}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3.5 py-1 text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer group shrink-0"
                title="Phím tắt: Ctrl+Enter / Cmd+Enter"
              >
                {status === 'compiling' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Play className="w-3 h-3 fill-white text-white group-hover:scale-110 transition-transform" />
                )}
                <span>{status === 'compiling' ? 'Đang dịch…' : 'Biên dịch'}</span>
              </button>

              {/* Font Size Selector */}
              <label className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
                <span>Cỡ:</span>
                <select
                  aria-label="Cỡ chữ soạn thảo"
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-1 py-0.5 text-xs text-slate-700 dark:text-slate-200 outline-none"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                >
                  {[12, 13, 14, 15, 16, 18, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}px
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Monaco Editor Canvas */}
          <div className="flex-1 min-h-0">
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
              onCursorLine={handleSyncCodeToPDF}
              targetLine={targetLine}
              errors={errors}
            />
          </div>
        </section>

        {/* COLUMN 3: PDF Preview & Logs Panel (Right - Flex 1) */}
        <section
          aria-label="Khung xem trước PDF và Nhật ký Overleaf"
          className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden h-full"
        >
          {/* PDF Preview Topbar: Status Badge + View Switcher + Zoom Controls */}
          <div className="flex items-center justify-between px-3 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 shrink-0 h-10">
            {/* Status & Error Count Badges */}
            <div className="flex items-center gap-2">
              {status === 'error' || errors.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOutputView('console')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold cursor-pointer hover:bg-rose-500/25 transition"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{errors.length || 1} Lỗi</span>
                </button>
              ) : warnings.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOutputView('console')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-500/25 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{warnings.length} Cảnh báo</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">0 Lỗi</span>
                </span>
              )}

              {/* View switcher: PDF vs. Console Log */}
              <div className="flex items-center gap-0.5 bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setOutputView('pdf')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                    outputView === 'pdf'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3 h-3 text-cyan-500" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOutputView('console')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                    outputView === 'console'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3 h-3 text-amber-500" />
                  <span>Logs {errors.length > 0 && `(${errors.length})`}</span>
                </button>
              </div>
            </div>

            {/* Quick Zoom & Refresh */}
            {outputView === 'pdf' && pdf && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.max(25, (typeof z === 'number' ? z : 100) - 25))
                  }
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                  title="Thu nhỏ PDF"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.min(300, (typeof z === 'number' ? z : 100) + 25))
                  }
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                  title="Phóng to PDF"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Main Output Body */}
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            {outputView === 'pdf' ? (
              pdf ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  {source !== compiledSource && (
                    <div
                      role="status"
                      className="text-xs px-3 py-1 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between shrink-0"
                    >
                      <span>Mã nguồn đã sửa đổi. Bấm Biên dịch để cập nhật PDF.</span>
                      <button
                        onClick={() => void compile()}
                        className="underline font-bold hover:text-amber-900 cursor-pointer ml-2"
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
                    isPresentation={isPresentation}
                    onClosePresentation={() => setIsPresentation(false)}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-950/30">
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center mb-3 shadow-xs">
                    <FileText className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Chưa có tài liệu PDF
                  </p>
                  <p className="text-xs max-w-xs leading-relaxed text-slate-500 mb-3">
                    Bấm nút <strong className="text-emerald-600">“Biên dịch”</strong> màu xanh phía trên (Ctrl+Enter) để xuất bản tài liệu PDF A4.
                  </p>
                  <button
                    type="button"
                    onClick={() => void compile()}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Biên dịch ngay</span>
                  </button>
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
      </main>

      {/* 4. Footer Status Bar (Compact h-7) */}
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
          <span className="text-[10px]">XeLaTeX qua {engineLabel}</span>
        </div>
      </footer>
    </div>
  );
}
