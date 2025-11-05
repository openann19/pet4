# @petspark/shared

Shared TypeScript utilities, API clients, types, and core domain logic used across web and native applications.

## Structure

- `api/` - API client utilities and types
- `types/` - Shared TypeScript types
- `core/` - Core domain logic and utilities
- `utils/` - General-purpose utilities

## Usage

```typescript
import { createApiClient } from '@petspark/shared/api'
import { createLogger } from '@petspark/shared/core'
import { isValidEmail } from '@petspark/shared/utils'
import type { OptionalWithUndef } from '@petspark/shared/types'
```

## Development

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Build
pnpm build
```

