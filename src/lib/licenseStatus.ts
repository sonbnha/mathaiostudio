export interface LicenseStatusResult {
  isVipActive: boolean;
  isNearExpiry: boolean;
  isFullyExpired: boolean;
  isExpiredOrDepleted: boolean;
  isTrial: boolean;
  daysRemaining: number | null; // null = vô hạn
  daysLeft: number;
  remainingCredits: number; // -1 = vô hạn
  remaining_quota: number | null;
  remainingQuota: number | null;
  turnsLeft: number;
  totalCredits: number; // -1 = vô hạn
  max_quota: number | null;
  maxQuota: number | null;
  usedCredits: number;
  vipExpiresAt: string | null;
  vip_expires_at: string | null;
  isAdmin: boolean;
}

export function computeLicenseStatus({
  user,
  guestKey,
  guestLicenseStatus,
}: {
  user?: any | null;
  guestKey?: string;
  guestLicenseStatus?: any | null;
}): LicenseStatusResult {
  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';

  const isUnlimited =
    isAdmin ||
    Boolean(user?.is_unlimited) ||
    Boolean(user?.isUnlimited) ||
    user?.remaining_quota === null ||
    user?.remaining_quota === -1 ||
    user?.remainingCredits === -1 ||
    user?.remaining_credits === -1 ||
    user?.max_quota === -1 ||
    user?.usageLimit === -1 ||
    user?.usage_limit === -1;

  if (isUnlimited) {
    return {
      isVipActive: true,
      isNearExpiry: false,
      isFullyExpired: false,
      isExpiredOrDepleted: false,
      isTrial: false,
      daysRemaining: null,
      daysLeft: 999,
      remainingCredits: -1,
      remaining_quota: null,
      remainingQuota: null,
      turnsLeft: 999,
      totalCredits: -1,
      max_quota: null,
      maxQuota: null,
      usedCredits: 0,
      vipExpiresAt: null,
      vip_expires_at: null,
      isAdmin: Boolean(isAdmin),
    };
  }

  const now = new Date().getTime();

  // 1. Trường hợp người dùng đã đăng nhập (currentUser)
  if (user) {
    const isVip = Boolean(user.is_vip || user.isVip);
    const rawLifetimeQuota = typeof user.lifetime_quota === 'number'
      ? user.lifetime_quota
      : (typeof user.lifetimeQuota === 'number' ? user.lifetimeQuota : 0);
    const rawSubscriptionQuota = typeof user.subscription_quota === 'number'
      ? user.subscription_quota
      : (typeof user.subscriptionQuota === 'number' ? user.subscriptionQuota : 0);
    const rawSubExpiresAt = user.subscription_expires_at || user.subscriptionExpiresAt || user.vip_expires_at || user.vipExpiresAt || null;
    const subExpireTime = rawSubExpiresAt ? new Date(rawSubExpiresAt).getTime() : null;
    const isSubActive = Boolean(subExpireTime && subExpireTime > now);

    const dualWalletTurns = (isSubActive ? rawSubscriptionQuota : 0) + rawLifetimeQuota;

    // daysLeft: số ngày còn lại (999 nếu có ví vĩnh viễn hoặc không có ngày hết hạn)
    const hasLifetimeTurns = rawLifetimeQuota > 0;
    const daysLeft = hasLifetimeTurns 
      ? 999 
      : (subExpireTime ? Math.ceil((subExpireTime - now) / (1000 * 60 * 60 * 24)) : 999);
    const daysRemaining = hasLifetimeTurns 
      ? null 
      : (subExpireTime ? Math.max(0, daysLeft) : null);

    // turnsLeft: số lượt còn lại (INT)
    const fallbackTurns = typeof user.remaining_quota === 'number'
      ? user.remaining_quota
      : typeof user.remainingQuota === 'number'
      ? user.remainingQuota
      : typeof user.remaining_credits === 'number'
      ? (user.remaining_credits === -1 ? 999 : user.remaining_credits)
      : typeof user.remainingCredits === 'number'
      ? (user.remainingCredits === -1 ? 999 : user.remainingCredits)
      : (user.usage_limit === -1 || user.usageLimit === -1 ? 999 : 0);

    const turnsLeft = (rawLifetimeQuota > 0 || rawSubscriptionQuota > 0)
      ? dualWalletTurns
      : fallbackTurns;

    const maxQuota = typeof user.max_quota === 'number'
      ? user.max_quota
      : typeof user.maxQuota === 'number'
      ? user.maxQuota
      : (typeof user.usage_limit === 'number' ? (user.usage_limit === -1 ? 999 : user.usage_limit) : 0);

    const usedCount = typeof user.usage_count === 'number'
      ? user.usage_count
      : typeof user.usageCount === 'number'
      ? user.usageCount
      : (typeof user.used_credits === 'number' ? user.used_credits : 0);

    // Chuẩn hóa theo công thức:
    const isNearExpiry = Boolean(
      (isVip || isSubActive) && !hasLifetimeTurns && ((daysLeft <= 3 && daysLeft > 0) || (turnsLeft <= 5 && turnsLeft > 0))
    );

    // isFullyExpired: chỉ hết hạn khi số lượt khả dụng turnsLeft <= 0
    const isFullyExpired = turnsLeft <= 0;
    const isVipActive = (isVip || hasLifetimeTurns || isSubActive) && turnsLeft > 0;
    const isExpiredOrDepleted = turnsLeft <= 0;
    const isTrial = Boolean(!isVip && !hasLifetimeTurns && !isSubActive && turnsLeft > 0);

    return {
      isVipActive,
      isNearExpiry,
      isFullyExpired,
      isExpiredOrDepleted,
      isTrial,
      daysRemaining,
      daysLeft,
      remainingCredits: turnsLeft === 999 ? -1 : turnsLeft,
      remaining_quota: turnsLeft,
      remainingQuota: turnsLeft,
      turnsLeft,
      totalCredits: maxQuota,
      max_quota: maxQuota,
      maxQuota: maxQuota,
      usedCredits: usedCount,
      vipExpiresAt: rawSubExpiresAt ? new Date(rawSubExpiresAt).toISOString() : null,
      vip_expires_at: rawSubExpiresAt ? new Date(rawSubExpiresAt).toISOString() : null,
      isAdmin: false,
    };
  }

  // 2. Trường hợp khách vãng lai (Guest)
  const hasGuestKey = Boolean(guestKey && guestKey.trim());
  const isValidGuest = Boolean(guestLicenseStatus?.valid && hasGuestKey);

  if (isValidGuest) {
    const expireIso = guestLicenseStatus?.expiresAt || null;
    const expireTime = expireIso ? new Date(expireIso).getTime() : null;

    const daysLeft = expireTime ? Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24)) : 999;
    const daysRemaining = expireTime ? Math.max(0, daysLeft) : null;

    const maxCredits = typeof guestLicenseStatus?.totalCredits === 'number'
      ? guestLicenseStatus.totalCredits
      : 50;

    const usedCredits = typeof guestLicenseStatus?.usedCredits === 'number'
      ? guestLicenseStatus.usedCredits
      : 0;

    const turnsLeft = typeof guestLicenseStatus?.remainingCredits === 'number'
      ? (guestLicenseStatus.remainingCredits === -1 ? 999 : guestLicenseStatus.remainingCredits)
      : (maxCredits === -1 ? 999 : Math.max(0, maxCredits - usedCredits));

    const isNearExpiry = Boolean(
      (daysLeft <= 3 && daysLeft > 0) || (turnsLeft <= 5 && turnsLeft > 0)
    );
    const isTrial = Boolean(
      guestLicenseStatus?.keyType === 'trial' ||
      guestKey?.toUpperCase().startsWith('AIO-TR-') ||
      guestKey?.toUpperCase().startsWith('MV-TR-') ||
      guestKey?.toUpperCase().includes('TRIAL')
    );
    const isVip = !isTrial;
    const isFullyExpired = Boolean(daysLeft <= 0 || turnsLeft <= 0);
    const isVipActive = Boolean(isVip && !isFullyExpired);
    const isExpiredOrDepleted = isFullyExpired;

    return {
      isVipActive,
      isNearExpiry,
      isFullyExpired,
      isExpiredOrDepleted,
      isTrial,
      daysRemaining,
      daysLeft,
      remainingCredits: turnsLeft === 999 ? -1 : turnsLeft,
      remaining_quota: turnsLeft,
      remainingQuota: turnsLeft,
      turnsLeft,
      totalCredits: maxCredits,
      max_quota: maxCredits === -1 ? 999 : maxCredits,
      maxQuota: maxCredits === -1 ? 999 : maxCredits,
      usedCredits,
      vipExpiresAt: expireIso ? new Date(expireIso).toISOString() : null,
      vip_expires_at: expireIso ? new Date(expireIso).toISOString() : null,
      isAdmin: false,
    };
  }

  // Khách vãng lai chưa có key
  return {
    isVipActive: false,
    isNearExpiry: false,
    isFullyExpired: true,
    isExpiredOrDepleted: true,
    isTrial: false,
    daysRemaining: 0,
    daysLeft: 0,
    remainingCredits: 0,
    remaining_quota: 0,
    remainingQuota: 0,
    turnsLeft: 0,
    totalCredits: 0,
    max_quota: 0,
    maxQuota: 0,
    usedCredits: 0,
    vipExpiresAt: null,
    vip_expires_at: null,
    isAdmin: false,
  };
}
