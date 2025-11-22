# ErrorBoundary

A React error boundary component that catches JavaScript errors anywhere in the child component tree, logs those errors, and displays a fallback UI instead of crashing the entire application.

## Overview

`ErrorBoundary` is a class component that implements React's error boundary pattern. It catches errors during rendering, in lifecycle methods, and in constructors of the whole tree below them. This prevents the entire app from unmounting when an error occurs.

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `children` | `ReactNode` | - | ✅ | Child components to wrap with error boundary |
| `fallback` | `ReactNode` | - | ❌ | Custom fallback UI to display on error |
| `onError` | `(error: Error, errorInfo: ErrorInfo) => void` | - | ❌ | Callback fired when error is caught |
| `onReset` | `() => void` | - | ❌ | Callback fired when error is reset |

## Usage

### Basic Error Boundary

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### With Custom Fallback

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center">
          <h2>Something went wrong</h2>
          <p>Please contact support if this persists.</p>
        </div>
      }
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### With Error Callback

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { reportError } from '@/lib/error-reporting';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Report to error tracking service
        reportError(error, {
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### With Reset Callback

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      onReset={() => {
        // Clear any error state
        navigate('/');
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Nested Error Boundaries

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}
```

## Default Error UI

When no custom `fallback` is provided, the component displays:

- **Warning Icon**: Visual indicator of error state
- **Error Message**: "Oops! Something went wrong"
- **Description**: Helpful message suggesting page refresh
- **Error Details**: (Development only) Expandable error stack trace
- **Action Buttons**:
  - "Try Again" - Resets the error boundary
  - "Refresh Page" - Hard reloads the page

## Error Logging

Errors are automatically logged using the structured logger:

```typescript
logger.error('ErrorBoundary caught error', error, {
  componentStack: errorInfo.componentStack,
  errorBoundary: true,
});
```

## What Errors Are Caught?

✅ **Caught by Error Boundaries:**
- Errors during rendering
- Errors in lifecycle methods
- Errors in constructors

❌ **NOT Caught by Error Boundaries:**
- Errors in event handlers (use try/catch)
- Errors in async code (use try/catch)
- Errors during server-side rendering
- Errors thrown in the error boundary itself

## Accessibility

- ✅ **ARIA Labels**: Error UI includes proper ARIA labels
- ✅ **Focus Management**: Buttons are keyboard accessible
- ✅ **Screen Reader Support**: Error messages are announced
- ✅ **High Contrast**: Uses theme colors with sufficient contrast

### A11y Best Practices

```tsx
<ErrorBoundary
  fallback={
    <div role="alert" aria-live="assertive">
      <h2>Error occurred</h2>
      <p>An error has occurred. Please try again.</p>
    </div>
  }
>
  <MyComponent />
</ErrorBoundary>
```

## Development vs Production

- **Development**: Error details (stack trace) are shown in expandable details
- **Production**: Only user-friendly error message is shown

## Related Components

- `RouteErrorBoundary` - Error boundary for route-level errors
- `ChatErrorBoundary` - Error boundary for chat components
- `EnhancedErrorBoundary` - Enhanced error boundary with more features

## Best Practices

1. **Place Strategically**: Wrap major sections, not every component
2. **Use Multiple Boundaries**: Isolate errors to prevent full app crashes
3. **Log Errors**: Always use `onError` callback for error tracking
4. **Provide Fallbacks**: Use custom `fallback` for better UX
5. **Handle Reset**: Use `onReset` to clear related state

## Implementation Notes

- Uses class component (required for error boundaries in React)
- Implements `componentDidCatch` lifecycle method
- Uses `getDerivedStateFromError` for error state
- Logs errors to structured logger
- Provides default error UI with recovery options
