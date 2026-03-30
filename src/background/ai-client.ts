import type { Settings } from '@/shared/types';

export async function* streamChatCompletion(
  settings: Settings,
  prompt: string,
  systemPrompt?: string,
): AsyncGenerator<string> {
  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (response.status === 429) {
      throw new RateLimitError(response.headers.get('retry-after'));
    }
    // Provide user-friendly messages for common errors
    const userMessage = interpretApiError(response.status, body);
    throw new ApiError(userMessage, 'API_ERROR');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError('No response body', 'NO_BODY');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function testConnection(settings: Settings): Promise<boolean> {
  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1,
    }),
  });
  return response.ok;
}

export async function fetchModels(settings: Settings): Promise<string[]> {
  try {
    const url = new URL(settings.endpoint);
    // Derive models URL: strip /chat/completions suffix, append /models
    url.pathname = url.pathname.replace(/\/chat\/completions\/?$/, '') + '/models';

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${settings.apiKey}` },
    });

    if (!response.ok) {
      throw new ApiError(`Failed to fetch models: ${response.status}`, 'API_ERROR');
    }

    const data = await response.json();
    // OpenAI format: { data: [{ id: "gpt-4", ... }] }
    if (Array.isArray(data.data)) {
      return data.data.map((m: { id: string }) => m.id).filter(Boolean).sort();
    }
    // Some providers return a flat array
    if (Array.isArray(data)) {
      return data.map((m: { id: string } | string) => (typeof m === 'string' ? m : m.id)).filter(Boolean).sort();
    }
    return [];
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Failed to fetch models: ${err instanceof Error ? err.message : 'Unknown error'}`, 'API_ERROR');
  }
}

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/** Interpret API error status codes into user-friendly messages */
function interpretApiError(status: number, _body: string): string {
  switch (status) {
    case 401:
      return 'Invalid API key. Please check your API key in settings.';
    case 403:
      return 'Access forbidden. Your API key may not have permission for this model.';
    case 404:
      return 'Endpoint not found. Please check your API endpoint URL.';
    case 429:
      return 'Rate limit reached. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'API server error. The service may be temporarily unavailable.';
    default:
      return `API error (${status}). Please check your settings and try again.`;
  }
}

export class RateLimitError extends ApiError {
  retryAfter: number | null;
  constructor(retryAfter: string | null) {
    super('API rate limit reached', 'RATE_LIMITED');
    this.retryAfter = retryAfter ? parseInt(retryAfter, 10) : null;
  }
}
