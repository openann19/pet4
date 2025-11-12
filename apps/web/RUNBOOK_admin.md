# PawfectMatch Admin Operations Runbook

**Version:** 1.0  
**Last Updated:** 2025-11-03  
**Maintainer:** Engineering Team

---

## Table of Contents

1. [Overview](#overview)
2. [Admin Console Access](#admin-console-access)
3. [Common Operations](#common-operations)
4. [Incident Response](#incident-response)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Emergency Procedures](#emergency-procedures)
7. [On-Call Handoff](#on-call-handoff)

---

## Overview

This runbook provides operational guidance for PawfectMatch administrators and moderators. It covers routine operations, incident response, and emergency procedures.

### Key Responsibilities

- **Moderators**: Review content, handle reports, warn/suspend users
- **Administrators**: All moderator capabilities + system configuration, feature flags, audit log access
- **On-Call Engineers**: Incident response, system health monitoring, escalation handling

---

## Admin Console Access

### Accessing the Console

1. Navigate to the application
2. Click the shield icon (🛡️) in the main header
3. Authenticate with admin/moderator credentials
4. Console dashboard will load with system metrics

### Role-Based Access

| Role      | Dashboard | Reports | Users     | Content | Audit Log | Settings |
| --------- | --------- | ------- | --------- | ------- | --------- | -------- |
| User      | ❌        | ❌      | ❌        | ❌      | ❌        | ❌       |
| Moderator | ✅        | ✅      | ✅ (view) | ✅      | ✅ (own)  | ❌       |
| Admin     | ✅        | ✅      | ✅ (full) | ✅      | ✅ (all)  | ✅       |

### Navigation

- **Dashboard**: System health, metrics, quick actions
- **Reports**: Content moderation queue
- **Users**: User management and moderation
- **Content**: Pet profile and media review
- **Audit Log**: Complete action history
- **Settings**: Feature flags and system configuration

---

## Common Operations

### 1. Reviewing Reports

**Purpose**: Address user-reported content violations

**Steps**:

1. Navigate to **Reports** tab
2. Filter by status: `pending`, `investigating`, `resolved`, `dismissed`
3. Select a report to view details
4. Review:
   - Reporter information
   - Reported content (user, pet, message, story)
   - Reason and description
   - Evidence (screenshots, links)
5. Take action:
   - **Dismiss**: No violation found
   - **Warn**: Send warning to user
   - **Remove Content**: Delete offending content
   - **Suspend**: Temporary account suspension (specify duration)
   - **Ban**: Permanent account ban
6. Add resolution notes
7. Action is logged to audit trail

**SLA**: Respond to reports within 24 hours

### 2. Content Moderation

**Purpose**: Review and approve pet profiles and media before public visibility

**Steps**:

1. Navigate to **Content** tab
2. View queues:
   - **New Photos**: First-time uploads
   - **Flagged**: Auto-flagged or reported
   - **KYC Pending**: Identity verification pending
3. Review content:
   - Check for inappropriate content
   - Verify photo quality and authenticity
   - Ensure profile information is appropriate
4. Actions:
   - **Approve**: Make content public
   - **Reject**: Remove with reason
   - **Request Re-upload**: Ask user for better quality
   - **Blur/Replace**: Apply content filter
   - **Escalate**: Flag for admin review

**Guidelines**:

- Profile photos must clearly show the pet
- No inappropriate, violent, or misleading content
- Breeds must be accurately represented
- Contact information in photos is prohibited

### 3. User Management

**Purpose**: Manage user accounts and enforce community guidelines

**Viewing Users**:

1. Navigate to **Users** tab
2. Search by email, name, or user ID
3. View user profile and statistics:
   - Account age and activity
   - Number of pets
   - Match statistics
   - Reports filed and received
   - Previous moderation actions

**Actions**:

- **Suspend**: Temporary restriction (specify duration and reason)
- **Ban**: Permanent account closure
- **Reactivate**: Restore suspended account
- **View History**: See all moderation actions

**Suspension Durations**:

- First offense: 7 days
- Second offense: 30 days
- Third offense: Permanent ban

### 4. Feature Flag Management

**Purpose**: Control feature rollouts and emergency toggles

**Steps**:

1. Navigate to **Settings** → **Feature Flags**
2. View all flags with current status
3. Toggle features on/off
4. Configure rollout percentage (0-100%)
5. Specify user IDs for targeted testing
6. Changes take effect immediately

**Common Flags**:

- `stories-enabled`: Instagram-style stories
- `voice-messages`: Voice messaging in chat
- `video-chat`: Real-time video calls
- `ai-suggestions`: AI-powered chat suggestions
- `advanced-filters`: Premium discovery filters

**Emergency Kill Switches**:
If a feature is causing issues:

1. Set flag to `disabled`
2. Clear rollout percentage
3. Monitor error rates
4. Document in incident log

---

## Incident Response

### Incident Severity Levels

| Level         | Description                   | Response Time     | Escalation                 |
| ------------- | ----------------------------- | ----------------- | -------------------------- |
| P0 - Critical | Complete service outage       | Immediate         | All hands on deck          |
| P1 - High     | Major feature down, data loss | 15 minutes        | On-call engineer + manager |
| P2 - Medium   | Non-critical feature degraded | 1 hour            | On-call engineer           |
| P3 - Low      | Minor issues, cosmetic bugs   | Next business day | Standard ticket            |

### Response Workflow

1. **Detect**
   - Alert fires
   - User reports
   - Monitoring dashboard anomaly

2. **Assess**
   - Check error rates
   - Review recent deployments
   - Identify affected users/features

3. **Respond**
   - Engage on-call team
   - Start incident channel
   - Begin mitigation

4. **Resolve**
   - Apply fix or rollback
   - Verify metrics return to normal
   - Communicate status

5. **Postmortem**
   - Document timeline
   - Identify root cause
   - Create action items

### Common Incidents

#### Service Outage

```
Symptoms: 5xx errors, unable to load app
Check: Server status, database connectivity
Action: Restart services, check logs, rollback if recent deploy
Contact: Infrastructure team
```

#### High Error Rate

```
Symptoms: Spike in error dashboard
Check: Recent code changes, external service status
Action: Review logs, disable problematic feature flag
Contact: Engineering lead
```

#### Data Integrity Issue

```
Symptoms: Users report missing or incorrect data
Check: Database queries, recent migrations
Action: Stop writes if needed, investigate data inconsistency
Contact: DBA, Engineering lead
```

#### Security Breach

```
Symptoms: Suspicious activity, unauthorized access
Check: Audit logs, authentication logs
Action: Disable affected accounts, rotate secrets, notify security team
Contact: Security team, Legal team
```

---

## Monitoring & Alerts

### Key Metrics

**System Health**:

- API response time (P50, P95, P99)
- Error rate (target: < 0.1%)
- WebSocket connection stability
- Database query performance

**User Activity**:

- Daily Active Users (DAU)
- Sign-ups per day
- Match rate
- Message delivery latency

**Content**:

- Reports pending (SLA: < 24h)
- Stories posted per day
- Media upload success rate

### Alert Thresholds

| Metric          | Warning  | Critical |
| --------------- | -------- | -------- |
| Error rate      | > 0.5%   | > 1%     |
| API P95 latency | > 500ms  | > 1000ms |
| Memory usage    | > 80%    | > 95%    |
| Pending reports | > 100    | > 500    |
| Failed logins   | > 10/min | > 50/min |

### Dashboard Access

- **Production**: https://metrics.pawfectmatch.com
- **Staging**: https://metrics-staging.pawfectmatch.com
- **Admin Console**: Dashboard tab

---

## Emergency Procedures

### Complete Service Outage

1. **Verify outage**: Check from multiple locations
2. **Status page**: Update status.pawfectmatch.com
3. **Engage team**: Page on-call engineer and backup
4. **Communication**: Post to status page and social media
5. **Triage**: Check infrastructure, database, external services
6. **Restore**: Apply fix or rollback to last known good state
7. **Verify**: Run smoke tests, monitor error rates
8. **Communicate**: Update status page when resolved

### Database Emergency

**Backup Restoration**:

```bash
# Connect to backup system
# Restore from most recent backup
# Verify data integrity
# Document lost data window
```

**Data Corruption**:

```bash
# Stop writes immediately
# Snapshot current state
# Engage DBA
# Plan recovery strategy
```

### Security Incident

1. **Contain**: Disable affected accounts, rotate credentials
2. **Assess**: Determine scope and impact
3. **Notify**: Security team, affected users (if needed)
4. **Investigate**: Review audit logs, access patterns
5. **Remediate**: Fix vulnerability, update security controls
6. **Document**: Complete incident report

---

## On-Call Handoff

### Handoff Checklist

- [ ] Review open incidents
- [ ] Check alert backlog
- [ ] Review pending reports (>24h old)
- [ ] Verify monitoring dashboards are green
- [ ] Check deployment schedule for upcoming releases
- [ ] Share any known issues or concerns
- [ ] Confirm contact information
- [ ] Test pager/alert system

### Handoff Document

```
Date: [YYYY-MM-DD]
Outgoing: [Name]
Incoming: [Name]

Open Incidents:
- [ID] [P-level] [Description] [Status]

Known Issues:
- [Description] [Workaround] [ETA]

Pending Actions:
- [Action] [Owner] [Due Date]

Upcoming:
- [Event] [Date] [Notes]

Notes:
[Any additional context]
```

### Communication Channels

- **Slack**: #pawfectmatch-oncall
- **PagerDuty**: Primary alert system
- **Email**: oncall@pawfectmatch.com
- **Phone**: [On-call phone number]

### Escalation Path

1. On-call engineer (immediate response)
2. Engineering lead (within 30 min)
3. VP Engineering (P0/P1 incidents)
4. CEO (business-critical decisions)

---

## Appendix

### Useful Commands

**Check service status**:

```bash
curl https://api.pawfectmatch.com/health
```

**View recent errors**:

```bash
# Via logging service
# Filter by time range and error level
```

**Feature flag status**:

```bash
# Via Admin Console → Settings → Feature Flags
```

### Contact Information

| Role             | Name | Email                     | Phone |
| ---------------- | ---- | ------------------------- | ----- |
| Engineering Lead | TBD  | eng@pawfectmatch.com      | TBD   |
| DevOps Lead      | TBD  | devops@pawfectmatch.com   | TBD   |
| Security Team    | TBD  | security@pawfectmatch.com | TBD   |
| Product Manager  | TBD  | product@pawfectmatch.com  | TBD   |

### External Services

- **CDN Provider**: [Provider name]
- **Database**: [Provider name]
- **Monitoring**: [Provider name]
- **Logging**: [Provider name]
- **Error Tracking**: Sentry

---

**Last Updated**: 2025-11-08  
**Next Review**: 2025-12-08  
**Document Owner**: Engineering Team

---

## Important References

For related operational documentation, see:

- [Production Readiness Checklist](./docs/PRODUCTION_READINESS.md)
- [Mobile Runbook](../mobile/RUNBOOK.md)
- [Verification Report](../../FINAL_MD_VERIFICATION_REPORT.md)
- [Documentation Audit](../../DOCUMENTATION_AUDIT_REPORT.md)
