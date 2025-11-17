# Detailed TypeScript Error Breakdown

## Total Errors: 214 (Web App)
## Mobile App: 0 errors ✅

## Errors by File (Top 20)

### 1. DiscoverView.test.tsx - 22 errors
- Storage mock return type mismatches
- Pet type missing properties
- CompatibilityFactors type issues
- ViewMode hook type mismatches
- Dialog hook type mismatches
- AdoptionProfilesResponse type mismatches
- usePetDiscovery return type mismatches

### 2. target-size-integration.test.tsx - 14 errors
- TargetSizeValidationResult missing width property (5 instances)
- TargetSizeValidationResult missing height property (5 instances)
- IconButton props mismatch (4 instances)

### 3. useOnlineStatus.test.ts - 12 errors
- Cannot assign to 'onLine' because it is a read-only property (12 instances)

### 4. usePetDiscovery.test.ts - 12 errors
- Storage mock return type mismatch (5 instances)
- Pet type missing properties: breed, gender, size, photo, and 9 more (7 instances)

### 5. useEntitlements.test.ts - 9 errors
- Mock function type issues (5 instances)
- EntitlementKey type mismatches (4 instances)

### 6. purchase-service.test.tsx - 7 errors
- Response not assignable to APIResponse (7 instances)

### 7. useChatMessages.test.ts - 5 errors
- Message type mismatches (2 instances)
- MessageReaction type mismatches (1 instance)
- deleteMessage doesn't exist (1 instance)
- Message array type mismatch (1 instance)

### 8. useStories.test.ts - 5 errors
- Story type missing properties (4 instances)
- clearSelectedStory doesn't exist (1 instance)

### 9. accordion.test.tsx - 5 errors
- Accordion component props mismatch (5 instances)

### 10. AdoptionMarketplaceView.tsx - 4 errors
- Parameter 'breed' implicitly has 'any' type (1 instance)
- Parameter 'prev' implicitly has 'any' type (3 instances)

### 11. useDiscoverSwipe.ts - 4 errors
- performSwipe doesn't exist (1 instance)
- checkMatch doesn't exist (1 instance)
- 'id' doesn't exist in SwipeAction (1 instance)
- 'compatibility' doesn't exist in Match (1 instance)

### 12. VerificationDialog.tsx - 2 errors
- motion.durations.li doesn't exist (2 instances)

### 13. SavedSearchesManager.tsx - 2 errors
- 'totalItems' doesn't exist in UseStaggeredItemOptions (1 instance)
- 'animatedStyle' doesn't exist in UseStaggeredItemReturn (1 instance)

### 14. DataExport.tsx - 3 errors
- ExportFormat not assignable to '"json" | undefined' (1 instance)
- UserDataExport to Record conversion (2 instances)

### 15. ProfileView.test.tsx - 3 errors
- Storage mock return type mismatch (3 instances)

### 16. VirtualList.tsx - 2 errors
- T | undefined not assignable to T (2 instances)

### 17. use-pull-to-refresh.ts - 2 errors
- Object possibly undefined (2 instances)

### 18. UIContext.tsx - 3 errors
- Index signature type issues (3 instances)

### 19. useChatMessages.ts - 2 errors
- Function type mismatches (2 instances)

### 20. adoption-marketplace-service.test.ts - 3 errors
- Type mismatches (3 instances)

## Errors by Category

### Test Files (80+ errors)

#### Storage Mock Issues (30+ errors)
- DiscoverView.test.tsx: 22 errors
- usePetDiscovery.test.ts: 12 errors
- ProfileView.test.tsx: 3 errors

#### Read-only Property Issues (12 errors)
- useOnlineStatus.test.ts: 12 errors (onLine property)

#### Mock Function Issues (14 errors)
- useEntitlements.test.ts: 9 errors
- useAuth.test.ts: 3 errors
- logger.test.ts: 1 error
- use-typing-manager.test.tsx: 1 error

#### Type Mismatch Issues (25+ errors)
- purchase-service.test.tsx: 7 errors (APIResponse)
- useChatMessages.test.ts: 5 errors (Message types)
- useStories.test.ts: 5 errors (Story type)
- useMatches.test.ts: 2 errors (Pet type)
- adoption-marketplace-service.test.ts: 3 errors
- ReportsView.test.tsx: 2 errors (Report type)
- CommunityView.test.tsx: 2 errors (API types)

#### Component Test Issues (21 errors)
- accordion.test.tsx: 5 errors
- target-size-integration.test.tsx: 14 errors
- focus-appearance-integration.test.tsx: 2 errors

#### Test Template Issues (12 errors)
- component-test-template.tsx: 1 error
- hook-test-template.ts: 1 error
- service-test-template.ts: 4 errors
- mock-factories.ts: 2 errors
- render-helpers.tsx: 3 errors
- test-helpers.tsx: 2 errors
- storage.ts: 2 errors

### Component Errors (50+ errors)

#### Type Mismatches (15 errors)
- AdoptionMarketplaceView.tsx: 4 errors (implicit any)
- DiscoverView.tsx: 2 errors (LocalStory)
- PremiumButton.tsx: 1 error (event handler)
- PetProfileTemplatesDialog.tsx: 1 error (duplicate attributes)
- ContentModerationQueue.tsx: 1 error (string | undefined)
- EnhancedPetDetailView.tsx: 1 error (string | undefined)
- RouteErrorBoundary.tsx: 1 error (string | null | undefined)
- VirtualList.tsx: 2 errors (T | undefined)
- Slider.tsx: 1 error (module not found)

#### Animation/Effects Issues (10 errors)
- SavedSearchesManager.tsx: 2 errors (UseStaggeredItemOptions)
- VerificationDialog.tsx: 2 errors (motion.durations.li)
- useDiscoverSwipe.ts: 4 errors (missing properties)
- use-hover-animation.ts: 1 error (duration possibly undefined)
- use-pull-to-refresh.ts: 2 errors (object possibly undefined)

#### Context/State Issues (8 errors)
- UIContext.tsx: 3 errors (index signature)
- use-high-contrast.ts: 1 error (type comparison)
- useAuth.ts: 1 error (function type)
- useChatMessages.ts: 2 errors (function types)
- useDebounce.ts: 1 error (timeout type)
- useOutbox.ts: 1 error (missing return)

### API/Service Issues (30+ errors)

#### Missing Methods (10 errors)
- CommunityAPI.getPost: 1 error
- CommunityAPI.getFeed: 1 error
- CommunityAPI.adoptionAPI: 1 error
- useDiscoverSwipe.performSwipe: 1 error
- useDiscoverSwipe.checkMatch: 1 error
- useChatMessages.deleteMessage: 1 error
- useStories.clearSelectedStory: 1 error
- usePetDiscovery.reset: 1 error

#### Type Export Issues (5 errors)
- adoption-marketplace-service: 2 errors (AdoptionListing, AdoptionListingFilters)
- adaptive-animation-config: 1 error (DeviceHz)
- adoption-api: 2 errors (missing exports)

#### API Response Issues (15 errors)
- payments-api.test.ts: 2 errors (APIResponse.status)
- purchase-service.test.tsx: 7 errors (Response to APIResponse)
- use-adoption.ts: 1 error (no overload matches)
- use-chat.ts: 1 error (no overload matches)
- use-community.ts: 1 error (no overload matches)
- adoption-marketplace-service.test.ts: 3 errors (type mismatches)

### Library/Config Issues (20+ errors)

#### Environment Variables (4 errors)
- stripe-service.ts: 1 error (VITE_STRIPE_PUBLIC_KEY)
- security-config.ts: 1 error (VITE_STRIPE_PUBLIC_KEY)
- telemetry.ts: 1 error (flags doesn't exist)
- api-config.ts: 1 error (enabled property)

#### Module Not Found (7 errors)
- effects/animations: 2 errors (variants module)
- packages/motion: 3 errors (EasingFunction, expo-haptics, LayoutChangeEvent)
- packages/spec-core: 1 error (fs-extra)
- video/thumbnails.ts: 1 error (cacheDirectory)

#### Type Definition Issues (9 errors)
- focus-rings.ts: 1 error (index signature)
- notifications.ts: 2 errors (Action type, important property)
- gdpr.ts: 2 errors (type mismatches)
- advanced-performance.ts: 2 errors (private property access)
- telemetry.ts: 1 error (private property access)
- audio-engine.ts: 2 errors (number | undefined)
- logger.test.ts: 1 error (call possibly undefined)

### Package/Motion Issues (10+ errors)
- MotionScrollView.tsx: 2 errors (ScrollView doesn't exist)
- MotionView.tsx: 1 error (Ref type mismatch)
- tokens.ts: 1 error (EasingFunction import)
- haptic.ts: 1 error (expo-haptics module)
- useMagnetic.ts: 1 error (LayoutChangeEvent)
- transitions.ts: 1 error (Transition not exported)

### Data Type Issues (15+ errors)

#### Missing Properties (10 errors)
- Pet type: Missing size, photos, bio, personality, etc. (multiple files)
- Story type: Missing properties, mediaType doesn't exist (3 files)
- Comment type: Missing postId, authorName, status, updatedAt, reactionsCount (1 file)
- Match type: Missing compatibility property (1 file)
- SwipeAction type: Missing id property (1 file)
- Report type: Missing properties (2 files)
- TargetSizeValidationResult: Missing width, height properties (14 files)

#### Type Conversions (5 errors)
- DataExport.tsx: 2 errors (UserDataExport to Record)
- adoption-marketplace-service.test.ts: 3 errors (type mismatches)

## Common Error Types

### TS2322: Type X is not assignable to type Y (60+ errors)
- Most common error type
- Type mismatches in components, hooks, and tests

### TS2339: Property X does not exist on type Y (40+ errors)
- Missing properties on types
- Missing methods on classes/interfaces

### TS2345: Argument of type X is not assignable to parameter of type Y (30+ errors)
- Function argument type mismatches
- API call type mismatches

### TS2739: Type X is missing properties from type Y (20+ errors)
- Incomplete type definitions
- Missing required properties

### TS7006: Parameter X implicitly has an 'any' type (10+ errors)
- Missing type annotations
- Implicit any types

### TS2304: Cannot find name X (10+ errors)
- Undefined variables
- Missing imports

### TS2307: Cannot find module X (10+ errors)
- Missing module files
- Incorrect import paths

### TS2540: Cannot assign to X because it is a read-only property (12 errors)
- Attempting to modify read-only properties
- All in useOnlineStatus.test.ts

### TS2353: Object literal may only specify known properties (15+ errors)
- Extra properties in object literals
- Type definition mismatches

### TS18048: Property X is possibly 'undefined' (10+ errors)
- Optional property access
- Undefined checks needed

## Quick Fix Recommendations

### High Priority Fixes (40 errors)

1. **Add missing API methods** (10 errors)
   - Add getPost, getFeed to CommunityAPI
   - Add performSwipe, checkMatch to useDiscoverSwipe
   - Add deleteMessage to useChatMessages

2. **Export missing types** (5 errors)
   - Export AdoptionListing, AdoptionListingFilters
   - Export DeviceHz
   - Export adoption API types

3. **Fix environment variables** (4 errors)
   - Add VITE_STRIPE_PUBLIC_KEY to ENV schema
   - Add flags to ENV type

4. **Resolve module not found** (7 errors)
   - Create variants module or remove dependency
   - Add expo-haptics types or use alternative
   - Add fs-extra types or use alternative

5. **Add missing properties** (10 errors)
   - Add width, height to TargetSizeValidationResult
   - Update Pet type in test files
   - Update Story type

6. **Fix type definitions** (4 errors)
   - Fix EasingFunction import
   - Fix Motion package types

### Medium Priority Fixes (100 errors)

1. **Update test mocks** (45 errors)
   - Fix Spark mock types
   - Fix storage mock return types
   - Fix API mock return types

2. **Fix function signatures** (20 errors)
   - Update hook return types
   - Fix API method signatures
   - Fix event handler types

3. **Fix type conversions** (20 errors)
   - Handle string | null properly
   - Handle T | undefined properly
   - Fix Record type conversions

4. **Fix component props** (15 errors)
   - Update Accordion props
   - Update IconButton props
   - Update Dialog props

### Low Priority Fixes (74 errors)

1. **Fix test templates** (12 errors)
   - Update template imports
   - Fix mock factory types

2. **Fix type imports** (5 errors)
   - Use type-only imports
   - Fix import syntax

3. **Fix private property access** (3 errors)
   - Use public methods
   - Export needed properties

4. **Fix minor type issues** (54 errors)
   - Add type annotations
   - Fix optional properties
   - Fix read-only properties
