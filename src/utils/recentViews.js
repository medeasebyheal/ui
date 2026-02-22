const STORAGE_KEY = 'medease_recent_views';
const MAX_ITEMS = 6;

export function getRecentViews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function recordRecentView(item) {
  try {
    const list = getRecentViews();
    const filtered = list.filter((x) => !(x.type === item.type && x.id === item.id));
    const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
