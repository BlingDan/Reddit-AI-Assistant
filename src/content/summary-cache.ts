/**
 * Summary cache with LRU eviction.
 * Stores AI summaries keyed by Reddit post ID in chrome.storage.local.
 */

const CACHE_KEY = 'raa-summary-cache';
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry {
  summary: string;
  tokens: number;
  timestamp: number;
}

interface CacheStore {
  entries: Record<string, CacheEntry>;
  order: string[];
}

function getStoreKey(postId: string, type: string): string {
  return `${postId}:${type}`;
}

async function loadCache(): Promise<CacheStore> {
  const result = await chrome.storage.local.get(CACHE_KEY);
  return (result[CACHE_KEY] as CacheStore) || { entries: {}, order: [] };
}

async function saveCache(store: CacheStore): Promise<void> {
  await chrome.storage.local.set({ [CACHE_KEY]: store });
}

/** Get Reddit post ID from current URL */
export function getPostIdFromUrl(): string | null {
  const match = location.pathname.match(/\/comments\/([a-z0-9]+)/);
  return match ? match[1] : null;
}

export async function getCachedSummary(
  postId: string,
  type: 'post' | 'comments',
): Promise<{ summary: string; tokens: number } | null> {
  const store = await loadCache();
  const key = getStoreKey(postId, type);
  const entry = store.entries[key];
  if (!entry) return null;

  // Move to end of LRU
  store.order = store.order.filter(k => k !== key);
  store.order.push(key);
  await saveCache(store);

  return { summary: entry.summary, tokens: entry.tokens };
}

export async function setCachedSummary(
  postId: string,
  type: 'post' | 'comments',
  summary: string,
  tokens: number,
): Promise<void> {
  const store = await loadCache();
  const key = getStoreKey(postId, type);

  if (store.entries[key]) {
    store.order = store.order.filter(k => k !== key);
  }

  store.entries[key] = { summary, tokens, timestamp: Date.now() };
  store.order.push(key);

  // Evict oldest entries over limit
  while (store.order.length > MAX_CACHE_ENTRIES) {
    const oldest = store.order.shift()!;
    delete store.entries[oldest];
  }

  await saveCache(store);
}
