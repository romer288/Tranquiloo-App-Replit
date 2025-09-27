
//Author: Harsh Dugar

import { useEffect, useCallback } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { useSpeechState } from './speech/useSpeechState';

// Cache voices across hook instances to avoid repeated loading delays
let cachedVoices: SpeechSynthesisVoice[] | null = null;
let voicesPreloaded = false;
let bestVoiceCache: { en?: SpeechSynthesisVoice; es?: SpeechSynthesisVoice } = {};

export const useSpeechSynthesis = () => {
  const {
    isSpeaking,
    setIsSpeaking,
    speechSynthesisSupported,
    setSpeechSynthesisSupported,
    currentUtteranceRef,
    speechTimeoutRef,
    isProcessingRef,
    lastRequestIdRef
  } = useSpeechState();

  const { findBestVoiceForLanguage } = useVoiceSelection();

  // Check for speech synthesis support and preload voices for mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisSupported(true);
      // Speech synthesis detected
      
      // Critical for mobile: Load voices with caching
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0 && !voicesPreloaded) {
          cachedVoices = voices;
          voicesPreloaded = true;

          // Pre-cache best voices for both languages
          try {
            const enVoice = findBestVoiceForLanguage('en');
            const esVoice = findBestVoiceForLanguage('es');
            bestVoiceCache.en = enVoice === null ? undefined : enVoice;
            bestVoiceCache.es = esVoice === null ? undefined : esVoice;
            // Pre-cached voices for performance
          } catch (error) {
            // Voice caching deferred
          }
        }
        // Voices loaded for compatibility
        return voices;
      };

      // Mobile browsers require this event listener
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Try loading voices immediately with multiple attempts
      loadVoices();
      setTimeout(loadVoices, 100);
      setTimeout(loadVoices, 500);

      // Mobile fix: Cancel any stuck speech on load
      window.speechSynthesis.cancel();
    } else {
      // Speech synthesis not available
      setSpeechSynthesisSupported(false);
    }
  }, [setSpeechSynthesisSupported]);

  // Resume/cancel safety on page lifecycle (iOS quirk)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && window.speechSynthesis?.paused) {
        try { window.speechSynthesis.resume(); } catch {}
      }
    };
    window.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onVis);
    return () => {
      window.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onVis);
    };
  }, []);

  const cancelSpeech = useCallback(() => {
    // Cancelling active speech

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    isProcessingRef.current = false;
    currentUtteranceRef.current = null;
    lastRequestIdRef.current = null;
    setIsSpeaking(false);
  }, [speechTimeoutRef, isProcessingRef, currentUtteranceRef, lastRequestIdRef, setIsSpeaking]);

  useEffect(() => {
    const handleVisibilityLoss = () => {
      if (document.visibilityState === 'hidden') {
        cancelSpeech();
      }
    };

    const handleWindowBlur = () => {
      cancelSpeech();
    };

    const handlePageHide = () => {
      cancelSpeech();
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityLoss);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityLoss);
    };
  }, [cancelSpeech]);

  const speakText = useCallback(async (text: string, language: 'en' | 'es' = 'en'): Promise<void> => {
    // Speaking text request
    
    if (!speechSynthesisSupported) {
      // Speech unavailable
      return;
    }

    if (!text.trim()) {
      // No text to speak
      return;
    }

    // Prevent multiple simultaneous speech requests
    if (isProcessingRef.current) {
      // Replacing current speech
      cancelSpeech();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cancel any existing speech
    if (isSpeaking) {
      // Stopping existing speech
      cancelSpeech();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Create unique request ID to prevent race conditions
    const requestId = Date.now().toString();
    lastRequestIdRef.current = requestId;
    isProcessingRef.current = true;

    return new Promise<void>((resolve, reject) => {
      try {
        // Check if request is still valid
        if (lastRequestIdRef.current !== requestId) {
          // Request cancelled
          isProcessingRef.current = false;
          resolve();
          return;
        }

        let voice = bestVoiceCache[language];

        if (voice) {
          const correctLang = language === 'es'
            ? voice.lang.toLowerCase().startsWith('es')
            : voice.lang.toLowerCase().startsWith('en');

          if (!correctLang) {
            delete bestVoiceCache[language];
            voice = undefined;
          }
        }

        if (!voice) {
          const foundVoice = findBestVoiceForLanguage(language);
          voice = foundVoice === null ? undefined : foundVoice;
          if (voice) {
            bestVoiceCache[language] = voice;
          }
        }

        const utterance = new SpeechSynthesisUtterance(text);

        if (voice) {
          utterance.voice = voice;
          const expectedPrefix = language === 'es' ? 'es' : 'en';
          if (!voice.lang.toLowerCase().startsWith(expectedPrefix)) {
            delete bestVoiceCache[language];
          }
        }
        
        if (language === 'es') {
          utterance.lang = 'es-MX';
          utterance.rate = 1.0;   // Faster Spanish
          utterance.pitch = 0.95; // Lower pitch for natural sound
          utterance.volume = 0.85;

          if (voice) {
            if (voice.lang.includes('mx') || voice.lang.includes('MX')) {
              utterance.lang = voice.lang;
            } else if (voice.lang.match(/es-(mx|us|co|ar|cl|pe|ve|ec|uy|py|bo|cr|gt|hn|ni|pa|sv|do|cu|pr)/i)) {
              utterance.lang = voice.lang;
            }
          }
        } else {
          utterance.lang = 'en-GB';
          utterance.rate = 0.95;  // Faster English
          utterance.pitch = 0.92; // Lower pitch for natural sound
          utterance.volume = 0.88;

          if (voice && (voice.lang.includes('GB') || voice.lang.includes('UK'))) {
            utterance.lang = voice.lang;
          }
        }

        if (voice && (
          voice.name.toLowerCase().includes('enhanced') ||
          voice.name.toLowerCase().includes('premium') ||
          voice.name.toLowerCase().includes('neural') ||
          voice.name.toLowerCase().includes('natural') ||
          voice.name.toLowerCase().includes('wavenet') ||
          voice.name.toLowerCase().includes('libby') ||
          voice.name.toLowerCase().includes('sonia')
        )) {
          if (language === 'es') {
            utterance.rate = 0.95;  // Faster premium Spanish
            utterance.pitch = 0.9;  // Lower pitch for premium Spanish
          } else {
            utterance.rate = 0.9;   // Faster premium English
            utterance.pitch = 0.88; // Lower pitch for premium English
          }
        }

        setIsSpeaking(true);

        let hasCompleted = false;
        
        const complete = (reason = 'completed') => {
          if (hasCompleted) return;
          hasCompleted = true;
          
          // Speech completed
          
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
          
          isProcessingRef.current = false;
          currentUtteranceRef.current = null;
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onstart = () => {
          // Speech started
          setIsSpeaking(true);
          
          // Realistic timeout based on speaking speed (avg 150 words per minute = ~5 chars per second)
          const estimatedDuration = (text.length / 5) * 1000; // 200ms per character for natural speech
          const maxDuration = Math.max(10000, estimatedDuration * 1.5); // 1.5x buffer, 10 second minimum
          // Safety timeout set
          speechTimeoutRef.current = setTimeout(() => {
            // Speech timed out
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            complete('timed out');
          }, maxDuration);
        };
        
        utterance.onend = () => {
          // Speech completed normally
          complete('ended normally');
        };
        
        utterance.onerror = (event) => {
          // Speech error occurred
          complete('ended with error: ' + event.error);
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            reject(new Error(`Speech error: ${event.error}`));
            return;
          }
        };
        
        currentUtteranceRef.current = utterance;
        
        // Starting speech synthesis
        
        // Mobile fix: Always cancel before speaking to clear any stuck state
        window.speechSynthesis.cancel();
        
        // Optimized speech startup with minimal delays
        setTimeout(() => {
          // Check if speech synthesis is ready
          if (window.speechSynthesis.paused) {
            // Resuming paused speech
            window.speechSynthesis.resume();
          }

          try {
            // Streamlined speech initiation
            if (window.speechSynthesis.speaking) {
              // Restarting speech
              window.speechSynthesis.cancel();
              setTimeout(() => {
                window.speechSynthesis.speak(utterance);
                // Speech restarted
              }, 50); // Reduced from 100ms
            } else {
              try { window.speechSynthesis.resume(); } catch {}
              window.speechSynthesis.speak(utterance);
              // Speech initiated

              // Reduced mobile workaround timeout
              setTimeout(() => {
                if (!window.speechSynthesis.speaking && !hasCompleted) {
                  // Attempting resume
                  window.speechSynthesis.resume();

                  // Last resort with shorter delay
                  setTimeout(() => {
                    if (!window.speechSynthesis.speaking && !hasCompleted) {
                      // Final speech attempt
                      window.speechSynthesis.cancel();
                      window.speechSynthesis.speak(utterance);
                    }
                  }, 100); // Reduced from 200ms
                }
              }, 250); // Reduced from 500ms
            }
          } catch (speakError) {
            // Speech error
            complete('failed to speak');
          }
        }, 25); // Reduced from 50ms
        
      } catch (error) {
        // Speech creation error
        isProcessingRef.current = false;
        setIsSpeaking(false);
        reject(error);
      }
    });
  }, [speechSynthesisSupported, findBestVoiceForLanguage, isSpeaking, isProcessingRef, currentUtteranceRef, speechTimeoutRef, setIsSpeaking, lastRequestIdRef, cancelSpeech]);

  const stopSpeaking = useCallback(() => {
    // Stopping speech
    cancelSpeech();
  }, [cancelSpeech]);

  return {
    speechSynthesisSupported,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};
