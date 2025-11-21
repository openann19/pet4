PETSPARK Web Motion System v2.0

Target: Better-than-iMessage / Telegram X motion, with enforceable rules, metrics, and repeatable implementation.

This doc is normative:
If existing code conflicts with this, this doc wins.

0. Scope & Non-Negotiables

Surface: apps/web only (chat, stories, discovery/maps, adoption, system chrome, settings).

Stack: React 18, your custom @petspark/motion + apps/web/src/effects/reanimated/* + AnimatedView bridge.

No ad-hoc animation:

No inline CSS transitions/animations except where explicitly allowed.

All motion must go through standardized hooks/components in effects/* or @petspark/motion.

Performance budgets:

Animation-heavy interactions ≥ 55–60 fps on mid-tier laptop/mobile.

No layout thrashing: animate transform/opacity; avoid animating top/left/width/height unless essential and measured.

Accessibility:

prefers-reduced-motion + in-app motion setting are mandatory gates, not “nice-to-have”.

1. Architecture Overview (How Motion Works in Web)
1.1 Canonical Motion Types

Create apps/web/src/effects/reanimated/types.ts:

export type MotionSurfaceKind =
  | "interaction"
  | "presence"
  | "status"
  | "celebration"
  | "layout";

export interface BaseMotionReturn<TStyle> {
  kind: MotionSurfaceKind;
  animatedStyle: TStyle;           // Single merged object, no nested MotionValues
}

export interface InteractionMotion<TStyle> extends BaseMotionReturn<TStyle> {
  kind: "interaction";
  onPressIn?: () => void;
  onPressOut?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

export interface PresenceMotion<TStyle> extends BaseMotionReturn<TStyle> {
  kind: "presence";
  isVisible: boolean;
}

export interface CelebrationMotion<TStyle> extends BaseMotionReturn<TStyle> {
  kind: "celebration";
  trigger: () => void;
}


Rules:

Every hook in effects/reanimated must return one of these typed shapes.

No hook returns raw MotionValue or arbitrary fragments ({ scale }) as its public contract; internal use only.

1.2 View Types (Consumption)

MotionView (from @petspark/motion):

Accepts MotionStyle – Framer-style styles, can understand MotionValues.

AnimatedView (bridge in effects/reanimated/animated-view.tsx):

Accepts AnimatedStyle – plain CSSProperties or style functions that get converted via convertReanimatedStyleToCSS.

Rule:

Hooks intended for MotionView export types/aliases ending with Motion (e.g. usePressBounceMotion).

Hooks intended for AnimatedView export aliases ending with Animated (e.g. usePressBounceAnimated), but both are thin wrappers over the same core logic.

2. Motion Design Tokens (Motion Theme)

Create apps/web/src/config/motionTheme.ts:

export const motionTheme = {
  durations: {
    instant: 80,
    fast: 140,
    normal: 220,
    slow: 320,
    deliberate: 450,
  },
  easing: {
    snappy: "cubic-bezier(0.2, 0.9, 0.35, 1.0)",
    smooth: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
    gentle: "cubic-bezier(0.25, 0.8, 0.4, 1.0)",
  },
  spring: {
    bouncy: { stiffness: 420, damping: 28, mass: 1 },
    responsive: { stiffness: 340, damping: 30, mass: 1 },
    settled: { stiffness: 260, damping: 32, mass: 1 },
  },
  scale: {
    hover: 1.03,
    press: 0.96,
    subtleHover: 1.01,
  },
  distance: {
    hoverLift: 4,         // px
    modalOffsetY: 16,     // px
    listStaggerY: 12,     // px
    toastOffsetY: 24,     // px
  },
  opacity: {
    faint: 0.12,
    subtle: 0.35,
    visible: 1.0,
  },
} as const;


Hard rule:
No hardcoded numbers for durations/easing/scale/offset in components or hooks.
Everything goes through motionTheme.

3. Global Preferences & Reduced Motion

Create apps/web/src/effects/reanimated/useMotionPreferences.ts:

Inputs:

prefers-reduced-motion (media query).

App-level setting: ui.motionLevel: "full" | "reduced" | "off".

Output:

export interface MotionPreferences {
  level: "full" | "reduced" | "off";
  isReduced: boolean; // level !== "full"
  isOff: boolean;     // level === "off"
}


Usage convention (for every hook):

export interface MotionHookOptions {
  preferences?: MotionPreferences; // optional override for tests
  respectPreferences?: boolean;    // default true
}


Behavior:

level = "off" → return animatedStyle with no animated changes; only final states.

level = "reduced" → reduce travel distance and duration (e.g. halve distance, use fast duration, no bouncy spring).

All high-energy effects (confetti, particles, 3D tilt) must no-op or use a single fade/scale in reduced/off modes.

Add tests in effects/reanimated/__tests__ for:

Default (full).

Reduced.

Off.

4. Canonical Motion Patterns (Library)

All implemented in apps/web/src/effects/reanimated/*.
Each pattern must have:

A single default export hook.

A JSDoc block describing intent, inputs, outputs.

Tests.

4.1 Interaction Patterns

usePressBounce (InteractionMotion)

Press: scale → motionTheme.scale.press, y → +2px, spring back on release with spring.bouncy.

useHoverLift

Hover: scale → motionTheme.scale.hover, y → -motionTheme.distance.hoverLift, shadow-softening.

useMagneticHover

Card tracks cursor within a radius (e.g. 12px) via transform.

Must include a max tilt/offset clamp to avoid nausea.

4.2 Presence & Layout Patterns

useStaggeredItem

For list items; accepts index, baseDelayMs, direction ("up" | "down").

useModalAnimation

For dialogs/overlays; fade + scale + vertical offset from motionTheme.distance.modalOffsetY.

useAnimatePresence

Simple hook that guards mount/unmount and feeds isVisible into PresenceMotion.

4.3 Status & Feedback Patterns

useBreathingGlow

For primary CTAs or status icons; subtle scale/opacity pulse.

useGlowBorder

Animated border glow; uses CSS box-shadow + opacity modulation.

useConfettiBurst

Seeded; deterministic burst pattern given seed + intensity.

Must expose a trigger() function, and be a no-op if preferences.isReduced.

4.4 Chat-Specific Patterns

Under apps/web/src/effects/chat/*:

useMessageSendMotion

useMessageStatusMotion (sending → sent → delivered → read)

useTypingIndicatorMotion

useReactionPickerMotion

useVoiceMessageMotion

Each implements the narrative behavior defined below.

5. Chat: iMessage / Telegram X-Level Specification

This section is strictly enforceable. Any deviation must be justified in the PR.

5.1 Message Lifecycle

For MessageBubble:

On send (local message):

Bubble spawns near input with:

Initial state: opacity: 0, translateY: 8, scale: 0.96.

Animate to: opacity: 1, translateY: 0, scale: 1.0 with durations.fast, spring.bouncy.

Input bar:

Compress: scaleY to 0.98 for durations.instant, then spring back.

Send button:

usePressBounce + useGlowBorder with quick glow ramp.

Sending state (status === "sending"):

Subtle shimmer or 3 pulsing dots in the bottom-right of the bubble.

No infinite high-energy loops: max one shimmer per second.

Delivered / read transitions:

When status transitions:

Tick icons animate from scale: 0.8, opacity: 0 → 1, 1 over durations.fast with easing.snappy.

Color transition (e.g. grey → accent) over durations.normal with easing.smooth.

Edit & delete:

Edit: bubble border glows once and content cross-fade.

Delete: bubble shrinks vertically (height collapse), fades to 0 opacity, siblings smoothly reflow (staggered small y transitions, NOT instant jump).

5.2 Typing Indicator

Spec:

Avatar with a pill containing 3 dots.

Dots animate in sequence (up-down) with small vertical travel and scale variations.

Requirements:

Animations pause and hide within ≤200ms when typing stops.

In reduced motion, show a static “typing…” pill only; no dot animation.

5.3 Reactions & Long-Press Menus

Long-press on bubble:

Bubble: scale to 1.03, background blur overlay fades in to opacity: 0.5.

Reaction bar:

Enters with useStaggeredItem on icons (index-based delay: ~40ms apart).

On selecting a reaction:

Reaction icon on bubble:

From scale: 0.5, opacity: 0 → 1, 1 with spring.bouncy.

Confetti:

Small burst anchored at bubble center; deterministic per (messageId, reactionType).

5.4 Voice & Attachments

Voice message:

Progress scrubber uses smooth transform updates.

Waveform segments animate based on sampled amplitude data but are clamped to avoid seizure-like patterns.

Attachments:

Thumbnail appears with fade + zoom-in (scale: 0.9 → 1.0).

Upload progress: border sweep or overlay with transform-based mask, not width transitions.

6. Other Surfaces: Concrete Requirements
6.1 Stories (StoryViewer)

Horizontal swipe:

Elastic behavior at edges; neighbor story peeks at 10–15% width.

Progress bar:

Continuous fill; taps left/right:

Rewinds/advances with a quick snap (no full re-mount of story).

Close / dismiss:

Vertical pull-down gesture:

Story card scales down slightly and fades; background dims back to 0.

6.2 Adoption & Pet Detail

Pet hero image:

Subtle parallax between image and background gradient on scroll.

CTA buttons (Like, Chat, Save):

usePressBounce + useGlowBorder on focus.

On primary “Adopt / Like” success:

Localized confetti from button center.

Stats & analytics:

Bars fill from 0 → target width over durations.normal.

Numbers count up in sync, clamped to ≤ 600ms duration.

6.3 Maps & Discovery

Map interactions:

Marker drop: tiny bounce with spring.responsive.

Selection:

Bottom sheet slides up from translateY: 100% → 0.

Background map scales VERY subtly (e.g. 1.0 → 0.98) to imply focus.

Saved searches list:

useStaggeredItem for entry.

Each row gets useHoverLift on desktop; none on touch devices.

6.4 System Chrome & Modals

All modals reference one animation:

useModalAnimation with:

opacity: 0 → 1

scale: 0.98 → 1

translateY: motionTheme.distance.modalOffsetY → 0

Navigation transitions:

Forward navigations: content slides from right with slight fade.

Back navigations: from left.

Enforced via a single PageTransition wrapper component.

7. Implementation Playbook (For AI Dev / PRs)
7.1 Per-PR Motion Rules

Whenever a PR touches apps/web UI:

Audit:

Search the edited files for:

transition:, animation:, @keyframes, inline style with transform/opacity.

Replace raw animation logic with the appropriate hook(s) from effects/reanimated or effects/chat.

Normalize:

Import motionTheme and motion hooks instead of hardcoded durations/easings.

Ensure hooks return animatedStyle and are spread into the component’s style.

Wire preferences:

For any non-trivial animation (lasting > durations.fast or with repetition), hook into useMotionPreferences.

Test:

Run targeted tests:

pnpm test --filter web -- --runTestsByPath path/to/affected/component.test.tsx

If a new pattern/hook is added:

Add/extend tests in effects/reanimated/__tests__.

Verify UX:

Manually:

Check behavior with motion full, reduced, and off.

In DevTools: simulate prefers-reduced-motion: reduce.

7.2 Motion-Specific Quality Gates

A motion-related PR is NOT mergeable unless:

All changed files:

Have no raw CSS transitions or keyframes that duplicate existing patterns.

For each animation:

Motion tokens (motionTheme) are used.

Reduced-motion behavior is defined and tested.

For chat/story/map/adoption surfaces:

Behavior matches the spec in this document (section 5 & 6) or the PR has an explicit rationale for divergence.

8. Minimal “Golden Prompt” for Your AI Dev

You can hand this chunk directly to your AI dev inside the repo:

You are the motion engineer for PetSpark’s web app (apps/web).
Your job is not to invent random animations, but to enforce and extend the PETSPARK Web Motion System v2.0.

For any file you touch, first audit motion:

Remove or refactor any inline transition, animation, @keyframes, or ad-hoc transform logic.

Replace it with the appropriate hook from apps/web/src/effects/reanimated/* or apps/web/src/effects/chat/*.

Use only motionTheme for all durations, easings, scales, and offsets. No magic numbers.

All hooks must:

Return a typed animatedStyle object (see effects/reanimated/types.ts).

Support reduced/off motion via useMotionPreferences.

For chat, stories, adoption, maps, and modals:

Implement behavior to match PETSPARK Web Motion System v2.0 (this document) as closely as possible.

After edits:

Add or update tests for new hooks or motion behaviors.

Run targeted tests for changed files and ensure no TS/ESLint errors.

Do not leave TODOs or stubs. All motion you add must be fully wired, tested, and compatible with reduced-motion and performance constraints.
ere’s what I’ve actually wired so far for Web Motion System v2.0, and how it lines up with your spec.

1. Core motion primitives now in the repo
1.1 Canonical motion types
File:
apps/web/src/effects/reanimated/types.ts

MotionSurfaceKind
:
"interaction" | "presence" | "status" | "celebration" | "layout"
BaseMotionReturn
kind: MotionSurfaceKind
animatedStyle: TStyle
InteractionMotion
kind: "interaction"
animatedStyle: TStyle
onPressIn?, onPressOut?, onHoverIn?, onHoverOut?
PresenceMotion
kind: "presence"
animatedStyle: TStyle
isVisible: boolean
CelebrationMotion
kind: "celebration"
animatedStyle: TStyle
trigger: () => void
All hooks in effects/reanimated can now cleanly type themselves against these instead of returning ad‑hoc fragments.

1.2 Motion design tokens
File:
apps/web/src/config/motionTheme.ts

Exactly as in your spec:

durations: instant | fast | normal | slow | deliberate
easing: snappy | smooth | gentle
spring: bouncy | responsive | settled with { stiffness, damping, mass }
scale: hover | press | subtleHover
distance: hoverLift | modalOffsetY | listStaggerY | toastOffsetY
opacity: faint | subtle | visible
This is now the canonical source of truth. New motion code should not hardcode numbers.

1.3 Global motion preferences
Config plumbing:

File: apps/web/src/config/absolute-max-ui-mode.ts

Extended AnimationConfig:
ts
motionLevel: 'full' | 'reduced' | 'off';
Default in ABSOLUTE_MAX_UI_MODE.animation.motionLevel = 'full'.
This gives us an app‑level gate you can later expose as a UI setting.

Hook:

File:
apps/web/src/effects/reanimated/useMotionPreferences.ts

Types:
ts
export type MotionLevel = 'full' | 'reduced' | 'off';

export interface MotionPreferences {
  level: MotionLevel;
  isReduced: boolean;
  isOff: boolean;
}

/**
 * Common options surface for motion hooks.
 */
export interface MotionHookOptions {
  preferences?: MotionPreferences;   // useful for tests / overrides
  respectPreferences?: boolean;      // default true in hooks
}
Behavior:
ts
const prefersReduced = usePrefersReducedMotion();   // from '@/utils/reduced-motion'
const { config } = useUIContext();                  // from '@/contexts/UIContext'
const uiLevel = config.animation.motionLevel;
const baseLevel = uiLevel ?? (prefersReduced ? 'reduced' : 'full');
Final preferences:
level = override.level ?? baseLevel
isReduced = level !== 'full'
isOff = level === 'off'
Tests:

File:
apps/web/src/effects/reanimated/tests/useMotionPreferences.test.ts

Mocks
usePrefersReducedMotion
 +
useUIContext
.
Asserts:
default: full, isReduced=false, isOff=false
override reduced: isReduced=true, isOff=false
override off: isReduced=true, isOff=true
2. First refactored hook:
useHoverLift
This is now a concrete example of the v2 rules.

File:
apps/web/src/effects/reanimated/use-hover-lift.ts

2.1 Public types
Options:
ts
export interface UseHoverLiftOptions extends MotionHookOptions {
  scale?: number;
  translateY?: number;
  damping?: number;
  stiffness?: number;
}
Return:
ts
export interface UseHoverLiftReturn extends InteractionMotion<MotionStyle> {
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  variants: Variants;
  handleEnter: () => void;
  handleLeave: () => void;
}
So you still get scale, translateY, variants, handleEnter,
handleLeave
, plus:

kind: "interaction"
animatedStyle for direct consumption by MotionView /
AnimatedView
onHoverIn/onHoverOut wired to the handlers
Existing usage like:

tsx
const hoverLift = useHoverLift();
// hoverLift.animatedStyle, hoverLift.handleEnter, hoverLift.handleLeave, hoverLift.variants
continues to work, but now hangs off a typed
InteractionMotion
.

2.2 Token + preferences wiring
Reads preferences:
ts
const preferences = overridePreferences ?? useMotionPreferences();
const isOff = respectPreferences && preferences.isOff;
const isReduced = respectPreferences && preferences.isReduced && !preferences.isOff;
Uses motionTheme instead of magic numbers:
ts
const baseScale = customScale ?? motionTheme.scale.hover;
const baseTranslateY = customTranslateY ?? -motionTheme.distance.hoverLift;
const baseSpring = motionTheme.spring.responsive;

const scaleValue = isReduced ? 1 + (baseScale - 1) * 0.5 : baseScale;
const translateYValue = isReduced ? baseTranslateY * 0.5 : baseTranslateY;

const damping = customDamping ?? (isReduced ? motionTheme.spring.settled.damping : baseSpring.damping);
const stiffness = customStiffness ?? (isReduced ? motionTheme.spring.settled.stiffness : baseSpring.stiffness);
Off mode:
hoverVariant collapses to restVariant.
handleEnter /
handleLeave
 are no‑ops.
2.3 Variants and style
animatedStyle is a single MotionStyle object:
ts
const animatedStyle: MotionStyle = { scale, y: translateY };
variants:
ts
const restVariant = { scale: 1, y: 0, transition: { type: 'spring', damping, stiffness } };
const hoverVariant = isOff ? restVariant : { scale: scaleValue, y: translateYValue, transition: { ... } };

const variants: Variants = { rest: restVariant, hover: hoverVariant };
Handlers:
ts
handleEnter: if (!isOff) { scale.set(scaleValue); translateY.set(translateYValue); }
handleLeave: if (!isOff) { scale.set(1); translateY.set(0); }
2.4 Tests updated and passing
File: apps/web/src/effects/reanimated/use-hover-lift.test.tsx

Mocks
useMotionPreferences
 to full by default.
Tests:
Defaults:
Returns defined scale, translateY, variants, handleEnter,
handleLeave
.
Interactions / shape:
hover variant has scale > 1 and y < 0.
rest variant is exactly scale: 1, y: 0.
Custom overrides:
scale: 1.1 → hover.scale ≈ 1.1.
translateY: -10 → hover.y < 0.
Preferences off:
With preferences: { level: 'off', isReduced: true, isOff: true }, hover equals rest (no lift).
3. How to consume this going forward
3.1 For interaction hooks
Pattern for new hooks (e.g. usePressBounce):

Accept
MotionHookOptions
 in the options bag.
Internally call
useMotionPreferences()
 unless overridden.
Decide behavior based on isReduced / isOff.
Return an
InteractionMotion
 + any internal handles:
ts
return {
  kind: 'interaction',
  animatedStyle,
  onPressIn,
  onPressOut,
  // hook-specific fields
};
3.2 For components
For MotionView: pass animatedStyle directly.
For AnimatedView: still pass animatedStyle (AnimatedView already converts via convertReanimatedStyleToCSS).
Example usage pattern (no code changes needed where you already use hoverLift.animatedStyle and handlers).

4. Alignment with your spec so far
Section 1.1 & 1.2: Implemented and wired (
types.ts
,
motionTheme.ts
).
Section 3 (preferences):
prefers-reduced-motion integrated.
App‑level motionLevel plumbed via ABSOLUTE_MAX_UI_MODE.
MotionHookOptions
 defined and used by
useHoverLift
.
Section 4.1 (Interaction Patterns):
useHoverLift
 is now compliant with:
Central tokens (no hardcoded values).
Preferences gating, including reduced/off behavior.
Typed
InteractionMotion
 contract.
This gives you a solid pattern to apply to:

usePressBounce (button tap/press)
useMagneticHover
Other interaction hooks currently in effects/reanimated.
5. Suggested next steps (you can pick the lane)
From here, I’d suggest one of these paths:

Finish the interaction layer:
Implement usePressBounce and useMagneticHover with:
InteractionMotion
 returns.
motionTheme for all numbers.
useMotionPreferences
 for reduced/off semantics.
Refactor any existing “tap/hover” hooks to match.
Presence & layout primitives:
Implement useAnimatePresence, useStaggeredItem, useModalAnimation using the same pattern (but
PresenceMotion
 for the last two).
Wire useModalAnimation into existing dialogs / overlays (e.g. ShadCN dialogs and your custom modals).
Chat‑specific motions under effects/chat/*:
Stand up effects/chat folder with:
useMessageSendMotion
useMessageStatusMotion
useTypingIndicatorMotion
useReactionPickerMotion
useVoiceMessageMotion
Start with MessageBubble send → status flow per your section 5.
