import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 0. Nếu người dùng đang đăng nhập, áp dụng quy tắc khấu trừ 2 ví: Ưu tiên 1 Ví Gói Thuê Bao -> Ưu tiên 2 Ví Vĩnh Viễn
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

        const sql = getDb();
        const userRows = await sql`
          SELECT id, role, subscription_quota, subscription_expires_at, lifetime_quota, remaining_quota, max_quota
          FROM users
          WHERE id = ${currentUser.id}::uuid
          LIMIT 1
        `;

        if (userRows && userRows.length > 0) {
          const u = userRows[0];
          const now = new Date();
          const subActive = Boolean(u.subscription_expires_at && new Date(u.subscription_expires_at) > now);
          const subQuota = Number(u.subscription_quota || 0);
          const lifeQuota = Number(u.lifetime_quota || 0);

          // Ưu tiên 1: Ví có hạn (Subscription)
          if (subActive && subQuota > 0) {
            const newSub = subQuota - 1;
            const newTotal = newSub + lifeQuota;
            await sql`
              UPDATE users
              SET 
                subscription_quota = ${newSub},
                remaining_quota = ${newTotal}
              WHERE id = ${u.id}::uuid
            `;
            return NextResponse.json({
              success: true,
              walletDeducted: 'subscription',
              remainingCredits: newTotal,
              remaining_quota: newTotal,
              subscriptionQuota: newSub,
              subscription_quota: newSub,
              lifetimeQuota: lifeQuota,
              lifetime_quota: lifeQuota,
            });
          }

          // Ưu tiên 2: Ví vĩnh viễn (Lifetime)
          if (lifeQuota > 0) {
            const newLife = lifeQuota - 1;
            const newTotal = (subActive ? subQuota : 0) + newLife;
            await sql`
              UPDATE users
              SET 
                lifetime_quota = ${newLife},
                remaining_quota = ${newTotal}
              WHERE id = ${u.id}::uuid
            `;
            return NextResponse.json({
              success: true,
              walletDeducted: 'lifetime',
              remainingCredits: newTotal,
              remaining_quota: newTotal,
              subscriptionQuota: subQuota,
              subscription_quota: subQuota,
              lifetimeQuota: newLife,
              lifetime_quota: newLife,
            });
          }

          // Cả 2 ví đều không đủ điều kiện
          return NextResponse.json(
            {
              success: false,
              error: 'Bạn đã hết lượt sử dụng. Vui lòng nạp thêm License Key để tiếp tục.',
              message: 'Bạn đã hết lượt sử dụng. Vui lòng nạp thêm License Key để tiếp tục.',
            },
            { status: 403 }
          );
        }
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
