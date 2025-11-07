# Bundle Optimization Plan

Baseline (from budget-check.mjs):

* Largest JS chunk: ~1541 KB (index-*.js)
* Total: ~3354 KB

## Phase 1 (Implemented Now)

1. Code-split `EnhancedPetDetailView` via React.lazy + Suspense in `DiscoverView.tsx`.
2. Lazy-load heavy visual effects (`ConfettiBurst`, `ReactionBurstParticles`) inside `Overlays.tsx`.

Expected immediate impact: heavy modal/detail/effects logic deferred until interaction → shrink main entry chunk.

## Phase 2 (Next)

1. Extract TensorFlow & toxicity model loading to dynamic import triggered only on moderation needs.
2. Dynamic import map/geo stack (`maplibre-gl`, `leaflet`) gated behind map view activation.
3. Lazy-load stories system + celebration components (rare interactions).
4. Replace broad icon usage with selective imports or confirm tree-shaking; verify unused icons trimmed.

## Phase 3 (Perf / Fine-grain)

1. Convert ambient gradients & simple opacity transitions from Reanimated to CSS animations.
2. Introduce a central effect scheduler to pause non-critical animations on tab hide / low FPS.
3. Preload split chunks on hover/focus (prefetch) for perceived instant open.

## Measurement Steps

1. Run `pnpm --filter spark-template build`.
2. Run `node scripts/budget-check.mjs` (before & after each phase).
3. Capture bundle diff (largest chunk, total size, number of chunks).
4. Update this doc with delta & cumulative savings.

## Risk & Mitigation

* Lazy loading can introduce waterfalls → Mitigate with strategic prefetch (link hover, idle time).
* Suspense fallback currently `null` → Add lightweight skeletons if perceived delay > 120ms.
* Dynamically loaded libs may shift error surfaces → Wrap imports in try/catch and surface user-friendly fallback.

## Success Criteria

* Largest chunk < 800 KB (hard) then < 600 KB (stretch).
* Total < 2000 KB (hard) then < 1600 KB (stretch).
* No regression in TTI; no console warnings; lighthouse performance score improvement.

## Follow-Up Tracking

Document each phase completion with: date, pre-size, post-size, savings (%).
