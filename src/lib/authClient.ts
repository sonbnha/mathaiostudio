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
 * Trích xuất map cookie từ document.cookie
 */
function parseCookies(): Record<string, string> {
  const map: Record<string, string> = {};
  if (typeof document === 'undefined' || !document.cookie) return map;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [rawKey, rawVal] = part.split('=');
    if (rawKey) {
      const key = rawKey.trim();
      const val = rawVal ? decodeURIComponent(rawVal.trim()) : '';
      if (val && val !== '""' && val !== "''" && val !== 'deleted') {
        map[key] = val;
      }
    }
  }
  return map;
}

/**
 * Kiểm tra nhanh sự tồn tại của auth token / session cookie một cách đồng bộ
 * mà không cần đợi request mạng từ useEffect.
 */
export function checkHasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Nếu vừa trigger logout trong phiên này -> Tuyệt đối không nhận token ngầm
    if (sessionStorage.getItem('mathaio_just_logged_out') === '1') {
      return false;
    }

    const cookies = parseCookies();
    const hasCookie = Boolean(
      cookies['auth_token'] ||
      cookies['has_token'] ||
      cookies['auth_token_client'] ||
      cookies['mathviz_auth_token'] ||
      cookies['session'] ||
      cookies['token'] ||
      cookies['mathaio_token']
    );

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
    // Xóa cờ vừa đăng xuất
    sessionStorage.removeItem('mathaio_just_logged_out');

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
    // 1. Đặt cờ vừa đăng xuất trong sessionStorage để chặn ngay lập tức mọi auto-refetch
    sessionStorage.setItem('mathaio_just_logged_out', '1');

    // 2. Xóa sạch LocalStorage liên quan đến phiên làm việc
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mathaio_cached_user');
    localStorage.removeItem('mathviz_license_key');
    localStorage.removeItem('mathviz_customer_name');
    localStorage.removeItem('user_collection');
    localStorage.removeItem('saved_math_models');
    localStorage.removeItem('mathviz_history_items');

    // 3. Xoá cookies ở nhiều biến thể path và domain
    const cookieNames = [
      'auth_token',
      'has_token',
      'auth_token_client',
      'mathviz_auth_token',
      'session',
      'token',
      'mathaio_token',
    ];

    const host = window.location.hostname;
    for (const name of cookieNames) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax; Secure`;
      document.cookie = `${name}=; path=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
      if (host) {
        document.cookie = `${name}=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
        document.cookie = `${name}=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
      }
    }
  } catch (err) {
    console.warn('Lỗi xóa client auth tokens:', err);
  }
}

/**
 * Thực hiện quy trình đăng xuất hoàn chỉnh và dứt khoát:
 * 1. Gọi API server /api/auth/logout để huỷ cookie httpOnly
 * 2. Xóa sạch LocalStorage, SessionStorage và Client Cookies
 * 3. Bắn event user=null
 * 4. Reset query cache nếu có
 * 5. Điều hướng dứt khoát bằng window.location.href (Hard Refresh)
 */
export async function performClientLogout(redirectTo: string = '/login'): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Đặt flag ngay lập tức
  try {
    sessionStorage.setItem('mathaio_just_logged_out', '1');
  } catch {}

  // 2. Gọi API logout phía server
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e) {
    console.warn('Lỗi gọi API logout:', e);
  }

  // 3. Xoá sạch client tokens & cache
  clearClientAuthTokens();

  // 4. Bắn event thông báo trạng thái null
  try {
    window.dispatchEvent(new CustomEvent('auth-updated', { detail: { user: null } }));
    window.dispatchEvent(new CustomEvent('user-updated', { detail: null }));
  } catch {}

  // 5. Reset toàn bộ cache truy vấn nếu có (TanStack Query / SWR)
  try {
    const w = window as any;
    if (w.__REACT_QUERY_CLIENT__) {
      w.__REACT_QUERY_CLIENT__.clear();
      w.__REACT_QUERY_CLIENT__.setQueryData(['currentUser'], null);
    }
    if (typeof w.mutate === 'function') {
      w.mutate(() => true, undefined, { revalidate: false });
    }
  } catch {}

  // 6. Xoá sạch toàn bộ sessionStorage trước khi redirect (giữ lại flag logout)
  try {
    sessionStorage.clear();
    sessionStorage.setItem('mathaio_just_logged_out', '1');
  } catch {}

  // 7. Điều hướng dứt khoát và làm mới toàn bộ trang
  window.location.href = redirectTo;
}
