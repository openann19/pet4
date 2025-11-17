# Monitoring Dashboards Setup

## Overview

This document describes how to set up monitoring dashboards for error rates, performance metrics, and uptime tracking.

## Sentry Dashboards

### 1. Error Rate Dashboard

**Widgets to Add**:
- Error count over time (last 24 hours)
- Error rate by environment
- Top 10 errors by frequency
- Affected users count
- Error trend (7 days)

**Configuration**:
1. Go to Sentry → Dashboards → Create Dashboard
2. Name: "Error Rate Dashboard"
3. Add widgets:
   - Error Count (Line Chart)
   - Error Rate by Environment (Bar Chart)
   - Top Errors (Table)
   - Affected Users (Number)

### 2. Performance Dashboard

**Widgets to Add**:
- P95 transaction duration
- P99 transaction duration
- Average transaction duration
- Slowest transactions
- Core Web Vitals (LCP, FID, CLS)

**Configuration**:
1. Create dashboard: "Performance Dashboard"
2. Add widgets:
   - Transaction Duration P95 (Line Chart)
   - Transaction Duration P99 (Line Chart)
   - Slowest Transactions (Table)
   - Web Vitals (Multiple Number widgets)

### 3. Uptime Dashboard

**Widgets to Add**:
- Uptime percentage (last 30 days)
- Health check status
- Response time trends
- Error rate by endpoint

**Configuration**:
1. Create dashboard: "Uptime Dashboard"
2. Add widgets:
   - Uptime % (Number)
   - Health Check Status (Status)
   - Response Time (Line Chart)
   - Endpoint Error Rate (Bar Chart)

## Custom Metrics Tracking

### Web Vitals Monitoring

The app already tracks Core Web Vitals. To view in Sentry:

1. Go to Sentry → Performance
2. Filter by transaction type: "navigation"
3. View metrics:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

### Custom Performance Metrics

Add custom metrics in your code:

```typescript
import { sentryConfig } from '@/lib/monitoring/sentry-config';

// Track custom metric
sentryConfig.captureMessage('api_call_duration', 'info', {
  duration: 150,
  endpoint: '/api/matches',
  method: 'GET',
});
```

## External Monitoring Services

### Uptime Monitoring

Recommended services:
- **UptimeRobot**: Free tier available
- **Pingdom**: Comprehensive monitoring
- **StatusCake**: Simple and effective

**Setup**:
1. Create account
2. Add monitor for: `https://pawfectmatch.com/healthz`
3. Check interval: 5 minutes
4. Alert on: HTTP status != 200

### Performance Monitoring

Recommended services:
- **Google PageSpeed Insights**: Free, automated
- **WebPageTest**: Detailed analysis
- **Lighthouse CI**: Automated performance testing

**Setup Lighthouse CI**:
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  push:
    branches: [main]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://pawfectmatch.com
            https://pawfectmatch.com/discover
          uploadArtifacts: true
          temporaryPublicStorage: true
```

## Alert Configuration

### Error Rate Alerts

**Critical (P0)**:
- Condition: > 10 errors/minute
- Duration: 5 minutes
- Action: PagerDuty + Slack

**High (P1)**:
- Condition: > 5 errors/minute
- Duration: 10 minutes
- Action: Slack notification

### Performance Alerts

**Slow Response**:
- Condition: P95 > 2 seconds
- Duration: 15 minutes
- Action: Slack notification

**Core Web Vitals**:
- Condition: LCP > 2.5s OR CLS > 0.1
- Duration: 30 minutes
- Action: Email notification

### Uptime Alerts

**Service Down**:
- Condition: Health check fails
- Duration: 2 consecutive failures
- Action: PagerDuty + SMS

## Dashboard Access

### Team Access

1. **Engineering Team**: Full access to all dashboards
2. **Product Team**: Read-only access to performance dashboards
3. **Support Team**: Read-only access to error dashboards

### Sharing Dashboards

1. Go to Dashboard → Share
2. Generate shareable link (read-only)
3. Set expiration if needed
4. Share with stakeholders

## Best Practices

1. **Review dashboards daily**: Check error rates and performance trends
2. **Set up alerts**: Don't rely on manual checking
3. **Document thresholds**: Know what's normal vs. abnormal
4. **Regular reviews**: Weekly team review of metrics
5. **Action on trends**: Address gradual degradation before it becomes critical

## Metrics to Track

### Critical Metrics (Monitor Daily)
- Error rate
- P95 response time
- Uptime percentage
- Active users affected by errors

### Weekly Metrics (Review Weekly)
- Error trends
- Performance trends
- User satisfaction scores
- Feature adoption rates

### Monthly Metrics (Review Monthly)
- Overall system health
- Performance improvements
- Error reduction goals
- Capacity planning

