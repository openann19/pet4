# Navigation Error Handling Implementation

## Overview

Comprehensive navigation error handling system for React Router-based application, providing route-level error boundaries, error tracking, and standardized bug reporting.

## Components

### 1. RouteErrorBoundary (`src/components/error/RouteErrorBoundary.tsx`)

Route-level error boundary that catches navigation errors and displays appropriate error messages based on error type.

**Features:**
- Detects error types: ChunkLoadError, Hydration mismatch, 404, 500, Data-fetch errors
- Provides context-aware error messages
- Offers recovery actions (Retry, Go Home, Hard Reload)
- Auto-resets when route changes

**Usage:**
```tsx
<RouteErrorBoundary>
  <YourRouteComponent />
</RouteErrorBoundary>
```

### 2. Navigation Error Tracking Hook (`src/hooks/use-navigation-error-tracking.ts`)

Hook that tracks navigation errors globally, listening for:
- Window error events
- Unhandled promise rejections
- Chunk load errors

**Usage:**
```tsx
useNavigationErrorTracking({
  enabled: true,
  onError: (error) => {
    // Handle navigation error
  },
});
```

### 3. NotFoundPage (`src/components/error/NotFoundPage.tsx`)

Dedicated 404 page component for unmatched routes.

### 4. Navigation Error Utilities (`src/lib/navigation-error-utils.ts`)

Utilities for generating standardized bug titles and error reports.

**Bug Title Format:**
```
Navigation error: /from → /to — {ErrorType}
```

**Error Types:**
- `ChunkLoadError` - Failed to load application code after deployment
- `Hydration mismatch` - Content mismatch between server and client
- `404` - Route not found
- `Route-level 500` - Server error on route
- `Data-fetch error` - Failed to load data for route
- `Unknown error` - Unclassified error

## Integration

The navigation error handling is integrated into `App.tsx`:

1. **RouteErrorBoundary** wraps all route components
2. **useNavigationErrorTracking** is called at the app level
3. **NotFoundPage** is available at `/404` route

## Error Detection

The system automatically detects error types by analyzing:
- Error message content
- Error name
- Error stack traces
- Event metadata

## Recovery Actions

Depending on error type, users are presented with:

- **ChunkLoadError**: Hard reload button (forces full page refresh)
- **Other errors**: Try Again button (resets error boundary)
- **All errors**: Go Home button (navigates to root)
- **Non-chunk errors**: Refresh Page button (soft reload)

## Testing

Test files:
- `src/components/error/__tests__/RouteErrorBoundary.test.tsx`
- `src/hooks/__tests__/use-navigation-error-tracking.test.tsx`

## Bug Tracking

Use the utility function to generate standardized bug titles:

```tsx
import { generateNavigationErrorBugTitle } from '@/lib/navigation-error-utils';

const bugTitle = generateNavigationErrorBugTitle(navigationError);
// Output: "Navigation error: /discover → /matches — ChunkLoadError"
```

## Best Practices

1. **Wrap routes with RouteErrorBoundary** for route-level error handling
2. **Use navigation error tracking** at the app level for global error monitoring
3. **Generate bug titles** using the utility function for consistent reporting
4. **Handle chunk errors** by prompting users to hard reload after deployments

## Future Enhancements

- Integration with error reporting services (Sentry, etc.)
- Analytics tracking for navigation error patterns
- Automatic retry mechanisms for transient errors
- User-friendly error messages with actionable guidance
