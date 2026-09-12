'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Reply,
  Check,
  RotateCcw,
  GitCommit,
} from 'lucide-react';

export interface CommentItem {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  file: string;
  line?: number;
  selectedText?: string;
  createdAt: number;
  resolved: boolean;
  replies?: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: number;
  }>;
}

interface ReviewPanelProps {
  comments: CommentItem[];
  onAddComment: (comment: Omit<CommentItem, 'id' | 'createdAt' | 'resolved'>) => void;
  onResolveComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
  onReplyComment: (commentId: string, replyText: string) => void;
  onJumpToLine?: (line: number, file?: string) => void;
  activeFileName: string;
  trackChangesEnabled: boolean;
  onToggleTrackChanges: (enabled: boolean) => void;
  currentUserEmail?: string;
}

export default function ReviewPanel({
  comments,
  onAddComment,
  onResolveComment,
  onDeleteComment,
  onReplyComment,
  onJumpToLine,
  activeFileName,
  trackChangesEnabled,
  onToggleTrackChanges,
  currentUserEmail,
}: ReviewPanelProps) {
  const [filter, setFilter] = useState<'all' | 'current_file' | 'unresolved' | 'resolved'>('unresolved');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyInputId, setReplyInputId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredComments = comments.filter((c) => {
    if (filter === 'current_file') return c.file === activeFileName;
    if (filter === 'unresolved') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment({
      author: currentUserEmail || 'Bạn',
      content: newCommentText.trim(),
      file: activeFileName,
    });
    setNewCommentText('');
    setIsAddingComment(false);
  };

  const handleSendReply = (commentId: string) => {
    if (!replyText.trim()) return;
    onReplyComment(commentId, replyText.trim());
    setReplyText('');
    setReplyInputId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 select-none overflow-hidden text-xs text-slate-700 dark:text-slate-300">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Đánh giá & Bình luận (Review)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingComment(true)}
            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 text-[11px] px-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Bình luận</span>
          </button>
        </div>

        {/* Track Changes Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
              Theo dõi thay đổi (Track Changes)
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={trackChangesEnabled}
            onClick={() => onToggleTrackChanges(!trackChangesEnabled)}
            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              trackChangesEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                trackChangesEnabled ? 'translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('unresolved')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
              filter === 'unresolved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Chưa giải quyết ({comments.filter((c) => !c.resolved).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('current_file')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
              filter === 'current_file'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Tệp hiện tại
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Đã giải quyết ({comments.filter((c) => c.resolved).length})
          </button>
        </div>
      </div>

      {/* New Comment Box */}
      {isAddingComment && (
        <form onSubmit={handleCreateComment} className="p-3 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
            Bình luận trên {activeFileName}:
          </div>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Nhập nội dung nhận xét hoặc gợi ý sửa đổi…"
            rows={2}
            autoFocus
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 resize-none"
          />
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingComment(false);
                setNewCommentText('');
              }}
              className="px-2.5 py-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium cursor-pointer"
            >
              Đăng
            </button>
          </div>
        </form>
      )}

      {/* Comment List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500 space-y-1">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30 stroke-1" />
            <p className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Không có bình luận nào</p>
            <p className="text-[11px]">Bấm nút &quot;Bình luận&quot; để tạo ghi chú đánh giá cho dự án.</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl border transition ${
                comment.resolved
                  ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-xs'
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white truncate text-[11px]">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onResolveComment(comment.id)}
                    title={comment.resolved ? 'Mở lại bình luận' : 'Đánh dấu đã giải quyết'}
                    className={`p-1 rounded transition cursor-pointer ${
                      comment.resolved
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {comment.resolved ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteComment(comment.id)}
                    title="Xóa bình luận"
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Target Snippet / Line */}
              {comment.line && (
                <div
                  onClick={() => onJumpToLine?.(comment.line!, comment.file)}
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-mono cursor-pointer hover:underline mb-1.5"
                >
                  <span>{comment.file}:{comment.line}</span>
                </div>
              )}

              {/* Comment Content */}
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed break-words text-[11.5px]">
                {comment.content}
              </p>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="pl-2 border-l-2 border-emerald-500/40 text-[11px]">
                      <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <span>{reply.author}</span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Button / Box */}
              {!comment.resolved && (
                <div className="mt-2 pt-1">
                  {replyInputId === comment.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Trả lời bình luận…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReply(comment.id);
                        }}
                        autoFocus
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(comment.id)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                      >
                        Gửi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyInputId(null);
                          setReplyText('');
                        }}
                        className="px-1.5 py-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyInputId(comment.id);
                        setReplyText('');
                      }}
                      className="text-[10.5px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Trả lời</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
