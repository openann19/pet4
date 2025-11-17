# RouteErrorBoundary

A specialized error boundary component for handling navigation and route-level errors. Automatically resets when the route changes, providing a better user experience for navigation errors.

## Overview

`RouteErrorBoundary` extends the basic error boundary pattern with route-aware error handling. It automatically detects different types of navigation errors (chunk load errors, hydration mismatches, 404s, etc.) and provides appropriate recovery options.

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `children` | `ReactNode` | - | ✅ | Child components to wrap with error boundary |
| `fallback` | `ReactNode` | - | ❌ | Custom fallback UI to display on error |
| `onError` | `(error: Error, errorInfo: ErrorInfo, errorType: NavigationError['type']) => void` | - | ❌ | Callback fired when error is caught |
| `onReset` | `() => void` | - | ❌ | Callback fired when error is reset |

## Usage

### Basic Route Error Boundary

```tsx
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <RouteErrorBoundary>
      <Outlet />
    </RouteErrorBoundary>
  );
}
```

### With Error Tracking

```tsx
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { reportNavigationError } from '@/lib/error-reporting';

function App() {
  return (
    <RouteErrorBoundary
      onError={(error, errorInfo, errorType) => {
        reportNavigationError({
          error,
          errorType,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </RouteErrorBoundary>
  );
}
```

### With Custom Fallback

```tsx
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';

function App() {
  return (
    <RouteErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Navigation Error</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't load this page. Please try again.
          </p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      }
    >
      <Routes>...</Routes>
    </RouteErrorBoundary>
  );
}
```

## Error Types

The component automatically detects and categorizes errors:

| Error Type | Description | Recovery Action |
|------------|-------------|-----------------|
| `chunk-load-error` | Failed to load code chunk (common after deployments) | Hard reload page |
| `hydration-mismatch` | Server/client content mismatch | Hard reload page |
| `404` | Page not found | Navigate to home or show 404 page |
| `500` | Server error | Retry or navigate away |
| `data-fetch-error` | Failed to fetch data | Retry or check connection |
| `unknown` | Unrecognized error | Generic retry |

## Default Error UI

The default error UI includes:

- **Alert Component**: Uses shadcn/ui Alert with destructive variant
- **Error Type Message**: Context-specific error message based on error type
- **Error Details**: (Development only) Expandable error stack trace
- **Navigation Context**: Shows from/to paths (if available)
- **Recovery Actions**:
  - **Try Again**: Resets error boundary (for most errors)
  - **Hard Reload**: Full page reload (for chunk-load errors)
  - **Go Home**: Navigates to home page
  - **Refresh Page**: Standard page refresh

## Automatic Reset on Route Change

The error boundary automatically resets when the route changes:

```tsx
// User navigates from /profile to /settings
// If /profile had an error, it's automatically cleared
<RouteErrorBoundary>
  <Routes>
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Routes>
</RouteErrorBoundary>
```

## Error Detection

The component uses pattern matching to detect error types:

```typescript
// Detects chunk load errors
if (message.includes('chunk') || name === 'ChunkLoadError') {
  return 'chunk-load-error';
}

// Detects hydration errors
if (message.includes('hydration')) {
  return 'hydration-mismatch';
}

// Detects 404 errors
if (message.includes('404') || name === 'NotFoundError') {
  return '404';
}
```

## Accessibility

- ✅ **ARIA Alerts**: Uses `Alert` component with proper ARIA attributes
- ✅ **Keyboard Navigation**: All buttons are keyboard accessible
- ✅ **Screen Reader Support**: Error messages are announced
- ✅ **Focus Management**: Focus moves to error UI when error occurs

### A11y Best Practices

```tsx
<RouteErrorBoundary
  fallback={
    <div role="alert" aria-live="assertive" aria-atomic="true">
      <h1>Navigation Error</h1>
      <p>An error occurred while loading this page.</p>
      <button aria-label="Reload page">Reload</button>
    </div>
  }
>
  <Routes>...</Routes>
</RouteErrorBoundary>
```

## Error Logging

Errors are logged with navigation context:

```typescript
logger.error('Route navigation error', error, {
  errorType: 'chunk-load-error',
  fromPath: '/profile',
  toPath: '/settings',
  componentStack: errorInfo.componentStack,
  navigationError: {
    type: 'chunk-load-error',
    error,
    fromPath: '/profile',
    toPath: '/settings',
    timestamp: '2025-01-27T12:00:00Z',
  },
});
```

## Related Components

- `ErrorBoundary` - Basic error boundary for non-route errors
- `ChatErrorBoundary` - Error boundary for chat components
- `useNavigationErrorTracking` - Hook for tracking navigation errors

## Best Practices

1. **Wrap Routes**: Place at the route level, not component level
2. **Track Errors**: Use `onError` callback for error analytics
3. **Handle Reset**: Use `onReset` to clear related navigation state
4. **Test Error Scenarios**: Test chunk load errors, 404s, etc.
5. **Monitor Error Types**: Track which error types occur most frequently

## Common Error Scenarios

### Chunk Load Error (After Deployment)

```tsx
// User has old code cached, new deployment breaks it
// Solution: Hard reload clears cache
<RouteErrorBoundary>
  {/* Automatically shows "Hard Reload Page" button */}
</RouteErrorBoundary>
```

### Hydration Mismatch

```tsx
// Server renders one thing, client renders another
// Solution: Hard reload fixes mismatch
<RouteErrorBoundary>
  {/* Automatically detects and handles */}
</RouteErrorBoundary>
```

### 404 Error

```tsx
// Route doesn't exist
// Solution: Navigate to home or show 404 page
<RouteErrorBoundary>
  {/* Shows "Go Home" button */}
</RouteErrorBoundary>
```

## Implementation Notes

- Uses React Router hooks (`useLocation`, `useNavigate`)
- Automatically resets on route change via `componentDidUpdate`
- Detects error types using pattern matching
- Provides context-specific error messages
- Logs errors with full navigation context
