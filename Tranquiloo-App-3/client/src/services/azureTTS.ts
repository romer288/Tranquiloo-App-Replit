interface AzureTTSResponse {
  audioData: ArrayBuffer;
  success: boolean;
  error?: string;
}

interface VoiceConfig {
  name: string;
  language: string;
  gender: 'Female' | 'Male';
}

class AzureTTSService {
  private baseUrl: string;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  // High-quality neural voices for Spanish and English
  private voices: Record<string, VoiceConfig> = {
    'en': {
      name: 'en-GB-MiaNeural',
      language: 'en-GB',
      gender: 'Female'
    },
    'es': {
      name: 'es-MX-CarlotaNeural',
      language: 'es-MX',
      gender: 'Female'
    }
  };

  constructor() {
    this.baseUrl = '/api/azure-tts';
  }

  async synthesize(text: string, language: 'en' | 'es' = 'en'): Promise<boolean> {
    try {
      if (!text.trim()) {
        throw new Error('Text cannot be empty');
      }

      const MAX_CHARACTERS = 4000;
      if (text.length > MAX_CHARACTERS) {
        throw new Error(`Text too long (max ${MAX_CHARACTERS} characters)`);
      }

      // Stop any current audio
      this.stopAudio();

      console.log(`🎤 Azure TTS request: ${text.substring(0, 50)}... (${language})`);

      const voice = this.voices[language] || this.voices['en'];

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: voice.name,
          language: voice.language
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise((resolve, reject) => {
        this.currentAudio = new Audio();
        this.currentAudio.src = audioUrl;
        this.currentAudio.preload = 'auto';
        this.currentAudio.autoplay = false;
        this.currentAudio.setAttribute('playsinline', 'true');
        this.isPlaying = true;

        this.currentAudio.onloadeddata = () => {
          console.log('🔊 Azure TTS audio loaded, playing...');
        };

        this.currentAudio.onended = () => {
          console.log('✅ Azure TTS playback completed');
          this.cleanup();
          this.isPlaying = false;
          resolve(true);
        };

        this.currentAudio.onerror = (e) => {
          console.error('❌ Azure TTS audio error:', e);
          this.cleanup();
          this.isPlaying = false;
          reject(new Error('Audio playback failed'));
        };

        this.currentAudio.load();

        this.currentAudio.play().catch((e) => {
          console.error('❌ Azure TTS play failed:', e);
          this.cleanup();
          this.isPlaying = false;

          // Check if it's a user interaction requirement
          if (e.name === 'NotAllowedError') {
            console.log('💡 User interaction required for audio. Tap any message to enable audio.');
            reject(new Error('User interaction required for audio playback'));
          } else {
            reject(new Error('Failed to start audio playback'));
          }
        });
      });

    } catch (error) {
      console.error('Azure TTS synthesis failed:', error);
      throw error;
    }
  }

  stopAudio(): void {
    if (this.currentAudio) {
      console.log('🛑 Stopping Azure TTS audio');
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.cleanup();
    }
    this.isPlaying = false;
  }

  private cleanup(): void {
    if (this.currentAudio) {
      URL.revokeObjectURL(this.currentAudio.src);
      this.currentAudio = null;
    }
  }

  isSpeaking(): boolean {
    return this.isPlaying;
  }

  // Get available voices for language
  getVoice(language: 'en' | 'es'): VoiceConfig {
    return this.voices[language] || this.voices['en'];
  }
}

export const azureTTS = new AzureTTSService();