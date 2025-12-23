
import React from 'react';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import { Message, AICompanion, Language } from '@/types/chat';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { FallbackAnxietyAnalysis } from '@/utils/anxiety/types';

// Create a unified type for anxiety analysis
type AnxietyAnalysis = ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis;

interface ChatSectionProps {
  messages: Message[];
  inputText: string;
  setInputText: (text: string) => void;
  isTyping: boolean;
  isAnalyzing: boolean;
  isListening: boolean;
  speechSupported: boolean;
  aiCompanion: AICompanion;
  currentLanguage: Language;
  scrollRef: React.RefObject<HTMLDivElement>;
  latestAnalysis: AnxietyAnalysis | null;
  allAnalyses: AnxietyAnalysis[];
  onToggleListening: () => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  onShowCrisisResources?: () => void;
  autoSpeak?: boolean;
  onToggleAutoSpeak?: () => void;
  onUserGesture?: () => void;
  onLanguageChange?: (lang: Language) => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  inputText,
  setInputText,
  isTyping,
  isAnalyzing,
  isListening,
  speechSupported,
  aiCompanion,
  currentLanguage,
  scrollRef,
  latestAnalysis,
  allAnalyses,
  onToggleListening,
  onSendMessage,
  onKeyPress,
  onEditMessage,
  onStopSpeaking,
  isSpeaking,
  onShowCrisisResources,
  autoSpeak,
  onToggleAutoSpeak,
  onUserGesture,
  onLanguageChange
}) => {
  return (
    <div className="flex-1 flex flex-col relative min-h-0 w-full overflow-hidden">
      {/* Only show Advanced Anxiety Analysis */}
      {latestAnalysis && (
        <div className="flex-shrink-0 px-2 sm:px-4 pt-2 sm:pt-4">
          <AdvancedAnxietyTracker 
            currentAnalysis={latestAnalysis as ClaudeAnxietyAnalysis}
            recentAnalyses={allAnalyses.slice(-5) as ClaudeAnxietyAnalysis[]}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden px-2 sm:px-4">
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          isAnalyzing={isAnalyzing}
          scrollRef={scrollRef}
          aiCompanion={aiCompanion}
          onEditMessage={onEditMessage}
          currentLanguage={currentLanguage}
        />
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-900 pt-2 pb-4 sm:pb-6 md:pb-20 px-2 sm:px-4 z-10 border-t border-gray-200 dark:border-gray-700">
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isListening={isListening}
          speechSupported={speechSupported}
          onToggleListening={onToggleListening}
          onSendMessage={onSendMessage}
          onKeyPress={onKeyPress}
          currentLanguage={currentLanguage}
          aiCompanion={aiCompanion}
          onStopSpeaking={onStopSpeaking}
          isSpeaking={isSpeaking}
          onShowCrisisResources={onShowCrisisResources}
          autoSpeak={autoSpeak}
          onToggleAutoSpeak={onToggleAutoSpeak}
          onUserGesture={onUserGesture}
          onLanguageChange={onLanguageChange}
        />
      </div>
    </div>
  );
};

export default ChatSection;
