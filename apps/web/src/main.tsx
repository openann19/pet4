// Polyfill for react-native-reanimated on web (backup - primary polyfill is in index.html)
// Fixes "Cannot read properties of undefined (reading 'JEST_WORKER_ID')" error
type ProcessEnvPolyfill = Partial<NodeJS.ProcessEnv> & Record<string, string | undefined>;

type ProcessPolyfill = NodeJS.Process & {
  env: ProcessEnvPolyfill;
};

type GlobalWithProcess = typeof globalThis & {
  process?: NodeJS.Process;
};

const globalWithProcess = globalThis as GlobalWithProcess;

const ensureProcessPolyfill = (): ProcessPolyfill => {
  const existing = globalWithProcess.process as ProcessPolyfill | undefined;
  if (existing) {
    if (!existing.env) {
      existing.env = {} as ProcessEnvPolyfill;
    }
    return existing;
  }

  const polyfill = {
    env: {} as ProcessEnvPolyfill,
  } as ProcessPolyfill;

  globalWithProcess.process = polyfill;
  return polyfill;
};

if (typeof window !== 'undefined') {
  const polyfillProcess = ensureProcessPolyfill();

  if (!polyfillProcess.env) {
    polyfillProcess.env = {};
  }

  if (!('JEST_WORKER_ID' in polyfillProcess.env)) {
    polyfillProcess.env.JEST_WORKER_ID = undefined;
  }
}

import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';

// Initialize storage service
import './lib/storage';

import './lib/theme-init';

// Initialize PWA service worker in production
import { createLogger } from './lib/logger';

import App from './App';
import { ErrorFallback } from './ErrorFallback';
import GlobalNavErrorTrap from './components/GlobalNavErrorTrap';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './contexts/ThemeContext';

import './index.css';
import './main.css';
import './styles/theme.css';

const rootLogger = createLogger('web.main');

// Initialize refresh rate detection
import { detectRefreshRate } from './lib/refresh-rate';
let _refreshRateCleanup: (() => void) | null = null;
if (typeof window !== 'undefined') {
  try {
    _refreshRateCleanup = detectRefreshRate();
    if (_refreshRateCleanup) {
      window.addEventListener('beforeunload', _refreshRateCleanup);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    rootLogger.error('Refresh rate detection failed', err);
  }
}

// Initialize error reporting
import { initErrorReporting } from './lib/error-reporting';
try {
  initErrorReporting({
    enabled: import.meta.env.PROD,
  });
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  rootLogger.error('Error reporting initialization failed', err);
}

// Initialize worldwide scale features (includes SW, Web Vitals, and error tracking)
import { initializeWorldwideScale } from './lib/worldwide-scale-init';

// Initialize worldwide scale features after a short delay to ensure other services are ready
setTimeout(() => {
  void initializeWorldwideScale({
    enableServiceWorker: import.meta.env.PROD,
    enableErrorTracking: true,
    enableWebVitals: import.meta.env.PROD,
  })
}, 100)

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure <div id="root"></div> exists in index.html');
}

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <GlobalNavErrorTrap />
      <QueryProvider>
        <ThemeProvider>
          <AppProvider>
            <UIProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </UIProvider>
          </AppProvider>
        </ThemeProvider>
      </QueryProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
