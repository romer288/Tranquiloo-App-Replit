import { useEffect, useState, useRef } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatAnalysis } from '@/hooks/useChatAnalysis';
import { chatService, ChatSession } from '@/services/chatService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  createUserMessage,
  createAIMessage,
  getConversationHistory,
  getFallbackResponse,
  getContextualResponse,
  shouldSwitchToMonica
} from '@/utils/chatUtils';
import { detectLanguage } from '@/utils/languageDetection';
import { useAIChat } from '@/hooks/useAIChat';

const normalizeLanguageCode = (code: unknown): 'en' | 'es' | undefined =>
  code === 'en' || code === 'es' ? code : undefined;

export const useChat = (sessionId?: string | null, manualLanguage?: 'en' | 'es' | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    currentSession,
    aiCompanion,
    currentLanguage,
    switchToMonica,
    setCurrentSession
  } = useChatSession(sessionId);

  const {
    messages,
    inputText,
    setInputText,
    isTyping,
    setIsTyping,
    scrollRef,
    addWelcomeMessage,
    addMessage,
    updateMessage,
    editMessage,
    setMessages
  } = useChatMessages();

  const { isAnalyzing, processMessageAnalysis } = useChatAnalysis();
  const { getAIResponse, isGenerating, researchCited, crisisDetected } = useAIChat();

  // Message processing queue to prevent glitches with rapid messages
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const messageQueueRef = useRef<string[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const loadedSessionIdRef = useRef<string | null>(null);
  const lastMessageRef = useRef<string>('');
  const pendingMessagesRef = useRef<Set<string>>(new Set());
  const [lastMismatchMessage, setLastMismatchMessage] = useState<string | null>(null);

  // Clear messages when sessionId changes (switching between chats)
  useEffect(() => {
    if (sessionId) {
      setMessages([]); // Clear messages immediately when switching to a different session
    } else {
      // Reset loaded session ref when starting new chat
      loadedSessionIdRef.current = null;
    }
  }, [sessionId, setMessages]);

  // Load messages when session ID is provided
  const { data: sessionMessages } = useQuery({
    queryKey: [`/api/chat-sessions/${sessionId}/messages`],
    queryFn: async () => {
      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 0, // Always fetch fresh data when session changes
  });

  // Load session details when session ID is provided
  const { data: sessionDetails } = useQuery({
    queryKey: [`/api/chat-sessions/${sessionId}`],
    queryFn: async () => {
      const response = await fetch(`/api/chat-sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 0,
  });

  // Load messages from existing session
  useEffect(() => {
    if (sessionId && sessionMessages && sessionDetails && Array.isArray(sessionMessages)) {
      // Only load if this is a different session than what we already loaded
      if (loadedSessionIdRef.current !== sessionId) {
        setIsLoadingSession(true);
        console.log('Loading session messages for session:', sessionId, sessionMessages.length, 'messages');

        // Convert API messages to chat format and ensure unique IDs
        console.log('📥 Loading session messages:', sessionMessages.length, 'total messages');
        const loadedMessages = sessionMessages
          .filter((msg: any, index: number, arr: any[]) => {
            // Remove duplicate messages with same ID
            const isDuplicate = arr.findIndex(m => m.id === msg.id) !== index;
            if (isDuplicate) {
              console.log('🚫 Removing duplicate by ID:', msg.id, msg.content?.substring(0, 30));
            }
            return !isDuplicate;
          })
          .map((msg: any) => {
            const normalizedLanguage = normalizeLanguageCode(
              (msg as any)?.language ??
              (msg as any)?.detectedLanguage ??
              (msg?.anxietyAnalysis?.detectedLanguage)
            );

            return {
              id: msg.id,
              text: msg.content,
              sender: msg.sender === 'user' ? 'user' : (sessionDetails as any).aiCompanion || 'vanessa',
              timestamp: new Date(msg.createdAt),
              language: normalizedLanguage,
              anxietyAnalysis: msg.anxietyAnalysis
            };
          });

        // Sort messages by timestamp to ensure correct order
        loadedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Additional deduplication by content and timestamp to catch database duplicates
        console.log('📋 After ID deduplication:', loadedMessages.length, 'messages');
        const uniqueMessages = loadedMessages.filter((msg, index, arr) => {
          const duplicateIndex = arr.findIndex(m =>
            m.text === msg.text &&
            m.sender === msg.sender &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000
          );
          const isDuplicate = duplicateIndex !== index;
          if (isDuplicate) {
            console.log('🚫 Removing duplicate by content:', msg.text?.substring(0, 30), 'sender:', msg.sender);
          }
          return !isDuplicate;
        });

        console.log('✅ Final unique messages:', uniqueMessages.length, 'messages');

        setMessages(uniqueMessages);
        setCurrentSession(sessionDetails as ChatSession);
        loadedSessionIdRef.current = sessionId;
        setIsLoadingSession(false);
      }
    }
  }, [sessionId, sessionMessages, sessionDetails, setMessages, setCurrentSession]);

  // Initialize welcome message when session is created (only if not loading existing session)
  useEffect(() => {
    if (currentSession && messages.length === 0 && !sessionId && !isLoadingSession) {
      const welcomeMessage = addWelcomeMessage(aiCompanion);
      
      // Save welcome message to database with userId and same ID as frontend
      const userId = (user as any)?.id || 'anonymous';
      chatService.sendMessage(currentSession.id, welcomeMessage.text, 'assistant', userId, welcomeMessage.id)
        .catch((error: any) => console.error('Failed to save welcome message:', error));
    }
  }, [currentSession, aiCompanion, sessionId, isLoadingSession]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    console.log('🚀 handleSendMessage called with:', textToSend, 'currentSession:', currentSession?.id);

    if (!textToSend || !currentSession) {
      console.log('🚫 Exiting early - no text or session');
      return;
    }

    // Language mismatch will be checked after AI analysis to use AI-detected language

    // Prevent multiple calls - check again after async operations
    if (isProcessingMessage) {
      console.log('🚫 Already processing message, ignoring duplicate call');
      return;
    }

    // Prevent duplicate messages (same content sent quickly)
    if (lastMessageRef.current === textToSend) {
      return;
    }

    // Check if this exact message is currently being sent to API
    const messageKey = `${currentSession.id}:${textToSend}`;
    if (pendingMessagesRef.current.has(messageKey)) {
      return;
    }

    lastMessageRef.current = textToSend;
    pendingMessagesRef.current.add(messageKey);

    const fallbackLanguageForShortInputs: 'en' | 'es' = (manualLanguage ?? currentLanguage ?? 'en');
    const fallbackDetectedLanguage = detectLanguage(textToSend, {
      fallbackLanguage: fallbackLanguageForShortInputs,
    });

    // Check if we should switch to Monica
    if (shouldSwitchToMonica(textToSend, aiCompanion)) {
      // First, add the user's message to the chat
      const userMessage = createUserMessage(textToSend, fallbackDetectedLanguage);
      addMessage(userMessage);
      setInputText('');

      const monicaSession = await switchToMonica();
      if (monicaSession) {
        // Save the user's message to Monica's session
        const userId = (user as any)?.id || 'anonymous';
        await chatService.sendMessage(monicaSession.id, textToSend, 'user', userId, userMessage.id);

        // Add Monica's intro message
        const monicaIntroMessage = createAIMessage(
          "¡Hola! Soy Mónica, tu compañera de apoyo para la ansiedad. Estoy aquí para brindarte apoyo clínico informado usando los enfoques terapéuticos más avanzados. ¿Cómo te sientes hoy?",
          'monica',
          'es'
        );

        addMessage(monicaIntroMessage);
        await chatService.sendMessage(monicaSession.id, monicaIntroMessage.text, 'assistant', userId, monicaIntroMessage.id);
      }
      return;
    }

    setIsProcessingMessage(true);
    
    try {
      const conversationHistory = getConversationHistory(messages);
      const userMessage = createUserMessage(textToSend, fallbackDetectedLanguage);
      
      addMessage(userMessage);
      setInputText('');
      setIsTyping(true);

      const userId = (user as any)?.id || 'anonymous';

      // Parallel processing: Start all async operations simultaneously
      const parallelTasks = [
        // Task 1: Save user message to database (don't wait for this)
        chatService.sendMessage(currentSession.id, textToSend, 'user', userId, userMessage.id)
          .then(() => {
            pendingMessagesRef.current.delete(messageKey);
          })
          .catch((error: any) => {
            console.error('Failed to save user message:', error);
            pendingMessagesRef.current.delete(messageKey);
          }),

        // Task 2: Update session title (don't wait for this)
        (!sessionId && messages.length === 1) ? (() => {
          const titleWords = textToSend.split(' ').slice(0, 4).join(' ');
          const newTitle = titleWords.length > 30 ? titleWords.substring(0, 30) + '...' : titleWords;
          return chatService.updateChatSessionTitle(currentSession.id, newTitle)
            .catch((error: any) => console.error('Failed to update session title:', error));
        })() : Promise.resolve(),

        // Task 3: Process anxiety analysis (this we need to wait for)
        processMessageAnalysis(textToSend, conversationHistory, currentSession)
      ];

      // Wait only for the anxiety analysis, let other tasks complete in background
      const [, , analysisResult] = await Promise.allSettled(parallelTasks);

      let anxietyAnalysis;
      if (
        analysisResult.status === 'fulfilled' &&
        analysisResult.value &&
        typeof analysisResult.value === 'object' &&
        'anxietyAnalysis' in analysisResult.value
      ) {
        anxietyAnalysis = (analysisResult.value as { anxietyAnalysis: any }).anxietyAnalysis;
      } else {
        console.error('Anxiety analysis failed:', analysisResult.status === 'rejected' ? analysisResult.reason : 'No analysis result');
        throw analysisResult.status === 'rejected' ? analysisResult.reason : new Error('No analysis result');
      }

      // Update user message with analysis
      updateMessage(userMessage.id, { anxietyAnalysis });

      // Use AI-detected language if available, otherwise fallback to basic detection

      const rawAiDetectedLanguage = anxietyAnalysis.detectedLanguage;
      const aiDetectedLanguage = normalizeLanguageCode(rawAiDetectedLanguage);
      let detectedLanguage: 'en' | 'es' = fallbackDetectedLanguage;

      if (aiDetectedLanguage) {
        if (aiDetectedLanguage === fallbackDetectedLanguage) {
          detectedLanguage = aiDetectedLanguage;
        } else {
          console.log('AI detected language disagrees with heuristic detection:', {
            aiDetectedLanguage,
            fallbackDetectedLanguage
          });
        }
      }
      console.log('AI detected language (raw):', rawAiDetectedLanguage);
      console.log('AI detected language (normalized):', aiDetectedLanguage);

      console.log('Fallback detected language:', fallbackDetectedLanguage);
      console.log('Resolved detected language:', detectedLanguage);
      console.log('Manual language setting:', manualLanguage);

      updateMessage(userMessage.id, { language: detectedLanguage });

      // Check for language mismatch if manual language is set
      if (manualLanguage && detectedLanguage !== manualLanguage) {
        console.log('AI Language mismatch detected:', detectedLanguage, 'vs manual:', manualLanguage);

        // Show language mismatch message instead of normal response
        const mismatchMessage = manualLanguage === 'es'
          ? `I see you sent a message in English. If you want this conversation to continue in English, please select English on the language button.`
          : `I see you sent a message in Spanish. If you want this conversation to continue in Spanish, please select Spanish on the language button.`;

        const aiMessage = createAIMessage(mismatchMessage, aiCompanion, 'en');
        addMessage(aiMessage);
        setIsTyping(false);

        // Set this message to be spoken
        setLastMismatchMessage(mismatchMessage);

        // Save the mismatch message to database
        chatService.sendMessage(currentSession.id, mismatchMessage, 'assistant', userId, aiMessage.id)
          .catch((error: any) => console.error('Failed to save mismatch message:', error));

        return; // Don't process normal response
      }

      // Normal response flow - use detected language for response
      const responseLanguage = detectedLanguage === 'es' ? 'es' : 'en';

      // ✨ NEW: Use advanced RAG AI with research papers
      const ragHistory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
        timestamp: m.timestamp
      }));

      const aiResponse = await getAIResponse(
        textToSend,
        currentSession.id,
        userId,
        ragHistory as any
      );

      // Add research citations if any
      const responseWithCitations = researchCited.length > 0
        ? `${aiResponse}\n\n📚 Research cited:\n${researchCited.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
        : aiResponse;

      const aiMessage = createAIMessage(responseWithCitations, aiCompanion, responseLanguage);

      addMessage(aiMessage);
      setIsTyping(false);

      // Save AI response to database in parallel (don't wait for it)
      chatService.sendMessage(currentSession.id, responseWithCitations, 'assistant', userId, aiMessage.id)
        .catch((error: any) => console.error('Failed to save AI message:', error));

    } catch (error) {
      console.error('💥 Error in message handling:', error);
      setIsTyping(false);

      // Use the same language detection for fallback responses
      const responseLanguage = fallbackDetectedLanguage === 'es' ? 'es' : 'en';

      const fallbackMessage = createAIMessage(
        getFallbackResponse(responseLanguage, aiCompanion),
        aiCompanion,
        responseLanguage
      );
      
      addMessage(fallbackMessage);

      // Save fallback message to database
      if (currentSession) {
        try {
          const userId = (user as any)?.id || 'anonymous';
          await chatService.sendMessage(currentSession.id, fallbackMessage.text, 'assistant', userId, fallbackMessage.id);
        } catch (saveError) {
          console.error('Failed to save fallback message:', saveError);
        }
      }
    } finally {
      setIsProcessingMessage(false);

      // Clear pending message and last message after a delay to allow for new messages
      setTimeout(() => {
        lastMessageRef.current = '';
        pendingMessagesRef.current.delete(messageKey);
      }, 2000);

      // Process next message in queue
      if (messageQueueRef.current.length > 0) {
        const nextMessage = messageQueueRef.current.shift();
        if (nextMessage) {
          setTimeout(() => handleSendMessage(nextMessage), 100);
        }
      }
    }
  };

  return {
    messages,
    inputText,
    setInputText,
    isTyping,
    isAnalyzing,
    currentLanguage,
    aiCompanion,
    scrollRef,
    handleSendMessage,
    editMessage,
    addMessage,
    lastMismatchMessage,
    clearMismatchMessage: () => setLastMismatchMessage(null)
  };
};