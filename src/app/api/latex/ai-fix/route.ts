import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithCascade } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { source, errorLog } = await req.json();

    if (!source || typeof source !== 'string') {
      return NextResponse.json({ error: 'Thiếu mã nguồn LaTeX cần sửa lỗi.' }, { status: 400 });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Bạn là một chuyên gia sửa lỗi trình biên dịch LaTeX (TeX / XeLaTeX / pdfLaTeX) bậc thầy.
Nhiệm vụ:
1. Đọc mã nguồn LaTeX và nhật ký lỗi biên dịch (compiler error log).
2. Tìm ra chính xác các nguyên nhân gây lỗi (như: thiếu dấu $, thiếu gói lệnh \\usepackage, sai tên lệnh, thiếu đóng ngoặc {}, thiếu \\end{...}, xung đột font chữ hoặc tiếng Việt babel).
3. Sửa toàn bộ các lỗi trong mã nguồn sao cho tài liệu hoàn toàn hợp lệ và biên dịch ra PDF thành công.
4. Trả về kết quả JSON chính xác có 2 trường:
   - "fixedSource": Mã nguồn LaTeX hoàn chỉnh sau khi đã vá toàn bộ lỗi.
   - "explanation": Giải thích ngắn gọn bằng tiếng Việt về những lỗi đã được sửa (tối đa 3 dòng gạch đầu dòng).
LƯU Ý QUAN TRỌNG: Chỉ trả về JSON hợp lệ có dạng: {"fixedSource": "...", "explanation": "..."}`;

    const prompt = `[NHẬT KÝ LỖI BIÊN DỊCH]:\n${errorLog || 'Không có log chi tiết, hãy kiểm tra cú pháp toàn tài liệu.'}\n\n[MÃ NGUỒN LATEX HIỆN TẠI]:\n${source}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const result = await generateContentWithCascade({
      ai,
      contents,
      systemInstruction,
      temperature: 0.1,
    });

    let rawText = result.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json({
        success: true,
        fixedSource: parsed.fixedSource || source,
        explanation: parsed.explanation || 'Đã sửa lỗi cú pháp LaTeX.',
      });
    } catch {
      // Fallback nếu AI trả về trực tiếp mã nguồn
      return NextResponse.json({
        success: true,
        fixedSource: rawText,
        explanation: 'Đã tự động tối ưu và vá lỗi mã nguồn LaTeX.',
      });
    }
  } catch (error: any) {
    console.error('[LaTeX AI Fix Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể tự động sửa lỗi LaTeX. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
