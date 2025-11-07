# API Directory - Strict Optional Semantics

This directory contains API layer code that enforces strict optional property types for update/patch operations.

## Purpose

The API layer uses `OptionalWithUndef<T>` to distinguish between:
- **Omitted property**: Field is not updated (keep existing value)
- **Undefined value**: Field is explicitly cleared (set to null/empty)

## Migration from Legacy API

### Legacy Pattern (in `src/lib/api/`)
```typescript
async updateListing(id: string, data: Partial<CreateAdoptionListingData>) {
  // Problem: Can't distinguish between omitted and undefined
}
```

### Strict Pattern (in `src/api/`)
```typescript
import type { UpdateAdoptionListingData } from './types'

async updateListing(id: string, data: UpdateAdoptionListingData) {
  // Can explicitly handle undefined to clear fields
  if (data.fee !== undefined) {
    listing.fee = data.fee ?? undefined
  }
}
```

## Type Definitions

See `src/api/types.ts` for type definitions using `OptionalWithUndef<T>`.

## Example Files

- `adoption-api-strict.ts` - Example implementation using strict optionals
- `types.ts` - Type definitions for API operations

## Files in this Directory

- `adoption-api.ts` - Adoption API (copied from lib, ready for migration)
- `community-api.ts` - Community API (copied from lib, ready for migration)
- `matching-api.ts` - Matching API (copied from lib, ready for migration)
- `lost-found-api.ts` - Lost/Found API (copied from lib, ready for migration)
- `live-streaming-api.ts` - Live Streaming API (copied from lib, ready for migration)
- `types.ts` - Strict optional type definitions
- `adoption-api-strict.ts` - Example strict implementation
- `README.md` - This file

STRICT MODE – NON-NEGOTIABLE

You must:
1) Write code + tests + types simultaneously. No stubs, no “TODO”, no broad “any”.
2) Run the local strict pipeline and reach 100% pass before proposing code.
3) If a gate fails, self-repair and re-run until green. Do not ask for approval with failing gates.
4) Output: PR with diff, passing CI, coverage report, and short design notes.

Definition of Done (all must be green):
- Type safety: tsc --noEmit
- Lint: eslint (errors only), stylelint
- Tests: vitest with coverage >= 95% statements/branches/functions/lines
- Security & quality: semgrep ruleset, depcheck, ts-prune
- Hygiene: forbid reserved words (TODO, FIXME, HACK, SIMPLE)
- Bundle/size: size-limit thresholds respected
