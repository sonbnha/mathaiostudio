import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/init-db';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực người dùng qua session/cookie JWT
    const currentUser = await getCurrentUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để kích hoạt License Key.' },
        { status: 401 }
      );
    }

    // 2. Nhận payload và chuẩn hóa mã key
    const body = await req.json().catch(() => ({}));
    const rawKey = body.keyCode || body.key;
    const cleanKey = (rawKey || '').trim().toUpperCase();

    if (!cleanKey) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mã License Key.' },
        { status: 400 }
      );
    }

    await initDb();
    const sql = getDb();

    // 3. Tìm mã key trong database Neon (Kiểm tra cả bảng license_keys và LicenseKey)
    let keyRows = await sql`
      SELECT 
        id, 
        key, 
        total_credits AS "totalCredits", 
        used_credits AS "usedCredits", 
        duration_days AS "durationDays",
        max_usage AS "maxUsage",
        expires_at AS "expiresAt", 
        is_active AS "isActive", 
        status, 
        used_by, 
        used_at,
        created_at
      FROM license_keys
      WHERE UPPER(key) = ${cleanKey}
      LIMIT 1
    `;

    if (!keyRows || keyRows.length === 0) {
      keyRows = await sql`
        SELECT 
          id, 
          key, 
          "totalCredits", 
          "usedCredits", 
          "expiresAt", 
          "isActive", 
          status, 
          used_by, 
          used_at,
          "createdAt" AS created_at
        FROM "LicenseKey"
        WHERE UPPER(key) = ${cleanKey}
        LIMIT 1
      `;
    }

    if (!keyRows || keyRows.length === 0) {
      return NextResponse.json(
        { error: 'Mã key không tồn tại trên hệ thống.' },
        { status: 400 }
      );
    }

    const keyRecord = keyRows[0];

    // 4. Kiểm tra điều kiện hợp lệ của Key
    if (keyRecord.isActive === false) {
      return NextResponse.json(
        { error: 'Mã key này đã bị vô hiệu hóa.' },
        { status: 400 }
      );
    }

    if (keyRecord.status === 'used' || keyRecord.used_by !== null) {
      return NextResponse.json(
        { error: 'Mã key không hợp lệ hoặc đã được kích hoạt trước đó.' },
        { status: 400 }
      );
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Mã key này đã hết hạn sử dụng.' },
        { status: 400 }
      );
    }

    if (keyRecord.totalCredits !== -1 && keyRecord.usedCredits >= keyRecord.totalCredits) {
      return NextResponse.json(
        { error: 'Mã key này đã sử dụng hết lượt.' },
        { status: 400 }
      );
    }

    // 5. Xác định giá trị thời hạn (duration_days) và số lượt (max_usage) của Key mới
    let durationDays = 30;
    if (typeof keyRecord.durationDays === 'number') {
      durationDays = keyRecord.durationDays;
    } else if (typeof (keyRecord as any).duration_days === 'number') {
      durationDays = (keyRecord as any).duration_days;
    } else if (keyRecord.expiresAt) {
      const createdTime = new Date(keyRecord.created_at || Date.now()).getTime();
      const expTime = new Date(keyRecord.expiresAt).getTime();
      const diffDays = Math.round((expTime - createdTime) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) durationDays = diffDays;
    } else {
      durationDays = 0;
    }

    const isLifetimeKey = durationDays === 0 || cleanKey.startsWith('AIO-LT-') || keyRecord.expiresAt === null;

    let keyQuotaGranted = 100;
    if (typeof keyRecord.maxUsage === 'number') {
      keyQuotaGranted = keyRecord.maxUsage;
    } else if (typeof (keyRecord as any).max_usage === 'number') {
      keyQuotaGranted = (keyRecord as any).max_usage;
    } else if (typeof keyRecord.totalCredits === 'number') {
      keyQuotaGranted = keyRecord.totalCredits;
    } else if (typeof (keyRecord as any).total_credits === 'number') {
      keyQuotaGranted = (keyRecord as any).total_credits;
    }

    // 6. Lấy dữ liệu ví hiện tại của tài khoản từ bảng users trên Neon DB
    const userRows = await sql`
      SELECT id, email, username, name, role, is_vip, vip_expires_at, remaining_quota, max_quota, api_key, lifetime_quota, subscription_quota, subscription_expires_at
      FROM users
      WHERE id = ${currentUser.id}::uuid
      LIMIT 1
    `;
    const userObj = currentUser as any;
    const dbUser = (userRows && userRows.length > 0 ? userRows[0] : userObj) as any;

    const now = new Date();
    const currentLifetimeQuota = Number(dbUser?.lifetime_quota ?? 0);
    const currentSubQuota = Number(dbUser?.subscription_quota ?? 0);
    const currentSubExpiresAt = dbUser?.subscription_expires_at 
      ? new Date(dbUser.subscription_expires_at) 
      : (dbUser?.vip_expires_at ? new Date(dbUser.vip_expires_at) : null);

    let newLifetimeQuota = currentLifetimeQuota;
    let newSubQuota = currentSubQuota;
    let newSubExpiresAt: Date | null = currentSubExpiresAt;

    if (isLifetimeKey) {
      // 1. Trường hợp nạp Key VĨNH VIỄN:
      // user.lifetime_quota += key.quota
      // Giữ nguyên trạng thái và hạn của subscription_expires_at (nếu đang có).
      newLifetimeQuota = currentLifetimeQuota + (keyQuotaGranted === -1 ? 999999 : keyQuotaGranted);
    } else {
      // 2. Trường hợp nạp Key CÓ THỜI HẠN:
      // Nếu gói thuê bao hiện tại đã hết hạn hoặc chưa từng có:
      //   user.subscription_quota = key.quota
      //   user.subscription_expires_at = NOW() + key.duration_days
      // Nếu gói thuê bao hiện tại vẫn còn hạn:
      //   user.subscription_quota += key.quota
      //   user.subscription_expires_at = user.subscription_expires_at + key.duration_days
      // Tuyệt đối KHÔNG cộng vào lifetime_quota.
      if (!currentSubExpiresAt || currentSubExpiresAt <= now) {
        newSubQuota = keyQuotaGranted;
        newSubExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      } else {
        newSubQuota = currentSubQuota + keyQuotaGranted;
        newSubExpiresAt = new Date(currentSubExpiresAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }
    }

    const isSubStillActive = Boolean(newSubExpiresAt && newSubExpiresAt > now);
    const newRemainingQuota = (isSubStillActive ? newSubQuota : 0) + newLifetimeQuota;
    const newVipExpiresAt = newLifetimeQuota > 0 ? null : (newSubExpiresAt || null);

    // 3. Đảm bảo tính toàn vẹn dữ liệu (Atomic Transaction):
    // 3.1 Đánh dấu key đó trong bảng license_keys: status = 'used', used_by = user.id, used_at = NOW()
    await sql`
      UPDATE license_keys
      SET 
        status = 'used',
        used_by = ${currentUser.id}::uuid,
        used_at = CURRENT_TIMESTAMP
      WHERE UPPER(key) = ${cleanKey}
    `;

    try {
      await sql`
        UPDATE "LicenseKey"
        SET 
          status = 'used',
          used_by = ${currentUser.id}::uuid,
          used_at = CURRENT_TIMESTAMP
        WHERE UPPER(key) = ${cleanKey}
      `;
    } catch {}

    // 3.2 Cập nhật tài khoản người dùng trong bảng users (Neon DB)
    const updatedUsers = await sql`
      UPDATE users
      SET 
        is_vip = TRUE,
        vip_expires_at = ${newVipExpiresAt},
        subscription_expires_at = ${newSubExpiresAt},
        subscription_quota = ${newSubQuota},
        lifetime_quota = ${newLifetimeQuota},
        remaining_quota = ${newRemainingQuota},
        max_quota = GREATEST(COALESCE(max_quota, 0), ${newRemainingQuota}),
        api_key = ${cleanKey}
      WHERE id = ${currentUser.id}::uuid
      RETURNING id, name, email, username, role, is_vip, vip_expires_at, remaining_quota, max_quota, api_key, lifetime_quota, subscription_quota, subscription_expires_at
    `;

    const updatedUser = updatedUsers && updatedUsers.length > 0 ? updatedUsers[0] : null;

    // 3.3 Đồng bộ sang Prisma User nếu tồn tại
    try {
      const cuid = (currentUser as any).cuid;
      if (cuid || currentUser.id) {
        await prisma.user.updateMany({
          where: {
            OR: [
              { id: currentUser.id },
              ...(cuid ? [{ id: cuid }] : []),
            ],
          },
          data: {
            isVip: true,
            vipExpiresAt: newVipExpiresAt,
            maxCredits: newRemainingQuota ?? -1,
          },
        });
      }
    } catch (prismaSyncErr) {
      console.warn('Prisma User VIP sync warning:', prismaSyncErr);
    }

    // 4. Trả về thông tin cập nhật cho frontend
    const successMsg = isLifetimeKey
      ? `Kích hoạt thành công gói Vĩnh viễn (+${keyQuotaGranted === -1 ? '∞' : keyQuotaGranted} lượt trọn đời)!`
      : `Kích hoạt thành công gói Thuê bao (+${keyQuotaGranted === -1 ? '∞' : keyQuotaGranted} lượt, +${durationDays} ngày)!`;

    return NextResponse.json({
      success: true,
      message: successMsg,
      newExpiresAt: newSubExpiresAt ? newSubExpiresAt.toISOString() : null,
      newRemainingQuota,
      lifetimeQuota: newLifetimeQuota,
      subscriptionQuota: newSubQuota,
      subscriptionExpiresAt: newSubExpiresAt ? newSubExpiresAt.toISOString() : null,
      user: {
        ...currentUser,
        id: updatedUser?.id || currentUser.id,
        name: updatedUser?.name || currentUser.name,
        email: updatedUser?.email || (currentUser as any).email || '',
        username: updatedUser?.username || currentUser.username,
        role: updatedUser?.role || currentUser.role,
        isVip: true,
        is_vip: true,
        vipExpiresAt: newVipExpiresAt ? newVipExpiresAt.toISOString() : null,
        vip_expires_at: newVipExpiresAt ? newVipExpiresAt.toISOString() : null,
        subscription_expires_at: newSubExpiresAt ? newSubExpiresAt.toISOString() : null,
        subscriptionExpiresAt: newSubExpiresAt ? newSubExpiresAt.toISOString() : null,
        subscription_quota: newSubQuota,
        subscriptionQuota: newSubQuota,
        lifetime_quota: newLifetimeQuota,
        lifetimeQuota: newLifetimeQuota,
        remaining_quota: newRemainingQuota,
        remainingQuota: newRemainingQuota,
        max_quota: updatedUser?.max_quota || newRemainingQuota,
        maxQuota: updatedUser?.max_quota || newRemainingQuota,
        remaining_credits: newRemainingQuota,
        remainingCredits: newRemainingQuota,
        usage_limit: updatedUser?.max_quota || newRemainingQuota,
        usageLimit: updatedUser?.max_quota || newRemainingQuota,
        apiKey: cleanKey,
        api_key: cleanKey,
      },
    });
  } catch (err: any) {
    console.error('Lỗi khi kích hoạt License Key:', err);
    return NextResponse.json(
      { error: err.message || 'Đã có lỗi xảy ra khi kích hoạt License Key.' },
      { status: 500 }
    );
  }
}
