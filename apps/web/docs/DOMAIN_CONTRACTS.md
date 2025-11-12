# Domain Contracts

## Overview

This document defines all entity contracts used across Web, Mobile, and Admin Console. These contracts are the single source of truth for data structures.

---

## Core Entities

### User

**Definition**: System user account

**Fields**:

```typescript
{
  id: string                    // ULID
  email: string                 // Unique, validated
  displayName: string           // User-visible name
  avatarUrl?: string            // CDN URL
  roles: UserRole[]             // ['user' | 'moderator' | 'admin']
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
  status: 'active' | 'suspended' | 'banned'
  lastSeenAt: string            // ISO 8601
  preferences: UserPreferences
  passwordHash?: string          // Server-side only
  passwordSalt?: string          // Server-side only
}
```

**Ownership**: User owns their account

**Status Values**:

- `active`: Normal user
- `suspended`: Temporarily suspended
- `banned`: Permanently banned

**Operations**:

- **Create**: `POST /api/users` (signup)
- **Read**: `GET /api/users/:id`
- **Update**: `PATCH /api/users/:id` (own or admin)
- **Delete**: `DELETE /api/users/:id` (admin only)

**Error Semantics**:

- `409`: Email already exists (signup)
- `403`: Insufficient permissions
- `404`: User not found

---

### Pet

**Definition**: Pet profile

**Fields**:

```typescript
{
  id: string                    // ULID
  ownerId: string               // User ID (owner)
  name: string
  species: 'dog' | 'cat'
  breed: string
  age: number                   // Years
  size: 'small' | 'medium' | 'large'
  gender: 'male' | 'female'
  photos: Photo[]
  personality: string[]         // Tags
  bio: string
  location: Location
  verified: boolean
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
  status: 'active' | 'hidden' | 'banned'
}
```

**Ownership**: User owns their pets

**Status Values**:

- `active`: Visible in discovery
- `hidden`: Hidden from discovery
- `banned`: Banned by moderation

**Operations**:

- **Create**: `POST /api/pets` (authenticated)
- **Read**: `GET /api/pets/:id`
- **Update**: `PATCH /api/pets/:id` (owner or admin)
- **Delete**: `DELETE /api/pets/:id` (owner or admin)

**Error Semantics**:

- `403`: Not pet owner
- `404`: Pet not found
- `400`: Invalid pet data

---

### Match

**Definition**: Mutual match between two pets

**Fields**:

```typescript
{
  id: string; // ULID
  petAId: string;
  petBId: string;
  compatibilityScore: number; // 0-100
  compatibilityBreakdown: CompatibilityBreakdown;
  status: 'active' | 'archived';
  chatRoomId: string; // Auto-provisioned
  createdAt: string; // ISO 8601
  lastInteractionAt: string; // ISO 8601
}
```

**Ownership**: Both pet owners

**Status Values**:

- `active`: Ongoing match
- `archived`: Archived by user

**Operations**:

- **Create**: Automatic on mutual like
- **Read**: `GET /api/matches/:id` (participant or admin)
- **Update**: `PATCH /api/matches/:id` (participant only)
- **Delete**: `DELETE /api/matches/:id` (participant only)

**Error Semantics**:

- `403`: Not match participant
- `404`: Match not found
- `409`: Match already exists (duplicate like)

---

### Message

**Definition**: Chat message

**Fields**:

```typescript
{
  id: string                    // ULID
  chatRoomId: string
  senderId: string             // User ID
  content: string
  type: 'text' | 'sticker'
  reactions: Reaction[]
  status: 'sending' | 'sent' | 'delivered' | 'read'
  createdAt: string             // ISO 8601
  deliveredAt?: string          // ISO 8601
  readAt?: string               // ISO 8601
}
```

**Ownership**: Message sender

**Status Values**:

- `sending`: Client-side, not yet sent
- `sent`: Sent to server
- `delivered`: Delivered to recipient
- `read`: Read by recipient

**Operations**:

- **Create**: `POST /api/messages` (match participant)
- **Read**: `GET /api/messages?chatRoomId=:id` (participant or admin)
- **Update**: `PATCH /api/messages/:id` (sender only, reactions)
- **Delete**: `DELETE /api/messages/:id` (sender or admin)

**Error Semantics**:

- `403`: Not chat room participant
- `404`: Message not found
- `400`: Invalid message content

---

### Story

**Definition**: Ephemeral story (24h)

**Fields**:

```typescript
{
  id: string                    // ULID
  petId: string
  mediaUrl: string             // CDN URL
  mediaType: 'image' | 'video'
  duration: number              // Seconds (video only)
  views: StoryView[]
  expiresAt: string             // ISO 8601
  createdAt: string             // ISO 8601
  status: 'active' | 'expired' | 'removed'
}
```

**Ownership**: Pet owner

**Status Values**:

- `active`: Currently visible
- `expired`: Expired (>24h)
- `removed`: Removed by user/moderation

**Operations**:

- **Create**: `POST /api/stories` (pet owner)
- **Read**: `GET /api/stories/:id`
- **Update**: `PATCH /api/stories/:id` (owner only)
- **Delete**: `DELETE /api/stories/:id` (owner or admin)

**Error Semantics**:

- `403`: Not story owner
- `404`: Story not found
- `400`: Invalid media format

---

### Report

**Definition**: Content moderation report

**Fields**:

```typescript
{
  id: string                    // ULID
  reporterId: string           // User ID
  reportedEntityType: 'user' | 'pet' | 'message'
  reportedEntityId: string
  reason: ReportReason
  details: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  assignedTo?: string           // Moderator ID
  resolution?: ReportResolution
  createdAt: string             // ISO 8601
  resolvedAt?: string           // ISO 8601
}
```

**Ownership**: Reporter and moderators

**Status Values**:

- `pending`: Awaiting review
- `investigating`: Under review
- `resolved`: Action taken
- `dismissed`: No action needed

**Operations**:

- **Create**: `POST /api/reports` (authenticated)
- **Read**: `GET /api/reports/:id` (reporter or moderator)
- **Update**: `PATCH /api/reports/:id` (moderator only)
- **Delete**: `DELETE /api/reports/:id` (admin only)

**Error Semantics**:

- `409`: Duplicate report (same entity, same reporter)
- `403`: Not reporter or moderator
- `404`: Report not found

---

### Review

**Definition**: Pet review/rating

**Fields**:

```typescript
{
  id: string; // ULID
  reviewerId: string; // User ID
  reviewedPetId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  status: 'active' | 'hidden';
}
```

**Ownership**: Reviewer

**Status Values**:

- `active`: Visible
- `hidden`: Hidden by moderation

**Operations**:

- **Create**: `POST /api/reviews` (authenticated, match only)
- **Read**: `GET /api/reviews?petId=:id`
- **Update**: `PATCH /api/reviews/:id` (reviewer only)
- **Delete**: `DELETE /api/reviews/:id` (reviewer or admin)

**Error Semantics**:

- `409`: Duplicate review (same reviewer, same pet)
- `403`: Not reviewer
- `404`: Review not found

---

### Verification

**Definition**: Pet verification submission

**Fields**:

```typescript
{
  id: string                    // ULID
  petId: string
  type: 'photo' | 'document'
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string           // ISO 8601
  reviewedAt?: string           // ISO 8601
  reviewedBy?: string           // Moderator ID
  notes?: string
}
```

**Ownership**: Pet owner

**Status Values**:

- `pending`: Awaiting review
- `approved`: Verification granted
- `rejected`: Verification denied

**Operations**:

- **Create**: `POST /api/verifications` (pet owner)
- **Read**: `GET /api/verifications/:id` (owner or moderator)
- **Update**: `PATCH /api/verifications/:id` (moderator only)
- **Delete**: `DELETE /api/verifications/:id` (admin only)

**Error Semantics**:

- `403`: Not pet owner
- `404`: Verification not found
- `400`: Invalid verification data

---

### Notification

**Definition**: In-app notification

**Fields**:

```typescript
{
  id: string                    // ULID
  userId: string               // Recipient
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> // Deep link data
  read: boolean
  createdAt: string             // ISO 8601
  expiresAt?: string            // ISO 8601
}
```

**Ownership**: Recipient user

**Status Values**: N/A (uses `read` boolean)

**Operations**:

- **Create**: `POST /api/notifications` (system only)
- **Read**: `GET /api/notifications` (own notifications)
- **Update**: `PATCH /api/notifications/:id` (mark as read)
- **Delete**: `DELETE /api/notifications/:id` (recipient only)

**Error Semantics**:

- `403`: Not notification recipient
- `404`: Notification not found
- `400`: Invalid notification data

---

## Type Definitions

### UserRole

```typescript
type UserRole = 'user' | 'moderator' | 'admin';
```

### Location

```typescript
interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}
```

### Photo

```typescript
interface Photo {
  id: string;
  url: string; // CDN URL
  thumbnailUrl: string; // CDN URL
  order: number;
  uploadedAt: string; // ISO 8601
}
```

### Reaction

```typescript
interface Reaction {
  userId: string;
  emoji: string;
  addedAt: string; // ISO 8601
}
```

### StoryView

```typescript
interface StoryView {
  userId: string;
  viewedAt: string; // ISO 8601
}
```

### ReportReason

```typescript
type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';
```

### ReportResolution

```typescript
interface ReportResolution {
  action: 'warn' | 'suspend' | 'ban' | 'remove_content' | 'no_action';
  notes: string;
  resolvedBy: string; // Moderator ID
}
```

### NotificationType

```typescript
type NotificationType =
  | 'match_created'
  | 'new_message'
  | 'like_received'
  | 'story_viewed'
  | 'verification_approved'
  | 'verification_rejected'
  | 'content_removed'
  | 'account_warning';
```

### CompatibilityBreakdown

```typescript
interface CompatibilityBreakdown {
  personality: number; // 0-100
  interests: number; // 0-100
  size: number; // 0-100
  age: number; // 0-100
  location: number; // 0-100
  overall: number; // 0-100
}
```

---

## Common Patterns

### Timestamps

- All timestamps use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- `createdAt`: Set on creation
- `updatedAt`: Updated on every modification
- `lastSeenAt`: Updated on user activity

### IDs

- All IDs use ULID format (26 characters)
- Globally unique
- Sortable by creation time

### Status Fields

- Entities with status use string union types
- Status transitions are validated server-side
- Invalid transitions return `400 Bad Request`

### Ownership

- Users own their accounts and pets
- Match participants own matches
- Message senders own messages
- Reports belong to reporter and moderators

### Error Codes

- `400`: Bad Request (invalid data)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (entity doesn't exist)
- `409`: Conflict (duplicate entity)
- `500`: Internal Server Error (server error)

---

## API Contract

All API endpoints follow REST conventions:

- **List**: `GET /api/{resource}?query=params`
- **Read**: `GET /api/{resource}/:id`
- **Create**: `POST /api/{resource}` (body: entity data)
- **Update**: `PATCH /api/{resource}/:id` (body: partial entity)
- **Delete**: `DELETE /api/{resource}/:id`

### Pagination

List endpoints support cursor-based pagination:

```
GET /api/{resource}?cursor={cursor}&limit={limit}
```

Response includes:

```typescript
{
  items: Entity[]
  nextCursor?: string
  totalCount: number
}
```

### Filtering

List endpoints support filtering:

```
GET /api/{resource}?status=active&ownerId={id}
```

### Error Response

All errors follow this format:

```typescript
{
  code: string;
  message: string;
  correlationId: string;
  timestamp: string;
}
```

---

## Notes

- All contracts are type-safe (TypeScript)
- No client-specific fields (shared contracts)
- All timestamps are ISO 8601
- All IDs are ULIDs
- Status transitions are validated
- Ownership is enforced server-side
