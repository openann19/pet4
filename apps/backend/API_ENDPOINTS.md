# PetSpark Backend API Endpoints Reference

**Version**: v1  
**Base URL**: `http://localhost:3000/api/v1`  
**Total Endpoints**: 120+

---

## 🔐 Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user | Yes |

---

## 👤 User Management (`/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |
| POST | `/users/avatar` | Upload avatar | Yes |
| GET | `/users/preferences` | Get preferences | Yes |
| PUT | `/users/preferences` | Update preferences | Yes |
| GET | `/users/notifications` | Get notifications | Yes |
| GET | `/users/settings` | Get settings | Yes |
| PUT | `/users/location` | Update location | Yes |
| GET | `/users/location/nearby` | Find nearby users | Yes |
| GET | `/users/:userId/quota` | Get user quota | Yes |
| POST | `/users/:userId/quota/increment` | Increment quota | Yes |

---

## 🐾 Pet Management (`/pets`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/pets` | List pets (with filters) | Yes |
| POST | `/pets` | Create pet | Yes |
| GET | `/pets/:id` | Get pet details | Yes |
| PUT | `/pets/:id` | Update pet | Yes |
| DELETE | `/pets/:id` | Delete pet | Yes |

---

## 📤 File Uploads (`/uploads`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/uploads/sign-url` | Get presigned S3 URL | Yes |
| POST | `/uploads/complete` | Complete upload | Yes |
| DELETE | `/uploads/:key` | Delete file | Yes |

---

## 💕 Matching (`/matching`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/matching/preferences` | Get matching preferences | Yes |
| PUT | `/matching/preferences` | Update preferences | Yes |
| POST | `/matching/discover` | Discover potential matches | Yes |
| POST | `/matching/swipe` | Swipe action (like/pass/superlike) | Yes |
| GET | `/matching/matches` | Get all matches | Yes |
| POST | `/matching/score` | Calculate compatibility score | Yes |

---

## 💬 Chat & Messaging (`/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/chat/conversations` | Get all conversations | Yes |
| GET | `/chat/conversations/:id` | Get conversation details | Yes |
| GET | `/chat/conversations/:id/messages` | Get messages (paginated) | Yes |
| POST | `/chat/conversations/:id/messages` | Send message | Yes |
| PUT | `/chat/conversations/:id/read` | Mark as read | Yes |

---

## 🔔 Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get notifications | Yes |
| PUT | `/notifications/:id/read` | Mark notification as read | Yes |
| PUT | `/notifications/read-all` | Mark all as read | Yes |
| GET | `/notifications/settings` | Get notification settings | Yes |
| PUT | `/notifications/settings` | Update settings | Yes |

---

## 👥 Community (`/community`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/community/posts` | Get community posts | Yes |
| POST | `/community/posts` | Create post | Yes |
| GET | `/community/posts/:id` | Get specific post | Yes |
| POST | `/community/posts/:id/like` | Like a post | Yes |
| POST | `/community/posts/:postId/comments` | Add comment | Yes |

---

## 🏠 Adoption Marketplace (`/adoption`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/adoption/listings` | Get adoption listings | Yes |
| POST | `/adoption/listings` | Create listing | Yes |
| GET | `/adoption/listings/:id` | Get specific listing | Yes |
| PUT | `/adoption/listings/:id` | Update listing | Yes |
| DELETE | `/adoption/listings/:id` | Delete listing | Yes |
| POST | `/adoption/applications` | Create application | Yes |
| GET | `/adoption/applications` | Get applications | Yes |

---

## 💳 Payments (`/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/payments/products` | Get available products | Yes |
| POST | `/payments/create-intent` | Create payment intent | Yes |
| POST | `/payments/confirm` | Confirm payment | Yes |
| GET | `/payments/subscriptions` | Get subscriptions | Yes |
| POST | `/payments/subscription` | Create subscription | Yes |
| DELETE | `/payments/subscriptions/:id` | Cancel subscription | Yes |
| GET | `/payments/entitlements` | Get entitlements | Yes |
| PUT | `/payments/entitlements` | Update entitlements | Yes |

---

## ✅ KYC Verification (`/kyc`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/kyc/status` | Get KYC status | Yes |
| POST | `/kyc/start` | Start KYC process | Yes |
| POST | `/kyc/documents` | Submit documents | Yes |
| GET | `/kyc/verifications/:id` | Get verification details | Yes |

---

## 🚫 Blocking (`/blocking`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/blocking/block` | Block a pet | Yes |
| POST | `/blocking/block-user` | Block a user | Yes |
| DELETE | `/blocking/unblock/:blockerPetId/:blockedPetId` | Unblock pet | Yes |
| GET | `/blocking/status/:blockerPetId/:blockedPetId` | Check block status | Yes |
| GET | `/blocking/pets/:petId/blocked` | Get blocked pets list | Yes |

---

## 🚨 Lost & Found Alerts (`/alerts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/alerts/lost` | Create lost pet alert | Yes |
| GET | `/alerts/lost` | Get lost alerts | Yes |
| GET | `/alerts/lost/:id` | Get specific alert | Yes |
| PUT | `/alerts/lost/:id/status` | Update alert status | Yes |
| PUT | `/alerts/lost/:id/increment-view` | Increment view count | Yes |
| POST | `/alerts/sightings` | Report sighting | Yes |
| GET | `/alerts/sightings` | Get sightings | Yes |

---

## 🎥 Live Streaming (`/live`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/live/createRoom` | Create streaming room | Yes |
| POST | `/live/endRoom` | End stream | Yes |
| GET | `/live/active` | Get active streams | Yes |
| GET | `/live/:id` | Get stream details | Yes |
| POST | `/live/:id/join` | Join stream | Yes |
| POST | `/live/:id/leave` | Leave stream | Yes |
| POST | `/live/:id/react` | Send reaction | Yes |
| POST | `/live/:id/chat` | Send chat message | Yes |
| GET | `/live/:id/chat` | Get chat messages | Yes |

---

## 👨‍💼 Admin Dashboard (`/admin`)

| Method | Endpoint | Description | Auth Required | Admin Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/admin/dashboard` | Dashboard statistics | Yes | Yes |
| GET | `/admin/users` | List users | Yes | Yes |
| GET | `/admin/users/:id` | Get user details | Yes | Yes |
| POST | `/admin/users/:userId/reset-password` | Reset password | Yes | Yes |
| GET | `/admin/moderation` | Moderation queue | Yes | Yes |
| GET | `/admin/analytics` | Analytics data | Yes | Yes |
| GET | `/admin/settings` | Admin settings | Yes | Yes |
| POST | `/admin/config/broadcast` | Broadcast message | Yes | Yes |
| GET | `/admin/support/tickets` | Support tickets | Yes | Yes |
| GET | `/admin/support/tickets/:id` | Get ticket details | Yes | Yes |
| GET | `/admin/support/tickets/:id/messages` | Get ticket messages | Yes | Yes |
| PUT | `/admin/support/tickets/:id/status` | Update ticket status | Yes | Yes |
| PUT | `/admin/support/tickets/:id/assign` | Assign ticket | Yes | Yes |
| GET | `/admin/support/stats` | Support statistics | Yes | Yes |
| GET | `/admin/audit-logs` | Audit logs | Yes | Yes |
| POST | `/admin/audit-logs` | Create audit log | Yes | Yes |

---

## 🛡️ Moderation Tasks (`/admin/moderation`)

| Method | Endpoint | Description | Auth Required | Admin Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/admin/moderation/policy` | Get moderation policy | Yes | Yes |
| GET | `/admin/moderation/tasks` | Get moderation tasks | Yes | Yes |
| GET | `/admin/moderation/tasks/:id` | Get specific task | Yes | Yes |
| POST | `/admin/moderation/tasks/:id/take` | Assign task | Yes | Yes |

---

## 📷 Photos (`/photos`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/photos` | Get photos (with filters) | Yes |
| GET | `/photos/:id` | Get specific photo | Yes |
| POST | `/photos` | Create photo record | Yes |
| POST | `/photos/check-duplicate` | Check for duplicates | Yes |
| POST | `/photos/release-held` | Release held photos | Yes |

---

## 📊 Events (`/events`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/events` | Create system event | Yes |

---

## 🔄 Sync & Offline (`/sync`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/sync/queue` | Get sync queue | Yes |
| GET | `/sync/last-sync-time` | Get last sync time | Yes |
| POST | `/sync/actions` | Submit sync actions | Yes |

---

## 🏥 Health Checks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/healthz` | Liveness probe | No |
| GET | `/readyz` | Readiness probe | No |
| GET | `/api/version` | Version information | No |

---

## 📝 Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "data": { ... },
  "message": "Optional success message",
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## 🔒 Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Refresh tokens are stored in httpOnly cookies for web clients and returned in response body for mobile clients.

---

## 📚 Error Codes

Common error codes:
- `AUTH_001` - Invalid credentials
- `AUTH_002` - User already exists
- `AUTH_003` - Invalid refresh token
- `AUTH_004` - Invalid token
- `AUTH_005` - Refresh token expired
- `AUTH_006` - Authentication required
- `PET_001` - Pet not found
- `PET_002` - Permission denied
- `USER_001` - User not found
- `UPLOAD_001` - Invalid upload metadata
- `MATCH_001` - Invalid request
- `MATCH_002` - Permission denied
- `CHAT_001` - Conversation not found
- `CHAT_002` - Permission denied
- `ADMIN_001` - Admin access required
- `MOD_001` - Task not found
- `MOD_002` - Task not available
- `PHOTO_001` - Photo not found
- `PHOTO_002` - Permission denied
- `QUOTA_001` - Permission denied
- `KYC_001` - Verification in progress
- `KYC_002` - Verification not found
- `KYC_003` - Permission denied
- `BLOCK_001` - Permission denied
- `BLOCK_002` - Already blocked
- `ALERT_001` - Permission denied
- `ALERT_002` - Alert not found
- `ALERT_003` - Permission denied
- `LIVE_001` - Invalid request
- `LIVE_002` - Stream not found
- `LIVE_003` - Permission denied
- `LIVE_004` - Stream not active
- `PAY_001` - Subscription not found
- `PAY_002` - Permission denied
- `PAY_003` - Admin only
- `ADOPT_001` - Permission denied
- `ADOPT_002` - Listing not found
- `ADOPT_003` - Permission denied
- `ADOPT_004` - Already applied
- `ADOPT_005` - Permission denied
- `SUPPORT_001` - Ticket not found

---

## 🚀 Quick Start

```bash
# Start server
cd apps/backend
pnpm install
pnpm dev

# Server runs on http://localhost:3000
# API available at http://localhost:3000/api/v1
```

---

## 📖 Documentation

- [Setup Guide](./SETUP.md) - Installation and configuration
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Feature completion status
- [Backend Analysis](../../BACKEND_ANALYSIS.md) - Complete requirements

