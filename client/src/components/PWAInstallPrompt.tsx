import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PWAInstallPrompt: React.FC = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay if not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // iOS requires manual installation
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="p-4 bg-white shadow-lg border-2 border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">{t('pwa.installTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {t('pwa.iosDescription')}
              </p>
              <ol className="text-xs text-gray-500 space-y-1">
                <li>1. {t('pwa.iosStep1')}</li>
                <li>2. {t('pwa.iosStep2')}</li>
                <li>3. {t('pwa.iosStep3')}</li>
              </ol>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Android/Desktop install prompt
  if (deferredPrompt && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="p-4 bg-white shadow-lg border-2 border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">{t('pwa.installTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {t('pwa.desktopDescription')}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {t('pwa.installNow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                >
                  {t('pwa.maybeLater')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PWAInstallPrompt: React.FC = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay if not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // iOS requires manual installation
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="p-4 bg-white shadow-lg border-2 border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">{t('pwa.installTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {t('pwa.iosDescription')}
              </p>
              <ol className="text-xs text-gray-500 space-y-1">
                <li>1. {t('pwa.iosStep1')}</li>
                <li>2. {t('pwa.iosStep2')}</li>
                <li>3. {t('pwa.iosStep3')}</li>
              </ol>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Android/Desktop install prompt
  if (deferredPrompt && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="p-4 bg-white shadow-lg border-2 border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">{t('pwa.installTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {t('pwa.desktopDescription')}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {t('pwa.installNow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                >
                  {t('pwa.maybeLater')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;