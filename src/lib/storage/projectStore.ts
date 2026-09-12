import { LATEX_TEMPLATES, getTemplateById, DEFAULT_TEMPLATE_ID } from '@/components/latex/LaTeXTemplates';

export type ProjectType = 'geometry' | 'lesson-plan' | 'latex';

export interface ProjectItem {
  id: string;
  title: string;
  type: ProjectType;
  updatedAt: number;
  createdAt: number;
  isStarred?: boolean;
  thumbnail?: string;
  files?: Array<{ name: string; content: string; path?: string }>;
  metadata?: {
    description?: string;
    templateId?: string;
    badge?: string;
    grade?: string;
    topic?: string;
    previewSnippet?: string;
    promptText?: string;
    svgCode?: string;
    tikzCode?: string;
    lessonContent?: string;
    source?: string;
    files?: Array<{ name: string; content: string; path?: string }>;
    activities?: string[];
    previewType?: 'triangle' | 'pyramid' | 'circle' | 'exam' | 'lesson';
    mainDocument?: string;
  };
  content?: any;
}

const UNIFIED_STORAGE_KEY = 'mathaio_unified_projects_v1';
const LATEX_STORAGE_KEY = 'mathaio_latex_documents_v1';

export function getInitialSeedProjects(): ProjectItem[] {
  return [
    {
      id: 'proj-geo-1',
      title: 'Tam giác ABC nội tiếp (O) & Đường cao AH',
      type: 'geometry',
      createdAt: Date.now() - 86400000 * 1,
      updatedAt: Date.now() - 3600000 * 2,
      isStarred: true,
      thumbnail: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><circle cx="200" cy="150" r="110" fill="none" stroke="#0284c7" stroke-width="2"/><polygon points="200,45 105,205 295,205" fill="rgba(14,165,233,0.08)" stroke="#0f172a" stroke-width="2.5"/><line x1="200" y1="45" x2="200" y2="205" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/><text x="195" y="35" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">A</text><text x="85" y="220" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">B</text><text x="305" y="220" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">C</text><text x="205" y="222" font-family="sans-serif" font-weight="bold" font-size="14" fill="#ef4444">H</text><text x="205" y="155" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0284c7">O</text><circle cx="200" cy="150" r="3" fill="#0284c7"/></svg>',
      metadata: {
        topic: 'Hình học phẳng THCS/THPT',
        badge: 'SVG Vector',
        promptText: 'Cho tam giác ABC nhọn nội tiếp đường tròn (O), kẻ đường cao AH vuông góc với BC tại H...',
        previewType: 'triangle',
        svgCode: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><circle cx="200" cy="150" r="110" fill="none" stroke="#0284c7" stroke-width="2"/><polygon points="200,45 105,205 295,205" fill="rgba(14,165,233,0.08)" stroke="#0f172a" stroke-width="2.5"/><line x1="200" y1="45" x2="200" y2="205" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/><text x="195" y="35" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">A</text><text x="85" y="220" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">B</text><text x="305" y="220" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">C</text><text x="205" y="222" font-family="sans-serif" font-weight="bold" font-size="14" fill="#ef4444">H</text><text x="205" y="155" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0284c7">O</text><circle cx="200" cy="150" r="3" fill="#0284c7"/></svg>',
      },
    },
    {
      id: 'proj-lp-1',
      title: 'Giáo án 5512: Khái niệm Vectơ & Phép cộng Vectơ',
      type: 'lesson-plan',
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 3600000 * 5,
      isStarred: true,
      thumbnail: 'Khởi động (Trò chơi nhận biết hướng) -> Hình thành kiến thức (Định nghĩa Vectơ) -> Luyện tập (Cùng phương, cùng hướng) -> Vận dụng (Tổng hợp lực kéo)',
      metadata: {
        grade: 'Toán 10',
        topic: 'Hình học & Đo lường',
        badge: 'Chuẩn 5512 BGD',
        previewSnippet: '4 hoạt động: Khởi động -> Hình thành kiến thức -> Luyện tập -> Vận dụng',
        activities: [
          '1. Khởi động: Trò chơi nhận biết hướng chuyển động',
          '2. Hình thành kiến thức: Định nghĩa Vectơ & độ dài',
          '3. Luyện tập: Bài tập nhận biết vectơ cùng phương',
          '4. Vận dụng: Bài toán tổng hợp lực trong vật lý',
        ],
        previewType: 'lesson',
      },
      content: 'I. MỤC TIÊU DẠY HỌC\n1. Về kiến thức: Hiểu khái niệm vectơ, hướng, độ dài vectơ.\n2. Về năng lực: Năng lực tư duy và lập luận toán học.\nII. TIẾN TRÌNH DẠY HỌC\n- Hoạt động 1: Khởi động nhận biết hướng chuyển động\n- Hoạt động 2: Hình thành định nghĩa đoạn thẳng có hướng\n- Hoạt động 3: Luyện tập vectơ cùng phương, bằng nhau\n- Hoạt động 4: Vận dụng tính lực tổng hợp',
    },
    {
      id: 'proj-latex-1',
      title: 'De_thi_tham_khao_TN_THPT_2025.tex',
      type: 'latex',
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 3600000 * 1,
      isStarred: false,
      content: LATEX_TEMPLATES[0]?.source || '\\documentclass[12pt,a4paper]{article}\n\\usepackage{amsmath,amssymb}\n\\begin{document}\n\\title{ĐỀ THI THAM KHẢO TỐT NGHIỆP THPT 2025}\n\\maketitle\n\\section*{PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn}\nCâu 1. Cho hàm số $y=f(x)$ có bảng biến thiên như sau...\n\\end{document}',
      metadata: {
        templateId: 'thpt_2025',
        badge: 'Cấu trúc 2025',
        previewSnippet: 'ĐỀ THI THAM KHẢO TỐT NGHIỆP THPT 2025\nCâu 1. Cho hàm số y=f(x) có bảng biến thiên...\nCâu 2. Trong không gian Oxyz, cho mặt cầu (S)...',
        previewType: 'exam',
      },
    },
    {
      id: 'proj-geo-2',
      title: 'Hình chóp S.ABCD đáy hình vuông & Góc phẳng',
      type: 'geometry',
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
      isStarred: false,
      thumbnail: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><line x1="90" y1="210" x2="270" y2="210" stroke="#0f172a" stroke-width="2.5"/><line x1="270" y1="210" x2="330" y2="150" stroke="#0f172a" stroke-width="2.5"/><line x1="90" y1="210" x2="150" y2="150" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="150" y1="150" x2="330" y2="150" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="150" y1="150" x2="150" y2="50" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="150" y1="50" x2="90" y2="210" stroke="#0f172a" stroke-width="2.5"/><line x1="150" y1="50" x2="270" y2="210" stroke="#0f172a" stroke-width="2.5"/><line x1="150" y1="50" x2="330" y2="150" stroke="#0f172a" stroke-width="2.5"/><text x="145" y="40" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">S</text><text x="75" y="225" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">A</text><text x="275" y="225" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">B</text><text x="338" y="155" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">C</text><text x="135" y="145" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">D</text></svg>',
      metadata: {
        topic: 'Hình học không gian',
        badge: 'TikZ & SVG',
        promptText: 'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với đáy...',
        previewType: 'pyramid',
        svgCode: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><line x1="90" y1="210" x2="270" y2="210" stroke="#0f172a" stroke-width="2.5"/><line x1="270" y1="210" x2="330" y2="150" stroke="#0f172a" stroke-width="2.5"/><line x1="90" y1="210" x2="150" y2="150" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="150" y1="150" x2="330" y2="150" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="150" y1="150" x2="150" y2="50" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4,4"/><line x1="150" y1="50" x2="90" y2="210" stroke="#0f172a" stroke-width="2.5"/><line x1="150" y1="50" x2="270" y2="210" stroke="#0f172a" stroke-width="2.5"/><line x1="150" y1="50" x2="330" y2="150" stroke="#0f172a" stroke-width="2.5"/><text x="145" y="40" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">S</text><text x="75" y="225" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">A</text><text x="275" y="225" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">B</text><text x="338" y="155" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">C</text><text x="135" y="145" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">D</text></svg>',
      },
    },
    {
      id: 'proj-latex-2',
      title: 'Chuyen_de_Bat_dang_thuc_Cauchy_Schwarz.tex',
      type: 'latex',
      createdAt: Date.now() - 86400000 * 6,
      updatedAt: Date.now() - 86400000 * 3,
      isStarred: true,
      content: LATEX_TEMPLATES[1]?.source || '\\documentclass[12pt,a4paper]{article}\n\\usepackage{amsmath,amssymb}\n\\begin{document}\n\\title{CHUYÊN ĐỀ BẤT ĐẲNG THỨC CAUCHY - SCHWARZ}\n\\maketitle\n\\section*{1. Kiến thức cơ bản}\nBất đẳng thức Cauchy-Schwarz trong không gian $n$ chiều...\n\\end{document}',
      metadata: {
        templateId: 'topic_advanced',
        badge: 'Chuyên đề',
        previewSnippet: 'CHUYÊN ĐỀ BẤT ĐẲNG THỨC CAUCHY - SCHWARZ\n1. Kiến thức cơ bản và chọn điểm rơi\n2. Phương pháp Cauchy ngược dấu',
        previewType: 'exam',
      },
    },
  ];
}

export function getAllProjects(): ProjectItem[] {
  if (typeof window === 'undefined') return [];
  try {
    let list: ProjectItem[] = [];
    const raw = localStorage.getItem(UNIFIED_STORAGE_KEY);
    if (raw) {
      list = JSON.parse(raw);
    } else {
      list = getInitialSeedProjects();
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(list));
    }

    // Sync from LaTeX store if existing
    const rawLatex = localStorage.getItem(LATEX_STORAGE_KEY);
    if (rawLatex) {
      try {
        const latexDocs = JSON.parse(rawLatex);
        latexDocs.forEach((doc: any) => {
          if (!list.some((p) => p.id === doc.id)) {
            list.unshift({
              id: doc.id,
              title: doc.title,
              type: 'latex',
              createdAt: doc.createdAt || Date.now(),
              updatedAt: doc.updatedAt || Date.now(),
              isStarred: false,
              metadata: {
                templateId: doc.templateId,
                previewSnippet: doc.source ? doc.source.slice(0, 120) : '',
                previewType: 'exam',
              },
              content: doc.source,
            });
          }
        });
      } catch {}
    }

    // Sort newest updated first
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return list;
  } catch {
    return getInitialSeedProjects();
  }
}

export function getProjectById(id: string): ProjectItem | null {
  const all = getAllProjects();
  return all.find((p) => p.id === id) || null;
}

export function saveProject(item: ProjectItem): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAllProjects();
    const idx = list.findIndex((p) => p.id === item.id);
    const updated = { ...item, updatedAt: Date.now() };

    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }

    localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(list));

    // Also mirror to LaTeX store if it's LaTeX
    if (item.type === 'latex') {
      try {
        const rawLatex = localStorage.getItem(LATEX_STORAGE_KEY);
        const latexList = rawLatex ? JSON.parse(rawLatex) : [];
        const lIdx = latexList.findIndex((d: any) => d.id === item.id);
        const latexDoc = {
          id: item.id,
          title: item.title,
          templateId: item.metadata?.templateId || DEFAULT_TEMPLATE_ID,
          updatedAt: Date.now(),
          createdAt: item.createdAt,
          source: item.content || item.metadata?.source || '',
          files:
            item.files && item.files.length > 0
              ? item.files
              : item.metadata?.files && item.metadata.files.length > 0
              ? item.metadata.files
              : [{ name: item.metadata?.mainDocument || 'main.tex', content: item.content || item.metadata?.source || '' }],
        };
        if (lIdx >= 0) {
          latexList[lIdx] = latexDoc;
        } else {
          latexList.unshift(latexDoc);
        }
        localStorage.setItem(LATEX_STORAGE_KEY, JSON.stringify(latexList));
      } catch {}
    }
  } catch (err) {
    console.warn('Lỗi khi lưu project vào storage:', err);
  }
}

export function createNewProject(
  type: ProjectType,
  title: string,
  metadata?: Record<string, any>,
  content?: any,
  thumbnail?: string
): ProjectItem {
  const newId = `proj-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let cleanTitle = title.trim();

  if (type === 'latex' && !cleanTitle.endsWith('.tex')) {
    cleanTitle = `${cleanTitle}.tex`;
  }

  const newProject: ProjectItem = {
    id: newId,
    title: cleanTitle,
    type,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isStarred: false,
    thumbnail: thumbnail || metadata?.thumbnail || metadata?.svgCode || '',
    metadata: {
      ...metadata,
    },
    content: content || '',
  };

  saveProject(newProject);
  return newProject;
}

export function deleteProject(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAllProjects().filter((p) => p.id !== id);
    localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(list));

    try {
      const rawLatex = localStorage.getItem(LATEX_STORAGE_KEY);
      if (rawLatex) {
        const latexList = JSON.parse(rawLatex).filter((d: any) => d.id !== id);
        localStorage.setItem(LATEX_STORAGE_KEY, JSON.stringify(latexList));
      }
    } catch {}
  } catch (err) {
    console.warn('Lỗi khi xóa project:', err);
  }
}

export function duplicateProject(id: string): ProjectItem | null {
  const original = getProjectById(id);
  if (!original) return null;

  let newTitle = original.title;
  if (original.type === 'latex') {
    newTitle = `${original.title.replace(/\.tex$/, '')}_Ban_sao.tex`;
  } else {
    newTitle = `${original.title} (Bản sao)`;
  }

  const duplicated: ProjectItem = {
    ...original,
    id: `proj-${original.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: newTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  saveProject(duplicated);
  return duplicated;
}

export function renameProject(id: string, newTitle: string): void {
  const proj = getProjectById(id);
  if (!proj) return;

  let cleanTitle = newTitle.trim();
  if (proj.type === 'latex' && !cleanTitle.endsWith('.tex')) {
    cleanTitle = `${cleanTitle}.tex`;
  }

  saveProject({ ...proj, title: cleanTitle });
}

export function toggleStarProject(id: string): boolean {
  const proj = getProjectById(id);
  if (!proj) return false;
  const updatedStarred = !proj.isStarred;
  saveProject({ ...proj, isStarred: updatedStarred });
  return updatedStarred;
}

export function getProjectsByType(type: ProjectType): ProjectItem[] {
  return getAllProjects().filter((p) => p.type === type);
}

export function generateDefaultGeometryTitle(): string {
  if (typeof window === 'undefined') return 'Hình vẽ chưa đặt tên';
  try {
    const geoList = getAllProjects().filter((p) => p.type === 'geometry');
    const baseTitle = 'Hình vẽ chưa đặt tên';
    if (!geoList.some((p) => p.title.trim() === baseTitle)) {
      return baseTitle;
    }
    let count = 2;
    while (geoList.some((p) => p.title.trim() === `${baseTitle} ${count}`)) {
      count++;
    }
    return `${baseTitle} ${count}`;
  } catch {
    return 'Hình vẽ chưa đặt tên';
  }
}

