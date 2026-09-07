import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 0. Nếu người dùng đang đăng nhập, áp dụng quy tắc khấu trừ 2 ví: Ưu tiên 1 Ví Monthly Credits -> Ưu tiên 2 Ví Lifetime Credits
    try {
      const { getCurrentUserFromRequest } = await import('@/lib/auth');
      const currentUser = await getCurrentUserFromRequest(req);
      if (currentUser) {
        if ((currentUser.role || '').toLowerCase() === 'admin') {
          return NextResponse.json({
            success: true,
            remainingCredits: -1,
            remaining_quota: -1,
            isUnlimited: true,
          });
        }

        const { deductUserCredit } = await import('@/lib/credits');
        const sql = getDb();
        const userApiKey = (currentUser as any).apiKey || (currentUser as any).api_key;
        const deductResult = await deductUserCredit(currentUser.id, sql, { apiKey: userApiKey });

        if (!deductResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: deductResult.error || 'Tài khoản của bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.',
              message: deductResult.error || 'Tài khoản của bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.',
            },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          walletDeducted: deductResult.walletDeducted,
          remainingCredits: deductResult.totalCredits,
          remaining_quota: deductResult.totalCredits,
          monthlyCredits: deductResult.monthlyCredits,
          monthly_credits: deductResult.monthlyCredits,
          monthlyAllowance: deductResult.monthlyAllowance,
          monthly_allowance: deductResult.monthlyAllowance,
          lifetimeCredits: deductResult.lifetimeCredits,
          lifetime_credits: deductResult.lifetimeCredits,
          lifetimeQuota: deductResult.lifetimeCredits,
          lifetime_quota: deductResult.lifetimeCredits,
          subscriptionQuota: deductResult.monthlyCredits,
          subscription_quota: deductResult.monthlyCredits,
        });
      }
    } catch (userDeductErr) {
      console.warn('Lỗi khấu trừ ví user:', userDeductErr);
    }

    const rawKey =
      req.headers.get('x-license-key') ||
      req.headers.get('X-License-Key') ||
      (await req.json().catch(() => ({})))?.licenseKey;

    if (!rawKey || !rawKey.trim()) {
      return NextResponse.json({ success: true, remainingCredits: -1, totalCredits: -1, usedCredits: 0 });
    }

    const cleanKey = rawKey.trim().toUpperCase();

    // 1. Thử cập nhật qua Prisma
    try {
      const keyRecord = await prisma.licenseKey.findFirst({
        where: { key: { equals: cleanKey, mode: 'insensitive' } },
      });

      if (keyRecord && keyRecord.isActive) {
        let remainingCredits: number | string = -1;
        let usedCredits = keyRecord.usedCredits;
        if (keyRecord.totalCredits !== -1) {
          if (keyRecord.usedCredits >= keyRecord.totalCredits) {
            return NextResponse.json({ success: false, message: 'License key đã hết lượt sử dụng.' }, { status: 403 });
          }

          const updated = await prisma.licenseKey.update({
            where: { id: keyRecord.id },
            data: { usedCredits: { increment: 1 } },
          });

          usedCredits = updated.usedCredits;
          remainingCredits = Math.max(0, updated.totalCredits - updated.usedCredits);
        }

        return NextResponse.json({
          success: true,
          remainingCredits,
          usedCredits,
          totalCredits: keyRecord.totalCredits,
        });
      }
    } catch {}

    // 2. Thử cập nhật qua Neon DB nếu không tìm thấy trong Prisma
    try {
      const sql = getDb();
      const updatedRows = await sql`
        UPDATE license_keys
        SET used_credits = used_credits + 1
        WHERE UPPER(key) = ${cleanKey} AND is_active = TRUE AND (total_credits = -1 OR used_credits < total_credits)
        RETURNING total_credits AS "totalCredits", used_credits AS "usedCredits", used_by;
      `;

      if (updatedRows && updatedRows.length > 0) {
        const u = updatedRows[0];
        if (u.used_by) {
          await sql`
            UPDATE users
            SET remaining_quota = GREATEST(0, remaining_quota - 1)
            WHERE id = ${u.used_by}::uuid;
          `;
        }
        const rem = u.totalCredits === -1 ? -1 : Math.max(0, u.totalCredits - u.usedCredits);
        return NextResponse.json({
          success: true,
          remainingCredits: rem,
          remaining_quota: rem,
          usedCredits: u.usedCredits,
          totalCredits: u.totalCredits,
        });
      }
    } catch {}

    return NextResponse.json({ success: true, remainingCredits: -1 });
  } catch (err: any) {
    console.error('Lỗi trừ credit license:', err);
    return NextResponse.json({ success: true, error: err?.message });
  }
}
