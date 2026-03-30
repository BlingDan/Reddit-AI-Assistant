export const DEFAULT_POST_PROMPT =
  `Summarize the following Reddit post in markdown format. Use numbered points (1, 2, 3...) to list key takeaways. Be concise and accurate — no word limit but text should be refined. Do not output a header/title like "Summary" or "Key Points" — start with content directly.

{content}`;

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

export const DEFAULT_POST_PROMPT_ZH =
  `请总结以下 Reddit 帖子，使用 markdown 格式返回。通过编号列表（1, 2, 3...）列出核心要点。文字精炼、简洁、准确，无字数限制。不要输出标题（如"总结"、"核心要点"等），直接输出正文内容。请使用简体中文回复。

{content}`;

export const DEFAULT_COMMENT_PROMPT_ZH =
  `分析以下 Reddit 讨论帖子，请使用简体中文回复。按以下结构输出：

**摘要：** 2-3 句话概括讨论的核心话题和结论。

**主要主题：** 用编号列表列出 2-4 个主要讨论主题。

**共识：** 大多数评论者同意的观点（1-2 句话）。

**主要争议：** 关键分歧或对立观点，简要说明各方立场。

**代表性评论：** 引用 2-3 条有代表性的评论（附用户名），简述每条的代表性和价值。

**整体氛围：** 从以下选项中选择一个：偏积极、褒贬不一、偏消极、或中立 — 并简要说明。

注意：评论按讨论线程分组（主评论 + 回复），请结合线程上下文分析关系和争议。

{content}`;

export const DEFAULT_SETTINGS = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o-mini',
  postPrompt: DEFAULT_POST_PROMPT,
  commentPrompt: DEFAULT_COMMENT_PROMPT,
} as const;

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

export const MAX_RETRIES = 3;
export const RETRY_DELAYS = [1000, 2000, 4000];
