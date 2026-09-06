import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = body.currentPassword || body.current_password || '';
    const newPassword = body.newPassword || body.new_password || '';
    const confirmPassword = body.confirmPassword || body.confirm_password || '';

    if (!currentPassword) {
      return NextResponse.json({ error: 'Vui lòng nhập mật khẩu hiện tại.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' }, { status: 400 });
    }

    const sql = getDb();
    let currentHash: string | null = null;

    // 1. Kiểm tra trong Neon Postgres users table
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    const neonUser = isUuid
      ? await sql`SELECT id, password_hash FROM users WHERE id = ${user.id}::uuid LIMIT 1`
      : await sql`SELECT id, password_hash FROM users WHERE cuid = ${user.id} OR username = ${user.id} LIMIT 1`;

    if (neonUser && neonUser.length > 0) {
      currentHash = neonUser[0].password_hash;
    } else {
      // 2. Fallback kiểm tra trong Prisma User
      const pUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });
      if (pUser) {
        currentHash = pUser.passwordHash;
      }
    }

    if (!currentHash) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin tài khoản người dùng.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không chính xác.' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    // 3. Cập nhật mật khẩu mới vào Neon Postgres
    if (isUuid) {
      await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}::uuid`;
    } else {
      await sql`UPDATE users SET password_hash = ${newHash} WHERE cuid = ${user.id} OR username = ${user.id}`;
    }

    // 4. Đồng bộ cập nhật Prisma nếu tồn tại
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/user/change-password:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi khi xử lý đổi mật khẩu.' }, { status: 500 });
  }
}
