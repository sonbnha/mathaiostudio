'use client';

import React, { useState } from 'react';
import { X, Code2, Cpu, Palette, Check } from 'lucide-react';
import type { ProjectSettings } from './projectSettings';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  onUpdateSettings: (newSettings: Partial<ProjectSettings>) => void;
  texFiles: string[];
}

type TabType = 'editor' | 'compiler' | 'appearance';

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  texFiles,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('editor');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-settings-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full h-[540px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <h2 id="project-settings-title" className="text-base font-bold text-slate-900 dark:text-white">
              Cài đặt dự án
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Overleaf Sync
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng cài đặt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (2 columns) */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Column (Navigation) */}
          <div className="w-52 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-1 shrink-0 bg-slate-50/30 dark:bg-slate-900/30">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Code2 className="w-4 h-4 shrink-0" />
              <span>Trình soạn thảo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compiler')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeTab === 'compiler'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Biên dịch</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>Giao diện</span>
            </button>
          </div>

          {/* Right Column (Content Panel) */}
          <div className="flex-1 min-h-0 p-6 overflow-y-auto">
            {/* TAB 1: EDITOR */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    Cấu hình Trình soạn thảo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tùy biến hành vi gõ mã nguồn và phím tắt CodeMirror 6.
                  </p>
                </div>

                <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* Auto Close Brackets */}
                  <div className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Đóng ngoặc tự động (Auto-close brackets)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tự động chèn cặp ngoặc đóng tương ứng (), [], {}, $$ khi bạn gõ ngoặc mở.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.autoCloseBrackets}
                      onClick={() => onUpdateSettings({ autoCloseBrackets: !settings.autoCloseBrackets })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.autoCloseBrackets ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          settings.autoCloseBrackets ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Autocomplete */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Gợi ý mã tự động (Auto-complete)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Hiển thị danh sách gợi ý công thức và lệnh LaTeX khi gõ dấu gạch chéo (\).
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.autoComplete}
                      onClick={() => onUpdateSettings({ autoComplete: !settings.autoComplete })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.autoComplete ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          settings.autoComplete ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Non-blinking cursor */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Con trỏ tĩnh (Non-blinking cursor)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tắt hiệu ứng nhấp nháy của con trỏ chuột trong vùng soạn thảo.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.nonBlinkingCursor}
                      onClick={() => onUpdateSettings({ nonBlinkingCursor: !settings.nonBlinkingCursor })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.nonBlinkingCursor ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          settings.nonBlinkingCursor ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Keybindings (Standard vs Vim) */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Chế độ phím (Keybindings)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Lựa chọn phím tắt chuẩn Overleaf hoặc chế độ điều hướng Vim.
                      </div>
                    </div>
                    <select
                      aria-label="Chọn chế độ phím"
                      value={settings.keybindings}
                      onChange={(e) => onUpdateSettings({ keybindings: e.target.value as 'standard' | 'vim' })}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      <option value="standard">Chuẩn (Standard)</option>
                      <option value="vim">Vim</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPILER */}
            {activeTab === 'compiler' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    Cấu hình Trình biên dịch
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chọn tệp tài liệu chính, engine TeX và hành vi tự động tạo PDF.
                  </p>
                </div>

                <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* Main Document */}
                  <div className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Tài liệu chính (Main document)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tệp gốc dùng để nạp vào trình biên dịch PDF khi bấm Recompile.
                      </div>
                    </div>
                    <select
                      aria-label="Chọn tài liệu chính"
                      value={settings.mainDocument}
                      onChange={(e) => onUpdateSettings({ mainDocument: e.target.value })}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 min-w-[140px]"
                    >
                      {texFiles.map((file) => (
                        <option key={file} value={file}>
                          {file}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TeX Compiler Engine */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Trình biên dịch (LaTeX Engine)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Engine xử lý font Unicode và gói toán học (khuyến nghị XeLaTeX cho tiếng Việt).
                      </div>
                    </div>
                    <select
                      aria-label="Chọn trình biên dịch LaTeX"
                      value={settings.compiler}
                      onChange={(e) =>
                        onUpdateSettings({
                          compiler: e.target.value as 'xelatex' | 'pdflatex' | 'lualatex',
                        })
                      }
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 min-w-[140px]"
                    >
                      <option value="xelatex">XeLaTeX (Khuyên dùng)</option>
                      <option value="pdflatex">pdfLaTeX</option>
                      <option value="lualatex">LuaLaTeX</option>
                    </select>
                  </div>

                  {/* Auto-compile */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Tự động biên dịch (Auto-compile)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tự động biên dịch lại PDF sau 2.5 giây khi bạn dừng gõ.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.autoCompile}
                      onClick={() => onUpdateSettings({ autoCompile: !settings.autoCompile })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.autoCompile ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          settings.autoCompile ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    Giao diện & Phông chữ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tùy chỉnh chủ đề ứng dụng, phối màu CodeMirror 6, chế độ xem trước PDF ban đêm và bố cục phông chữ.
                  </p>
                </div>

                <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* Overall Theme */}
                  <div className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Giao diện tổng thể (Overall theme)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Chuyển đổi giao diện thanh công cụ, cây thư mục và khung làm việc giữa nền sáng và nền tối.
                      </div>
                    </div>
                    <select
                      aria-label="Chọn giao diện tổng thể"
                      value={settings.theme || settings.overallTheme || 'dark'}
                      onChange={(e) => {
                        const val = e.target.value as 'light' | 'dark';
                        onUpdateSettings({ theme: val, overallTheme: val });
                      }}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 min-w-[160px]"
                    >
                      <option value="light">Sáng (Light Mode)</option>
                      <option value="dark">Tối (Dark Mode)</option>
                    </select>
                  </div>

                  {/* Editor Theme */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Phối màu soạn thảo (Editor theme)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Bộ màu cú pháp CodeMirror 6 độc lập (hỗ trợ nền ngoài Sáng nhưng editor Tối).
                      </div>
                    </div>
                    <select
                      aria-label="Chọn phối màu soạn thảo"
                      value={settings.editorTheme || (settings.theme === 'dark' ? 'one-dark' : 'overleaf-light')}
                      onChange={(e) => onUpdateSettings({ editorTheme: e.target.value })}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 min-w-[160px]"
                    >
                      <optgroup label="Giao diện sáng">
                        <option value="overleaf-light">Theme sáng chuẩn (Overleaf Light)</option>
                        <option value="github-light">GitHub Light</option>
                        <option value="eclipse">Eclipse</option>
                      </optgroup>
                      <optgroup label="Giao diện tối">
                        <option value="one-dark">One Dark (Mặc định)</option>
                        <option value="dracula">Dracula</option>
                        <option value="monokai">Monokai</option>
                        <option value="nord">Nord</option>
                        <option value="sublime">Sublime / Cobalt</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Dark Mode PDF Preview */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Chế độ xem trước PDF ban đêm (Dark mode PDF preview)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Đảo màu thông minh cho khung xem PDF giúp dịu mắt khi làm việc buổi tối.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.pdfInvertColors}
                      onClick={() => onUpdateSettings({ pdfInvertColors: !settings.pdfInvertColors })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.pdfInvertColors ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          settings.pdfInvertColors ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Editor Font Size */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Cỡ chữ soạn thảo (Editor font size)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Kích thước phông chữ trong vùng biên tập mã nguồn.
                      </div>
                    </div>
                    <select
                      aria-label="Chọn cỡ chữ soạn thảo"
                      value={settings.fontSize || settings.editorFontSize || 14}
                      onChange={(e) => {
                        const sz = Number(e.target.value);
                        onUpdateSettings({ fontSize: sz, editorFontSize: sz });
                      }}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 min-w-[160px]"
                    >
                      <option value={12}>12 px</option>
                      <option value={14}>14 px (Mặc định)</option>
                      <option value={16}>16 px</option>
                      <option value={18}>18 px</option>
                    </select>
                  </div>

                  {/* Editor Line Height */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Giãn cách dòng soạn thảo (Editor line height)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Khoảng cách giữa các dòng mã nguồn trong CodeMirror.
                      </div>
                    </div>
                    <select
                      aria-label="Chọn giãn cách dòng soạn thảo"
                      value={settings.lineHeight || settings.editorLineHeight || '1.5'}
                      onChange={(e) => {
                        const lh = e.target.value;
                        onUpdateSettings({ lineHeight: lh, editorLineHeight: lh });
                      }}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 min-w-[160px]"
                    >
                      <option value="1.2">Gọn gàng (Compact 1.2)</option>
                      <option value="1.5">Tiêu chuẩn (Normal 1.5)</option>
                      <option value="1.8">Thoáng đãng (Relaxed 1.8)</option>
                    </select>
                  </div>

                  {/* Font Family */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Phông chữ soạn thảo (Font family)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Kiểu phông chữ đơn cách (Monospace font) hiển thị rõ nét ký tự toán học.
                      </div>
                    </div>
                    <select
                      aria-label="Chọn phông chữ soạn thảo"
                      value={settings.fontFamily}
                      onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 min-w-[160px]"
                    >
                      <option value="JetBrains Mono">JetBrains Mono</option>
                      <option value="Fira Code">Fira Code</option>
                      <option value="Monaco, Menlo, monospace">Monaco / Menlo</option>
                      <option value="monospace">Monospace mặc định</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Xong</span>
          </button>
        </div>
      </div>
    </div>
  );
}
