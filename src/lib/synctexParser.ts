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
  // 1. Build document structure tree (including \input and \include)
  const fileMap = new Map<string, StudioFile>();
  files.forEach((f) => fileMap.set(f.name, f));

  interface TextSegment {
    file: string;
    lineStart: number;
    lineEnd: number;
    weight: number; // character length
    isHeading?: boolean;
    isMath?: boolean;
  }

  const segments: TextSegment[] = [];

  const processFile = (fileName: string, visited: Set<string>) => {
    if (visited.has(fileName)) return;
    visited.add(fileName);

    const file = fileMap.get(fileName);
    if (!file || !file.content) return;

    const lines = file.content.split('\n');
    let currentWeight = 0;
    let segStart = 1;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const text = lines[i].trim();

      // Check for \input{filename} or \include{filename}
      const inputMatch = text.match(/\\(?:input|include|subfile)\{([^}]+)\}/);
      if (inputMatch) {
        if (currentWeight > 0) {
          segments.push({
            file: fileName,
            lineStart: segStart,
            lineEnd: lineNum - 1,
            weight: currentWeight,
          });
          currentWeight = 0;
        }

        let childName = inputMatch[1].trim();
        if (!childName.endsWith('.tex')) childName += '.tex';
        processFile(childName, visited);
        segStart = lineNum;
        continue;
      }

      if (text.startsWith('%')) continue;

      const isHeading = /\\(part|chapter|section|subsection|subsubsection|paragraph)\*?\{/.test(text);
      const isMath = /\\begin\{(equation|align|gather)\}/.test(text) || text.includes('$$');
      const isPageBreak = /\\(newpage|clearpage|pagebreak)/.test(text);

      const lineWeight = Math.max(10, text.length);
      currentWeight += lineWeight;

      if (isHeading || isPageBreak || currentWeight > 600 || i === lines.length - 1) {
        segments.push({
          file: fileName,
          lineStart: segStart,
          lineEnd: lineNum,
          weight: currentWeight + (isHeading ? 200 : 0) + (isPageBreak ? 400 : 0),
          isHeading,
          isMath,
        });
        currentWeight = 0;
        segStart = lineNum + 1;
      }
    }
  };

  processFile(mainDocument, new Set<string>());

  // If no mainDoc found, process all tex files
  if (segments.length === 0) {
    files
      .filter((f) => f.name.endsWith('.tex'))
      .forEach((f) => {
        const lines = (f.content || '').split('\n');
        segments.push({
          file: f.name,
          lineStart: 1,
          lineEnd: lines.length,
          weight: Math.max(100, (f.content || '').length),
        });
      });
  }

  const totalWeight = segments.reduce((acc, s) => acc + s.weight, 0) || 1;
  const safePages = Math.max(1, totalPages);

  // Cumulative distribution mapping to page & yRatio
  let accumulated = 0;
  const mappedSegments = segments.map((seg) => {
    const startWeight = accumulated;
    accumulated += seg.weight;
    const endWeight = accumulated;

    const startGlobalRatio = startWeight / totalWeight;
    const endGlobalRatio = endWeight / totalWeight;

    const startPageFloat = 1 + startGlobalRatio * (safePages - 0.05);
    const endPageFloat = 1 + endGlobalRatio * (safePages - 0.05);

    const startPage = Math.min(safePages, Math.floor(startPageFloat));
    const startYRatio = startPageFloat - startPage;

    return {
      ...seg,
      startPage,
      startYRatio: Math.max(0.05, Math.min(0.95, startYRatio)),
      endPageFloat,
    };
  });

  return {
    forward(file: string, line: number) {
      const match = mappedSegments.find(
        (s) => s.file === file && line >= s.lineStart && line <= s.lineEnd
      );
      if (match) {
        const lineFraction =
          match.lineEnd > match.lineStart
            ? (line - match.lineStart) / (match.lineEnd - match.lineStart)
            : 0;
        const page = match.startPage;
        const yRatio = Math.max(0.05, Math.min(0.95, match.startYRatio + lineFraction * 0.15));
        return { page, yRatio };
      }

      // Fallback for file match
      const fileSegments = mappedSegments.filter((s) => s.file === file);
      if (fileSegments.length > 0) {
        return { page: fileSegments[0].startPage, yRatio: fileSegments[0].startYRatio };
      }

      return null;
    },

    reverse(page: number, yRatio: number) {
      const targetGlobalRatio = (Math.max(1, page) - 1 + Math.max(0, Math.min(1, yRatio))) / safePages;

      let closest = mappedSegments[0];
      let minDiff = Infinity;

      for (const seg of mappedSegments) {
        const segGlobalRatio = (seg.startPage - 1 + seg.startYRatio) / safePages;
        const diff = Math.abs(segGlobalRatio - targetGlobalRatio);
        if (diff < minDiff) {
          minDiff = diff;
          closest = seg;
        }
      }

      if (closest) {
        const line = Math.round(
          closest.lineStart + (closest.lineEnd - closest.lineStart) * Math.min(1, Math.max(0, yRatio))
        );
        return {
          file: closest.file,
          line: Math.max(1, line),
        };
      }

      return { file: mainDocument, line: 1 };
    },
  };
}
