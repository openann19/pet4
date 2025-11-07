# Framer Motion Usage Patterns Analysis

**Generated:** 2024-12-19  
**Purpose:** Detailed analysis of Framer Motion usage patterns to guide migration strategy

---

## Usage Pattern Categories

### Pattern 1: Simple MotionView (Low Complexity)
**Migration Effort:** Low  
**Pattern:** Basic `MotionView` with simple props

**Examples:**
- `apps/web/src/components/admin/DashboardView.tsx`
- `apps/web/src/components/admin/PerformanceMonitoring.tsx`
- `apps/web/src/components/admin/ChatModerationPanel.tsx`

**Migration Strategy:**
```typescript
// Before
<MotionView animate={{ opacity: 1 }}>

// After
<AnimatedView style={animatedStyle}>
```

---

### Pattern 2: Presence with Layout (Medium Complexity)
**Migration Effort:** Medium  
**Pattern:** `Presence` component with `mode="popLayout"` and nested `MotionView`

**Examples:**
- `apps/web/src/components/admin/AuditLogView.tsx`
- `apps/web/src/components/admin/ContentModerationQueue.tsx`
- `apps/web/src/components/admin/ContentView.tsx`
- `apps/web/src/components/admin/KYCManagement.tsx`
- `apps/web/src/components/admin/ModerationQueue.tsx`

**Migration Strategy:**
```typescript
// Before
<Presence mode="popLayout">
  <MotionView>
    {/* content */}
  </MotionView>
</Presence>

// After
<AnimatePresence mode="popLayout">
  <AnimatedView>
    {/* content */}
  </AnimatedView>
</AnimatePresence>
```

---

### Pattern 3: Motion Variants (High Complexity)
**Migration Effort:** High  
**Pattern:** Complex animation variants with multiple states

**Examples:**
- `apps/web/src/components/MatchCelebration.tsx`
- `apps/web/src/components/CreatePetDialog.tsx`
- `apps/web/src/components/views/MatchesView.tsx`

**Migration Strategy:**
```typescript
// Before
const variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
}
<MotionView variants={variants} initial="hidden" animate="visible">

// After
const opacity = useSharedValue(0)
const scale = useSharedValue(0.8)
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }]
}))
useEffect(() => {
  opacity.value = withSpring(1)
  scale.value = withSpring(1)
}, [])
<AnimatedView style={animatedStyle}>
```

---

### Pattern 4: Gesture-Based Animations (Very High Complexity)
**Migration Effort:** Very High  
**Pattern:** Animations tied to gestures (drag, swipe, etc.)

**Examples:**
- `apps/web/src/components/enhanced/EnhancedCarousel.tsx`
- `apps/web/src/components/stories/StoriesBar.tsx`
- `apps/web/src/components/playdate/PlaydateScheduler.tsx`

**Migration Strategy:**
Requires React Native Gesture Handler + Reanimated integration

---

### Pattern 5: Particle Effects (Very High Complexity)
**Migration Effort:** Very High  
**Pattern:** Complex particle systems and visual effects

**Examples:**
- `apps/web/src/effects/visual/particle-effect.tsx`
- `apps/web/src/components/MatchCelebration.tsx` (confetti)

**Migration Strategy:**
May require Skia or custom GPU-accelerated solutions

---

## Component-Specific Analysis

### High-Priority Components (P0)

#### Auth Components
- **SignInForm.tsx** - Form animations, validation feedback
- **SignUpForm.tsx** - Multi-step form animations
- **AgeGateModal.tsx** - Modal entrance/exit animations
- **OAuthButtons.tsx** - Button hover/press animations

**Complexity:** Medium  
**Estimated Time:** 2-3 hours per file

#### Core Views
- **MatchesView.tsx** - List animations, card transitions
- **AdoptionMarketplaceView.tsx** - Grid layout animations
- **MapView.tsx** - Map overlay animations
- **LostFoundView.tsx** - Filter animations, list transitions

**Complexity:** High  
**Estimated Time:** 4-6 hours per file

#### Critical Dialogs
- **CreatePetDialog.tsx** - Multi-step wizard animations
- **PetDetailDialog.tsx** - Image carousel, detail reveal
- **MatchCelebration.tsx** - Celebration animations, confetti

**Complexity:** Very High  
**Estimated Time:** 6-8 hours per file

---

### Medium-Priority Components (P1)

#### Enhanced Components
- **EnhancedCarousel.tsx** - Swipe gestures, pagination animations
- **EnhancedPetDetailView.tsx** - Scroll-based animations, parallax
- **SmartSearch.tsx** - Search results animations
- **NotificationCenter.tsx** - Notification stack animations

**Complexity:** High  
**Estimated Time:** 4-6 hours per file

#### Stories Components
- **StoriesBar.tsx** - Horizontal scroll, story ring animations
- **StoryRing.tsx** - Progress ring, tap animations
- **CreateStoryDialog.tsx** - Media picker, filter animations
- **HighlightViewer.tsx** - Full-screen viewer, swipe gestures

**Complexity:** Very High  
**Estimated Time:** 6-8 hours per file

#### Adoption Components
- **CreateAdoptionListingWizard.tsx** - Multi-step form
- **AdoptionListingCard.tsx** - Card hover/lift animations
- **AdoptionDetailDialog.tsx** - Image gallery, detail animations

**Complexity:** Medium-High  
**Estimated Time:** 3-5 hours per file

---

### Low-Priority Components (P2-P3)

#### Admin Components
Most admin components use simple `MotionView` patterns.

**Complexity:** Low  
**Estimated Time:** 1-2 hours per file

#### Utility Components
- **LoadingState.tsx** - Spinner animations
- **StatsCard.tsx** - Number counting animations
- **ThemePresetSelector.tsx** - Selection animations

**Complexity:** Low-Medium  
**Estimated Time:** 1-3 hours per file

---

## Migration Complexity Matrix

| Component Type | Files | Avg Complexity | Avg Hours | Total Hours |
|----------------|-------|----------------|-----------|-------------|
| P0 - Critical | 20 | High | 4-6 | 80-120 |
| P1 - High | 45 | Medium-High | 3-5 | 135-225 |
| P2 - Medium | 20 | Low-Medium | 2-3 | 40-60 |
| P3 - Low | 15 | Low | 1-2 | 15-30 |
| **Total** | **100** | - | - | **270-435** |

**Estimated Timeline:** 6-8 weeks with 1 developer, 3-4 weeks with 2 developers

---

## Common Migration Patterns

### Pattern A: Simple Fade In/Out
```typescript
// Before
<MotionView
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>

// After
const opacity = useSharedValue(0)
useEffect(() => {
  opacity.value = withTiming(1, { duration: 300 })
  return () => {
    opacity.value = withTiming(0, { duration: 300 })
  }
}, [])
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value
}))
<AnimatedView style={animatedStyle}>
```

### Pattern B: Scale Animation
```typescript
// Before
<MotionView
  animate={{ scale: isActive ? 1.1 : 1 }}
  transition={{ type: "spring", stiffness: 300 }}
>

// After
const scale = useSharedValue(1)
useEffect(() => {
  scale.value = withSpring(isActive ? 1.1 : 1, {
    damping: 15,
    stiffness: 300
  })
}, [isActive])
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}))
<AnimatedView style={animatedStyle}>
```

### Pattern C: Slide Animations
```typescript
// Before
<MotionView
  initial={{ x: -100 }}
  animate={{ x: 0 }}
  exit={{ x: 100 }}
>

// After
const translateX = useSharedValue(-100)
useEffect(() => {
  translateX.value = withSpring(0)
  return () => {
    translateX.value = withTiming(100, { duration: 300 })
  }
}, [])
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }]
}))
<AnimatedView style={animatedStyle}>
```

### Pattern D: Stagger Children
```typescript
// Before
<MotionView
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item, i) => (
    <MotionView
      key={item.id}
      variants={itemVariants}
      custom={i}
    >
      {item.content}
    </MotionView>
  ))}
</MotionView>

// After
const delays = items.map((_, i) => i * 50)
items.forEach((item, i) => {
  const opacity = useSharedValue(0)
  useEffect(() => {
    setTimeout(() => {
      opacity.value = withSpring(1)
    }, delays[i])
  }, [])
  // ... render with animated style
})
```

---

## Risk Assessment

### High Risk Components
1. **MatchCelebration.tsx** - Complex particle effects
2. **EnhancedCarousel.tsx** - Gesture-based animations
3. **StoriesBar.tsx** - Complex scroll animations
4. **particle-effect.tsx** - GPU-accelerated effects

**Mitigation:** Test thoroughly, consider Skia for complex effects

### Medium Risk Components
1. Multi-step wizards (CreatePetDialog, CreateAdoptionListingWizard)
2. Image carousels (PetDetailDialog, AdoptionDetailDialog)
3. List animations (MatchesView, AdoptionMarketplaceView)

**Mitigation:** Use Layout Animations for list changes

### Low Risk Components
1. Simple modals and dialogs
2. Button animations
3. Loading states

**Mitigation:** Straightforward migration, low risk

---

## Testing Strategy

### Unit Tests
- Test animation values and timing
- Test Reduced Motion mode
- Test animation cleanup

### Integration Tests
- Test component interactions
- Test animation sequences
- Test performance (60fps target)

### Visual Regression Tests
- Screenshot comparisons
- Animation frame captures
- Reduced Motion comparisons

---

## Performance Considerations

### Optimization Targets
- **Frame Rate:** Maintain 60fps
- **Bundle Size:** Minimize Reanimated imports
- **Memory:** Clean up animations on unmount
- **CPU:** Use worklets for heavy animations

### Monitoring
- Track frame drops during animations
- Monitor bundle size impact
- Measure animation performance

---

## Next Steps

1. **Phase 1:** Migrate P0 components (20 files, 2 weeks)
2. **Phase 2:** Migrate P1 components (45 files, 4 weeks)
3. **Phase 3:** Migrate P2-P3 components (35 files, 2 weeks)
4. **Cleanup:** Remove Framer Motion dependencies
5. **Documentation:** Update migration guide

---

## Related Documents

- `FRAMER_MOTION_MIGRATION_TRACKING.md` - Main tracking document
- `MIGRATION_PROGRESS_REPORT.md` - Auto-generated progress report
- `packages/motion/README.md` - Motion package docs
- `apps/web/src/effects/reanimated/README.md` - Reanimated effects docs

