import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) return;
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-semibold transition-transform active:scale-[0.98] hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'min-h-[40px] px-3 text-xs' : 'min-h-[44px] px-4 text-sm'
        }`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#121a2b] border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="install-guide-title" className="text-lg font-bold text-slate-100">
                    Install MoneyQuest
                  </h3>
                  <p className="text-xs text-slate-400">Play offline anytime on your home screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-300 leading-relaxed">
              {isIOS ? (
                <ol className="space-y-2.5 list-decimal list-inside">
                  <li>Tap the <strong className="text-slate-100">Share</strong> button in the Safari toolbar.</li>
                  <li>Scroll down and tap <strong className="text-slate-100">Add to Home Screen</strong>.</li>
                  <li>Tap <strong className="text-slate-100">Add</strong> to launch MoneyQuest like a native app.</li>
                </ol>
              ) : (
                <ol className="space-y-2.5 list-decimal list-inside">
                  <li>Open this game directly in <strong className="text-slate-100">Chrome on Android</strong> (outside embedded preview frames).</li>
                  <li>Tap the browser menu <strong className="text-slate-100">(⋮)</strong> in the top-right corner.</li>
                  <li>Tap <strong className="text-slate-100">Install app</strong> or <strong className="text-slate-100">Add to Home screen</strong>.</li>
                </ol>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full min-h-[48px] rounded-xl bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
