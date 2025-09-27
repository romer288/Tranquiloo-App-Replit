// ElevenLabs TTS service for high-quality speech synthesis

export interface TTSOptions {
  text: string;
  language: 'en' | 'es';
}

export interface TTSResult {
  audioUrl: string;
  cleanup: () => void;
}

export class ElevenLabsTTSService {
  private cache = new Map<string, string>();
  private activeAudio: HTMLAudioElement | null = null;
  private requestQueue: Array<() => void> = [];
  private activeRequests = 0;
  private maxConcurrentRequests = 1; // Limit to 1 to avoid ElevenLabs concurrent limit

  async synthesize(options: TTSOptions): Promise<TTSResult> {
    const { text, language } = options;

    // Create cache key
    const cacheKey = `${language}:${text}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const audioUrl = this.cache.get(cacheKey)!;
      return {
        audioUrl,
        cleanup: () => this.cleanupAudio(audioUrl)
      };
    }

    // Queue request if too many concurrent requests
    if (this.activeRequests >= this.maxConcurrentRequests) {
      await new Promise<void>((resolve) => {
        this.requestQueue.push(resolve);
      });
    }

    this.activeRequests++;

    try {
      console.log('🎤 ElevenLabs TTS request:', text.substring(0, 50) + '...');

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific ElevenLabs errors
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 503 || (errorData.error && errorData.error.includes('quota'))) {
          throw new Error('Quota exceeded');
        }

        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Convert response to blob and create URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache the result
      this.cache.set(cacheKey, audioUrl);

      // Auto-cleanup cache after 10 minutes
      setTimeout(() => {
        if (this.cache.has(cacheKey)) {
          const url = this.cache.get(cacheKey)!;
          URL.revokeObjectURL(url);
          this.cache.delete(cacheKey);
        }
      }, 10 * 60 * 1000);

      return {
        audioUrl,
        cleanup: () => this.cleanupAudio(audioUrl)
      };

    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      throw error;
    } finally {
      this.activeRequests--;

      // Process next request in queue
      if (this.requestQueue.length > 0) {
        const nextResolve = this.requestQueue.shift();
        if (nextResolve) {
          setTimeout(nextResolve, 100); // Small delay to avoid hammering
        }
      }
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      if (this.activeAudio) {
        this.activeAudio.pause();
        this.activeAudio = null;
      }

      const audio = new Audio(audioUrl);
      this.activeAudio = audio;

      audio.oncanplaythrough = () => {
        audio.play().then(resolve).catch(reject);
      };

      audio.onended = () => {
        this.activeAudio = null;
        resolve();
      };

      audio.onerror = () => {
        this.activeAudio = null;
        reject(new Error('Audio playback failed'));
      };

      // Set timeout for loading
      setTimeout(() => {
        if (audio.readyState < 2) { // HAVE_CURRENT_DATA
          reject(new Error('Audio loading timeout'));
        }
      }, 10000);
    });
  }

  stopAudio(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
  }

  private cleanupAudio(audioUrl: string): void {
    URL.revokeObjectURL(audioUrl);
  }

  // Clear all cached audio
  clearCache(): void {
    for (const url of this.cache.values()) {
      URL.revokeObjectURL(url);
    }
    this.cache.clear();
  }
}

export const elevenLabsTTS = new ElevenLabsTTSService();