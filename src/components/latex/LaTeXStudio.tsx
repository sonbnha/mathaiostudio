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
  ChevronLeft,
  X,
  FileCode,
  Layers,
  Plus,
  Tv,
  Eye,
  Terminal,
} from 'lucide-react';
import { APP_VERSION } from '@/config/version';
import AppHeader from '@/components/header/AppHeader';
import StudioTools, { type StudioFile, type StudioImage, type RestorePoint } from '@/components/latex/StudioTools';
import FileTreeExplorer from '@/components/latex/FileTreeExplorer';
import ErrorConsole, { parseTeXLog } from '@/components/latex/ErrorConsole';
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

const button =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer';

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

  // Initial load: either load existing project by docId OR auto-generate a new draft
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
        setImages(stored.images || []);
        setHistory(stored.history || []);
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
        // storage quota
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [source, docTitle, template, files, activeFileName, images, history, currentDocId]);

  // Insert helper for Ribbon and snippets
  const handleInsert = useCallback((text: string) => {
    setInsertRequest({ id: Date.now(), text });
  }, []);

  // Compile LaTeX to PDF (Always compiles main.tex or composite source)
  const compile = useCallback(
    async (sourceToCompile?: string) => {
      // Find main source
      let code = sourceToCompile;
      if (!code) {
        const mainFile = files.find((f) => f.name === 'main.tex');
        code = activeFileName === 'main.tex' ? source : mainFile?.content || source;
      }

      if (!code?.trim()) return;

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
          throw new Error(errData.log || errData.error || 'Biên dịch thất bại.');
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
        setErrorLog(rawLog);
        // Switch to console view automatically on compile error
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
      // Auto re-compile fixed source
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

  // Restore point
  const handleRestore = (point: RestorePoint) => {
    if (window.confirm(`Khôi phục bản nháp lúc ${new Date(point.at).toLocaleTimeString('vi-VN')}?`)) {
      setSource(point.source);
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFileName ? { ...f, content: point.source } : f))
      );
    }
  };

  // Multi-file management actions
  const handleSelectFile = (fileName: string) => {
    // Save current active file first
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: source } : f))
    );

    // Switch active file
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

  // 2-Way SyncTeX Click Handlers
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

      {/* 2. Top Quick Toolbar (GDPT 2018 Template, Snippets, AI, Tools) */}
      <div className="relative z-10 mx-3 md:mx-4 mt-2 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/90 dark:bg-slate-900/80 shadow-xs backdrop-blur-sm flex flex-wrap items-center justify-between gap-2 shrink-0">
        <h1 className="sr-only">Biên Soạn &amp; Biên Dịch LaTeX Sang PDF Overleaf</h1>

        {/* Template Selector with GDPT 2018 badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Mẫu:
            </label>
            <select
              aria-label="Chọn mẫu tài liệu"
              value={template}
              disabled={status === 'compiling'}
              className={`${button} bg-white dark:bg-slate-900 max-w-44 font-medium py-1 text-xs`}
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

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:inline" />

          {/* Ribbon quick math symbols & tools */}
          <StudioTools
            source={source}
            setSource={(newSource) => {
              setSource(newSource);
              setFiles((prev) =>
                prev.map((f) => (f.name === activeFileName ? { ...f, content: newSource } : f))
              );
            }}
            insert={handleInsert}
            onAI={handleAI}
            aiBusy={aiBusy}
            onAIFix={handleAIFix}
            fixBusy={fixBusy}
            onOCR={handleOCR}
            ocrBusy={ocrBusy}
            onImportWord={handleImportWord}
            onExportWord={handleExportWord}
            files={files}
            setFiles={setFiles}
            images={images}
            setImages={setImages}
            history={history}
            restore={handleRestore}
            activeFileName={activeFileName}
            setActiveFileName={setActiveFileName}
            onTogglePresentation={() => setIsPresentation(true)}
          />
        </div>

        {/* Right action utilities */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button className={button} onClick={exportTex} title="Tải file mã nguồn .tex">
            <Code2 className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">Xuất .tex</span>
          </button>
          {pdf ? (
            <a
              href={pdf}
              download={`${docTitle.replace(/\.tex$/, '')}.pdf`}
              className={button}
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Tải PDF</span>
            </a>
          ) : (
            <button className={button} disabled>
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main 3-Pane Overleaf Workspace (Fixed Height calc(100vh - 4.5rem)) */}
      <main className="relative z-10 flex-1 min-h-0 w-full px-3 md:px-4 py-2 flex flex-row gap-2.5 overflow-hidden">
        {/* COLUMN 1: File Tree Explorer (Left - Collapsible) */}
        <div className="h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs flex shrink-0">
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
          className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden h-full"
        >
          {/* File Tabs Navigation Bar */}
          <div className="flex items-center justify-between px-2 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1 py-1">
              {openTabs.map((tab) => {
                const isActive = tab === activeFileName;
                return (
                  <div
                    key={tab}
                    onClick={() => handleSelectFile(tab)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer font-mono text-[11px] transition ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 font-bold border border-slate-200 dark:border-slate-700 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                title="Tạo tệp mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Size and Shortcut Help */}
            <div className="flex items-center gap-2 text-slate-400 text-[11px] py-1">
              <span className="hidden xl:inline font-mono text-[10px]">Ctrl+Enter: Biên dịch</span>
              <label className="flex items-center gap-1 font-sans text-[11px] text-slate-500">
                <span>Cỡ:</span>
                <select
                  aria-label="Cỡ chữ soạn thảo"
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-200 outline-none"
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
            />
          </div>
        </section>

        {/* COLUMN 3: PDF Preview & Overleaf Green Recompile Panel (Right - Flex 1) */}
        <section
          aria-label="Khung xem trước PDF và Nhật ký Overleaf"
          className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden h-full"
        >
          {/* Overleaf Green Recompile Center Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
            {/* Signature Overleaf Green Recompile Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void compile()}
                disabled={status === 'compiling'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer group"
                title="Phím tắt: Ctrl+Enter / Cmd+Enter"
              >
                {status === 'compiling' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white text-white group-hover:scale-110 transition-transform" />
                )}
                <span>{status === 'compiling' ? 'Đang biên dịch…' : 'Biên dịch'}</span>
              </button>

              {/* Status & Error Count Badges */}
              {status === 'error' || errors.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOutputView('console')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold cursor-pointer hover:bg-rose-500/25 transition"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{errors.length || 1} Lỗi</span>
                </button>
              ) : warnings.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOutputView('console')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-500/25 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{warnings.length} Cảnh báo</span>
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>0 Lỗi</span>
                </span>
              )}
            </div>

            {/* View switcher: PDF Preview vs. Console Log */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/70 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setOutputView('pdf')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  outputView === 'pdf'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-cyan-500" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setOutputView('console')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  outputView === 'console'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                <span>Logs {errors.length > 0 && `(${errors.length})`}</span>
              </button>
            </div>
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
                      <span>Mã nguồn đã thay đổi. Bấm Biên dịch lại để cập nhật.</span>
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
                  <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center mb-4 shadow-xs">
                    <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Chưa có tài liệu PDF
                  </p>
                  <p className="text-xs max-w-xs leading-relaxed text-slate-500 mb-4">
                    Bấm nút <strong className="text-emerald-600">“Biên dịch”</strong> màu xanh phía trên (Ctrl+Enter) để biên dịch sang tài liệu PDF chất lượng cao.
                  </p>
                  <button
                    type="button"
                    onClick={() => void compile()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
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

      {/* 4. Footer Status Bar */}
      <footer className="relative z-10 shrink-0 px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>MathAIO Studio © {new Date().getFullYear()}</span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10px]">
            <Save className="w-3 h-3 text-emerald-500" />
            {storageNotice}
          </span>
          <Link
            href="/changelog?from=%2Flatex"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-dotted font-mono"
          >
            {APP_VERSION.fullString}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Biên dịch XeLaTeX trực tuyến qua {engineLabel}</span>
        </div>
      </footer>
    </div>
  );
}
