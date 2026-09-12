/** Positions returned by the native SyncTeX executable, in PDF points (72/inch). */
export interface PDFSyncTarget {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface SourceSyncTarget { file: string; line: number }

/** Resolve only an exact path or an unambiguous suffix; never guess between same-named chapters. */
export function resolveProjectPath(path: string, files: string[]): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/\/\.\//g, '/').replace(/^\.\//, '');
  if (files.includes(normalized)) return normalized;
  const matches = files.filter(file => normalized.endsWith('/' + file));
  return matches.length === 1 ? matches[0] : null;
}

/** Includes all source/assets/settings. Switching the active tab is not a document change. */
export function compileFingerprint(files: Array<{name: string; content: string}>, images: Array<{name: string; dataUrl?: string; url?: string}>, main: string, engine: string, draft?: boolean, stop?: boolean): string {
  return JSON.stringify({ files: [...files].sort((a, b) => a.name.localeCompare(b.name)),
    images: images.map(i => ({name: i.name, data: i.dataUrl || i.url || ''})).sort((a, b) => a.name.localeCompare(b.name)),
    main, engine, draft: !!draft, stop: !!stop });
}
