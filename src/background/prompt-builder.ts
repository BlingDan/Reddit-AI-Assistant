import { DEFAULT_POST_PROMPT, DEFAULT_COMMENT_PROMPT } from '@/shared/constants';

export function buildPostPrompt(content: string, customPrompt?: string): string {
  const template = customPrompt?.trim() || DEFAULT_POST_PROMPT;
  return template.replace('{content}', content);
}

export function buildCommentPrompt(content: string, customPrompt?: string): string {
  const template = customPrompt?.trim() || DEFAULT_COMMENT_PROMPT;
  return template.replace('{content}', content);
}

export function getSystemPrompt(type: 'post' | 'comments'): string | undefined {
  if (type === 'comments') {
    return 'You are analyzing Reddit comments. Be concise and structured. Use markdown headers and bullet points for clarity. Focus on the most important themes and insights.';
  }
  return undefined;
}
