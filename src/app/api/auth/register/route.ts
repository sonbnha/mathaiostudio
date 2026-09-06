import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/init-db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = await req.json().catch(() => ({}));
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập địa chỉ email.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Định dạng email không hợp lệ.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : email.split('@')[0];

    const sql = getDb();

    // Check if email or username already exists
    const existing = await sql`
      SELECT id FROM users 
      WHERE LOWER(email) = LOWER(${email.trim()}) 
         OR (username IS NOT NULL AND LOWER(username) = LOWER(${email.trim()}))
      LIMIT 1
    `;

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Email này đã được đăng ký tài khoản.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (
        email, 
        username, 
        password_hash, 
        name, 
        role, 
        status, 
        is_active,
        lifetime_quota,
        subscription_quota,
        subscription_expires_at,
        remaining_quota,
        max_quota,
        is_vip,
        is_trial,
        vip_expires_at
      )
      VALUES (
        ${email.trim().toLowerCase()}, 
        ${email.trim().toLowerCase()}, 
        ${passwordHash}, 
        ${displayName}, 
        'user', 
        'active', 
        true,
        10,
        0,
        NULL,
        10,
        10,
        false,
        true,
        NULL
      )
      RETURNING id, email, username, name, role, status, is_vip, is_trial, vip_expires_at, remaining_quota, max_quota, lifetime_quota, subscription_quota, subscription_expires_at, created_at
    `;

    const user = result[0] as any;

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username || user.email,
      name: user.name,
      role: user.role || 'user',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Bạn nhận được 10 lượt dùng thử miễn phí.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        status: user.status || 'active',
        is_vip: false,
        isVip: false,
        is_trial: true,
        isTrial: true,
        vip_expires_at: null,
        vipExpiresAt: null,
        lifetime_quota: 10,
        lifetimeQuota: 10,
        subscription_quota: 0,
        subscriptionQuota: 0,
        subscription_expires_at: null,
        subscriptionExpiresAt: null,
        remaining_quota: 10,
        remainingQuota: 10,
        max_quota: 10,
        maxQuota: 10,
      },
    });

    response.cookies.set({
      name: 'mathviz_auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Lỗi đăng ký tài khoản:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xử lý đăng ký tài khoản.' },
      { status: 500 }
    );
  }
}
