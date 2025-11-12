# Backend Integration Guide

## Overview

PawfectMatch now uses a robust client-side backend architecture powered by the Spark runtime's persistent key-value storage API. This provides production-ready data persistence, authentication, and data isolation without requiring external servers.

## Architecture

### Core Components

1. **Database Service** (`src/lib/database.ts`)
   - Full CRUD operations with MongoDB-like API
   - Query support with filtering, sorting, pagination
   - Collection-based data organization
   - Type-safe operations with TypeScript

2. **Enhanced Authentication** (`src/lib/enhanced-auth.ts`)
   - GitHub-based authentication via Spark user API
   - Guest user support for non-authenticated access
   - Role-based access control (user, moderator, admin)
   - Session management with automatic expiration

3. **React Hook** (`src/hooks/useAuth.ts`)
   - Easy authentication state management
   - Profile updates
   - Permission checking

## Database Service API

### Creating Records

```typescript
import { db } from '@/lib/database';

interface Pet extends DBRecord {
  name: string;
  species: string;
  breed: string;
  age: number;
  ownerId: string;
}

const newPet = await db.create<Pet>('pets', {
  name: 'Buddy',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  ownerId: currentUser.id,
});
```

### Reading Records

```typescript
// Find by ID
const pet = await db.findById<Pet>('pets', petId);

// Find one matching criteria
const pet = await db.findOne<Pet>('pets', { name: 'Buddy' });

// Find many with pagination and filters
const result = await db.findMany<Pet>('pets', {
  filter: { species: 'dog', age: { $gte: 2, $lte: 5 } },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 10,
  offset: 0,
});

console.log(result.data); // Array of pets
console.log(result.total); // Total count
console.log(result.hasMore); // More results available
```

### Updating Records

```typescript
const updatedPet = await db.update<Pet>('pets', petId, {
  age: 4,
  name: 'Buddy Jr',
});
```

### Deleting Records

```typescript
// Delete one
const deleted = await db.delete<Pet>('pets', petId);

// Delete many
const count = await db.deleteMany<Pet>('pets', { species: 'cat' });
```

### Query Operators

```typescript
// Comparison operators
{ age: { $gt: 2 } }        // Greater than
{ age: { $gte: 2 } }       // Greater than or equal
{ age: { $lt: 5 } }        // Less than
{ age: { $lte: 5 } }       // Less than or equal
{ age: { $ne: 3 } }        // Not equal

// Array operators
{ species: { $in: ['dog', 'cat'] } }
{ species: ['dog', 'cat'] }  // Alternative syntax

// Multiple conditions (AND)
{ species: 'dog', age: { $gte: 2, $lte: 5 } }
```

### Utility Methods

```typescript
// Count documents
const count = await db.count<Pet>('pets', { species: 'dog' });

// Check existence
const exists = await db.exists<Pet>('pets', { name: 'Buddy' });

// Get all collections
const collections = await db.getAllCollections();

// Clear a collection
await db.clearCollection('pets');
```

## Authentication API

### Using the Hook (Recommended)

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const {
    user,              // Current user profile
    isLoading,         // Auth initialization loading
    error,             // Auth error if any
    isAuthenticated,   // Boolean auth status
    hasRole,           // Check user role
    isOwner,           // Check if user is app owner
    updateProfile,     // Update user profile
    updatePreferences, // Update user preferences
    logout             // Logout function
  } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {isAuthenticated ? (
        <>
          <h1>Welcome {user?.displayName}</h1>
          {user?.avatarUrl && <img src={user.avatarUrl} alt="Avatar" />}
          {hasRole('admin') && <AdminPanel />}
        </>
      ) : (
        <div>Please sign in via GitHub</div>
      )}
    </div>
  )
}
```

### Direct Service Usage

```typescript
import { enhancedAuth } from '@/lib/enhanced-auth';

// Initialize (happens automatically in useAuth)
await enhancedAuth.initialize();

// Get current user
const user = enhancedAuth.getCurrentUser();

// Check authentication
const isAuth = enhancedAuth.isAuthenticated();

// Check roles
const isAdmin = enhancedAuth.hasRole('admin');
const isModerator = enhancedAuth.hasRole('moderator');
const isOwner = enhancedAuth.isOwner();

// Update profile
await enhancedAuth.updateUserProfile({
  displayName: 'New Name',
  bio: 'My bio',
});

// Update preferences
await enhancedAuth.updatePreferences({
  theme: 'dark',
  language: 'bg',
});

// Logout
await enhancedAuth.logout();
```

### Admin Operations

```typescript
// Get all users (moderator/admin only)
const users = await enhancedAuth.getAllUsers({ limit: 50, offset: 0 });

// Get user by ID
const user = await enhancedAuth.getUserById(userId);

// Suspend user (moderator/admin only)
await enhancedAuth.suspendUser(userId);

// Activate user (moderator/admin only)
await enhancedAuth.activateUser(userId);

// Delete user (admin only)
await enhancedAuth.deleteUser(userId);

// Get active sessions (admin only)
const sessions = await enhancedAuth.getActiveSessions();

// Cleanup expired sessions
const cleanedCount = await enhancedAuth.cleanupExpiredSessions();
```

## User Profile Structure

```typescript
interface UserProfile {
  id: string;
  githubId?: string; // GitHub user ID (if authenticated)
  githubLogin?: string; // GitHub username
  email?: string; // User email
  displayName: string; // Display name
  avatarUrl?: string; // Avatar URL
  bio?: string; // User bio
  roles: UserRole[]; // ['user', 'moderator', 'admin']
  status: 'active' | 'suspended' | 'deleted';
  preferences: {
    theme: 'light' | 'dark';
    language: 'en' | 'bg';
    notifications: {
      push: boolean;
      email: boolean;
      matches: boolean;
      messages: boolean;
      likes: boolean;
    };
    quietHours: {
      start: string;
      end: string;
    } | null;
  };
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}
```

## Data Persistence

All data is automatically persisted using the Spark KV store:

- **Survives page refreshes**: Data persists across sessions
- **Per-user isolation**: Each user's data is isolated
- **Automatic syncing**: Changes are automatically saved
- **Offline support**: Data is available offline
- **Type-safe**: Full TypeScript support

## Collections

Organize your data into collections (similar to MongoDB):

```typescript
// Users
'users' → UserProfile[]

// Sessions
'sessions' → Session[]

// Pets (example)
'pets' → Pet[]

// Matches (example)
'matches' → Match[]

// Messages (example)
'messages' → Message[]
```

## Best Practices

### 1. Define Your Data Models

```typescript
import { type DBRecord } from '@/lib/database';

export interface Pet extends DBRecord {
  name: string;
  species: string;
  breed: string;
  age: number;
  ownerId: string;
  photos: string[];
  bio?: string;
}
```

### 2. Create Service Layers

```typescript
// src/lib/pet-service.ts
import { db } from '@/lib/database';
import { enhancedAuth } from '@/lib/enhanced-auth';
import type { Pet } from '@/lib/types';

export class PetService {
  async createPet(data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<Pet> {
    const currentUser = enhancedAuth.getCurrentUser();
    if (!currentUser) throw new Error('Must be authenticated');

    return await db.create<Pet>('pets', {
      ...data,
      ownerId: currentUser.id,
    });
  }

  async getMyPets(): Promise<Pet[]> {
    const currentUser = enhancedAuth.getCurrentUser();
    if (!currentUser) return [];

    const result = await db.findMany<Pet>('pets', {
      filter: { ownerId: currentUser.id },
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return result.data;
  }

  async updatePet(petId: string, updates: Partial<Pet>): Promise<Pet | null> {
    const currentUser = enhancedAuth.getCurrentUser();
    if (!currentUser) throw new Error('Must be authenticated');

    const pet = await db.findById<Pet>('pets', petId);
    if (!pet || pet.ownerId !== currentUser.id) {
      throw new Error('Unauthorized');
    }

    return await db.update<Pet>('pets', petId, updates);
  }

  async deletePet(petId: string): Promise<boolean> {
    const currentUser = enhancedAuth.getCurrentUser();
    if (!currentUser) throw new Error('Must be authenticated');

    const pet = await db.findById<Pet>('pets', petId);
    if (!pet || pet.ownerId !== currentUser.id) {
      throw new Error('Unauthorized');
    }

    return await db.delete<Pet>('pets', petId);
  }
}

export const petService = new PetService();
```

### 3. Use React Hooks

```typescript
// src/hooks/usePets.ts
import { useState, useEffect } from 'react';
import { petService } from '@/lib/pet-service';
import type { Pet } from '@/lib/types';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPets() {
      const data = await petService.getMyPets();
      setPets(data);
      setIsLoading(false);
    }
    loadPets();
  }, []);

  const createPet = async (data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => {
    const newPet = await petService.createPet(data);
    setPets((prev) => [newPet, ...prev]);
    return newPet;
  };

  return { pets, isLoading, createPet };
}
```

## Migration from Old System

If you have existing code using the old auth service, here's how to migrate:

### Before

```typescript
import { authService } from '@/lib/auth';

await authService.login({ email, password });
const user = authService.getCurrentUser();
```

### After

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  // User is automatically loaded from Spark auth
  // No manual login needed - GitHub handles it
}
```

## Testing

```typescript
// Initialize auth in tests
import { enhancedAuth } from '@/lib/enhanced-auth';

beforeEach(async () => {
  await enhancedAuth.initialize();
});

afterEach(async () => {
  await enhancedAuth.logout();
});
```

## Performance Considerations

- Collections are loaded entirely into memory (suitable for small-medium datasets)
- For large datasets, implement pagination
- Use indexes by querying specific fields
- Clear old data periodically

## Security

- All data is stored client-side (Spark KV store)
- User authentication via GitHub OAuth (handled by Spark)
- Role-based access control enforced in code
- Session expiration after 24 hours
- No sensitive data should be stored (passwords, API keys, etc.)

## Troubleshooting

### Data Not Persisting

```typescript
// Check if Spark KV is available
const keys = await window.spark.kv.keys();
console.log('Available keys:', keys);
```

### Auth Not Working

```typescript
// Check current user
import { enhancedAuth } from '@/lib/enhanced-auth';

await enhancedAuth.initialize();
const user = enhancedAuth.getCurrentUser();
console.log('Current user:', user);

// Check Spark user
const sparkUser = await window.spark.user();
console.log('Spark user:', sparkUser);
```

### Performance Issues

```typescript
// Use pagination for large datasets
const result = await db.findMany('large-collection', {
  limit: 50,
  offset: page * 50,
});

// Clear old data
await db.deleteMany('old-records', {
  createdAt: { $lt: oneMonthAgo },
});
```

## Next Steps

1. Define your data models in `src/lib/types.ts`
2. Create service layers in `src/lib/`
3. Build React hooks in `src/hooks/`
4. Update your components to use the new APIs
5. Test thoroughly with different user roles

---

For more information about the Spark runtime, see the official documentation.
