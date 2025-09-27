
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { azureSTT } from '@/services/azureSTT';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [browserRecognitionAvailable, setBrowserRecognitionAvailable] = useState(false);
  const [azureSupported, setAzureSupported] = useState(false);
  const [speechUnlocked, setSpeechUnlocked] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const onResultCallbackRef = useRef<((transcript: string) => void) | null>(null);
  const autoStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);

  // Azure STT state (for Spanish language support)
  const azureSTTActiveRef = useRef<boolean>(false);
  const currentLanguageRef = useRef<'en' | 'es'>('en');

  useEffect(() => {
    console.log('Initializing speech recognition...');
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasBrowserRecognition = Boolean(SpeechRecognition);
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isSafari = /safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isIOSSafari = isSafari && isIOS;
    const isDesktopSafari = isSafari && !isIOS;

    let browserAvailable = hasBrowserRecognition && !isIOSSafari;

    if (hasBrowserRecognition && !isIOSSafari) {
      console.log('Speech recognition is available');

      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          console.log('Speech recognition result received');
          lastSpeechTimeRef.current = Date.now();
          
          // Clear existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript + ' ';
            console.log('Final transcript so far:', finalTranscriptRef.current);
          }

          // Set 7-second silence timer
          if (finalTranscript || interimTranscript) {
            silenceTimerRef.current = setTimeout(() => {
              console.log('7-second silence detected, ending speech recognition');
              if (recognitionRef.current && isListening) {
                const fullTranscript = finalTranscriptRef.current.trim();
                if (fullTranscript && onResultCallbackRef.current) {
                  console.log('Final complete transcript:', fullTranscript);
                  onResultCallbackRef.current(fullTranscript);
                }
                recognitionRef.current.stop();
              }
            }, 7000); // 7 seconds silence timeout
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          // Safari-specific permission handling
          if (isDesktopSafari && (event.error === 'not-allowed' || event.error === 'service-not-allowed')) {
            console.log('Safari microphone permission issue detected');
            // Request permissions explicitly for Safari
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                  console.log('Safari microphone permission granted');
                  // Try to restart recognition after permission granted
                  if (recognitionRef.current) {
                    setTimeout(() => {
                      recognitionRef.current?.start();
                    }, 100);
                  }
                })
                .catch((err) => {
                  console.error('Safari microphone permission denied:', err);
                  toast({
                    title: "Microphone Permission Required",
                    description: "Please allow microphone access for this site in Safari settings.",
                    variant: "destructive",
                  });
                });
            }
          }
          
          // Clean up all timers
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
          }
          
          setIsListening(false);
          
          // Don't show error toast for 'aborted' - this happens when user interrupts by typing
          if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
            toast({
              title: "Speech Recognition Error",
              description: `Error: ${event.error}. Please try again or type your message.`,
              variant: "destructive",
            });
          } else if (event.error === 'aborted') {
            console.log('Speech recognition aborted (likely user interrupted by typing)');
          }
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          
          // Clean up all timers
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
          }
          
          setIsListening(false);
          
          const fullTranscript = finalTranscriptRef.current.trim();
          if (fullTranscript && onResultCallbackRef.current) {
            console.log('Sending final transcript on end:', fullTranscript);
            onResultCallbackRef.current(fullTranscript);
          }
          
          // Reset for next session
          finalTranscriptRef.current = '';
          onResultCallbackRef.current = null;
          lastSpeechTimeRef.current = 0;
        };

      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        browserAvailable = false;
        recognitionRef.current = null;
      }
    } else if (hasBrowserRecognition && isIOSSafari) {
      console.warn('iOS Safari detected – browser speech recognition not supported, falling back to Azure STT when available');
      browserAvailable = false;
    } else {
      console.log('Speech recognition not available in this browser');
      browserAvailable = false;
    }

    const mediaRecorderSupported = typeof MediaRecorder !== 'undefined';
    const audioContextCtor = typeof window !== 'undefined'
      && ((window as typeof window & { AudioContext?: typeof AudioContext }).AudioContext
        || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    const hasAudioContext = Boolean(audioContextCtor);
    const canAccessMicrophone = typeof navigator !== 'undefined'
      && (!!navigator.mediaDevices?.getUserMedia || !!(navigator as any).webkitGetUserMedia);
    const azureFallbackCapable = canAccessMicrophone && (mediaRecorderSupported || hasAudioContext);

    setBrowserRecognitionAvailable(browserAvailable && Boolean(recognitionRef.current));
    setAzureSupported(azureFallbackCapable);
    setSpeechSupported(browserAvailable || azureFallbackCapable);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
      }
      if (azureSTTActiveRef.current) {
        azureSTT.cancelRecording();
      }
    };
  }, [toast]);

  // Azure STT for Spanish language
  const stopBrowserRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.warn('Error stopping browser recognition:', error);
    }
  }, []);

  const startAzureSTT = async (onResult: (transcript: string) => void, language: 'en' | 'es') => {
    try {
      const targetLanguage = language === 'es' ? 'es-MX' : 'en-US';
      console.log(`🎤 Starting Azure STT for ${targetLanguage}`);
      azureSTTActiveRef.current = true;
      setIsListening(true);
      onResultCallbackRef.current = onResult;

      // Start recording with Azure STT
      currentLanguageRef.current = language;
      await azureSTT.startRecording(targetLanguage);

      // Set maximum duration timer (10 seconds)
      maxDurationTimerRef.current = setTimeout(async () => {
        await stopAzureSTT();
      }, 10000);

    } catch (error) {
      console.error('Azure STT start failed:', error);
      azureSTTActiveRef.current = false;
      setIsListening(false);

      toast({
        title: "Microphone Error",
        description: "Failed to start Azure speech recognition.",
        variant: "destructive",
      });
    }
  };

  const stopAzureSTT = useCallback(async () => {
    if (!azureSTTActiveRef.current) return;

    try {
      console.log('🛑 Stopping Azure STT');
      azureSTTActiveRef.current = false;
      setIsListening(false);

      // Clear timers
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      // Get transcript from Azure STT
      const transcript = await azureSTT.stopRecording();

      if (transcript && onResultCallbackRef.current) {
        console.log('✅ Azure STT transcript received:', transcript);
        onResultCallbackRef.current(transcript);
      }

    } catch (error) {
      console.error('Azure STT stop failed:', error);
      azureSTT.cancelRecording(); // Cleanup on error
    }
  }, []);

  const startListening = (onResult: (transcript: string) => void, language: 'en' | 'es' = 'en') => {
    if (!speechSupported) {
      toast({
        title: "Microphone Not Available",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    // Detect Safari for specific handling
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isSafari = /safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isDesktopSafari = isSafari && !isIOS;

    const supportsBrowserRecognition = browserRecognitionAvailable && Boolean(recognitionRef.current);
    const supportsAzureRecognition = azureSupported;

    // For mobile/PWA: ensure speech is unlocked by user gesture
    if (!speechUnlocked) {
      setSpeechUnlocked(true);
      console.log('Speech recognition unlocked by user gesture');
    }

    if (isListening) {
      console.log('Stopping speech recognition');

      if (azureSTTActiveRef.current) {
        stopAzureSTT().catch((error) => {
          console.error('Azure STT stop error:', error);
        });
        return;
      }

      if (!supportsBrowserRecognition) {
        setIsListening(false);
        return;
      }

      // Use Web Speech API when available

      // Clean up all timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      console.log('Starting speech recognition for language:', language);

      // Store current language for reference
      currentLanguageRef.current = language;

      // Use Azure STT fallback when browser API is unavailable
      if (!supportsBrowserRecognition && supportsAzureRecognition) {
        startAzureSTT(onResult, language);
        return;
      }

      if (!supportsBrowserRecognition && !supportsAzureRecognition) {
        toast({
          title: "Microphone Not Available",
          description: "This browser does not allow microphone access. Please try another browser.",
          variant: "destructive",
        });
        return;
      }

      // Use Web Speech API for both English and Spanish when supported
      try {
        // Check if recognition object exists
        if (!recognitionRef.current) {
          console.error('Recognition object not available');
          toast({
            title: "Microphone Error",
            description: "Speech recognition not properly initialized.",
            variant: "destructive",
          });
          return;
        }

        // Reset state for new session
        finalTranscriptRef.current = '';
        onResultCallbackRef.current = onResult;
        lastSpeechTimeRef.current = Date.now();
        
        recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';
        console.log('STT lang =', recognitionRef.current.lang);
        
        // Set state first, then try to start
        setIsListening(true);
        
        // Safari needs explicit permission request before starting
        if (isDesktopSafari && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          console.log('Safari detected: requesting microphone permission first');
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              console.log('Safari microphone permission granted, starting recognition');
              // Add a small delay to ensure state is set
              setTimeout(() => {
                try {
                  recognitionRef.current?.start();
                  console.log('✅ Speech recognition started successfully in Safari');
                  
                  // Set maximum duration timer (8 seconds total)
                  maxDurationTimerRef.current = setTimeout(() => {
                    console.log('Maximum duration reached (8s), forcing stop');
                    if (recognitionRef.current && isListening) {
                      const fullTranscript = finalTranscriptRef.current.trim();
                      if (fullTranscript && onResultCallbackRef.current) {
                        console.log('Sending transcript due to max duration:', fullTranscript);
                        onResultCallbackRef.current(fullTranscript);
                      }
                      recognitionRef.current.stop();
                    }
                  }, 8000); // Maximum 8 seconds
                } catch (startError) {
                  console.error('Error calling start() in Safari:', startError);
                  setIsListening(false);
                  toast({
                    title: "Microphone Error", 
                    description: "Failed to start recording. Try clicking the microphone button again.",
                    variant: "destructive",
                  });
                }
              }, 50);
            })
            .catch((permissionError) => {
              console.error('Safari microphone permission denied:', permissionError);
              setIsListening(false);
              toast({
                title: "Microphone Permission Required",
                description: "Please allow microphone access in Safari settings and try again.",
                variant: "destructive",
              });
            });
        } else {
          // Non-Safari browsers or Safari without getUserMedia
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              console.log('✅ Speech recognition started successfully');
              
              // Set maximum duration timer (8 seconds total)
              maxDurationTimerRef.current = setTimeout(() => {
                console.log('Maximum duration reached (8s), forcing stop');
                if (recognitionRef.current && isListening) {
                  const fullTranscript = finalTranscriptRef.current.trim();
                  if (fullTranscript && onResultCallbackRef.current) {
                    console.log('Sending transcript due to max duration:', fullTranscript);
                    onResultCallbackRef.current(fullTranscript);
                  }
                  recognitionRef.current.stop();
                }
              }, 8000); // Maximum 8 seconds
            } catch (startError) {
              console.error('Error calling start():', startError);
              setIsListening(false);
              toast({
                title: "Microphone Error", 
                description: "Failed to start recording. Try clicking the microphone button again.",
                variant: "destructive",
              });
            }
          }, 50);
        }
        
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        toast({
          title: "Microphone Error",
          description: "Speech recognition setup failed. Please refresh the page.",
          variant: "destructive",
        });
      }
    }
  };

  const autoStartListening = (onResult: (transcript: string) => void, language: 'en' | 'es' = 'en', delay: number = 500) => {
    if (!speechSupported || isListening) {
      return;
    }

    console.log(`Auto-starting microphone in ${delay}ms...`);
    
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
    }

    autoStartTimeoutRef.current = setTimeout(() => {
      console.log('Auto-starting speech recognition');
      startListening(onResult, language);
    }, delay);
  };

  useEffect(() => {
    const handleVisibilityLoss = () => {
      if (document.visibilityState !== 'hidden') {
        return;
      }

      if (azureSTTActiveRef.current) {
        stopAzureSTT().catch((error) => console.warn('Error stopping Azure STT on visibility change:', error));
      }

      if (browserRecognitionAvailable && isListening) {
        stopBrowserRecognition();
        setIsListening(false);
      }
    };

    const handleWindowBlur = () => {
      if (!isListening && !azureSTTActiveRef.current) {
        return;
      }

      if (azureSTTActiveRef.current) {
        stopAzureSTT().catch((error) => console.warn('Error stopping Azure STT on window blur:', error));
      }

      if (browserRecognitionAvailable && isListening) {
        stopBrowserRecognition();
        setIsListening(false);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityLoss);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityLoss);
    };
  }, [browserRecognitionAvailable, isListening, stopAzureSTT, stopBrowserRecognition]);

  return {
    isListening,
    speechSupported,
    startListening,
    autoStartListening
  };
};
