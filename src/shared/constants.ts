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
