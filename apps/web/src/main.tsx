import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from 'react-router-dom';

// Initialize storage service
import './lib/storage';

import './lib/theme-init';

// Initialize PWA service worker in production
import { registerServiceWorker } from './lib/pwa/service-worker-registration';

import App from './App';
import { ErrorFallback } from './ErrorFallback';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';

import "./index.css";
import "./main.css";
import "./styles/theme.css";

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker();
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <AppProvider>
        <UIProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </UIProvider>
      </AppProvider>
    </BrowserRouter>
   </ErrorBoundary>
)
