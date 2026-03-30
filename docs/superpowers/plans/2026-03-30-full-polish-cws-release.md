# Full Polish for Chrome Web Store + GitHub Release — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Reddit AI Assistant extension for Chrome Web Store submission — dark mode, onboarding, better prompts, popup redesign, and CWS assets.

**Architecture:** All changes are client-side only. Dark mode uses CSS class toggling driven by Reddit theme detection. Onboarding uses chrome.storage to detect first-run state. Prompt changes are content-only in constants. Popup is a Vue 3 rewrite from settings-form to status-dashboard. CWS assets are static files in public/.

**Tech Stack:** WXT, Vue 3, TypeScript, marked (markdown), Chrome Extensions Manifest V3

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/content/ui-injector.ts` | Modify | Dark mode CSS, onboarding banner, panel polish (copy, collapse, shimmer) |
| `src/shared/constants.ts` | Modify | Updated prompts, dark mode color tokens |
| `src/background/prompt-builder.ts` | Modify | System prompt for post summarization |
| `src/entrypoints/popup/App.vue` | Modify | Full rewrite to status dashboard |
| `public/icon/icon.svg` | Create | SVG source icon |
| `wxt.config.ts` | Modify | Add icon references to manifest |
| `CWS_LISTING.md` | Create | Chrome Web Store listing copy |

---

### Task 1: Dark Mode Detection + Dark CSS

**Files:**
- Modify: `src/content/ui-injector.ts` (stylesheet + theme detection)

- [ ] **Step 1: Add dark mode CSS, shimmer, onboarding, collapse, and copy button styles to `createStyleSheet()`**

In `src/content/ui-injector.ts`, add the following CSS rules inside the `createStyleSheet()` function's template literal, after the existing `@keyframes raa-spin` rule:

```css
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
```

- [ ] **Step 2: Add dark mode detection helpers before `init()`**

Add these functions before the existing `init()` function in `src/content/ui-injector.ts`:

```typescript
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
```

- [ ] **Step 3: Hook theme detection into `init()` and `tryInject()`**

In `init()`, after the first `tryInject();` call, add:

```typescript
  applyTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  const themeObserver = new MutationObserver(() => applyTheme());
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
```

In `tryInject()`, after `document.head.appendChild(style);`, add:

```typescript
    applyTheme();
```

- [ ] **Step 4: Build and verify**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/content/ui-injector.ts
git commit -m "feat: add dark mode detection and dark CSS for summary panel"
```

---

### Task 2: Dark Mode Color Tokens + Panel Polish (Copy, Collapse, Shimmer)

**Files:**
- Modify: `src/shared/constants.ts` (dark color tokens)
- Modify: `src/content/ui-injector.ts` (use dark colors, copy button, shimmer, collapse)

- [ ] **Step 1: Add dark color tokens to `SUMMARY_COLORS` in `src/shared/constants.ts`**

Replace the `SUMMARY_COLORS` constant:

```typescript
export const SUMMARY_COLORS = {
  post: {
    bg: '#f0f0ff',
    bgDark: '#1e1b4b',
    header: '#6366f1',
    headerText: '#ffffff',
    label: 'AI Summary',
  },
  comments: {
    bg: '#f0fdf4',
    bgDark: '#052e16',
    header: '#22c55e',
    headerText: '#ffffff',
    label: 'Comment Summary',
  },
} as const;
```

- [ ] **Step 2: Rewrite `showPanel()` with dark mode support, collapse header, and copy button**

Replace the existing `showPanel` function in `src/content/ui-injector.ts`:

```typescript
let currentFullText = '';

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
```

- [ ] **Step 3: Update `updatePanelBody()` and `updatePanelBodyStreaming()` with dark mode**

Replace `updatePanelBody`:

```typescript
function updatePanelBody(text: string, _bg: string): void {
  const body = document.getElementById('raa-panel-body');
  if (body) {
    body.innerHTML = marked.parse(text) as string;
    const isDark = detectDarkMode();
    const colors = _bg === SUMMARY_COLORS.post.bg ? SUMMARY_COLORS.post : SUMMARY_COLORS.comments;
    body.style.background = isDark ? colors.bgDark : _bg;
    setLoading(false);
  }
}
```

Replace `updatePanelBodyStreaming`:

```typescript
function updatePanelBodyStreaming(text: string, _bg: string): void {
  const body = document.getElementById('raa-panel-body');
  if (!body) return;
  let pre = body.querySelector('.raa-streaming-text') as HTMLPreElement | null;
  if (!pre) {
    body.innerHTML = '';
    pre = document.createElement('pre');
    pre.className = 'raa-streaming-text';
    pre.style.cssText = 'margin:0;padding:0;white-space:pre-wrap;word-wrap:break-word;font-family:inherit;font-size:inherit;line-height:inherit;';
    body.appendChild(pre);
  }
  pre.textContent = text;
}
```

- [ ] **Step 4: Replace `setLoading()` with shimmer animation**

```typescript
function setLoading(loading: boolean): void {
  const body = document.getElementById('raa-panel-body');
  if (!body) return;
  if (loading) {
    if (!body.querySelector('.raa-shimmer')) {
      body.innerHTML = '<div class="raa-shimmer"></div>';
    }
  }
}
```

- [ ] **Step 5: Update `summarize()` to track text and add copy button in footer**

Replace the entire `summarize` function:

```typescript
function summarize(type: 'post' | 'comments'): void {
  const content = type === 'post' ? getFullPostContent() : getCommentsContent();
  if (!content.trim()) {
    showPanel(type, 'Could not extract content from this page.', true);
    return;
  }

  document.querySelectorAll('.raa-btn').forEach((btn) => ((btn as HTMLButtonElement).disabled = true));
  showPanel(type, '');
  setLoading(true);

  const msgType = type === 'post' ? 'SUMMARIZE_POST' : 'SUMMARIZE_COMMENTS';
  const colors = SUMMARY_COLORS[type];
  currentFullText = '';
  let renderTimer: ReturnType<typeof setTimeout> | null = null;

  const port = chrome.runtime.connect({ name: 'summarize' });
  port.postMessage({ type: msgType, content });

  port.onMessage.addListener((msg: { type: string; token?: string; fullText?: string; message?: string; code?: string; totalTokens?: number }) => {
    if (msg.type === 'STREAM_TOKEN' && msg.token) {
      currentFullText += msg.token;
      if (!renderTimer) {
        renderTimer = setTimeout(() => {
          renderTimer = null;
          updatePanelBodyStreaming(currentFullText, colors.bg);
        }, 300);
      }
    } else if (msg.type === 'STREAM_DONE') {
      if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
      updatePanelBody(currentFullText || msg.fullText || '', colors.bg);
      if (msg.totalTokens !== undefined) {
        showFooter(`${msg.totalTokens} tokens`, currentFullText || msg.fullText || '');
      }
      enableButtons();
      port.disconnect();
    } else if (msg.type === 'ERROR') {
      if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
      setLoading(false);
      showError(msg.message || 'Unknown error');
      enableButtons();
      port.disconnect();
    }
  });

  port.onDisconnect.addListener(() => {
    if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
    enableButtons();
  });
}
```

- [ ] **Step 6: Update `showFooter()` with copy button**

Replace the `showFooter` and `removeFooter` functions:

```typescript
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
```

- [ ] **Step 7: Build and verify**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/shared/constants.ts src/content/ui-injector.ts
git commit -m "feat: dark mode colors, copy button, shimmer loading, collapsible panel"
```

---

### Task 3: Onboarding Flow

**Files:**
- Modify: `src/content/ui-injector.ts` (onboarding banner + storage listener)

- [ ] **Step 1: Add onboarding functions before `init()`**

Add these functions before `init()` in `src/content/ui-injector.ts`:

```typescript
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
```

- [ ] **Step 2: Integrate onboarding into `tryInject()` and `init()`**

In `tryInject()`, replace `return true;` at the end with:

```typescript
  injected = true;
  console.log('[Reddit AI Assistant] Buttons injected');
  checkOnboarding().then((isReady) => {
    if (!isReady) {
      showOnboardingBanner();
      document.querySelectorAll('.raa-btn').forEach((btn) => ((btn as HTMLButtonElement).disabled = true));
    }
  });
  return true;
```

In `init()`, after the theme observer setup, add:

```typescript
  setupStorageListener();
```

- [ ] **Step 3: Build and verify**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/content/ui-injector.ts
git commit -m "feat: add first-run onboarding banner with API key detection"
```

---

### Task 4: Better Prompts + System Prompts

**Files:**
- Modify: `src/shared/constants.ts` (updated prompts)
- Modify: `src/background/prompt-builder.ts` (post system prompt)

- [ ] **Step 1: Update prompts in `src/shared/constants.ts`**

Replace `DEFAULT_POST_PROMPT`:

```typescript
export const DEFAULT_POST_PROMPT =
  `Summarize the following Reddit post. Provide your response in this format:

**Key Point:** One sentence capturing the main idea or question.
**Context:** 1-2 sentences of necessary background.
**Questions Asked:** List any explicit questions (or "None" if not applicable).

Keep the summary concise and under 4 sentences total.

{content}`;
```

Replace `DEFAULT_COMMENT_PROMPT`:

```typescript
export const DEFAULT_COMMENT_PROMPT =
  `Analyze the following Reddit comment thread. Provide your response in this format:

## Top Themes
- List 2-4 main discussion themes as bullet points

## Consensus
What most commenters agree on (1-2 sentences)

## Notable Debate
Key disagreement or contrasting viewpoints (1-2 sentences)

## Overall Sentiment
One of: Mostly Positive, Mixed, Mostly Negative, or Neutral — with a brief explanation

{content}`;
```

- [ ] **Step 2: Add system prompt for post summarization in `src/background/prompt-builder.ts`**

Replace the `getSystemPrompt` function:

```typescript
export function getSystemPrompt(type: 'post' | 'comments'): string | undefined {
  if (type === 'post') {
    return 'You are summarizing Reddit posts. Be concise and factual. Use markdown formatting (bold, headers) for structure. Focus on extracting the key information a reader needs.';
  }
  return 'You are analyzing Reddit comments. Be concise and structured. Use markdown headers and bullet points for clarity. Focus on the most important themes and insights.';
}
```

- [ ] **Step 3: Build and verify**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/shared/constants.ts src/background/prompt-builder.ts
git commit -m "feat: update prompts with structured output format and add post system prompt"
```

---

### Task 5: Popup Redesign — Status Dashboard

**Files:**
- Modify: `src/entrypoints/popup/App.vue` (full rewrite)

- [ ] **Step 1: Rewrite popup/App.vue as status dashboard**

Replace the entire content of `src/entrypoints/popup/App.vue`:

```vue
<template>
  <div class="popup">
    <div class="popup-header">
      <div class="popup-logo">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="4" fill="#6366f1"/>
          <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" fill="white"/>
        </svg>
      </div>
      <div class="popup-title">
        <strong>Reddit AI Assistant</strong>
        <span class="version">v1.0.0</span>
      </div>
    </div>
    <div :class="['status-bar', configured ? 'status-bar--ok' : 'status-bar--warn']">
      <span class="status-dot"></span>
      <span v-if="configured" class="status-text">API connected &middot; {{ model }}</span>
      <span v-else class="status-text">API not configured</span>
    </div>
    <div class="quick-settings">
      <label>Model</label>
      <div class="model-row">
        <select v-if="modelList.length > 0" v-model="model" class="model-select">
          <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
        </select>
        <input v-else v-model="model" type="text" placeholder="gpt-4o-mini" />
        <button class="btn-fetch" @click="fetchModelList" :disabled="fetching" title="Fetch models">
          {{ fetching ? '...' : 'Fetch' }}
        </button>
      </div>
      <label>Endpoint</label>
      <input v-model="endpoint" type="url" placeholder="https://api.openai.com/v1/chat/completions" />
    </div>
    <div class="popup-actions">
      <button class="btn-primary" @click="save">Save</button>
      <button class="btn-link" @click="openOptions">Full Settings</button>
    </div>
    <div class="popup-footer">
      <button class="btn-link" @click="openOptions">Edit Prompts</button>
      <a href="https://github.com/user/reddit-ai-assistant" target="_blank" class="footer-link">GitHub</a>
    </div>
    <p v-if="msg" :class="['msg', msgType]">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const endpoint = ref('https://api.openai.com/v1/chat/completions');
const apiKey = ref('');
const model = ref('gpt-4o-mini');
const msg = ref('');
const msgType = ref<'ok' | 'err'>('ok');
const configured = computed(() => apiKey.value.trim().length > 0);
const fetching = ref(false);
const modelList = ref<string[]>([]);
const KEY = 'reddit-ai-settings';

onMounted(async () => {
  const r = await chrome.storage.local.get(KEY);
  if (r[KEY]) {
    endpoint.value = r[KEY].endpoint || endpoint.value;
    apiKey.value = r[KEY].apiKey || '';
    model.value = r[KEY].model || model.value;
  }
});

async function save() {
  const r = await chrome.storage.local.get(KEY);
  await chrome.storage.local.set({
    [KEY]: { ...(r[KEY] || {}), endpoint: endpoint.value, apiKey: apiKey.value, model: model.value },
  });
  msg.value = 'Saved!';
  msgType.value = 'ok';
  setTimeout(() => (msg.value = ''), 2000);
}

function fetchModelList() {
  fetching.value = true;
  msg.value = '';
  chrome.runtime.sendMessage({ type: 'FETCH_MODELS' }, (res) => {
    if (chrome.runtime.lastError) {
      msg.value = 'Error: ' + chrome.runtime.lastError.message;
      msgType.value = 'err';
    } else if (res?.type === 'FETCH_MODELS_RESULT') {
      modelList.value = res.models;
      if (res.models.length === 0) {
        msg.value = 'No models found';
        msgType.value = 'err';
      } else {
        msg.value = `${res.models.length} models found`;
        msgType.value = 'ok';
        if (!res.models.includes(model.value)) model.value = res.models[0];
      }
    } else if (res?.type === 'ERROR') {
      msg.value = 'Failed: ' + res.message;
      msgType.value = 'err';
    }
    fetching.value = false;
  });
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 340px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.popup { padding: 16px; }
.popup-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.popup-title strong { font-size: 14px; display: block; }
.version { font-size: 11px; color: #9ca3af; }
.status-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 13px; }
.status-bar--ok { background: #f0fdf4; color: #166534; }
.status-bar--warn { background: #fef3c7; color: #92400e; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-bar--ok .status-dot { background: #22c55e; }
.status-bar--warn .status-dot { background: #f59e0b; }
.status-text { font-weight: 500; }
.quick-settings { margin-bottom: 14px; }
.quick-settings label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin: 8px 0 3px; }
.quick-settings label:first-child { margin-top: 0; }
.quick-settings input { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; }
.quick-settings input:focus { outline: none; border-color: #6366f1; }
.model-row { display: flex; gap: 6px; align-items: center; }
.model-row input { flex: 1; }
.model-select { flex: 1; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; background: white; }
.model-select:focus { outline: none; border-color: #6366f1; }
.btn-fetch { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 12px; white-space: nowrap; }
.btn-fetch:disabled { opacity: 0.5; cursor: not-allowed; }
.popup-actions { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.btn-primary { padding: 7px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-primary:hover { opacity: 0.9; }
.btn-link { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 12px; }
.btn-link:hover { text-decoration: underline; }
.popup-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 11px; }
.footer-link { color: #9ca3af; text-decoration: none; }
.footer-link:hover { color: #6366f1; }
.msg { margin-top: 8px; font-size: 12px; padding: 4px 8px; border-radius: 4px; }
.msg.ok { background: #f0fdf4; color: #166534; }
.msg.err { background: #fef2f2; color: #991b1b; }
</style>
```

- [ ] **Step 2: Build and verify**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/entrypoints/popup/App.vue
git commit -m "feat: redesign popup as status dashboard with quick settings"
```

---

### Task 6: Extension Icons + Manifest Update

**Files:**
- Create: `public/icon/icon.svg`
- Modify: `wxt.config.ts` (add icon references)

- [ ] **Step 1: Create SVG icon at `public/icon/icon.svg`**

```svg
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#6366f1"/>
  <path d="M64 28a6 6 0 016 6v24h24a6 6 0 010 12H70v24a6 6 0 01-12 0V70H34a6 6 0 010-12h24V34a6 6 0 016-6z" fill="white"/>
  <circle cx="96" cy="36" r="8" fill="#a5b4fc" opacity="0.6"/>
  <circle cx="32" cy="92" r="6" fill="#a5b4fc" opacity="0.4"/>
</svg>
```

- [ ] **Step 2: Update `wxt.config.ts` with icon references**

Replace the `manifest` section in `wxt.config.ts`:

```typescript
  manifest: {
    name: 'Reddit AI Assistant',
    description: 'AI-powered summarization for Reddit posts and comment threads',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['*://*.reddit.com/*'],
    icons: {
      16: 'icon/icon.svg',
      32: 'icon/icon.svg',
      48: 'icon/icon.svg',
      128: 'icon/icon.svg',
    },
    action: {
      default_icon: {
        16: 'icon/icon.svg',
        32: 'icon/icon.svg',
        48: 'icon/icon.svg',
        128: 'icon/icon.svg',
      },
    },
  },
```

Note: Chrome supports SVG icons in Manifest V3. If PNGs are required for CWS, they can be generated from the SVG separately.

- [ ] **Step 3: Build and verify**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add public/icon/icon.svg wxt.config.ts
git commit -m "feat: add extension icon and update manifest"
```

---

### Task 7: Chrome Web Store Listing

**Files:**
- Create: `CWS_LISTING.md`

- [ ] **Step 1: Create `CWS_LISTING.md`**

```markdown
# Chrome Web Store Listing

## Title
Reddit AI Assistant — Smart Post & Comment Summaries

## Short Description (132 chars)
AI-powered summaries for Reddit posts and comment threads. Works with any OpenAI-compatible API. Your key, your provider.

## Detailed Description

**Reddit AI Assistant** brings one-click AI summaries to every Reddit post and comment thread.

### How it works
- Click "Summarize Post" to get the key point, context, and questions asked
- Click "Summarize Comments" to see top themes, consensus, debates, and overall sentiment
- Summaries stream in real-time, rendered as clean markdown

### Bring your own API key
Works with **any** OpenAI-compatible API:
- OpenAI (GPT-4o, GPT-4o-mini, etc.)
- Anthropic via proxy
- Local models (LM Studio, Ollama, etc.)
- Any other compatible endpoint

**No data is sent through our servers.** Your API key stays in your browser.

### Features
- Real-time streaming summaries
- Dark mode support (follows your Reddit theme)
- Structured output with themes, consensus, and debate highlights
- Copy summary with one click
- Collapsible summary panel
- Model selector with auto-discovery
- Customizable prompt templates

### Privacy
- Zero data collection
- No analytics, no tracking
- API key stored locally in browser storage
- All API calls go directly to your configured endpoint

## Category
Productivity

## Language
English

## Keywords
reddit, ai, summary, summarizer, chatgpt, openai, comments, posts
```

- [ ] **Step 2: Commit**

```bash
git add CWS_LISTING.md
git commit -m "docs: add Chrome Web Store listing copy"
```

---

### Task 8: Final Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full build for Chrome**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build`
Expected: Build succeeds.

- [ ] **Step 2: Run full build for Firefox**

Run: `cd /e/codespace/NewProject/reddit-ai-assistant && npm run build:firefox`
Expected: Build succeeds.

- [ ] **Step 3: Verify output**

Run: `ls -la .output/chrome-mv3/ 2>/dev/null || ls -la .output/`
Expected: Manifest and all assets present.
