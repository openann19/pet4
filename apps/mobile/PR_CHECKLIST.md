# PR Checklist - Ultra-Enhanced Mobile

Copy this checklist into your PR description and check off items as you complete them.

## Performance ✅

- [ ] 60 FPS verified on Android + iOS
- [ ] Cold start/TTI within budget (≤1.8s / ≤2.2s)
- [ ] No unnecessary re-renders (why-did-you-render clean)
- [ ] Bundle size check passed (≤12 MB JS)
- [ ] Frame time ≤16.67ms verified

## A11y & i18n ✅

- [ ] VoiceOver/TalkBack pass
- [ ] Dynamic Type OK (200% scaling)
- [ ] Touch targets ≥44×44pt
- [ ] EN/BG strings, plurals correct
- [ ] No color-only states
- [ ] All interactive elements have accessibilityRole + label

## Quality ✅

- [ ] Unit tests ≥85% coverage
- [ ] Component tests present
- [ ] Detox covers happy path (if applicable)
- [ ] No warnings, no console.\*
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with zero warnings

## Security ✅

- [ ] No PII in logs/events
- [ ] Sensitive screens secure (FLAG_SECURE)
- [ ] Network TLS verified
- [ ] No secrets in code

## Motion & UX ✅

- [ ] Animations respect reduced motion
- [ ] Spring physics correct (damping 0.9-1.0, stiffness 250-320)
- [ ] Haptics on appropriate actions
- [ ] Gestures have button alternatives

## Code Quality ✅

- [ ] No `any` types (except typed boundaries)
- [ ] Explicit return types
- [ ] No TODO/FIXME left
- [ ] Proper error handling
- [ ] Telemetry added for critical paths

## Documentation ✅

- [ ] Code comments added where needed
- [ ] Architecture docs updated (if applicable)
- [ ] Screenshots/GIF attached
- [ ] PR description explains changes

## Testing ✅

- [ ] Tested on physical devices (Android + iOS)
- [ ] Tested in light/dark mode
- [ ] Tested with Dynamic Type
- [ ] Tested with reduced motion
- [ ] Edge cases handled

---

**Definition of Done**: All checkboxes must be checked before requesting review.
