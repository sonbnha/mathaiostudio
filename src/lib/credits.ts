import { getDb } from './db';

export interface UserCreditsState {
  id: string;
  role: string;
  monthlyAllowance: number;
  monthly_allowance?: number;
  monthlyCredits: number;
  monthly_credits?: number;
  nextCreditResetAt: Date | null;
  next_credit_reset_at?: Date | null;
  planExpiresAt: Date | null;
  plan_expires_at?: Date | null;
  lifetimeCredits: number;
  lifetime_credits?: number;
  totalAvailableCredits: number;
  isPlanActive: boolean;
}

/**
 * Helper tự động đồng bộ chu kỳ tháng (Lazy Refresh)
 * - Nếu plan_expires_at > NOW() và next_credit_reset_at <= NOW():
 *     Làm mới monthly_credits = monthly_allowance
 *     Cập nhật next_credit_reset_at = NOW() + INTERVAL '30 days'
 * - Nếu plan_expires_at <= NOW() và plan_expires_at IS NOT NULL:
 *     Gói hết hạn: monthly_credits = 0, monthly_allowance = 0, plan_expires_at = null, next_credit_reset_at = null
 */
export async function syncUserCredits(userId: string, sqlClient?: any): Promise<UserCreditsState | null> {
  const sql = sqlClient || getDb();
  const now = new Date();

  const userRows = await sql`
    SELECT 
      id, 
      role, 
      is_vip,
      COALESCE(monthly_allowance, 0) AS monthly_allowance,
      COALESCE(monthly_credits, 0) AS monthly_credits,
      next_credit_reset_at,
      plan_expires_at,
      COALESCE(lifetime_credits, 0) AS lifetime_credits,
      COALESCE(remaining_quota, 0) AS remaining_quota,
      COALESCE(subscription_quota, 0) AS subscription_quota,
      subscription_expires_at
    FROM users
    WHERE id = ${userId}::uuid
    LIMIT 1;
  `;

  if (!userRows || userRows.length === 0) return null;

  const u = userRows[0];
  let monthlyAllowance = Number(u.monthly_allowance || 0);
  let monthlyCredits = Number(u.monthly_credits || 0);
  let nextCreditResetAt = u.next_credit_reset_at ? new Date(u.next_credit_reset_at) : null;
  let planExpiresAt = u.plan_expires_at ? new Date(u.plan_expires_at) : (u.subscription_expires_at ? new Date(u.subscription_expires_at) : null);
  let lifetimeCredits = Number(u.lifetime_credits || 0);

  let needUpdate = false;

  // 1. Kiểm tra gói thuê bao đã hết hạn chưa
  if (planExpiresAt && planExpiresAt <= now) {
    // Gói đã hết hạn
    monthlyCredits = 0;
    monthlyAllowance = 0;
    planExpiresAt = null;
    nextCreditResetAt = null;
    needUpdate = true;
  } 
  // 2. Nếu gói còn hạn và đã đến thời điểm reset chu kỳ 30 ngày
  else if (planExpiresAt && planExpiresAt > now) {
    if (!nextCreditResetAt || nextCreditResetAt <= now) {
      // Làm mới về định mức chuẩn
      monthlyCredits = monthlyAllowance;
      // Chu kỳ tiếp theo là 30 ngày kể từ hiện tại (hoặc ngày hết hạn gói nếu gần hơn)
      const nextReset = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      nextCreditResetAt = nextReset > planExpiresAt ? planExpiresAt : nextReset;
      needUpdate = true;
    }
  }

  const isPlanActive = Boolean(planExpiresAt && planExpiresAt > now);
  const totalAvailableCredits = (isPlanActive ? monthlyCredits : 0) + lifetimeCredits;

  if (needUpdate) {
    try {
      await sql`
        UPDATE users
        SET 
          monthly_allowance = ${monthlyAllowance},
          monthly_credits = ${monthlyCredits},
          next_credit_reset_at = ${nextCreditResetAt},
          plan_expires_at = ${planExpiresAt},
          subscription_quota = ${monthlyCredits},
          subscription_expires_at = ${planExpiresAt},
          remaining_quota = ${totalAvailableCredits},
          is_vip = ${isPlanActive || lifetimeCredits > 0}
        WHERE id = ${userId}::uuid;
      `;
    } catch (updateErr) {
      console.warn('[Credits] Lỗi cập nhật syncUserCredits:', updateErr);
    }
  }

  return {
    id: u.id,
    role: (u.role || 'user').toLowerCase(),
    monthlyAllowance,
    monthly_allowance: monthlyAllowance,
    monthlyCredits,
    monthly_credits: monthlyCredits,
    nextCreditResetAt,
    next_credit_reset_at: nextCreditResetAt,
    planExpiresAt,
    plan_expires_at: planExpiresAt,
    lifetimeCredits,
    lifetime_credits: lifetimeCredits,
    totalAvailableCredits,
    isPlanActive,
  };
}

/**
 * Logic Khấu Trừ Khi Tạo Hình / Soạn Giáo Án (Tiêu hao 1 Credit/lần):
 * - Bước 1: Gọi syncUserCredits
 * - Bước 2: Kiểm tra nếu là admin -> Miễn phí không trừ
 * - Bước 3: Nếu monthly_credits >= 1 -> Trừ monthly_credits -= 1
 * - Bước 4: Nếu monthly_credits == 0 và lifetime_credits >= 1 -> Trừ lifetime_credits -= 1
 * - Bước 5: Cả 2 ví đều bằng 0 -> Chặn, trả về success: false
 */
export async function deductUserCredit(
  userId: string, 
  sqlClient?: any,
  options?: { apiKey?: string; actionName?: string }
): Promise<{
  success: boolean;
  walletDeducted?: 'monthly' | 'lifetime' | 'unlimited';
  monthlyCredits?: number;
  monthlyAllowance?: number;
  lifetimeCredits?: number;
  totalCredits?: number;
  error?: string;
}> {
  const sql = sqlClient || getDb();
  
  // 1. Đồng bộ chu kỳ trước khi trừ
  const state = await syncUserCredits(userId, sql);
  if (!state) {
    return { success: false, error: 'Không tìm thấy thông tin người dùng.' };
  }

  // Admin hoặc tài khoản CTV không bị trừ credit
  if (state.role === 'admin') {
    return {
      success: true,
      walletDeducted: 'unlimited',
      monthlyCredits: 999999,
      monthlyAllowance: 999999,
      lifetimeCredits: 999999,
      totalCredits: -1,
    };
  }

  // Tài khoản có gói thuê bao Unlimited còn hiệu lực (monthlyCredits === -1 hoặc monthlyAllowance === -1)
  if (state.isPlanActive && (state.monthlyCredits === -1 || state.monthlyAllowance === -1)) {
    return {
      success: true,
      walletDeducted: 'unlimited',
      monthlyCredits: -1,
      monthlyAllowance: -1,
      lifetimeCredits: state.lifetimeCredits,
      totalCredits: -1,
    };
  }

  // Tài khoản sở hữu ví trọn đời Unlimited (lifetimeCredits === -1)
  if (state.lifetimeCredits === -1) {
    return {
      success: true,
      walletDeducted: 'unlimited',
      monthlyCredits: state.monthlyCredits,
      monthlyAllowance: state.monthlyAllowance,
      lifetimeCredits: -1,
      totalCredits: -1,
    };
  }

  let newMonthly = state.monthlyCredits;
  let newLifetime = state.lifetimeCredits;
  let walletDeducted: 'monthly' | 'lifetime' | undefined;

  // Bước 2: Ưu tiên trừ Monthly Credits
  if (state.isPlanActive && state.monthlyCredits >= 1) {
    newMonthly = state.monthlyCredits - 1;
    walletDeducted = 'monthly';
  } 
  // Bước 3: Nếu monthly = 0, trừ sang Lifetime Credits
  else if (state.lifetimeCredits >= 1) {
    newLifetime = state.lifetimeCredits - 1;
    walletDeducted = 'lifetime';
  } 
  // Bước 4: Cả 2 ví đều bằng 0
  else {
    return {
      success: false,
      error: 'Tài khoản của bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.',
    };
  }

  const totalAvailable = (state.isPlanActive ? newMonthly : 0) + newLifetime;

  // Cập nhật database Neon
  await sql`
    UPDATE users
    SET 
      monthly_credits = ${newMonthly},
      lifetime_credits = ${newLifetime},
      remaining_quota = ${totalAvailable},
      subscription_quota = ${newMonthly},
      lifetime_quota = ${newLifetime}
    WHERE id = ${userId}::uuid;
  `;

  // Cập nhật used_credits của License Key nếu có truyền apiKey
  if (options?.apiKey) {
    try {
      const cleanKey = options.apiKey.trim().toUpperCase();
      await sql`
        UPDATE license_keys
        SET used_credits = used_credits + 1
        WHERE (UPPER(key) = ${cleanKey} OR UPPER(key_code) = ${cleanKey})
          AND (total_credits = -1 OR used_credits < total_credits);
      `;
    } catch {}
  }

  return {
    success: true,
    walletDeducted,
    monthlyCredits: newMonthly,
    monthlyAllowance: state.monthlyAllowance,
    lifetimeCredits: newLifetime,
    totalCredits: totalAvailable,
  };
}
