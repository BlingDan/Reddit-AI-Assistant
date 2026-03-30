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
  if (type === 'post') {
    return 'You are summarizing Reddit posts. Use numbered lists for key points. Be concise, factual, and structured. Output in markdown without adding section headers.';
  }
  return 'You are analyzing Reddit comment threads. Maintain objectivity and fairness. Focus on substantive content analysis. Distinguish facts from opinions. Use markdown formatting for structure.';
}
