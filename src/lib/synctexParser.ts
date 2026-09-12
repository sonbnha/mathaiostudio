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
  isPageBreak?: boolean;
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

  const safePages = Math.max(1, totalPages);
  const mainFile =
    fileMap.get(mainDocument) ||
    files.find((f) => f.name.endsWith('.tex')) ||
    files[0];
  const effectiveMainDoc = mainFile ? mainFile.name : mainDocument;
  const mainContent = mainFile && typeof mainFile.content === 'string' ? mainFile.content : '';
  const mainLines = mainContent.split('\n');

  // Find \begin{document} and \end{document} in main document
  let beginDocLine = -1;
  let endDocLine = mainLines.length;

  for (let i = 0; i < mainLines.length; i++) {
    const trimmed = mainLines[i].trim();
    if (beginDocLine === -1 && trimmed.includes('\\begin{document}')) {
      beginDocLine = i + 1;
    }
    if (trimmed.includes('\\end{document}')) {
      endDocLine = i + 1;
      break;
    }
  }

  // Ordered list of all body lines across files
  const bodyEntries: BodyLineEntry[] = [];
  const visited = new Set<string>();

  const processFile = (fileName: string, isRoot: boolean) => {
    if (visited.has(fileName)) return;
    visited.add(fileName);

    const file = fileMap.get(fileName);
    if (!file || typeof file.content !== 'string') return;

    const lines = file.content.split('\n');
    const startLine = isRoot && beginDocLine !== -1 ? beginDocLine : 1;
    const stopLine = isRoot && endDocLine !== -1 ? endDocLine : lines.length;

    for (let i = startLine - 1; i < stopLine; i++) {
      const lineNum = i + 1;
      const text = lines[i];
      const trimmed = text.trim();

      // Check subfile inclusion: \input{...}, \include{...}, \subfile{...}
      const inputMatch = trimmed.match(/\\(?:input|include|subfile)\{([^}]+)\}/);
      if (inputMatch) {
        let childName = inputMatch[1].trim();
        if (!childName.endsWith('.tex')) childName += '.tex';
        processFile(childName, false);
        continue;
      }

      const isHeading = /\\(part|chapter|section|subsection|subsubsection|paragraph)\*?\{/.test(trimmed);
      const isPageBreak = /\\(newpage|clearpage|pagebreak)/.test(trimmed);
      const weight = isPageBreak ? 100 : isHeading ? 60 : 30 + Math.min(40, trimmed.length);

      bodyEntries.push({
        file: fileName,
        line: lineNum,
        weight,
        isPageBreak,
      });
    }
  };

  processFile(effectiveMainDoc, true);

  // Fallback: If no body entries found, map every line of main file
  if (bodyEntries.length === 0) {
    mainLines.forEach((_, idx) => {
      bodyEntries.push({
        file: effectiveMainDoc,
        line: idx + 1,
        weight: 30,
      });
    });
  }

  // Segment entries by explicit page breaks if present
  const pageBreakIndices: number[] = [];
  bodyEntries.forEach((entry, idx) => {
    if (entry.isPageBreak) {
      pageBreakIndices.push(idx);
    }
  });

  interface MappedEntry extends BodyLineEntry {
    page: number;
    yRatio: number;
    globalT: number; // 0.0 to 1.0 continuous
  }

  const mappedEntries: MappedEntry[] = [];
  const totalWeight = bodyEntries.reduce((sum, e) => sum + e.weight, 0) || 1;

  if (pageBreakIndices.length > 0 && safePages > 1) {
    // We have explicit \newpage markers
    let currentSegmentStart = 0;
    const segments: Array<{ start: number; end: number }> = [];
    for (const pbIdx of pageBreakIndices) {
      segments.push({ start: currentSegmentStart, end: pbIdx });
      currentSegmentStart = pbIdx + 1;
    }
    if (currentSegmentStart < bodyEntries.length) {
      segments.push({ start: currentSegmentStart, end: bodyEntries.length - 1 });
    }

    segments.forEach((seg, segIdx) => {
      const page = Math.min(safePages, segIdx + 1);
      const segEntries = bodyEntries.slice(seg.start, seg.end + 1);
      const segWeight = segEntries.reduce((sum, e) => sum + e.weight, 0) || 1;
      let segRunning = 0;

      segEntries.forEach((entry) => {
        const mid = segRunning + entry.weight / 2;
        segRunning += entry.weight;
        const localT = mid / segWeight; // 0.0 to 1.0 within page
        const yRatio = Math.max(0.08, Math.min(0.92, 0.08 + localT * 0.82));
        const globalT = ((page - 1) + localT) / safePages;

        mappedEntries.push({
          ...entry,
          page,
          yRatio,
          globalT,
        });
      });
    });
  } else {
    // Proportional continuous smooth mapping across safePages
    let runningWeight = 0;
    bodyEntries.forEach((entry) => {
      const entryMidWeight = runningWeight + entry.weight / 2;
      runningWeight += entry.weight;

      const globalT = Math.max(0, Math.min(1, entryMidWeight / totalWeight));
      const pageFloat = 1 + globalT * (safePages - 0.02);
      const page = Math.min(safePages, Math.max(1, Math.floor(pageFloat)));

      const withinPageFraction = pageFloat - page;
      const yRatio = Math.max(0.08, Math.min(0.92, 0.08 + withinPageFraction * 0.82));

      mappedEntries.push({
        ...entry,
        page,
        yRatio,
        globalT,
      });
    });
  }

  return {
    forward(file: string, line: number) {
      const targetFile = fileMap.has(file) ? file : effectiveMainDoc;

      // If line is before \begin{document} in main file
      if (targetFile === effectiveMainDoc && beginDocLine !== -1 && line < beginDocLine) {
        return { page: 1, yRatio: 0.08 };
      }

      // If line is after \end{document} in main file
      if (targetFile === effectiveMainDoc && endDocLine !== -1 && line > endDocLine) {
        return { page: safePages, yRatio: 0.90 };
      }

      let fileEntries = mappedEntries.filter((e) => e.file === targetFile);
      if (fileEntries.length === 0) {
        fileEntries = mappedEntries;
      }
      if (fileEntries.length === 0) {
        return { page: 1, yRatio: 0.08 };
      }

      // Find exact or closest line
      let match = fileEntries.find((e) => e.line === line);
      if (!match) {
        const before = fileEntries.filter((e) => e.line <= line);
        if (before.length > 0) {
          match = before[before.length - 1];
        } else {
          match = fileEntries[0];
        }
      }

      return {
        page: Math.min(safePages, Math.max(1, match.page)),
        yRatio: Math.max(0.05, Math.min(0.95, match.yRatio)),
      };
    },

    reverse(page: number, yRatio: number) {
      if (mappedEntries.length === 0) {
        return { file: effectiveMainDoc, line: Math.max(1, beginDocLine) };
      }

      const clampedPage = Math.min(safePages, Math.max(1, page));
      // Top margin of Page 1 -> Preamble / begin document
      if (clampedPage === 1 && yRatio <= 0.09) {
        return { file: effectiveMainDoc, line: Math.max(1, beginDocLine) };
      }

      const clampedY = Math.max(0.08, Math.min(0.92, yRatio));
      const withinPage = (clampedY - 0.08) / 0.82;
      const targetPageFloat = (clampedPage - 1) + withinPage;
      const targetGlobalT = Math.max(0, Math.min(1, targetPageFloat / safePages));

      let closest = mappedEntries[0];
      let minDiff = Infinity;

      for (const entry of mappedEntries) {
        const diff = Math.abs(entry.globalT - targetGlobalT);
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
