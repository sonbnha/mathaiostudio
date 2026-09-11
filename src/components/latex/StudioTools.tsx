'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Braces,
  Calculator,
  FileImage,
  FolderTree,
  History,
  ImageUp,
  Shapes,
  Sparkles,
  Upload,
  Download,
  WandSparkles,
  X,
  FileText,
  Plus,
  Trash2,
  Check,
  Eye,
  Camera,
  Layers,
  Code2,
  FileCode,
  Sigma,
  Tv,
} from 'lucide-react';
import katex from 'katex';

export type StudioFile = { name: string; content: string; path?: string };
export type StudioImage = { name: string; url?: string; dataUrl?: string; size?: string };
export type RestorePoint = { at: number; source: string; label?: string };

// Các nhóm ký hiệu toán học Ribbon đầy đủ
export const MATH_RIBBONS = [
  {
    category: 'Giải tích',
    items: [
      { label: 'Tích phân', code: '\\int_{a}^{b} f(x)\\,dx' },
      { label: 'Tích phân suy rộng', code: '\\int_{0}^{+\\infty} e^{-x^2}\\,dx' },
      { label: 'Đạo hàm', code: 'f\'(x) = \\lim_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}' },
      { label: 'Giới hạn', code: '\\lim_{x \\to x_0} f(x)' },
      { label: 'Tổng xích-ma', code: '\\sum_{i=1}^{n} a_i' },
      { label: 'Tích chuỗi', code: '\\prod_{k=1}^{n} k' },
    ],
  },
  {
    category: 'Tập hợp & Logic',
    items: [
      { label: 'Số thực R', code: '\\mathbb{R}' },
      { label: 'Số tự nhiên N', code: '\\mathbb{N}' },
      { label: 'Thuộc / Không thuộc', code: 'x \\in A, \\ y \\notin B' },
      { label: 'Tập con / Chứa', code: 'A \\subset B, \\ B \\supset A' },
      { label: 'Hợp / Giao', code: 'A \\cup B, \\ A \\cap B' },
      { label: 'Với mọi / Tồn tại', code: '\\forall x \\in X, \\ \\exists y \\in Y' },
      { label: 'Suy ra / Tương đương', code: 'P \\implies Q, \\ P \\iff Q' },
    ],
  },
  {
    category: 'Hình học',
    items: [
      { label: 'Tam giác ABC', code: '\\Delta ABC' },
      { label: 'Góc BAC', code: '\\widehat{BAC} = 60^\\circ' },
      { label: 'Vectơ v', code: '\\vec{v}, \\ \\overrightarrow{AB}' },
      { label: 'Vuông góc', code: 'd \\perp (P)' },
      { label: 'Song song', code: 'd \\parallel (Q)' },
      { label: 'Độ dài đoạn', code: '|\\overrightarrow{AB}| = AB' },
    ],
  },
  {
    category: 'Cấu trúc & Môi trường',
    items: [
      { label: 'Phân số dfrac', code: '\\dfrac{a}{b}' },
      { label: 'Căn bậc n', code: '\\sqrt[n]{x}' },
      { label: 'Hệ phương trình', code: '\\begin{cases}\n  2x + y = 5 \\\\\n  x - 3y = -1\n\\end{cases}' },
      { label: 'Ma trận vuông', code: '\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}' },
      { label: 'Căn dòng align*', code: '\\begin{align*}\n  (x+1)^2 &= x^2 + 2x + 1 \\\\\n  &= x^2 + 2x + 1\n\\end{align*}' },
      { label: 'Định lý theorem', code: '\\begin{theorem}[Tên định lý]\n  Nội dung định lý ở đây.\n\\end{theorem}' },
    ],
  },
];

// Thư viện mẫu hình vẽ TikZ sẵn
export const TIKZ_LIBRARY = [
  {
    name: 'Tam giác vuông đường cao',
    code: `\\begin{tikzpicture}[scale=0.8]
  \\coordinate (A) at (0,3);
  \\coordinate (B) at (-4,0);
  \\coordinate (C) at (2.25,0);
  \\coordinate (H) at (0,0);
  \\draw[thick, blue] (A) -- (B) -- (C) -- cycle;
  \\draw[dashed, red] (A) -- (H);
  \\draw (0,0.3) -- (0.3,0.3) -- (0.3,0);
  \\foreach \\p/\\pos in {A/above, B/below left, C/below right, H/below} {
    \\fill (\\p) circle (1.5pt);
    \\node[\\pos] at (\\p) {$\\p$};
  }
\\end{tikzpicture}`,
  },
  {
    name: 'Đường tròn ngoại tiếp tam giác',
    code: `\\begin{tikzpicture}[scale=0.7]
  \\coordinate (O) at (0,0);
  \\draw[cyan, thick] (O) circle (2.5cm);
  \\coordinate (A) at (90:2.5);
  \\coordinate (B) at (210:2.5);
  \\coordinate (C) at (330:2.5);
  \\draw[blue!80!black, thick] (A) -- (B) -- (C) -- cycle;
  \\foreach \\p/\\pos in {A/above, B/below left, C/below right, O/below} {
    \\fill (\\p) circle (1.5pt);
    \\node[\\pos] at (\\p) {$\\p$};
  }
\\end{tikzpicture}`,
  },
  {
    name: 'Hình chóp tứ giác S.ABCD',
    code: `\\begin{tikzpicture}[scale=0.8]
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (-2,-1);
  \\coordinate (C) at (2,-1);
  \\coordinate (D) at (4,0);
  \\coordinate (S) at (1,3.5);
  \\draw[thick] (S)--(B)--(C)--(D)--(S)--(C);
  \\draw[dashed] (S)--(A)--(B) (A)--(D);
  \\foreach \\p/\\pos in {S/above, A/left, B/below left, C/below, D/right} {
    \\fill (\\p) circle (1.5pt);
    \\node[\\pos] at (\\p) {$\\p$};
  }
\\end{tikzpicture}`,
  },
  {
    name: 'Hệ trục toạ độ Oxy & Parabol',
    code: `\\begin{tikzpicture}[scale=0.8]
  \\draw[->] (-3,0) -- (3,0) node[right] {$x$};
  \\draw[->] (0,-1) -- (0,4) node[above] {$y$};
  \\draw[domain=-2:2, smooth, variable=\\x, blue, thick] plot ({\\x}, {\\x*\\x});
  \\node[below left] at (0,0) {$O$};
  \\node[right, blue] at (1.5,2.25) {$y=x^2$};
\\end{tikzpicture}`,
  },
];

export default function StudioTools({
  source,
  setSource,
  insert,
  onAI,
  aiBusy,
  onAIFix,
  fixBusy,
  onOCR,
  ocrBusy,
  onImportWord,
  onExportWord,
  files,
  setFiles,
  images,
  setImages,
  history,
  restore,
  activeFileName,
  setActiveFileName,
  onTogglePresentation,
}: {
  source: string;
  setSource: (value: string) => void;
  insert: (value: string) => void;
  onAI: (action: string, customPrompt?: string) => void;
  aiBusy: boolean;
  onAIFix: () => void;
  fixBusy: boolean;
  onOCR: (file: File) => void;
  ocrBusy: boolean;
  onImportWord: (file: File) => void;
  onExportWord: () => void;
  files: StudioFile[];
  setFiles: (files: StudioFile[]) => void;
  images: StudioImage[];
  setImages: (images: StudioImage[]) => void;
  history: RestorePoint[];
  restore: (point: RestorePoint) => void;
  activeFileName: string;
  setActiveFileName: (name: string) => void;
  onTogglePresentation: () => void;
}) {
  const [tab, setTab] = useState<'symbols' | 'project' | 'history' | 'ai' | 'geometry'>('symbols');
  const [visual, setVisual] = useState(false);
  const [visualFormula, setVisualFormula] = useState('\\int_{0}^{1} x^2 \\, dx = \\dfrac{1}{3}');
  const [visualHtml, setVisualHtml] = useState('');
  const [selectedRibbonGroup, setSelectedRibbonGroup] = useState(0);
  const [customAIPrompt, setCustomAIPrompt] = useState('');

  const imageInput = useRef<HTMLInputElement>(null);
  const wordInput = useRef<HTMLInputElement>(null);
  const projectImageInput = useRef<HTMLInputElement>(null);

  // Update KaTeX preview for Visual formula builder
  useEffect(() => {
    try {
      const rendered = katex.renderToString(visualFormula, {
        displayMode: true,
        throwOnError: false,
      });
      setVisualHtml(rendered);
    } catch {
      setVisualHtml(`<span class="text-rose-500 text-xs">${visualFormula}</span>`);
    }
  }, [visualFormula]);

  // Support paste image from clipboard for instant OCR
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const file = [...(event.clipboardData?.files || [])].find((item) =>
        item.type.startsWith('image/')
      );
      if (file) {
        event.preventDefault();
        onOCR(file);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onOCR]);

  const handleUploadProjectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const size = `${(file.size / 1024).toFixed(1)} KB`;
    setImages([...images, { name: file.name, url, size }]);
  };

  return (
    <div className="relative z-10 mx-4 md:mx-6 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 overflow-hidden shadow-sm backdrop-blur-md">
      {/* Top Ribbon Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              ['symbols', <Braces key="s" className="w-3.5 h-3.5" />, 'Ký hiệu Toán'],
              ['project', <FolderTree key="p" className="w-3.5 h-3.5" />, `Dự án (${files.length})`],
              ['ai', <Sparkles key="a" className="w-3.5 h-3.5 text-indigo-500" />, 'Trợ lý AI'],
              ['geometry', <Shapes key="g" className="w-3.5 h-3.5 text-amber-500" />, 'Hình học TikZ'],
              ['history', <History key="h" className="w-3.5 h-3.5" />, 'Lịch sử nháp'],
            ] as const
          ).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                tab === id
                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons: OCR, Word, Visual Mode, Presentation Mode */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* OCR Image Button */}
          <button
            onClick={() => imageInput.current?.click()}
            disabled={ocrBusy}
            title="Quét ảnh công thức/đề thi hoặc dán Ctrl+V ảnh trực tiếp"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-violet-600 dark:text-violet-300 hover:bg-violet-500/10 border border-violet-500/20 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{ocrBusy ? 'Đang OCR…' : 'OCR ảnh'}</span>
          </button>
          <input
            ref={imageInput}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(e) => e.target.files?.[0] && onOCR(e.target.files[0])}
          />

          {/* Import Word */}
          <button
            onClick={() => wordInput.current?.click()}
            title="Nhập file Word (.docx) chứa công thức để chuyển sang LaTeX"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-blue-600 dark:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập Word</span>
          </button>
          <input
            ref={wordInput}
            hidden
            type="file"
            accept=".docx"
            onChange={(e) => e.target.files?.[0] && onImportWord(e.target.files[0])}
          />

          {/* Export Word */}
          <button
            onClick={onExportWord}
            title="Xuất tài liệu hiện tại sang Microsoft Word (.docx)"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Xuất Word</span>
          </button>

          {/* Visual Formula Mode Toggle */}
          <button
            onClick={() => setVisual(!visual)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              visual
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Gõ trực quan</span>
          </button>

          {/* Presentation Mode Toggle */}
          <button
            onClick={onTogglePresentation}
            title="Mở chế độ Trình chiếu toàn màn hình cho máy chiếu lớp học"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden lg:inline">Trình chiếu</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Math Symbols Ribbon */}
      {tab === 'symbols' && (
        <div className="p-3 space-y-2.5">
          {/* Sub category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {MATH_RIBBONS.map((group, idx) => (
              <button
                key={group.category}
                onClick={() => setSelectedRibbonGroup(idx)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedRibbonGroup === idx
                    ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {group.category}
              </button>
            ))}
          </div>

          {/* Item buttons in selected category */}
          <div className="flex flex-wrap items-center gap-2">
            {MATH_RIBBONS[selectedRibbonGroup].items.map((item) => (
              <button
                key={item.label}
                onClick={() => insert(item.code)}
                title={item.code}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950/60 hover:bg-white dark:hover:bg-slate-900 hover:border-cyan-500/50 text-xs text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-300 shadow-2xs transition cursor-pointer"
              >
                <span className="font-medium">{item.label}</span>
                <code className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-500/80 hidden sm:inline">
                  {item.code.length > 20 ? item.code.slice(0, 18) + '…' : item.code}
                </code>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Multi-file Project Manager & Images */}
      {tab === 'project' && (
        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-500" />
                Cây tệp dự án
              </span>
              <span className="text-[11px] text-slate-400">
                (Sử dụng \input&#123;tệp.tex&#125; hoặc \includegraphics)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newName = `chapter-${files.length + 1}.tex`;
                  setFiles([...files, { name: newName, content: `\\section{Chuyên đề ${files.length + 1}}\n\nNội dung chuyên đề...` }]);
                  setActiveFileName(newName);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm tệp .tex
              </button>

              <button
                onClick={() => projectImageInput.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <ImageUp className="w-3.5 h-3.5 text-amber-500" />
                Tải ảnh vào images/
              </button>
              <input
                ref={projectImageInput}
                hidden
                type="file"
                accept="image/*"
                onChange={handleUploadProjectImage}
              />
            </div>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {files.map((file, idx) => {
              const isActive = activeFileName === file.name;
              return (
                <div
                  key={file.name}
                  onClick={() => {
                    setActiveFileName(file.name);
                    setSource(file.content);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-900 dark:text-cyan-200 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-500' : 'text-slate-400'}`} />
                    <span className="truncate">{file.name}</span>
                  </div>

                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Xóa tệp ${file.name}?`)) {
                          const updated = files.filter((f) => f.name !== file.name);
                          setFiles(updated);
                          if (isActive && updated[0]) {
                            setActiveFileName(updated[0].name);
                            setSource(updated[0].content);
                          }
                        }
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Images in project */}
          {images.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5 text-amber-500" />
                Thư mục images/ ({images.length} ảnh)
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((img) => (
                  <div
                    key={img.name}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs"
                  >
                    <img src={img.url} alt={img.name} className="w-8 h-8 object-cover rounded" />
                    <div>
                      <p className="font-mono text-[11px] truncate max-w-32">{img.name}</p>
                      <button
                        onClick={() => insert(`\\includegraphics[width=0.8\\textwidth]{images/${img.name}}`)}
                        className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        Chèn vào TeX
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI Assistant & 1-Click Auto Fix */}
      {tab === 'ai' && (
        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={fixBusy}
              onClick={onAIFix}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <WandSparkles className="w-3.5 h-3.5" />
              <span>{fixBusy ? 'Đang sửa lỗi...' : '1-Click Tự Sửa Lỗi Cú Pháp (AI Auto-Fix)'}</span>
            </button>

            <button
              disabled={aiBusy}
              onClick={() => onAI('similar_5')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/15 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo 5 bài toán tương tự kèm lời giải</span>
            </button>

            <button
              disabled={aiBusy}
              onClick={() => onAI('convert_mcq')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chuyển tự luận sang trắc nghiệm 4 đáp án</span>
            </button>

            <button
              disabled={aiBusy}
              onClick={() => onAI('answer_matrix')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/15 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lập bảng đáp án & ma trận nhận thức</span>
            </button>
          </div>

          {/* Custom Prompt Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              placeholder="Yêu cầu AI tùy biến: ví dụ 'Thêm mục tóm tắt lý thuyết đạo hàm ở đầu bài'..."
              value={customAIPrompt}
              onChange={(e) => setCustomAIPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customAIPrompt.trim()) {
                  onAI('custom', customAIPrompt);
                }
              }}
              className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              disabled={aiBusy || !customAIPrompt.trim()}
              onClick={() => onAI('custom', customAIPrompt)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              {aiBusy ? 'Đang xử lý...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: TikZ Geometry Library & Canvas Bridge */}
      {tab === 'geometry' && (
        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Shapes className="w-4 h-4 text-amber-500" />
              Thư viện mẫu hình học TikZ
            </span>
            <Link
              href="/geometry"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              <span>Mở Không Gian Vẽ Canvas (/geometry) ↗</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TIKZ_LIBRARY.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col justify-between gap-2"
              >
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>
                <pre className="text-[10px] font-mono text-slate-500 overflow-hidden max-h-16 bg-slate-100 dark:bg-slate-900 p-1.5 rounded">
                  {item.code.slice(0, 100)}...
                </pre>
                <button
                  onClick={() => insert(item.code)}
                  className="w-full py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/20 cursor-pointer"
                >
                  Chèn mã TikZ vào TeX
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Auto-save History & Restore Points */}
      {tab === 'history' && (
        <div className="p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Lịch sử các mốc lưu nháp (Click để khôi phục phiên bản)
          </p>
          <div className="flex flex-wrap gap-2">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có mốc lịch sử lưu nháp.</p>
            ) : (
              history
                .slice()
                .reverse()
                .slice(0, 12)
                .map((point) => (
                  <button
                    key={point.at}
                    onClick={() => restore(point)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:border-cyan-500/50 text-xs cursor-pointer transition"
                  >
                    <History className="w-3 h-3 text-cyan-500" />
                    <span>{new Date(point.at).toLocaleTimeString('vi-VN')}</span>
                    {point.label && <span className="text-[10px] text-slate-400">({point.label})</span>}
                  </button>
                ))
            )}
          </div>
        </div>
      )}

      {/* Visual Formula Builder Floating Panel */}
      {visual && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Khung gõ công thức trực quan KaTeX
            </span>
            <button
              onClick={() => setVisual(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Nhập mã công thức:
              </label>
              <input
                type="text"
                value={visualFormula}
                onChange={(e) => setVisualFormula(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Xem trước thời gian thực:
              </label>
              <div
                dangerouslySetInnerHTML={{ __html: visualHtml }}
                className="p-2 min-h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-x-auto text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => insert(`$${visualFormula}$`)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Chèn dạng Inline ($...$)
            </button>
            <button
              onClick={() => insert(`$$${visualFormula}$$`)}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              Chèn dạng Block ($$...$$)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
