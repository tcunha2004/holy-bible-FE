export type MessageRole = 'user' | 'assistant';

export interface AiSession {
  id: string;
  title: string | null;
  createdAt: string;
}

export interface AiMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ExplainRequest {
  message: string;
}

export interface ExplainResponse {
  explanation: string;
}
