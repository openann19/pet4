# API Response Validation Guide

## Overview

This project implements **strict runtime type checking** for all API responses using Zod schemas. This ensures that data received from the backend matches expected types, preventing runtime errors and improving debugging.

## Architecture

### 1. Schema Definitions (`src/lib/api-schemas.ts`)

All API response types are defined using Zod schemas. These schemas provide:

- **Runtime validation**: Catch type mismatches before they cause errors
- **Type inference**: Automatic TypeScript types from schemas
- **Detailed error messages**: Know exactly what's wrong with the response
- **Composability**: Build complex schemas from simple primitives

Example:

```typescript
export const petSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  species: z.enum(['dog', 'cat']),
  age: z.number().int().min(0).max(30),
  verified: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Pet = z.infer<typeof petSchema>;
```

### 2. Validated API Client (`src/lib/validated-api-client.ts`)

The `ValidatedAPIClient` class wraps the fetch API and automatically validates all responses:

```typescript
const response = await validatedAPI.get('/api/v1/pets/123', petSchema);
// response is guaranteed to match Pet type or an error is thrown
```

**Features:**

- Automatic validation of all responses
- Correlation IDs for request tracking
- Timeout support (default 30s)
- Structured error handling
- Skip validation option for trusted endpoints

**Error Types:**

- `ValidationError`: Response doesn't match schema
- `APIResponseError`: HTTP error or network failure

### 3. API Services (`src/lib/api-services.ts`)

Pre-built service methods for common API operations:

```typescript
import { petAPI, matchingAPI, chatAPI } from '@/lib/api-services';

// All responses are validated automatically
const pet = await petAPI.getById('123');
const matches = await matchingAPI.getMatches('456');
const messages = await chatAPI.getMessages('room-789');
```

## Usage Examples

### Basic GET Request

```typescript
import { validatedAPI } from '@/lib/validated-api-client';
import { petSchema } from '@/lib/api-schemas';

try {
  const pet = await validatedAPI.get('/api/v1/pets/123', petSchema);
  console.log(pet.name); // Type-safe access
} catch (error) {
  console.error(handleAPIError(error));
}
```

### POST Request with Validation

```typescript
import { validatedAPI } from '@/lib/validated-api-client';
import { petSchema } from '@/lib/api-schemas';

const newPet = await validatedAPI.post('/api/v1/pets', petSchema, {
  name: 'Buddy',
  species: 'dog',
  age: 3,
});
```

### Using Pre-built Services

```typescript
import { petAPI } from '@/lib/api-services';
import { handleAPIError } from '@/lib/validated-api-client';

try {
  // List all pets for an owner
  const response = await petAPI.list({ ownerId: 'user-123' });
  console.log(`Found ${response.total} pets`);

  // Create a new pet
  const newPet = await petAPI.create({
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 2,
  });

  // Update pet
  await petAPI.update(newPet.id, { age: 3 });

  // Delete pet
  await petAPI.delete(newPet.id);
} catch (error) {
  const details = getErrorDetails(error);
  console.error(`Error ${details.code}: ${details.message}`);
}
```

### Handling Validation Errors

```typescript
import { ValidationError, APIResponseError } from '@/lib/validated-api-client';

try {
  const data = await validatedAPI.get('/api/v1/pets/123', petSchema);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Response validation failed:');
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    console.error(`Correlation ID: ${error.correlationId}`);
  } else if (error instanceof APIResponseError) {
    console.error(`API Error ${error.error.code}: ${error.error.message}`);
    console.error(`Correlation ID: ${error.error.correlationId}`);
  }
}
```

### Custom Timeouts

```typescript
// 10 second timeout
const pet = await validatedAPI.get('/api/v1/pets/123', petSchema, { timeout: 10000 });
```

### Skip Validation (Not Recommended)

```typescript
// Only use when you trust the endpoint completely
const data = await validatedAPI.get('/api/v1/trusted-endpoint', z.any(), { skipValidation: true });
```

## Available API Services

### Pet API

- `petAPI.getById(id)` - Get single pet
- `petAPI.create(data)` - Create new pet
- `petAPI.update(id, data)` - Update pet
- `petAPI.delete(id)` - Delete pet
- `petAPI.list(params)` - List pets with filters

### Matching API

- `matchingAPI.discover(petId, filters)` - Get discovery feed
- `matchingAPI.swipe(data)` - Record swipe action
- `matchingAPI.getMatches(petId)` - Get all matches
- `matchingAPI.reportPet(data)` - Report a pet

### Chat API

- `chatAPI.getMessages(chatRoomId, cursor)` - Get messages
- `chatAPI.sendMessage(chatRoomId, content)` - Send message
- `chatAPI.markAsRead(chatRoomId, messageId)` - Mark as read

### Auth API

- `authAPI.login(email, password)` - Login
- `authAPI.signup(data)` - Sign up
- `authAPI.refreshToken(token)` - Refresh token
- `authAPI.logout()` - Logout
- `authAPI.getCurrentUser()` - Get current user

### Notification API

- `notificationAPI.list(params)` - List notifications
- `notificationAPI.markAsRead(id)` - Mark as read
- `notificationAPI.markAllAsRead()` - Mark all as read

### Adoption API

- `adoptionAPI.listProfiles(filters)` - List adoption profiles
- `adoptionAPI.getProfile(id)` - Get profile details
- `adoptionAPI.submitApplication(data)` - Submit application

### Community API

- `communityAPI.getFeed(options)` - Get community feed
- `communityAPI.getPost(id)` - Get single post
- `communityAPI.createPost(data)` - Create post
- `communityAPI.deletePost(id)` - Delete post
- `communityAPI.getComments(postId)` - Get comments
- `communityAPI.addComment(postId, content)` - Add comment
- `communityAPI.reactToPost(postId, emoji)` - React to post

### Media API

- `mediaAPI.uploadPhoto(petId, file)` - Upload photo
- `mediaAPI.getPhotoStatus(photoId)` - Get photo status
- `mediaAPI.deletePhoto(photoId)` - Delete photo

### KYC API

- `kycAPI.createSession()` - Create KYC session
- `kycAPI.getSession(sessionId)` - Get session details
- `kycAPI.uploadDocument(sessionId, type, file)` - Upload document
- `kycAPI.submitSession(sessionId)` - Submit for review

### Admin API

- `adminAPI.getModerationQueue()` - Get moderation queue
- `adminAPI.moderatePhoto(photoId, action, reason)` - Moderate photo
- `adminAPI.getKYCQueue()` - Get KYC review queue
- `adminAPI.reviewKYC(sessionId, action, reason)` - Review KYC
- `adminAPI.getAnalytics(timeRange)` - Get analytics data

## Schema Definitions

### Core Entities

- **Pet**: `petSchema` - Pet profile with photos, personality, location
- **Match**: `matchSchema` - Match between two pets
- **Message**: `messageSchema` - Chat message
- **User**: `userSchema` - User account
- **Notification**: `notificationSchema` - User notification
- **Report**: `reportSchema` - Content report
- **Story**: `storySchema` - Temporary story
- **Verification**: `verificationSchema` - Verification request

### Specialized Entities

- **AdoptionProfile**: `adoptionProfileSchema` - Pet adoption listing
- **CommunityPost**: `communityPostSchema` - Community post
- **Comment**: `commentSchema` - Post comment
- **PhotoRecord**: `photoRecordSchema` - Photo with moderation status
- **KYCSession**: `kycSessionSchema` - KYC verification session

### Response Wrappers

- **PaginatedResponse**: `paginatedResponseSchema(itemSchema)` - Paginated list
- **DiscoverResponse**: `discoverResponseSchema` - Discovery feed
- **SwipeResponse**: `swipeResponseSchema` - Swipe action result
- **APIError**: `apiErrorSchema` - Error response

## Best Practices

### 1. Always Use Validated Endpoints

```typescript
// ✅ Good
const pet = await petAPI.getById('123');

// ❌ Avoid
const response = await fetch('/api/v1/pets/123');
const pet = await response.json(); // No validation!
```

### 2. Handle Errors Gracefully

```typescript
import { handleAPIError, getErrorDetails } from '@/lib/validated-api-client';

try {
  await petAPI.create(data);
  toast.success('Pet created successfully');
} catch (error) {
  const message = handleAPIError(error);
  toast.error(message);

  // For detailed logging
  const details = getErrorDetails(error);
  console.error('API Error:', details);
}
```

### 3. Use Correlation IDs for Debugging

All requests include a unique `X-Correlation-ID` header. When errors occur, this ID is available in the error object:

```typescript
try {
  await petAPI.getById('123');
} catch (error) {
  if (error instanceof APIResponseError) {
    console.log(`Correlation ID: ${error.error.correlationId}`);
    // Share this ID with backend team for debugging
  }
}
```

### 4. Validate Before Sending

For complex data structures, validate locally before sending:

```typescript
import { petSchema } from '@/lib/api-schemas';

const data = {
  name: 'Buddy',
  species: 'dog',
  age: -5, // Invalid!
};

const result = petSchema.safeParse(data);
if (!result.success) {
  // Show validation errors to user
  result.error.errors.forEach((err) => {
    console.error(`${err.path}: ${err.message}`);
  });
} else {
  // Send validated data
  await petAPI.create(result.data);
}
```

### 5. Type-Safe Query Parameters

```typescript
// Build query params type-safely
const params = new URLSearchParams({
  ownerId: 'user-123',
  status: 'active',
});

const response = await validatedAPI.get(
  `/api/v1/pets?${params}`,
  paginatedResponseSchema(petSchema)
);
```

## Testing

### Mock Validated API

```typescript
import { vi } from 'vitest';
import { petAPI } from '@/lib/api-services';

vi.mock('@/lib/api-services', () => ({
  petAPI: {
    getById: vi.fn().mockResolvedValue({
      id: '123',
      name: 'Test Pet',
      species: 'dog',
      age: 3,
      // ... other required fields
    }),
  },
}));

// Test code
const pet = await petAPI.getById('123');
expect(pet.name).toBe('Test Pet');
```

### Validate Test Data

```typescript
import { petSchema } from '@/lib/api-schemas';

// Ensure mock data matches schema
const mockPet = petSchema.parse({
  id: '123',
  name: 'Test Pet',
  species: 'dog',
  // ... will throw if invalid
});
```

## Migration from Unvalidated Code

### Before

```typescript
const response = await fetch('/api/v1/pets/123');
const pet = await response.json();
// pet could be anything!
```

### After

```typescript
import { petAPI } from '@/lib/api-services';

const pet = await petAPI.getById('123');
// pet is guaranteed to match Pet type
```

## Performance Considerations

- Validation adds <1ms overhead for typical responses
- Validation errors are caught immediately, preventing downstream issues
- Failed validation is logged with full details for debugging
- Schemas are compiled once and reused

## Troubleshooting

### "Response validation failed"

Check the validation errors in the console:

```typescript
error.errors.forEach((err) => {
  console.log(err.path, err.message, err.received);
});
```

Common causes:

- Backend sent wrong type (string instead of number)
- Missing required fields
- Invalid enum value
- Wrong date format (use ISO 8601)

### "Request timeout"

- Default timeout is 30 seconds
- Increase for slow endpoints: `{ timeout: 60000 }`
- Check network conditions
- Verify backend is responding

### "Network request failed"

- Check internet connectivity
- Verify API base URL is correct
- Check CORS configuration
- Verify backend is running

## Future Enhancements

- [ ] Automatic retry with exponential backoff
- [ ] Request deduplication
- [ ] Response caching
- [ ] Optimistic updates
- [ ] WebSocket message validation
- [ ] GraphQL schema integration
- [ ] OpenAPI spec generation from schemas
