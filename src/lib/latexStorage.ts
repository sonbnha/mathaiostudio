import { LATEX_TEMPLATES, getTemplateById, DEFAULT_TEMPLATE_ID } from '@/components/latex/LaTeXTemplates';
import type { StudioFile, StudioImage, RestorePoint } from '@/components/latex/StudioTools';

export interface LatexDocumentItem {
  id: string;
  title: string;
  templateId: string;
  createdAt: number;
  updatedAt: number;
  source: string;
  files: StudioFile[];
  images?: StudioImage[];
  history?: RestorePoint[];
}

const STORAGE_KEY = 'mathaio_latex_documents_v1';

export function getStoredDocuments(): LatexDocumentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed starter sample documents if empty
      const starterDocs: LatexDocumentItem[] = [
        {
          id: 'doc-thpt-2025-sample',
          title: 'Đề_thi_tham_khao_TN_THPT_2025.tex',
          templateId: 'thpt_2025',
          createdAt: Date.now() - 86400000 * 2,
          updatedAt: Date.now() - 3600000 * 3,
          source: getTemplateById('thpt_2025')?.source || '',
          files: [{ name: 'main.tex', content: getTemplateById('thpt_2025')?.source || '' }],
        },
        {
          id: 'doc-tikz-sample',
          title: 'Chuyen_de_Hinh_hoc_TikZ.tex',
          templateId: 'tikz_geometry',
          createdAt: Date.now() - 86400000 * 5,
          updatedAt: Date.now() - 86400000 * 1,
          source: getTemplateById('tikz_geometry')?.source || '',
          files: [{ name: 'main.tex', content: getTemplateById('tikz_geometry')?.source || '' }],
        },
        {
          id: 'doc-dgnl-sample',
          title: 'De_thi_DGNL_Toan_Hoc.tex',
          templateId: 'dgnl_exam',
          createdAt: Date.now() - 86400000 * 7,
          updatedAt: Date.now() - 86400000 * 4,
          source: getTemplateById('dgnl_exam')?.source || '',
          files: [{ name: 'main.tex', content: getTemplateById('dgnl_exam')?.source || '' }],
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterDocs));
      return starterDocs;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getDocumentById(id: string): LatexDocumentItem | null {
  const docs = getStoredDocuments();
  return docs.find((d) => d.id === id) || null;
}

export function saveDocument(doc: LatexDocumentItem): void {
  if (typeof window === 'undefined') return;
  const docs = getStoredDocuments();
  const existingIndex = docs.findIndex((d) => d.id === doc.id);
  const updatedDoc = { ...doc, updatedAt: Date.now() };

  if (existingIndex >= 0) {
    docs[existingIndex] = updatedDoc;
  } else {
    docs.unshift(updatedDoc);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function createNewDocument(title: string, templateId: string): LatexDocumentItem {
  const tpl = getTemplateById(templateId) || getTemplateById(DEFAULT_TEMPLATE_ID)!;
  const newId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanTitle = title.trim().endsWith('.tex') ? title.trim() : `${title.trim()}.tex`;

  const newDoc: LatexDocumentItem = {
    id: newId,
    title: cleanTitle || 'Tai_lieu_toan_chua_dat_ten.tex',
    templateId: tpl.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: tpl.source,
    files: [{ name: 'main.tex', content: tpl.source }],
    history: [{ at: Date.now(), source: tpl.source, label: 'Khởi tạo tài liệu' }],
  };

  saveDocument(newDoc);
  return newDoc;
}

export function duplicateDocument(id: string): LatexDocumentItem | null {
  const doc = getDocumentById(id);
  if (!doc) return null;

  const baseTitle = doc.title.replace(/\.tex$/, '');
  const newTitle = `${baseTitle}_Ban_sao.tex`;
  const newId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const duplicated: LatexDocumentItem = {
    ...doc,
    id: newId,
    title: newTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    history: [{ at: Date.now(), source: doc.source, label: 'Bản sao từ ' + doc.title }],
  };

  saveDocument(duplicated);
  return duplicated;
}

export function deleteDocument(id: string): void {
  if (typeof window === 'undefined') return;
  const docs = getStoredDocuments().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function renameDocument(id: string, newTitle: string): void {
  const doc = getDocumentById(id);
  if (!doc) return;
  const cleanTitle = newTitle.trim().endsWith('.tex') ? newTitle.trim() : `${newTitle.trim()}.tex`;
  saveDocument({ ...doc, title: cleanTitle });
}
