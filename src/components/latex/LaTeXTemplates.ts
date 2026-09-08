// Mẫu tài liệu LaTeX chuẩn cho MathAIO LaTeX Studio
// 5 mẫu: Tài liệu trắng, Đề kiểm tra, Chuyên đề, Bài tập lời giải, Hình học TikZ

export interface LaTeXTemplate {
  id: string;
  name: string;
  description: string;
  source: string;
}

export const LATEX_TEMPLATES: LaTeXTemplate[] = [
  {
    id: 'blank',
    name: 'Tài liệu trắng',
    description: 'Tài liệu LaTeX cơ bản với gói toán học',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}
\\usepackage{babel}
\\babelprovide[main,import]{vietnamese}
\\babelfont{rm}{Noto Serif}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\geometry{margin=2.5cm}

\\title{Tiêu đề tài liệu}
\\author{MathAIO Studio}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Giới thiệu}

Nhập nội dung tại đây. Công thức toán học inline: $E = mc^2$.

Công thức toán học block:
$$\\int_{0}^{\\infty} e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}$$

\\section{Nội dung chính}

Viết nội dung chính của tài liệu ở đây.

\\end{document}
`,
  },
  {
    id: 'exam',
    name: 'Đề thi trắc nghiệm THPT',
    description: 'Mẫu đề kiểm tra chuẩn với câu hỏi tự luận và trắc nghiệm',
    source: `\\documentclass[12pt,a4paper]{exam}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}
\\usepackage{babel}
\\babelprovide[main,import]{vietnamese}
\\babelfont{rm}{Noto Serif}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{multicol}
\\geometry{margin=2cm}

\\begin{document}

\\begin{center}
\\textbf{TRƯỜNG THPT \\underline{\\hspace{4cm}}} \\\\[4pt]
\\textbf{TỔ TOÁN HỌC} \\\\[8pt]
\\textbf{\\Large ĐỀ KIỂM TRA GIỮA HỌC KỲ I} \\\\[4pt]
\\textbf{Môn: TOÁN -- Lớp 10} \\\\[4pt]
\\textit{Thời gian làm bài: 90 phút (không kể phát đề)}
\\end{center}

\\vspace{0.5cm}
\\noindent \\textbf{Họ và tên:} \\dotfill \\quad \\textbf{Lớp:} \\dotfill \\quad \\textbf{SBD:} \\dotfill

\\vspace{0.5cm}

\\section*{PHẦN I. TRẮC NGHIỆM (7,0 điểm)}
\\textit{Chọn phương án đúng nhất trong các câu sau:}

\\begin{enumerate}
\\item Tập hợp $A = \\{x \\in \\mathbb{R} \\mid x^2 - 5x + 6 = 0\\}$ có bao nhiêu phần tử?
\\begin{multicols}{4}
\\begin{enumerate}[label=\\Alph*.]
\\item 0
\\item 1
\\item 2
\\item 3
\\end{enumerate}
\\end{multicols}

\\item Mệnh đề nào sau đây là mệnh đề đúng?
\\begin{enumerate}[label=\\Alph*.]
\\item $\\forall x \\in \\mathbb{R}: x^2 > 0$
\\item $\\exists x \\in \\mathbb{R}: x^2 + 1 = 0$
\\item $\\forall x \\in \\mathbb{R}: x^2 \\geq 0$
\\item $\\exists x \\in \\mathbb{N}: x + 1 < 0$
\\end{enumerate}

\\item Cho hàm số $f(x) = 2x^2 - 3x + 1$. Tính $f(2)$.
\\begin{multicols}{4}
\\begin{enumerate}[label=\\Alph*.]
\\item 1
\\item 3
\\item 5
\\item 7
\\end{enumerate}
\\end{multicols}
\\end{enumerate}

\\section*{PHẦN II. TỰ LUẬN (3,0 điểm)}

\\textbf{Bài 1.} (1,5 điểm) Giải phương trình:
$$x^2 - 4x + 3 = 0$$

\\vspace{2cm}

\\textbf{Bài 2.} (1,5 điểm) Cho tam giác $ABC$ có $AB = 5$, $AC = 7$, $\\widehat{BAC} = 60^\\circ$. Tính diện tích tam giác $ABC$.

\\vspace{2cm}

\\begin{center}
--- HẾT ---
\\end{center}

\\end{document}
`,
  },
  {
    id: 'topic',
    name: 'Giáo án chuyên đề Toán',
    description: 'Mẫu chuyên đề với định lý, ví dụ minh họa và bài tập',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}
\\usepackage{babel}
\\babelprovide[main,import]{vietnamese}
\\babelfont{rm}{Noto Serif}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\usepackage{enumitem}
\\geometry{margin=2.5cm}

\\newtheorem{theorem}{Định lý}[section]
\\newtheorem{lemma}[theorem]{Bổ đề}
\\newtheorem{corollary}[theorem]{Hệ quả}
\\newtheorem{example}{Ví dụ}[section]
\\newtheorem{exercise}{Bài tập}[section]
\\newtheorem{remark}{Nhận xét}[section]

\\title{\\textbf{CHUYÊN ĐỀ BỒI DƯỠNG} \\\\[8pt]
\\Large Bất Đẳng Thức Cổ Điển và Ứng Dụng}
\\author{Tổ Toán -- Trường THPT \\underline{\\hspace{3cm}}}
\\date{Năm học 2024--2025}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

\\section{Bất đẳng thức AM--GM}

\\begin{theorem}[Bất đẳng thức Cauchy]
Cho $a_1, a_2, \\ldots, a_n$ là các số thực không âm. Khi đó:
$$\\frac{a_1 + a_2 + \\cdots + a_n}{n} \\geq \\sqrt[n]{a_1 \\cdot a_2 \\cdots a_n}$$
Đẳng thức xảy ra khi và chỉ khi $a_1 = a_2 = \\cdots = a_n$.
\\end{theorem}

\\begin{example}
Cho $a, b > 0$ và $a + b = 1$. Chứng minh rằng $ab \\leq \\dfrac{1}{4}$.
\\end{example}

\\begin{proof}
Áp dụng bất đẳng thức AM--GM:
$$\\frac{a + b}{2} \\geq \\sqrt{ab} \\implies \\frac{1}{2} \\geq \\sqrt{ab} \\implies ab \\leq \\frac{1}{4}$$
Đẳng thức xảy ra khi $a = b = \\dfrac{1}{2}$.
\\end{proof}

\\section{Bài tập tự luyện}

\\begin{exercise}
Cho $a, b, c > 0$ và $a + b + c = 3$. Chứng minh:
$$a^2 + b^2 + c^2 \\geq 3$$
\\end{exercise}

\\begin{exercise}
Tìm giá trị nhỏ nhất của biểu thức:
$$P = \\frac{1}{a} + \\frac{1}{b} + \\frac{1}{c}$$
với $a, b, c > 0$ và $a + b + c = 1$.
\\end{exercise}

\\end{document}
`,
  },
  {
    id: 'exercises',
    name: 'Phiếu học tập',
    description: 'Mẫu phiếu bài tập kèm hướng dẫn giải chi tiết',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}
\\usepackage{babel}
\\babelprovide[main,import]{vietnamese}
\\babelfont{rm}{Noto Serif}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\usepackage{enumitem}
\\geometry{margin=2.5cm}

\\newtheorem{exercise}{Bài}
\\newenvironment{solution}{\\noindent\\textbf{Lời giải.}}{\\hfill $\\square$ \\medskip}

\\title{\\textbf{PHIẾU BÀI TẬP} \\\\[8pt]
\\Large Hệ Phương Trình Bậc Nhất Hai Ẩn}
\\author{Lớp 10 -- Chương Trình Phổ Thông 2018}
\\date{}

\\begin{document}

\\maketitle

\\begin{exercise}
Giải hệ phương trình:
$$\\begin{cases} 2x + 3y = 7 \\\\ x - y = 1 \\end{cases}$$
\\end{exercise}

\\begin{solution}
Từ phương trình thứ hai: $x = y + 1$.

Thay vào phương trình thứ nhất:
$$2(y + 1) + 3y = 7 \\implies 2y + 2 + 3y = 7 \\implies 5y = 5 \\implies y = 1$$

Suy ra $x = 1 + 1 = 2$.

Vậy hệ phương trình có nghiệm duy nhất $(x; y) = (2; 1)$.
\\end{solution}

\\begin{exercise}
Giải hệ phương trình:
$$\\begin{cases} \\dfrac{1}{x} + \\dfrac{1}{y} = \\dfrac{1}{2} \\\\[8pt] \\dfrac{2}{x} - \\dfrac{3}{y} = \\dfrac{1}{6} \\end{cases}$$
với điều kiện $x \\neq 0$, $y \\neq 0$.
\\end{exercise}

\\begin{solution}
Đặt $u = \\dfrac{1}{x}$, $v = \\dfrac{1}{y}$. Hệ trở thành:
$$\\begin{cases} u + v = \\dfrac{1}{2} \\\\ 2u - 3v = \\dfrac{1}{6} \\end{cases}$$

Từ phương trình đầu: $u = \\dfrac{1}{2} - v$. Thay vào phương trình sau:
$$2\\left(\\frac{1}{2} - v\\right) - 3v = \\frac{1}{6} \\implies 1 - 2v - 3v = \\frac{1}{6} \\implies -5v = -\\frac{5}{6} \\implies v = \\frac{1}{6}$$

Suy ra $u = \\dfrac{1}{2} - \\dfrac{1}{6} = \\dfrac{1}{3}$.

Do đó $x = \\dfrac{1}{u} = 3$ và $y = \\dfrac{1}{v} = 6$.

Vậy hệ phương trình có nghiệm $(x; y) = (3; 6)$.
\\end{solution}

\\begin{exercise}
Cho hệ phương trình:
$$\\begin{cases} mx + y = 2m + 1 \\\\ x + my = m + 2 \\end{cases}$$
Tìm giá trị của $m$ để hệ có nghiệm duy nhất. Tìm nghiệm đó theo $m$.
\\end{exercise}

\\begin{solution}
Hệ có nghiệm duy nhất khi:
$$\\frac{m}{1} \\neq \\frac{1}{m} \\implies m^2 \\neq 1 \\implies m \\neq \\pm 1$$

Khi $m \\neq \\pm 1$, giải hệ bằng phương pháp cộng đại số:
\\begin{align*}
x &= \\frac{2m^2 + m - m - 2}{m^2 - 1} = \\frac{2m^2 - 2}{m^2 - 1} = \\frac{2(m^2 - 1)}{m^2 - 1} = 2 \\\\
y &= 2m + 1 - 2m = 1
\\end{align*}

Vậy với $m \\neq \\pm 1$, hệ có nghiệm duy nhất $(x; y) = (2; 1)$.
\\end{solution}

\\end{document}
`,
  },
  {
    id: 'tikz',
    name: 'Hình học TikZ',
    description: 'Mẫu tài liệu có hình vẽ TikZ (tam giác, đường tròn)',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}
\\usepackage{babel}
\\babelprovide[main,import]{vietnamese}
\\babelfont{rm}{Noto Serif}
\\usepackage{amsmath,amssymb}
\\usepackage{tikz}
\\usepackage{geometry}
\\geometry{margin=2.5cm}

\\usetikzlibrary{calc,angles,quotes}

\\title{\\textbf{HÌNH HỌC PHẲNG} \\\\[8pt]
\\Large Tam Giác và Đường Tròn Ngoại Tiếp}
\\author{MathAIO Studio -- TikZ Engine}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Tam giác và các đường đặc biệt}

Cho tam giác $ABC$ có $A(0, 4)$, $B(-3, 0)$, $C(5, 0)$.

\\begin{center}
\\begin{tikzpicture}[scale=0.8]
  % Lưới nền
  \\draw[gray!20, thin, step=1] (-4,-1) grid (6,5);
  \\draw[->] (-4,0) -- (6.5,0) node[right] {$x$};
  \\draw[->] (0,-1) -- (0,5.5) node[above] {$y$};
  
  % Tam giác ABC
  \\coordinate (A) at (0,4);
  \\coordinate (B) at (-3,0);
  \\coordinate (C) at (5,0);
  
  \\draw[thick, blue] (A) -- (B) -- (C) -- cycle;
  
  % Đường cao AH
  \\coordinate (H) at (0,0);
  \\draw[dashed, red] (A) -- (H);
  \\draw (0.3,0) -- (0.3,0.3) -- (0,0.3);
  
  % Trung điểm BC
  \\coordinate (M) at (1,0);
  \\draw[dashed, green!60!black] (A) -- (M);
  
  % Đường tròn ngoại tiếp
  \\coordinate (O) at (1,1.875);
  \\draw[orange, thin] (O) circle ({veclen(1-0,1.875-4)});
  
  % Nhãn đỉnh
  \\node[above] at (A) {$A(0,4)$};
  \\node[below left] at (B) {$B(-3,0)$};
  \\node[below right] at (C) {$C(5,0)$};
  \\node[below] at (H) {$H$};
  \\node[below] at (M) {$M$};
  \\node[right] at (O) {$O$};
  
  % Điểm
  \\foreach \\point in {A, B, C, H, M, O}
    \\fill (\\point) circle (2pt);
\\end{tikzpicture}
\\end{center}

\\subsection{Tính toán}

\\begin{enumerate}
\\item Độ dài các cạnh:
$$AB = \\sqrt{(-3-0)^2 + (0-4)^2} = \\sqrt{9 + 16} = 5$$
$$AC = \\sqrt{(5-0)^2 + (0-4)^2} = \\sqrt{25 + 16} = \\sqrt{41}$$
$$BC = \\sqrt{(5-(-3))^2 + 0^2} = 8$$

\\item Diện tích tam giác:
$$S_{ABC} = \\frac{1}{2} \\cdot BC \\cdot AH = \\frac{1}{2} \\cdot 8 \\cdot 4 = 16$$

\\item Bán kính đường tròn ngoại tiếp:
$$R = \\frac{AB \\cdot AC \\cdot BC}{4S} = \\frac{5 \\cdot \\sqrt{41} \\cdot 8}{4 \\cdot 16} = \\frac{40\\sqrt{41}}{64} = \\frac{5\\sqrt{41}}{8}$$
\\end{enumerate}

\\end{document}
`,
  },
  { id: 'report', name: 'Báo cáo khoa học', description: 'Báo cáo toán học A4', source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}
\\usepackage{babel}
\\babelprovide[main,import]{vietnamese}
\\babelfont{rm}{Noto Serif}
\\usepackage{amsmath,amssymb}
\\usepackage[margin=2.5cm]{geometry}
\\title{Báo cáo khoa học: Tích phân và ứng dụng}
\\author{MathAIO Studio}
\\date{\\today}
\\begin{document}
\\maketitle
\\begin{abstract}
Khảo sát một phương pháp tính tích phân và ứng dụng trong toán học.
\\end{abstract}
\\section{Đặt vấn đề}
Xét $I=\\int_0^1 x^2\\,dx$.
\\section{Kết quả}
Ta có $I=\\left[\\frac{x^3}{3}\\right]_0^1=\\frac13$.
\\section{Kết luận}
Kết quả minh họa định lý cơ bản của giải tích.
\\begin{thebibliography}{9}
\\bibitem{calculus} Tài liệu Giải tích, chương Tích phân.
\\end{thebibliography}
\\end{document}
` },
];

export const DEFAULT_TEMPLATE_ID = 'blank';

export function getTemplateById(id: string): LaTeXTemplate | undefined {
  return LATEX_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): LaTeXTemplate {
  return LATEX_TEMPLATES[0];
}
