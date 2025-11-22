# Sentry Error Tracking Setup

## Overview

Sentry is configured for error tracking and performance monitoring in production.

## Configuration

Sentry is initialized in `src/lib/monitoring/sentry-config.ts` and should be called during app initialization.

### Environment Variables

Required in production:
- `VITE_SENTRY_DSN`: Your Sentry DSN (get from Sentry dashboard)
- `VITE_SENTRY_TRACES_SAMPLE_RATE`: Performance sampling rate (default: 0.1 = 10%)
- `VITE_ENVIRONMENT`: Set to 'production' for production builds

### Initialization

Ensure Sentry is initialized in your app entry point:

```typescript
import { sentryConfig } from '@/lib/monitoring/sentry-config';

// Initialize Sentry
sentryConfig.init();

// Set user context when user logs in
sentryConfig.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});
```

## Error Alerting Setup

### 1. Sentry Dashboard Configuration

1. Go to your Sentry project settings
2. Navigate to **Alerts** → **Create Alert Rule**
3. Configure alert conditions:

**Critical Errors (P0)**:
- Condition: Error rate > 10 errors/minute
- Action: Send to PagerDuty/Slack/Email
- Threshold: Immediate notification

**High Priority Errors (P1)**:
- Condition: Error rate > 5 errors/minute
- Action: Send to Slack channel
- Threshold: 5 minute window

**Performance Issues**:
- Condition: P95 response time > 2s
- Action: Send to monitoring channel
- Threshold: 10 minute window

### 2. Alert Rules Example

```yaml
# Sentry Alert Rule Configuration
alerts:
  - name: Critical Error Spike
    conditions:
      - type: error_rate
        threshold: 10
        window: 1m
    actions:
      - type: slack
        channel: "#alerts-critical"
      - type: pagerduty
        severity: critical
  
  - name: Performance Degradation
    conditions:
      - type: performance
        metric: p95
        threshold: 2000ms
        window: 10m
    actions:
      - type: slack
        channel: "#alerts-performance"
```

### 3. Integration Setup

#### Slack Integration

1. Go to Sentry → Settings → Integrations → Slack
2. Connect your Slack workspace
3. Configure channels:
   - `#alerts-critical` - Critical errors
   - `#alerts-warnings` - Warnings and deprecations
   - `#alerts-performance` - Performance issues

#### PagerDuty Integration

1. Go to Sentry → Settings → Integrations → PagerDuty
2. Connect your PagerDuty account
3. Map Sentry severity levels to PagerDuty:
   - `fatal` → Critical
   - `error` → Error
   - `warning` → Warning

#### Email Notifications

1. Go to Sentry → Settings → Notifications
2. Configure email recipients for:
   - Critical errors
   - New issues
   - Resolved issues
   - Regression alerts

## Monitoring Dashboards

### Create Custom Dashboard

1. Go to Sentry → Dashboards → Create Dashboard
2. Add widgets:

**Error Rate Widget**:
- Metric: Error count
- Group by: Environment
- Time range: Last 24 hours

**Performance Widget**:
- Metric: Transaction duration (p95)
- Group by: Transaction name
- Time range: Last 7 days

**User Impact Widget**:
- Metric: Affected users
- Group by: Issue
- Time range: Last 24 hours

### Key Metrics to Track

1. **Error Rate**: Errors per minute
2. **Error Frequency**: Most common errors
3. **Performance**: P95/P99 response times
4. **User Impact**: Affected users count
5. **Release Health**: Errors by release version

## Production Verification

### Test Error Reporting

```typescript
// In browser console (production only)
import { sentryConfig } from '@/lib/monitoring/sentry-config';

// Test error capture
sentryConfig.captureException(new Error('Test error from production'));

// Test message
sentryConfig.captureMessage('Test message', 'info');
```

### Verify in Sentry Dashboard

1. Go to Sentry → Issues
2. Look for test error
3. Verify:
   - Error is captured
   - Stack trace is complete
   - User context is set (if logged in)
   - Environment is correct
   - Release version is set

## Best Practices

1. **Don't log sensitive data**: Sentry automatically scrubs passwords, tokens, etc.
2. **Set user context**: Always set user when available
3. **Use appropriate log levels**: Use `error` for exceptions, `warning` for deprecations
4. **Add breadcrumbs**: Use `addBreadcrumb()` for context
5. **Filter noise**: Configure `beforeSend` to filter non-critical errors

## Troubleshooting

### Sentry not initializing

- Check `VITE_SENTRY_DSN` is set in production
- Verify DSN is correct format
- Check browser console for initialization errors

### Errors not appearing

- Verify environment is set to 'production'
- Check `beforeSend` filter isn't blocking errors
- Verify network requests to Sentry aren't blocked

### Performance data missing

- Check `tracesSampleRate` is > 0
- Verify `browserTracingIntegration` is included
- Ensure transactions are being created

