import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  listUserCloudProjects,
  saveCloudProject,
  type CloudLatexProject,
} from '@/lib/server/latexProjectDb';

export const runtime = 'nodejs';

// GET /api/latex/projects - List user's LaTeX projects
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập để đồng bộ dự án đám mây.', projects: [] },
        { status: 401 }
      );
    }

    const projects = await listUserCloudProjects(user.id);
    return NextResponse.json({ projects, count: projects.length });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách dự án:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tải danh sách dự án.' },
      { status: 500 }
    );
  }
}

// POST /api/latex/projects - Create or bulk-migrate a project
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập để tạo hoặc lưu dự án.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    const projectData: Partial<CloudLatexProject> & { id: string } = {
      id: body.id || `proj-latex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: body.title || 'Tai_lieu_Toan_chua_dat_ten.tex',
      templateId: body.templateId || 'blank',
      mainDocument: body.mainDocument || 'main.tex',
      compilerEngine: body.compilerEngine || 'xelatex',
      files: body.files || [{ name: 'main.tex', content: body.content || '' }],
      images: body.images || [],
      metadata: body.metadata || {},
      settings: body.settings || {},
      isStarred: Boolean(body.isStarred),
    };

    const result = await saveCloudProject(projectData, user.id, body.revision);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Không thể tạo dự án.' },
        { status: result.conflict ? 409 : 400 }
      );
    }

    return NextResponse.json({ success: true, project: result.project });
  } catch (error: any) {
    console.error('Lỗi tạo dự án:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tạo dự án.' },
      { status: 500 }
    );
  }
}
