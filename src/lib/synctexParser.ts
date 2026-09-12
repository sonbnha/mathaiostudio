export interface SyncTeXBox {
  file: string;
  line: number;
  page: number;
  x: number; // pt
  y: number; // pt
  width: number; // pt
  height: number; // pt
}

export class SyncTeXParser {
  private inputTags: Record<string, string> = {};
  private boxes: SyncTeXBox[] = [];

  constructor(synctexContent: string) {
    this.parse(synctexContent);
  }

  private parse(content: string) {
    const lines = content.split('\n');
    let currentPage = 1;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // Input
      if (line.startsWith('Input:')) {
        const match = line.match(/^Input:(\d+):(.+)$/i);
        if (match) {
          this.inputTags[match[1]] = match[2].replace(/^\.\//, '');
        }
        continue;
      }

      // Page start
      if (line.startsWith('{')) {
        const match = line.match(/^\{(\d+)/);
        if (match) {
          currentPage = parseInt(match[1], 10) || 1;
        }
        continue;
      }

      // Record with tag and line: [ ( x k g $ h
      const match = line.match(/^[\[\(xkg\$h](\d+),(\d+):([\d.-]+),([\d.-]+)(?::([\d.-]+),([\d.-]+),([\d.-]+))?/);
      if (match) {
        const tag = match[1];
        const lineNum = parseInt(match[2], 10);
        const xSp = parseFloat(match[3]);
        const ySp = parseFloat(match[4]);
        
        // Convert from sp to pt
        const xPt = xSp / 65536;
        const yPt = ySp / 65536;
        
        let widthPt = 0;
        let heightPt = 0;

        // If it's a box with width and height/depth
        if (match[5] !== undefined) {
          const wSp = parseFloat(match[5]);
          widthPt = wSp / 65536;
        }
        
        if (match[6] !== undefined) {
          const hSp = parseFloat(match[6]);
          heightPt = hSp / 65536;
          // Add depth if present
          if (match[7] !== undefined) {
            heightPt += parseFloat(match[7]) / 65536;
          }
        }

        const file = this.inputTags[tag] || 'main.tex';

        this.boxes.push({
          file,
          line: lineNum,
          page: currentPage,
          x: xPt,
          y: yPt - heightPt, // In SyncTeX, y is usually the baseline, so top = y - height
          width: widthPt || 5, // fallback width
          height: heightPt || 5, // fallback height
        });
      }
    }
  }

  /**
   * Find bounding boxes in the PDF for a specific file and line
   */
  public getByLine(file: string, line: number): SyncTeXBox[] {
    // Filter boxes for this file and exact line
    let matches = this.boxes.filter(b => b.file === file && b.line === line && b.width > 0);
    
    // If no exact match, try finding the closest line (within 5 lines)
    if (matches.length === 0) {
      const fileBoxes = this.boxes.filter(b => b.file === file && b.width > 0);
      let closestLine = -1;
      let minDiff = Infinity;
      
      for (const box of fileBoxes) {
        const diff = Math.abs(box.line - line);
        if (diff < minDiff && diff <= 5) {
          minDiff = diff;
          closestLine = box.line;
        }
      }
      
      if (closestLine !== -1) {
        matches = fileBoxes.filter(b => b.line === closestLine);
      }
    }
    
    return matches;
  }

  /**
   * Find the closest file and line for a given PDF coordinate (in pt)
   */
  public getByPosition(page: number, xPt: number, yPt: number): { file: string; line: number } | null {
    const pageBoxes = this.boxes.filter(b => b.page === page);
    if (pageBoxes.length === 0) return null;

    let closestBox: SyncTeXBox | null = null;
    let minDistance = Infinity;

    for (const box of pageBoxes) {
      // Calculate distance from point to box center
      const boxCenterX = box.x + box.width / 2;
      const boxCenterY = box.y + box.height / 2;
      
      const dx = boxCenterX - xPt;
      const dy = boxCenterY - yPt;
      
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDistance) {
        minDistance = dist;
        closestBox = box;
      }
    }

    if (closestBox) {
      return {
        file: closestBox.file,
        line: closestBox.line
      };
    }

    return null;
  }
}
