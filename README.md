# Reddit AI Assistant

A Chrome/Firefox browser extension that adds AI-powered summarization to Reddit posts and comment threads. Uses any OpenAI-compatible API with your own key and custom prompts.

## Features

- **Summarize Post** — One-click AI summary of the original post content
- **Summarize Comments** — Analyze the entire comment thread for themes, consensus, and debates
- **Streaming responses** — See the summary appear token-by-token in real time
- **BYO API key** — Works with OpenAI, or any OpenAI-compatible endpoint (e.g. LiteLLM, Ollama, Azure OpenAI)
- **Custom prompts** — Fully editable summary prompt templates with sensible defaults
- **Native feel** — Buttons and panels blend into Reddit's existing UI

## Quick Start

### Install dependencies

```bash
cd reddit-ai-assistant
npm install
```

### Development

```bash
# Chrome (default)
npx wxt

# Firefox
npx wxt --browser firefox
```

WXT will print a link to load the unpacked extension in your browser.

### Production Build

```bash
# Chrome
npx wxt build

# Firefox
npx wxt build --browser firefox
```

Output goes to `.output/chrome-mv3/` or `.output/firefox-mv3/`.

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3` directory

## Configuration

After loading the extension, right-click the extension icon and select **Options** (or go to `chrome://extensions` → Reddit AI Assistant → Details → Extension options).

### API Settings

| Field | Default | Description |
|---|---|---|
| API Endpoint | `https://api.openai.com/v1/chat/completions` | Any OpenAI-compatible chat completions endpoint |
| API Key | *(empty)* | Your API key (stored locally, never sent to third parties) |
| Model | `gpt-4o-mini` | Model name to use |

Click **Test Connection** to verify your settings before saving.

### Prompt Templates

Two prompt templates are provided with defaults:

- **Post Summary** — Summarizes the post title, author, and body in under 3 sentences
- **Comment Summary** — Analyzes comment threads for themes, consensus, and debates

Both are fully editable. Use `{content}` as a placeholder for the extracted text. Click **Reset to default** to restore originals.

## Architecture

```
src/
├── entrypoints/          # WXT entry points
│   ├── background.ts     # Service worker (message routing, API calls)
│   ├── content.ts        # Content script (injected into reddit.com)
│   └── options/          # Settings page (Vue 3 SPA)
├── background/           # Background service worker logic
│   ├── router.ts         # Typed message router
│   ├── ai-client.ts      # Streaming OpenAI-compatible client
│   ├── prompt-builder.ts # Template injection
│   └── config.ts         # chrome.storage settings manager
├── content/              # Content script logic
│   ├── dom-adapter.ts    # Reddit DOM selector abstraction
│   └── ui-injector.ts    # Button & summary panel injection
├── options/views/        # Settings page Vue components
│   ├── ApiSettings.vue
│   ├── PromptTemplates.vue
│   └── About.vue
├── features/             # Feature modules (extensible)
│   ├── summarize-post/
│   └── summarize-comments/
└── shared/               # Shared types and constants
    ├── types.ts
    └── constants.ts
```

### Three-Layer Design

1. **Content Script** — Injected into `reddit.com`. Detects post pages, injects summarize buttons, extracts content via a DOM adapter, renders streaming responses.

2. **Background Service Worker** — Handles all API communication. Routes messages from content scripts, builds prompts, streams responses back via `chrome.runtime.Port`.

3. **Options Page** — Vue 3 SPA for configuring API settings and prompt templates. Settings persist in `chrome.storage.local`.

### Data Flow

```
User clicks "Summarize Post"
  → Content script: DOM Adapter extracts post text
  → Content script: chrome.runtime.connect() opens a Port
  → Content script: sends { type: 'SUMMARIZE_POST', content }
  → Background: Router dispatches to SummarizePostHandler
  → Background: Prompt Builder injects content into template
  → Background: AI Client sends streaming request to endpoint
  → Background: For each token → { type: 'STREAM_TOKEN', token }
  → Content script: Summary Panel renders tokens in real time
  → Background: On done → { type: 'STREAM_DONE', totalTokens }
  → Content script: Shows footer with token count
```

### Adding New Features

Features are modular. To add a new feature:

1. Create `src/features/your-feature/messages.ts` with typed message definitions
2. Register a handler in `entrypoints/background.ts`:

```ts
registerHandler('YOUR_TYPE', async (request, port) => {
  // handle and stream response
});
```

3. Add UI triggers in `content/ui-injector.ts`

No existing code needs modification.

## Error Handling

| Error | Behavior |
|---|---|
| Missing API key | Panel shows "Please configure your API key" message |
| Network error | Panel shows "Connection failed" with retry button |
| Rate limited (429) | Auto-retry with exponential backoff (1s → 2s → 4s), max 3 retries |
| API error (5xx) | Panel shows error message with retry button |
| Stream interrupted | Partial summary preserved, shows error badge with retry |
| DOM change detected | Graceful "couldn't load" message |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [WXT](https://wxt.dev/) 0.20.x — Manifest V3 |
| UI | Vue 3 + TypeScript |
| Build | Vite (via WXT) |
| Browser | Chrome/Edge (primary), Firefox (secondary) |

## Permissions

- `storage` — Save API settings and custom prompts locally
- `activeTab` — Access current Reddit tab content
- Host permission: `*://*.reddit.com/*` — Content script injection only

No broad host permissions. No data is sent anywhere except your configured API endpoint.

## License

MIT
