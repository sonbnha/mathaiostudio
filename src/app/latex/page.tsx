import LaTeXStudio from '@/components/latex/LaTeXStudio';
export const metadata = { title: 'LaTeX Document Studio | MathAIO', description: 'Biên soạn LaTeX và xuất PDF A4.' };
export default function LaTeXPage() { const endpoint = process.env.LATEX_COMPILER_URL || 'https://latex.ytotech.com/builds/sync';
  let engineLabel = 'dịch vụ biên dịch đã cấu hình';
  try { engineLabel = new URL(endpoint).hostname; } catch {}
  return <LaTeXStudio engineLabel={engineLabel} />; }
