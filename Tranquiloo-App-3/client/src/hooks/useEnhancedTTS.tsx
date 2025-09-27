// Enhanced TTS hook with ElevenLabs integration and device-based priority system

import { useCallback, useState, useRef } from 'react';
import { elevenLabsTTS, type TTSOptions } from '@/services/elevenLabsTTS';
import { azureTTS } from '@/services/azureTTS';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

export type TTSProvider = 'azure' | 'elevenlabs' | 'webspeech' | 'local';

export interface EnhancedTTSState {
  isSpeaking: boolean;
  currentProvider: TTSProvider | null;
  error: string | null;
  isLoading: boolean;
}

export const useEnhancedTTS = () => {
  const [state, setState] = useState<EnhancedTTSState>({
    isSpeaking: false,
    currentProvider: null,
    error: null,
    isLoading: false
  });

  const {
    speakText: webSpeechSpeak,
    stopSpeaking: webSpeechStop,
    speechSynthesisSupported
  } = useSpeechSynthesis();

  const currentAudioCleanupRef = useRef<(() => void) | null>(null);
  const isStoppedRef = useRef(false);
  const lastRequestRef = useRef<string>('');
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateState = useCallback((updates: Partial<EnhancedTTSState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const stopSpeaking = useCallback(() => {
    console.log('🛑 Stopping TTS');

    isStoppedRef.current = true;

    // Clear request tracking to allow new requests
    lastRequestRef.current = '';
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }

    // Stop all TTS providers
    azureTTS.stopAudio();
    elevenLabsTTS.stopAudio();

    // Stop Web Speech API
    webSpeechStop();

    // Cleanup current audio
    if (currentAudioCleanupRef.current) {
      currentAudioCleanupRef.current();
      currentAudioCleanupRef.current = null;
    }

    updateState({
      isSpeaking: false,
      currentProvider: null,
      error: null,
      isLoading: false
    });
  }, [webSpeechStop, updateState]);

  const speakWithElevenLabs = useCallback(async (text: string, language: 'en' | 'es'): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });
      console.log('🎤 Attempting ElevenLabs TTS');

      const result = await elevenLabsTTS.synthesize({ text, language });

      if (isStoppedRef.current) {
        result.cleanup();
        return false;
      }

      currentAudioCleanupRef.current = result.cleanup;

      updateState({
        currentProvider: 'elevenlabs',
        isLoading: false,
        isSpeaking: true
      });

      await elevenLabsTTS.playAudio(result.audioUrl);

      if (!isStoppedRef.current) {
        updateState({ isSpeaking: false, currentProvider: null });
      }

      return true;

    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      updateState({
        error: `ElevenLabs failed: ${error.message}`,
        isLoading: false,
        currentProvider: null
      });
      return false;
    }
  }, [updateState]);

  const speakWithAzure = useCallback(async (text: string, language: 'en' | 'es'): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });
      console.log('🌐 Attempting Azure TTS');

      updateState({
        currentProvider: 'azure',
        isLoading: false,
        isSpeaking: true
      });

      await azureTTS.synthesize(text, language);

      if (!isStoppedRef.current) {
        updateState({ isSpeaking: false, currentProvider: null });
      }

      return true;

    } catch (error) {
      console.error('Azure TTS failed:', error);
      updateState({
        error: `Azure failed: ${error.message}`,
        isLoading: false,
        currentProvider: null
      });
      return false;
    }
  }, [updateState]);

  const speakWithWebSpeech = useCallback(async (text: string, language: 'en' | 'es'): Promise<boolean> => {
    try {
      console.log('🗣️ Attempting Web Speech TTS');

      if (!speechSynthesisSupported) {
        throw new Error('Web Speech API not supported');
      }

      updateState({
        currentProvider: 'webspeech',
        isSpeaking: true,
        error: null
      });

      await webSpeechSpeak(text, language);

      if (!isStoppedRef.current) {
        updateState({ isSpeaking: false, currentProvider: null });
      }

      return true;

    } catch (error) {
      console.error('Web Speech TTS failed:', error);
      updateState({
        error: `Web Speech failed: ${error.message}`,
        currentProvider: null
      });
      return false;
    }
  }, [speechSynthesisSupported, webSpeechSpeak, updateState]);

  const speakText = useCallback(async (text: string, language: 'en' | 'es' = 'en'): Promise<void> => {
    if (!text.trim()) return;

    const requestKey = `${text.trim()}_${language}`;

    // Prevent duplicate requests
    if (lastRequestRef.current === requestKey) {
      console.log('🚫 Duplicate TTS request ignored');
      return;
    }

    lastRequestRef.current = requestKey;

    // Clear any pending timeout
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }

    // Reset stop flag
    isStoppedRef.current = false;

    // Stop any current audio without calling ourselves recursively
    azureTTS.stopAudio();
    elevenLabsTTS.stopAudio();
    webSpeechStop();

    // Cleanup current audio
    if (currentAudioCleanupRef.current) {
      currentAudioCleanupRef.current();
      currentAudioCleanupRef.current = null;
    }

    console.log(`🎯 TTS Request: "${text.substring(0, 50)}..." (${language})`);
    console.log('🔊 Azure TTS priority: Azure → Web Speech fallback');

    updateState({
      isSpeaking: true,
      error: null,
      isLoading: true
    });

    let success = false;

    // Always try Azure first, then Web Speech fallback
    success = await speakWithAzure(text, language);

    if (!success && !isStoppedRef.current) {
      console.log('⤵️ Azure failed, fallback to Web Speech');
      success = await speakWithWebSpeech(text, language);
    }

    if (!success && !isStoppedRef.current) {
      console.log('❌ All TTS methods failed');
      updateState({
        isSpeaking: false,
        currentProvider: null,
        error: 'All TTS methods failed',
        isLoading: false
      });
    }

  }, [speakWithAzure, speakWithElevenLabs, speakWithWebSpeech, updateState]);

  return {
    ...state,
    speakText,
    stopSpeaking,
    ttsSupported: speechSynthesisSupported || true // Azure + Web Speech always available
  };
};