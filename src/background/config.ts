import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Settings } from '@/shared/types';

const STORAGE_KEY = 'reddit-ai-settings';

export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  if (!result[STORAGE_KEY]) {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] } as Settings;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await loadSettings();
  const merged = { ...current, ...settings };
  await chrome.storage.local.set({ [STORAGE_KEY]: merged });
}

export function validateApiSettings(settings: Pick<Settings, 'endpoint' | 'apiKey'>): string | null {
  if (!settings.endpoint.trim()) {
    return 'API endpoint is required';
  }
  try {
    const url = new URL(settings.endpoint);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return 'API endpoint must use HTTPS for security';
    }
  } catch {
    return 'Invalid API endpoint format';
  }
  if (!settings.apiKey.trim()) {
    return 'API key is required';
  }
  return null;
}
