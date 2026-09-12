import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, title = 'document', format = 'docx' } = body;

    if (!source || typeof source !== 'string') {
      return NextResponse.json({ error: 'Thiếu mã nguồn LaTeX cần xuất.' }, { status: 400 });
    }

    const cleanTitle = title.replace(/\.tex$/, '');

    // Format 1: Markdown (.md)
    if (format === 'md' || format === 'markdown') {
      let md = source
        .replace(/\\documentclass(\[[^\]]*\])?\{[^}]+\}/g, '')
        .replace(/\\usepackage(\[[^\]]*\])?\{[^}]+\}/g, '')
        .replace(/\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        .replace(/\\title\{([^}]+)\}/g, '# $1\n')
        .replace(/\\author\{([^}]+)\}/g, '**Tác giả:** $1\n')
        .replace(/\\date\{([^}]+)\}/g, '**Ngày:** $1\n')
        .replace(/\\maketitle/g, '')
        .replace(/\\section\*?\{([^}]+)\}/g, '## $1\n')
        .replace(/\\subsection\*?\{([^}]+)\}/g, '### $1\n')
        .replace(/\\subsubsection\*?\{([^}]+)\}/g, '#### $1\n')
        .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
        .replace(/\\textit\{([^}]+)\}/g, '*$1*')
        .replace(/\\texttt\{([^}]+)\}/g, '`$1`')
        .replace(/\\begin\{enumerate\}/g, '')
        .replace(/\\end\{enumerate\}/g, '')
        .replace(/\\begin\{itemize\}/g, '')
        .replace(/\\end\{itemize\}/g, '')
        .replace(/\\item\s*/g, '- ')
        .replace(/\\begin\{quote\}/g, '> ')
        .replace(/\\end\{quote\}/g, '')
        .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '[$2]($1)');

      return new Response(md.trim(), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(cleanTitle)}.md"`,
        },
      });
    }

    // Format 2: Standalone HTML (.html) with KaTeX
    if (format === 'html') {
      let bodyHtml = source
        .replace(/\\documentclass(\[[^\]]*\])?\{[^}]+\}/g, '')
        .replace(/\\usepackage(\[[^\]]*\])?\{[^}]+\}/g, '')
        .replace(/\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        .replace(/\\title\{([^}]+)\}/g, '<h1>$1</h1>')
        .replace(/\\author\{([^}]+)\}/g, '<p><strong>Tác giả:</strong> $1</p>')
        .replace(/\\date\{([^}]+)\}/g, '<p><em>$1</em></p>')
        .replace(/\\maketitle/g, '<hr/>')
        .replace(/\\section\*?\{([^}]+)\}/g, '<h2>$1</h2>')
        .replace(/\\subsection\*?\{([^}]+)\}/g, '<h3>$1</h3>')
        .replace(/\\subsubsection\*?\{([^}]+)\}/g, '<h4>$1</h4>')
        .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
        .replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>')
        .replace(/\\begin\{itemize\}/g, '<ul>')
        .replace(/\\end\{itemize\}/g, '</ul>')
        .replace(/\\begin\{enumerate\}/g, '<ol>')
        .replace(/\\end\{enumerate\}/g, '</ol>')
        .replace(/\\item\s+([^\n]+)/g, '<li>$1</li>')
        .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1" target="_blank">$2</a>')
        .replace(/\n\n+/g, '</p><p>');

      const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; }
    pre, code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <p>${bodyHtml}</p>
</body>
</html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(cleanTitle)}.html"`,
        },
      });
    }

    // Format 3: Word (.docx)
    const lines = source.split('\n');
    const docChildren: any[] = [];

    docChildren.push(
      new Paragraph({
        text: cleanTitle.toUpperCase(),
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    let inBody = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%')) continue;
      if (trimmed.includes('\\begin{document}')) { inBody = true; continue; }
      if (trimmed.includes('\\end{document}')) { inBody = false; break; }
      if (!inBody && !trimmed.startsWith('\\section') && !trimmed.startsWith('\\title')) continue;

      if (trimmed.startsWith('\\section{') || trimmed.startsWith('\\section*{')) {
        const secTitle = trimmed.replace(/\\section\*?\{([^}]+)\}/, '$1');
        docChildren.push(
          new Paragraph({ text: secTitle, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })
        );
        continue;
      }

      if (trimmed.startsWith('\\subsection{') || trimmed.startsWith('\\subsection*{')) {
        const subTitle = trimmed.replace(/\\subsection\*?\{([^}]+)\}/, '$1');
        docChildren.push(
          new Paragraph({ text: subTitle, heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 80 } })
        );
        continue;
      }

      let cleanText = trimmed
        .replace(/\\textbf\{([^}]+)\}/g, '$1')
        .replace(/\\textit\{([^}]+)\}/g, '$1')
        .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '√[$1]($2)')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\item\s*/g, '• ')
        .replace(/\\(?:begin|end)\{[^}]+\}/g, '')
        .replace(/\\rule\{[^}]+\}\{[^}]+\}/g, '----------------------------------------')
        .replace(/\\(?:vspace|hspace)\{[^}]+\}/g, '')
        .replace(/\\dotfill/g, '....................................................')
        .replace(/\\hfill/g, '    ')
        .replace(/\\\\[0-9a-zA-Z\s\*\^\[\]]*/g, '')
        .replace(/\$([^$]+)\$/g, '$1')
        .replace(/\$\$/g, '')
        .trim();

      if (cleanText) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: cleanText, size: 24 })],
            spacing: { after: 100 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren.length > 1 ? docChildren : [
            new Paragraph({ text: 'Tài liệu không có nội dung văn bản.' })
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(cleanTitle)}.docx"`,
      },
    });
  } catch (error: any) {
    console.error('[Export Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể xuất tài liệu.' },
      { status: 500 }
    );
  }
}
