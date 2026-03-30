# Fix Button Alignment — Left-Align Summarize Buttons

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the summarize buttons to be left-aligned with Reddit's native action bar buttons (Share, etc.) instead of appearing centered or offset incorrectly.

**Architecture:** The injection container (`raa-injection-point`) is a `div` inserted after `<shreddit-post>` on PDP. It uses `paddingLeft` to align with the Share button's left edge. The button row inside uses flex layout. The fix ensures the container itself is properly positioned and the buttons align exactly with Reddit's native action buttons.

**Tech Stack:** TypeScript, WXT content script, DOM manipulation

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/content/dom-adapter.ts` | Modify | Fix `createInjectionContainer()` alignment logic |
| `src/content/ui-injector.ts` | Modify | Fix `btnRow` flex alignment and add explicit left-alignment CSS |

---

### Task 1: Fix injection container alignment in dom-adapter

**Files:**
- Modify: `src/content/dom-adapter.ts:92-120` (`createInjectionContainer`)

**Problem:** The current `createInjectionContainer` uses `paddingLeft` calculated from the Share button's bounding rect. This works sometimes, but the container itself is a full-width `div` inside Reddit's flex layout. If Reddit's parent flex container centers children, the offset calculation is wrong. The buttons end up visually centered or misaligned.

- [ ] **Step 1: Update `createInjectionContainer` to use Reddit's actual action bar as alignment reference**

In `src/content/dom-adapter.ts`, find the `createInjectionContainer` function (lines 92-120). Replace the `requestAnimationFrame` alignment block with a more reliable approach that directly reads the action bar's padding:

```typescript
function createInjectionContainer(postEl: HTMLElement): HTMLElement | null {
  // Check if we already created one
  const existing = document.getElementById('raa-injection-point');
  if (existing) return existing;

  const container = document.createElement('div');
  container.id = 'raa-injection-point';
  container.className = 'raa-injection-container';
  container.style.cssText =
    'padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; width: 100%;';

  // Insert after shreddit-post
  postEl.parentElement?.insertBefore(container, postEl.nextSibling);

  // Align with the native action bar by reading its left padding/margin
  requestAnimationFrame(() => {
    // Find the actual action bar row that contains Share, Comments, etc.
    const actionBarRow = postEl.querySelector(
      '[slot="post-actions-bar"], [data-testid="post-action-bar"], faceplate-dropdown-menu'
    );
    if (actionBarRow) {
      // Walk up to find the button row container
      let btnRow: HTMLElement | null = actionBarRow as HTMLElement;
      for (let i = 0; i < 3 && btnRow; i++) {
        const parent = btnRow.parentElement;
        if (!parent) break;
        // If parent has multiple buttons, it's the row
        if (parent.querySelectorAll('button, [role="button"]').length >= 2) {
          btnRow = parent;
          break;
        }
        btnRow = parent;
      }
      if (btnRow) {
        const computedStyle = window.getComputedStyle(btnRow);
        const paddingLeft = computedStyle.paddingLeft;
        const marginLeft = computedStyle.marginLeft;
        if (paddingLeft && paddingLeft !== '0px') {
          container.style.paddingLeft = paddingLeft;
        }
        if (marginLeft && marginLeft !== '0px') {
          container.style.marginLeft = marginLeft;
        }
      }
    } else {
      // Fallback: align with the Share button specifically
      const shareBtn = postEl.querySelector(
        '[slot="ssr-share-button"], button[aria-label*="Share"], button[aria-label*="share"]'
      );
      if (shareBtn) {
        const containerRect = container.getBoundingClientRect();
        const shareRect = shareBtn.getBoundingClientRect();
        const leftOffset = shareRect.left - containerRect.left;
        if (leftOffset > 0) {
          container.style.paddingLeft = `${leftOffset}px`;
        }
      }
    }
  });

  return container;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd E:/codespace/NewProject/reddit-ai-assistant && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to dom-adapter.ts

- [ ] **Step 3: Commit**

```bash
cd E:/codespace/NewProject/reddit-ai-assistant
git add src/content/dom-adapter.ts
git commit -m "fix: use Reddit action bar as alignment reference for injection container"
```

---

### Task 2: Fix button row to be explicitly left-aligned

**Files:**
- Modify: `src/content/ui-injector.ts:157-174` (the `btnRow` creation in `tryInject`)

**Problem:** The `btnRow` div uses `display: flex; align-items: center; gap: 0;` but does not set `justify-content: flex-start`. While `flex-start` is the default, the buttons may appear centered if the parent container has centered flex or auto margins. Adding explicit left-alignment ensures consistent behavior.

- [ ] **Step 1: Add explicit left-alignment and consistent gap to btnRow**

In `src/content/ui-injector.ts`, find the `btnRow` creation block (around line 158-160):

```typescript
  // Create button row styled like Reddit's action row
  const btnRow = document.createElement('div');
  btnRow.className = 'raa-buttons';
  btnRow.style.cssText = 'display: flex; align-items: center; gap: 0;';
```

Replace with:

```typescript
  // Create button row styled like Reddit's action row
  const btnRow = document.createElement('div');
  btnRow.className = 'raa-buttons';
  btnRow.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; gap: 0; margin: 0; padding: 0;';
```

- [ ] **Step 2: Also update the `createStyleSheet` to ensure `.raa-buttons` is left-aligned**

In the same file, find the `createStyleSheet` function. In the CSS text, after the `.raa-btn:hover` rule (around line 30), verify there is no `text-align: center` or `justify-content: center` on `.raa-buttons`. Add this CSS rule if not present:

Find this section in the stylesheet string:
```
    .raa-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
```

After it, add:

```css
    .raa-buttons {
      justify-content: flex-start;
      text-align: left;
      width: 100%;
    }
```

- [ ] **Step 3: Verify the file compiles**

Run: `cd E:/codespace/NewProject/reddit-ai-assistant && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to ui-injector.ts

- [ ] **Step 4: Commit**

```bash
cd E:/codespace/NewProject/reddit-ai-assistant
git add src/content/ui-injector.ts
git commit -m "fix: explicitly left-align summarize buttons to match Reddit action bar"
```

---

### Task 3: Build and visual verification

**Files:** None (verification only)

- [ ] **Step 1: Build the extension**

Run: `cd E:/codespace/NewProject/reddit-ai-assistant && npx wxt build 2>&1 | tail -5`
Expected: Build succeeds, output in `.output/chrome-mv3/`

- [ ] **Step 2: Load in browser and verify alignment**

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" → select `.output/chrome-mv3/`
4. Navigate to any Reddit post (e.g., `https://www.reddit.com/r/programming/comments/xxx`)
5. Verify: "Summarize Post" and "Summarize Comments" buttons are left-aligned with Reddit's native Share/Comments buttons
6. Verify: buttons do NOT appear centered or offset to the right
7. Toggle Reddit dark mode → verify alignment stays correct

- [ ] **Step 3: Final commit if any adjustments needed**

If alignment is still off, adjust `paddingLeft` calculation in `dom-adapter.ts` and commit:

```bash
cd E:/codespace/NewProject/reddit-ai-assistant
git add -A
git commit -m "fix: fine-tune button alignment with Reddit action bar"
```
