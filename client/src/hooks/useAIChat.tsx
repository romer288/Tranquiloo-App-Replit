/**
 * Advanced AI Chat Hook with RAG
 * Integrates research-backed AI into existing chat system
 */
import { useState, useCallback } from 'react';
import { sendAIMessage, streamAIMessage, detectCrisisKeywords, AIMessage } from '@/services/aiChatService';
import { useLanguage } from '@/context/LanguageContext';

export function useAIChat() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [researchCited, setResearchCited] = useState<string[]>([]);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const { t } = useLanguage();

  /**
   * Get AI response with research context
   */
  const getAIResponse = useCallback(async (
    userMessage: string,
    conversationId: string,
    userId: string,
    history: AIMessage[] = []
  ): Promise<string> => {
    setIsGenerating(true);
    setResearchCited([]);
    setCrisisDetected(false);

    try {
      // Client-side crisis check
      if (detectCrisisKeywords(userMessage)) {
        setCrisisDetected(true);
        return `I'm very concerned about what you're sharing. Please reach out for immediate help:

🆘 Call 988 - Suicide & Crisis Lifeline (US)
📱 Text HOME to 741741 - Crisis Text Line
🚨 Call 911 - For emergencies

You don't have to face this alone. Professional help is available 24/7.`;
      }

      // Get AI response with research papers
      const result = await sendAIMessage(userMessage, conversationId, userId, history);

      setResearchCited(result.researchUsed);
      setCrisisDetected(result.shouldAlert);

      return result.response;

    } catch (error: any) {
      console.error('AI response error:', error);
      return t('chat.error.tryAgain');
    } finally {
      setIsGenerating(false);
    }
  }, [t]);

  /**
   * Get streaming AI response
   */
  const getStreamingAIResponse = useCallback(async (
    userMessage: string,
    conversationId: string,
    userId: string,
    history: AIMessage[],
    onChunk: (text: string) => void
  ): Promise<void> => {
    setIsGenerating(true);
    setResearchCited([]);
    setCrisisDetected(false);

    // Client-side crisis check
    if (detectCrisisKeywords(userMessage)) {
      setCrisisDetected(true);
      const crisisMsg = `I'm very concerned. Please call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 right now.`;
      onChunk(crisisMsg);
      setIsGenerating(false);
      return;
    }

    try {
      await streamAIMessage(
        userMessage,
        conversationId,
        userId,
        history,
        onChunk,
        (data) => {
          setResearchCited(data.researchUsed);
          setCrisisDetected(data.shouldAlert);
          setIsGenerating(false);
        },
        (error) => {
          console.error('Streaming error:', error);
          setIsGenerating(false);
        }
      );
    } catch (error) {
      console.error('Streaming AI error:', error);
      setIsGenerating(false);
    }
  }, []);

  return {
    getAIResponse,
    getStreamingAIResponse,
    isGenerating,
    researchCited,
    crisisDetected,
  };
}
