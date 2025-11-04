import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

// Conditionally import Spark if available (non-blocking)
 
import("@github/spark/spark" as string).catch(() => {
  // Spark not available, continue without it
});

// Patch Spark APIs to handle auth errors gracefully
import './lib/spark-patch'

import './lib/theme-init'

import AdminConsole from './components/AdminConsole'
import { ErrorFallback } from './ErrorFallback.tsx'
import { AppProvider } from './contexts/AppContext.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <AppProvider>
      <div className="min-h-screen bg-background text-foreground">
        <AdminConsole />
      </div>
    </AppProvider>
   </ErrorBoundary>
)
