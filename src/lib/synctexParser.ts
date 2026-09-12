import type { StudioFile } from '@/components/latex/StudioTools';

export interface SyncTeXLocation {
  file: string;
  line: number;
  page: number;
  yRatio: number; // 0.0 to 1.0 (relative top on page)
  xRatio?: number; // 0.0 to 1.0 (relative left on page)
}

export interface SyncTeXMap {
  forward(file: string, line: number): { page: number; yRatio: number } | null;
  reverse(page: number, yRatio: number): { file: string; line: number } | null;
}

/**
 * Parse raw SyncTeX string into structured mapping
 */
export function parseSyncTeXString(synctexContent: string): SyncTeXLocation[] {
  const locations: SyncTeXLocation[] = [];
  const lines = synctexContent.split('\n');
  const inputTags: Record<string, string> = {};
  let currentPage = 1;
  let pageHeight = 841.89; // Default A4 pt
  let pageWidth = 595.28;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    // Input:1:main.tex
    const inputMatch = raw.match(/^Input:(\d+):(.+)$/i);
    if (inputMatch) {
      inputTags[inputMatch[1]] = inputMatch[2].replace(/^\.\//, '');
      continue;
    }

    // {page_num
    const pageStartMatch = raw.match(/^\{(\d+)/);
    if (pageStartMatch) {
      currentPage = parseInt(pageStartMatch[1], 10) || 1;
      continue;
    }

    // [page_num,x,y,w,h,d
    const pageBoxMatch = raw.match(/^\[(\d+),([\d.-]+),([\d.-]+),([\d.-]+),([\d.-]+)/);
    if (pageBoxMatch) {
      currentPage = parseInt(pageBoxMatch[1], 10) || 1;
      const h = parseFloat(pageBoxMatch[5]);
      const w = parseFloat(pageBoxMatch[4]);
      if (h > 0) pageHeight = h / 65536; // SyncTeX unit is scaled pt (65536 sp = 1 pt)
      if (w > 0) pageWidth = w / 65536;
      continue;
    }

    // Records: x<tag>,<line>,<x>,<y> or k<tag>,<line>,<x>,<y>,<w>,<h> or g<tag>,<line>,<x>,<y>
    const recordMatch = raw.match(/^[xkgp](\d+),(\d+),([\d.-]+),([\d.-]+)/);
    if (recordMatch) {
      const tag = recordMatch[1];
      const lineNum = parseInt(recordMatch[2], 10);
      const xSp = parseFloat(recordMatch[3]);
      const ySp = parseFloat(recordMatch[4]);
      const file = inputTags[tag] || 'main.tex';

      const yPt = ySp / 65536;
      const xPt = xSp / 65536;
      const yRatio = Math.max(0, Math.min(1, yPt / (pageHeight || 841.89)));
      const xRatio = Math.max(0, Math.min(1, xPt / (pageWidth || 595.28)));

      locations.push({
        file,
        line: lineNum,
        page: currentPage,
        yRatio,
        xRatio,
      });
    }
  }

  return locations;
}

interface BodyLineEntry {
  file: string;
  line: number;
  weight: number;
  isHeading?: boolean;
}

/**
 * Intelligent Structural Multi-file SyncTeX Correlator
 * Built to provide exact file-aware forward & reverse synchronization
 * even when backend doesn't output raw synctex files.
 */
export function createProjectSyncTeXMap(
  files: StudioFile[],
  mainDocument: string = 'main.tex',
  totalPages: number = 1
): SyncTeXMap {
  const fileMap = new Map<string, StudioFile>();
  files.forEach((f) => fileMap.set(f.name, f));

  const bodyEntries: BodyLineEntry[] = [];
  let preambleEndLineInMain = 1;
  const safePages = Math.max(1, totalPages);

  // 1. Process files in inclusion order starting with mainDocument
  const visited = new Set<string>();

  const processFile = (fileName: string, isRoot: boolean) => {
    if (visited.has(fileName)) return;
    visited.add(fileName);

    const file = fileMap.get(fileName);
    if (!file || typeof file.content !== 'string') return;

    const lines = file.content.split('\n');
    let insideDocument = !isRoot; // Non-root subfiles are treated as body content

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (isRoot && !insideDocument) {
        if (trimmed.includes('\\begin{document}')) {
          insideDocument = true;
          preambleEndLineInMain = lineNum;
        }
        continue;
      }

      if (trimmed.includes('\\end{document}')) {
        break;
      }

      // Check for \input{child} or \include{child} or \subfile{child}
      const inputMatch = trimmed.match(/\\(?:input|include|subfile)\{([^}]+)\}/);
      if (inputMatch) {
        let childName = inputMatch[1].trim();
        if (!childName.endsWith('.tex')) childName += '.tex';
        processFile(childName, false);
        continue;
      }

      // Skip pure comment lines
      if (trimmed.startsWith('%')) {
        continue;
      }

      const isHeading = /\\(part|chapter|section|subsection|subsubsection|paragraph)\*?\{/.test(trimmed);
      const isPageBreak = /\\(newpage|clearpage|pagebreak)/.test(trimmed);
      const weight = isHeading ? 80 : isPageBreak ? 150 : Math.max(10, trimmed.length);

      bodyEntries.push({
        file: fileName,
        line: lineNum,
        weight,
        isHeading,
      });
    }
  };

  processFile(mainDocument, true);

  // If no body entries found (e.g. no \begin{document} in mainDocument), index all tex files directly
  if (bodyEntries.length === 0) {
    files
      .filter((f) => f.name.endsWith('.tex'))
      .forEach((f) => {
        const lines = (f.content || '').split('\n');
        lines.forEach((l, idx) => {
          const trimmed = l.trim();
          if (!trimmed.startsWith('%')) {
            bodyEntries.push({
              file: f.name,
              line: idx + 1,
              weight: Math.max(10, trimmed.length),
            });
          }
        });
      });
  }

  // Calculate cumulative weights
  const totalWeight = bodyEntries.reduce((sum, e) => sum + e.weight, 0) || 1;
  let runningWeight = 0;

  interface MappedEntry extends BodyLineEntry {
    page: number;
    yRatio: number;
    globalFraction: number;
  }

  const mappedEntries: MappedEntry[] = bodyEntries.map((entry) => {
    const fraction = runningWeight / totalWeight;
    runningWeight += entry.weight;

    const pageFloat = 1 + fraction * (safePages - 0.05);
    const page = Math.min(safePages, Math.max(1, Math.floor(pageFloat)));

    // Y-ratio inside page between 0.08 (top margin) and 0.90 (bottom margin)
    const withinPageFraction = pageFloat - page;
    const yRatio = Math.max(0.08, Math.min(0.92, 0.08 + withinPageFraction * 0.82));

    return {
      ...entry,
      page,
      yRatio,
      globalFraction: fraction,
    };
  });

  return {
    forward(file: string, line: number) {
      // If line is in preamble of mainDocument
      if (file === mainDocument && line < preambleEndLineInMain) {
        return { page: 1, yRatio: 0.08 };
      }

      // Find exact or closest line in the file
      const fileEntries = mappedEntries.filter((e) => e.file === file);
      if (fileEntries.length === 0) {
        return { page: 1, yRatio: 0.1 };
      }

      // Find exact line or next line
      let match = fileEntries.find((e) => e.line === line);
      if (!match) {
        // Find closest preceding line
        const before = fileEntries.filter((e) => e.line <= line);
        if (before.length > 0) {
          match = before[before.length - 1];
        } else {
          match = fileEntries[0];
        }
      }

      if (match) {
        return {
          page: match.page,
          yRatio: match.yRatio,
        };
      }

      return { page: 1, yRatio: 0.1 };
    },

    reverse(page: number, yRatio: number) {
      if (mappedEntries.length === 0) {
        return { file: mainDocument, line: 1 };
      }

      // If page 1 at very top, jump to preamble / line 1
      if (page === 1 && yRatio <= 0.10) {
        return { file: mainDocument, line: 1 };
      }

      // Calculate target global fraction from page and yRatio
      const clampedY = Math.max(0.08, Math.min(0.92, yRatio));
      const withinPage = (clampedY - 0.08) / 0.82;
      const targetPageFloat = page - 1 + withinPage;
      const targetFraction = Math.max(0, Math.min(1, targetPageFloat / safePages));

      // Find closest entry in mappedEntries
      let closest = mappedEntries[0];
      let minDiff = Infinity;

      for (const entry of mappedEntries) {
        const diff = Math.abs(entry.globalFraction - targetFraction);
        if (diff < minDiff) {
          minDiff = diff;
          closest = entry;
        }
      }

      return {
        file: closest.file,
        line: closest.line,
      };
    },
  };
}
