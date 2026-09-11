import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithCascade } from '@/lib/gemini';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST: Handles Export LaTeX -> Docx (JSON) AND Import Docx -> LaTeX (multipart/form-data)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // CASE 1: Import Word (.docx) -> Convert to LaTeX
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Không tìm thấy tệp Word (.docx).' }, { status: 400 });
      }

      // Convert docx binary to text or send to Gemini with base64
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Docx = buffer.toString('base64');

      const ai = getGeminiClient();
      const systemInstruction = `Bạn là một chuyên gia chuyển đổi tệp tài liệu Microsoft Word (.docx) chứa công thức Toán học MathType/Office Math sang mã nguồn LaTeX chất lượng cao cho giáo viên Việt Nam.
Nhiệm vụ:
1. Đọc toàn bộ nội dung văn bản, tiêu đề, câu hỏi trắc nghiệm/tự luận, bảng biểu và công thức toán trong tài liệu Word.
2. Chuyển đổi chính xác 100% sang mã nguồn LaTeX hoàn chỉnh (chuẩn fontspec / Times New Roman / tiếng Việt babel, amsmath, geometry).
3. Đảm bảo cấu trúc tài liệu cân đối, đẹp mắt, biên dịch ra PDF không lỗi.
Chỉ trả về mã nguồn LaTeX chuẩn.`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Docx,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              },
            },
            {
              text: 'Hãy bóc tách toàn bộ tài liệu Word trên và chuyển thành mã nguồn LaTeX tiếng Việt hoàn chỉnh.',
            },
          ],
        },
      ];

      const result = await generateContentWithCascade({
        ai,
        contents,
        systemInstruction,
        temperature: 0.1,
      });

      let latex = result.text.trim();
      if (latex.startsWith('```latex')) {
        latex = latex.replace(/^```latex\s*/, '').replace(/\s*```$/, '');
      } else if (latex.startsWith('```tex')) {
        latex = latex.replace(/^```tex\s*/, '').replace(/\s*```$/, '');
      } else if (latex.startsWith('```')) {
        latex = latex.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return NextResponse.json({
        success: true,
        latex,
        fileName: file.name,
      });
    }

    // CASE 2: Export LaTeX -> Word (.docx)
    if (contentType.includes('application/json')) {
      const { source, title = 'Tai_lieu_toan_hoc' } = await req.json();
      if (!source || typeof source !== 'string') {
        return NextResponse.json({ error: 'Thiếu mã nguồn LaTeX cần xuất Word.' }, { status: 400 });
      }

      // Clean LaTeX commands into readable Word paragraphs with formatted Math
      const lines = source.split('\n');
      const docChildren: any[] = [];

      // Add Header / Title
      docChildren.push(
        new Paragraph({
          text: 'TÀI LIỆU TOÁN HỌC -- MATHAIO STUDIO',
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );

      let inBody = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('%')) continue;
        if (trimmed.includes('\\begin{document}')) {
          inBody = true;
          continue;
        }
        if (trimmed.includes('\\end{document}')) {
          inBody = false;
          break;
        }
        if (!inBody && !trimmed.startsWith('\\section') && !trimmed.startsWith('\\title')) {
          continue;
        }

        // Section header
        if (trimmed.startsWith('\\section{') || trimmed.startsWith('\\section*{')) {
          const secTitle = trimmed.replace(/\\section\*?\{([^}]+)\}/, '$1');
          docChildren.push(
            new Paragraph({
              text: secTitle,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 },
            })
          );
          continue;
        }

        // Subsection
        if (trimmed.startsWith('\\subsection{') || trimmed.startsWith('\\subsection*{')) {
          const subTitle = trimmed.replace(/\\subsection\*?\{([^}]+)\}/, '$1');
          docChildren.push(
            new Paragraph({
              text: subTitle,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 180, after: 80 },
            })
          );
          continue;
        }

        // Clean common LaTeX tokens for Word
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
          .replace(/\$\$/g, '');

        cleanText = cleanText.trim();
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
          'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.docx"`,
        },
      });
    }

    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    console.error('[LaTeX Word Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể chuyển đổi file Word.' },
      { status: 500 }
    );
  }
}
