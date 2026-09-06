import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/init-db';

export async function POST(req: NextRequest) {
  try {
    let body: {
      email?: string;
      username?: string;
      identifier?: string;
      usernameOrEmail?: string;
      password?: string;
      rememberMe?: boolean;
      remember?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const identifier = (body.identifier || body.usernameOrEmail || body.username || body.email || '').trim();
    const password = body.password || '';
    const rememberMe = Boolean(body.rememberMe ?? body.remember);
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập email hoặc tên đăng nhập và mật khẩu.' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra trong Neon Database bảng `users` (so sánh cả username lẫn email)
    try {
      await initDb();
      const sql = getDb();
      const neonUsers = await sql`
        SELECT id, email, username, password_hash, name, role, status, is_active, api_key, cuid,
               lifetime_quota, subscription_quota, subscription_expires_at, remaining_quota, max_quota, is_vip, is_trial, vip_expires_at
        FROM users
        WHERE LOWER(username) = LOWER(${identifier}) OR LOWER(email) = LOWER(${identifier})
        LIMIT 1
      `;

      if (neonUsers && neonUsers.length > 0) {
        const user = neonUsers[0] as any;
        if (user.status === 'banned' || user.is_active === false) {
          return NextResponse.json(
            { error: 'Tài khoản của bạn đã bị tạm khóa (Banned). Vui lòng liên hệ Quản trị viên.' },
            { status: 403 }
          );
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
          const token = signToken({
            userId: user.id,
            email: user.email,
            username: user.username || user.email,
            name: user.name,
            role: user.role || 'user',
          });

          const rawLifetimeQuota = typeof user.lifetime_quota === 'number' ? user.lifetime_quota : 0;
          const rawSubscriptionQuota = typeof user.subscription_quota === 'number' ? user.subscription_quota : 0;
          const rawSubExpiresAt = user.subscription_expires_at || null;
          const subExpiresAtIso = rawSubExpiresAt ? new Date(rawSubExpiresAt).toISOString() : null;
          const now = new Date();
          const isSubActive = Boolean(rawSubExpiresAt && new Date(rawSubExpiresAt) > now);
          const finalIsVip = Boolean((user.role || '').toLowerCase() === 'admin' || user.is_vip || isSubActive);
          const finalIsTrial = Boolean(!finalIsVip);
          const totalAvailable = (isSubActive ? rawSubscriptionQuota : 0) + rawLifetimeQuota;
          const userDbRemainingQuota = typeof user.remaining_quota === 'number' ? user.remaining_quota : null;
          const userDbMaxQuota = typeof user.max_quota === 'number' ? user.max_quota : null;

          const remainingQuota = totalAvailable > 0
            ? totalAvailable
            : (userDbRemainingQuota !== null && userDbRemainingQuota >= 0 ? userDbRemainingQuota : 0);
          const maxQuota = userDbMaxQuota !== null && userDbMaxQuota > 0 ? userDbMaxQuota : remainingQuota;

          const response = NextResponse.json({
            success: true,
            token,
            user: {
              id: user.id,
              email: user.email,
              username: user.username || user.email,
              name: user.name,
              role: user.role || 'user',
              status: user.status || 'active',
              apiKey: user.api_key,
              api_key: user.api_key,
              is_vip: finalIsVip,
              isVip: finalIsVip,
              is_trial: finalIsTrial,
              isTrial: finalIsTrial,
              vip_expires_at: (finalIsVip && rawLifetimeQuota > 0 && !isSubActive) ? null : (subExpiresAtIso || (user.vip_expires_at ? new Date(user.vip_expires_at).toISOString() : null)),
              vipExpiresAt: (finalIsVip && rawLifetimeQuota > 0 && !isSubActive) ? null : (subExpiresAtIso || (user.vip_expires_at ? new Date(user.vip_expires_at).toISOString() : null)),
              subscription_expires_at: subExpiresAtIso,
              subscriptionExpiresAt: subExpiresAtIso,
              subscription_quota: rawSubscriptionQuota,
              subscriptionQuota: rawSubscriptionQuota,
              lifetime_quota: rawLifetimeQuota,
              lifetimeQuota: rawLifetimeQuota,
              remaining_quota: remainingQuota,
              remainingQuota: remainingQuota,
              max_quota: maxQuota,
              maxQuota: maxQuota,
              remaining_credits: remainingQuota,
              remainingCredits: remainingQuota,
            },
          });

          response.cookies.set({
            name: 'mathviz_auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: cookieMaxAge,
          });

          response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: cookieMaxAge,
          });

          response.cookies.set({
            name: 'has_token',
            value: '1',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: cookieMaxAge,
          });

          return response;
        }
      }
    } catch (neonErr) {
      console.warn('Neon auth query warning:', neonErr);
    }

    // 2. Tương thích ngược: Kiểm tra trong Prisma User (Admin / CTV)
    try {
      const prismaUser = await prisma.user.findFirst({
        where: {
          OR: [{ username: identifier }, { username: identifier.toLowerCase() }],
        },
      });

      if (prismaUser) {
        if (!prismaUser.isActive) {
          return NextResponse.json(
            { error: 'Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.' },
            { status: 403 }
          );
        }

        const isMatch = await bcrypt.compare(password, prismaUser.passwordHash);
        if (isMatch) {
          const token = signToken({
            userId: prismaUser.id,
            username: prismaUser.username,
            name: prismaUser.name,
            role: prismaUser.role,
          });

          const response = NextResponse.json({
            success: true,
            token,
            user: {
              id: prismaUser.id,
              username: prismaUser.username,
              name: prismaUser.name,
              role: prismaUser.role,
              maxCredits: prismaUser.maxCredits,
            },
          });

          response.cookies.set({
            name: 'mathviz_auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: cookieMaxAge,
          });

          response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: cookieMaxAge,
          });

          response.cookies.set({
            name: 'has_token',
            value: '1',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: cookieMaxAge,
          });

          return response;
        }
      }
    } catch (prismaErr) {
      console.warn('Prisma auth query warning:', prismaErr);
    }

    return NextResponse.json(
      { error: 'Email/Tên đăng nhập hoặc mật khẩu không chính xác.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi trong quá trình xử lý đăng nhập.' },
      { status: 500 }
    );
  }
}
