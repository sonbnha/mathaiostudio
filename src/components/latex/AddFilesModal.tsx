'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  UploadCloud,
  FolderSymlink,
  Globe,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { getAllProjects, type ProjectItem } from '@/lib/storage/projectStore';

export type AddFilesTab = 'new_file' | 'upload' | 'from_project' | 'from_url';

export interface AddFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: AddFilesTab;
  currentDocId?: string;
  existingFileNames: string[];
  onAddFile: (fileName: string, content?: string) => void;
  onUploadFiles: (files: File[]) => void;
}

export default function AddFilesModal({
  isOpen,
  onClose,
  defaultTab = 'new_file',
  currentDocId,
  existingFileNames,
  onAddFile,
  onUploadFiles,
}: AddFilesModalProps) {
  const [activeTab, setActiveTab] = useState<AddFilesTab>(defaultTab);

  // Tab 1: New File State
  const [newFileName, setNewFileName] = useState('name.tex');
  const [newFileError, setNewFileError] = useState<string | null>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Upload State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Tab 3: From Other Project State
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectFiles, setSelectedProjectFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [selectedFileFromProject, setSelectedFileFromProject] = useState<string>('');
  const [targetProjectFileName, setTargetProjectFileName] = useState<string>('');
  const [projectError, setProjectError] = useState<string | null>(null);

  // Tab 4: From URL State
  const [fetchUrl, setFetchUrl] = useState<string>('');
  const [targetUrlFileName, setTargetUrlFileName] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Reset or initialize state when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setNewFileName('name.tex');
      setNewFileError(null);
      setProjectError(null);
      setUrlError(null);
      setIsFetchingUrl(false);

      // Load projects for Tab 3
      try {
        const all = getAllProjects();
        setProjectsList(all);
      } catch {
        setProjectsList([]);
      }
    }
  }, [isOpen, defaultTab]);

  // Focus and select text when Tab 1 is active
  useEffect(() => {
    if (isOpen && activeTab === 'new_file') {
      setTimeout(() => {
        if (newFileInputRef.current) {
          newFileInputRef.current.focus();
          newFileInputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, activeTab]);

  // Handle project selection change in Tab 3
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProjectFiles([]);
      setSelectedFileFromProject('');
      setTargetProjectFileName('');
      return;
    }

    const proj = projectsList.find((p) => p.id === selectedProjectId);
    if (!proj) {
      setSelectedProjectFiles([]);
      return;
    }

    // Extract files from project
    let files: Array<{ name: string; content: string }> = [];
    if (proj.files && proj.files.length > 0) {
      files = proj.files.map((f) => ({ name: f.name, content: f.content || '' }));
    } else if (proj.metadata?.files && proj.metadata.files.length > 0) {
      files = proj.metadata.files.map((f) => ({ name: f.name, content: f.content || '' }));
    } else {
      const sourceContent = proj.content || proj.metadata?.source || '';
      files = [{ name: 'main.tex', content: sourceContent }];
    }

    setSelectedProjectFiles(files);
    if (files.length > 0) {
      setSelectedFileFromProject(files[0].name);
      setTargetProjectFileName(files[0].name);
    } else {
      setSelectedFileFromProject('');
      setTargetProjectFileName('');
    }
  }, [selectedProjectId, projectsList]);

  // Handle Tab 1 (New File) Submit
  const handleCreateNewFile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let name = newFileName.trim();
    if (!name) {
      setNewFileError('Vui lòng nhập tên tệp.');
      return;
    }
    if (!name.includes('.')) {
      name = `${name}.tex`;
    }
    if (existingFileNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
      setNewFileError(`Tệp "${name}" đã tồn tại trong dự án.`);
      return;
    }

    onAddFile(name);
    onClose();
  };

  // Handle Tab 2 (Upload) File Selection
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const filesArray = Array.from(fileList);
      onUploadFiles(filesArray);
      onClose();
    }
  };

  // Drag & Drop Handlers for Tab 2
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onUploadFiles(filesArray);
      onClose();
    }
  };

  // Paste Event Handler for Tab 2
  const handlePaste = (e: React.ClipboardEvent) => {
    if (activeTab !== 'upload') return;
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const filesArray = Array.from(e.clipboardData.files);
      onUploadFiles(filesArray);
      onClose();
    }
  };

  // Handle Tab 3 (From Other Project) Submit
  const handleCreateFromProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProjectId || !selectedFileFromProject) {
      setProjectError('Vui lòng chọn một dự án và tệp nguồn.');
      return;
    }

    let targetName = targetProjectFileName.trim();
    if (!targetName) {
      targetName = selectedFileFromProject;
    }
    if (!targetName.includes('.')) {
      targetName = `${targetName}.tex`;
    }

    if (existingFileNames.some((n) => n.toLowerCase() === targetName.toLowerCase())) {
      setProjectError(`Tệp "${targetName}" đã tồn tại trong dự án.`);
      return;
    }

    const sourceFile = selectedProjectFiles.find((f) => f.name === selectedFileFromProject);
    const content = sourceFile?.content || '';

    onAddFile(targetName, content);
    onClose();
  };

  // Handle Tab 4 (From URL) Submit
  const handleCreateFromUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = fetchUrl.trim();
    if (!url) {
      setUrlError('Vui lòng nhập đường dẫn URL.');
      return;
    }

    let targetName = targetUrlFileName.trim();
    if (!targetName) {
      try {
        const parsed = new URL(url);
        const pathname = parsed.pathname;
        const basename = pathname.split('/').filter(Boolean).pop() || 'downloaded_file';
        targetName = basename;
      } catch {
        targetName = 'downloaded_file';
      }
    }

    if (!targetName.includes('.')) {
      targetName = `${targetName}.tex`;
    }

    if (existingFileNames.some((n) => n.toLowerCase() === targetName.toLowerCase())) {
      setUrlError(`Tệp "${targetName}" đã tồn tại trong dự án.`);
      return;
    }

    setIsFetchingUrl(true);
    setUrlError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const isImage = contentType.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp)$/i.test(targetName);

      if (isImage) {
        const blob = await response.blob();
        const file = new File([blob], targetName, { type: blob.type || 'image/png' });
        onUploadFiles([file]);
      } else {
        const text = await response.text();
        onAddFile(targetName, text);
      }

      onClose();
    } catch (err: any) {
      console.error('Lỗi khi tải từ URL:', err);
      setUrlError(`Không thể tải tệp từ URL: ${err.message || 'Lỗi mạng hoặc CORS'}`);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onPaste={handlePaste}
    >
      {/* Modal Card */}
      <div
        className="max-w-2xl w-full rounded-xl bg-[#131926] border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-[#161d2c]">
          <h3 className="text-base font-bold text-slate-100">Thêm tệp</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex flex-1 min-h-[340px]">
          {/* Left Column: Tab Sidebar */}
          <div className="w-60 border-r border-slate-700/60 p-3 space-y-1 bg-slate-900/40 flex flex-col justify-between shrink-0 select-none">
            <div className="space-y-1">
              {/* Tab 1 */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('new_file');
                  setNewFileError(null);
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'new_file'
                    ? 'bg-slate-800/90 text-emerald-400 font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Tệp mới</span>
              </button>

              {/* Tab 2 */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-slate-800/90 text-emerald-400 font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <span>Tải lên</span>
              </button>

              {/* Tab 3 */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('from_project');
                  setProjectError(null);
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'from_project'
                    ? 'bg-slate-800/90 text-emerald-400 font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FolderSymlink className="w-4 h-4 shrink-0" />
                <span>Từ dự án khác</span>
              </button>

              {/* Tab 4 */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('from_url');
                  setUrlError(null);
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'from_url'
                    ? 'bg-slate-800/90 text-emerald-400 font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span>Từ liên kết URL</span>
              </button>
            </div>

            {/* Reference integrations (Disabled Overleaf style) */}
            <div className="border-t border-slate-800/80 pt-2 space-y-1">
              <div
                className="px-3 py-1.5 text-xs text-slate-500 rounded flex items-center justify-between opacity-50 cursor-not-allowed"
                title="Tính năng liên kết tài liệu tham khảo sắp ra mắt"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Từ ReadCube
                </span>
                <span className="text-[10px] font-mono bg-slate-800 px-1 rounded">Soon</span>
              </div>
              <div
                className="px-3 py-1.5 text-xs text-slate-500 rounded flex items-center justify-between opacity-50 cursor-not-allowed"
                title="Tính năng liên kết tài liệu tham khảo sắp ra mắt"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Từ Zotero
                </span>
                <span className="text-[10px] font-mono bg-slate-800 px-1 rounded">Soon</span>
              </div>
              <div
                className="px-3 py-1.5 text-xs text-slate-500 rounded flex items-center justify-between opacity-50 cursor-not-allowed"
                title="Tính năng liên kết tài liệu tham khảo sắp ra mắt"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Từ Mendeley
                </span>
                <span className="text-[10px] font-mono bg-slate-800 px-1 rounded">Soon</span>
              </div>
            </div>
          </div>

          {/* Right Column: Content Area */}
          <div className="flex-1 p-6 flex flex-col justify-between min-h-[320px] bg-[#131926]">
            {/* TAB 1: NEW FILE */}
            {activeTab === 'new_file' && (
              <form onSubmit={handleCreateNewFile} className="flex flex-col h-full justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Tên tệp
                  </label>
                  <input
                    ref={newFileInputRef}
                    type="text"
                    value={newFileName}
                    onChange={(e) => {
                      setNewFileName(e.target.value);
                      if (newFileError) setNewFileError(null);
                    }}
                    placeholder="vd: baitap.tex"
                    className="w-full bg-[#0d121c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                  {newFileError && (
                    <p className="text-xs text-red-400 mt-2">{newFileError}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Nhập tên tệp kết thúc bằng phần mở rộng (mặc định sẽ là <span className="font-mono text-emerald-400">.tex</span>).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-slate-600 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition cursor-pointer shadow-xs"
                  >
                    Tạo
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: UPLOAD */}
            {activeTab === 'upload' && (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px] transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-600 hover:border-emerald-500/70 bg-slate-900/30'
                    }`}
                  >
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                    <p className="text-sm font-medium text-slate-200">
                      Thả hoặc dán tệp, thư mục, hình ảnh vào đây.
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      hoặc{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-emerald-400 underline hover:text-emerald-300 font-medium cursor-pointer"
                      >
                        Chọn tệp
                      </button>{' '}
                      hoặc{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          folderInputRef.current?.click();
                        }}
                        className="text-emerald-400 underline hover:text-emerald-300 font-medium cursor-pointer"
                      >
                        chọn thư mục
                      </button>{' '}
                      từ máy tính của bạn.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-3 font-mono">
                      Hỗ trợ: .tex, .bib, .cls, .sty, .png, .jpg, .svg, .pdf
                    </p>
                  </div>

                  {/* Hidden inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".tex,.bib,.cls,.sty,.png,.jpg,.jpeg,.svg,.pdf"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-800 mt-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-slate-600 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: FROM OTHER PROJECT */}
            {activeTab === 'from_project' && (
              <form onSubmit={handleCreateFromProject} className="flex flex-col h-full justify-between">
                <div className="space-y-3.5">
                  {/* Field 1: Project select */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                      Chọn dự án
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setProjectError(null);
                      }}
                      className="w-full bg-[#0d121c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">- Vui lòng chọn một dự án -</option>
                      {projectsList
                        .filter((p) => p.id !== currentDocId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.type.toUpperCase()})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Field 2: File select */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                      Chọn tệp
                    </label>
                    <select
                      value={selectedFileFromProject}
                      disabled={!selectedProjectId || selectedProjectFiles.length === 0}
                      onChange={(e) => {
                        setSelectedFileFromProject(e.target.value);
                        setTargetProjectFileName(e.target.value);
                        setProjectError(null);
                      }}
                      className="w-full bg-[#0d121c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 disabled:opacity-50 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">- Vui lòng chọn một tệp -</option>
                      {selectedProjectFiles.map((file) => (
                        <option key={file.name} value={file.name}>
                          {file.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      hoặc chọn từ tệp xuất ra
                    </span>
                  </div>

                  {/* Field 3: Target file name */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                      Tên tệp trong dự án này
                    </label>
                    <input
                      type="text"
                      value={targetProjectFileName}
                      onChange={(e) => {
                        setTargetProjectFileName(e.target.value);
                        setProjectError(null);
                      }}
                      placeholder="example.tex"
                      className="w-full bg-[#0d121c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                    />
                  </div>

                  {projectError && (
                    <p className="text-xs text-red-400 mt-1">{projectError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-slate-600 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedProjectId || !selectedFileFromProject || !targetProjectFileName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium text-sm transition cursor-pointer shadow-xs"
                  >
                    Tạo
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: FROM URL */}
            {activeTab === 'from_url' && (
              <form onSubmit={handleCreateFromUrl} className="flex flex-col h-full justify-between">
                <div className="space-y-3.5">
                  {/* Field 1: URL */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                      URL để tải tệp về
                    </label>
                    <input
                      type="url"
                      value={fetchUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFetchUrl(val);
                        setUrlError(null);
                        if (!targetUrlFileName) {
                          try {
                            const parsed = new URL(val);
                            const name = parsed.pathname.split('/').filter(Boolean).pop();
                            if (name) setTargetUrlFileName(name);
                          } catch {}
                        }
                      }}
                      placeholder="https://example.com/my-file.png"
                      className="w-full bg-[#0d121c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Field 2: Target File Name */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                      Tên tệp trong dự án này
                    </label>
                    <input
                      type="text"
                      value={targetUrlFileName}
                      onChange={(e) => {
                        setTargetUrlFileName(e.target.value);
                        setUrlError(null);
                      }}
                      placeholder="my_file.tex"
                      className="w-full bg-[#0d121c] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                    />
                  </div>

                  {urlError && (
                    <p className="text-xs text-red-400 mt-1">{urlError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-slate-600 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!fetchUrl.trim() || isFetchingUrl}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium text-sm transition cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    {isFetchingUrl && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isFetchingUrl ? 'Đang tải…' : 'Tạo'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
