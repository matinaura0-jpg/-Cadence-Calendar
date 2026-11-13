import {useEffect, useState} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'; platform: string}>;
}

export type DevicePlatform = 'android' | 'ios' | 'macos' | 'windows' | 'other';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>('other');

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as {standalone?: boolean}).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const maxTouch = window.navigator.maxTouchPoints || 0;
    if (/android/.test(ua)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && maxTouch > 1)) {
      setPlatform('ios');
    } else if (/macintosh|mac os x/.test(ua)) {
      setPlatform('macos');
    } else if (/windows/.test(ua)) {
      setPlatform('windows');
    } else {
      setPlatform('other');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const {outcome} = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS: platform === 'ios',
    platform,
    install,
  };
}
