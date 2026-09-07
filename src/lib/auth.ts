import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'mathviz-secure-jwt-secret-key-2026';

export interface TokenPayload {
  userId: string;
  username?: string;
  email?: string;
  name?: string;
  role: 'ADMIN' | 'STAFF' | 'user' | string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export { verifyJwtToken } from './jwt';

export async function getCurrentUserFromRequest(req: NextRequest) {
  // 1. Try Cookies (support both auth_token and mathviz_auth_token)
  let token = req.cookies.get('auth_token')?.value || req.cookies.get('mathviz_auth_token')?.value;

  // 2. Try Authorization Bearer Header
  if (!token) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  // 3. Try Neon Postgres users table first
  try {
    const { getDb } = await import('./db');
    const sql = getDb();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.userId);
    const selectCols = sql`
      SELECT id, email, username, name, role, status, is_active, api_key, cuid, key_quota, 
             is_vip, is_trial, vip_expires_at, remaining_quota, max_quota, lifetime_quota, 
             subscription_quota, subscription_expires_at, created_at, avatar,
             COALESCE(monthly_allowance, 0) AS monthly_allowance,
             COALESCE(monthly_credits, 0) AS monthly_credits,
             next_credit_reset_at,
             plan_expires_at,
             COALESCE(lifetime_credits, 0) AS lifetime_credits
      FROM users
    `;
    const rows = isUuid
      ? await sql`
          ${selectCols}
          WHERE id = ${payload.userId}::uuid
        `
      : await sql`
          ${selectCols}
          WHERE cuid = ${payload.userId} OR username = ${payload.userId}
        `;

    if (rows && rows.length > 0) {
      let u = rows[0] as any;
      if (u.status === 'banned' || u.is_active === false) {
        return null;
      }

      // Lazy refresh chu kỳ tháng nếu cần
      try {
        const { syncUserCredits } = await import('./credits');
        const refreshed = await syncUserCredits(u.id, sql);
        if (refreshed) {
          u.monthly_allowance = refreshed.monthlyAllowance;
          u.monthly_credits = refreshed.monthlyCredits;
          u.next_credit_reset_at = refreshed.nextCreditResetAt;
          u.plan_expires_at = refreshed.planExpiresAt;
          u.lifetime_credits = refreshed.lifetimeCredits;
          u.subscription_quota = refreshed.monthlyCredits;
          u.remaining_quota = refreshed.totalAvailableCredits;
          u.is_vip = refreshed.isVip;
        }
      } catch {}

      const isAdmin = (u.role || '').toLowerCase() === 'admin' || (u.role || '').toLowerCase() === 'superadmin';
      const isPlanActive = Boolean(u.plan_expires_at && new Date(u.plan_expires_at) > new Date());
      const totalCredits = (isPlanActive ? Number(u.monthly_credits || 0) : 0) + Number(u.lifetime_credits || 0);
      const isFreeAccount = !isAdmin && !isPlanActive && Number(u.monthly_credits || 0) <= 0 && Number(u.lifetime_credits || 0) <= 0;
      const isTrial = 
        !isAdmin && 
        !Boolean(u.is_unlimited) && 
        (!u.plan_expires_at || new Date(u.plan_expires_at) <= new Date()) && 
        Number(u.monthly_allowance || 0) === 0 && 
        Boolean(u.is_trial || (Number(u.lifetime_credits || 0) > 0 && !u.has_paid));
      const isVipFinal = isAdmin || (!isFreeAccount && !isTrial && (isPlanActive || (Boolean(u.is_vip) && !u.is_trial)));

      return {
        id: u.id,
        email: u.email,
        username: u.username,
        name: u.name,
        avatar: u.avatar || '/avatars/avatar-1.svg',
        role: (u.role || 'user').toLowerCase(),
        status: u.status || 'active',
        apiKey: u.api_key,
        cuid: u.cuid,
        keyQuota: u.key_quota,
        isVip: isVipFinal,
        is_vip: isVipFinal,
        isTrial: Boolean(!isVipFinal && !isFreeAccount && isTrial),
        is_trial: Boolean(!isVipFinal && !isFreeAccount && isTrial),
        isFreeAccount,
        is_free_account: isFreeAccount,
        vipExpiresAt: (isFreeAccount || isTrial) ? null : (u.plan_expires_at || u.vip_expires_at),
        vip_expires_at: (isFreeAccount || isTrial) ? null : (u.plan_expires_at || u.vip_expires_at),
        remaining_quota: totalCredits,
        remainingQuota: totalCredits,
        max_quota: typeof u.max_quota === 'number' ? u.max_quota : totalCredits,
        maxQuota: typeof u.max_quota === 'number' ? u.max_quota : totalCredits,
        lifetime_quota: typeof u.lifetime_credits === 'number' ? u.lifetime_credits : (typeof u.lifetime_quota === 'number' ? u.lifetime_quota : 0),
        lifetimeQuota: typeof u.lifetime_credits === 'number' ? u.lifetime_credits : (typeof u.lifetime_quota === 'number' ? u.lifetime_quota : 0),
        subscription_quota: typeof u.monthly_credits === 'number' ? u.monthly_credits : (typeof u.subscription_quota === 'number' ? u.subscription_quota : 0),
        subscriptionQuota: typeof u.monthly_credits === 'number' ? u.monthly_credits : (typeof u.subscription_quota === 'number' ? u.subscription_quota : 0),
        subscription_expires_at: u.plan_expires_at || u.subscription_expires_at || null,
        subscriptionExpiresAt: u.plan_expires_at || u.subscription_expires_at || null,
        monthly_allowance: Number(u.monthly_allowance || 0),
        monthlyAllowance: Number(u.monthly_allowance || 0),
        monthly_credits: Number(u.monthly_credits || 0),
        monthlyCredits: Number(u.monthly_credits || 0),
        next_credit_reset_at: u.next_credit_reset_at || null,
        nextCreditResetAt: u.next_credit_reset_at || null,
        plan_expires_at: u.plan_expires_at || null,
        planExpiresAt: u.plan_expires_at || null,
        lifetime_credits: Number(u.lifetime_credits || 0),
        lifetimeCredits: Number(u.lifetime_credits || 0),
        total_credits: totalCredits,
        totalCredits: totalCredits,
        createdAt: u.created_at,
      };
    }
  } catch {
    // Neon query failed or table doesn't have this user, fallback to Prisma
  }

  // 4. Fallback to Prisma User (for Admin / CTV staff)
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        maxCredits: true,
        isVip: true,
        vipExpiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (user && user.isActive) {
      return {
        ...user,
        avatar: user.avatar || '/avatars/avatar-1.svg',
      };
    }
  } catch {}

  return null;
}
