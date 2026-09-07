import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/init-db';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    await initDb();
    const sql = getDb();

    // If caller is admin, allow passing userId query param to view any user's activation history
    const role = (user.role || '').toLowerCase();
    const isAdmin = role === 'admin';
    const queryUserId = req.nextUrl.searchParams.get('userId');
    const targetUserId = (isAdmin && queryUserId) ? queryUserId : user.id;

    // Check if targetUserId is UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);

    let rows: any[] = [];
    if (isUuid) {
      try {
        rows = await sql`
          SELECT 
            lk.id::text,
            lk.key,
            COALESCE(lk.total_credits, lk.max_usage, 50) AS total_credits,
            COALESCE(lk.duration_days, 30) AS duration_days,
            COALESCE(lk.status, 'used') AS status,
            lk.used_at,
            lk.created_at,
            creator.name AS creator_name,
            creator.username AS creator_username
          FROM license_keys lk
          LEFT JOIN users creator ON creator.id = lk.created_by
          WHERE lk.used_by = ${targetUserId}::uuid
          ORDER BY lk.used_at DESC NULLS LAST, lk.created_at DESC
        `;
      } catch (err) {
        console.warn('Query license_keys failed, trying fallback:', err);
      }
    }

    // Fallback or union with "LicenseKey" if needed
    if (!rows || rows.length === 0) {
      try {
        const prismaRows = isUuid ? await sql`
          SELECT 
            lk.id::text,
            lk.key,
            lk."totalCredits" AS total_credits,
            30 AS duration_days,
            lk.status,
            lk.used_at,
            lk."createdAt" AS created_at,
            NULL AS creator_name,
            NULL AS creator_username
          FROM "LicenseKey" lk
          WHERE lk.used_by = ${targetUserId}::uuid
          ORDER BY lk.used_at DESC NULLS LAST, lk."createdAt" DESC
        ` : [];
        if (prismaRows && prismaRows.length > 0) {
          rows = prismaRows;
        }
      } catch {}
    }

    const history = rows.map((r: any) => {
      const duration = Number(r.duration_days ?? 30);
      const isLifetime = duration === 0 || (r.key && r.key.startsWith('AIO-LT-'));
      const credits = Number(r.total_credits ?? 50);

      const valueStr = isLifetime
        ? (credits === -1 ? '+∞ Ω vô hạn' : `+${credits} Ω vô hạn`)
        : (credits === -1 ? `+∞ Ω/tháng, +${duration} ngày` : `+${credits} Ω/tháng, +${duration} ngày`);

      return {
        id: r.id,
        key: r.key,
        durationDays: duration,
        totalCredits: credits,
        isLifetime,
        valueStr,
        status: r.status || 'used',
        usedAt: r.used_at || r.created_at,
        createdAt: r.created_at,
        creatorName: r.creator_name || r.creator_username || 'Quản trị viên',
      };
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('Error fetching license history:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi lấy lịch sử key' }, { status: 500 });
  }
}
