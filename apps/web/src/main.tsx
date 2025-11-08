import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';

// Initialize storage service
import './lib/storage';

import './lib/theme-init';

// Initialize PWA service worker in production
import { createLogger } from './lib/logger';
import { registerServiceWorker } from './lib/pwa/service-worker-registration';

import App from './App';
import { ErrorFallback } from './ErrorFallback';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { QueryProvider } from './providers/QueryProvider';

import './index.css';
import './main.css';
import './styles/theme.css';

const rootLogger = createLogger('web.main');

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  void registerServiceWorker({
    onError: (error) => {
      rootLogger.error('Service worker registration failed', error);
    },
  });
}

// Initialize refresh rate detection
import { detectRefreshRate } from './lib/refresh-rate';
if (typeof window !== 'undefined') {
  detectRefreshRate();
}

// Initialize Web Vitals collection
import { initWebVitals } from './lib/web-vitals';

if (import.meta.env.PROD) {
  initWebVitals();
}

// Initialize error reporting
import { initErrorReporting } from './lib/error-reporting';
initErrorReporting({
  enabled: import.meta.env.PROD,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure <div id="root"></div> exists in index.html');
}

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <QueryProvider>
        <AppProvider>
          <UIProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </UIProvider>
        </AppProvider>
      </QueryProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

// --- ultra: sw register ---
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    rootLogger.warn('Fallback service worker registration failed', {
      message: err.message,
      stack: err.stack,
    });
  });
}
