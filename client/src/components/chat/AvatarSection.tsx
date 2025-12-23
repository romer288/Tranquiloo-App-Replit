
import React from 'react';
import ReadyPlayerMeAvatar from '@/components/ReadyPlayerMeAvatar';
import { RealisticAvatar } from '@/components/avatar/RealisticAvatar';
import { AICompanion } from '@/types/chat';
import { useLanguage } from '@/context/LanguageContext';

interface AvatarSectionProps {
  aiCompanion: AICompanion;
  isAnimating: boolean;
  isTyping: boolean;
  currentEmotion: {
    emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
    intensity: number;
  };
  useReadyPlayerMe: boolean;
  setUseReadyPlayerMe: (value: boolean) => void;
  onStoppedSpeaking?: () => void;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({
  aiCompanion,
  isAnimating,
  isTyping,
  currentEmotion,
  useReadyPlayerMe,
  setUseReadyPlayerMe,
  onStoppedSpeaking
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center w-full max-w-full px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 w-full max-w-full">
        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold mb-1 sm:mb-1.5 md:mb-2 lg:mb-2.5 text-center break-words">
          {aiCompanion === 'vanessa' ? 'Vanessa' : 'Mónica'}
        </h3>
        
        {/* Avatar toggle button */}
        <div className="mb-1 sm:mb-1.5 md:mb-2 lg:mb-2.5 text-center w-full sm:w-auto">
         <button
            onClick={() => setUseReadyPlayerMe(!useReadyPlayerMe)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            {useReadyPlayerMe ? t('avatar.useSimpleAvatar', 'Use Simple Avatar') : t('avatar.useRealisticAvatar', 'Use Realistic Avatar')}
          </button>
        </div>

        <div className="w-full flex justify-center overflow-hidden max-w-full">
          <div className="scale-[0.65] sm:scale-75 md:scale-85 lg:scale-90 xl:scale-95 2xl:scale-100 origin-center max-w-full">
            {useReadyPlayerMe ? (
              <ReadyPlayerMeAvatar
                companion={aiCompanion}
                isAnimating={isAnimating || isTyping}
                emotion={currentEmotion.emotion}
                className="mx-auto max-w-full"
                onStoppedSpeaking={onStoppedSpeaking}
              />
            ) : (
              <RealisticAvatar
                companion={aiCompanion}
                isAnimating={isAnimating || isTyping}
                emotion={currentEmotion.emotion}
                className="mx-auto max-w-full"
                onStoppedSpeaking={onStoppedSpeaking}
              />
            )}
          </div>
        </div>
        
        <div className="mt-1 sm:mt-1.5 md:mt-2 lg:mt-2.5 text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-gray-600 text-center pe-none break-words">
          {isAnimating ? t('avatar.speaking', 'Speaking...') : t('avatar.listening', 'Listening')}
        </div>
      </div>

      {/* Avatar emotion indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 w-full max-w-full mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 xl:mt-5">
        <div className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 mb-0.5 sm:mb-1 md:mb-1.5 lg:mb-2 break-words">{t('avatar.currentMood', 'Current Mood')}</div>
        <div className="capitalize text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium break-words">
          {currentEmotion.emotion.replace('_', ' ')}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 md:h-2.5 lg:h-3 mt-1 sm:mt-1.5 md:mt-2 lg:mt-2.5">
          <div 
            className={`h-1.5 sm:h-2 md:h-2.5 lg:h-3 rounded-full transition-all duration-300 ${
              currentEmotion.emotion === 'concerned' ? 'bg-red-400' :
              currentEmotion.emotion === 'empathetic' ? 'bg-blue-400' :
              currentEmotion.emotion === 'supportive' ? 'bg-green-400' :
              'bg-gray-400'
            }`}
            style={{ width: `${currentEmotion.intensity * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AvatarSection;
