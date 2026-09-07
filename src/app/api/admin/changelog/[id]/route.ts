import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function checkAdmin(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req);
  if (!user || (user.role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return user;
}

// GET /api/admin/changelog/[id]: Get a single changelog release
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const changelog = await prisma.changelog.findFirst({
      where: {
        OR: [{ id: decodedId }, { version: decodedId }],
      },
    });

    if (!changelog) {
      return NextResponse.json({ error: 'Không tìm thấy phiên bản changelog.' }, { status: 404 });
    }

    return NextResponse.json({ changelog });
  } catch (error: any) {
    console.error('Error fetching single changelog:', error);
    return NextResponse.json({ error: 'Lỗi khi tải thông tin phiên bản.' }, { status: 500 });
  }
}

// PUT /api/admin/changelog/[id]: Update changelog details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const current = await prisma.changelog.findFirst({
      where: {
        OR: [{ id: decodedId }, { version: decodedId }],
      },
    });

    if (!current) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi phiên bản để cập nhật.' }, { status: 404 });
    }

    const body = await req.json();
    const { version, date, title, changes, isPublished } = body;

    const updateData: any = {};
    if (version !== undefined) updateData.version = version.trim();
    if (date !== undefined) updateData.date = date.trim();
    if (title !== undefined) updateData.title = title.trim();
    if (changes !== undefined) updateData.changes = changes;
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished;

    // Check version uniqueness if changed
    if (updateData.version) {
      const duplicate = await prisma.changelog.findFirst({
        where: {
          version: updateData.version,
          NOT: { id: current.id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Phiên bản "${updateData.version}" đã tồn tại trên một bản ghi khác.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.changelog.update({
      where: { id: current.id },
      data: updateData,
    });

    try {
      revalidatePath('/api/changelog');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, changelog: updated });
  } catch (error: any) {
    console.error('Error updating changelog:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật phiên bản Changelog.' }, { status: 500 });
  }
}

// PATCH /api/admin/changelog/[id]: Toggle isPublished status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { isPublished } = body;

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json({ error: 'Thiếu trường isPublished.' }, { status: 400 });
    }

    const updated = await prisma.changelog.update({
      where: { id },
      data: { isPublished },
    });

    try {
      revalidatePath('/api/changelog');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, changelog: updated });
  } catch (error: any) {
    console.error('Error patching changelog status:', error);
    return NextResponse.json({ error: 'Lỗi khi đổi trạng thái hiển thị.' }, { status: 500 });
  }
}

// DELETE /api/admin/changelog/[id]: Delete a changelog release
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  try {
    const { id } = await params;

    await prisma.changelog.delete({
      where: { id },
    });

    try {
      revalidatePath('/api/changelog');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Đã xóa phiên bản Changelog thành công.' });
  } catch (error: any) {
    console.error('Error deleting changelog:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa phiên bản Changelog.' }, { status: 500 });
  }
}
