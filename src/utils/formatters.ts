/**
 * Helper định dạng chuẩn hóa UI Terminology & Symbols cho MathAIO Studio
 * - Tài nguyên/Định mức số lượng: Dùng ký hiệu vô cực '∞'
 * - Thời gian hiệu lực/Hạn dùng: Dùng chữ 'Trọn đời'
 */

// Định dạng tài nguyên/hạn mức số lượng (Credits, Quota, Lượt dùng)
export const formatQuota = (quota: number | string | null | undefined): string => {
  if (
    quota === -1 ||
    quota === '-1' ||
    quota === 'unlimited' ||
    quota === 'infinity' ||
    quota === '∞' ||
    quota === '∞ Vô hạn' ||
    quota === 'Vô hạn (∞)' ||
    quota === 'Vô hạn'
  ) {
    return '∞';
  }
  return String(quota ?? 0);
};

// Định dạng kèm đơn vị Ω
export const formatQuotaOmega = (quota: number | string | null | undefined): string => {
  const q = formatQuota(quota);
  return `${q} Ω`;
};

// Định dạng thời gian hiệu lực/hạn dùng (Time, Expiration, Validity)
export const formatExpiration = (date: string | null | undefined): string => {
  if (
    !date ||
    date === 'unlimited' ||
    date === 'lifetime' ||
    date === 'forever' ||
    date === 'Vô hạn' ||
    date === 'Trọn đời'
  ) {
    return 'Trọn đời';
  }
  return date;
};
