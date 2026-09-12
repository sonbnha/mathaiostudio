export interface ProjectSnapshot {
  id: string;
  timestamp: number;
  dateFormatted: string;
  groupDate: string;
  author: string;
  files: Record<string, string>;
  label?: string;
}

const MAX_SNAPSHOTS = 20;
const STORAGE_PREFIX = 'project_history_';

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const time = formatTime(timestamp);
  return `${day}/${month}/${year}, ${time}`;
}

export function getGroupDate(timestamp: number): string {
  const now = new Date();
  const d = new Date(timestamp);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;

  if (timestamp >= startOfToday) {
    return 'Hôm nay';
  } else if (timestamp >= startOfYesterday) {
    return 'Hôm qua';
  } else {
    return `${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  }
}

export function getProjectSnapshots(projectId: string): ProjectSnapshot[] {
  if (typeof window === 'undefined' || !projectId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Lỗi khi đọc snapshot history:', err);
  }
  return [];
}

export function saveProjectSnapshots(projectId: string, snapshots: ProjectSnapshot[]): void {
  if (typeof window === 'undefined' || !projectId) return;
  try {
    const trimmed = snapshots.slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Lỗi khi lưu snapshot history:', err);
  }
}

export function createSnapshot(
  projectId: string,
  files: Record<string, string>,
  author: string = 'Bạn',
  label?: string
): ProjectSnapshot {
  const timestamp = Date.now();
  const id = `snap-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
  const dateFormatted = formatDateTime(timestamp);
  const groupDate = getGroupDate(timestamp);

  const newSnapshot: ProjectSnapshot = {
    id,
    timestamp,
    dateFormatted,
    groupDate,
    author: author || 'Bạn',
    files: { ...files },
    label,
  };

  const current = getProjectSnapshots(projectId);
  // Prepend new snapshot
  const updated = [newSnapshot, ...current];
  saveProjectSnapshots(projectId, updated);
  return newSnapshot;
}

export function updateSnapshotLabel(
  projectId: string,
  snapshotId: string,
  label: string
): ProjectSnapshot[] {
  const current = getProjectSnapshots(projectId);
  const updated = current.map((s) => (s.id === snapshotId ? { ...s, label } : s));
  saveProjectSnapshots(projectId, updated);
  return updated;
}

export function deleteSnapshot(
  projectId: string,
  snapshotId: string
): ProjectSnapshot[] {
  const current = getProjectSnapshots(projectId);
  const updated = current.filter((s) => s.id !== snapshotId);
  saveProjectSnapshots(projectId, updated);
  return updated;
}
