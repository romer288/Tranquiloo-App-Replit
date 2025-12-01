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
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2 md:hidden">
          {onToggleMobileChatHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMobileChatHistory}
              className="flex items-center gap-2 ml-auto"
            >
              <History className="w-4 h-4" />
              {t('chat.header.mobileHistory')}
            </Button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {speechSynthesisSupported ? (
            <Volume2 className="w-6 h-6 text-green-600" />
          ) : (
            <VolumeX className="w-6 h-6 text-gray-400" />
          )}
          {getTitle()}
          {aiCompanion === 'monica' && (
            <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full ml-2">
              {t('chat.header.badge.es')}
            </span>
          )}
        </h1>
        <p className="text-gray-600">
          {getSubtitle()}
        </p>
        {!speechSupported && !speechSynthesisSupported && (
          <p className="text-amber-600 text-sm mt-2">
            {getWarningMessage()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
