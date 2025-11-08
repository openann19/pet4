# PawfectMatch System Architecture Map

## System Overview

PawfectMatch is a comprehensive pet companion matching platform with real-time communication, AI-powered matching, social features, and moderation capabilities.

---

## 1. System Components

### Client Applications

- **Web Application** (React + TypeScript)
  - Progressive Web App (PWA) capabilities
  - Real-time WebSocket connections
  - Responsive design (mobile-first)
  - Location: `/src`

- **Mobile Application** (React Native - Future)
  - Native mobile experience
  - Push notifications
  - Secure credential storage
  - Location: TBD

- **Admin Console** (React + TypeScript)
  - Moderation dashboard
  - User management
  - Analytics and reporting
  - Feature flag management
  - Location: `/src/components/AdminConsole.tsx`

### Backend Services (Simulated via spark.kv and spark.llm)

- **Authentication Service**
  - JWT-based auth (simulated)
  - Role-based access control (user, moderator, admin)
  - Session management

- **Matching Engine**
  - AI-powered compatibility scoring
  - Swipe mechanics
  - Mutual match detection

- **Real-Time Gateway**
  - WebSocket connections (simulated)
  - Event namespaces: /chat, /presence, /notifications
  - Offline queue management

- **Media Service**
  - Image analysis (via spark.llm)
  - Photo attribute extraction
  - CDN delivery (simulated)

- **Notification Service**
  - In-app notifications
  - Push notifications (future)
  - Quiet hours and preferences

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Client  │  │ Mobile Client│  │Admin Console │      │
│  │  (React)     │  │(React Native)│  │   (React)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
┌─────────────────────────────┴─────────────────────────────────┐
│                      API Gateway Layer                         │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  RESTful API + WebSocket Gateway                       │   │
│  │  - Authentication & Authorization                      │   │
│  │  - Rate Limiting                                       │   │
│  │  - Request Validation                                  │   │
│  │  - Correlation ID Tracking                             │   │
│  └────────────────────────────────────────────────────────┘   │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────────────┐
│                     Business Logic Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Matching  │  │   Chat   │  │  Stories │  │Moderation│      │
│  │ Engine   │  │  Service │  │  Service │  │  Service │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Media   │  │Analytics │  │  Notif   │  │   AI     │      │
│  │ Service  │  │  Engine  │  │  Service │  │  Engine  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────────────┐
│                      Data Layer                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  spark.kv (Key-Value Store)                            │   │
│  │  - User data                                           │   │
│  │  - Pet profiles                                        │   │
│  │  - Matches & Swipes                                    │   │
│  │  - Messages & Chats                                    │   │
│  │  - Stories & Reels                                     │   │
│  │  - Notifications                                       │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                   External Services Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │spark.llm │  │  spark   │  │  Media   │  │Analytics │      │
│  │(AI/GPT)  │  │  .user() │  │   CDN    │  │  Service │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Patterns

### 3.1 User Authentication Flow

```
User → Auth Screen → spark.kv.set('is-authenticated', true)
                  → spark.kv.set('user-profile', userData)
                  → spark.kv.set('auth-token', token)
                  → Navigate to Main App
```

### 3.2 Swipe → Match → Chat Flow

```
1. User swipes right on Pet B
   → spark.kv.get('swipe-actions-{userId}')
   → spark.kv.set('swipe-actions-{userId}', [...existing, newSwipe])

2. Check for mutual match
   → spark.kv.get('swipe-actions-{petBOwnerId}')
   → If mutual like detected:
     → spark.kv.set('matches-{userId}', [...existing, newMatch])
     → spark.kv.set('matches-{petBOwnerId}', [...existing, newMatch])
     → Trigger notification to both users
     → Auto-provision chat room

3. Navigate to Match Screen
   → Display celebration animation
   → Option to start chat immediately
```

### 3.3 Real-Time Chat Flow

```
1. User sends message in Chat View
   → Generate message ID and correlation ID
   → Optimistic UI update (show message immediately)
   → spark.kv.set('chat-messages-{roomId}', [...messages, newMessage])
   → Emit socket event: message_send

2. Recipient receives message
   → Socket event: message_delivered
   → spark.kv.get('chat-messages-{roomId}')
   → Update UI with new message
   → Show notification if not in chat

3. Recipient reads message
   → Socket event: message_read
   → Update message status to 'read'
   → Update sender's UI with read receipt
```

### 3.4 Story Publishing Flow

```
1. User creates story
   → Upload media (photo/video)
   → Add text, stickers, filters
   → spark.kv.set('stories-{userId}', [...stories, newStory])

2. Story distribution
   → Determine visibility (public/matches/close-friends)
   → Add to followers' feeds
   → Send notifications to close friends

3. Story viewing
   → Track viewers: spark.kv.set('story-views-{storyId}', [...viewers, newViewer])
   → Update view count
   → Notify author of views (from matches)

4. Story expiration (24 hours)
   → Background job marks stories as expired
   → Option to save to highlights
```

### 3.5 Admin Moderation Flow

```
1. Report submitted
   → spark.kv.set('reports', [...reports, newReport])
   → Add to moderation queue
   → Notify moderators

2. Moderator reviews
   → Admin Console → Reports Queue
   → Review content and context
   → Decision: approve, warn, suspend, ban

3. Action execution
   → spark.kv.set('moderation-actions', [...actions, newAction])
   → spark.kv.set('audit-log', [...logs, auditEntry])
   → Update content/user status
   → Notify affected user
   → Reflect changes in real-time across all clients
```

---

## 4. Key Data Structures

### 4.1 User Profile

```typescript
{
  id: string (ULID)
  email: string
  role: 'user' | 'moderator' | 'admin'
  profile: {
    name: string
    bio: string
    location: string
    avatar: string (URL)
  }
  preferences: {
    theme: 'light' | 'dark'
    language: 'en' | 'bg'
    notifications: boolean
    quietHours: { start: string, end: string }
  }
  metadata: {
    createdAt: timestamp
    lastActive: timestamp
    emailVerified: boolean
  }
}
```

### 4.2 Pet Profile

```typescript
{
  id: string (ULID)
  ownerId: string
  name: string
  breed: string
  age: number
  gender: 'male' | 'female'
  size: 'small' | 'medium' | 'large' | 'extra-large'
  photos: string[] (URLs)
  bio: string
  personality: string[]
  interests: string[]
  lookingFor: string[]
  location: string
  verified: boolean
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 4.3 Match

```typescript
{
  id: string (ULID)
  petA: string (Pet ID)
  petB: string (Pet ID)
  userA: string (User ID)
  userB: string (User ID)
  compatibilityScore: number (0-100)
  compatibilityReasons: string[]
  status: 'pending' | 'active' | 'archived'
  chatRoomId: string
  createdAt: timestamp
  lastInteractionAt: timestamp
}
```

### 4.4 Message

```typescript
{
  id: string (ULID)
  roomId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'voice' | 'location' | 'pet-card'
  attachments?: {
    type: string
    url: string
    metadata: object
  }[]
  reactions: {
    userId: string
    emoji: string
    timestamp: number
  }[]
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  correlationId: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 4.5 Story

```typescript
{
  id: string (ULID)
  userId: string
  petId?: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  thumbnail?: string
  caption?: string
  location?: string
  music?: {
    title: string
    artist: string
    url: string
  }
  stickers: {
    type: string
    position: { x: number, y: number }
    data: object
  }[]
  visibility: 'public' | 'matches' | 'close-friends'
  views: {
    userId: string
    timestamp: number
  }[]
  expiresAt: timestamp
  createdAt: timestamp
}
```

### 4.6 Notification

```typescript
{
  id: string (ULID)
  userId: string
  type: 'match' | 'message' | 'like' | 'story_view' | 'verification' | 'moderation'
  title: string
  message: string
  data: {
    targetId: string
    targetType: string
    actionUrl: string
  }
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: timestamp
  expiresAt?: timestamp
}
```

### 4.7 Report

```typescript
{
  id: string (ULID)
  reporterId: string
  targetType: 'user' | 'pet' | 'message' | 'story'
  targetId: string
  reason: string
  category: 'spam' | 'inappropriate' | 'harassment' | 'fake' | 'other'
  description: string
  evidence: string[] (URLs)
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  assignedTo?: string (Moderator ID)
  resolution?: {
    action: string
    notes: string
    resolvedBy: string
    resolvedAt: timestamp
  }
  createdAt: timestamp
}
```

### 4.8 Audit Log

```typescript
{
  id: string (ULID)
  actorId: string (Admin/Moderator ID)
  actorRole: 'admin' | 'moderator'
  action: string
  targetType: string
  targetId: string
  changes: {
    field: string
    oldValue: any
    newValue: any
  }[]
  reason: string
  correlationId: string
  timestamp: timestamp
  ipAddress?: string
  userAgent?: string
}
```

---

## 5. Real-Time Event System

### Socket Namespaces

#### `/chat`

- `join_room` - User joins a chat room
- `leave_room` - User leaves a chat room
- `message_send` - New message sent
- `message_delivered` - Message delivered to recipient
- `message_read` - Message read by recipient
- `typing_start` - User starts typing
- `typing_stop` - User stops typing
- `reaction_add` - Reaction added to message
- `reaction_remove` - Reaction removed from message

#### `/presence`

- `user_online` - User comes online
- `user_offline` - User goes offline
- `user_away` - User is idle
- `status_update` - User status changes

#### `/notifications`

- `match_created` - New match notification
- `like_received` - Someone liked your pet
- `message_received` - New message notification
- `story_viewed` - Someone viewed your story
- `verification_complete` - Pet verification result
- `moderation_action` - Moderation decision notification

### Event Acknowledgment Pattern

```typescript
// Client sends event with timeout
socket.emit('message_send', messageData, (ack) => {
  if (ack.success) {
    // Update UI with server-confirmed message
  } else {
    // Handle error, show retry option
  }
});

// Server acknowledges within 5 seconds or client retries
```

### Offline Queue

```typescript
// Messages sent while offline are queued
const offlineQueue = spark.kv.get('offline-queue-{userId}');

// On reconnect, flush queue
socket.on('connect', async () => {
  const queue = await spark.kv.get('offline-queue-{userId}');
  for (const event of queue) {
    socket.emit(event.type, event.data);
  }
  await spark.kv.set('offline-queue-{userId}', []);
});
```

---

## 6. State Management Strategy

### Client-Side State

#### Persistent State (spark.kv via useKV)

- User authentication status
- User profile and preferences
- Pet profiles owned by user
- Match history
- Chat messages (cached)
- Story drafts
- Notification preferences
- Feature flag overrides

#### Ephemeral State (React useState)

- Current view/route
- Form inputs (temporary)
- UI toggles (drawer open/closed)
- Loading states
- Modal visibility
- Temporary filters
- Scroll positions

#### Derived State (useMemo, computed)

- Filtered/sorted lists
- Compatibility scores
- Unread message counts
- Active chat room
- Story expiration timers

### State Synchronization

```typescript
// Local-first with sync
const [messages, setMessages, deleteMessages] = useKV('chat-messages-{roomId}', []);

// Update local state immediately (optimistic)
setMessages((current) => [...current, newMessage]);

// Sync to server in background
await api.sendMessage(newMessage);

// Server confirms or corrects
socket.on('message_confirmed', (confirmedMessage) => {
  setMessages((current) =>
    current.map((m) => (m.id === confirmedMessage.id ? confirmedMessage : m))
  );
});
```

---

## 7. Security Model

### Authentication Layers

1. **Public Access** (no auth required)
   - Landing page
   - Sign up / Sign in forms
   - Password reset

2. **User Access** (authenticated user)
   - Discover pets
   - View matches
   - Send messages
   - Create stories
   - Update own profile
   - Report content

3. **Moderator Access** (moderator role)
   - View reports
   - Moderate content
   - Warn/suspend users
   - View audit logs (own actions)

4. **Admin Access** (admin role)
   - Full moderation powers
   - Ban users permanently
   - Manage feature flags
   - View all audit logs
   - Access analytics
   - Impersonate users (view-only)

### Security Controls

```typescript
// Rate limiting (simulated)
const rateLimitCheck = async (userId: string, action: string) => {
  const key = `rate-limit-${userId}-${action}`;
  const attempts = (await spark.kv.get(key)) || [];
  const recentAttempts = attempts.filter(
    (t) => Date.now() - t < 60000 // Last minute
  );

  if (recentAttempts.length >= 10) {
    throw new Error('Rate limit exceeded');
  }

  await spark.kv.set(key, [...recentAttempts, Date.now()]);
};

// Input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, 1000); // Max length
};

// Content moderation (AI-powered)
const moderateContent = async (content: string): Promise<boolean> => {
  const prompt = spark.llmPrompt`
    Analyze this content for inappropriate material: ${content}
    Return "safe" or "unsafe" with reason.
  `;
  const result = await spark.llm(prompt);
  return result.includes('safe');
};
```

---

## 8. Feature Flags System

```typescript
interface FeatureFlag {
  key: string;
  enabled: boolean;
  environments: ('dev' | 'staging' | 'prod')[];
  userPercentage?: number; // Gradual rollout
  userIds?: string[]; // Specific users
  metadata: {
    description: string;
    owner: string;
    createdAt: timestamp;
  };
}

// Usage
const isFeatureEnabled = async (flagKey: string, userId: string): Promise<boolean> => {
  const flags = await spark.kv.get<FeatureFlag[]>('feature-flags');
  const flag = flags?.find((f) => f.key === flagKey);

  if (!flag || !flag.enabled) return false;

  // Check user-specific override
  if (flag.userIds?.includes(userId)) return true;

  // Check percentage rollout
  if (flag.userPercentage) {
    const hash = hashUserId(userId);
    return hash % 100 < flag.userPercentage;
  }

  return true;
};

// Example flags
const FLAGS = {
  STORIES_ENABLED: 'stories-enabled',
  VOICE_MESSAGES: 'voice-messages',
  AI_SUGGESTIONS: 'ai-suggestions',
  VIDEO_CHAT: 'video-chat',
  STORY_HIGHLIGHTS: 'story-highlights',
  ADVANCED_FILTERS: 'advanced-filters',
};
```

---

## 9. Analytics & Observability

### Key Metrics

#### User Engagement

- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Session duration
- Screens per session
- Return rate (day 1, 7, 30)

#### Matching Metrics

- Swipes per session
- Match rate (mutual likes / total swipes)
- Message rate (messaged matches / total matches)
- Response rate (replied messages / sent messages)
- Time to first message after match

#### Content Metrics

- Stories posted per day
- Story views per post
- Story completion rate
- Voice message usage
- Photo upload rate

#### System Health

- API response times (p50, p95, p99)
- Error rates by endpoint
- WebSocket connection stability
- Message delivery latency
- Storage usage

### Correlation ID Tracking

```typescript
// Generate correlation ID for every user action
const correlationId = generateCorrelationId();

// Attach to all API calls
const response = await fetch(url, {
  headers: {
    'X-Correlation-ID': correlationId,
    'X-User-ID': userId,
  },
});

// Log on client
console.log('[CID:%s] Action: %s', correlationId, actionName);

// Server logs with same CID
// [CID:123-abc] Received message_send from user-456
// [CID:123-abc] Validated message content
// [CID:123-abc] Saved to database
// [CID:123-abc] Emitted to recipient
```

---

## 10. Deployment & Environments

### Environment Configuration

```typescript
interface EnvironmentConfig {
  name: 'dev' | 'staging' | 'prod';
  api: {
    baseUrl: string;
    wsUrl: string;
    timeout: number;
  };
  cdn: {
    baseUrl: string;
    provider: 'cloudinary' | 's3' | 'local';
  };
  features: {
    analytics: boolean;
    errorTracking: boolean;
    debugMode: boolean;
  };
  limits: {
    maxUploadSize: number;
    maxMessageLength: number;
    rateLimit: number;
  };
}

// Current implementation (single environment)
const config: EnvironmentConfig = {
  name: 'dev',
  api: {
    baseUrl: window.location.origin,
    wsUrl: `ws://${window.location.host}`,
    timeout: 30000,
  },
  cdn: {
    baseUrl: 'https://images.unsplash.com',
    provider: 'local',
  },
  features: {
    analytics: false,
    errorTracking: false,
    debugMode: true,
  },
  limits: {
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    maxMessageLength: 1000,
    rateLimit: 100,
  },
};
```

### Bootstrap Command (Future)

```bash
# Start all services with seed data
npm run dev:all

# This would start:
# - Web dev server (Vite)
# - API server (Express/Fastify)
# - WebSocket gateway
# - Background workers
# - Seed database with demo data
```

---

## 11. Testing Strategy

### Unit Tests

- Utility functions
- State management hooks
- Data transformations
- Validation logic

### Integration Tests

- API endpoint flows
- WebSocket event handling
- Authentication flows
- Payment processing

### E2E Tests (Smoke Checklist)

```
□ User Registration
  - Sign up with valid email
  - Email verification (skip in dev)
  - Create first pet profile
  - Navigate to discover view

□ Discovery & Matching
  - View pet cards
  - Swipe left (pass)
  - Swipe right (like)
  - Mutual match triggers celebration
  - Match appears in Matches view

□ Messaging
  - Open chat from match
  - Send text message
  - Message appears in real-time
  - Typing indicators work
  - Read receipts update

□ Stories
  - Create new story
  - Add text and stickers
  - Publish to followers
  - View others' stories
  - Story appears in feed

□ Admin Console
  - Login as admin
  - View reports queue
  - Take moderation action
  - Action reflects on user side
  - Audit log entry created

□ Error Handling
  - Offline mode queues actions
  - Invalid inputs show errors
  - Rate limits trigger warnings
  - Correlation IDs in logs
```

---

## 12. Performance Optimizations

### Client-Side

1. **Code Splitting**
   - Lazy load views
   - Dynamic imports for heavy components
   - Vendor chunk separation

2. **Asset Optimization**
   - Image lazy loading
   - WebP with fallbacks
   - Responsive images
   - Icon sprites

3. **Caching Strategy**
   - Service worker for offline support
   - IndexedDB for large data sets
   - Memory cache for frequently accessed data
   - Cache invalidation on updates

4. **Rendering Optimization**
   - Virtual scrolling for long lists
   - Debounced search inputs
   - Memoized expensive computations
   - React.memo for pure components

### Server-Side (Future)

1. **Database**
   - Indexed queries
   - Query result caching
   - Connection pooling
   - Read replicas

2. **API**
   - Response compression
   - ETag caching
   - Pagination (cursor-based)
   - GraphQL for complex queries

3. **Real-Time**
   - Redis for pub/sub
   - Message queues for background jobs
   - WebSocket connection pooling
   - Presence tracking optimization

---

## 13. Privacy & Data Protection

### Data Categories

1. **Personal Identifiable Information (PII)**
   - Email addresses
   - Names
   - Location data
   - IP addresses
   - Stored encrypted

2. **User-Generated Content**
   - Messages
   - Photos
   - Stories
   - User controls visibility

3. **Usage Analytics**
   - Anonymized where possible
   - Aggregated for insights
   - No cross-user tracking

### Privacy Controls

```typescript
interface PrivacySettings {
  profileVisibility: 'public' | 'matches-only' | 'private';
  locationSharing: 'precise' | 'approximate' | 'off';
  onlineStatus: 'visible' | 'hidden';
  readReceipts: boolean;
  activityStatus: boolean;
  allowStorySharing: boolean;
  allowAnalytics: boolean;
}
```

### Data Retention

- **Active data**: Retained while account is active
- **Messages**: 90 days for inactive conversations
- **Stories**: 24 hours (or saved to highlights)
- **Audit logs**: 7 years
- **Deleted accounts**: 30-day grace period, then permanent deletion

---

## 14. Disaster Recovery

### Backup Strategy

- **spark.kv data**: Automatic backups by platform
- **Critical data**: Export capability for users
- **Audit logs**: Immutable, separate storage

### Data Recovery

```typescript
// User can export their data
const exportUserData = async (userId: string) => {
  const userData = await spark.kv.get(`user-profile-${userId}`);
  const pets = await spark.kv.get(`user-pets-${userId}`);
  const matches = await spark.kv.get(`matches-${userId}`);
  const messages = await spark.kv.get(`user-messages-${userId}`);

  return {
    profile: userData,
    pets,
    matches,
    messages,
    exportedAt: new Date().toISOString(),
  };
};
```

---

## 15. Future Enhancements

### Phase 2 (3-6 months)

- Video chat for matched users
- AI-powered conversation starters
- Advanced matching algorithm with ML
- Pet behavior insights
- Gamification (achievements, leaderboards)

### Phase 3 (6-12 months)

- Pet health records integration
- Veterinarian recommendations
- Pet-friendly location finder
- Event planning for pet meetups
- Pet product marketplace

### Phase 4 (12+ months)

- International expansion
- Multi-pet profiles per user
- Breeder verification program
- Pet adoption integration
- Community forums

---

## 16. Documentation Index

### Technical Docs

- [API Documentation](./API.md) - Future
- [WebSocket Events](./WEBSOCKET.md) - Future
- [Database Schema](./SCHEMA.md) - Future
- [Component Library](./COMPONENTS.md) - See `/src/components`

### Business Docs

- [Product Requirements](./PRD.md) - Exists
- [User Flows](./USER_FLOWS.md) - This document
- [Feature Specifications](./FEATURES.md) - Future

### Operations Docs

- [Deployment Guide](./DEPLOY.md) - Future
- [Monitoring Setup](./MONITORING.md) - Future
- [Incident Response](./INCIDENTS.md) - Future

---

## 17. Team Contacts (Future)

- **Product**: product@pawfectmatch.com
- **Engineering**: eng@pawfectmatch.com
- **Support**: support@pawfectmatch.com
- **Security**: security@pawfectmatch.com

---

## Conclusion

This architecture map provides a comprehensive view of the PawfectMatch system, from high-level components to detailed data flows. As the product evolves from the current spark.kv-based prototype to a full production system with dedicated backend services, this document serves as the blueprint for system design, implementation, and scaling decisions.

**Last Updated**: 2024
**Version**: 1.0
**Maintained By**: Engineering Team
