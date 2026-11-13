import React, {useState} from 'react';
import {Download, Monitor, Share, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({compact = false}) => {
  const {isInstallable, isInstalled, platform, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleTrigger = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleTrigger}
        className={
          compact
            ? 'inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
            : 'w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
        }
      >
        <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>{isInstallable ? 'Install App' : 'Get Desktop & Mobile App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="pwa-install-title"
                  className="text-lg font-semibold text-slate-900 dark:text-white font-display"
                >
                  Install Cadence Across Your Devices
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Run Cadence as a native standalone app with offline support on Android, Apple, and Windows.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isInstallable && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-4">
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  Your browser supports one-click installation right now.
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setShowGuide(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  Install Now
                </button>
              </div>
            )}

            <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <div className={`py-3.5 ${platform === 'android' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Android (Chrome / Edge)</span>
                  {platform === 'android' && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">· Current device</span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Open the browser menu (⋮) and tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </p>
              </div>

              <div className={`py-3.5 ${platform === 'ios' || platform === 'macos' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Apple iPhone, iPad &amp; Mac (Safari)</span>
                  {(platform === 'ios' || platform === 'macos') && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">· Current device</span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  On iPhone/iPad, tap <strong>Share</strong> in Safari and choose <strong>Add to Home Screen</strong>. On Mac Safari, open <strong>File → Add to Dock</strong>.
                </p>
              </div>

              <div className={`py-3.5 ${platform === 'windows' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Windows (Edge / Chrome)</span>
                  {platform === 'windows' && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">· Current device</span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Click the <strong>Install Cadence</strong> icon on the right side of the address bar, or open menu (⋯) → <strong>Apps → Install this site as an app</strong>.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
