# Prompt Improvement and Comment Structure Design

**Date:** 2026-03-30
**Status:** APPROVED
**Inspiration:** [linuxdo-scripts](https://github.com/anghunk/linuxdo-scripts) by anghunk

## Overview

Improve the default prompts for post and comment summarization, and restructure comment extraction to capture threaded discussions (parent comment + replies) instead of flat top-level comments only.

## Goals

1. **Better prompts** — Move from simple 3-field format to structured, analysis-rich prompts inspired by linuxdo-scripts
2. **Thread-aware comments** — Capture comment threads (parent + replies) to preserve discussion context and relationships
3. **Attribution** — Acknowledge linuxdo-scripts as the inspiration source in README

---

## 1. Comment Data Structure

### Current State

```ts
interface Comment {
  author: string;
  text: string;
  score?: number;
}
```

Comments are extracted flat — only top-level `shreddit-comment` elements, sorted by score, max 50.

### New Design

```ts
interface Comment {
  author: string;
  text: string;
  score?: number;
  replies?: Comment[];  // Nested replies within this comment thread
}
```

---

## 2. Comment Extraction Logic

### File: `src/content/dom-adapter.ts`

**`extractComments()` rewrite:**

- Identify top-level `shreddit-comment` elements (those not nested inside another comment's replies)
- For each top-level comment, recursively extract child `shreddit-comment` elements as `replies`
- Sort top-level comments by score descending
- Within each thread, sort replies by score descending
- Limit: 20 top-level threads (with their replies) to keep token count manageable

**`getCommentsContent()` rewrite:**

Output format — thread-based with visual hierarchy:

```
Post: {title}

Discussion Threads (top 20 by score):

Thread #1 — u/author1 (score: 42):
Main comment text here...
  ↳ u/replyer1 (score: 15): Reply text...
  ↳ u/replyer2 (score: 8): Another reply...
    ↳ u/subreply (score: 3): Deeper reply...

Thread #2 — u/author2 (score: 38):
...
```

---

## 3. Prompt Redesign

### File: `src/shared/constants.ts`

#### Post Prompt (Numbered List Style)

```ts
export const DEFAULT_POST_PROMPT =
`Summarize the following Reddit post in markdown format. Use numbered points (1, 2, 3...) to list key takeaways. Be concise and accurate — no word limit but text should be refined. Do not output a header/title like "Summary" or "Key Points" — start with content directly.

{content}`;
```

**System prompt (post):**
```
You are summarizing Reddit posts. Use numbered lists for key points. Be concise, factual, and structured. Output in markdown without adding section headers.
```

#### Comment Prompt (Deep Analysis Style)

Inspired by linuxdo-scripts `prompt3`:

```ts
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

**System prompt (comments):**
```
You are analyzing Reddit comment threads. Maintain objectivity and fairness. Focus on substantive content analysis. Distinguish facts from opinions. Use markdown formatting for structure.
```

---

## 4. Prompt Builder Update

### File: `src/background/prompt-builder.ts`

Update `getSystemPrompt()` to return the new system prompts defined above.

---

## 5. README Attribution

### Files: `README.md` and `README.zh-CN.md`

Add an "Inspiration" / "灵感来源" section:

**English:**
```markdown
## Inspiration

This project was inspired by [linuxdo-scripts](https://github.com/anghunk/linuxdo-scripts), an excellent browser extension for the LinuxDo forum that provides AI-powered summarization features.
```

**Chinese:**
```markdown
## 灵感来源

本项目灵感来源于 [linuxdo-scripts](https://github.com/anghunk/linuxdo-scripts)，一个为 LinuxDo 论坛提供 AI 总结功能的优秀浏览器扩展。
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/shared/types.ts` | Add `replies?: Comment[]` to `Comment` interface |
| `src/shared/constants.ts` | Rewrite `DEFAULT_POST_PROMPT`, `DEFAULT_COMMENT_PROMPT` |
| `src/content/dom-adapter.ts` | Rewrite `extractComments()` and `getCommentsContent()` for thread extraction |
| `src/background/prompt-builder.ts` | Update system prompts |
| `README.md` | Add Inspiration section |
| `README.zh-CN.md` | Add 灵感来源 section |

---

## Implementation Notes

- Thread extraction should handle Reddit's nested `shreddit-comment` DOM structure correctly
- Consider depth limit for replies (e.g., max 2 levels deep to avoid excessive tokens)
- The new prompts are longer but produce richer, more useful summaries
- User-customizable prompts remain supported — these are just better defaults