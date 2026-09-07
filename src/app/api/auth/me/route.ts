import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' },
        { status: 401 }
      );
    }

    // 1. Get count of keys created by this user if admin/staff
    let createdKeysCount = 0;
    try {
      const cuid = (user as any).cuid;
      createdKeysCount = await prisma.licenseKey.count({
        where: cuid
          ? { OR: [{ createdById: user.id }, { createdById: cuid }] }
          : { createdById: user.id },
      });
    } catch {}

    // 2. Compute VIP & Quota usage
    const role = (user.role || '').toLowerCase();
    const isAdmin = role === 'admin';
    const isVipFlag = Boolean(user.isVip || (user as any).is_vip);
    let isVip = isAdmin || isVipFlag;
    let vipExpiresAt: string | null = user.vipExpiresAt || (user as any).vip_expires_at || null;
    let usageLimit = isAdmin ? -1 : 0;
    let usageCount = 0;
    let remainingCredits: number | string = isAdmin ? -1 : 0;
    let userApiKey = (user as any).apiKey || (user as any).api_key || null;

    try {
      const sql = getDb();
      // Tìm key gắn với user trong bảng "LicenseKey" hoặc "license_keys"
      let keyRows = await sql`
        SELECT "totalCredits", "usedCredits", "expiresAt", key
        FROM "LicenseKey"
        WHERE used_by = ${user.id}::uuid OR (${userApiKey}::text IS NOT NULL AND key = ${userApiKey})
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;

      if (!keyRows || keyRows.length === 0) {
        keyRows = await sql`
          SELECT total_credits AS "totalCredits", used_credits AS "usedCredits", expires_at AS "expiresAt", key
          FROM license_keys
          WHERE used_by = ${user.id}::uuid OR (${userApiKey}::text IS NOT NULL AND key = ${userApiKey})
          ORDER BY created_at DESC
          LIMIT 1
        `;
      }

      if (keyRows && keyRows.length > 0) {
        const k = keyRows[0];
        usageLimit = typeof k.totalCredits === 'number' ? k.totalCredits : 0;
        usageCount = typeof k.usedCredits === 'number' ? k.usedCredits : 0;
        if (!vipExpiresAt && k.expiresAt) {
          vipExpiresAt = new Date(k.expiresAt).toISOString();
        }
        if (!userApiKey && k.key) {
          userApiKey = k.key;
        }
        remainingCredits = usageLimit === -1 ? -1 : Math.max(0, usageLimit - usageCount);
        isVip = true;
      } else if (isVip) {
        // Tài khoản được gắn cờ VIP không giới hạn
        usageLimit = -1;
        remainingCredits = -1;
      }
    } catch (dbErr) {
      console.warn('Lỗi truy vấn thông tin key của user:', dbErr);
    }

    const vipExpiresAtIso = vipExpiresAt ? new Date(vipExpiresAt).toISOString() : null;
    const userDbRemainingQuota = typeof (user as any).remaining_quota === 'number'
      ? (user as any).remaining_quota
      : (typeof (user as any).remainingQuota === 'number' ? (user as any).remainingQuota : null);
    const userDbMaxQuota = typeof (user as any).max_quota === 'number'
      ? (user as any).max_quota
      : (typeof (user as any).maxQuota === 'number' ? (user as any).maxQuota : null);

    const rawLifetimeQuota = typeof (user as any).lifetime_quota === 'number'
      ? (user as any).lifetime_quota
      : (typeof (user as any).lifetimeQuota === 'number' ? (user as any).lifetimeQuota : 0);
    const rawSubscriptionQuota = typeof (user as any).subscription_quota === 'number'
      ? (user as any).subscription_quota
      : (typeof (user as any).subscriptionQuota === 'number' ? (user as any).subscriptionQuota : 0);
    const rawSubExpiresAt = (user as any).subscription_expires_at || (user as any).subscriptionExpiresAt || null;
    const subExpiresAtIso = rawSubExpiresAt ? new Date(rawSubExpiresAt).toISOString() : null;

    const now = new Date();
    const isSubActive = Boolean(rawSubExpiresAt && new Date(rawSubExpiresAt) > now);
    const totalAvailableFromWallets = (isSubActive ? rawSubscriptionQuota : 0) + rawLifetimeQuota;

    const isUnlimited =
      isAdmin ||
      Boolean((user as any).is_unlimited) ||
      Boolean((user as any).isUnlimited) ||
      userDbRemainingQuota === null ||
      userDbRemainingQuota === -1 ||
      userDbMaxQuota === -1 ||
      usageLimit === -1 ||
      userDbRemainingQuota >= 999;

    const maxQuota = isUnlimited
      ? null
      : (userDbMaxQuota !== null && userDbMaxQuota > 0 ? userDbMaxQuota : (usageLimit === -1 ? null : usageLimit));

    const remainingQuota = isUnlimited
      ? null
      : (totalAvailableFromWallets > 0
          ? totalAvailableFromWallets
          : (userDbRemainingQuota !== null && userDbRemainingQuota >= 0
              ? userDbRemainingQuota
              : (typeof remainingCredits === 'number' && remainingCredits >= 0
                  ? remainingCredits
                  : (usageLimit === -1 ? null : 0))));

    const monthlyAllowance = Number((user as any).monthly_allowance ?? (user as any).monthlyAllowance ?? 0);
    const monthlyCredits = Number((user as any).monthly_credits ?? (user as any).monthlyCredits ?? rawSubscriptionQuota);
    const lifetimeCredits = Number((user as any).lifetime_credits ?? (user as any).lifetimeCredits ?? rawLifetimeQuota);
    const nextCreditResetAt = (user as any).next_credit_reset_at || (user as any).nextCreditResetAt || null;
    const planExpiresAt = (user as any).plan_expires_at || (user as any).planExpiresAt || rawSubExpiresAt;
    const planExpiresAtIso = planExpiresAt ? new Date(planExpiresAt).toISOString() : null;
    const nextCreditResetAtIso = nextCreditResetAt ? new Date(nextCreditResetAt).toISOString() : null;

    const isPlanActive = Boolean(planExpiresAt && new Date(planExpiresAt) > now);
    const finalIsVip = Boolean(isAdmin || isVip || isPlanActive);
    const finalIsTrial = Boolean(!finalIsVip && (user as any).is_trial !== false && lifetimeCredits > 0);

    return NextResponse.json({
      user: {
        ...user,
        apiKey: userApiKey,
        api_key: userApiKey,
        is_vip: finalIsVip,
        isVip: finalIsVip,
        is_trial: finalIsTrial,
        isTrial: finalIsTrial,
        is_unlimited: isUnlimited,
        isUnlimited: isUnlimited,
        vip_expires_at: (finalIsVip && lifetimeCredits > 0 && !isPlanActive) ? null : (planExpiresAtIso || vipExpiresAtIso),
        vipExpiresAt: (finalIsVip && lifetimeCredits > 0 && !isPlanActive) ? null : (planExpiresAtIso || vipExpiresAtIso),
        subscription_expires_at: planExpiresAtIso,
        subscriptionExpiresAt: planExpiresAtIso,
        subscription_quota: monthlyCredits,
        subscriptionQuota: monthlyCredits,
        lifetime_quota: lifetimeCredits,
        lifetimeQuota: lifetimeCredits,
        monthly_allowance: monthlyAllowance,
        monthlyAllowance: monthlyAllowance,
        monthly_credits: monthlyCredits,
        monthlyCredits: monthlyCredits,
        next_credit_reset_at: nextCreditResetAtIso,
        nextCreditResetAt: nextCreditResetAtIso,
        plan_expires_at: planExpiresAtIso,
        planExpiresAt: planExpiresAtIso,
        lifetime_credits: lifetimeCredits,
        lifetimeCredits: lifetimeCredits,
        remaining_quota: remainingQuota,
        remainingQuota: remainingQuota,
        max_quota: maxQuota,
        maxQuota: maxQuota,
        usage_limit: maxQuota,
        usageLimit: maxQuota,
        usage_count: usageCount,
        usageCount: usageCount,
        remaining_credits: remainingQuota,
        remainingCredits: remainingQuota,
        createdKeysCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin người dùng.' },
      { status: 500 }
    );
  }
}
