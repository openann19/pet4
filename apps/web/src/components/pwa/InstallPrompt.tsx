/**
 * InstallPrompt - PWA installation prompt component
 * Shows a banner prompting users to install the app
 */

import { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';

export function InstallPrompt() {
  const { canInstall, promptInstall, isInstalled } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isInstalled || !canInstall || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 max-w-[400px] w-[calc(100%-40px)] p-4 bg-indigo-500 text-white rounded-xl shadow-lg z-[9999] flex flex-col gap-3 animate-[slideUp_0.3s_ease-out]"
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="m-0 text-base font-semibold">Install Pet3 App</h3>
          <p className="mt-1 text-sm opacity-90">
            Get quick access and offline support
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="bg-transparent border-0 text-white cursor-pointer p-1 text-xl leading-none opacity-80"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => void handleInstall()}
          className="flex-1 p-2.5 bg-white text-indigo-500 border-0 rounded-lg font-semibold cursor-pointer text-sm"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2.5 bg-transparent text-white border border-white/30 rounded-lg font-semibold cursor-pointer text-sm"
        >
          Not Now
        </button>
      </div>
      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateX(-50%) translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
