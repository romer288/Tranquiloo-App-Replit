interface AzureSTTResponse {
  transcript: string;
  confidence: number;
  success: boolean;
}

class AzureSTTService {
  private baseUrl: string;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentLanguage: 'en-US' | 'es-MX' = 'es-MX';
  private activeStream: MediaStream | null = null;
  private recordingMode: 'mediaRecorder' | 'webAudio' | null = null;
  private audioContext: (AudioContext | null) = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private webAudioSource: MediaStreamAudioSourceNode | null = null;
  private webAudioGain: GainNode | null = null;
  private recordedBuffers: Float32Array[] = [];
  private recordedSampleRate = 44100;
  private safariUnlockContext: AudioContext | null = null;
  private safariDebugCounter = 0;
  private lastSafariDebugId: string | null = null;
  private readonly isSafari: boolean;
  private readonly handleVisibilityChange: () => void;
  private safariClickDebugInstalled = false;
  private safariClickCaptureListener: ((event: MouseEvent) => void) | null = null;
  private safariPointerCaptureListener: ((event: PointerEvent) => void) | null = null;

  constructor() {
    this.baseUrl = '/api/azure-stt';
    this.isSafari = typeof navigator !== 'undefined'
      ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      : false;

    this.handleVisibilityChange = () => {
      if (document.visibilityState === 'visible'
        && this.safariUnlockContext && (this.safariUnlockContext.state as string) === 'interrupted') {
        console.debug('🔁 Safari visibility change detected, attempting to resume AudioContext');
        void this.resumeSafariUnlockContext();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (this.isSafari) {
      this.installSafariGestureDebugging();
      if (typeof document !== 'undefined') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          this.auditSafariMicButtons();
        } else {
          document.addEventListener('DOMContentLoaded', () => this.auditSafariMicButtons(), { once: true });
        }
      }
    }
  }

  private async resumeSafariUnlockContext(): Promise<void> {
    if (!this.safariUnlockContext) {
      return;
    }

    if (this.safariUnlockContext.state === 'running') {
      console.debug('✅ Safari AudioContext already running, no resume needed');
      return;
    }

    try {
      console.debug('⏯️ Attempting to resume Safari AudioContext, current state:', this.safariUnlockContext.state);
      await this.safariUnlockContext.resume();
      console.debug('▶️ Safari AudioContext resumed, new state:', this.safariUnlockContext.state);
    } catch (error) {
      console.warn('Failed to resume Safari AudioContext:', error);
    }
  }

  private ensureSafariAudioContextUnlocked(): Promise<boolean> {
    if (typeof window === 'undefined' || !this.isSafari) {
      return Promise.resolve(true);
    }

    this.safariDebugCounter += 1;
    const debugId = `SafariUnlock#${this.safariDebugCounter}`;
    this.lastSafariDebugId = debugId;
    console.debug(`${debugId}: Ensuring Safari AudioContext is unlocked`);

    const AudioContextConstructor = window.AudioContext
      || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    this.reportSafariEnvironment(AudioContextConstructor, debugId);
    void this.reportSafariPermissionState(debugId);
    void this.debugAvailableAudioInputs(debugId);

    if (!AudioContextConstructor) {
      console.warn(`${debugId}: No AudioContext constructor available in Safari environment`);
      return Promise.resolve(false);
    }

    if (!this.safariUnlockContext) {
      try {
        this.safariUnlockContext = new AudioContextConstructor();
        console.debug(`${debugId}: Created Safari unlock AudioContext`, {
          state: this.safariUnlockContext.state,
          sampleRate: this.safariUnlockContext.sampleRate
        });
      } catch (error) {
        console.warn(`${debugId}: Unable to create Safari AudioContext for unlocking microphone:`, error);
        return Promise.resolve(false);
      }
    } else {
      console.debug(`${debugId}: Reusing existing Safari unlock AudioContext`, {
        state: this.safariUnlockContext.state,
        sampleRate: this.safariUnlockContext.sampleRate
      });
    }

    return this.resumeSafariUnlockContext()
      .then(() => this.safariUnlockContext?.state === 'running');
  }

  private async reportSafariPermissionState(debugId: string): Promise<void> {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      return;
    }

    try {
      const permissionName = 'microphone' as PermissionName;
      const status = await (navigator.permissions as Permissions).query({ name: permissionName });
      console.debug(`${debugId}: navigator.permissions microphone state ->`, status.state);
    } catch (error) {
      console.debug(`${debugId}: Unable to read navigator.permissions microphone status`, error);
    }
  }

  private async debugAvailableAudioInputs(debugId: string): Promise<void> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      console.debug(`${debugId}: navigator.mediaDevices.enumerateDevices not supported`);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.debug(`${debugId}: Audio input devices detected ->`, audioInputs.map(device => ({
        deviceId: device.deviceId,
        label: device.label,
        groupId: device.groupId
      })));
    } catch (error) {
      console.debug(`${debugId}: Failed to enumerate audio devices`, error);
    }
  }

  private reportSafariEnvironment(AudioContextConstructor: typeof AudioContext | undefined, debugId: string) {
    if (typeof window === 'undefined' || !this.isSafari) {
      return;
    }

    if (!AudioContextConstructor) {
      console.warn(`${debugId}: Safari reported no AudioContext constructor. This usually means an outdated browser version or a restricted browsing mode that blocks advanced audio APIs.`);
    }

    try {
      if (window.self !== window.top) {
        const frameElement = window.frameElement as HTMLIFrameElement | null;
        const allowAttr = frameElement?.getAttribute?.('allow') || '';
        if (!/microphone/i.test(allowAttr)) {
          console.warn(`${debugId}: The app is running inside an iframe without an explicit "allow=\"microphone\"" permission. Safari will block microphone usage until the iframe allows it.`);
        }
      }
    } catch (error) {
      console.debug(`${debugId}: Unable to inspect iframe permissions due to cross-origin restrictions`, error);
    }
  }

  private interpretGetUserMediaError(error: unknown): void {
    if (typeof window === 'undefined') {
      return;
    }

    const suggestionPrefix = 'Safari microphone help:';
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          console.warn(`${suggestionPrefix} Permission denied. Confirm the site is allowed under Safari → Settings → Websites → Microphone or by clicking the mic icon in the address bar and choosing "Always Allow".`);
          break;
        case 'NotFoundError':
          console.warn(`${suggestionPrefix} No microphone was found. Check if any audio input is connected or enabled for Safari.`);
          break;
        case 'NotReadableError':
        case 'AbortError':
          console.warn(`${suggestionPrefix} Safari could not read from the microphone. Ensure no other app is using the mic and that the browser has permission.`);
          break;
        case 'SecurityError':
          console.warn(`${suggestionPrefix} Microphone requests must be served over HTTPS and not blocked by iframe sandboxing.`);
          break;
        default:
          console.warn(`${suggestionPrefix} Unexpected DOMException (${error.name}):`, error.message);
      }
    } else {
      console.warn(`${suggestionPrefix} Unknown error while requesting microphone:`, error);
    }
  }

  async startRecording(language: 'en-US' | 'es-MX'): Promise<MediaStream | null> {
    try {
      console.log(`🎤 Starting Azure STT recording for ${language}`);

      this.currentLanguage = language;

      const stream = await this.requestUserMedia();

      if (!stream) {
        console.error('❌ No stream returned from requestUserMedia');
        throw new Error('No microphone stream available');
      }

      if (this.isSafari) {
        const safariDebugId = this.lastSafariDebugId ? `${this.lastSafariDebugId}->stream` : 'SafariUnlock#stream';
        this.monitorStreamForSafari(stream, safariDebugId);
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️ Microphone stream contains no audio tracks', {
          trackCount: audioTracks.length,
          streamId: stream.id
        });
      } else {
        console.debug('🎚️ Received microphone stream', {
          streamId: stream.id,
          trackCount: audioTracks.length,
          tracks: audioTracks.map(track => ({
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label,
            settings: track.getSettings?.()
          }))
        });
      }

      this.audioChunks = [];
      this.recordedBuffers = [];
      this.recordingMode = null;

      this.activeStream = stream;

      const recorder = this.tryCreateMediaRecorder(stream);

      if (recorder) {
        this.mediaRecorder = recorder;
        this.recordingMode = 'mediaRecorder';

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        try {
          recorder.start(250);
        } catch (error) {
          console.warn('MediaRecorder start failed with timeslice, retrying without slice', error);
          recorder.start();
        }
        console.log('🎙️ MediaRecorder started. Mime type:', recorder.mimeType || 'default');
        return stream;
      }

      if (this.canUseWebAudioRecorder()) {
        await this.startWebAudioRecorder(stream);
        this.recordingMode = 'webAudio';
        return stream;
      }

      throw new Error('MediaRecorder API is not supported in this browser');

    } catch (error) {
      console.error('Error starting Azure STT recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<string> {
    if (this.recordingMode === 'mediaRecorder') {
      return this.stopMediaRecorder();
    }

    if (this.recordingMode === 'webAudio') {
      return this.stopWebAudioRecorder();
    }

    throw new Error('No active recording');
  }

  private async processAudio(audioBlob: Blob, language: 'en-US' | 'es-MX'): Promise<string> {
    try {
      console.log('🎵 Original audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Convert audio to WAV format for Azure STT compatibility when needed
      let processedBlob = audioBlob;

      if (!audioBlob.type.includes('wav')) {
        console.log('🔄 Converting audio to WAV for Azure STT...', audioBlob.type);
        try {
          processedBlob = await this.convertToWav(audioBlob);
          console.log('✅ Audio converted to WAV:', processedBlob.type);
        } catch (error) {
          console.warn('⚠️ WAV conversion failed, using original format:', error);
        }
      }

      const base64Audio = await this.blobToBase64(processedBlob);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBlob: base64Audio,
          language,
          audioFormat: processedBlob.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: AzureSTTResponse = await response.json();

      if (result.success && result.transcript) {
        console.log('✅ Azure STT transcript:', result.transcript);
        return result.transcript;
      } else {
        throw new Error('No transcript received from Azure STT');
      }

    } catch (error) {
      console.error('Azure STT processing failed:', error);
      throw error;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  isRecording(): boolean {
    if (this.recordingMode === 'mediaRecorder') {
      return this.mediaRecorder?.state === 'recording' || false;
    }

    if (this.recordingMode === 'webAudio') {
      return Boolean(this.audioContext);
    }

    return false;
  }

  cancelRecording(): void {
    if (this.recordingMode === 'mediaRecorder') {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        console.log('🛑 Cancelling Azure STT recording');
        this.mediaRecorder.stop();
        this.stopStreamTracks();
      }
    }

    if (this.recordingMode === 'webAudio') {
      console.log('🛑 Cancelling Web Audio recording');
      this.stopStreamTracks();
      void this.cleanupWebAudio();
    }

    this.resetRecordingState();
  }

  private async requestUserMedia(): Promise<MediaStream> {
    console.debug('🎯 Requesting user media for Azure STT');
    const safariUnlocked = await this.ensureSafariAudioContextUnlocked();
    if (!safariUnlocked && this.isSafari) {
      console.warn('⚠️ Safari AudioContext could not be unlocked inside the user gesture. Microphone capture may still be blocked until the user taps the button again.');
    }

    const hasMediaDevices = Boolean(navigator.mediaDevices?.getUserMedia);
    if (!hasMediaDevices) {
      console.warn('🚫 navigator.mediaDevices.getUserMedia is not available');
      if (this.isSafari) {
        console.warn('Safari microphone help: This Safari version may be too old to support navigator.mediaDevices. Update Safari or switch to a modern browser.');
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        console.debug('📡 navigator.mediaDevices.getUserMedia resolved successfully');
        return stream;
      } catch (error) {
        console.error('navigator.mediaDevices.getUserMedia rejected:', error);
        this.interpretGetUserMediaError(error);
        throw error;
      }
    }

    const legacyGetUserMedia = (navigator as any).webkitGetUserMedia;
    if (legacyGetUserMedia) {
      console.debug('🕰️ Falling back to legacy webkitGetUserMedia');
      return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, { audio: true },
          (stream: MediaStream) => {
            console.debug('📻 legacy webkitGetUserMedia resolved', { streamId: stream.id });
            resolve(stream);
          },
          (error: unknown) => {
            console.error('legacy webkitGetUserMedia rejected', error);
            this.interpretGetUserMediaError(error);
            reject(error);
          });
      });
    }

    throw new Error('Microphone access is not supported in this browser');
  }

  private monitorStreamForSafari(stream: MediaStream, debugId: string): void {
    const tracks = stream.getAudioTracks();
    tracks.forEach(track => {
      track.onended = () => {
        console.warn(`${debugId}: Audio track ended`, {
          id: track.id,
          label: track.label,
          readyState: track.readyState
        });
      };
      track.onmute = () => {
        console.warn(`${debugId}: Audio track muted`, {
          id: track.id,
          label: track.label,
          enabled: track.enabled
        });
      };
      track.onunmute = () => {
        console.debug(`${debugId}: Audio track unmuted`, {
          id: track.id,
          label: track.label,
          enabled: track.enabled
        });
      };
    });
  }

  private createMediaRecorder(stream: MediaStream): MediaRecorder {
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder API is not supported in this browser');
    }

    const preferredTypes = [
      'audio/wav',
      'audio/webm;codecs=pcm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of preferredTypes) {
      try {
        if (MediaRecorder.isTypeSupported?.(type)) {
          console.log(`🎵 Using ${type} for Azure STT recording`);
          return new MediaRecorder(stream, { mimeType: type });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to initialise MediaRecorder with ${type}:`, error);
      }
    }

    try {
      return new MediaRecorder(stream);
    } catch (error) {
      console.error('MediaRecorder could not be created with default settings:', error);
      throw error;
    }
  }

  private installSafariGestureDebugging(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined' || this.safariClickDebugInstalled) {
      return;
    }

    this.safariClickDebugInstalled = true;

    this.safariClickCaptureListener = (event: MouseEvent) => {
      this.logSafariGestureEvent(event, 'click');
    };

    this.safariPointerCaptureListener = (event: PointerEvent) => {
      this.logSafariGestureEvent(event, 'pointerdown');
    };

    document.addEventListener('click', this.safariClickCaptureListener, true);
    document.addEventListener('pointerdown', this.safariPointerCaptureListener, true);
  }

  private logSafariGestureEvent(event: MouseEvent | PointerEvent, phase: 'click' | 'pointerdown'): void {
    if (!this.isSafari || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    const composedPath = typeof event.composedPath === 'function'
      ? event.composedPath().filter((node): node is Element => node instanceof Element)
      : [];
    const primaryButton = target?.closest('button, [role="button"], [data-role*="mic"]') || null;
    const pointerEventsChain = composedPath.slice(0, 6).map(element => ({
      ...this.describeElement(element),
      pointerEvents: window.getComputedStyle(element).pointerEvents
    }));

    const debugSummary = {
      phase,
      defaultPrevented: event.defaultPrevented,
      isTrusted: event.isTrusted,
      target: target ? this.describeElement(target) : null,
      nearestButton: primaryButton ? this.describeElement(primaryButton) : null,
      pathPreview: pointerEventsChain
    };

    console.debug('🕵️ Safari mic gesture debug event', debugSummary);
  }

  private describeElement(element: Element) {
    if (!(element instanceof HTMLElement)) {
      return {
        tag: element.tagName.toLowerCase()
      };
    }

    const { id, className, role } = element;
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    return {
      tag: element.tagName.toLowerCase(),
      id: id || undefined,
      classes: className || undefined,
      role: role || element.getAttribute('role') || undefined,
      ariaLabel: element.getAttribute('aria-label') || undefined,
      title: element.getAttribute('title') || undefined,
      disabled: element instanceof HTMLButtonElement ? element.disabled : undefined,
      tabIndex: element.tabIndex,
      pointerEvents: computedStyle.pointerEvents,
      visibility: computedStyle.visibility,
      display: computedStyle.display,
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    };
  }

  private auditSafariMicButtons(): void {
    if (!this.isSafari || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const candidates = Array.from(document.querySelectorAll('button, [role="button"]')).filter(element => {
      const text = element.textContent?.toLowerCase() || '';
      const title = element.getAttribute('title')?.toLowerCase() || '';
      const aria = element.getAttribute('aria-label')?.toLowerCase() || '';
      return /mic|voice|habla|voz/.test(text + title + aria);
    }).slice(0, 5);

    console.debug('🕵️ Safari microphone button audit', candidates.map(candidate => this.describeElement(candidate)));
  }

  private stopStreamTracks() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }

    if (this.mediaRecorder?.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  private tryCreateMediaRecorder(stream: MediaStream): MediaRecorder | null {
    if (typeof MediaRecorder === 'undefined') {
      return null;
    }

    try {
      return this.createMediaRecorder(stream);
    } catch (error) {
      console.warn('MediaRecorder could not be created, falling back to Web Audio recorder:', error);
      return null;
    }
  }

  private canUseWebAudioRecorder(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const AudioContextConstructor = (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    return Boolean(AudioContextConstructor);
  }

  private async startWebAudioRecorder(stream: MediaStream) {
    const AudioContextConstructor = (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

    if (!AudioContextConstructor) {
      throw new Error('AudioContext is not supported in this browser');
    }

    this.audioContext = new AudioContextConstructor();


    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume AudioContext before recording:', error);
      }
    }


    this.recordedSampleRate = this.audioContext.sampleRate;
    this.webAudioSource = this.audioContext.createMediaStreamSource(stream);
    this.webAudioGain = this.audioContext.createGain();
    this.webAudioGain.gain.value = 0;

    const bufferSize = 4096;
    this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    this.scriptProcessor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer.getChannelData(0);
      this.recordedBuffers.push(new Float32Array(inputBuffer));
      this.recordedSampleRate = event.inputBuffer.sampleRate || this.audioContext?.sampleRate || this.recordedSampleRate;
    };

    this.webAudioSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.webAudioGain);
    this.webAudioGain.connect(this.audioContext.destination);
  }

  private async stopWebAudioRecorder(): Promise<string> {
    if (!this.audioContext || this.recordingMode !== 'webAudio') {
      throw new Error('No active recording');
    }

    const mergedBuffer = this.mergeRecordedBuffers();
    if (!mergedBuffer) {
      throw new Error('No audio data captured');
    }

    const sampleRate = this.recordedSampleRate || this.audioContext.sampleRate;
    const audioBuffer = this.createAudioBufferFromFloat32(mergedBuffer, sampleRate);
    const wavBlob = this.audioBufferToWav(audioBuffer);

    this.stopStreamTracks();
    await this.cleanupWebAudio();

    const transcript = await this.processAudio(wavBlob, this.currentLanguage);
    this.resetRecordingState();
    return transcript;
  }

  private mergeRecordedBuffers(): Float32Array | null {
    if (!this.recordedBuffers.length) {
      return null;
    }

    const length = this.recordedBuffers.reduce((total, buffer) => total + buffer.length, 0);
    const merged = new Float32Array(length);
    let offset = 0;

    for (const buffer of this.recordedBuffers) {
      merged.set(buffer, offset);
      offset += buffer.length;
    }

    return merged;
  }

  private createAudioBufferFromFloat32(data: Float32Array, sampleRate: number): AudioBuffer {
    if (this.audioContext) {
      const buffer = this.audioContext.createBuffer(1, data.length, sampleRate);
      buffer.copyToChannel(data, 0);
      return buffer;
    }

    const audioBuffer = new AudioBuffer({ length: data.length, numberOfChannels: 1, sampleRate });
    audioBuffer.copyToChannel(data, 0);
    return audioBuffer;
  }

  private async cleanupWebAudio() {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    if (this.webAudioSource) {
      this.webAudioSource.disconnect();
      this.webAudioSource = null;
    }

    if (this.webAudioGain) {
      this.webAudioGain.disconnect();
      this.webAudioGain = null;
    }

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn('Failed to close AudioContext cleanly:', error);
      }
      this.audioContext = null;
    }
  }

  private resetRecordingState() {
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.activeStream = null;
    this.recordingMode = null;
    this.recordedBuffers = [];
    this.recordedSampleRate = 44100;
    this.currentLanguage = 'es-MX';
  }

  private stopMediaRecorder(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          console.log('🎤 Processing Azure STT audio');

          const blobType = this.audioChunks[0]?.type || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: blobType });
          const transcript = await this.processAudio(audioBlob, this.currentLanguage);

          this.stopStreamTracks();
          this.resetRecordingState();

          resolve(transcript);
        } catch (error) {
          console.error('Error processing Azure STT audio:', error);
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Convert blob to array buffer
    const arrayBuffer = await webmBlob.arrayBuffer();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to WAV format
    const wavBlob = this.audioBufferToWav(audioBuffer);

    // Close audio context to free resources
    audioContext.close();

    return wavBlob;
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = 1; // Mono for Azure STT
    const sampleRate = 16000; // 16kHz for Azure STT
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    // Resample to 16kHz if necessary
    let audioData = buffer.getChannelData(0);
    if (buffer.sampleRate !== sampleRate) {
      audioData = this.resample(audioData, buffer.sampleRate, sampleRate);
    }

    const arrayBuffer = new ArrayBuffer(44 + audioData.length * bytesPerSample);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, audioData.length * bytesPerSample, true);

    // Convert audio data to 16-bit PCM
    const offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset + i * 2, sample * 0x7FFF, true);
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private resample(audioData: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
    if (fromSampleRate === toSampleRate) return audioData;

    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const index = i * ratio;
      const indexFloor = Math.floor(index);
      const indexCeil = Math.min(indexFloor + 1, audioData.length - 1);
      const fraction = index - indexFloor;

      result[i] = audioData[indexFloor] * (1 - fraction) + audioData[indexCeil] * fraction;
    }

    return result;
  }
}

export const azureSTT = new AzureSTTService();
