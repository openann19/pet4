# 5-Minute Smoke Checklist

## Pre-Release Smoke Tests

Run these checks before every release to ensure core functionality works.

### Environment Setup (30 seconds)

- [ ] Dev environment starts with `npm run dev`
- [ ] No console errors on startup
- [ ] Health endpoint responds: `GET /healthz` returns `200 OK`

### Authentication (1 minute)

- [ ] User can sign up with email/password
- [ ] User can log in with credentials
- [ ] Refresh token rotation works
- [ ] Logout clears session
- [ ] 401 errors trigger refresh flow

### Core Flow (2 minutes)

- [ ] User can create pet profile
- [ ] User can upload pet photo
- [ ] User can discover other pets
- [ ] User can swipe/like a pet
- [ ] Mutual like creates match
- [ ] Match creates chat room
- [ ] User can send message in chat

### Realtime (1 minute)

- [ ] WebSocket connects with access token
- [ ] Messages appear in real-time (< 1 second)
- [ ] Presence updates work (online/offline)
- [ ] Typing indicators work
- [ ] Match created notification appears

### Admin Console (30 seconds)

- [ ] Admin can log in
- [ ] Admin can view reports queue
- [ ] Admin can moderate content
- [ ] Admin actions are audited

### Media Upload (30 seconds)

- [ ] Photo upload works (signed flow)
- [ ] Uploaded photo appears in pet profile
- [ ] CDN URL is returned
- [ ] Invalid files are rejected

### Error Handling (30 seconds)

- [ ] Network errors show user-friendly messages
- [ ] Correlation IDs are present in errors
- [ ] Error codes are consistent
- [ ] Rate limiting works (if implemented)

## Quick Verification Commands

```bash
# Health check
curl http://localhost:3000/api/healthz

# Version check
curl http://localhost:3000/api/version

# Run walkthrough
npm run e2e:walkthrough
```

## Expected Results

- ✅ All checks pass
- ✅ No console errors
- ✅ All API calls return expected status codes
- ✅ Real-time events work within 1 second
- ✅ Uploads complete successfully
- ✅ Admin actions are logged

## Failure Criteria

- ❌ Any check fails
- ❌ Console errors present
- ❌ API returns 500 errors
- ❌ Real-time events take > 1 second
- ❌ Uploads fail
- ❌ Admin actions not logged

If any failure occurs, **DO NOT RELEASE**. Fix the issue and re-run the checklist.
