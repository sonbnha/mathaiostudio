// Mẫu tài liệu LaTeX chuẩn cho MathAIO LaTeX Studio
// Cập nhật đầy đủ các mẫu chuẩn GDPT 2018: Đề TN THPT mới, ĐGNL, Trắc nghiệm Đúng/Sai, Hình học TikZ

export interface LaTeXTemplate {
  id: string;
  name: string;
  category: 'gdpt2018' | 'exam' | 'topic' | 'tikz' | 'basic';
  badge?: string;
  description: string;
  source: string;
}

export const LATEX_TEMPLATES: LaTeXTemplate[] = [
  {
    id: 'blank',
    name: 'Tài liệu trắng cơ bản',
    category: 'basic',
    badge: 'Cơ bản',
    description: 'Khung tài liệu LaTeX tối giản font Times New Roman, thân tài liệu trống',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Times New Roman}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\geometry{margin=2.5cm}

\\begin{document}

\\end{document}
`,
  },
  {
    id: 'thpt_2025',
    name: 'Đề TN THPT Cấu trúc mới (GDPT 2018)',
    category: 'gdpt2018',
    badge: 'Chuẩn 2025',
    description: 'Đề thi 3 phần chuẩn BGD: Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Times New Roman}
\\usepackage[vietnamese]{babel}
\\babelfont{rm}{Times New Roman}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{multicol}
\\usepackage{tcolorbox}
\\geometry{top=2cm,bottom=2cm,left=2cm,right=2cm}

\\begin{document}

\\begin{center}
\\textbf{BỘ GIÁO DỤC VÀ ĐÀO TẠO} \\hfill \\textbf{KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG} \\\\[2pt]
\\textbf{ĐỀ THI THAM KHẢO} \\hfill \\textbf{Bài thi: TOÁN HỌC (Chuẩn GDPT 2018)} \\\\[4pt]
\\textit{(Đề thi có 04 trang)} \\hfill \\textit{Thời gian làm bài: 90 phút, không kể thời gian phát đề}
\\end{center}

\\noindent\\rule{\\textwidth}{1pt}
\\vspace{0.2cm}
\\noindent \\textbf{Họ và tên thí sinh:} \\dotfill \\quad \\textbf{Số báo danh:} \\dotfill

\\vspace{0.4cm}

\\begin{tcolorbox}[colback=slate!5!white,colframe=slate!75!black,title=\\textbf{PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (3,0 điểm)}]
\\textit{Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu hỏi thí sinh chỉ chọn một phương án.}
\\end{tcolorbox}

\\begin{enumerate}[label=\\bfseries Câu \\arabic*., leftmargin=*]
\\item Cho hàm số $y = f(x)$ có bảng biến thiên trên đoạn $[-2; 3]$ như sau. Giá trị cực đại của hàm số đã cho bằng
\\begin{multicols}{4}
\\begin{enumerate}[label=\\Alph*.]
\\item $3$
\\item $1$
\\item $-2$
\\item $5$
\\end{enumerate}
\\end{multicols}

\\item Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$. Tọa độ tâm $I$ và bán kính $R$ của mặt cầu là
\\begin{multicols}{2}
\\begin{enumerate}[label=\\Alph*.]
\\item $I(1; -2; 3), R = 4$
\\item $I(-1; 2; -3), R = 4$
\\item $I(1; -2; 3), R = 16$
\\item $I(-1; 2; -3), R = 16$
\\end{enumerate}
\\end{multicols}

\\item Cho hình lăng trụ đứng $ABC.A'B'C'$ có đáy $ABC$ là tam giác vuông cân tại $A$, $AB = a$, $AA' = 2a$. Thể tích khối lăng trụ $ABC.A'B'C'$ bằng
\\begin{multicols}{4}
\\begin{enumerate}[label=\\Alph*.]
\\item $a^3$
\\item $\\dfrac{a^3}{3}$
\\item $2a^3$
\\item $\\dfrac{2a^3}{3}$
\\end{enumerate}
\\end{multicols}
\\end{enumerate}

\\vspace{0.3cm}

\\begin{tcolorbox}[colback=slate!5!white,colframe=slate!75!black,title=\\textbf{PHẦN II. Câu trắc nghiệm đúng sai (4,0 điểm)}]
\\textit{Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.}
\\end{tcolorbox}

\\begin{enumerate}[label=\\bfseries Câu \\arabic*., leftmargin=*]
\\item Cho hàm số bậc ba $y = f(x) = ax^3 + bx^2 + cx + d$ $(a \\neq 0)$ có đồ thị $(C)$.
\\begin{enumerate}[label=\\alph*)]
\\item Nếu đồ thị hàm số có hai điểm cực trị thì $b^2 - 3ac > 0$.
\\item Hàm số $f(x)$ luôn đồng biến trên $\\mathbb{R}$ khi $a > 0$ và $b^2 - 3ac \\leq 0$.
\\item Điểm uốn của đồ thị $(C)$ có hoành độ $x_0 = -\\dfrac{b}{3a}$.
\\item Tiếp tuyến tại điểm uốn có hệ số góc lớn nhất khi $a < 0$.
\\end{enumerate}

\\item Một bể nuôi cá có dạng hình hộp chữ nhật không nắp với thể tích là $V = 4\\text{ m}^3$. Chiều cao của bể là $h = 1\\text{ m}$. Chi phí làm đáy kính là $800.000$ đ/$\\text{m}^2$ và thành kính bên là $500.000$ đ/$\\text{m}^2$.
\\begin{enumerate}[label=\\alph*)]
\\item Diện tích đáy bể là $S_{\\text{đáy}} = 4\\text{ m}^2$.
\\item Nếu đáy là hình vuông cạnh $2\\text{ m}$ thì diện tích xung quanh là $8\\text{ m}^2$.
\\item Chi phí làm kính thấp nhất khi đáy bể là hình vuông.
\\item Tổng chi phí thấp nhất để làm bể cá là $7.200.000$ đồng.
\\end{enumerate}
\\end{enumerate}

\\vspace{0.3cm}

\\begin{tcolorbox}[colback=slate!5!white,colframe=slate!75!black,title=\\textbf{PHẦN III. Câu trắc nghiệm trả lời ngắn (3,0 điểm)}]
\\textit{Thí sinh trả lời từ câu 1 đến câu 6. Ghi kết quả vào ô tương ứng trên phiếu.}
\\end{tcolorbox}

\\begin{enumerate}[label=\\bfseries Câu \\arabic*., leftmargin=*]
\\item Cho hình chóp tứ giác đều $S.ABCD$ có cạnh đáy bằng $a$, góc giữa cạnh bên và mặt đáy bằng $60^\\circ$. Tính thể tích khối chóp $S.ABCD$ theo $a$ (kết quả làm tròn đến hàng phần mười của hệ số đi với $a^3$).
\\\\[4pt]
\\textit{Đáp số:} \\dotfill

\\item Một doanh nghiệp sản xuất một loại sản phẩm. Biết rằng tổng chi phí sản xuất $x$ sản phẩm được cho bởi hàm số $C(x) = 2x^2 + 50x + 1800$ (nghìn đồng). Chi phí trung bình cho mỗi sản phẩm là $\\overline{C}(x) = \\dfrac{C(x)}{x}$. Số sản phẩm cần sản xuất để chi phí trung bình nhỏ nhất là bao nhiêu?
\\\\[4pt]
\\textit{Đáp số:} \\dotfill
\\end{enumerate}

\\begin{center}
\\textbf{--- HẾT ---}
\\end{center}

\\end{document}
`,
  },
  {
    id: 'dgnl_exam',
    name: 'Đề Đánh Giá Năng Lực (ĐGNL)',
    category: 'gdpt2018',
    badge: 'ĐGNL 2025',
    description: 'Cấu trúc đề thi Đánh giá năng lực phần Tư duy Toán học',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Times New Roman}
\\usepackage[vietnamese]{babel}
\\babelfont{rm}{Times New Roman}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{multicol}
\\geometry{margin=2cm}

\\begin{document}

\\begin{center}
\\textbf{KỲ THI ĐÁNH GIÁ NĂNG LỰC ĐẠI HỌC QUỐC GIA} \\\\[4pt]
\\textbf{\\Large PHẦN THI: TƯ DUY ĐỊNH LƯỢNG (TOÁN HỌC)} \\\\[4pt]
\\textit{Thời gian làm bài: 75 phút -- 50 câu hỏi trắc nghiệm}
\\end{center}

\\noindent\\rule{\\textwidth}{1pt}
\\vspace{0.4cm}

\\begin{enumerate}[label=\\bfseries Câu \\arabic*., leftmargin=*]
\\item Có bao nhiêu số nguyên dương $m$ để bất phương trình $\\log_2(x^2 + 2mx + m + 2) \\geq 1$ nghiệm đúng với mọi $x \\in \\mathbb{R}$?
\\begin{multicols}{4}
\\begin{enumerate}[label=\\Alph*.]
\\item $0$
\\item $1$
\\item $2$
\\item Vô số
\\end{enumerate}
\\end{multicols}

\\item Cho dãy số $(u_n)$ xác định bởi $u_1 = 2$ và $u_{n+1} = \\dfrac{u_n}{2u_n + 1}$ với mọi $n \\geq 1$. Số hạng tổng quát $u_n$ là
\\begin{multicols}{2}
\\begin{enumerate}[label=\\Alph*.]
\\item $u_n = \\dfrac{2}{2n - 1}$
\\item $u_n = \\dfrac{2}{2n + 1}$
\\item $u_n = \\dfrac{1}{n + 1}$
\\item $u_n = \\dfrac{2}{4n - 3}$
\\end{enumerate}
\\end{multicols}

\\item \\textbf{[Tư duy xử lý số liệu]} Một mẫu số liệu ghép nhóm về thời gian học bài tại nhà (đơn vị: phút) của 40 học sinh lớp 12 được cho như sau:
\\begin{center}
\\begin{tabular}{|c|c|c|c|c|c|}
\\hline
\\textbf{Thời gian} & $[0; 30)$ & $[30; 60)$ & $[60; 90)$ & $[90; 120)$ & $[120; 150)$ \\\\
\\hline
\\textbf{Số học sinh} & $4$ & $10$ & $14$ & $8$ & $4$ \\\\
\\hline
\\end{tabular}
\\end{center}
Trung vị $M_e$ của mẫu số liệu ghép nhóm trên bằng bao nhiêu?
\\begin{multicols}{4}
\\begin{enumerate}[label=\\Alph*.]
\\item $68,57$
\\item $72,85$
\\item $65,00$
\\item $70,00$
\\end{enumerate}
\\end{multicols}
\\end{enumerate}

\\end{document}
`,
  },
  {
    id: 'true_false_quiz',
    name: 'Phiếu Trắc Nghiệm Đúng/Sai',
    category: 'gdpt2018',
    badge: 'Đúng / Sai',
    description: 'Chuyên đề câu hỏi đúng sai 4 ý chuẩn Thông tư mới',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Times New Roman}
\\usepackage[vietnamese]{babel}
\\babelfont{rm}{Times New Roman}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\usepackage{enumitem}
\\geometry{margin=2cm}

\\begin{document}

\\begin{center}
\\textbf{PHIẾU HỌC TẬP -- TRẮC NGHIỆM ĐÚNG/SAI CHUYÊN ĐỀ} \\\\[4pt]
\\textbf{Chủ đề: Nguyên Hàm, Tích Phân & Ứng Dụng}
\\end{center}

\\noindent\\rule{\\textwidth}{0.5pt}
\\vspace{0.3cm}

\\begin{enumerate}[label=\\bfseries Câu \\arabic*., leftmargin=*]
\\item Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ và $F(x)$ là một nguyên hàm của $f(x)$.
\\begin{enumerate}[label=\\alph*)]
\\item $\\displaystyle\\int f(x)\\,dx = F(x) + C$, với $C$ là hằng số tùy ý. \\hfill (Đúng/Sai)
\\item $\\displaystyle\\int_a^b f(x)\\,dx = F(b) - F(a) = -\\int_b^a f(x)\\,dx$. \\hfill (Đúng/Sai)
\\item Nếu $f(x)$ là hàm số lẻ trên $[-a; a]$ thì $\\displaystyle\\int_{-a}^a f(x)\\,dx = 0$. \\hfill (Đúng/Sai)
\\item Nếu $f(x) \\leq g(x)$ trên $[a; b]$ thì $\\displaystyle\\int_a^b f(x)\\,dx \\leq \\int_a^b g(x)\\,dx$. \\hfill (Đúng/Sai)
\\end{enumerate}

\\item Cho hình phẳng $(H)$ giới hạn bởi đồ thị $y = x^2 - 4x + 3$ và trục hoành $Ox$.
\\begin{enumerate}[label=\\alph*)]
\\item Hoành độ giao điểm của đồ thị với trục $Ox$ là $x = 1$ và $x = 3$. \\hfill (Đúng/Sai)
\\item Trên đoạn $[1; 3]$, hàm số luôn nhận giá trị âm $y \\leq 0$. \\hfill (Đúng/Sai)
\\item Diện tích hình phẳng $(H)$ là $S = \\displaystyle\\int_1^3 (x^2 - 4x + 3)\\,dx = \\dfrac{4}{3}$. \\hfill (Đúng/Sai)
\\item Thể tích khối tròn xoay khi quay $(H)$ quanh trục $Ox$ là $V = \\dfrac{16\\pi}{15}$. \\hfill (Đúng/Sai)
\\end{enumerate}
\\end{enumerate}

\\end{document}
`,
  },
  {
    id: 'exam_period',
    name: 'Đề kiểm tra định kỳ (Giữa kỳ / Cuối kỳ)',
    category: 'exam',
    description: 'Mẫu đề kiểm tra kết hợp tự luận và trắc nghiệm truyền thống',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Times New Roman}
\\usepackage[vietnamese]{babel}
\\babelfont{rm}{Times New Roman}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{multicol}
\\geometry{margin=2cm}

\\begin{document}

\\begin{center}
\\textbf{TRƯỜNG THPT \\underline{\\hspace{4cm}}} \\\\[4pt]
\\textbf{TỔ TOÁN HỌC} \\\\[8pt]
\\textbf{\\Large ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN} \\\\[4pt]
\\textit{Thời gian làm bài: 90 phút (không kể phát đề)}
\\end{center}

\\vspace{0.3cm}
\\noindent \\textbf{Họ và tên:} \\dotfill \\quad \\textbf{Lớp:} \\dotfill \\quad \\textbf{SBD:} \\dotfill

\\vspace{0.3cm}

\\section*{PHẦN I. TRẮC NGHIỆM (7,0 điểm)}

\\begin{enumerate}[label=\\bfseries Câu \\arabic*.]
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
\\end{enumerate}

\\section*{PHẦN II. TỰ LUẬN (3,0 điểm)}

\\textbf{Bài 1.} (1,5 điểm) Giải phương trình: $x^2 - 4x + 3 = 0$.
\\vspace{2.5cm}

\\textbf{Bài 2.} (1,5 điểm) Cho tam giác $ABC$ có $AB = 5, AC = 7, \\widehat{BAC} = 60^\\circ$. Tính diện tích tam giác $ABC$.

\\begin{center}
--- HẾT ---
\\end{center}

\\end{document}
`,
  },
  {
    id: 'topic_advanced',
    name: 'Chuyên đề bồi dưỡng & Bài tập',
    category: 'topic',
    description: 'Mẫu chuyên đề định lý, bổ đề, ví dụ minh họa và bài tập',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Times New Roman}
\\usepackage[vietnamese]{babel}
\\babelfont{rm}{Times New Roman}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\usepackage{enumitem}
\\geometry{margin=2.5cm}

\\newtheorem{theorem}{Định lý}[section]
\\newtheorem{lemma}[theorem]{Bổ đề}
\\newtheorem{example}{Ví dụ}[section]
\\newtheorem{exercise}{Bài tập}[section]

\\title{\\textbf{CHUYÊN ĐỀ BỒI DƯỠNG} \\\\[6pt] \\Large Bất Đẳng Thức Cổ Điển & Kỹ Thuật Chọn Điểm Rơi}
\\author{MathAIO Studio}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Bất đẳng thức AM--GM (Cauchy)}

\\begin{theorem}[Bất đẳng thức Cauchy cho 3 số]
Với $a, b, c \\geq 0$, ta luôn có:
$$\\frac{a + b + c}{3} \\geq \\sqrt[3]{abc}$$
Đẳng thức xảy ra khi và chỉ khi $a = b = c$.
\\end{theorem}

\\begin{example}
Cho $a, b, c > 0$ thỏa mãn $a + b + c = 3$. Tìm giá trị nhỏ nhất của $P = \\dfrac{1}{a} + \\dfrac{1}{b} + \\dfrac{1}{c}$.
\\end{example}

\\begin{proof}[Lời giải]
Áp dụng bất đẳng thức Cauchy-Schwarz dạng Engel:
$$P = \\frac{1}{a} + \\frac{1}{b} + \\frac{1}{c} \\geq \\frac{(1+1+1)^2}{a+b+c} = \\frac{9}{3} = 3$$
Đẳng thức xảy ra khi $a = b = c = 1$. Vậy $\\min P = 3$.
\\end{proof}

\\end{document}
`,
  },
  {
    id: 'tikz_geometry',
    name: 'Hình học TikZ (2D & 3D)',
    category: 'tikz',
    badge: 'TikZ Vector',
    description: 'Mẫu tài liệu vẽ hình học phẳng và hình không gian TikZ sắc nét',
    source: `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\setmainfont{Times New Roman}
\\usepackage[vietnamese]{babel}
\\babelfont{rm}{Times New Roman}
\\usepackage{amsmath,amssymb}
\\usepackage{tikz}
\\usepackage{geometry}
\\geometry{margin=2.5cm}

\\usetikzlibrary{calc,angles,quotes,intersections}

\\title{\\textbf{HÌNH HỌC TIKZ CHUẨN XUẤT BẢN}}
\\author{MathAIO Studio -- TikZ Engine}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Tam giác nội tiếp đường tròn}

\\begin{center}
\\begin{tikzpicture}[scale=0.9, thick]
  % Tọa độ các điểm
  \\coordinate (O) at (0,0);
  \\coordinate (A) at (0,3);
  \\coordinate (B) at (-2.8,-1);
  \\coordinate (C) at (2.8,-1);
  \\coordinate (H) at (0,-1);

  % Vẽ đường tròn và tam giác
  \\draw[cyan!80!black, thick] (O) circle (3cm);
  \\draw[blue!80!black, very thick] (A) -- (B) -- (C) -- cycle;
  \\draw[red, dashed] (A) -- (H);
  \\draw[orange, dashed] (O) -- (A);

  % Ký hiệu vuông góc
  \\draw (0,-0.8) -- (0.2,-0.8) -- (0.2,-1);

  % Điểm và nhãn
  \\foreach \\p/\\pos in {A/above, B/below left, C/below right, H/below, O/above right} {
    \\fill (\\p) circle (2pt);
    \\node[\\pos] at (\\p) {$\\p$};
  }
\\end{tikzpicture}
\\end{center}

\\end{document}
`,
  },
];

export const DEFAULT_TEMPLATE_ID = 'blank';

export function getTemplateById(id: string): LaTeXTemplate | undefined {
  return LATEX_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): LaTeXTemplate {
  return LATEX_TEMPLATES[0];
}
