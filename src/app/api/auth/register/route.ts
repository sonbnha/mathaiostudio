import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/init-db';
import { signToken } from '@/lib/auth';
import { sanitizeAvatar } from '@/config/avatars';

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = await req.json().catch(() => ({}));
    const rawName = (body.full_name || body.name || '').trim();
    const rawUsername = (body.username || '').trim().toLowerCase();
    const rawEmail = (body.email || '').trim().toLowerCase();
    const rawAvatar = sanitizeAvatar(body.avatar);
    const password = body.password || '';

    // 1. Kiểm tra họ và tên
    if (!rawName || rawName.length < 2) {
      return NextResponse.json({ error: 'Họ và tên phải có tối thiểu 2 ký tự.' }, { status: 400 });
    }

    // 2. Kiểm tra tên đăng nhập
    if (!rawUsername) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập.' }, { status: 400 });
    }
    const usernameRegex = /^[a-z0-9_.-]{3,30}$/;
    if (!usernameRegex.test(rawUsername)) {
      return NextResponse.json(
        { error: 'Tên đăng nhập từ 3 - 30 ký tự, chỉ gồm chữ thường, số, dấu gạch dưới hoặc gạch ngang, không dấu và không khoảng trắng.' },
        { status: 400 }
      );
    }

    // 3. Kiểm tra định dạng email
    if (!rawEmail) {
      return NextResponse.json({ error: 'Vui lòng nhập địa chỉ email.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return NextResponse.json({ error: 'Định dạng email không hợp lệ.' }, { status: 400 });
    }

    // 4. Kiểm tra độ dài mật khẩu
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    const sql = getDb();

    // 5. Kiểm tra trùng lặp email và username trong Neon Database
    const existing = await sql`
      SELECT id, username, email FROM users 
      WHERE LOWER(email) = ${rawEmail} 
         OR (username IS NOT NULL AND LOWER(username) = ${rawUsername})
      LIMIT 1
    `;

    if (existing && existing.length > 0) {
      const match = existing[0] as any;
      if (match.email && match.email.toLowerCase() === rawEmail) {
        return NextResponse.json({ error: 'Địa chỉ email này đã được đăng ký tài khoản.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 6. Tạo tài khoản mới: Tự động cấp 10 lượt trial vào ví vĩnh viễn (lifetime_quota = 10)
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
        vip_expires_at,
        avatar,
        monthly_allowance,
        monthly_credits,
        next_credit_reset_at,
        plan_expires_at,
        lifetime_credits
      )
      VALUES (
        ${rawEmail}, 
        ${rawUsername}, 
        ${passwordHash}, 
        ${rawName}, 
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
        NULL,
        ${rawAvatar},
        0,
        0,
        NULL,
        NULL,
        10
      )
      RETURNING id, email, username, name, avatar, role, status, is_vip, is_trial, vip_expires_at, 
                remaining_quota, max_quota, lifetime_quota, subscription_quota, subscription_expires_at, 
                monthly_allowance, monthly_credits, next_credit_reset_at, plan_expires_at, lifetime_credits, created_at
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
      message: 'Đăng ký tài khoản thành công! Bạn nhận được 10 Ω dùng thử miễn phí.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar || rawAvatar,
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
        monthly_allowance: 0,
        monthlyAllowance: 0,
        monthly_credits: 0,
        monthlyCredits: 0,
        next_credit_reset_at: null,
        nextCreditResetAt: null,
        plan_expires_at: null,
        planExpiresAt: null,
        lifetime_credits: 10,
        lifetimeCredits: 10,
        remaining_quota: 10,
        remainingQuota: 10,
        max_quota: 10,
        maxQuota: 10,
        remaining_credits: 10,
        remainingCredits: 10,
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

    response.cookies.set({
      name: 'has_token',
      value: '1',
      httpOnly: false,
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
