# Navigation Error Bug Title Guide

## Quick Reference

When reporting navigation errors, use this standardized format:

```
Navigation error: /from → /to — {ErrorType}
```

## Error Type Labels

| Error Type | Label | Description |
|------------|-------|-------------|
| `chunk-load-error` | `ChunkLoadError` | Failed to load application code after deployment |
| `hydration-mismatch` | `Hydration mismatch` | Content mismatch between server and client |
| `404` | `404` | Route not found |
| `500` | `Route-level 500` | Server error on route |
| `data-fetch-error` | `Data-fetch error` | Failed to load data for route |
| `unknown` | `Unknown error` | Unclassified error |

## Examples

### ChunkLoadError
```
Navigation error: /discover → /matches — ChunkLoadError
```

### Hydration Mismatch
```
Navigation error: /chat → /profile — Hydration mismatch
```

### 404 / Broken Route
```
Navigation error: /old-page → /nonexistent — 404
```

### Route-level 500
```
Navigation error: /discover → /matches — Route-level 500
```

### Data-fetch Error
```
Navigation error: /profile → /settings — Data-fetch error
```

## Usage in Code

```typescript
import { generateNavigationErrorBugTitle } from '@/lib/navigation-error-utils';

// In error handler
useNavigationErrorTracking({
  onError: (error) => {
    const bugTitle = generateNavigationErrorBugTitle(error);
    // Use bugTitle in your bug tracking system
    console.log(bugTitle);
    // Output: "Navigation error: /discover → /matches — ChunkLoadError"
  },
});
```

## Quick Instrumentation

The navigation error tracking is already integrated in `App.tsx`. Errors are automatically logged with the logger.

To add custom error reporting:

```typescript
useNavigationErrorTracking({
  enabled: true,
  onError: (error) => {
    const bugTitle = generateNavigationErrorBugTitle(error);

    // Send to your error tracking service
    errorTrackingService.captureException(error.error, {
      tags: {
        errorType: error.type,
        bugTitle,
      },
      extra: {
        fromPath: error.fromPath,
        toPath: error.toPath,
        timestamp: error.timestamp,
      },
    });
  },
});
```

## Common Scenarios

### After Deployment
If users report errors after a deployment, it's likely a `ChunkLoadError`:
```
Navigation error: /home → /discover — ChunkLoadError
```
**Solution**: User needs to hard reload the page.

### Works on Refresh, Breaks on Navigation
This is typically a `Hydration mismatch`:
```
Navigation error: /chat → /matches — Hydration mismatch
```
**Solution**: Check for server/client rendering differences.

### Link Points to Non-existent Page
This is a `404`:
```
Navigation error: /old-page → /nonexistent — 404
```
**Solution**: Update the link or create the missing route.

### Page Loads but Throws Error
This could be a `Route-level 500` or `Data-fetch error`:
```
Navigation error: /discover → /matches — Route-level 500
```
**Solution**: Check server logs and API endpoints.
