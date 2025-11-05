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
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '400px',
        width: 'calc(100% - 40px)',
        padding: '16px',
        backgroundColor: '#6366f1',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Install Pet3 App
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
            Get quick access and offline support
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '20px',
            lineHeight: 1,
            opacity: 0.8,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstall}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'white',
            color: '#6366f1',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
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
