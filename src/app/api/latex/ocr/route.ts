import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithCascade } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    let base64Image = '';
    let mimeType = 'image/png';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Không tìm thấy file ảnh tải lên.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      base64Image = buffer.toString('base64');
      mimeType = file.type || 'image/png';
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ error: 'Thiếu dữ liệu ảnh base64.' }, { status: 400 });
      }
      base64Image = body.image.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      if (body.mimeType) mimeType = body.mimeType;
    } else {
      return NextResponse.json({ error: 'Content-Type không được hỗ trợ.' }, { status: 400 });
    }

    if (!base64Image) {
      return NextResponse.json({ error: 'Ảnh không hợp lệ hoặc rỗng.' }, { status: 400 });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Bạn là một chuyên gia chuyển đổi tài liệu Toán học và OCR đề thi tiếng Việt sang mã nguồn LaTeX chất lượng cao cho giáo viên.
Nhiệm vụ của bạn:
1. Nhận diện toàn bộ chữ viết tiếng Việt, công thức Toán học, hệ phương trình, ma trận, bảng biểu, ký hiệu hình học từ ảnh chụp (kể cả chữ viết tay hoặc sách in).
2. Chuyển đổi chính xác 100% sang mã LaTeX chuẩn:
   - Các công thức toán đặt trong $...$ (inline) hoặc $$...$$ (block) hoặc môi trường amsmath (align*, cases).
   - Đảm bảo tiếng Việt có dấu chuẩn xác.
   - Nếu là đề trắc nghiệm có 4 đáp án A, B, C, D, định dạng chuẩn \\begin{enumerate}[label=\\Alph*.] hoặc \\item A. ...
3. CHỈ TRẢ VỀ đoạn mã LaTeX của nội dung nhận diện được (không bao bọc \\documentclass hay \\begin{document} trừ khi người dùng yêu cầu toàn bộ trang, để người dùng dễ chèn vào vị trí con trỏ). Không kèm lời giải thích rườm rà.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: 'Hãy bóc tách toàn bộ nội dung đề toán/công thức trong ảnh trên thành mã LaTeX tiếng Việt chuẩn xác.',
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

    let rawText = result.text.trim();
    // Bỏ markdown code fences nếu có
    if (rawText.startsWith('```latex')) {
      rawText = rawText.replace(/^```latex\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```tex')) {
      rawText = rawText.replace(/^```tex\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return NextResponse.json({
      success: true,
      latex: rawText,
      usedModel: result.usedModel,
    });
  } catch (error: any) {
    console.error('[LaTeX OCR Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể nhận diện ảnh sang LaTeX. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
