<!-- 917ca1e6-e415-42bf-8d8d-d4a21428bc50 1cd1cf4c-be25-4fa6-8368-89487c36b489 -->
# Premium Chat Parity Implementation Plan

## Phase 0 - Preflight

### 0.1 Create Work Branch

- Branch: `feat/premium-chat-parity`
- Verify CI runs on PR creation

### 0.2 Lock pnpm + Node Versions

- Create `.nvmrc` with Node version (e.g., `20.x`)
- Create `.tool-versions` for asdf users
- Set `packageManager` in root `package.json` to `"pnpm": ">=8"`
- Verify: `pnpm -v` matches lockfile, `pnpm -w install --frozen-lockfile` passes

**Files:**

- `.nvmrc` (new)
- `.tool-versions` (new)
- `package.json` (update `packageManager` field)

---

## Phase 1 - Kill Blockers (Data & Stubs)

### 1.1 React Query Provider + Persist

**Web Provider** (`apps/web/src/providers/QueryProvider.tsx`):

- Already exists but verify IndexedDB persister via `@tanstack/react-query-persist-client`
- Use `createIDBPersister` from `@tanstack/query-persist-client-core`
- Wire in `apps/web/src/main.tsx` (already wired, verify)

**Mobile Provider** (`apps/mobile/src/providers/QueryProvider.tsx`):

- Already exists with AsyncStorage
- Verify wired in `apps/mobile/src/App.tsx` (already wired)

**AC:**

- Both apps wrapped with PersistQueryClientProvider
- Devtools off in prod (`import.meta.env.PROD` check)
- Offline cache survives reload (test: set a query key, reload, verify data persists)

### 1.2 Remove KV Stubs, Unify API Hooks

**Create React Query hooks** (`apps/web/src/hooks/api/`):

- `use-pets.ts` - useQuery for pets list, useMutation for create/update
- `use-user.ts` - useQuery for user profile, useMutation for update
- `use-matches.ts` - useQuery for matches, useMutation for swipe/match
- `use-chat.ts` - useQuery for rooms/messages, useMutation for send/reaction
- `use-community.ts` - useQuery for posts, useMutation for create/update
- `use-adoption.ts` - useQuery for listings, useMutation for applications

**Migration pattern:**

```typescript
// Replace: const [data] = useStorage('key', [])
// With: const { data } = useQuery({ queryKey: ['chat', 'rooms'], queryFn: fetchRooms })
```

**AC:**

- `git grep -n "spark.kv" apps/web apps/mobile` → empty (except compat files)
- Each hook has at least one `useQuery` and one `useMutation`
- Errors normalized via shared helper (see Phase 9)

**Files to migrate:**

- `apps/web/src/components/ChatWindowNew.tsx` - replace `useStorage` with `useChatMessages` hook
- `apps/web/src/hooks/useChatMessages.ts` - convert to React Query
- All components using `useStorage` for chat data

---

## Phase 2 - Motion Foundation (Reanimated Everywhere)

### 2.1 Motion Facade

**Create** `packages/motion/src/index.ts`:

- Re-export Reanimated components/hooks as default
- Allow Framer Motion only in `apps/web/**/web-only/**` paths
- Export `AnimatedView`, `useSharedValue`, `useAnimatedStyle`, etc.

**Migration:**

- Replace `import { motion } from 'framer-motion'` with `import { AnimatedView } from '@petspark/motion'`
- Update ESLint rule to ban framer-motion in shared/mobile

**AC:**

- `git grep -n "framer-motion" packages apps/mobile` → empty
- `git grep -n "from 'framer-motion'" apps/web` → only in `**/web-only/**`

**Files:**

- `packages/motion/package.json` (verify exists)
- `packages/motion/src/index.ts` (create/update)
- ESLint config (update rules)

### 2.2 Determinism + Reduced Motion + Haptics

**Web Effects** (`apps/web/src/effects/chat/core/`):

- Copy from `apps/mobile/src/effects/chat/core/seeded-rng.ts`
- Copy from `apps/mobile/src/effects/chat/core/reduced-motion.ts`
- Copy from `apps/mobile/src/effects/chat/core/haptic-manager.ts`
- Ensure all effects use `SeededRNG` instead of `Math.random()`
- Effects branch on `useReducedMotion()` hook
- Haptics skipped when `reducedMotion === true`

**AC:**

- `git grep -n "Math.random(" apps/web/src/effects apps/mobile/src/effects` → empty
- Effects check `useReducedMotion()` and use ≤120ms fallback
- Haptics cooldown ≥250ms enforced in `HapticManager`
- Haptics skipped when reduced motion enabled

**Files:**

- `apps/web/src/effects/chat/core/seeded-rng.ts` (create)
- `apps/web/src/effects/chat/core/reduced-motion.ts` (create)
- `apps/web/src/effects/chat/core/haptic-manager.ts` (create)
- Update all effect files to use seeded RNG

---

## Phase 3 - Performance & Bundle

### 3.1 Virtualized Message List (Web)

**Create** `apps/web/src/components/chat/window/VirtualMessageList.tsx`:

- Use `@tanstack/react-virtual` for virtualization
- Gate via feature flag `chat.virtualization`
- Handle 10k+ messages smoothly

**AC:**

- 10k messages render smoothly (no jank)
- Scroll jank < 16ms on mid-range device
- Feature flag controls enable/disable

**Files:**

- `apps/web/src/components/chat/window/VirtualMessageList.tsx` (new)
- Update `ChatWindowNew.tsx` to use virtualized list when flag enabled

### 3.2 Outbox & Retry (Lossless Send)

**Create** `packages/chat-core/src/useOutbox.ts`:

- Exponential backoff (0ms, 300ms, 1s, 3s)
- Idempotent `clientId` per message
- Queue messages when offline
- Auto-flush on reconnect

**Wire send pipeline:**

- Enqueue to outbox before API call
- API performs idempotent write (dedupe by `clientId`)
- Remove from outbox on success

**AC:**

- Offline send → queues in IndexedDB/AsyncStorage
- Auto-flushes on reconnect
- No duplicates (idempotent `clientId`)

**Files:**

- `packages/chat-core/src/useOutbox.ts` (new)
- Update `use-chat.ts` to use outbox

### 3.3 Bundle Budget & Dynamic Imports

**Convert heavy visuals to lazy:**

- Confetti, ReactionBurst, MessagePeek, Media Viewer, LLM/editor panels
- Use `React.lazy()` + `Suspense`

**Tree-shake icons:**

- Switch to per-icon ESM imports (if not already)
- Verify no unused icon imports

**AC:**

- `node scripts/budget-check.mjs` passes (largest JS < 500KB)
- First contentful interaction unaffected by effects
- Bundle analysis shows code splitting

**Files:**

- Update imports in chat components to use lazy loading
- `scripts/budget-check.mjs` (verify exists, update threshold to 500KB)

---

## Phase 4 - Mobile Parity

### 4.1 Parity Script (Hard Gate)

**Verify** `scripts/check-mobile-parity.ts`:

- Already exists, checks `apps/web/src/components/chat/window` vs `apps/mobile/src/components/chat/window`
- Ensure it runs in CI

**AC:**

- Script prints `✅ Mobile parity OK`
- No missing `.native.tsx` files

### 4.2 Generate Missing .native.tsx Enhanced Components

**Check existing** `.native.tsx` files in `apps/mobile/src/components/chat/window/`:

- Many already exist (VirtualMessageList, ChatInputBar, etc.)
- Verify props match 1:1 with web versions
- Use RN primitives + Reanimated

**AC:**

- Same default export names as web
- Parity script passes
- Props interface matches web exactly

**Files to verify/create:**

- `apps/mobile/src/components/chat/window/ChatWindowNew.native.tsx` (if missing)
- Verify all chat window components have native versions

### 4.3 Native ChatInputBar

**Verify** `apps/mobile/src/components/chat/window/ChatInputBar.native.tsx`:

- Reanimated bounce on send
- RN Gesture Handler for interactions
- Typing indicator support
- Send on return key
- Accessibility labels
- Haptics on send

**AC:**

- Typing works
- Send on return key
- Accessibility labels present
- Haptics trigger on send

---

## Phase 5 - Accessibility

### 5.1 Web A11y

**Create** `apps/web/src/components/chat/window/LiveRegions.tsx`:

- Announce typing users via `aria-live="polite"`
- Announce new messages via `aria-live="assertive"`
- "Skip to composer" link (keyboard navigation)

**Keyboard support:**

- Escape closes popovers/modals
- Tab order correct (header → messages → input)
- Focus management on modal open/close

**AC:**

- Axe clean on chat screen (run `axe-core` tests)
- Screen reader announces new messages
- Keyboard navigation works end-to-end

**Files:**

- `apps/web/src/components/chat/window/LiveRegions.tsx` (new)
- Update `ChatWindowNew.tsx` to include live regions

### 5.2 RN A11y Parity

**Use** `AccessibilityInfo.announceForAccessibility`:

- Announce new messages
- Announce typing indicators

**Focus management:**

- Focusable controls in Peek modal
- Back button closes overlays
- Focus returns to trigger after close

**AC:**

- TalkBack/VoiceOver basic path verified
- Announcements work
- Focus management correct

**Files:**

- Update native chat components with accessibility announcements

---

## Phase 6 - Feature Flags & Safety

### 6.1 Feature Flags

**Create/Update** `packages/config/feature-flags.ts`:

- Zod schema for validation
- Chat-specific flags:
  - `chat.confetti` (boolean)
  - `chat.reactionBurst` (boolean)
  - `chat.auroraRing` (boolean)
  - `chat.virtualization` (boolean)
- Load from server JSON (with fallback defaults)
- Invalid payloads rejected

**AC:**

- Flags load from server JSON
- Default safe values (all false initially)
- Invalid payloads rejected (Zod validation)

**Files:**

- `packages/config/feature-flags.ts` (create/update)
- Add Zod schema for chat flags

### 6.2 Security: URL Safety

**Create** `apps/web/src/lib/url-safety.ts`:

- `safeHref()` function validates URLs
- Rejects dangerous protocols (`javascript:`, `data:`, etc.)
- Returns safe href with `rel="noopener noreferrer nofollow ugc"`

**Wire in LinkPreview:**

- Use `safeHref()` for all links
- Skip dangerous protocols

**AC:**

- LinkPreview skips dangerous protocols
- Tests cover URL validation

**Files:**

- `apps/web/src/lib/url-safety.ts` (new)
- Update `LinkPreview` component to use `safeHref()`

### 6.3 Error Boundaries

**Create** `apps/web/src/components/chat/window/ChatErrorBoundary.tsx`:

- Wrap message list, input, overlays
- Show compact fallback UI
- Log errors to telemetry

**AC:**

- Failing child shows compact fallback
- App remains usable
- Errors logged

**Files:**

- `apps/web/src/components/chat/window/ChatErrorBoundary.tsx` (new)
- Wrap chat components with error boundary

---

## Phase 7 - Observability

### 7.1 Web: Web Vitals

**Integrate** Web Vitals probe:

- TTFB, LCP, CLS, long tasks
- Minimal probe (one log line per session)
- Summarized metrics

**AC:**

- One log line per session with summarized metrics
- Web Vitals tracked

**Files:**

- Add Web Vitals integration to `apps/web/src/main.tsx`

### 7.2 Mobile: Frame Drop Counter

**Add** frame drop counter around heavy effects:

- Simple memory peak log
- Frame timing around effects

**AC:**

- Frame drops logged
- Memory peaks logged

**Files:**

- Update effect components to log frame drops

### 7.3 Error Reporting

**Initialize** Sentry/Crashlytics:

- DSN via env variable
- Error reporting enabled
- Source maps uploaded

**AC:**

- Error reporting initialized
- DSN configured via env

**Files:**

- Add Sentry initialization to both apps

---

## Phase 8 - Shared Types & Schemas

### 8.1 Promote Chat Types to Shared

**Create** `packages/shared/src/chat/types.ts`:

- `ChatMessage`, `ChatRoom`, `MessageReaction`
- Strict unions (no `any`)
- Export from shared package

**Update imports:**

- Replace local chat types with shared imports
- Remove duplicate type definitions

**AC:**

- Apps import from `@petspark/shared/chat/types` only
- No local "minimal" types

**Files:**

- `packages/shared/src/chat/types.ts` (create)
- Update imports in web/mobile apps

### 8.2 Add Zod Schemas for Service I/O

**Create** `packages/shared/src/chat/schemas.ts`:

- Zod schemas for API requests/responses
- Parse and narrow types
- Bad payload → typed error path

**AC:**

- All service responses parsed & narrowed
- Bad payload → typed error path

**Files:**

- `packages/shared/src/chat/schemas.ts` (create)
- Use schemas in API hooks

---

## Phase 9 - Central API Client

### 9.1 Unified API Client

**Create** `packages/core/src/api/client.ts`:

- Fetch/axios wrapper with:
  - Auth refresh (401 → token refresh once)
  - Retry/backoff for idempotent GET/PUT (0ms, 300ms, 1s)
  - Error normalization `{ code, message, details }`
  - Telemetry hooks: `onRequest`, `onResponse`, `onError`

**Migrate services:**

- Make services thin wrappers around client
- Consistent error handling
- Hooks compose with React Query

**AC:**

- Services become thin wrappers
- Consistent errors
- Hooks compose nicely with React Query

**Files:**

- `packages/core/src/api/client.ts` (create)
- Update existing API clients to use unified client

---

## Phase 10 - CI/CD (Truth Over Markers)

### 10.1 Quality Workflow

**Create** `.github/workflows/ui-quality.yml`:

- Steps: install → typecheck → lint (0 warnings) → test --run → build → run verify scripts → upload JSON artifact

**AC:**

- Build fails on any regression
- All gates must pass

**Files:**

- `.github/workflows/ui-quality.yml` (create)

### 10.2 Verification Scripts

**Verify** scripts exist and pass:

- `scripts/verify-migration.ts`
- `scripts/verify-effects.ts`
- `scripts/check-mobile-parity.ts`
- `scripts/budget-check.mjs`

**AC:**

- All scripts present
- All scripts pass

---

## Phase 11 - Premium Visuals (Gated)

### 11.1 Holo Background

**Web:** `apps/web/src/components/chrome/HoloBackground.tsx`

**Mobile:** `apps/mobile/src/components/chrome/HoloBackground.native.tsx` (already exists)

- Canvas gradient (web), Skia (mobile)
- Idle CPU < 2%
- Respects reduced motion (slows/halts)

**AC:**

- Idle CPU < 2%
- Reduced motion respected

### 11.2 Cursor Glow (Web)

**Create** `apps/web/src/effects/cursor/GlowTrail.tsx`:

- Passive cursor trail
- Detached on unmount
- No memory growth

**AC:**

- No memory growth
- Disabled on touch-only devices

### 11.3 Message Peek

**Web/Mobile:** Long-press/hold preview

- Scale + blur (Reanimated)
- Open ≤120ms
- Esc/back closes
- Focus returns to trigger

**AC:**

- Open ≤120ms
- Esc/back closes
- Focus management correct

### 11.4 SmartImage

**Web/Mobile:** LQIP → reveal

- Pause effect off-screen
- Reduced-motion → instant swap
- No layout shift

**AC:**

- Reduced-motion → instant swap
- No layout shift

### 11.5 Audio Send Ping (Web, Flag)

**Create** `apps/web/src/effects/sound/SendPing.ts`:

- Call on successful send
- Sample rate safe
- No audio context leaks

**AC:**

- Sample rate safe
- No audio context leaks

---

## Phase 12 - QA & Sign-Off

### 12.1 Run Full Gate Locally

**Commands:**

```bash
pnpm -w install --frozen-lockfile
pnpm -w typecheck
pnpm -w lint
pnpm -w test -- --run
pnpm -w build
node scripts/check-mobile-parity.ts
ts-node scripts/verify-migration.ts
ts-node scripts/verify-effects.ts
node scripts/budget-check.mjs
```

### 12.2 Acceptance Criteria (All Must Pass)

- ✅ 0 imports of framer-motion in shared/mobile; only inside `apps/web/**/web-only/**`
- ✅ 0 references to `window.spark.kv` / `spark.kv` (except compat files)
- ✅ React Query + persist wired (web IndexedDB, mobile AsyncStorage)
- ✅ Virtualized list enabled (flagged), 10k messages smooth
- ✅ Effects: seeded RNG only; reduced-motion ≤120ms; haptics cooldown ≥250ms & skipped on RM
- ✅ Parity script ✅ (no missing .native.tsx, matching default exports)
- ✅ A11y: web live regions; RN announcements; overlays focusable/escapable
- ✅ URL safety enforced; error boundaries active
- ✅ Largest web JS asset < 500KB; both builds succeed
- ✅ CI job green; verification scripts all pass; artifact uploaded

---

## Implementation Order

1. Phase 0 (Preflight) - Setup
2. Phase 1 (Data & Stubs) - Foundation
3. Phase 2 (Motion) - Animation foundation
4. Phase 3 (Performance) - Optimization
5. Phase 4 (Mobile Parity) - Platform consistency
6. Phase 5 (A11y) - Accessibility
7. Phase 6 (Feature Flags) - Safety
8. Phase 7 (Observability) - Monitoring
9. Phase 8 (Types) - Type safety
10. Phase 9 (API Client) - Data layer
11. Phase 10 (CI/CD) - Automation
12. Phase 11 (Premium Visuals) - Polish
13. Phase 12 (QA) - Verification

### To-dos

- [ ] Create work branch feat/premium-chat-parity and lock pnpm/node versions (.nvmrc, .tool-versions, packageManager)
- [ ] Verify React Query providers with persistence (web IndexedDB, mobile AsyncStorage) and wire in main entry points
- [ ] Create React Query hooks (use-pets, use-user, use-matches, use-chat, use-community, use-adoption) and migrate all spark.kv usage
- [ ] Create packages/motion facade (Reanimated default, Framer only in web-only paths) and migrate all framer-motion imports
- [ ] Copy effects core (seeded-rng, reduced-motion, haptic-manager) to web and ensure all effects use seeded RNG, respect reduced motion, enforce haptic cooldown
- [ ] Create VirtualMessageList component with @tanstack/react-virtual, gate via feature flag, handle 10k+ messages
- [ ] Create useOutbox hook with exponential backoff, idempotent clientId, queue offline messages, auto-flush on reconnect
- [ ] Convert heavy visuals to lazy imports, tree-shake icons, verify bundle budget < 500KB
- [ ] Verify check-mobile-parity.ts script and ensure it runs in CI
- [ ] Generate/verify missing .native.tsx components with matching props and default exports
- [ ] Verify/enhance ChatInputBar.native.tsx with Reanimated bounce, RN Gesture, typing, send on return, a11y labels, haptics
- [ ] Create LiveRegions component, add keyboard navigation, escape closes popovers, tab order correct, Axe clean
- [ ] Add AccessibilityInfo announcements for new messages/typing, ensure focusable controls in modals, Back closes overlays
- [ ] Create/update packages/config/feature-flags.ts with Zod schema, chat flags (confetti, reactionBurst, auroraRing, virtualization), load from server JSON
- [ ] Create url-safety.ts with safeHref() function, wire in LinkPreview, reject dangerous protocols, add tests
- [ ] Create ChatErrorBoundary component, wrap message list/input/overlays, show compact fallback, log errors
- [ ] Integrate Web Vitals probe (TTFB, LCP, CLS, long tasks), one log line per session with summarized metrics
- [ ] Add frame drop counter around heavy effects, simple memory peak log
- [ ] Initialize Sentry/Crashlytics with DSN via env, enable error reporting, upload source maps
- [ ] Create packages/shared/src/chat/types.ts with ChatMessage, ChatRoom, MessageReaction, update all imports to use shared types
- [ ] Create packages/shared/src/chat/schemas.ts with Zod schemas for API I/O, parse and narrow types, handle bad payloads
- [ ] Create packages/core/src/api/client.ts with auth refresh, retry/backoff, error normalization, telemetry hooks, migrate services to use unified client
- [ ] Create .github/workflows/ui-quality.yml with install → typecheck → lint → test → build → verify scripts → upload artifact
- [ ] Verify all scripts exist and pass: verify-migration.ts, verify-effects.ts, check-mobile-parity.ts, budget-check.mjs
- [ ] Create/enhance HoloBackground components (web canvas, mobile Skia), idle CPU < 2%, respect reduced motion
- [ ] Create GlowTrail.tsx for web, passive cursor trail, no memory growth, disabled on touch-only devices
- [ ] Create/enhance MessagePeek components (web/mobile), long-press preview with scale+blur, open ≤120ms, esc/back closes, focus management
- [ ] Create/enhance SmartImage components (web/mobile), LQIP → reveal, pause off-screen, reduced-motion instant swap, no layout shift
- [ ] Create SendPing.ts for web, call on successful send, sample rate safe, no audio context leaks, gate via feature flag
- [ ] Run full gate locally and in CI: install → typecheck → lint → test → build → verify scripts, verify all acceptance criteria pass