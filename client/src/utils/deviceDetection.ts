// Device detection utilities for handling platform-specific OAuth behaviors

export const DeviceDetection = {
  isIOS: () => /iPhone|iPad|iPod/.test(navigator.userAgent),
  
  isSafari: () => /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
  
  isIOSSafari: () => DeviceDetection.isIOS() && DeviceDetection.isSafari(),
  
  isMobile: () => /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  
  // iOS Safari has specific issues with OAuth popups
  needsRedirectOAuth: () => DeviceDetection.isIOSSafari(),
  
  // Better redirect method for iOS
  safeRedirect: (url: string) => {
    if (DeviceDetection.isIOSSafari()) {
      // iOS Safari needs full URL and immediate redirect
      window.location.href = window.location.origin + url;
    } else {
      // Other browsers can use replace
      window.location.replace(url);
    }
  },
  
  getDeviceInfo: () => ({
    isIOS: DeviceDetection.isIOS(),
    isSafari: DeviceDetection.isSafari(),
    isIOSSafari: DeviceDetection.isIOSSafari(),
    isMobile: DeviceDetection.isMobile(),
    userAgent: navigator.userAgent
  }),

  // TTS-specific device detection
  isTablet: () => /tablet|ipad|kindle|silk|gt-p|gt-n|sgh-t|nexus|sm-t/i.test(navigator.userAgent),

  isAndroid: () => /android/i.test(navigator.userAgent),

  isDesktop: () => !DeviceDetection.isMobile() && !DeviceDetection.isTablet(),

  // TTS priority system
  getTTSPriority: (): 'azure-first' | 'webspeech-first' => {
    // All devices now use Azure TTS first (better quality, consistent voices)
    return 'azure-first';
  },

  shouldUseAzureFirst: () => DeviceDetection.getTTSPriority() === 'azure-first',

  getDeviceType: (): 'mobile' | 'tablet' | 'desktop' => {
    if (DeviceDetection.isMobile()) return 'mobile';
    if (DeviceDetection.isTablet()) return 'tablet';
    return 'desktop';
  }
};