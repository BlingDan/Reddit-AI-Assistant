export interface Comment {
  author: string;
  text: string;
  score?: number;
}

export interface SummarizePostRequest {
  type: 'SUMMARIZE_POST';
  content: string;
}

export interface SummarizeCommentsRequest {
  type: 'SUMMARIZE_COMMENTS';
  content: string;
}

export interface TestConnectionRequest {
  type: 'TEST_CONNECTION';
}

export interface FetchModelsRequest {
  type: 'FETCH_MODELS';
}

export type CSRequest = SummarizePostRequest | SummarizeCommentsRequest | TestConnectionRequest | FetchModelsRequest;

export interface StreamTokenMessage {
  type: 'STREAM_TOKEN';
  token: string;
}

export interface StreamDoneMessage {
  type: 'STREAM_DONE';
  totalTokens: number;
  fullText?: string;
}

export interface FetchModelsResultMessage {
  type: 'FETCH_MODELS_RESULT';
  models: string[];
}

export interface ErrorMessage {
  type: 'ERROR';
  message: string;
  code: string;
}

export type BGResponse = StreamTokenMessage | StreamDoneMessage | FetchModelsResultMessage | ErrorMessage;

// Port-based streaming messages (content <-> background)
export type PortMessageType = 'SUMMARIZE_POST' | 'SUMMARIZE_COMMENTS';

export interface PortStartMessage {
  type: PortMessageType;
  content: string;
}

export interface PortStreamToken {
  type: 'STREAM_TOKEN';
  token: string;
}

export interface PortStreamDone {
  type: 'STREAM_DONE';
  totalTokens: number;
  fullText: string;
}

export interface PortError {
  type: 'ERROR';
  message: string;
  code: string;
}

export type PortMessage = PortStreamToken | PortStreamDone | PortError;

export interface ApiSettings {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface PromptSettings {
  postPrompt: string;
  commentPrompt: string;
}

export type Settings = ApiSettings & PromptSettings;
