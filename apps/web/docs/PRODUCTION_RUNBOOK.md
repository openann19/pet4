# Production Runbook

## Overview

This runbook provides procedures for operating the PawfectMatch web application in production.

## Table of Contents

1. [Incident Response](#incident-response)
2. [Common Issues](#common-issues)
3. [Deployment Procedures](#deployment-procedures)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring and Alerts](#monitoring-and-alerts)
6. [Troubleshooting](#troubleshooting)

## Incident Response

### Severity Levels

**P0 - Critical**:
- Service completely down
- Data breach or security incident
- Payment processing failure
- > 50% of users affected

**P1 - High**:
- Partial service degradation
- Performance issues affecting > 20% of users
- Critical feature broken
- Payment issues for subset of users

**P2 - Medium**:
- Minor feature issues
- Performance degradation affecting < 20% of users
- Non-critical bugs

**P3 - Low**:
- Cosmetic issues
- Minor bugs with workarounds
- Documentation issues

### Incident Response Process

1. **Detection**: Alert received or issue reported
2. **Acknowledgment**: On-call engineer acknowledges within 5 minutes
3. **Assessment**: Determine severity and impact (10 minutes)
4. **Communication**: Update status page and notify team
5. **Resolution**: Fix issue or implement workaround
6. **Post-Mortem**: Document incident within 48 hours

### On-Call Rotation

- **Primary**: Responds to all P0/P1 incidents
- **Secondary**: Backup for primary, handles P2 incidents
- **Schedule**: Weekly rotation, handoff on Monday 9 AM

### Communication Channels

- **Slack**: `#incidents` channel for all incidents
- **Status Page**: Update at status.pawfectmatch.com
- **Email**: Send to stakeholders for P0 incidents

## Common Issues

### Application Not Loading

**Symptoms**: White screen, 404 errors, or blank page

**Diagnosis**:
```bash
# Check health endpoints
curl https://pawfectmatch.com/healthz.json
curl https://pawfectmatch.com/readyz.json

# Check CDN/load balancer
curl -I https://pawfectmatch.com

# Check Sentry for errors
# Go to Sentry → Issues → Filter by environment:production
```

**Resolution**:
1. Check if build succeeded in CI/CD
2. Verify deployment completed
3. Check CDN cache (may need to purge)
4. Verify environment variables are set
5. Check server logs for errors

### High Error Rate

**Symptoms**: Error rate > 5 errors/minute in Sentry

**Diagnosis**:
1. Go to Sentry → Issues
2. Identify top errors
3. Check error patterns (specific users, endpoints, browsers)
4. Review recent deployments

**Resolution**:
1. If recent deployment: Consider rollback
2. If specific endpoint: Check API status
3. If specific browser: Check compatibility
4. If widespread: Check infrastructure

### Performance Degradation

**Symptoms**: P95 response time > 2 seconds, slow page loads

**Diagnosis**:
```bash
# Check Core Web Vitals
# Use Google PageSpeed Insights
# Check Sentry Performance tab
```

**Resolution**:
1. Check CDN cache hit rate
2. Verify database query performance
3. Check API response times
4. Review recent code changes
5. Check for memory leaks

### Authentication Issues

**Symptoms**: Users can't log in, tokens not working

**Diagnosis**:
1. Check auth service status
2. Verify JWT secret is correct
3. Check token expiration settings
4. Review auth logs

**Resolution**:
1. Verify auth service is running
2. Check environment variables
3. Clear token cache if needed
4. Verify CORS settings

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests passing in CI/CD
- [ ] Code review approved
- [ ] Performance budgets met
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Rollback plan prepared

### Deployment Steps

1. **Create Release Branch**:
   ```bash
   git checkout main
   git pull
   git checkout -b release/v1.x.x
   ```

2. **Tag Release**:
   ```bash
   git tag -a v1.x.x -m "Release v1.x.x"
   git push origin v1.x.x
   ```

3. **Monitor Deployment**:
   - Watch CI/CD pipeline
   - Monitor Sentry for errors
   - Check health endpoints
   - Verify feature flags

4. **Post-Deployment Verification**:
   - [ ] Health checks passing
   - [ ] No error spikes in Sentry
   - [ ] Performance metrics normal
   - [ ] Critical user flows working
   - [ ] Smoke tests passing

### Staging Deployment

1. Deploy to staging environment
2. Run full E2E test suite
3. Manual QA verification
4. Performance testing
5. Security scan
6. Approval for production

## Rollback Procedures

### Automatic Rollback

If health checks fail after deployment:
1. CI/CD automatically rolls back
2. Previous version is restored
3. Team is notified

### Manual Rollback

**Quick Rollback** (Last 5 deployments):
```bash
# Get previous deployment ID
# Use your deployment platform's rollback feature
# Example for Vercel:
vercel rollback [deployment-url]

# Example for AWS:
aws elasticbeanstalk swap-environment-cnames \
  --source-environment-name prod-v1.0.1 \
  --destination-environment-name prod-v1.0.0
```

**Full Rollback** (Any previous version):
1. Identify last known good version
2. Create release from that version
3. Deploy previous version
4. Verify rollback successful
5. Document reason for rollback

### Rollback Verification

After rollback:
- [ ] Health checks passing
- [ ] Error rate back to normal
- [ ] Performance metrics restored
- [ ] User flows working
- [ ] No data loss

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Error Rate**: Should be < 0.1% of requests
2. **Response Time**: P95 < 500ms, P99 < 1s
3. **Uptime**: Target 99.9%
4. **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Alert Thresholds

- **Critical**: Error rate > 10/min OR uptime < 99%
- **Warning**: Error rate > 5/min OR P95 > 2s
- **Info**: Deployment events, feature flag changes

### Dashboard Access

- **Sentry**: https://sentry.io/organizations/pawfectmatch
- **Status Page**: https://status.pawfectmatch.com
- **Analytics**: [Your analytics dashboard]

## Troubleshooting

### Check Application Status

```bash
# Health check
curl https://pawfectmatch.com/healthz.json

# Readiness check
curl https://pawfectmatch.com/readyz.json

# Full status
curl -I https://pawfectmatch.com
```

### Check Logs

**Sentry**:
- Go to Sentry → Issues
- Filter by environment, time range
- Check error details and stack traces

**Server Logs** (if applicable):
```bash
# Docker logs
docker logs [container-id]

# Kubernetes logs
kubectl logs [pod-name]

# Application logs
tail -f /var/log/app.log
```

### Common Commands

```bash
# Check environment variables
# (via deployment platform dashboard)

# Clear CDN cache
# (via CDN provider dashboard)

# Restart service
# (via deployment platform)

# Check database connectivity
# (via database admin panel)
```

## Emergency Contacts

- **On-Call Engineer**: [Phone/Slack]
- **Engineering Lead**: [Phone/Slack]
- **DevOps Team**: [Phone/Slack]
- **Security Team**: security@pawfectmatch.com

## Post-Incident

### Post-Mortem Template

1. **Incident Summary**
   - What happened?
   - When did it occur?
   - How long did it last?
   - Who was affected?

2. **Timeline**
   - Detection time
   - Response time
   - Resolution time

3. **Root Cause**
   - What caused the incident?
   - Why did it happen?

4. **Impact**
   - Users affected
   - Revenue impact
   - Reputation impact

5. **Resolution**
   - How was it fixed?
   - Temporary workarounds

6. **Prevention**
   - What can we do to prevent this?
   - Action items with owners

7. **Lessons Learned**
   - What went well?
   - What could be improved?

### Action Items

After post-mortem:
- [ ] Create tickets for action items
- [ ] Assign owners and due dates
- [ ] Track completion
- [ ] Review in next team meeting

