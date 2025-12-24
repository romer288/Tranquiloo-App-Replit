import React from 'react';
import { Volume2, VolumeX, ChevronLeft, History } from 'lucide-react';
import { AICompanion, Language } from '@/types/chat';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

interface ChatHeaderProps {
  speechSynthesisSupported: boolean;
  speechSupported: boolean;
  aiCompanion: AICompanion;
  currentLanguage: Language;
  onToggleMobileChatHistory?: () => void;
}

const ChatHeader = ({
  speechSynthesisSupported,
  speechSupported,
  aiCompanion,
  currentLanguage,
  onToggleMobileChatHistory
}: ChatHeaderProps) => {
  const { t } = useLanguage();
  const getTitle = () => {
    if (aiCompanion === 'monica') {
      return t('chat.header.monicaTitle');
    }
    return t('chat.header.vanessaTitle');
  };

  const getSubtitle = () => {
    if (aiCompanion === 'monica') {
      return t('chat.header.monicaSubtitle');
    }
    return t('chat.header.vanessaSubtitle');
  };

  const getWarningMessage = () => {
    return t('chat.header.warning');
  };

  return (
    <div className="bg-white border-b border-gray-200 p-2.5 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-4xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 xl:px-0">
        <div className="flex items-center justify-end gap-2 mb-2 sm:mb-3 md:hidden">
          {onToggleMobileChatHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMobileChatHistory}
              className="flex items-center gap-1 sm:gap-1.5 mt-2 md:mt-0 md:gap-2 text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2"
            >
              <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('chat.header.mobileHistory')}</span>
            </Button>
          )}
        </div>
        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
          {speechSynthesisSupported ? (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-green-600 flex-shrink-0" />
          ) : (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-gray-400 flex-shrink-0" />
          )}
          <span className="break-words leading-tight sm:leading-normal">{getTitle()}</span>
          {aiCompanion === 'monica' && (
            <span className="text-[10px] sm:text-xs md:text-sm lg:text-base bg-pink-100 text-pink-800 px-1 sm:px-1.5 md:px-2 lg:px-2.5 py-0.5 sm:py-0.5 md:py-1 lg:py-1.5 rounded-full ml-0.5 sm:ml-1 md:ml-2 flex-shrink-0">
              {t('chat.header.badge.es')}
            </span>
          )}
        </h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mt-1 sm:mt-1.5 md:mt-2 lg:mt-2.5 break-words leading-relaxed">
          {getSubtitle()}
        </p>
        {!speechSupported && !speechSynthesisSupported && (
          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-amber-600 mt-1.5 sm:mt-2 md:mt-2.5 lg:mt-3 break-words leading-relaxed">
            {getWarningMessage()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
