# PETSPARK Web Motion & Visual Upgrade Plan

Target: **iMessage / Telegram X–level polish** for all web animations, micro-interactions, and visual feedback.

This document describes:

- **Audit** of the current motion/visual system
- **Design principles & motion language** we will standardize on
- **Concrete, ordered implementation steps** to reach top-tier UX
- **Per-surface and per-pattern requirements** (chat, stories, maps, adoption, modals, buttons, etc.)
- **QA, performance, and accessibility gates** we must pass

Use this as the authoritative checklist for the upgrade.

---

## 1. System Audit (Current State)

### 1.1 Motion Stack

- **Core primitives**: `@petspark/motion` (Framer-style MotionView + MotionValue), `useSharedValue`, `useAnimatedStyle`, `animate`, `withSpring`, `withTiming`, `withSequence`, `withDelay`, `withRepeat`, `interpolate`.
- **Bridging layer**: `apps/web/src/effects/reanimated/animated-view.tsx`
  - `AnimatedView` + `AnimatedStyle` wrapper that converts motion-style objects/functions → `CSSProperties` via `convertReanimatedStyleToCSS`.
- **Effects library**: `apps/web/src/effects/reanimated/*`
  - Hooks for button press (`useBounceOnTap`), hover (`useHoverLift`, `useMagneticHover`), reveal (`useUltraCardReveal`), breathing (`useBreathingAnimation`), ripple, confetti, staggered lists, expand/collapse, modals, presence, etc.
- **Usage hotspots**:
  - Chat window: `components/chat/window/*`, `AdvancedChatWindow.tsx`, `MessageBubble`, reactions, stickers, typing indicators.
  - Stories: `components/stories/StoryViewer.tsx`.
  - Adoption & pet detail: `AdoptionDetailDialog`, `EnhancedPetDetailView`, `PetHealthDashboard`, `DetailedPetAnalytics`.
  - System chrome: `WelcomeScreen`, `SavedSearchesManager`, `NotificationCenter`, `DismissibleOverlay`, `UltraThemeSettings`, `UltraCard`.

### 1.2 Gaps vs. iMessage / Telegram X

- **Consistency**
  - Multiple motion idioms (direct MotionView with `MotionStyle`, AnimatedView with `AnimatedStyle`, raw CSS transforms). No single motion language.
  - Some hooks return partial style objects (e.g. `{ scale }`) instead of full `MotionStyle` / `AnimatedStyle` suitable for composition.

- **Micro-interactions coverage**
  - Buttons & icons: have press/hover effects, but **not layered** (ripple + bounce + glow + haptic + sound) in a coordinated way.
  - Chat:
    - Typing indicator, send, delivery/read, reactions, replies, voice notes, attachment upload are not consistently animated as **one narrative**.
    - Long-press / context menus and drag/reorder animations are minimal or missing.
  - Stories: transitions and gestures exist, but **no rich physics** (elastic swipes, partial-peek previews, continuous progress scrubbing).

- **State storytelling**
  - Message lifecycle (sending → sent → delivered → read) is not visually narrated like iMessage’s bubble/marker choreography.
  - Online/typing status, ephemeral effects (confetti, achievements, streaks) exist in isolation, not as part of a coherent "status layer".

- **Performance & accessibility**
  - Reduced-motion support exists in some places but is not **centrally enforced**.
  - Some transitions may add jank on low-end devices due to unbounded animations or too many simultaneous effects.

---

## 2. Motion Language & Design Principles

We adopt a **unified motion language** for web, applicable across all surfaces.

### 2.1 Core Principles

1. **Purposeful**
   - Every animation must answer: _what state change is being communicated?_
   - No gratuitous motion; delight should reinforce clarity.

2. **Layered but subtle**
   - Base layer: layout/position, opacity transitions
   - Interaction layer: hover, press, drag
   - Feedback layer: haptic-like visuals (glow, ripple, particles)
   - Status layer: badges, ticks, badges evolving over time

3. **Continuous, not discrete**
   - Prefer continuous transforms to abrupt jumps when state allows (e.g. filter chips re-flow smoothly, message list scrolls with inertial physics).

4. **Respect user & context**
   - Honor `prefers-reduced-motion` and app-level motion settings.
   - Heavy effects degrade gracefully to lightweight fades/scales.

5. **Deterministic**
   - Same input → same motion path; seeded RNG for confetti/particles.
   - No random timing offsets that break replayability or tests.

### 2.2 Canonical Motion Patterns

Define and standardize these as reusable hooks / variants (some already exist, but we formalize them):

- **Press & Release**
  - `usePressBounce`: downscale + slight y-translation + spring rebound.
- **Hover Lift**
  - `useHoverLift`: small scale up + y-raise + soft shadow.
- **Magnetic Hover**
  - `useMagneticHover`: card/button tracks cursor in short radius.
- **Ripple**
  - `useRippleEffect`: radial expansion centered at pointer.
- **Glow/Focus**
  - `useGlowBorder`, `useBreathingAnimation`: pulsing halo for primary CTA, selected items.
- **Staggered Lists**
  - `useStaggeredItem`: y+opacity rise with constant per-index delay.
- **Presence & Modals**
  - `useAnimatePresence`, `useModalAnimation`: fade + scale + slight y-shift.
- **3D / Parallax**
  - `useUltraCardReveal`, `useParallaxTilt`, `use3DFlipCard` for hero surfaces.
- **Celebrations**
  - `useConfettiBurst`, `ParticleEffect`: seeded bursts for achievements, successful actions.

All hooks must:

- Return a **named, typed surface**:
  ```ts
  interface MotionHookReturn {
    animatedStyle: MotionStyle | AnimatedStyle;
    // optional handlers: handlePress, handleEnter, handleLeave, etc.
  }
  ```
- Be composable: spread-friendly and safe to merge (`{ ...cardReveal.animatedStyle, ...breathing.animatedStyle }`).

---

## 3. Global Architecture Upgrades (Foundations First)

### 3.1 Normalize the Motion API

**Goal:** Every component sees the same shape from motion hooks.

**Steps:**

1. **Define canonical types** in `effects/reanimated/types.ts` (new file):
   - `InteractionMotion`, `PresenceMotion`, `CelebrationMotion`, etc., each with `animatedStyle` and typed handlers.
2. **Update all hooks** in `effects/reanimated` to:
   - Return `animatedStyle` only, plus handlers/state where needed.
   - Avoid leaking `MotionValue` fields directly to components unless necessary.
3. **Differentiate two consumption modes:**
   - `MotionView` expects **`MotionStyle`**.
   - `AnimatedView` expects **`AnimatedStyle` / style functions**.
   - Document in the types file which hook is for which.

### 3.2 Introduce a Motion Theme

Add a small motion theme object in `config`:

- **Durations**: `instant`, `fast`, `normal`, `slow` (e.g. 80/160/240/360ms)
- **Easing**: `snappy`, `smooth`, `gentle` (cubic/ease curves)
- **Spring presets**: `bouncy`, `responsive`, `settled` (maps to `stiffness`/`damping`)
- **Scale & distance tokens**: `hoverScale`, `pressScale`, `liftY`, `modalOffsetY`

Expose as `motionTheme` and use **only these** in hooks and components.

### 3.3 Central Reduced-Motion Control

- Create `useMotionPreferences` that combines:
  - `window.matchMedia('(prefers-reduced-motion: reduce)')`
  - App-level setting (e.g. `uiConfig.motion = 'full' | 'reduced' | 'off'`).
- All motion hooks accept an optional `respectPreferences?: boolean` (default `true`) and internally clamp duration/offsets or switch to simple opacity/scale.
- Add tests for each hook in `effects/reanimated/__tests__` that assert behavior changes under reduced motion.

---

## 4. Chat Experience: iMessage / Telegram X Level

### 4.1 Message Lifecycle & Bubble Motion

**Goals:**
- Sending a message feels **kinetic and intentional**.
- Delivery/read status is visually narrated.

**Steps:**

1. **Sending**
   - On send (press send button):
     - Button: quick press bounce + glow.
     - Bubble: spawn at input, slide up into list with slight overshoot, opacity from 0 → 1.
     - Input area: subtle compress & rebound.
2. **Sending state**
   - While the server is ack’ing:
     - Show a **subtle shimmer** or pulsing dot in the corner of the bubble.
3. **Delivered / Read**
   - When status flips:
     - Ticks / status icons animate in with scale+fade (e.g. from 0.8 scale & 0 opacity to 1,1).
     - Optional color change for double-ticks to indicate read.
4. **Edits & deletes**
   - Edit: bubble morph with `useMorphShape` and soft glow.
   - Delete: collapse bubble vertically, fade out content, shift nearby bubbles smoothly.

### 4.2 Typing Indicators

- Use `useBreathingAnimation` / dedicated `useTypingDots`:
  - Three dots rising and falling in sequence.
  - Horizontal slide-in/out from avatar when typing starts/stops.
  - Respect reduced motion by switching to static indicator.

### 4.3 Reactions & Long-Press Menus

- When long-pressing a bubble:
  - Bubble scales up slightly, background blur appears behind reaction bar.
  - Reaction icons (e.g. ❤️, 👍, 😂) use:
    - `useStaggeredItem` for entry.
    - `useElasticScale` for hover.
- When adding a reaction:
  - Burst of `useConfettiBurst` mini particles around bubble.
  - Reaction icon on the bubble animates from 0 scale → 1 with bounce.

### 4.4 Voice Messages & Attachments

- Voice waveform:
  - Smooth continuous animation reacting to real amplitude.
  - Play/pause button: rotate to play, shrink to pause with subtle glow.
- Attachment upload:
  - Thumbnail grows from small placeholder to full-size preview.
  - Progress indicated by border/overlay sweep.

### 4.5 Chat Window Chrome

- **Header & toolbars**:
  - Use `useHeaderAnimation` and `useNavBarAnimation` for scroll-linked transforms.
  - On scroll, title/avatar smoothly scale and reposition.
- **FABs (new message, scroll-to-bottom)**:
  - Use `FloatingActionButton`-style motion with `useElasticScale` and shimmer.

Implementation order for chat:

1. Standardize chat motion hooks (bubbles, typing, reactions) under `effects/chat/*` using the global motion theme.
2. Wire `AdvancedChatWindow.tsx`, `ChatInputBar`, and `MessageBubble` to those hooks.
3. Add unit tests for each micro-interaction (mount/unmount, state toggles, presence flags).

---

## 5. Other Surfaces & Micro-Interactions

### 5.1 Stories (StoryViewer)

- Swipe between stories: elastic horizontal translation, partial previews of neighboring story.
- Story progress bar: fluid progress with pause/resume animation, tapping left/right rewinds/advances with a short snapping animation.
- Reactions on stories: similar to chat, but anchored to bottom bar.

### 5.2 Adoption & Pet Detail

- **EnhancedPetDetailView**:
  - Photo carousel: parallax between foreground image and background gradient.
  - Info sections: staggered entries when the modal opens.
  - Action buttons (like/pass/chat): strong button motion + localized confetti for “like”.

- **DetailedPetAnalytics / PetHealthDashboard**:
  - Cards animate in with `AnimatedCard` pattern.
  - Stats bars slide-in from 0 width, numbers count up synchronized with bar length.

### 5.3 Maps & Discovery

- **InteractiveMap**:
  - Smooth zoom/pan transitions, marker drop/bounce.
  - On selecting a marker, card slides up from bottom with `useModalAnimation`.

- **SavedSearchesManager**:
  - Each saved search list item uses `useStaggeredItem` + `useHoverLift`.
  - Pin / delete / edit buttons bounce/tap using `useBounceOnTap`.

### 5.4 System Chrome (Modals, Overlays, Navigation)

- All dialogs and overlays use the same presence animation (`useAnimatePresence` + `useModalAnimation`).
- Navigation transitions (view → view) fade+slide with directionality (forward/back).

---

## 6. Implementation Steps (Ordered Checklist)

### Phase 1 – Foundations

1. **Types & contracts**
   - Add `motionTheme` and canonical motion types.
   - Refactor all hooks in `effects/reanimated` to return `animatedStyle` + handlers.
   - Remove direct MotionValue leaks from public contracts unless necessary.

2. **Central preferences**
   - Implement `useMotionPreferences`.
   - Update all hooks to respect reduced motion.

3. **TS & ESLint clean pass for effects layer**
   - Ensure zero TS errors in `effects/reanimated` and affected components.

### Phase 2 – Chat Core Upgrade

1. **Define chat motion hooks** in `effects/chat/*`:
   - `useMessageSendMotion`
   - `useTypingIndicatorMotion`
   - `useReactionPickerMotion`
   - `useMessageStatusMotion`
2. **Wire chat components**:
   - `AdvancedChatWindow.tsx`
   - `ChatInputBar.tsx`
   - `MessageBubble.tsx` and reactions components.
3. **Tests & snapshots**
   - Verify motion presence/absence via classnames & style props (not actual timing).

### Phase 3 – Secondary Surfaces

1. **Stories**: upgrade swipe & progress animations.
2. **Adoption & Pet Detail**: apply enhanced motion patterns.
3. **Maps & Discovery**: unify map and list motion.

### Phase 4 – Polish & Performance

1. **Performance budget**
   - Use Chrome Performance / Lighthouse to measure 60fps under heavy animations.
   - Identify hot spots; reduce simultaneous animated properties.
2. **Micro-delight layer**
   - Add subtle particles/confetti for rare events (achievements, onboarding completion).
3. **Accessibility verification**
   - Run with reduced motion on and ensure all flows remain clear and usable.

---

## 7. Quality Gates Before Calling It "iMessage / Telegram X Level"

We only consider the motion system "done" when:

- **No TS/ESLint errors** in `effects` + `components` related to motion.
- **All hooks documented** with input/outputs and motion intent.
- **Reduced motion** is tested and honored across chat, stories, modals, and major flows.
- **Performance**: key interactions (send message, open chat, open modal, swipe story) stay above 55–60 fps on mid-tier hardware.
- **UX review**: internal review comparing side-by-side captures vs. iMessage / Telegram X for:
  - Message send feel
  - Typing indicator
  - Reactions & long-press
  - Story interactions
  - Button and card affordances

This document should be treated as the **single source of truth** for the motion/animation upgrade. Every motion-related PR in `apps/web` should link to the relevant sections here and explicitly state which checklist items it completes.
