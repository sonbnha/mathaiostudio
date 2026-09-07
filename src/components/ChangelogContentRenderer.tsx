import React from 'react';

export interface ChangelogEntry {
  type: string;
  description?: string;
  content?: string;
}

export interface GroupedChangelog {
  features: ChangelogEntry[];
  improvements: ChangelogEntry[];
  fixes: ChangelogEntry[];
  notes: ChangelogEntry[];
}

export function groupChangelogEntries(changes?: ChangelogEntry[]): GroupedChangelog {
  const result: GroupedChangelog = {
    features: [],
    improvements: [],
    fixes: [],
    notes: [],
  };

  if (!Array.isArray(changes)) return result;

  changes.forEach((c) => {
    const rawType = (c.type || 'note').toLowerCase().trim();
    if (rawType === 'feat') {
      result.features.push(c);
    } else if (rawType === 'improve') {
      result.improvements.push(c);
    } else if (rawType === 'fix') {
      result.fixes.push(c);
    } else {
      result.notes.push(c);
    }
  });

  return result;
}

function FormattedContent({ text }: { text: string }) {
  // If the line has a colon, emphasize the prefix before colon
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 50) {
    const lead = text.slice(0, colonIdx);
    const rest = text.slice(colonIdx + 1);
    return (
      <span className="text-sm text-slate-300 leading-relaxed font-normal">
        <span className="font-medium text-slate-100">{lead}:</span>
        {rest}
      </span>
    );
  }
  return <span className="text-sm text-slate-300 leading-relaxed font-normal">{text}</span>;
}

export default function ChangelogContentRenderer({
  changes,
}: {
  changes?: ChangelogEntry[];
}) {
  const grouped = groupChangelogEntries(changes);
  const hasAny =
    grouped.features.length > 0 ||
    grouped.improvements.length > 0 ||
    grouped.fixes.length > 0 ||
    grouped.notes.length > 0;

  if (!hasAny) {
    return (
      <p className="text-xs italic text-slate-500">Chưa có nội dung cập nhật nào...</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✦ FEATURES */}
      {grouped.features.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold text-xs tracking-wider uppercase font-mono flex items-center gap-1.5">
              <span>✦</span>
              <span>Tính Năng Mới</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded">
              {grouped.features.length}
            </span>
          </div>
          <ul className="space-y-2.5 pl-0.5">
            {grouped.features.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <FormattedContent text={item.content || item.description || ''} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ⚡ IMPROVEMENTS */}
      {grouped.improvements.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-semibold text-xs tracking-wider uppercase font-mono flex items-center gap-1.5">
              <span>⚡</span>
              <span>Cải Tiến & Hiệu Năng</span>
            </span>
            <span className="text-[10px] font-mono text-sky-400/80 bg-sky-950/40 border border-sky-800/60 px-1.5 py-0.5 rounded">
              {grouped.improvements.length}
            </span>
          </div>
          <ul className="space-y-2.5 pl-0.5">
            {grouped.improvements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                <FormattedContent text={item.content || item.description || ''} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🛠 FIXES */}
      {grouped.fixes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-semibold text-xs tracking-wider uppercase font-mono flex items-center gap-1.5">
              <span>🛠</span>
              <span>Sửa Lỗi & Ổn Định</span>
            </span>
            <span className="text-[10px] font-mono text-rose-400/80 bg-rose-950/40 border border-rose-800/60 px-1.5 py-0.5 rounded">
              {grouped.fixes.length}
            </span>
          </div>
          <ul className="space-y-2.5 pl-0.5">
            {grouped.fixes.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                <FormattedContent text={item.content || item.description || ''} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 📝 NOTES */}
      {grouped.notes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold text-xs tracking-wider uppercase font-mono flex items-center gap-1.5">
              <span>📝</span>
              <span>Ghi Chú & Khác</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400/80 bg-slate-800/40 border border-slate-700/60 px-1.5 py-0.5 rounded">
              {grouped.notes.length}
            </span>
          </div>
          <ul className="space-y-2.5 pl-0.5">
            {grouped.notes.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-slate-400" />
                <FormattedContent text={item.content || item.description || ''} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
