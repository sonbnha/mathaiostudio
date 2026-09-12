import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getProjectWithAccess,
  saveCloudProject,
  deleteCloudProject,
} from '@/lib/server/latexProjectDb';

export const runtime = 'nodejs';

// GET /api/latex/projects/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(req);
    const url = new URL(req.url);
    const shareToken = url.searchParams.get('token');

    const result = await getProjectWithAccess(id, user?.id || null, shareToken);
    if (!result) {
      return NextResponse.json(
        { error: 'Dự án không tồn tại hoặc bạn không có quyền truy cập.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      project: result.project,
      userRole: result.role,
      isReadOnly: result.role === 'viewer',
    });
  } catch (error: any) {
    console.error('Lỗi lấy thông tin dự án:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tải dự án.' },
      { status: 500 }
    );
  }
}

// PUT /api/latex/projects/[id] - Save project with revision check
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập để lưu vào đám mây.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    const result = await saveCloudProject(
      {
        id,
        title: body.title,
        templateId: body.templateId,
        mainDocument: body.mainDocument,
        compilerEngine: body.compilerEngine || body.engine,
        files: body.files,
        images: body.images,
        metadata: body.metadata,
        settings: body.settings,
        isStarred: body.isStarred,
      },
      user.id,
      body.clientRevision ?? body.revision
    );

    if (!result.success) {
      if (result.conflict) {
        return NextResponse.json(
          {
            error: result.error,
            conflict: true,
            serverProject: result.project,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: result.error || 'Không thể lưu dự án.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.project,
      revision: result.project?.revision,
    });
  } catch (error: any) {
    console.error('Lỗi cập nhật dự án:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi máy chủ khi lưu dự án.' },
      { status: 500 }
    );
  }
}

// DELETE /api/latex/projects/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập.' },
        { status: 401 }
      );
    }

    const success = await deleteCloudProject(id, user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa dự án này.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi xóa dự án:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xóa dự án.' },
      { status: 500 }
    );
  }
}
