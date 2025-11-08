# Core Directory - Strict Optional Semantics

This directory contains core domain logic and utilities that enforce strict optional property types.

## What is Strict Optional Semantics?

With `exactOptionalPropertyTypes: true`, TypeScript distinguishes between:

- **Omitted property**: Field is not present in the object
- **Undefined value**: Field is explicitly set to `undefined`

## When to Use `OptionalWithUndef<T>`

Use `OptionalWithUndef<T>` in DTO/patch layers where you need to explicitly allow `undefined`:

```typescript
import type { OptionalWithUndef } from '@/types/optional-with-undef';

// Allows { name: undefined } to explicitly clear a field
type UpdateUser = OptionalWithUndef<User>;
```

## Migration Pattern

### Before (Legacy)

```typescript
type UpdateData = Partial<User>;
// Problem: { name: undefined } is the same as { name: missing }
```

### After (Strict)

```typescript
type UpdateData = OptionalWithUndef<User>;
// Solution: { name: undefined } explicitly clears, missing means don't change
```

## Example Usage

```typescript
// Clear a field explicitly
await api.updateUser(id, { name: undefined });

// Omit a field (don't change it)
await api.updateUser(id, { email: 'new@example.com' });
```

## Files in this Directory

- `types.ts` - Core domain types with strict optionals
- `utils.ts` - Utilities for working with strict optionals
- `README.md` - This file
