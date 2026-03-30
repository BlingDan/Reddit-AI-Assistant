export const DEFAULT_POST_PROMPT =
  'Summarize the following Reddit post concisely. Capture the key point, context, and any questions being asked. Keep it under 3 sentences.\n\n{content}';

export const DEFAULT_COMMENT_PROMPT =
  'Analyze the following Reddit comment thread. Identify the main themes, areas of consensus, notable disagreements, and the overall sentiment. Structure the summary with clear sections: Top Themes, Consensus, Notable Debate.\n\n{content}';

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
    header: '#6366f1',
    headerText: '#ffffff',
    label: 'AI Summary',
  },
  comments: {
    bg: '#f0fdf4',
    header: '#22c55e',
    headerText: '#ffffff',
    label: 'Comment Summary',
  },
} as const;

export const MAX_RETRIES = 3;
export const RETRY_DELAYS = [1000, 2000, 4000];
