export interface PresetAvatar {
  id: string;
  path: string;
  name: string;
  description: string;
  themeColor: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'avatar-1',
    path: '/avatars/avatar-1.svg',
    name: 'Compa & Thước Eke',
    description: 'Hình học cổ điển & Thước kẻ',
    themeColor: '#0284c7',
  },
  {
    id: 'avatar-2',
    path: '/avatars/avatar-2.svg',
    name: 'Khối Lập Phương 3D',
    description: 'Hình không gian & Tọa độ Oxyz',
    themeColor: '#4f46e5',
  },
  {
    id: 'avatar-3',
    path: '/avatars/avatar-3.svg',
    name: 'Kính Tri Thức & Sách',
    description: 'Giáo viên & Nhà nghiên cứu Toán',
    themeColor: '#059669',
  },
  {
    id: 'avatar-4',
    path: '/avatars/avatar-4.svg',
    name: 'Ký Hiệu Sigma & Pi',
    description: 'Đại số, Tích phân & Lượng giác',
    themeColor: '#f59e0b',
  },
  {
    id: 'avatar-5',
    path: '/avatars/avatar-5.svg',
    name: 'Hình Cầu Không Gian',
    description: 'Khối cầu & Mô hình vũ trụ',
    themeColor: '#e11d48',
  },
  {
    id: 'avatar-6',
    path: '/avatars/avatar-6.svg',
    name: 'Trợ Lý AI Toán Học',
    description: 'Trí tuệ nhân tạo MathAIO',
    themeColor: '#9333ea',
  },
];

export const DEFAULT_AVATAR = '/avatars/avatar-1.svg';

export function isValidAvatar(path?: string | null): boolean {
  if (!path) return false;
  return PRESET_AVATARS.some((a) => a.path === path);
}

export function sanitizeAvatar(path?: string | null): string {
  if (isValidAvatar(path)) {
    return path!;
  }
  return DEFAULT_AVATAR;
}
