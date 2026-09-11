import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithCascade } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { action, source, customPrompt } = await req.json();

    if (!source || typeof source !== 'string') {
      return NextResponse.json({ error: 'Thiếu nội dung tài liệu LaTeX.' }, { status: 400 });
    }

    const ai = getGeminiClient();

    let systemInstruction = '';
    let userPrompt = '';

    switch (action) {
      case 'similar_5':
        systemInstruction = `Bạn là chuyên gia sư phạm Toán học Việt Nam.
Nhiệm vụ: Dựa trên bài toán hoặc tài liệu LaTeX của người dùng, hãy tạo ra 5 BÀI TOÁN TƯƠNG TỰ VÀ PHÁT TRIỂN có độ khó tương đương và nâng cao, kèm lời giải chi tiết theo chuẩn LaTeX.
Định dạng xuất ra: Mã LaTeX các bài toán sử dụng môi trường \\begin{exercise} ... \\end{exercise} và \\begin{solution} ... \\end{solution} (hoặc \\textbf{Lời giải.}).
Chỉ trả về đoạn mã LaTeX sẵn sàng để chèn thêm vào tài liệu.`;
        userPrompt = `Dưới đây là tài liệu/bài toán gốc:\n\n${source}\n\nHãy tạo 5 bài toán tương tự kèm lời giải chuẩn LaTeX.`;
        break;

      case 'convert_mcq':
        systemInstruction = `Bạn là chuyên gia khảo thí và biên soạn đề thi trắc nghiệm Toán học chuẩn BGD&ĐT.
Nhiệm vụ: Chuyển đổi các câu hỏi tự luận hoặc nội dung bài toán trong tài liệu LaTeX của người dùng thành các CÂU HỎI TRẮC NGHIỆM 4 PHƯƠNG ÁN LỰA CHỌN (A, B, C, D) chuẩn format exam class.
Mỗi câu hỏi có 4 đáp án trong \\begin{multicols}{4} \\begin{enumerate}[label=\\Alph*.] ... \\end{enumerate} \\end{multicols} và ghi rõ đáp án đúng ở cuối.
Chỉ trả về đoạn mã LaTeX sẵn sàng chèn vào tài liệu.`;
        userPrompt = `Dưới đây là tài liệu/bài toán cần chuyển sang trắc nghiệm 4 đáp án:\n\n${source}`;
        break;

      case 'answer_matrix':
        systemInstruction = `Bạn là chuyên gia xây dựng ma trận đề thi và bảng đáp án Toán học.
Nhiệm vụ: Phân tích toàn bộ các câu hỏi trong tài liệu LaTeX và tự động tạo:
1. BẢNG ĐÁP ÁN TRẮC NGHIỆM (dạng bảng LaTeX \\begin{tabular} gọn gàng, đẹp mắt).
2. MA TRẬN MỨC ĐỘ NHẬN THỨC (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) theo chuẩn chương trình GDPT 2018.
Chỉ trả về khối mã LaTeX bảng đáp án và ma trận đề thi.`;
        userPrompt = `Dưới đây là nội dung đề thi/tài liệu LaTeX:\n\n${source}\n\nHãy lập Bảng đáp án và Ma trận nhận thức chuẩn LaTeX.`;
        break;

      case 'custom':
      default:
        systemInstruction = `Bạn là trợ lý AI biên soạn tài liệu Toán học LaTeX chuyên nghiệp. Thực hiện chính xác yêu cầu của người dùng trên tài liệu LaTeX và trả về mã LaTeX chuẩn.`;
        userPrompt = `YÊU CẦU: ${customPrompt || 'Tối ưu hóa và làm đẹp tài liệu LaTeX này'}\n\nTÀI LIỆU LATEX:\n${source}`;
        break;
    }

    const contents = [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ];

    const result = await generateContentWithCascade({
      ai,
      contents,
      systemInstruction,
      temperature: 0.2,
    });

    let output = result.text.trim();
    if (output.startsWith('```latex')) {
      output = output.replace(/^```latex\s*/, '').replace(/\s*```$/, '');
    } else if (output.startsWith('```tex')) {
      output = output.replace(/^```tex\s*/, '').replace(/\s*```$/, '');
    } else if (output.startsWith('```')) {
      output = output.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return NextResponse.json({
      success: true,
      result: output,
      action,
    });
  } catch (error: any) {
    console.error('[LaTeX AI Assist Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể xử lý yêu cầu AI. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
