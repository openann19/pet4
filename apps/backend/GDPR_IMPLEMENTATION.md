# GDPR Backend Implementation

## Overview

Backend implementation of GDPR-compliant endpoints for data export, deletion, and consent management.

## Endpoints

### POST /api/gdpr/export
Export user data (GDPR Right to Access)

**Request:**
```json
{
  "userId": "user1",
  "format": "json"
}
```

**Response:**
```json
{
  "user": { ... },
  "sessions": [ ... ],
  "pets": [ ... ],
  "matches": [ ... ],
  "chats": [ ... ],
  "posts": [ ... ],
  "preferences": { ... },
  "payments": [ ... ],
  "verification": [ ... ],
  "consents": [ ... ],
  "metadata": {
    "exportDate": "2024-01-01T00:00:00.000Z",
    "exportVersion": "1.0.0",
    "userId": "user1",
    "format": "json"
  }
}
```

### POST /api/gdpr/delete
Delete user data (GDPR Right to Erasure)

**Request:**
```json
{
  "userId": "user1",
  "confirmDeletion": true,
  "reason": "User requested deletion"
}
```

**Response:**
```json
{
  "success": true,
  "deletedCollections": ["users", "sessions", "pets"],
  "deletedRecords": 15,
  "errors": [],
  "deletionDate": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/gdpr/consent?userId={userId}
Get user consent status

**Response:**
```json
[
  {
    "id": "consent1",
    "userId": "user1",
    "category": "essential",
    "status": "accepted",
    "version": "1.0.0",
    "acceptedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "consent2",
    "userId": "user1",
    "category": "analytics",
    "status": "rejected",
    "version": "1.0.0",
    "rejectedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/gdpr/consent
Update user consent

**Request:**
```json
{
  "userId": "user1",
  "category": "analytics",
  "status": "accepted",
  "version": "1.0.0",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0"
}
```

**Response:**
```json
{
  "id": "consent2",
  "userId": "user1",
  "category": "analytics",
  "status": "accepted",
  "version": "1.0.0",
  "acceptedAt": "2024-01-01T00:00:00.000Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0"
}
```

## Architecture

### Service Layer
- `GDPRService`: Main service for GDPR operations
- `GDPRDatabase`: Database abstraction interface
- `MockDatabase`: In-memory mock database for development

### Routes
- `gdpr-routes.ts`: Express routes with Zod validation

### Middleware
- `auth.ts`: Authentication middleware (development: x-user-id header)
- `error-handler.ts`: Centralized error handling

### Utilities
- `logger.ts`: Structured logging
- `errors.ts`: Custom error classes

## Database Integration

To connect to a real database:

1. Implement the `GDPRDatabase` interface:
```typescript
export class MyDatabase implements GDPRDatabase {
  async getUserById(userId: string): Promise<UserProfile | null> {
    // Implement database query
  }
  // ... implement other methods
}
```

2. Replace `MockDatabase` with your implementation in `src/index.ts`:
```typescript
const db = new MyDatabase();
const gdprService = new GDPRService(db);
```

## Authentication

For development, use the `x-user-id` header:
```bash
curl -H "x-user-id: user1" http://localhost:3000/api/gdpr/consent?userId=user1
```

For production, implement proper JWT token validation in `src/middleware/auth.ts`.

## Testing

Run tests:
```bash
pnpm test
```

Run type check:
```bash
pnpm typecheck
```

Run linter:
```bash
pnpm lint
```

## Development

Start development server:
```bash
pnpm dev
```

The server will start on `http://localhost:3000` by default.

## Production Deployment

1. Set environment variables:
   - `PORT`: Server port (default: 3000)
   - `NODE_ENV`: Environment (production)
   - `CORS_ORIGIN`: CORS origin

2. Build the project:
```bash
pnpm build
```

3. Start the server:
```bash
pnpm start
```

## GDPR Compliance

This implementation follows GDPR requirements:

- **Right to Access**: Users can export their data via `/api/gdpr/export`
- **Right to Erasure**: Users can delete their data via `/api/gdpr/delete`
- **Consent Management**: Users can manage consent via `/api/gdpr/consent`
- **Data Portability**: Data is exported in JSON format
- **Audit Trail**: Consent changes are logged with timestamps and IP addresses

## Security Considerations

1. **Authentication**: Implement proper JWT validation in production
2. **Authorization**: Verify users can only access their own data
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Data Encryption**: Encrypt sensitive data at rest
5. **Audit Logging**: Log all GDPR operations for compliance
6. **Data Retention**: Implement data retention policies
7. **Secure Deletion**: Ensure data is permanently deleted (not just soft-deleted)

## Next Steps

1. Implement real database integration
2. Add JWT authentication
3. Add rate limiting
4. Add audit logging
5. Add data encryption
6. Add comprehensive tests
7. Add API documentation (OpenAPI/Swagger)
8. Add monitoring and alerting
