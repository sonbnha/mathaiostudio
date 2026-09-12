import {
  CompletionContext,
  CompletionResult,
  Completion,
  snippet,
} from '@codemirror/autocomplete';
import type { StudioFile, StudioImage } from '@/components/latex/StudioTools';

export interface BibEntry {
  key: string;
  type: string;
  title?: string;
  author?: string;
  year?: string;
  journal?: string;
}

export function parseBibTeXEntries(bibContent: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)(?=\n@|\n*$)/g;
  let match;

  while ((match = entryRegex.exec(bibContent)) !== null) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const body = match[3];

    const getField = (field: string) => {
      const fieldRegex = new RegExp(`${field}\\s*=\\s*[{"]?([^}"]+)[}"]?`, 'i');
      const m = body.match(fieldRegex);
      return m ? m[1].trim() : undefined;
    };

    entries.push({
      key,
      type,
      title: getField('title'),
      author: getField('author'),
      year: getField('year'),
      journal: getField('journal') || getField('booktitle'),
    });
  }

  return entries;
}

export function extractProjectBibEntries(files: StudioFile[]): BibEntry[] {
  const allEntries: BibEntry[] = [];
  const seenKeys = new Set<string>();

  for (const file of files) {
    if (file.name.endsWith('.bib')) {
      const parsed = parseBibTeXEntries(file.content || '');
      for (const entry of parsed) {
        if (!seenKeys.has(entry.key)) {
          seenKeys.add(entry.key);
          allEntries.push(entry);
        }
      }
    } else if (file.name.endsWith('.tex')) {
      // Also extract \bibitem{key}
      const bibitemRegex = /\\bibitem(?:\[[^\]]*\])?\{([^}]+)\}/g;
      let m;
      while ((m = bibitemRegex.exec(file.content || '')) !== null) {
        const key = m[1].trim();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allEntries.push({ key, type: 'bibitem', title: `bibitem in ${file.name}` });
        }
      }
    }
  }

  return allEntries;
}

export interface ProjectLabel {
  key: string;
  fileName: string;
  line: number;
}

export function extractProjectLabels(files: StudioFile[]): ProjectLabel[] {
  const labels: ProjectLabel[] = [];
  const seenKeys = new Set<string>();

  for (const file of files) {
    if (!file.name.endsWith('.tex')) continue;
    const lines = (file.content || '').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/\\label\{([^}]+)\}/g);
      if (match) {
        for (const m of match) {
          const keyMatch = m.match(/\\label\{([^}]+)\}/);
          if (keyMatch && keyMatch[1]) {
            const key = keyMatch[1].trim();
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              labels.push({ key, fileName: file.name, line: i + 1 });
            }
          }
        }
      }
    }
  }

  return labels;
}

const COMMON_ENVIRONMENTS = [
  { name: 'equation', desc: 'Công thức toán học có đánh số' },
  { name: 'equation*', desc: 'Công thức toán học không đánh số' },
  { name: 'align', desc: 'Hệ phương trình căn lề có đánh số' },
  { name: 'align*', desc: 'Hệ phương trình căn lề không đánh số' },
  { name: 'gather', desc: 'Gom nhóm công thức căn giữa' },
  { name: 'cases', desc: 'Hệ điều kiện hoặc hàm phân nhánh' },
  { name: 'pmatrix', desc: 'Ma trận dấu ngoặc tròn ( )' },
  { name: 'bmatrix', desc: 'Ma trận dấu ngoặc vuông [ ]' },
  { name: 'vmatrix', desc: 'Định thức ma trận | |' },
  { name: 'tikzpicture', desc: 'Môi trường vẽ hình học TikZ' },
  { name: 'figure', desc: 'Khối hình ảnh nổi (floating figure)' },
  { name: 'table', desc: 'Khối bảng biểu nổi (floating table)' },
  { name: 'tabular', desc: 'Bảng dữ liệu cơ bản' },
  { name: 'tabularx', desc: 'Bảng tự co giãn theo chiều rộng trang' },
  { name: 'itemize', desc: 'Danh sách gạch đầu dòng không thứ tự' },
  { name: 'enumerate', desc: 'Danh sách có thứ tự 1, 2, 3...' },
  { name: 'description', desc: 'Danh sách định nghĩa thuật ngữ' },
  { name: 'abstract', desc: 'Tóm tắt bài báo / tài liệu' },
  { name: 'theorem', desc: 'Môi trường Định lý' },
  { name: 'lemma', desc: 'Môi trường Bổ đề' },
  { name: 'proof', desc: 'Môi trường Chứng minh' },
  { name: 'definition', desc: 'Môi trường Định nghĩa' },
  { name: 'example', desc: 'Môi trường Ví dụ minh họa' },
  { name: 'exercise', desc: 'Môi trường Bài tập' },
  { name: 'solution', desc: 'Môi trường Lời giải' },
  { name: 'multicols', desc: 'Chia văn bản thành nhiều cột' },
  { name: 'minipage', desc: 'Hộp trang con minipage' },
  { name: 'center', desc: 'Căn giữa nội dung' },
  { name: 'verbatim', desc: 'Văn bản thô nguyên bản' },
  { name: 'lstlisting', desc: 'Khối chèn mã nguồn lập trình' },
  { name: 'tcolorbox', desc: 'Khối khung viền màu nâng cao' },
  { name: 'document', desc: 'Thân chính của tài liệu LaTeX' },
];

const COMMON_PACKAGES = [
  { name: 'amsmath', desc: 'Hỗ trợ công thức toán học nâng cao' },
  { name: 'amssymb', desc: 'Ký hiệu và font chữ toán học mở rộng' },
  { name: 'amsfonts', desc: 'Bộ font toán học TeX' },
  { name: 'graphicx', desc: 'Chèn và xử lý hình ảnh' },
  { name: 'geometry', desc: 'Thiết lập kích thước lề trang và khổ giấy' },
  { name: 'hyperref', desc: 'Tạo siêu liên kết và bookmark PDF' },
  { name: 'xcolor', desc: 'Quản lý màu sắc chữ và nền' },
  { name: 'tikz', desc: 'Gói vẽ đồ họa vector và hình học' },
  { name: 'float', desc: 'Kiểm soát vị trí đặt hình [H]' },
  { name: 'booktabs', desc: 'Kẻ bảng biểu chuyên nghiệp' },
  { name: 'array', desc: 'Mở rộng định dạng cột bảng' },
  { name: 'subcaption', desc: 'Chèn nhiều hình phụ subfigure' },
  { name: 'multicol', desc: 'Chia nhiều cột văn bản' },
  { name: 'enumitem', desc: 'Tùy biến danh sách enumerate/itemize' },
  { name: 'fancyhdr', desc: 'Tùy biến header và footer trang' },
  { name: 'titlesec', desc: 'Tùy biến định dạng tiêu đề mục' },
  { name: 'tcolorbox', desc: 'Tạo khung hộp màu đẹp mắt' },
  { name: 'biblatex', desc: 'Hệ thống quản lý tài liệu tham khảo hiện đại' },
  { name: 'natbib', desc: 'Trích dẫn tài liệu tham khảo chuẩn tác giả-năm' },
  { name: 'microtype', desc: 'Tối ưu hóa typography và khoảng cách chữ' },
  { name: 'siunitx', desc: 'Định dạng đơn vị đo lường chuẩn SI' },
  { name: 'listings', desc: 'Định dạng hiển thị mã nguồn lập trình' },
];

const COMMON_COMMANDS: Completion[] = [
  { label: '\\textbf', detail: 'Chữ in đậm', type: 'function', apply: snippet('\\textbf{${text}}') },
  { label: '\\textit', detail: 'Chữ in nghiêng', type: 'function', apply: snippet('\\textit{${text}}') },
  { label: '\\underline', detail: 'Gạch chân', type: 'function', apply: snippet('\\underline{${text}}') },
  { label: '\\section', detail: 'Mục cấp 1', type: 'function', apply: snippet('\\section{${Tiêu đề}}\n') },
  { label: '\\subsection', detail: 'Mục cấp 2', type: 'function', apply: snippet('\\subsection{${Tiêu đề}}\n') },
  { label: '\\subsubsection', detail: 'Mục cấp 3', type: 'function', apply: snippet('\\subsubsection{${Tiêu đề}}\n') },
  { label: '\\chapter', detail: 'Chương sách', type: 'function', apply: snippet('\\chapter{${Tên chương}}\n') },
  { label: '\\paragraph', detail: 'Đoạn văn có tiêu đề', type: 'function', apply: snippet('\\paragraph{${Tiêu đề}} ') },
  { label: '\\dfrac', detail: 'Phân số dfrac', type: 'function', apply: snippet('\\dfrac{${a}}{${b}}') },
  { label: '\\sqrt', detail: 'Căn bậc hai / n', type: 'function', apply: snippet('\\sqrt{${x}}') },
  { label: '\\sum', detail: 'Tổng sigma', type: 'function', apply: snippet('\\sum_{${i=1}}^{${n}} ') },
  { label: '\\int', detail: 'Tích phân', type: 'function', apply: snippet('\\int_{${a}}^{${b}} ${f(x)}\\,dx') },
  { label: '\\lim', detail: 'Giới hạn', type: 'function', apply: snippet('\\lim_{${x \\to \\infty}} ') },
  { label: '\\prod', detail: 'Tích Pi', type: 'function', apply: snippet('\\prod_{${i=1}}^{${n}} ') },
  { label: '\\partial', detail: 'Đạo hàm riêng', type: 'keyword', apply: '\\partial' },
  { label: '\\infty', detail: 'Vô cực', type: 'keyword', apply: '\\infty' },
  { label: '\\alpha', detail: 'Ký tự Hy Lạp alpha', type: 'keyword', apply: '\\alpha' },
  { label: '\\beta', detail: 'Ký tự Hy Lạp beta', type: 'keyword', apply: '\\beta' },
  { label: '\\gamma', detail: 'Ký tự Hy Lạp gamma', type: 'keyword', apply: '\\gamma' },
  { label: '\\delta', detail: 'Ký tự Hy Lạp delta', type: 'keyword', apply: '\\delta' },
  { label: '\\theta', detail: 'Ký tự Hy Lạp theta', type: 'keyword', apply: '\\theta' },
  { label: '\\lambda', detail: 'Ký tự Hy Lạp lambda', type: 'keyword', apply: '\\lambda' },
  { label: '\\pi', detail: 'Ký tự Hy Lạp pi', type: 'keyword', apply: '\\pi' },
  { label: '\\sigma', detail: 'Ký tự Hy Lạp sigma', type: 'keyword', apply: '\\sigma' },
  { label: '\\omega', detail: 'Ký tự Hy Lạp omega', type: 'keyword', apply: '\\omega' },
  { label: '\\in', detail: 'Thuộc tập hợp', type: 'keyword', apply: '\\in ' },
  { label: '\\subset', detail: 'Tập con', type: 'keyword', apply: '\\subset ' },
  { label: '\\cup', detail: 'Hợp tập hợp', type: 'keyword', apply: '\\cup ' },
  { label: '\\cap', detail: 'Giao tập hợp', type: 'keyword', apply: '\\cap ' },
  { label: '\\le', detail: 'Nhỏ hơn hoặc bằng ≤', type: 'keyword', apply: '\\le ' },
  { label: '\\ge', detail: 'Lớn hơn hoặc bằng ≥', type: 'keyword', apply: '\\ge ' },
  { label: '\\neq', detail: 'Không bằng ≠', type: 'keyword', apply: '\\neq ' },
  { label: '\\approx', detail: 'Xấp xỉ ≈', type: 'keyword', apply: '\\approx ' },
  { label: '\\times', detail: 'Dấu nhân ×', type: 'keyword', apply: '\\times ' },
  { label: '\\cdot', detail: 'Dấu chấm nhân ·', type: 'keyword', apply: '\\cdot ' },
  { label: '\\item', detail: 'Mục danh sách item', type: 'keyword', apply: '\\item ' },
  { label: '\\label', detail: 'Đặt nhãn tham chiếu', type: 'function', apply: snippet('\\label{${key}}') },
  { label: '\\caption', detail: 'Chú thích hình/bảng', type: 'function', apply: snippet('\\caption{${Mô tả}}') },
  { label: '\\footnote', detail: 'Chú thích chân trang', type: 'function', apply: snippet('\\footnote{${Nội dung}}') },
  { label: '\\centering', detail: 'Căn giữa khối', type: 'keyword', apply: '\\centering\n' },
  { label: '\\newpage', detail: 'Sang trang mới', type: 'keyword', apply: '\\newpage\n' },
  { label: '\\tableofcontents', detail: 'Tạo mục lục tự động', type: 'keyword', apply: '\\tableofcontents\n' },
  { label: '\\maketitle', detail: 'Tạo tiêu đề trang đầu', type: 'keyword', apply: '\\maketitle\n' },
];

export function createLatexCompletionSource(
  getFiles: () => StudioFile[],
  getImages: () => StudioImage[]
) {
  return (context: CompletionContext): CompletionResult | null => {
    const files = getFiles();
    const images = getImages();

    // 1. Check Citation: \cite{...} or \parencite{...} or \citep{...} or \citet{...}
    const citeMatch = context.matchBefore(/\\(?:cite|citep|citet|parencite|nocite|textcite)\*?\{([^}]*)$/);
    if (citeMatch) {
      const prefix = citeMatch.text.slice(citeMatch.text.lastIndexOf('{') + 1);
      const bibEntries = extractProjectBibEntries(files);
      const options: Completion[] = bibEntries.map((entry) => ({
        label: entry.key,
        detail: entry.author ? `${entry.author} (${entry.year || 'N/A'})` : entry.type,
        info: entry.title || `${entry.type} entry`,
        type: 'constant',
        apply: entry.key,
      }));

      return {
        from: citeMatch.from + citeMatch.text.lastIndexOf('{') + 1,
        options,
      };
    }

    // 2. Check Cross-Reference: \ref{...}, \eqref{...}, \pageref{...}, \autoref{...}, \cref{...}
    const refMatch = context.matchBefore(/\\(?:ref|eqref|pageref|autoref|cref|Cref)\{([^}]*)$/);
    if (refMatch) {
      const labels = extractProjectLabels(files);
      const options: Completion[] = labels.map((lbl) => ({
        label: lbl.key,
        detail: `${lbl.fileName}:${lbl.line}`,
        type: 'variable',
        apply: lbl.key,
      }));

      return {
        from: refMatch.from + refMatch.text.lastIndexOf('{') + 1,
        options,
      };
    }

    // 3. Check Image / Includegraphics: \includegraphics[...]{...} or \includegraphics{...}
    const imgMatch = context.matchBefore(/\\includegraphics(?:\[[^\]]*\])?\{([^}]*)$/);
    if (imgMatch) {
      // Gather image names from project images + files ending with image extensions
      const imageNames = new Set<string>();
      images.forEach((img) => imageNames.add(img.name));
      files
        .filter((f) => /\.(png|jpe?g|gif|svg|webp|pdf)$/i.test(f.name))
        .forEach((f) => imageNames.add(f.name));

      const options: Completion[] = Array.from(imageNames).map((name) => ({
        label: name,
        detail: 'Tệp hình ảnh trong dự án',
        type: 'file',
        apply: name,
      }));

      return {
        from: imgMatch.from + imgMatch.text.lastIndexOf('{') + 1,
        options,
      };
    }

    // 4. Check Input / Include: \input{...} or \include{...}
    const inputMatch = context.matchBefore(/\\(?:input|include|subfile)\{([^}]*)$/);
    if (inputMatch) {
      const texFiles = files.filter((f) => f.name.endsWith('.tex'));
      const options: Completion[] = texFiles.map((f) => ({
        label: f.name.replace(/\.tex$/, ''),
        detail: f.name,
        type: 'file',
        apply: f.name.replace(/\.tex$/, ''),
      }));

      return {
        from: inputMatch.from + inputMatch.text.lastIndexOf('{') + 1,
        options,
      };
    }

    // 5. Check Package: \usepackage[...]{...} or \usepackage{...}
    const pkgMatch = context.matchBefore(/\\usepackage(?:\[[^\]]*\])?\{([^}]*)$/);
    if (pkgMatch) {
      const options: Completion[] = COMMON_PACKAGES.map((pkg) => ({
        label: pkg.name,
        detail: pkg.desc,
        type: 'type',
        apply: pkg.name,
      }));

      return {
        from: pkgMatch.from + pkgMatch.text.lastIndexOf('{') + 1,
        options,
      };
    }

    // 6. Check Environment: \begin{...}
    const beginMatch = context.matchBefore(/\\begin\{([^}]*)$/);
    if (beginMatch) {
      const options: Completion[] = COMMON_ENVIRONMENTS.map((env) => ({
        label: env.name,
        detail: env.desc,
        type: 'class',
        apply: snippet(`${env.name}}\n  \${}\n\\end{${env.name}}`),
      }));

      return {
        from: beginMatch.from + beginMatch.text.lastIndexOf('{') + 1,
        options,
      };
    }

    // 7. General LaTeX command completions on `\command`
    const word = context.matchBefore(/\\[a-zA-Z]*/);
    if (!word) return null;
    if (word.from === word.to && !context.explicit) return null;

    return {
      from: word.from,
      options: [
        ...COMMON_COMMANDS,
        {
          label: '\\begin',
          detail: 'Mở môi trường LaTeX',
          type: 'keyword',
          apply: snippet('\\begin{${environment}}\n  ${}\n\\end{${environment}}'),
        },
        {
          label: '\\usepackage',
          detail: 'Nạp gói mở rộng package',
          type: 'keyword',
          apply: snippet('\\usepackage{${package}}'),
        },
        {
          label: '\\cite',
          detail: 'Trích dẫn tài liệu tham khảo',
          type: 'function',
          apply: snippet('\\cite{${key}}'),
        },
        {
          label: '\\ref',
          detail: 'Tham chiếu chéo nhãn label',
          type: 'function',
          apply: snippet('\\ref{${key}}'),
        },
        {
          label: '\\eqref',
          detail: 'Tham chiếu công thức toán (eqref)',
          type: 'function',
          apply: snippet('\\eqref{${key}}'),
        },
        {
          label: '\\includegraphics',
          detail: 'Chèn hình ảnh',
          type: 'function',
          apply: snippet('\\includegraphics[width=${0.8}\\linewidth]{${image.png}}'),
        },
      ],
    };
  };
}
