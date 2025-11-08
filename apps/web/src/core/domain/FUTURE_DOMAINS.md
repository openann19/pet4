# Future Domain Logic Migration Guide

This document outlines potential domain logic that could be migrated to `src/core/domain/` in the future.

## Current Domain Structure

Currently in `src/core/domain/`:

- ✅ `pet-model.ts` - Pet profiles, owner preferences, swipe/match records
- ✅ `matching-config.ts` - Matching weights, hard gates, feature flags
- ✅ `matching-engine.ts` - Matching algorithm, scoring, hard gate evaluation
- ✅ `species.ts` - Species definitions and metadata
- ✅ `breeds.ts` - Breed definitions and compatibility

## Candidate Domains for Future Migration

### 1. Business/Commerce Domain 📦

**Location:** `src/lib/business-types.ts`, `src/lib/payments-types.ts`, `src/lib/payments-catalog.ts`

**Potential Files:**

- `src/core/domain/business.ts` - Plans, entitlements, usage tracking
- `src/core/domain/payments.ts` - Product catalog, purchase types, subscription models
- `src/core/domain/entitlements.ts` - Entitlement calculation logic (from `entitlements-engine.ts`)

**Rationale:**

- Core business logic that defines how the product works
- Entitlement rules are critical domain logic
- Payment and subscription models are core to the business

**Example Types:**

```typescript
// business.ts
export interface Plan {
  id: string;
  tier: 'free' | 'premium' | 'elite';
  entitlements: Entitlements;
}

export interface Entitlements {
  swipeDailyCap: number | 'unlimited';
  superLikesPerDay: number;
  boostsPerWeek: number;
  // ... other entitlements
}

// entitlements.ts
export function calculateEntitlements(plan: Plan, purchases: Purchase[]): Entitlements {
  // Core business logic for entitlement calculation
}
```

### 2. Adoption/Marketplace Domain 🏠

**Location:** `src/lib/adoption-marketplace-types.ts`, `src/lib/adoption-types.ts`

**Potential Files:**

- `src/core/domain/adoption.ts` - Adoption listings, applications, status workflows
- `src/core/domain/marketplace.ts` - Marketplace rules, listing validation, matching logic

**Rationale:**

- Adoption listing statuses and workflows are core business rules
- Application review process is critical domain logic
- Marketplace rules (fees, requirements, etc.) are domain concerns

**Example Types:**

```typescript
// adoption.ts
export type AdoptionListingStatus = 'active' | 'pending_review' | 'adopted' | 'withdrawn';

export interface AdoptionListing {
  id: string;
  petId: string;
  status: AdoptionListingStatus;
  fee?: AdoptionFee;
  requirements: string[];
  // ... other fields
}

export function validateListingTransition(
  current: AdoptionListingStatus,
  next: AdoptionListingStatus
): boolean {
  // Core business rules for status transitions
}
```

### 3. Community/Social Domain 👥

**Location:** `src/lib/community-types.ts`, `src/lib/stories-types.ts`

**Potential Files:**

- `src/core/domain/community.ts` - Posts, comments, reactions, visibility rules
- `src/core/domain/stories.ts` - Story types, expiration rules, content policies

**Rationale:**

- Post visibility rules are core business logic
- Content moderation policies are domain concerns
- Story expiration and archiving rules are domain logic

**Example Types:**

```typescript
// community.ts
export type PostVisibility = 'public' | 'matches' | 'followers' | 'private';

export interface Post {
  id: string;
  visibility: PostVisibility;
  status: PostStatus;
  // ... other fields
}

export function canViewPost(post: Post, viewerId: string, relationship: Relationship): boolean {
  // Core visibility rules
}
```

### 4. Lost & Found Domain 🔍

**Location:** `src/lib/lost-found-types.ts`

**Potential Files:**

- `src/core/domain/lost-found.ts` - Lost alerts, sightings, proximity matching

**Rationale:**

- Alert status workflows are core business rules
- Proximity matching logic is domain logic
- Sighting validation rules are domain concerns

**Example Types:**

```typescript
// lost-found.ts
export type LostAlertStatus = 'active' | 'found' | 'closed';

export interface LostAlert {
  id: string;
  status: LostAlertStatus;
  location: Location;
  // ... other fields
}

export function calculateProximity(alert: LostAlert, sighting: Sighting): number {
  // Core proximity calculation logic
}
```

### 5. User/Identity Domain 👤

**Location:** `src/lib/verification-types.ts`, `src/lib/kyc-types.ts`

**Potential Files:**

- `src/core/domain/verification.ts` - Verification workflows, trust levels
- `src/core/domain/kyc.ts` - KYC status, document types, validation rules

**Rationale:**

- Verification status transitions are core business rules
- Trust level calculation is domain logic
- KYC validation rules are domain concerns

**Example Types:**

```typescript
// verification.ts
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface UserVerification {
  userId: string;
  status: VerificationStatus;
  level: TrustLevel;
  // ... other fields
}

export function calculateTrustLevel(verification: UserVerification): TrustLevel {
  // Core trust level calculation
}
```

### 6. Search/Recommendation Domain 🔎

**Location:** `src/lib/saved-search-types.ts`, `src/lib/smart-recommendations.ts`, `src/lib/optimized-matching.ts`

**Potential Files:**

- `src/core/domain/search.ts` - Saved searches, search filters, query types
- `src/core/domain/recommendations.ts` - Recommendation algorithms, scoring logic

**Rationale:**

- Search filter logic is core business logic
- Recommendation algorithms are domain logic
- Query optimization rules are domain concerns

**Example Types:**

```typescript
// search.ts
export interface SavedSearch {
  id: string;
  filters: SearchFilters;
  name: string;
  // ... other fields
}

export function validateSearchFilters(filters: SearchFilters): boolean {
  // Core validation rules
}

// recommendations.ts
export function calculateRecommendationScore(
  pet: PetProfile,
  target: PetProfile,
  preferences: OwnerPreferences
): number {
  // Core recommendation algorithm
}
```

### 7. Communication Domain 💬

**Location:** `src/lib/chat-types.ts`, `src/lib/call-types.ts`

**Potential Files:**

- `src/core/domain/chat.ts` - Chat types, message status, delivery rules
- `src/core/domain/calls.ts` - Call types, participant management, quality rules

**Rationale:**

- Message delivery rules are core business logic
- Call participant management is domain logic
- Communication policies are domain concerns

### 8. Content/Media Domain 📸

**Location:** `src/lib/stories-types.ts`, `src/lib/streaming-types.ts`

**Potential Files:**

- `src/core/domain/media.ts` - Media types, validation rules, content policies
- `src/core/domain/streaming.ts` - Live stream types, viewer limits, quality rules

**Rationale:**

- Media validation rules are core business logic
- Content moderation policies are domain logic
- Streaming quality rules are domain concerns

## Migration Criteria

When deciding if logic should move to `src/core/domain/`:

### ✅ Should Migrate

1. **Core Business Rules** - Rules that define how the business operates
2. **State Machines** - Status transitions and workflows
3. **Calculation Logic** - Algorithms specific to the domain (e.g., matching, scoring)
4. **Validation Rules** - Business-level validation (not just technical validation)
5. **Domain Models** - Entities that represent core business concepts
6. **Type Definitions** - Types that represent domain concepts

### ❌ Should NOT Migrate

1. **Infrastructure** - API clients, database access, network calls
2. **UI Utilities** - Component helpers, styling utilities
3. **Framework Integration** - React hooks, component state management
4. **Technical Utilities** - General-purpose utilities (date formatting, string manipulation)
5. **Configuration** - Environment configs, feature flags (unless they're domain rules)

## Migration Pattern

### Before (Legacy)

```typescript
// src/lib/business-types.ts
export type Plan = 'free' | 'premium' | 'elite';
```

### After (Strict)

```typescript
// src/core/domain/business.ts
import type { OptionalWithUndef } from '@/types/optional-with-undef';

export type Plan = 'free' | 'premium' | 'elite';

export interface UpdatePlanData extends OptionalWithUndef<Omit<Plan, 'id'>> {
  // Strict optional semantics for updates
}
```

## Migration Priority

1. **High Priority** - Core business logic that's heavily used
   - Business/Commerce domain (entitlements, plans)
   - Adoption/Marketplace domain (listing workflows)
   - Search/Recommendation domain (matching algorithms)

2. **Medium Priority** - Important but less critical
   - Community/Social domain (post visibility)
   - User/Identity domain (verification)
   - Lost & Found domain (alert workflows)

3. **Low Priority** - Nice to have but not critical
   - Communication domain (chat/call types)
   - Content/Media domain (media validation)

## Benefits of Migration

1. **Type Safety** - Strict optional semantics prevent bugs
2. **Centralization** - Domain logic in one place
3. **Testability** - Pure domain logic is easier to test
4. **Maintainability** - Clear separation of concerns
5. **Documentation** - Domain logic is self-documenting

## Notes

- Migration should be incremental
- Legacy code in `src/lib/` continues to work
- New code in `src/core/domain/` enforces strict optionals
- Both can coexist during migration period
