import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { SUMMARY_COLORS } from '@/shared/constants';
import { getFullPostContent, getCommentsContent, findActionBar } from './dom-adapter';
import { getPostIdFromUrl, getCachedSummary, setCachedSummary } from './summary-cache';

let panelContainer: HTMLElement | null = null;
let injected = false;
let lastUrl = '';
let currentFullText = '';

function createStyleSheet(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
    .raa-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: var(--border-radius-md, 4px);
      font-size: var(--font-12, 12px);
      font-weight: 600;
      cursor: pointer;
      border: var(--border-md, 1px solid transparent);
      background: transparent;
      color: var(--color-neutral-content-weak, #576F76);
      transition: background 0.15s, color 0.15s;
      line-height: var(--font-button-sm, 12px/16px);
      height: var(--size-button-sm-h, 32px);
      font-family: inherit;
      white-space: nowrap;
    }
    .raa-btn:hover {
      background: var(--color-neutral-background-hover, rgba(0,0,0,0.04));
      color: var(--color-neutral-content-strong, #0F1A1C);
    }
    .raa-btn--post svg, .raa-btn--comments svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .raa-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .raa-buttons {
      justify-content: flex-start;
      text-align: left;
      width: 100%;
    }
    .raa-panel {
      margin: 4px 0 0 0;
      border-radius: 8px;
      overflow: hidden;
      font-size: 14px;
      line-height: 1.6;
      width: 100%;
    }
    .raa-panel__header {
      padding: 8px 16px;
      font-weight: 700;
      font-size: 13px;
    }
    .raa-panel__body {
      padding: 16px;
      font-size: 14px;
      line-height: 1.7;
    }
    .raa-panel__body p { margin: 0 0 8px 0; }
    .raa-panel__body p:last-child { margin-bottom: 0; }
    .raa-panel__body ul, .raa-panel__body ol { margin: 4px 0 8px 20px; }
    .raa-panel__body li { margin: 2px 0; }
    .raa-panel__body strong { font-weight: 700; }
    .raa-panel__body em { font-style: italic; }
    .raa-panel__body h1, .raa-panel__body h2, .raa-panel__body h3 {
      font-weight: 700; margin: 12px 0 4px;
    }
    .raa-panel__body h1 { font-size: 16px; }
    .raa-panel__body h2 { font-size: 15px; }
    .raa-panel__body h3 { font-size: 14px; }
    .raa-panel__body code {
      background: rgba(0,0,0,0.06);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 13px;
    }
    .raa-panel__body pre {
      background: rgba(0,0,0,0.06);
      padding: 8px 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 8px 0;
    }
    .raa-panel__body pre code { background: none; padding: 0; }
    .raa-panel__body blockquote {
      border-left: 3px solid rgba(0,0,0,0.15);
      margin: 8px 0;
      padding-left: 12px;
      color: #4b5563;
    }
    .raa-panel__body hr {
      border: none;
      border-top: 1px solid rgba(0,0,0,0.1);
      margin: 8px 0;
    }
    .raa-panel__body a { color: #6366f1; text-decoration: underline; }
    .raa-panel__footer {
      padding: 6px 16px;
      font-size: 11px;
      opacity: 0.6;
      border-top: 1px solid rgba(0,0,0,0.08);
    }
    .raa-panel__error {
      padding: 12px 16px;
      color: #dc2626;
      font-size: 13px;
    }
    .raa-panel__retry {
      margin-top: 8px;
      padding: 4px 12px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .raa-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(99,102,241,0.3);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: raa-spin 0.6s linear infinite;
      vertical-align: middle;
      margin-left: 6px;
    }
    @keyframes raa-spin {
      to { transform: rotate(360deg); }
    }
    /* Dark mode overrides */
    .raa-dark .raa-panel {
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
    .raa-dark .raa-panel__body { color: #e2e8f0; }
    .raa-dark .raa-panel__body code { background: rgba(255,255,255,0.1); }
    .raa-dark .raa-panel__body pre { background: rgba(255,255,255,0.08); }
    .raa-dark .raa-panel__body blockquote { border-left-color: rgba(255,255,255,0.2); color: #94a3b8; }
    .raa-dark .raa-panel__body hr { border-top-color: rgba(255,255,255,0.15); }
    .raa-dark .raa-panel__body a { color: #818cf8; }
    .raa-dark .raa-panel__footer { border-top-color: rgba(255,255,255,0.1); color: #94a3b8; }
    .raa-dark .raa-panel__error { color: #fca5a5; }
    .raa-dark .raa-panel__retry { background: #dc2626; color: #fff; }
    .raa-dark .raa-btn { color: var(--color-neutral-content-weak, #8cb3c2); }
    .raa-dark .raa-btn:hover { background: var(--color-neutral-background-hover, rgba(255,255,255,0.08)); color: var(--color-neutral-content-strong, #e2e8f0); }
    .raa-dark .raa-streaming-text { color: #e2e8f0; }
    .raa-shimmer {
      background: linear-gradient(90deg, transparent 25%, rgba(99,102,241,0.15) 50%, transparent 75%);
      background-size: 200% 100%;
      animation: raa-shimmer 1.5s ease-in-out infinite;
      min-height: 60px;
      border-radius: 4px;
    }
    .raa-dark .raa-shimmer {
      background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%);
      background-size: 200% 100%;
    }
    @keyframes raa-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .raa-onboarding {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; margin: 4px 0;
      border-radius: 8px;
      background: linear-gradient(135deg, #eef2ff, #e0e7ff);
      border: 1px solid #c7d2fe;
      font-size: 14px; color: #3730a3;
    }
    .raa-dark .raa-onboarding {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      border-color: #4338ca; color: #c7d2fe;
    }
    .raa-onboarding__text { flex: 1; }
    .raa-onboarding__text strong { font-weight: 700; }
    .raa-onboarding__text p { margin: 2px 0 0; font-size: 12px; opacity: 0.8; }
    .raa-onboarding__btn {
      padding: 6px 16px; background: #6366f1; color: white;
      border: none; border-radius: 6px; cursor: pointer;
      font-size: 13px; font-weight: 600; white-space: nowrap;
    }
    .raa-onboarding__btn:hover { opacity: 0.9; }
    .raa-panel__header { cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between; }
    .raa-panel__collapse-icon { font-size: 11px; transition: transform 0.2s; }
    .raa-panel--collapsed .raa-panel__body, .raa-panel--collapsed .raa-panel__footer { display: none; }
    .raa-panel--collapsed .raa-panel__collapse-icon { transform: rotate(-90deg); }
  `;
  return style;
}

/** Clean up any previously injected UI */
function cleanup(): void {
  document.getElementById('raa-injection-point')?.remove();
  document.getElementById('raa-onboarding')?.remove();
  document.querySelector('.raa-styles')?.remove();
  panelContainer = null;
  injected = false;
}

function tryInject(): boolean {
  if (injected) return true;

  // Only inject on post detail pages: /r/{subreddit}/comments/{post_id}/...
  if (!isPostDetailPage()) {
    return false;
  }

  const actionBar = findActionBar();
  if (!actionBar) {
    console.log('[Reddit AI Assistant] findActionBar returned null, DOM not ready');
    return false;
  }

  console.log('[Reddit AI Assistant] findActionBar found:', actionBar.id || actionBar.className || actionBar.tagName);

  if (!document.querySelector('.raa-styles')) {
    const style = createStyleSheet();
    style.classList.add('raa-styles');
    document.head.appendChild(style);
    applyTheme();
  }

  // Create button row styled like Reddit's action row
  const btnRow = document.createElement('div');
  btnRow.className = 'raa-buttons';
  btnRow.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; gap: 0; margin: 0; padding: 0;';

  const postBtn = document.createElement('button');
  postBtn.className = 'raa-btn raa-btn--post';
  postBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z" fill="currentColor"/></svg><span>Summarize Post</span>`;
  postBtn.addEventListener('click', () => summarize('post'));

  const commentBtn = document.createElement('button');
  commentBtn.className = 'raa-btn raa-btn--comments';
  commentBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 10c0 3.866-3.582 7-8 7a8.844 8.844 0 01-2.674-.414c-.517.374-1.43.86-2.576 1.218.166-.64.275-1.31.33-1.926C3.206 14.768 2 12.516 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" fill="currentColor"/></svg><span>Summarize Comments</span>`;
  commentBtn.addEventListener('click', () => summarize('comments'));

  btnRow.appendChild(postBtn);
  btnRow.appendChild(commentBtn);
  actionBar.appendChild(btnRow);

  injected = true;
  console.log('[Reddit AI Assistant] Buttons injected successfully');

  checkOnboarding().then((isReady) => {
    if (!isReady) {
      showOnboardingBanner();
      document.querySelectorAll('.raa-btn').forEach((btn) => ((btn as HTMLButtonElement).disabled = true));
    }
  });
  return true;
}

function summarize(type: 'post' | 'comments'): void {
  const content = type === 'post' ? getFullPostContent() : getCommentsContent();
  if (!content.trim()) {
    showPanel(type, 'Could not extract content from this page.', true);
    return;
  }

  // Check cache first
  const postId = getPostIdFromUrl();
  if (postId) {
    getCachedSummary(postId, type).then((cached) => {
      if (cached) {
        currentFullText = cached.summary;
        showPanel(type, '');
        updatePanelBody(cached.summary, SUMMARY_COLORS[type].bg);
        showFooter(`Tokens: ${cached.tokens} (cached)`, cached.summary);
        enableButtons();
        return;
      }
      // No cache, proceed with streaming
      startStreaming(type, content);
    });
  } else {
    startStreaming(type, content);
  }
}

function startStreaming(type: 'post' | 'comments', content: string): void {
  document.querySelectorAll('.raa-btn').forEach((btn) => ((btn as HTMLButtonElement).disabled = true));
  currentFullText = '';
  showPanel(type, '');
  setLoading(true);

  const msgType = type === 'post' ? 'SUMMARIZE_POST' : 'SUMMARIZE_COMMENTS';
  const colors = SUMMARY_COLORS[type];

  let renderTimer: ReturnType<typeof setTimeout> | null = null;
  let tokenCount = 0;

  const port = chrome.runtime.connect({ name: 'summarize' });
  port.postMessage({ type: msgType, content });

  port.onMessage.addListener((msg: { type: string; token?: string; fullText?: string; message?: string; code?: string; totalTokens?: number }) => {
    if (msg.type === 'STREAM_TOKEN' && msg.token) {
      currentFullText += msg.token;
      tokenCount++;

      // Dynamic render interval: more tokens = less frequent rendering
      const renderInterval = tokenCount < 200 ? 600 : tokenCount < 500 ? 1000 : 1500;

      if (!renderTimer) {
        renderTimer = setTimeout(() => {
          renderTimer = null;
          updatePanelBodyStreaming(currentFullText, colors.bg);
        }, renderInterval);
      }
    } else if (msg.type === 'STREAM_DONE') {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      const finalText = currentFullText || msg.fullText || '';
      updatePanelBody(finalText, colors.bg);
      if (msg.totalTokens !== undefined) {
        showFooter(`Tokens: ${msg.totalTokens}`, finalText);
      }
      enableButtons();

      // Cache the result
      const postId = getPostIdFromUrl();
      if (postId) {
        setCachedSummary(postId, type, finalText, msg.totalTokens ?? 0);
      }

      port.disconnect();
    } else if (msg.type === 'ERROR') {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      setLoading(false);
      showError(msg.message || 'Unknown error');
      enableButtons();
      port.disconnect();
    }
  });

  port.onDisconnect.addListener(() => {
    if (renderTimer) {
      clearTimeout(renderTimer);
      renderTimer = null;
    }
    enableButtons();
  });
}

function showPanel(type: 'post' | 'comments' | null, text: string, isError = false): void {
  removePanel();
  const colors = type ? SUMMARY_COLORS[type] : SUMMARY_COLORS.post;
  const isDark = detectDarkMode();
  const bgColor = isDark ? colors.bgDark : colors.bg;

  panelContainer = document.createElement('div');
  panelContainer.className = 'raa-panel';
  if (isDark) panelContainer.classList.add('raa-dark');

  const header = document.createElement('div');
  header.className = 'raa-panel__header';
  header.style.background = colors.header;
  header.style.color = colors.headerText;
  const headerLeft = document.createElement('span');
  headerLeft.textContent = colors.label;
  const headerRight = document.createElement('span');
  headerRight.style.cssText = 'display:flex;align-items:center;';
  const collapseIcon = document.createElement('span');
  collapseIcon.className = 'raa-panel__collapse-icon';
  collapseIcon.textContent = '\u25BC';
  headerRight.appendChild(collapseIcon);
  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  header.addEventListener('click', () => panelContainer?.classList.toggle('raa-panel--collapsed'));

  const body = document.createElement('div');
  body.className = 'raa-panel__body';
  body.style.background = bgColor;
  body.id = 'raa-panel-body';

  if (isError) {
    body.className = 'raa-panel__error';
    body.textContent = text;
    const retryBtn = document.createElement('button');
    retryBtn.className = 'raa-panel__retry';
    retryBtn.textContent = 'Retry';
    retryBtn.addEventListener('click', () => summarize(type || 'post'));
    body.appendChild(retryBtn);
  } else {
    body.textContent = text;
  }

  panelContainer.appendChild(header);
  panelContainer.appendChild(body);

  const btnGroup = document.querySelector('.raa-buttons');
  if (btnGroup?.parentElement) {
    btnGroup.parentElement.appendChild(panelContainer);
  } else {
    const actionBar = findActionBar();
    if (actionBar) actionBar.appendChild(panelContainer);
  }
}

function updatePanelBody(text: string, _bg: string): void {
  const body = document.getElementById('raa-panel-body');
  if (body) {
    body.innerHTML = DOMPurify.sanitize(marked.parse(text) as string);
    const isDark = detectDarkMode();
    const colors = _bg === SUMMARY_COLORS.post.bg ? SUMMARY_COLORS.post : SUMMARY_COLORS.comments;
    body.style.background = isDark ? colors.bgDark : _bg;
    setLoading(false);
  }
}

/** Update panel body during streaming — incremental markdown rendering */
function updatePanelBodyStreaming(text: string, _bg: string): void {
  const body = document.getElementById('raa-panel-body');
  if (!body) return;

  // Render markdown incrementally during streaming with XSS protection
  body.innerHTML = DOMPurify.sanitize(marked.parse(text) as string);
  body.style.background = _bg;

  // Auto-scroll to bottom
  body.scrollTop = body.scrollHeight;
}

function setLoading(loading: boolean): void {
  const body = document.getElementById('raa-panel-body');
  if (!body) return;
  if (loading) {
    if (!body.querySelector('.raa-shimmer')) {
      body.innerHTML = '<div class="raa-shimmer"></div>';
    }
  }
}

function showFooter(text: string, copyText?: string): void {
  removeFooter();
  const footer = document.createElement('div');
  footer.className = 'raa-panel__footer';
  footer.id = 'raa-panel-footer';
  footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

  const tokenSpan = document.createElement('span');
  tokenSpan.textContent = text;
  footer.appendChild(tokenSpan);

  if (copyText) {
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = 'background:none;border:1px solid rgba(0,0,0,0.2);color:rgba(0,0,0,0.5);padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px;';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(copyText).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.style.color = '#4ade80';
        copyBtn.style.borderColor = '#4ade80';
        setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.style.color = 'rgba(0,0,0,0.5)'; copyBtn.style.borderColor = 'rgba(0,0,0,0.2)'; }, 2000);
      });
    });
    footer.appendChild(copyBtn);
  }

  panelContainer?.appendChild(footer);
}

function removeFooter(): void {
  document.getElementById('raa-panel-footer')?.remove();
}

function showError(message: string): void {
  const body = document.getElementById('raa-panel-body');
  if (!body) return;
  body.className = 'raa-panel__error';
  body.textContent = message;
  const retryBtn = document.createElement('button');
  retryBtn.className = 'raa-panel__retry';
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', () => {
    const type = panelContainer?.querySelector('.raa-panel__header')?.textContent?.includes('Comment')
      ? 'comments'
      : 'post';
    summarize(type);
  });
  body.appendChild(retryBtn);
}

function removePanel(): void {
  panelContainer?.remove();
  panelContainer = null;
}

function enableButtons(): void {
  document.querySelectorAll('.raa-btn').forEach((btn) => ((btn as HTMLButtonElement).disabled = false));
}

/** Check if current URL is a Reddit post detail page */
function isPostDetailPage(): boolean {
  // Post detail pages match: /r/{subreddit}/comments/{post_id}/...
  return /^\/r\/[^/]+\/comments\//.test(location.pathname);
}

function detectDarkMode(): boolean {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-neutral-background').trim();
  if (bg) {
    const temp = document.createElement('div');
    temp.style.color = bg;
    document.body.appendChild(temp);
    const computed = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    const match = computed.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
    }
  }
  return false;
}

function applyTheme(): void {
  const root = document.getElementById('raa-injection-point') || document.documentElement;
  root.classList.toggle('raa-dark', detectDarkMode());
}

async function checkOnboarding(): Promise<boolean> {
  const result = await chrome.storage.local.get(['reddit-ai-settings', 'raa-onboarded']);
  const settings = result['reddit-ai-settings'];
  if (result['raa-onboarded']) return true;
  return !!(settings?.apiKey?.trim());
}

function showOnboardingBanner(): void {
  if (document.getElementById('raa-onboarding')) return;
  const banner = document.createElement('div');
  banner.id = 'raa-onboarding';
  banner.className = 'raa-onboarding';
  const textDiv = document.createElement('div');
  textDiv.className = 'raa-onboarding__text';
  textDiv.innerHTML = '<strong>Get started with AI summaries</strong><p>Connect your OpenAI-compatible API key to start summarizing Reddit posts and comments.</p>';
  const setupBtn = document.createElement('button');
  setupBtn.className = 'raa-onboarding__btn';
  setupBtn.textContent = 'Set up';
  setupBtn.addEventListener('click', () => { chrome.runtime.openOptionsPage(); });
  banner.appendChild(textDiv);
  banner.appendChild(setupBtn);
  const btnGroup = document.querySelector('.raa-buttons');
  if (btnGroup?.parentElement) {
    btnGroup.parentElement.insertBefore(banner, btnGroup.nextSibling);
  }
}

function setupStorageListener(): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const settingsChange = changes['reddit-ai-settings'];
    if (settingsChange) {
      const newVal = settingsChange.newValue;
      if (newVal?.apiKey?.trim()) {
        document.getElementById('raa-onboarding')?.remove();
        chrome.storage.local.set({ 'raa-onboarded': true });
        enableButtons();
      }
    }
  });
}

export function init(): void {
  console.log('[Reddit AI Assistant] Content script loaded');
  lastUrl = location.href;

  // Initial injection attempt
  tryInject();
  applyTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  const themeObserver = new MutationObserver(() => applyTheme());
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  setupStorageListener();

  // MutationObserver for delayed DOM readiness and DOM replacement detection
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;

      // Check if our injected UI was removed from DOM (e.g. Reddit SPA replaced it)
      if (injected && !document.getElementById('raa-injection-point')) {
        console.log('[Reddit AI Assistant] Injection point removed from DOM, re-injecting');
        injected = false;
        panelContainer = null;
      }

      if (!injected) {
        tryInject();
      }
    }, 300);  // Slightly longer debounce for Reddit's SPA
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Detect SPA navigation (URL change without page reload)
  const checkUrlChange = () => {
    if (location.href !== lastUrl) {
      const wasOnPostPage = isPostDetailPage();
      lastUrl = location.href;
      const isNowOnPostPage = isPostDetailPage();
      console.log('[Reddit AI Assistant] URL changed to:', location.href);

      // Clean up old UI
      cleanup();

      // Only re-inject if we're now on a post detail page
      // If navigating away from post page, just cleanup and exit
      if (!isNowOnPostPage) {
        return;
      }

      // The MutationObserver will handle re-injection as DOM changes
    }
  };

  // Listen for popstate (back/forward) and pushState/replaceState
  window.addEventListener('popstate', checkUrlChange);

  const origPushState = history.pushState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    checkUrlChange();
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    checkUrlChange();
  };
}
