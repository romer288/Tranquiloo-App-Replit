/**
 * Advanced AI Chat Service with RAG
 * Integrates with existing chat but uses new research-backed AI
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

export async function sendAIMessage(
  message: string,
  conversationId: string,
  userId: string,
  history: AIMessage[] = []
): Promise<AIResponse> {
  const response = await fetch('/api/ai-chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId, userId, history }),
  });

  if (!response.ok) throw new Error('AI chat failed');
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
  const response = await fetch('/api/ai-chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId, userId, history }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error('No reader');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'content' && parsed.chunk) onChunk(parsed.chunk);
          else if (parsed.type === 'done') onComplete(parsed);
          else if (parsed.type === 'error') onError(parsed.error);
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }
  }
}

export function detectCrisisKeywords(message: string): boolean {
  const keywords = ['suicide', 'kill myself', 'want to die', 'self-harm', 'hurt myself'];
  return keywords.some(kw => message.toLowerCase().includes(kw));
}
