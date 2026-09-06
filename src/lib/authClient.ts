/**
 * MathAIO Client-side Auth Utilities
 * Hỗ trợ kiểm tra đồng bộ phiên đăng nhập (Sync Pre-check) để triệt tiêu 100% độ trễ (0ms)
 * cho khách vãng lai và người dùng đã có phiên.
 */

export interface InitialAuthState<T = any> {
  user: T | null;
  hasToken: boolean;
  isLoading: boolean;
}

/**
 * Kiểm tra nhanh sự tồn tại của auth token / session cookie một cách đồng bộ
 * mà không cần đợi request mạng từ useEffect.
 */
export function checkHasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const cookie = document.cookie || '';
    const hasCookie =
      cookie.includes('auth_token=') ||
      cookie.includes('has_token=') ||
      cookie.includes('auth_token_client=') ||
      cookie.includes('mathviz_auth_token=');

    const hasLocalStorage =
      Boolean(localStorage.getItem('token')) ||
      Boolean(localStorage.getItem('auth_token')) ||
      Boolean(localStorage.getItem('mathaio_cached_user'));

    return Boolean(hasCookie || hasLocalStorage);
  } catch {
    return false;
  }
}

/**
 * Lấy trạng thái xác thực ban đầu (Synchronous Pre-check)
 */
export function getInitialAuthState<T = any>(): InitialAuthState<T> {
  if (typeof window === 'undefined') {
    return { user: null, hasToken: false, isLoading: true };
  }

  // 1. Kiểm tra nhanh sự tồn tại của auth token / session cookie
  const hasToken = checkHasAuthToken();

  // 2. Nếu không có token -> Chắc chắn là Guest -> Tắt loading ngay lập tức (0ms delay)
  if (!hasToken) {
    return {
      user: null,
      hasToken: false,
      isLoading: false,
    };
  }

  // 3. Nếu có token: Thử lấy profile đã cache trong localStorage
  let user: T | null = null;
  try {
    const cached = localStorage.getItem('mathaio_cached_user');
    if (cached) {
      user = JSON.parse(cached);
    }
  } catch {}

  return {
    user,
    hasToken: true,
    // Chỉ loading nếu CÓ token cần mang đi verify và chưa có cached profile
    isLoading: !user,
  };
}

/**
 * Lưu trữ token và cookie phía client khi đăng nhập/đăng ký thành công
 */
export function setClientAuthTokens(token?: string, user?: any) {
  if (typeof window === 'undefined') return;

  try {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('auth_token', token);
    }
    if (user) {
      localStorage.setItem('mathaio_cached_user', JSON.stringify(user));
    }

    // Thiết lập cookie client-readable để checkHasAuthToken() phát hiện đồng bộ ngay frame đầu tiên
    const maxAge = 7 * 24 * 60 * 60; // 7 ngày
    document.cookie = `auth_token=true; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `has_token=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch (err) {
    console.warn('Lỗi ghi client auth tokens:', err);
  }
}

/**
 * Xóa sạch toàn bộ token, cache và cookie xác thực khi đăng xuất hoặc token hết hạn (401)
 */
export function clearClientAuthTokens() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mathaio_cached_user');

    // Xóa cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'has_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'auth_token_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'mathviz_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch (err) {
    console.warn('Lỗi xóa client auth tokens:', err);
  }
}
