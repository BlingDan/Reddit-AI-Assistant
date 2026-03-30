import { startRouter, registerHandler, registerPortHandler } from '@/background/router';
import { loadSettings, validateApiSettings } from '@/background/config';
import { streamChatCompletion, testConnection, fetchModels, sanitizeError } from '@/background/ai-client';
import { buildPostPrompt, buildCommentPrompt, getSystemPrompt } from '@/background/prompt-builder';
import { MAX_RETRIES, RETRY_DELAYS } from '@/shared/constants';
import type { BGResponse, CSRequest, PortStartMessage, PortMessage } from '@/shared/types';

async function streamWithRetry(
  settings: ReturnType<Awaited<typeof loadSettings>>,
  prompt: string,
  onToken: (token: string) => void,
  systemPrompt?: string,
): Promise<string> {
  let fullText = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      for await (const token of streamChatCompletion(settings, prompt, systemPrompt)) {
        fullText += token;
        onToken(token);
      }
      return fullText;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'RATE_LIMITED' && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
  return fullText;
}

// Port-based streaming handlers
async function handlePortSummarize(request: PortStartMessage, port: chrome.runtime.Port): Promise<void> {
  try {
    const settings = await loadSettings();
    const error = validateApiSettings(settings);
    if (error) {
      port.postMessage({ type: 'ERROR', message: error, code: 'INVALID_CONFIG' } as PortMessage);
      port.disconnect();
      return;
    }

    const isPost = request.type === 'SUMMARIZE_POST';
    const prompt = isPost
      ? buildPostPrompt(request.content, settings.postPrompt)
      : buildCommentPrompt(request.content, settings.commentPrompt);
    const systemPrompt = getSystemPrompt(isPost ? 'post' : 'comments');

    const fullText = await streamWithRetry(settings, prompt, (token) => {
      try {
        port.postMessage({ type: 'STREAM_TOKEN', token } as PortMessage);
      } catch {
        // Port may have disconnected (user navigated away)
      }
    }, systemPrompt);

    try {
      port.postMessage({ type: 'STREAM_DONE', totalTokens: fullText.length, fullText } as PortMessage);
    } catch {
      // Port already closed
    }
  } catch (err: unknown) {
    const safe = sanitizeError(err);
    try {
      port.postMessage({ type: 'ERROR', message: safe.message, code: safe.code } as PortMessage);
    } catch {
      // Port already closed
    }
  }
}

async function handleTestConnection(_request: CSRequest, sendResponse: (r: BGResponse) => void): Promise<void> {
  try {
    const settings = await loadSettings();
    const error = validateApiSettings(settings);
    if (error) {
      sendResponse({ type: 'ERROR', message: error, code: 'INVALID_CONFIG' });
      return;
    }

    const ok = await testConnection(settings);
    sendResponse(ok
      ? { type: 'STREAM_DONE', totalTokens: 0 }
      : { type: 'ERROR', message: 'Connection test failed', code: 'CONNECTION_FAILED' },
    );
  } catch (err: unknown) {
    const safe = sanitizeError(err);
    sendResponse({ type: 'ERROR', message: safe.message, code: safe.code });
  }
}

async function handleFetchModels(_request: CSRequest, sendResponse: (r: BGResponse) => void): Promise<void> {
  try {
    const settings = await loadSettings();
    const error = validateApiSettings(settings);
    if (error) {
      sendResponse({ type: 'ERROR', message: error, code: 'INVALID_CONFIG' });
      return;
    }

    const models = await fetchModels(settings);
    sendResponse({ type: 'FETCH_MODELS_RESULT', models } as BGResponse & { models: string[] });
  } catch (err: unknown) {
    const safe = sanitizeError(err);
    sendResponse({ type: 'ERROR', message: safe.message, code: safe.code });
  }
}

export default defineBackground(() => {
  registerHandler('TEST_CONNECTION', handleTestConnection);
  registerHandler('FETCH_MODELS', handleFetchModels);

  // Port-based streaming handlers
  registerPortHandler('SUMMARIZE_POST', handlePortSummarize);
  registerPortHandler('SUMMARIZE_COMMENTS', handlePortSummarize);

  startRouter();
});
