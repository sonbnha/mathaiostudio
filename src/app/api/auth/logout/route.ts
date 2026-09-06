import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(_req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieNames = [
    'auth_token',
    'mathviz_auth_token',
    'has_token',
    'auth_token_client',
    'session',
    'token',
    'mathaio_token',
  ];

  // 1. Huỷ qua cookieStore của next/headers
  try {
    const cookieStore = await cookies();
    for (const name of cookieNames) {
      cookieStore.set(name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        httpOnly: name !== 'has_token' && name !== 'auth_token_client',
        secure: isProd,
        sameSite: 'lax',
      });
      cookieStore.delete(name);
    }
  } catch (err) {
    console.warn('CookieStore invalidation warning:', err);
  }

  // 2. Thiết lập header Set-Cookie dứt khoát trên NextResponse
  const response = NextResponse.json(
    { success: true, message: 'Đăng xuất thành công.' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );

  for (const name of cookieNames) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      expires: new Date(0),
      maxAge: 0,
      httpOnly: name !== 'has_token' && name !== 'auth_token_client',
      secure: isProd,
      sameSite: 'lax',
    });
  }

  return response;
}
