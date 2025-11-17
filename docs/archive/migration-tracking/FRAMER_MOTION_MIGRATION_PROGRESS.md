# Framer-Motion to Reanimated Migration Progress

## Summary

Migrating 101 files from framer-motion to React Native Reanimated for better performance, mobile parity, and unified animation system.

## Migration Infrastructure Created

### New Components & Hooks

1. **`apps/web/src/effects/reanimated/animate-presence.tsx`**
   - Web-compatible AnimatePresence replacement
   - Handles conditional rendering with exit animations
   - Uses Reanimated SharedValues and spring animations

2. **`apps/web/src/effects/reanimated/use-entry-animation.ts`**
   - Hook for entry animations (fade in, slide up, scale)
   - Configurable delay, duration, initial values
   - Returns animated style and SharedValues

3. **`apps/web/src/effects/reanimated/use-hover-animation.ts`**
   - Hook for hover/tap interactions
   - Handles mouse enter/leave, mouse down/up
   - Configurable scale and duration

## Completed Migrations ✅

### Critical Components

1. **`apps/web/src/components/chat/AdvancedChatWindow.tsx`** ✅
   - Migrated all 18+ motion.div instances
   - Created helper components:
     - `DateGroup` - Date separator animations
     - `MessageItem` - Message bubble with hover effects
     - `TypingIndicator` - Typing indicator animations
     - `TemplatePanel` - Template selector panel
     - `TemplateButton` - Template button with hover
     - `StickerButton` - Sticker picker button
     - `ReactionButton` - Reaction picker button
     - `SendButtonIcon` - Send button icon animation
   - All animations now use Reanimated
   - Zero framer-motion dependencies remaining

2. **`apps/web/src/components/chat/WebBubbleWrapper.tsx`** ✅
   - Migrated 3D tilt animations (useBubbleTilt)
   - Migrated entry animations (useBubbleEntry)
   - Migrated hover interactions (useHoverAnimation)
   - Migrated reaction badge animations (useEntryAnimation)
   - Zero framer-motion dependencies remaining

3. **`apps/web/src/components/chat/VoiceRecorder.tsx`** ✅
   - Migrated container entry animation
   - Migrated pulsing microphone icon
   - Migrated waveform bar animations
   - Zero framer-motion dependencies remaining

### Already Using Reanimated ✅

- `apps/web/src/components/chat/ReactionBurstParticles.tsx` ✅
- `apps/web/src/components/chat/ConfettiBurst.tsx` ✅
- `apps/web/src/components/chat/TypingDotsWeb.tsx` ✅
- `apps/web/src/components/chat/SmartSuggestionsPanel.tsx` ✅

## Migration Patterns

### Pattern 1: Entry Animations

```typescript
// Before (framer-motion)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  {children}
</motion.div>

// After (Reanimated)
const animation = useEntryAnimation({ initialY: 20, delay: 0 })
<AnimatedView style={animation.animatedStyle}>
  {children}
</AnimatedView>
```

### Pattern 2: Hover/Tap Interactions

```typescript
// Before (framer-motion)
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  {children}
</motion.button>

// After (Reanimated)
const hover = useHoverAnimation({ scale: 1.02 })
<AnimatedView
  style={hover.animatedStyle}
  onMouseEnter={hover.handleMouseEnter}
  onMouseLeave={hover.handleMouseLeave}
  onMouseDown={hover.handleMouseDown}
  onMouseUp={hover.handleMouseUp}
>
  {children}
</AnimatedView>
```

### Pattern 3: Conditional Rendering (AnimatePresence)

```typescript
// Before (framer-motion)
<AnimatePresence>
  {visible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>

// After (Reanimated)
<AnimatePresence>
  {visible && (
    <AnimatedView key="item">
      {children}
    </AnimatedView>
  )}
</AnimatePresence>
```

## Remaining Files (97 files)

### Priority 1: Critical User-Facing Components

- [ ] `apps/web/src/components/community/PostComposer.tsx` (767 lines)
- [ ] `apps/web/src/components/chat/WebBubbleWrapper.tsx`
- [ ] `apps/web/src/components/views/MatchesView.tsx`
- [ ] `apps/web/src/components/views/DiscoverView.tsx`
- [ ] `apps/web/src/components/views/AdoptionMarketplaceView.tsx`
- [ ] `apps/web/src/components/views/NotificationsView.tsx`

### Priority 2: Enhanced Components

- [ ] `apps/web/src/components/enhanced/EnhancedCarousel.tsx` (already partially migrated)
- [ ] `apps/web/src/components/enhanced/DetailedPetAnalytics.tsx` (no framer-motion import found)

### Priority 3: Admin Components

- [ ] `apps/web/src/components/admin/DashboardView.tsx`
- [ ] `apps/web/src/components/admin/KYCManagement.tsx`
- [ ] `apps/web/src/components/admin/ContentView.tsx`
- [ ] `apps/web/src/components/admin/AuditLogView.tsx`
- [ ] `apps/web/src/components/admin/ContentModerationQueue.tsx`

### Priority 4: Stories & Playdate Features

- [ ] `apps/web/src/components/stories/StoryViewer.tsx`
- [ ] `apps/web/src/components/stories/StoryRing.tsx`
- [ ] `apps/web/src/components/stories/StoriesBar.tsx`
- [ ] `apps/web/src/components/playdate/PlaydateScheduler.tsx`
- [ ] `apps/web/src/components/playdate/PlaydateMap.tsx`

### Priority 5: Other Components

- [ ] All remaining view components
- [ ] Form components
- [ ] UI components
- [ ] Shared components

## Mobile Parity Checklist

For each migrated component, ensure:

- [ ] Web version uses Reanimated
- [ ] Mobile version exists (`.native.tsx`)
- [ ] Mobile version uses Reanimated (not framer-motion)
- [ ] Animations match between platforms
- [ ] Performance verified (60fps)

## Next Steps

1. Continue migrating Priority 1 components
2. Ensure mobile parity for each migrated component
3. Run type checks and tests after each migration
4. Update this document as migrations complete

## Notes

- All migrations must maintain existing animation behavior
- Use helper hooks (`useEntryAnimation`, `useHoverAnimation`) for consistency
- Extract complex animations into separate components
- Test on both web and mobile after migration
