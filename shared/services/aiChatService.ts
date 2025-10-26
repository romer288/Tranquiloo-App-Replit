/**
 * Shared AI chat service used by both web (PWA) and mobile (React Native).
 * Handles base URL configuration so the same logic can run in browsers,
 * emulators, and production mobile builds.
 */

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AIResponse {
  response: string;
  researchUsed: string[];
  shouldAlert: boolean;
}

let apiBaseUrl: string | undefined;

/**
 * Build a fully-qualified URL for API requests.
 */
const buildUrl = (path: string) => {
  const base = apiBaseUrl ?? detectDefaultBaseUrl();
  if (!base || path.startsWith('http')) {
    return path;
  }

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const detectDefaultBaseUrl = () => {
  // Allow runtime overrides (used by React Native config).
  const runtime = typeof globalThis !== 'undefined'
    ? (globalThis as any).__TRANQUILOO_API_URL
    : undefined;

  if (runtime) return runtime as string;

  // Check environment variables when available (Node, Metro bundler).
  if (typeof process !== 'undefined') {
    const envUrl =
      process.env.TRANQUILOO_API_URL ||
      process.env.API_BASE_URL ||
      process.env.API_URL;
    if (envUrl) return envUrl;
  }

  // Default behaviour in the browser: relative path to same origin.
  if (typeof document !== 'undefined') {
    return '';
  }

  // Fallback for native/emulator environments.
  return 'http://localhost:5000';
};

/**
 * Allow apps to override the API base URL at runtime.
 */
export const setApiBaseUrl = (url: string) => {
  if (!url) return;
  apiBaseUrl = url.replace(/\/$/, '');
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__TRANQUILOO_API_URL = apiBaseUrl;
  }
};

export async function sendAIMessage(
  message: string,
  conversationId: string,
  userId: string,
  history: AIMessage[] = []
): Promise<AIResponse> {
  const response = await fetch(buildUrl('/api/ai-chat/message'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId, userId, history }),
  });

  if (!response.ok) {
    throw new Error(`AI chat failed with status ${response.status}`);
  }

  return await response.json();
}

export async function streamAIMessage(
  message: string,
  conversationId: string,
  userId: string,
  history: AIMessage[],
  onChunk: (chunk: string) => void,
  onComplete: (data: { researchUsed: string[]; shouldAlert: boolean }) => void,
  onError: (error: string) => void
): Promise<void> {
  const response = await fetch(buildUrl('/api/ai-chat/stream'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId, userId, history }),
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming not supported');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'content' && parsed.chunk) {
            onChunk(parsed.chunk);
          } else if (parsed.type === 'done') {
            onComplete(parsed);
          } else if (parsed.type === 'error') {
            onError(parsed.error);
          }
        } catch (error) {
          console.error('Stream parse error:', error);
        }
      }
    }
  }
}

export function detectCrisisKeywords(message: string): boolean {
  const keywords = ['suicide', 'kill myself', 'want to die', 'self-harm', 'hurt myself'];
  return keywords.some(kw => message.toLowerCase().includes(kw));
}

