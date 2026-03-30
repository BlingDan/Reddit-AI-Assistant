# Prompt and Comment Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve prompts for post/comment summarization and restructure comment extraction to capture threaded discussions.

**Architecture:** Add `replies` field to Comment type, rewrite DOM extraction for thread awareness, update default prompts to match linuxdo-scripts style, add attribution in README.

**Tech Stack:** TypeScript, WXT browser extension framework, Vue 3

---

## File Structure

| File | Change |
|------|--------|
| `src/shared/types.ts` | Add `replies?: Comment[]` to Comment interface |
| `src/content/dom-adapter.ts` | Rewrite `extractComments()` and `getCommentsContent()` for thread extraction |
| `src/shared/constants.ts` | Rewrite `DEFAULT_POST_PROMPT`, `DEFAULT_COMMENT_PROMPT` |
| `src/background/prompt-builder.ts` | Update system prompts |
| `README.md` | Add Inspiration section |
| `README.zh-CN.md` | Add 灵感来源 section |

---

### Task 1: Update Comment Type

**Files:**
- Modify: `src/shared/types.ts:1-5`

- [ ] **Step 1: Add replies field to Comment interface**

Edit `src/shared/types.ts` to add the `replies` optional field:

```ts
export interface Comment {
  author: string;
  text: string;
  score?: number;
  replies?: Comment[];  // Nested replies within this comment thread
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat: add replies field to Comment type for thread support"
```

---

### Task 2: Rewrite extractComments() for Thread Extraction

**Files:**
- Modify: `src/content/dom-adapter.ts:241-305`

- [ ] **Step 1: Implement thread-aware comment extraction**

Replace the `extractComments()` function in `src/content/dom-adapter.ts` (lines 241-305) with:

```typescript
function extractComments(): Comment[] {
  const comments: Comment[] = [];

  // Strategy 1: shreddit-comment custom elements (thread-aware)
  const shredditComments = document.querySelectorAll('shreddit-comment');
  if (shredditComments.length > 0) {
    // Find top-level comments (not nested inside other comments)
    const topLevelComments: Element[] = [];

    shredditComments.forEach((el) => {
      // Check if this comment is nested inside another comment's replies
      // A top-level comment is a direct child of the comment tree container
      const parentComment = el.closest('shreddit-comment');
      // If parentComment is the element itself or null, it's top-level
      if (parentComment === el || !parentComment) {
        topLevelComments.push(el);
      }
    });

    topLevelComments.forEach((el) => {
      const comment = extractSingleComment(el as HTMLElement);
      if (comment) {
        // Recursively extract replies (child shreddit-comment elements)
        const childComments = el.querySelectorAll(':scope > shreddit-comment, :scope > div > shreddit-comment');
        if (childComments.length > 0) {
          comment.replies = [];
          childComments.forEach((child) => {
            const childComment = extractSingleComment(child as HTMLElement);
            if (childComment) {
              // Further nested replies (up to 2 levels deep)
              const nestedChildren = child.querySelectorAll(':scope > shreddit-comment, :scope > div > shreddit-comment');
              if (nestedChildren.length > 0) {
                childComment.replies = [];
                nestedChildren.forEach((nested) => {
                  const nestedComment = extractSingleComment(nested as HTMLElement);
                  if (nestedComment) {
                    childComment.replies!.push(nestedComment);
                  }
                });
                // Sort nested replies by score
                childComment.replies!.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
              }
              comment.replies!.push(childComment);
            }
          });
          // Sort replies by score descending
          comment.replies!.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        }
        comments.push(comment);
      }
    });

    // Sort top-level comments by score descending
    comments.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return comments;
  }

  // Strategy 2: Legacy comment selectors (flat, no threads)
  const commentContainers = document.querySelectorAll(
    '[data-testid="comment"], [id^="comment-tree-comment-node"]',
  );
  commentContainers.forEach((container) => {
    const authorEl = container.querySelector('a[href*="/user/"]') as HTMLAnchorElement | null;
    const author = authorEl?.textContent?.trim() || '';
    const paragraphs = container.querySelectorAll('p');
    let text = '';
    for (const p of paragraphs) {
      const pText = p.textContent?.trim() || '';
      if (pText.length > 0) {
        text += (text ? ' ' : '') + pText;
      }
    }
    if (text) {
      comments.push({ author, text, score: 0 });
    }
  });

  return comments;
}

/** Extract a single comment from a shreddit-comment element */
function extractSingleComment(el: HTMLElement): Comment | null {
  const author = el.getAttribute('author') || '';
  const score = parseInt(el.getAttribute('score') || '0', 10);

  // Comment body is in [slot="comment"] > .md
  let text = '';
  const commentSlot = el.querySelector('[slot="comment"]');
  if (commentSlot) {
    const cleanSlot = stripMediaElements(commentSlot);
    const md = cleanSlot.querySelector('.md');
    if (md?.textContent?.trim()) {
      text = md.textContent.trim();
    } else {
      // Fallback to paragraphs
      const ps = cleanSlot.querySelectorAll('p');
      for (const p of ps) {
        const pText = p.textContent?.trim() || '';
        if (pText.length > 0) {
          text += (text ? '\n' : '') + pText;
        }
      }
    }
  }

  // Avoid duplicating nested child comments (only top-level slot content)
  if (!text) {
    const md = el.querySelector('[slot="comment"] .md');
    if (md?.textContent?.trim()) text = md.textContent.trim();
  }

  if (text) {
    return { author, text, score };
  }
  return null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/content/dom-adapter.ts
git commit -m "feat: thread-aware comment extraction with nested replies"
```

---

### Task 3: Rewrite getCommentsContent() for Thread Output Format

**Files:**
- Modify: `src/content/dom-adapter.ts:341-358`

- [ ] **Step 1: Implement thread-based output format**

Replace the `getCommentsContent()` function in `src/content/dom-adapter.ts` (lines 341-358) with:

```typescript
export function getCommentsContent(): string {
  const title = findPostTitle();
  let comments = extractComments();

  // Sort by score descending (already sorted in extractComments, but ensure)
  comments.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // Limit to top threads (with their replies) to keep input manageable
  const MAX_THREADS = 20;
  const limited = comments.slice(0, MAX_THREADS);

  let content = `Post: ${title}\n\nDiscussion Threads (top ${limited.length} by score):\n`;

  limited.forEach((c, i) => {
    content += formatCommentThread(c, i + 1, 0);
  });

  return content;
}

/** Format a comment thread with indentation for replies */
function formatCommentThread(comment: Comment, threadNum: number, depth: number): string {
  const indent = depth === 0 ? '' : '  '.repeat(depth) + '↳ ';
  const prefix = depth === 0
    ? `\n---\nThread #${threadNum} — u/${comment.author} (score: ${comment.score ?? 0}):\n`
    : `u/${comment.author} (score: ${comment.score ?? 0}): `;

  let output = depth === 0 ? prefix : indent + prefix;
  output += stripImageUrls(comment.text) + '\n';

  if (comment.replies && comment.replies.length > 0) {
    // Limit replies to keep token count reasonable
    const maxReplies = depth === 0 ? 5 : 3;
    const limitedReplies = comment.replies.slice(0, maxReplies);

    limitedReplies.forEach((reply) => {
      output += formatCommentThread(reply, threadNum, depth + 1);
    });
  }

  return output;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/content/dom-adapter.ts
git commit -m "feat: thread-based comment output format with indentation"
```

---

### Task 4: Update Default Prompts in constants.ts

**Files:**
- Modify: `src/shared/constants.ts:1-27`

- [ ] **Step 1: Rewrite DEFAULT_POST_PROMPT**

Replace `DEFAULT_POST_PROMPT` in `src/shared/constants.ts` (lines 1-10) with:

```typescript
export const DEFAULT_POST_PROMPT =
  `Summarize the following Reddit post in markdown format. Use numbered points (1, 2, 3...) to list key takeaways. Be concise and accurate — no word limit but text should be refined. Do not output a header/title like "Summary" or "Key Points" — start with content directly.

{content}`;
```

- [ ] **Step 2: Rewrite DEFAULT_COMMENT_PROMPT**

Replace `DEFAULT_COMMENT_PROMPT` in `src/shared/constants.ts` (lines 12-27) with:

```typescript
export const DEFAULT_COMMENT_PROMPT =
  `Analyze the following Reddit discussion threads. Provide your response in this structured format:

**Summary:** 2-3 sentences capturing the core discussion topic and outcome.

**Key Themes:** Use numbered list (1, 2, 3...) for 2-4 main discussion themes.

**Consensus:** What most commenters agree on (1-2 sentences).

**Notable Debate:** Key disagreement or contrasting viewpoints with brief context on each stance.

**Representative Comments:** Quote 2-3 noteworthy comments with username, explaining why each is significant.

**Overall Sentiment:** One of: Mostly Positive, Mixed, Mostly Negative, or Neutral — with a brief explanation.

Note: Comments are grouped by discussion threads (parent comment + replies). Consider thread context when analyzing relationships, debates, and sentiment.

{content}`;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/shared/constants.ts
git commit -m "feat: improved prompts inspired by linuxdo-scripts"
```

---

### Task 5: Update System Prompts in prompt-builder.ts

**Files:**
- Modify: `src/background/prompt-builder.ts:13-18`

- [ ] **Step 1: Update getSystemPrompt() function**

Replace the `getSystemPrompt()` function in `src/background/prompt-builder.ts` (lines 13-18) with:

```typescript
export function getSystemPrompt(type: 'post' | 'comments'): string | undefined {
  if (type === 'post') {
    return 'You are summarizing Reddit posts. Use numbered lists for key points. Be concise, factual, and structured. Output in markdown without adding section headers.';
  }
  return 'You are analyzing Reddit comment threads. Maintain objectivity and fairness. Focus on substantive content analysis. Distinguish facts from opinions. Use markdown formatting for structure.';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/background/prompt-builder.ts
git commit -m "feat: update system prompts for new prompt style"
```

---

### Task 6: Add Inspiration Section to README.md

**Files:**
- Modify: `README.md:179-182`

- [ ] **Step 1: Add Inspiration section before License**

Insert before the License section in `README.md`:

```markdown
## Inspiration

This project was inspired by [linuxdo-scripts](https://github.com/anghunk/linuxdo-scripts), an excellent browser extension for the LinuxDo forum that provides AI-powered summarization features.

## License

[MIT](LICENSE)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add inspiration section crediting linuxdo-scripts"
```

---

### Task 7: Add 灵感来源 Section to README.zh-CN.md

**Files:**
- Modify: `README.zh-CN.md:179-182`

- [ ] **Step 1: Add 灵感来源 section before 许可证**

Insert before the 许可证 section in `README.zh-CN.md`:

```markdown
## 灵感来源

本项目灵感来源于 [linuxdo-scripts](https://github.com/anghunk/linuxdo-scripts)，一个为 LinuxDo 论坛提供 AI 总结功能的优秀浏览器扩展。

## 许可证

[MIT](LICENSE)
```

- [ ] **Step 2: Commit**

```bash
git add README.zh-CN.md
git commit -m "docs: 添加灵感来源部分，致谢 linuxdo-scripts"
```

---

### Task 8: Build and Verify

**Files:**
- None (verification only)

- [ ] **Step 1: Build the extension**

Run: `npm run build`
Expected: Successful build, output in `.output/chrome-mv3/`

- [ ] **Step 2: Build Firefox version**

Run: `npm run build:firefox`
Expected: Successful build, output in `.output/firefox-mv2/`

- [ ] **Step 3: Final commit for spec document**

```bash
git add docs/superpowers/specs/2026-03-30-prompt-and-comment-structure-design.md
git commit -m "docs: add prompt and comment structure design spec"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✓ Comment type with replies field — Task 1
- ✓ Thread-aware extraction — Task 2
- ✓ Thread output format — Task 3
- ✓ Post prompt (numbered list) — Task 4
- ✓ Comment prompt (deep analysis) — Task 4
- ✓ System prompts update — Task 5
- ✓ README inspiration (EN) — Task 6
- ✓ README 灵感来源 (CN) — Task 7

**2. Placeholder scan:** No TBD/TODO found. All code is complete.

**3. Type consistency:**
- `Comment` type defined in Task 1 matches usage in Tasks 2, 3
- `extractSingleComment()` returns `Comment | null` — handled in Task 2
- `formatCommentThread()` parameters match Comment type — Task 3