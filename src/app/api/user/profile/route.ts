import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { sanitizeAvatar, isValidAvatar } from '@/config/avatars';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' }, { status: 401 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error in GET /api/user/profile:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy thông tin người dùng.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawName = (body.full_name || body.name || '').trim();
    const rawAvatar = body.avatar ? body.avatar.trim() : null;

    if (!rawName || rawName.length < 2) {
      return NextResponse.json({ error: 'Họ và tên phải có tối thiểu 2 ký tự.' }, { status: 400 });
    }

    if (rawAvatar && !isValidAvatar(rawAvatar)) {
      return NextResponse.json(
        { error: 'Avatar không hợp lệ. Vui lòng chọn một avatar từ danh sách có sẵn của hệ thống.' },
        { status: 400 }
      );
    }

    const cleanAvatar = sanitizeAvatar(rawAvatar || (user as any).avatar);
    const sql = getDb();

    // 1. Cập nhật trong bảng users của Neon Postgres
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    let updatedRows = isUuid
      ? await sql`
          UPDATE users
          SET name = ${rawName}, avatar = ${cleanAvatar}
          WHERE id = ${user.id}::uuid
          RETURNING id, email, username, name, avatar, role, status, is_vip, is_trial, vip_expires_at, remaining_quota, max_quota, lifetime_quota, subscription_quota, subscription_expires_at, created_at
        `
      : await sql`
          UPDATE users
          SET name = ${rawName}, avatar = ${cleanAvatar}
          WHERE cuid = ${user.id} OR username = ${user.id}
          RETURNING id, email, username, name, avatar, role, status, is_vip, is_trial, vip_expires_at, remaining_quota, max_quota, lifetime_quota, subscription_quota, subscription_expires_at, created_at
        `;

    // 2. Cập nhật đồng bộ trong Prisma User nếu là Admin / Staff
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: rawName, avatar: cleanAvatar },
      });
    } catch {}

    const updatedUser = updatedRows && updatedRows.length > 0 ? updatedRows[0] : { ...user, name: rawName, avatar: cleanAvatar };

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công!',
      user: {
        ...user,
        ...updatedUser,
        name: rawName,
        avatar: cleanAvatar,
      },
    });
  } catch (error: any) {
    console.error('Error in PUT /api/user/profile:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi khi cập nhật thông tin cá nhân.' }, { status: 500 });
  }
}
