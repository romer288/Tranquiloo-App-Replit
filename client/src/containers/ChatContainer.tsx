//Author: Harsh Dugar
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatHeader from '@/components/ChatHeader';
import AvatarSection from '@/components/chat/AvatarSection';
import ChatSection from '@/components/chat/ChatSection';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import { GoalSuggestionModal } from '@/components/goals/GoalSuggestionModal';
import { CrisisResourcesModal } from '@/components/CrisisResourcesModal';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useChat } from '@/hooks/useChat';
import { useAvatarEmotions } from '@/hooks/useAvatarEmotions';
import { useChatInteractions } from '@/hooks/useChatInteractions';
import { useGoalSuggestions } from '@/hooks/useGoalSuggestions';
import { detectLanguage } from '@/utils/languageDetection';
import { shouldEscalate } from '@/utils/escalation';
import { useEnhancedTTS } from '@/hooks/useEnhancedTTS';

interface ChatContainerProps {
  sessionId?: string | null;
}

const ChatContainer = ({ sessionId }: ChatContainerProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMessage = location.state?.initialMessage;

  const [manualLanguage, setManualLanguage] = React.useState<'en' | 'es' | null>('en'); // Default to English
  
  const {
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
      clearMismatchMessage
    } = useChat(sessionId, manualLanguage);

  // Effective language combines manual override with auto-detection
  const effectiveLanguage = manualLanguage || currentLanguage;

  const { anxietyAnalyses, currentAnxietyAnalysis } = useAnxietyAnalysis();

  const {
    showSuggestionModal,
    suggestedGoals,
    triggerGoalSuggestion,
    closeSuggestionModal
  } = useGoalSuggestions();

  const {
    isAnimating,
    currentEmotion,
    latestAnalysis,
    allAnalyses
  } = useAvatarEmotions(
    aiCompanion,
    messages,
    isTyping,
    anxietyAnalyses,
    currentAnxietyAnalysis
  );

  // Enhanced TTS with ElevenLabs integration
  const enhancedTTS = useEnhancedTTS();

  const {
    isListening,
    speechSupported,
    speechSynthesisSupported,
    languageContext,
    isSpeaking,
    handleToggleListening: originalHandleToggleListening,
    handleKeyPress,
    handleAutoStartListening,
    handleSpeakText,
    stopSpeaking: originalStopSpeaking
  } = useChatInteractions(effectiveLanguage, setInputText, handleSendMessage);

  const [useReadyPlayerMe, setUseReadyPlayerMe] = React.useState(true);
  const [avatarIsSpeaking, setAvatarIsSpeaking] = React.useState(false);
  const [lastSpokenMessageId, setLastSpokenMessageId] = React.useState<string | null>(null);

  // Enhanced stop speaking that stops both regular TTS and enhanced TTS
  const stopSpeaking = React.useCallback(() => {
    console.log('🛑 Stopping all speech systems');
    originalStopSpeaking(); // Stop regular speech synthesis
    enhancedTTS.stopSpeaking(); // Stop enhanced TTS
    setAvatarIsSpeaking(false); // Reset avatar state
  }, [originalStopSpeaking, enhancedTTS]);

  // Enhanced toggle listening that stops both speech systems before listening
  const handleToggleListening = React.useCallback(() => {
    console.log('🎤 Enhanced toggle listening - stopping all speech first');

    // Stop all speech systems before starting to listen
    if (isSpeaking || enhancedTTS.isSpeaking || avatarIsSpeaking) {
      stopSpeaking();
    }

    // Then proceed with normal toggle listening
    originalHandleToggleListening();
  }, [originalHandleToggleListening, isSpeaking, enhancedTTS.isSpeaking, avatarIsSpeaking, stopSpeaking]);
  const [showCrisisModal, setShowCrisisModal] = React.useState(false);
  const [showMobileChatHistory, setShowMobileChatHistory] = React.useState(false);
  const [autoSpeak, setAutoSpeak] = React.useState(() => {
    const saved = localStorage.getItem('autoSpeak');
    return saved !== null ? saved === 'true' : true;
  });

  // Safety check: reset avatarIsSpeaking if enhancedTTS is not speaking
  React.useEffect(() => {
    if (avatarIsSpeaking && !enhancedTTS.isSpeaking && !isSpeaking) {
      console.log('🔧 Safety check: enhancedTTS not speaking, resetting avatarIsSpeaking');
      setAvatarIsSpeaking(false);
    }
  }, [enhancedTTS.isSpeaking, isSpeaking, avatarIsSpeaking]);

  // Prime language from the very first user input (or initialMessage)
  React.useEffect(() => {
    const src = initialMessage?.trim() || messages[0]?.text || '';
    if (src) {
      const lang = detectLanguage(src);
      if (languageContext && typeof languageContext === 'object' && 'currentLanguage' in languageContext) {
        // Language context is read-only, we'll use it as-is
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force-reset voice state on mount for mobile stability
  React.useEffect(() => {
    setAvatarIsSpeaking(false);
    setLastSpokenMessageId(null);
    stopSpeaking();
    enhancedTTS.stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop voice on tab change
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden
        stopSpeaking();
        enhancedTTS.stopSpeaking();
        setAvatarIsSpeaking(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial message auto-speak (faster)
  React.useEffect(() => {
    if (!autoSpeak) {
      console.log('🔇 Auto-speak disabled');
      return;
    }
    const last = messages[messages.length - 1];
    if (!last) {
      console.log('🔇 No messages to speak');
      return;
    }
    // Auto-speak only AI responses
    if (last.sender === 'user') {
      console.log('🔇 User message, skipping auto-speak');
      return;
    }
    if (isTyping || avatarIsSpeaking || last.id === lastSpokenMessageId) {
      console.log(`🔇 Auto-speak blocked: isTyping=${isTyping}, avatarIsSpeaking=${avatarIsSpeaking}, alreadySpoken=${last.id === lastSpokenMessageId}`);
      return;
    }

    const storedLanguage = last.language;
    const detectedLanguage = storedLanguage ?? detectLanguage(last.text || '');
    const spanishSignals = /[¡¿ñ]|\b(?:hola|gracias|c[óo]mo|est[áa]|soy|tengo|estoy|muy|aquí|aqui|por favor|buenos d[ií]as|buenas tardes|buenas noches)\b/i;
    const finalLang = storedLanguage ?? (
      detectedLanguage === 'en' && spanishSignals.test(last.text)
        ? 'es'
        : detectedLanguage
    );

    console.log(`🔊 Auto-speak: ${last.text.substring(0, 30)}... (${finalLang})`);

    setLastSpokenMessageId(last.id);
    setAvatarIsSpeaking(true);

    // Safety timeout to reset avatarIsSpeaking in case TTS gets stuck
    const safetyTimeoutId = setTimeout(() => {
      console.log('🚨 Safety timeout: resetting avatarIsSpeaking');
      setAvatarIsSpeaking(false);
    }, 30000); // 30 seconds max

    enhancedTTS.speakText(last.text, finalLang)
      .then(() => {
        console.log('✅ Auto-speak completed successfully');
      })
      .catch((e) => {
        console.error('❌ Auto-speak failed:', e);
      })
      .finally(() => {
        console.log('🔄 Resetting avatarIsSpeaking state');
        clearTimeout(safetyTimeoutId);
        setAvatarIsSpeaking(false); // Always reset when TTS is done
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isTyping, autoSpeak]);

  // Speak language mismatch messages
  React.useEffect(() => {
    if (!autoSpeak || !lastMismatchMessage) return;

    (async () => {
      setAvatarIsSpeaking(true);
      try {
        // Always speak mismatch message in English using enhanced TTS
        await enhancedTTS.speakText(lastMismatchMessage, 'en');
      } catch (e) {
        console.error('Failed to speak mismatch message:', e);
      } finally {
        setAvatarIsSpeaking(false);
        clearMismatchMessage(); // Clear after speaking
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMismatchMessage, autoSpeak, clearMismatchMessage]);

  // Crisis escalation gate: reduce false positives
  const recentHighAnxietyCount = React.useMemo(() => {
    const last5 = (allAnalyses ?? []).slice(0, 5);
    return last5.filter(a => (a.anxietyLevel ?? (a as any).anxiety_level ?? 0) >= 8).length;
  }, [allAnalyses]);

  const handleMaybeShowCrisis = React.useCallback((text: string) => {
    const escalate = shouldEscalate(text, latestAnalysis || undefined, recentHighAnxietyCount);
    if (escalate) setShowCrisisModal(true);
  }, [latestAnalysis, recentHighAnxietyCount]);

  // Chat history handlers
  const handleSessionSelect = (newSessionId: string) => {
    setShowMobileChatHistory(false); // Close mobile modal
    // Use window.location.href for full page reload (same as ChatHistory page)
    window.location.href = `/chat?session=${newSessionId}`;
  };

  const handleNewChat = () => {
    setShowMobileChatHistory(false); // Close mobile modal
    window.location.href = '/chat';
  };

  // Language change handler
  const handleLanguageChange = React.useCallback((lang: 'en' | 'es') => {
    console.log('Manual language change to:', lang);
    setManualLanguage(lang);
  }, []);


  // Suggest goals only when helpful (unchanged, just ensure language stays in sync)
  React.useEffect(() => {
    const lastUser = (messages ?? []).slice().reverse().find(m => m.sender === 'user');
    if (!lastUser || !currentAnxietyAnalysis || showSuggestionModal || isTyping) return;

    // keep language aligned to user's last message content
    const detectedLang = detectLanguage(lastUser.text || '');

    setTimeout(() => {
      triggerGoalSuggestion(lastUser.text, currentAnxietyAnalysis);
      // Also consider crisis gate here
      handleMaybeShowCrisis(lastUser.text || '');
    }, 1200);
  }, [messages, currentAnxietyAnalysis, triggerGoalSuggestion, showSuggestionModal, isTyping, languageContext, handleMaybeShowCrisis]);

  return (
    // Use proper viewport height with mobile-safe margins
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden" style={{ zIndex: 1 }}>
      {/* Header - Fixed height */}
      <div className="flex-shrink-0">
        <ChatHeader
          speechSynthesisSupported={speechSynthesisSupported}
          speechSupported={speechSupported}
          aiCompanion={aiCompanion}
          currentLanguage={languageContext.currentLanguage}
          onToggleMobileChatHistory={() => setShowMobileChatHistory(true)}
        />
      </div>

      {/* Main content - Responsive layout */}
      <div className="flex-1 w-full min-h-0 overflow-hidden">
        {/* Desktop Layout - lg and above (1024px+) */}
        <div className="hidden lg:flex h-full max-w-7xl mx-auto p-3 md:p-4 lg:p-5 xl:p-6 gap-3 md:gap-4 lg:gap-5 xl:gap-6">
          {/* Left Column: Avatar + Chat History */}
          <div className="flex flex-col gap-3 md:gap-4 lg:gap-5 w-72 md:w-80 lg:w-80 xl:w-80 flex-shrink-0 h-full">
            {/* Avatar Section - Fixed height */}
            <div className="flex-shrink-0">
              <AvatarSection
                aiCompanion={aiCompanion}
                isAnimating={avatarIsSpeaking || isAnimating}
                isTyping={isTyping}
                currentEmotion={currentEmotion}
                useReadyPlayerMe={useReadyPlayerMe}
                setUseReadyPlayerMe={setUseReadyPlayerMe}
                onStoppedSpeaking={() => {
                  console.log('🛑 Avatar stopped speaking - resetting avatar state');
                  setAvatarIsSpeaking(false);
                  stopSpeaking();
                  enhancedTTS.stopSpeaking();
                }}
              />
            </div>

            {/* Chat History - Takes remaining height */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatHistorySidebar
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
                className="h-full"
              />
            </div>
          </div>

          {/* Right Column: Chat Section */}
          <div className="flex-1 min-w-0 h-full overflow-hidden">
            <ChatSection
              messages={messages}
              inputText={inputText}
              setInputText={setInputText}
              isTyping={isTyping}
              isAnalyzing={isAnalyzing}
              isListening={isListening}
              speechSupported={speechSupported}
              aiCompanion={aiCompanion}
              currentLanguage={effectiveLanguage}
              scrollRef={scrollRef}
              latestAnalysis={latestAnalysis}
              allAnalyses={allAnalyses}
              onToggleListening={handleToggleListening}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              onEditMessage={editMessage}
              onStopSpeaking={() => {
                console.log('🛑 Manual stop speaking - resetting avatar state');
                stopSpeaking();
                enhancedTTS.stopSpeaking();
                setAvatarIsSpeaking(false); // Reset avatar speaking state
              }}
              isSpeaking={isSpeaking || enhancedTTS.isSpeaking}
              onShowCrisisResources={() => setShowCrisisModal(true)}
              autoSpeak={autoSpeak}
              onToggleAutoSpeak={() => {
                const newValue = !autoSpeak;
                setAutoSpeak(newValue);
                localStorage.setItem('autoSpeak', String(newValue));
              }}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>

        {/* Tablet Layout - md to lg (768px - 1023px) */}
        <div className="hidden md:flex lg:hidden flex-col h-full max-w-5xl mx-auto p-3 md:p-4 gap-3 md:gap-4">
          {/* Top: Avatar Section */}
          <div className="flex-shrink-0 px-2 md:px-4">
            <AvatarSection
              aiCompanion={aiCompanion}
              isAnimating={avatarIsSpeaking || isAnimating}
              isTyping={isTyping}
              currentEmotion={currentEmotion}
              useReadyPlayerMe={useReadyPlayerMe}
              setUseReadyPlayerMe={setUseReadyPlayerMe}
              onStoppedSpeaking={() => {
                console.log('🛑 Avatar stopped speaking - resetting avatar state');
                setAvatarIsSpeaking(false);
                stopSpeaking();
                enhancedTTS.stopSpeaking();
              }}
            />
          </div>

          {/* Bottom: Chat Section - Takes remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden px-2 md:px-4 pb-3 md:pb-4">
            <ChatSection
              messages={messages}
              inputText={inputText}
              setInputText={setInputText}
              isTyping={isTyping}
              isAnalyzing={isAnalyzing}
              isListening={isListening}
              speechSupported={speechSupported}
              aiCompanion={aiCompanion}
              currentLanguage={effectiveLanguage}
              scrollRef={scrollRef}
              latestAnalysis={latestAnalysis}
              allAnalyses={allAnalyses}
              onToggleListening={handleToggleListening}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              onEditMessage={editMessage}
              onStopSpeaking={() => {
                console.log('🛑 Manual stop speaking - resetting avatar state');
                stopSpeaking();
                enhancedTTS.stopSpeaking();
                setAvatarIsSpeaking(false);
              }}
              isSpeaking={isSpeaking || enhancedTTS.isSpeaking}
              onShowCrisisResources={() => setShowCrisisModal(true)}
              autoSpeak={autoSpeak}
              onToggleAutoSpeak={() => {
                const newValue = !autoSpeak;
                setAutoSpeak(newValue);
                localStorage.setItem('autoSpeak', String(newValue));
              }}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>

        {/* Mobile Layout - below md (< 768px) */}
        <div className="flex md:hidden flex-col h-full overflow-hidden">
          {/* Mobile Avatar - Compact version */}
          <div className="flex-shrink-0 p-2 sm:p-3 pb-1 sm:pb-2">
            <AvatarSection
              aiCompanion={aiCompanion}
              isAnimating={avatarIsSpeaking || isAnimating}
              isTyping={isTyping}
              currentEmotion={currentEmotion}
              useReadyPlayerMe={useReadyPlayerMe}
              setUseReadyPlayerMe={setUseReadyPlayerMe}
              onStoppedSpeaking={() => { 
                setAvatarIsSpeaking(false); 
                stopSpeaking(); 
                enhancedTTS.stopSpeaking();
              }}
            />
          </div>

          {/* Mobile Chat Section - Takes remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden px-2 sm:px-3 pb-2 sm:pb-3 md:pb-4">
            <ChatSection
              messages={messages}
              inputText={inputText}
              setInputText={setInputText}
              isTyping={isTyping}
              isAnalyzing={isAnalyzing}
              isListening={isListening}
              speechSupported={speechSupported}
              aiCompanion={aiCompanion}
              currentLanguage={effectiveLanguage}
              scrollRef={scrollRef}
              latestAnalysis={latestAnalysis}
              allAnalyses={allAnalyses}
              onToggleListening={handleToggleListening}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              onEditMessage={editMessage}
              onStopSpeaking={() => {
                console.log('🛑 Manual stop speaking - resetting avatar state');
                stopSpeaking();
                enhancedTTS.stopSpeaking();
                setAvatarIsSpeaking(false); // Reset avatar speaking state
              }}
              isSpeaking={isSpeaking || enhancedTTS.isSpeaking}
              onShowCrisisResources={() => setShowCrisisModal(true)}
              autoSpeak={autoSpeak}
              onToggleAutoSpeak={() => {
                const newValue = !autoSpeak;
                setAutoSpeak(newValue);
                localStorage.setItem('autoSpeak', String(newValue));
              }}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>
      </div>

      {showSuggestionModal && (
        <GoalSuggestionModal
          isOpen={showSuggestionModal}
          onClose={closeSuggestionModal}
          suggestedGoals={suggestedGoals}
          aiCompanion={aiCompanion}
        />
      )}

      {showCrisisModal && (
        <CrisisResourcesModal
          isOpen={showCrisisModal}
          onClose={() => setShowCrisisModal(false)}
        />
      )}

      {/* Mobile Chat History Modal */}
      {showMobileChatHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowMobileChatHistory(false)}>
          <div 
            className="fixed inset-y-0 left-0 w-full sm:w-80 max-w-[90vw] sm:max-w-[85vw] bg-white h-full flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold">Chat History</h2>
                <button
                  onClick={() => setShowMobileChatHistory(false)}
                  className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 touch-manipulation transition-colors"
                  aria-label="Close chat history"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatHistorySidebar
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
                className="h-full border-0 rounded-none shadow-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;