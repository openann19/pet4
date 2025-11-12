# Auth Contract

## Overview

Single authentication flow for Web, Mobile, and Admin Console using JWT access tokens with rotating refresh tokens.

## Token Structure

### Access Token

- **Type**: JWT (JSON Web Token)
- **Lifetime**: 15 minutes (900 seconds)
- **Claims**:
  - `sub`: User ID
  - `email`: User email
  - `roles`: Array of user roles (`user`, `moderator`, `admin`)
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp
  - `iss`: Issuer (from `AUTH_ISSUER` config)

### Refresh Token

- **Type**: Opaque string (stored server-side)
- **Lifetime**: 7 days
- **Storage**:
  - Web: httpOnly cookie + CSRF token
  - Mobile: Secure storage (Keychain/Keystore)
- **Rotation**: New refresh token issued on each refresh

## Authentication Flow

### 1. Login

```
POST /api/auth/login
Body: { email: string, password: string }
Response: { user: User, tokens: AuthTokens }
```

### 2. Signup

```
POST /api/auth/signup
Body: { email: string, password: string, displayName: string }
Response: { user: User, tokens: AuthTokens }
```

### 3. Refresh Token

```
POST /api/auth/refresh
Headers: { Cookie: refreshToken=... }
Response: { tokens: AuthTokens }
```

### 4. Logout

```
POST /api/auth/logout
Headers: { Authorization: Bearer <accessToken> }
Response: 204 No Content
```

## Error Handling

### Shared Error Response Format

```typescript
{
  code: string;
  message: string;
  correlationId: string;
  timestamp: string;
}
```

### Error Codes

| Code       | HTTP Status | Description              |
| ---------- | ----------- | ------------------------ |
| `AUTH_001` | 401         | Invalid credentials      |
| `AUTH_002` | 401         | Token expired            |
| `AUTH_003` | 401         | Invalid token            |
| `AUTH_004` | 401         | Token missing            |
| `AUTH_005` | 403         | Insufficient permissions |
| `AUTH_006` | 401         | Refresh token expired    |
| `AUTH_007` | 401         | Not authenticated        |
| `AUTH_008` | 409         | Email already exists     |

### Refresh Flow

1. Client receives 401 response
2. Attempt refresh once (prevent infinite loops)
3. If refresh succeeds, retry original request
4. If refresh fails, logout user

### Implementation Pattern

```typescript
try {
  const response = await api.get('/protected');
  return response;
} catch (error) {
  if (error.code === 'AUTH_002' || error.code === 'AUTH_003') {
    const refreshed = await authService.handleUnauthorized();
    if (refreshed) {
      return await api.get('/protected'); // Retry
    }
  }
  throw error;
}
```

## Roles & Permissions

### Roles

- **user**: Standard user, can create pets, swipe, chat
- **moderator**: Can review reports, moderate content, suspend users
- **admin**: Full access, can manage users, system config, feature flags

### Permission Check

```typescript
// Check role
if (authService.hasRole('admin')) {
  // Admin action
}

// Check permission
if (authService.hasPermission('moderate', 'content')) {
  // Moderation action
}
```

## Security

### Web (httpOnly Cookies)

- Access token: Memory only (never stored)
- Refresh token: httpOnly cookie + CSRF token
- CSRF protection: Token in header `X-CSRF-Token`

### Mobile (Secure Storage)

- Access token: Secure storage (Keychain/Keystore)
- Refresh token: Secure storage
- Token refresh: Automatic before expiration

### Session Management

- Single session per device
- Multiple devices supported
- Revoked sessions logged out immediately via WebSocket

## API Client Integration

All API clients automatically:

1. Include `Authorization: Bearer <token>` header
2. Include `X-Correlation-ID` header
3. Handle 401 responses with refresh
4. Propagate correlation IDs for tracing

## Examples

### Web Login

```typescript
const { user, tokens } = await authService.login({
  email: 'user@example.com',
  password: 'password',
});
// Tokens automatically stored in httpOnly cookies
```

### Mobile Login

```typescript
const { user, tokens } = await authService.login({
  email: 'user@example.com',
  password: 'password',
});
// Tokens stored in secure storage
await secureStorage.set('accessToken', tokens.accessToken);
await secureStorage.set('refreshToken', tokens.refreshToken);
```

### API Request

```typescript
// Automatic token injection and refresh handling
const pets = await api.get<Pet[]>('/pets');
```

## Testing

### Test Tokens

- Dev environment: Accept any token format
- Staging/Prod: Validate JWT signature

### Test Users

- `admin@demo.com` / `admin123` - Admin role
- `moderator@demo.com` / `mod123` - Moderator role
- `user@demo.com` / `user123` - User role

## Notes

- Tokens are stateless (JWT) for scalability
- Refresh tokens are stateful (server-side) for revocation
- All tokens include correlation IDs for audit trails
- Session revocation propagates via WebSocket to all devices
