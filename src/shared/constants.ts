export const DEFAULT_POST_PROMPT =
  `Summarize the following Reddit post. Provide your response in this format:

**Key Point:** One sentence capturing the main idea or question.
**Context:** 1-2 sentences of necessary background.
**Questions Asked:** List any explicit questions (or "None" if not applicable).

Keep the summary concise and under 4 sentences total.

{content}`;

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
