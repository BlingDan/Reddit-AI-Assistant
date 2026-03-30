import type { Comment } from '@/shared/types';

/** Maximum total characters for comments content (token budget ~4k tokens) */
const COMMENT_CHAR_BUDGET = 16000;
/** Maximum length of a single comment before truncation */
const MAX_COMMENT_LENGTH = 1000;
/** Maximum number of top-level threads to consider */
const MAX_TOP_LEVEL_THREADS = 30;

/** Truncate a comment to a max length, trying to break at sentence boundaries */
function truncateComment(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  // Try to break at last sentence boundary
  const lastPeriod = Math.max(truncated.lastIndexOf('. '), truncated.lastIndexOf('! '), truncated.lastIndexOf('? '));
  if (lastPeriod > maxLen * 0.5) {
    return truncated.slice(0, lastPeriod + 1) + ' [...]';
  }
  return truncated.trimEnd() + ' [...]';
}

/** Select comments with diversity — top + middle + low-score representatives */
function selectDiverseComments(comments: Comment[], budget: number): Comment[] {
  if (comments.length === 0) return [];

  const selected: Comment[] = [];
  let usedChars = 0;

  // Tier 1: Top 5 by score (must have)
  const topTier = comments.slice(0, Math.min(5, comments.length));
  for (const c of topTier) {
    const truncated = { ...c, text: truncateComment(c.text, MAX_COMMENT_LENGTH) };
    const cost = truncated.text.length + 50; // overhead for formatting
    if (usedChars + cost > budget * 0.5) break;
    selected.push(truncated);
    usedChars += cost;
  }

  // Tier 2: Middle-score comments (next 10)
  const midStart = topTier.length;
  const midEnd = Math.min(midStart + 10, comments.length);
  const midTier = comments.slice(midStart, midEnd);
  for (const c of midTier) {
    const truncated = { ...c, text: truncateComment(c.text, MAX_COMMENT_LENGTH) };
    const cost = truncated.text.length + 50;
    if (usedChars + cost > budget * 0.8) break;
    selected.push(truncated);
    usedChars += cost;
  }

  // Tier 3: Low-score but diverse (sample from bottom half, up to 5)
  const bottomStart = Math.floor(comments.length / 2);
  const bottomTier = comments.slice(bottomStart);
  // Pick evenly spaced samples for diversity
  const sampleCount = Math.min(5, bottomTier.length);
  for (let i = 0; i < sampleCount; i++) {
    const idx = Math.floor(i * bottomTier.length / sampleCount);
    const c = bottomTier[idx];
    const truncated = { ...c, text: truncateComment(c.text, 500) };
    const cost = truncated.text.length + 50;
    if (usedChars + cost > budget) break;
    selected.push(truncated);
    usedChars += cost;
  }

  // Sort final selection by score for presentation
  selected.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return selected;
}

export function getCommentsContent(): string {
  const title = findPostTitle();
  const allComments = extractComments();
  const totalComments = allComments.length;
  const uniqueAuthors = new Set(allComments.map(c => c.author)).size;

  // Select diverse set within budget
  const selected = selectDiverseComments(allComments, COMMENT_CHAR_BUDGET);

  let content = `Post: ${title}\n`;
  content += `[Stats: ${totalComments} comments from ${uniqueAuthors} users, showing ${selected.length} representative threads]\n`;

  selected.forEach((c, i) => {
    content += `\n---\nThread #${i + 1} — u/${c.author} (score: ${c.score ?? 0}):\n${stripImageUrls(c.text)}\n`;
  });

  return content;
}

/**
 * Reddit "shreddit" DOM adapter — based on actual page analysis (2026-03).
 *
 *   <shreddit-post author="username" post-title="..." score="0" id="t3_xxx" ...>
 *     <div slot="credit-bar" id="pdp-credit-bar">
 *       <span slot="authorName">
 *         <a href="/user/username/">username</a>
 *       </span>
 *     </div>
 *     <h1 slot="title">Post Title</h1>
 *     <shreddit-post-text-body slot="text-body">
 *       <div slot="text-body">
 *         <div data-post-click-location="text-body">
 *           <div class="md"><p>Post body content</p></div>
 *         </div>
 *       </div>
 *     </shreddit-post-text-body>
 *     <faceplate-dropdown-menu slot="ssr-share-button">
 *       <button>Share</button>
 *     </faceplate-dropdown-menu>
 *   </shreddit-post>
 *
 *   <shreddit-comment author="user" score="5" thingid="t1_xxx" ...>
 *     <div slot="commentMeta"><a href="/user/user/">user</a></div>
 *     <div slot="comment">
 *       <div class="md"><p>Comment body</p></div>
 *     </div>
 *     <div slot="actionRow">...</div>
 *   </shreddit-comment>
 *
 * IMPORTANT: On PDP there is NO traditional action bar row with multiple buttons.
 * The only visible action button is the Share dropdown inside shreddit-post.
 * Our buttons should be inserted as siblings AFTER the shreddit-post element.
 */

/**
 * Find the injection point for our UI buttons.
 *
 * On PDP we insert AFTER <shreddit-post>, between the post and the comments.
 * Returns the parent element that contains the post, so we can insertBefore(nextSibling).
 */
function findActionBar(): HTMLElement | null {
  // Strategy 1: Find shreddit-post on PDP — insert after it
  const post = document.querySelector('shreddit-post');
  if (post?.parentElement) {
    // Check if shreddit-post has actual content (title exists)
    const title = post.querySelector('h1[slot="title"], [slot="title"]');
    if (title && title.textContent?.trim()) {
      return createInjectionContainer(post as HTMLElement);
    }
    // shreddit-post exists but content not loaded yet
    return null;
  }

  // Strategy 2: Find share button, walk up to find a button row (feed view)
  const allButtons = document.querySelectorAll('button, a, [role="button"]');
  for (const btn of allButtons) {
    const text = (btn.textContent || '').toLowerCase().trim();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    if (text === 'share' || ariaLabel.includes('share')) {
      let parent: HTMLElement | null = btn.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        const btnCount = parent.querySelectorAll('button, [role="button"]').length;
        if (btnCount >= 2) {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
  }

  // Strategy 3: Legacy fallback
  const fallbacks = [
    '[data-testid="post-container"] [role="menubar"]',
    '[slot="post-actions-bar"]',
  ];
  for (const sel of fallbacks) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return el;
  }

  return null;
}

/**
 * Create a container inserted right after the post element on PDP.
 * This acts as our "action bar" where buttons get appended.
 */
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

function findPostTitle(): string {
  // Strategy 1: shreddit-post attribute (most reliable)
  const post = document.querySelector('shreddit-post');
  if (post) {
    const attr = post.getAttribute('post-title');
    if (attr?.trim()) return attr.trim();

    // h1[slot="title"] inside post
    const h1 = post.querySelector('h1[slot="title"]');
    if (h1?.textContent?.trim()) return h1.textContent.trim();
  }

  // Strategy 2: Generic h1
  const h1 = document.querySelector('h1');
  if (h1?.textContent?.trim()) return h1.textContent.trim();

  return '';
}

function findPostBody(): string {
  const post = document.querySelector('shreddit-post');
  if (!post) return '';

  // Strategy 1: shreddit-post-text-body > div[data-post-click-location="text-body"]
  const textBody = post.querySelector('shreddit-post-text-body');
  if (textBody) {
    // The actual content is in a .md div
    const md = textBody.querySelector('.md');
    if (md) {
      const clean = stripMediaElements(md);
      if (clean.textContent?.trim()) return clean.textContent.trim();
    }

    // Try the inner content div
    const contentDiv = textBody.querySelector('[data-post-click-location="text-body"]');
    if (contentDiv) {
      const clean = stripMediaElements(contentDiv);
      if (clean.textContent?.trim()) return clean.textContent.trim();
    }
  }

  // Strategy 2: [slot="text-body"] fallback
  const slotBody = post.querySelector('[slot="text-body"]');
  if (slotBody) {
    const md = slotBody.querySelector('.md');
    if (md) {
      const clean = stripMediaElements(md);
      if (clean.textContent?.trim()) return clean.textContent.trim();
    }
    const clean = stripMediaElements(slotBody);
    if (clean.textContent?.trim()) return clean.textContent.trim();
  }

  return '';
}

function findPostAuthor(): string {
  // Strategy 1: shreddit-post author attribute
  const post = document.querySelector('shreddit-post');
  if (post) {
    const authorAttr = post.getAttribute('author');
    if (authorAttr) return `u/${authorAttr}`;

    // [slot="authorName"] a
    const authorEl = post.querySelector('[slot="authorName"] a, span[slot="authorName"] a');
    if (authorEl) {
      const href = (authorEl as HTMLAnchorElement).href;
      const match = href.match(/\/user\/([^/?#]+)/);
      if (match) return `u/${match[1]}`;
      const text = authorEl.textContent?.trim();
      if (text) return text.startsWith('u/') ? text : `u/${text}`;
    }
  }

  // Strategy 2: Generic a[href*="/user/"]
  const authorLink = document.querySelector('a[href*="/user/"]') as HTMLAnchorElement | null;
  if (authorLink) {
    const match = authorLink.href.match(/\/user\/([^/?#]+)/);
    if (match) return `u/${match[1]}`;
    const text = authorLink.textContent?.trim();
    if (text) return `u/${text}`;
  }

  return '';
}

function extractComments(): Comment[] {
  const comments: Comment[] = [];

  // Strategy 1: shreddit-comment custom elements
  const shredditComments = document.querySelectorAll('shreddit-comment');
  if (shredditComments.length > 0) {
    shredditComments.forEach((el) => {
      const comment = extractSingleComment(el as HTMLElement);
      if (comment) {
        comments.push(comment);
      }
    });

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
  const author = el.getAttribute('author') || '[unknown]';
  const score = parseInt(el.getAttribute('score') || '0', 10);

  let text = '';
  const commentSlot = el.querySelector('[slot="comment"]');
  if (commentSlot) {
    const cleanSlot = stripMediaElements(commentSlot);
    const md = cleanSlot.querySelector('.md');
    if (md?.textContent?.trim()) {
      text = md.textContent.trim();
    } else {
      const ps = cleanSlot.querySelectorAll('p');
      for (const p of ps) {
        const pText = p.textContent?.trim() || '';
        if (pText.length > 0) {
          text += (text ? '\n' : '') + pText;
        }
      }
    }
  }

  if (!text) {
    const md = el.querySelector('[slot="comment"] .md');
    if (md?.textContent?.trim()) text = md.textContent.trim();
  }

  if (text) {
    return { author, text, score };
  }
  return null;
}

export { findActionBar, findPostTitle, findPostBody, findPostAuthor, extractComments };

/** Remove media elements from a cloned container before extracting text */
function stripMediaElements(container: Element): Element {
  const clone = container.cloneNode(true) as Element;
  const selectors = [
    'img', 'video', 'iframe', 'figure', 'svg',
    'shreddit-player', 'shreddit-player-2', 'shreddit-gallery',
    'gallery-carousel', '.rte-media',
  ];
  for (const sel of selectors) {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  }
  return clone;
}

/** Strip common image-hosting URLs from text */
function stripImageUrls(text: string): string {
  return text
    .replace(/https?:\/\/(?:i\.redd\.it|preview\.redd\.it|external-preview\.redd\.it|i\.imgur\.com|www\.giphy\.com|media\.giphy\.com)\/\S+/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function getFullPostContent(): string {
  const title = findPostTitle();
  const body = findPostBody();
  const author = findPostAuthor();

  let content = `Title: ${title}\nAuthor: ${author}`;
  if (body) content += `\n\n${stripImageUrls(body)}`;
  return content;
}
