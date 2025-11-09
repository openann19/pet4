# Web Test Failures Report

Generated: $(date)

## Summary
- **Total Test Files**: 195
- **Failed Test Files**: 123
- **Passed Test Files**: 72
- **Total Tests**: 1856
- **Failed Tests**: 767
- **Passed Tests**: 1089

## Failed Test Files by Category

### 1. Config Tests (2 failures)
- `src/config/__tests__/env.test.ts`
  - ✗ should validate HTTPS in production
  - ✗ should require VITE_MAPBOX_TOKEN when maps are enabled in production

### 2. Hook Tests (Multiple failures)
- `src/hooks/use-message-bubble-animation.test.tsx`
  - ✗ should initialize with default values
  - ✗ should animate highlight when isHighlighted changes
  - ✗ should stagger animations based on index

- `src/hooks/__tests__/useMatches.test.ts`
  - All tests failing due to mock mismatch (useUserPets vs usePets)

- `src/hooks/__tests__/useApiCache.test.ts`
  - Multiple act() warnings

- `src/hooks/use-typing-manager.test.tsx`
  - act() warnings

- `src/hooks/__tests__/useEntitlements.test.ts`
  - ✗ returns 0 for missing consumables

- `src/hooks/__tests__/useOnlineStatus.test.ts`
  - ✗ updates when online event is fired
  - ✗ updates when offline event is fired
  - ✗ handles multiple online/offline events

- `src/hooks/__tests__/useDoubleTap.test.ts`
  - ✗ calls onDoubleTap for double tap
  - ✗ calls onSingleTap for single tap
  - ✗ respects custom delay
  - ✗ handles touch events
  - ✗ cleans up event listeners on unmount
  - ✗ handles rapid multiple taps

- `src/hooks/__tests__/useGestureSwipe.test.ts`
  - ✗ calls onSwipeStart when touch starts
  - ✗ calls onSwipeMove during swipe
  - ✗ calls onSwipeUp for upward swipe
  - ✗ calls onSwipeDown for downward swipe
  - ✗ calls onSwipeLeft for leftward swipe
  - ✗ calls onSwipeRight for rightward swipe
  - ✗ calls onSwipe with direction
  - ✗ calls onSwipeEnd when swipe ends
  - ✗ cleans up event listeners on unmount

- `src/hooks/__tests__/usePinchZoom.test.ts`
  - ✗ calls onPinchStart when pinch starts
  - ✗ calls onPinch with scale during pinch
  - ✗ calls onPinchEnd when pinch ends
  - ✗ cleans up event listeners on unmount

- `src/hooks/__tests__/use-smart-highlight.test.ts`
  - ✗ should trigger highlight when isHighlighted is true
  - ✗ should trigger highlight manually
  - ✗ should respect custom highlight color
  - ✗ should respect custom glow color
  - ✗ should animate highlight on prop change

- `src/hooks/__tests__/use-ai-typing-reveal.test.ts`
  - ✗ should start typing when enabled
  - ✗ should reveal text character by character
  - ✗ should complete typing
  - ✗ should call start manually

### 3. Component Tests - Auth (11 failures)
- `src/components/auth/__tests__/AgeGateModal.test.tsx` (7 failures)
  - ✗ should render when open
  - ✗ should show error when birth date is not provided
  - ✗ should show error when user is too young
  - ✗ should verify age successfully when user is 18 or older
  - ✗ should include country when provided
  - ✗ should handle verification error
  - ✗ should call onClose when close button is clicked
  - **Error**: `Cannot read properties of undefined (reading 'cancel')` - Missing `t.common.cancel` in mock

- `src/components/auth/__tests__/SignInForm.test.tsx` (4 failures)
  - ✗ should render sign in form
  - ✗ should validate email format
  - ✗ should validate password length
  - ✗ should toggle password visibility

- `src/components/auth/__tests__/SignUpForm.test.tsx` (8 failures)
  - ✗ should render sign up form
  - ✗ should show validation errors for empty fields
  - ✗ should validate name length
  - ✗ should validate email format
  - ✗ should validate password match
  - ✗ should require terms agreement
  - ✗ should toggle password visibility
  - ✗ should show age gate modal when age not verified

### 4. Component Tests - Enhanced UI (Multiple failures)
- `src/components/enhanced/__tests__/EnhancedPetDetailView.test.tsx` (26 failures)
  - ✗ should render pet information correctly
  - ✗ should render photo gallery with single photo
  - ✗ should render photo gallery with multiple photos
  - ✗ should render compatibility score when provided
  - ✗ should render match reasons when provided
  - ✗ should render trust level badge when trust score is provided
  - ✗ should render all tabs correctly
  - ✗ should display About tab content
  - ✗ should display Personality tab content
  - ✗ should display Stats tab content
  - ✗ should navigate to next photo when right button is clicked
  - ✗ should navigate to previous photo when left button is clicked
  - ✗ should navigate to specific photo when dot is clicked
  - ✗ should call onClose when close button is clicked
  - ✗ should call onClose when backdrop is clicked
  - ✗ should call onLike when like button is clicked
  - ✗ should call onPass when pass button is clicked
  - ✗ should call onChat when chat button is clicked
  - ✗ should not render action buttons when showActions is false
  - ✗ should handle pet with no photos
  - ✗ should handle pet with no personality traits
  - ✗ should handle pet with no interests
  - ✗ should handle pet with no trust score
  - ✗ should handle optional callbacks gracefully
  - ✗ should have proper ARIA labels
  - ✗ should be keyboard navigable
  - **Error**: Missing MotionView export from @petspark/motion mock

- `src/components/enhanced/__tests__/FloatingActionButton.test.tsx` (15 failures)
  - ✗ renders children
  - ✗ applies default variant styles
  - ✗ applies glass variant styles
  - ✗ applies elevated variant styles
  - ✗ applies gradient variant styles
  - ✗ enables hover by default
  - ✗ disables hover when hover prop is false
  - ✗ applies glow animation when glow prop is true
  - ✗ does not apply glow animation when glow prop is false
  - ✗ applies custom className
  - ✗ applies custom style
  - ✗ passes through additional props
  - ✗ applies hover cursor when hover is enabled
  - ✗ does not apply hover cursor when hover is disabled
  - **Error**: Missing MotionView export from @petspark/motion mock

- `src/components/enhanced/__tests__/SmartToast.test.tsx` (3 failures)
  - ✗ should clear message after delay
  - ✗ should clear announcement after 5 seconds

### 5. Component Tests - Chat (Multiple failures)
- `src/components/chat/__tests__/MessageReactions.test.tsx` (4 failures)
  - ✗ shows add reaction button
  - ✗ opens reaction picker when add button is clicked
  - ✗ calls onReact when emoji is selected from picker
  - ✗ closes picker after selecting emoji
  - ✗ handles empty reactions array
  - ✗ handles reactions with empty emoji

- `src/components/chat/TypingDotsWeb.test.tsx` (3 failures)
  - ✗ applies custom dot size
  - ✗ applies custom dot color
  - ✗ uses default values when props are not provided

- `src/components/chat/window/__tests__/overlays.test.tsx` (4 failures)
  - ✗ renders ReactionBurstParticles when burstSeed > 0
  - ✗ renders ConfettiBurst when confettiSeed > 0
  - ✗ renders both overlays when both seeds > 0
  - ✗ uses correct key for restart when seed changes
  - **Error**: Unable to find elements with data-testid="reaction-burst" and "confetti-burst"

- `src/components/chat/StickerMessage.test.tsx` (Multiple failures)
  - ✗ should trigger explosion with particles
  - ✗ should use custom colors for explosion
  - ✗ should use explosion-specific colors when provided
  - ✗ should respect custom particle count
  - ✗ should clear particles
  - ✗ should provide particle style function
  - ✗ should auto-cleanup particles after lifetime
  - ✗ should handle multiple explosions

- `src/hooks/use-delete-bubble-animation.test.tsx` (9 failures)
  - ✗ should trigger self-delete animation
  - ✗ should trigger admin-delete animation
  - ✗ should trigger emoji-media delete animation
  - ✗ should trigger group-chat delete animation
  - ✗ should call onFinish callback after animation
  - ✗ should reset animation
  - ✗ should respect custom duration
  - ✗ should work without haptic feedback
  - ✗ should handle all animation contexts

### 6. Component Tests - Community (Multiple failures)
- `src/components/community/__tests__/PostCard.test.tsx` (Multiple failures)
  - ✗ displays favorite button when onFavorite is provided
  - ✗ calls onFavorite when favorite button is clicked
  - ✗ displays filled heart icon when favorited
  - ✗ displays shelter name
  - ✗ displays pet details correctly
  - ✗ prevents event propagation when favorite button is clicked

- `src/components/community/__tests__/PostComposer.test.tsx` (7 failures)
  - ✗ should render when open
  - ✗ should not render when closed
  - ✗ should allow typing text
  - ✗ should show character count
  - ✗ should submit post with text
  - ✗ should disable submit when text is empty
  - ✗ should close dialog on close

- `src/components/community/__tests__/PostDetailView.test.tsx` (3 failures)
  - ✗ should render when open
  - ✗ should load post data
  - ✗ should display post content
  - ✗ should render comment input

- `src/components/community/__tests__/CommentsSheet.test.tsx` (3 failures)
  - ✗ should render when open
  - ✗ should submit comment
  - ✗ should handle reply to comment
  - ✗ should show empty state when no comments

- `src/components/community/__tests__/RankingSkeleton.test.tsx` (5 failures)
  - ✗ should render post skeleton by default
  - ✗ should render specified count of skeletons
  - ✗ should render comment variant
  - ✗ should render user variant
  - ✗ should have accessible loading text

- `src/components/views/__tests__/CommunityView.test.tsx` (9 failures)
  - ✗ should render community view with header
  - ✗ should render feed and adoption tabs
  - ✗ should render create post button when feed tab is active
  - ✗ should switch between feed and adoption tabs
  - ✗ should load feed on mount
  - ✗ should load adoption profiles when adoption tab is selected
  - ✗ should show empty state when no posts
  - ✗ should show empty state when no adoption profiles
  - ✗ should have proper structure for screen readers
  - **Error**: No "RankingSkeleton" export is defined on the mock

### 7. Component Tests - Adoption (Multiple failures)
- `src/components/adoption/__tests__/AdoptionCard.test.tsx` (Multiple failures)
  - ✗ displays pet breed
  - ✗ navigates to next photo
  - ✗ navigates to previous photo

- `src/components/adoption/__tests__/AdoptionDetailDialog.test.tsx` (3 failures)
  - ✗ displays pet breed
  - ✗ navigates to next photo
  - ✗ navigates to previous photo

- `src/components/adoption/__tests__/AdoptionFiltersSheet.test.tsx` (6 failures)
  - ✗ toggles species filter
  - ✗ toggles size filter
  - ✗ toggles energy level filter
  - ✗ toggles status filter
  - ✗ handles age range slider
  - ✗ handles adoption fee range slider

- `src/components/adoption/__tests__/AdoptionApplicationDialog.test.tsx` (4 failures)
  - ✗ should render when open
  - ✗ should validate required fields
  - ✗ should submit application with valid data
  - ✗ should handle submission error
  - ✗ should reset form when dialog closes

### 8. Component Tests - Admin (Multiple failures)
- `src/components/admin/__tests__/ModerationQueue.test.tsx` (2 failures)
  - ✗ should handle report resolution
  - ✗ should handle report dismissal
  - **Error**: Unhandled rejection - API Error

- `src/components/admin/__tests__/PerformanceMonitoring.test.tsx` (12 failures)
  - ✗ renders performance monitoring
  - ✗ displays performance metrics
  - ✗ updates metrics at interval
  - ✗ displays WebSocket status
  - ✗ subscribes to WebSocket connection events
  - ✗ displays system metrics
  - ✗ displays memory usage
  - ✗ switches between tabs
  - ✗ handles missing metrics gracefully
  - ✗ cleans up interval on unmount
  - ✗ unsubscribes from WebSocket events on unmount
  - ✗ displays status indicators

- `src/components/admin/__tests__/ReportsView.test.tsx` (Multiple failures)
  - ✗ should display "N/A" for missing trust profile data
  - ✗ should handle missing trust profile gracefully
  - ✗ should have proper semantic structure

### 9. Component Tests - UI Components (Multiple failures)
- `src/components/ui/__tests__/select.test.tsx` (1 failure)
  - ✗ should render select
  - **Error**: `SelectScrollUpButton` must be used within `SelectContent`

- `src/components/ui/__tests__/input.test.tsx` (Multiple failures)
  - ✗ should have correct accessibility attributes
  - ✗ should call onDrop when valid file is dropped

### 10. Component Tests - Views (Multiple failures)
- `src/components/views/__tests__/ProfileView.test.tsx` (2 failures)
  - ✗ should render empty state when no pets
  - ✗ should open create pet dialog when button is clicked
  - **Error**: Found multiple elements with the text "Create Profile"

### 11. Component Tests - Notifications (18 failures)
- `src/components/notifications/__tests__/PremiumNotificationBell.test.tsx` (18 failures)
  - ✗ should display unread count in aria-label
  - ✗ should display urgent count in aria-label
  - ✗ should open notification center on click
  - ✗ should close notification center
  - ✗ should show badge when there are unread notifications
  - ✗ should show 99+ for counts over 99
  - ✗ should show urgent badge variant for urgent notifications
  - ✗ should show default badge variant for non-urgent notifications
  - ✗ should not show badge when all notifications are read
  - ✗ should not show badge when all notifications are archived
  - ✗ should have proper accessibility attributes
  - ✗ should update aria-expanded when opened
  - ✗ should handle empty notifications array
  - ✗ should handle null notifications
  - ✗ should trigger haptic feedback on click
  - ✗ should show bell icon when no new notifications
  - ✗ should count critical priority as urgent
  - ✗ should handle multiple clicks
  - **Error**: `mockUseStorage.mockImplementation is not a function`

### 12. Component Tests - Stories (1 failure)
- `src/components/stories/__tests__/StoryFilterSelector.test.tsx` (1 failure)
  - ✗ should render gradient placeholder when media preview is not provided
  - **Error**: Unable to find an accessible element with the role "button" and name `/Select filter:/`

### 13. API Tests (Multiple failures)
- `src/api/__tests__/adoption-api.test.ts` (20 failures)
  - ✗ should return adoption profiles
  - ✗ should apply filters
  - ✗ should throw on error
  - ✗ should return profile by id
  - ✗ should return null for non-existent profile
  - ✗ should throw on network error
  - ✗ should submit application successfully
  - ✗ should throw on error
  - ✗ should return user applications
  - ✗ should return empty array on error
  - ✗ should return all applications
  - ✗ should return empty array on error
  - ✗ should return applications by profile
  - ✗ should return empty array on error
  - ✗ should create adoption profile
  - ✗ should throw on error
  - ✗ should throw on error
  - ✗ should return shelters
  - ✗ should return empty array on error

- `src/api/__tests__/streaming-api.test.ts` (9 failures)
  - ✗ should verify valid token
  - ✗ should verify invalid token
  - ✗ should throw on error
  - ✗ should start recording with hls type
  - ✗ should start recording with webm type
  - ✗ should default to hls type
  - ✗ should throw on error
  - ✗ should get recording status
  - ✗ should throw on error

### 14. Core Services Tests (16 failures)
- `src/core/services/__tests__/admin-integration.test.ts` (16 failures)
  - ✗ should initialize successfully
  - ✗ should broadcast admin actions
  - ✗ should broadcast config updates
  - ✗ should broadcast moderation decisions
  - ✗ should broadcast user updates
  - ✗ should broadcast ticket updates
  - ✗ should handle multiple listeners
  - ✗ should unsubscribe listeners correctly
  - ✗ should broadcast config updates
  - ✗ should track config versions
  - ✗ should handle different config types
  - ✗ should sync admin actions between web and mobile
  - ✗ should sync config updates across platforms
  - ✗ should handle uninitialized service gracefully
  - ✗ should handle listener errors gracefully
  - **Error**: No "RealtimeClient" export is defined on the "@/lib/realtime" mock

### 15. Effects Tests (6 failures)
- `src/effects/micro-interactions/core.test.ts` (6 failures)
  - ✗ should animate element with success animation
  - ✗ should animate element with error animation
  - ✗ should create particles in container
  - ✗ should accept custom options
  - ✗ should create shimmer effect
  - ✗ should create glow animation

### 16. Component Tests - Health (1 failure)
- `src/components/health/__tests__/PetHealthDashboard.test.tsx` (1 failure)
  - ✗ should call handleAddHealthRecord when Add Record button is clicked

### 17. Component Tests - Lost Found (Multiple failures)
- `src/components/lost-found/__tests__/MapLocationPicker.test.tsx` (Multiple failures)
  - Various location picker related failures

- `src/components/lost-found/__tests__/CreateLostAlertDialog.test.tsx` (Multiple failures)
  - Various form interaction failures

### 18. Component Tests - Call (1 failure)
- `src/components/call/__tests__/GroupCallInterface.test.tsx` (1 failure)
  - ✗ should display caller avatar when provided

### 19. Component Tests - Community Reports (Multiple failures)
- `src/components/community/__tests__/ReportDialog.test.tsx` (Multiple failures)
  - ✗ should render when open
  - ✗ should require appeal text
  - ✗ should require minimum 50 characters
  - ✗ should submit appeal successfully
  - ✗ should include reportId when provided

## Common Issues

### 1. Mock Mismatches
- **useMatches.test.ts**: Mocks `useUserPets` but implementation uses `usePets`
- **AgeGateModal.test.tsx**: Missing `t.common.cancel` in translation mock
- **@petspark/motion**: Missing `MotionView` and `Animated` exports in mock
- **@/lib/realtime**: Missing `RealtimeClient` export in mock
- **RankingSkeleton**: Missing export in mock

### 2. Translation/Object Access Issues
- `t.common.cancel` is undefined in AgeGateModal
- Various translation keys missing in mocks

### 3. Test Setup Issues
- Missing act() wrappers causing warnings
- Missing mock implementations for storage hooks
- Missing exports in module mocks

### 4. Component Rendering Issues
- Multiple elements with same text (ProfileView)
- Missing test IDs in rendered components
- Context provider issues (Select component)

### 5. Async/Timing Issues
- Timeout issues with 5-second delays
- Missing waitFor() in async tests
- Unhandled promise rejections

### 6. DOM/Event Issues
- Missing pointer capture polyfill for jsdom
- Touch event handling issues
- Missing event listeners cleanup

## Priority Fixes

### High Priority
1. Fix useMatches.test.ts mock mismatch
2. Fix AgeGateModal translation mock (add t.common)
3. Fix @petspark/motion mock (add MotionView, Animated exports)
4. Fix @/lib/realtime mock (add RealtimeClient export)
5. Fix RankingSkeleton mock export

### Medium Priority
1. Fix act() warnings in hooks tests
2. Fix ProfileView duplicate text issue
3. Fix Select component context issue
4. Fix PremiumNotificationBell storage mock
5. Fix async timing issues

### Low Priority
1. Fix remaining component rendering issues
2. Fix API test mocks
3. Fix effects test issues
4. Fix remaining translation issues

## Next Steps

1. Fix high-priority mock mismatches
2. Update test setup to include missing mocks
3. Fix translation mocks to include all required keys
4. Add missing exports to module mocks
5. Fix async test timing issues
6. Add proper act() wrappers where needed
7. Fix component context/provider issues
