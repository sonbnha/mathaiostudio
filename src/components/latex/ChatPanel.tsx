'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Code2,
  Smile,
  Copy,
  Check,
  User,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  text: string;
  timestamp: number;
  snippet?: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, snippet?: string) => void;
  onInsertCodeSnippet?: (snippet: string) => void;
  currentUserEmail?: string;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  onInsertCodeSnippet,
  currentUserEmail = 'Bạn',
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showSnippetInput, setShowSnippetInput] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !codeSnippet.trim()) return;
    onSendMessage(inputText.trim(), codeSnippet.trim() || undefined);
    setInputText('');
    setCodeSnippet('');
    setShowSnippetInput(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 select-none overflow-hidden text-xs text-slate-700 dark:text-slate-300">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
          <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Trò chuyện nhóm (Project Chat)</span>
        </div>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
          Trực tuyến
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500 space-y-1">
            <MessageCircle className="w-8 h-8 mx-auto opacity-30 stroke-1" />
            <p className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Chưa có tin nhắn nào</p>
            <p className="text-[11px]">Gửi tin nhắn hoặc chia sẻ đoạn mã LaTeX với đồng nghiệp.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === currentUserEmail || msg.sender === 'Bạn';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {isMe ? 'Bạn' : msg.sender}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-xs ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}

                  {/* TeX Code snippet in chat */}
                  {msg.snippet && (
                    <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                      <div className="bg-black/20 dark:bg-black/40 rounded-lg p-2 font-mono text-[11px] relative group overflow-x-auto">
                        <pre className="whitespace-pre-wrap select-text">{msg.snippet}</pre>
                        <div className="flex items-center gap-1 mt-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.snippet!)}
                            className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px] flex items-center gap-0.5 cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                          {onInsertCodeSnippet && (
                            <button
                              type="button"
                              onClick={() => onInsertCodeSnippet(msg.snippet!)}
                              className="px-1.5 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-[10px] flex items-center gap-0.5 cursor-pointer text-white"
                            >
                              <Code2 className="w-3 h-3" />
                              <span>Chèn vào bài</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shrink-0">
        {showSnippetInput && (
          <div className="mb-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-100">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Đoạn mã LaTeX đính kèm:</span>
              <button
                type="button"
                onClick={() => {
                  setShowSnippetInput(false);
                  setCodeSnippet('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="\\begin{equation}\n  E = mc^2\n\\end{equation}"
              rows={3}
              className="w-full font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSnippetInput(!showSnippetInput)}
            title="Đính kèm đoạn mã LaTeX"
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSnippetInput
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn…"
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !codeSnippet.trim()}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
