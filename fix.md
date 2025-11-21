# Web Strictness Fix Instructions

This document describes a **systematic, production‑grade process** for keeping the `apps/web` app green under the current strict TypeScript, ESLint, and test configuration **without loosening any rules** (other than `max-lines` / `max-lines-per-function`, which are already disabled by design).

For more detailed background and category breakdowns, also see:

- `ESLINT_FIXES_PROGRESS.md`
- `ERROR_DETAILED_BREAKDOWN.md`
- `WEB_RUNTIME_AUDIT_REPORT.md`

---

## 1. Baseline Commands (web only)

Run everything from the repo root:

- Typecheck (strict):  
  `pnpm --filter ./apps/web typecheck`

- Lint (no warnings allowed):  
  `pnpm --filter ./apps/web lint`

- Unit tests (full web suite):  
  `pnpm --filter ./apps/web test:run`

For faster iteration while fixing one area, scope tests:

- Single hook/component:  
  `pnpm --filter ./apps/web test:run -- use-message-handling`  
  `pnpm --filter ./apps/web test:run -- AdoptionApplicationReview`

Always re‑run `typecheck` + scoped tests after non‑trivial changes; run full `lint` once a batch of files is complete.

---

## 2. Fix Order (recommended)

Work in **batches by feature area** rather than by rule:

1. **Chat core** (hooks + window components)  
   - `apps/web/src/hooks/chat`  
   - `apps/web/src/components/chat`  
   - `apps/web/src/effects/chat`

2. **Admin / adoption flows**  
   - `apps/web/src/components/admin`  
   - `apps/web/src/hooks/admin`

3. **Auth / onboarding**  
   - `apps/web/src/components/auth`  
   - `apps/web/src/hooks/adoption`, `useAuth`, etc.

4. **Community / maps / media**  
   - `apps/web/src/components/community`, `views/map`, media hooks.

For each area:

1. Run lint for the directory (using your editor or full `pnpm --filter ./apps/web lint`).
2. Fix **errors first** (`no-misused-promises`, `no-floating-promises`, `no-unsafe-*`, hooks rules).  
3. Fix **high‑value warnings** (unnecessary conditionals, type issues).  
4. Add or extend **tests** before moving on.

---

## 3. Async Handlers & Floating Promises (no config changes)

Problem rules: `@typescript-eslint/no-misused-promises`, `@typescript-eslint/no-floating-promises`.

Patterns to apply:

- **Event handlers / callbacks**

  ```ts
  // ❌ Don’t pass async directly
  <button onClick={doAsyncSave}>Save</button>

  // ✅ Wrap and void
  const handleSave = () => {
    void doAsyncSave();
  };

  <button onClick={handleSave}>Save</button>;
  ```

- **Fire‑and‑forget operations**

  ```ts
  // ❌ Floating promise
  setValue(newValue);

  // ✅ Explicit fire‑and‑forget
  void setValue(newValue);
  ```

- **useEffect with async**

  ```ts
  useEffect(() => {
    const run = async () => {
      await apiCall();
    };
    void run();
  }, [apiCall]);
  ```

Never use `eslint-disable` to silence these; always apply one of the above patterns.

---

## 4. Unsafe `any` and Type Safety

Problem rules: `no-explicit-any`, `no-unsafe-argument`, `no-unsafe-assignment`, `no-unsafe-member-access`.

Preferred patterns:

- **Use `unknown` + narrowing instead of `any`:**

  ```ts
  function handleResponse(raw: unknown) {
    if (!raw || typeof raw !== 'object') return;
    const value = (raw as { value?: string }).value ?? '';
    // ...
  }
  ```

- **Model API responses:**

  ```ts
  interface ChatSendResult {
    id: string;
    status: 'queued' | 'sent';
  }

  async function sendMessage(...): Promise<ChatSendResult> {
    const json = (await res.json()) as unknown;
    // validate shape here before using
  }
  ```

- **In tests**, give mocks explicit shapes instead of `as any`, or use `as unknown as SpecificType` when you must coerce.

---

## 5. Tests: How to Add Coverage Without Loosening Rules

Use existing suites as templates:

- Hooks: `apps/web/src/hooks/__tests__`
- Chat status motion: `apps/web/src/effects/chat/status/use-message-status-motion.test.ts`
- Admin flows: `apps/web/src/components/admin/__tests__`

General rules:

- **Always mock external services** with `vi.mock`, not inline `any`:

  ```ts
  vi.mock('@/lib/llm-service', () => ({
    llmService: { llm: vi.fn() },
  }));
  ```

- **Keep tests deterministic**:
  - Use `vi.useFakeTimers()` + `vi.advanceTimersByTime(...)` when timing matters.
  - Avoid random IDs in assertions; mock ID generators (e.g. `generateMessageId`).

- **No config weakening in tests**:
  - Don’t disable ESLint rules; fix async/`any` issues in test code the same way you do in src.

When you introduce a new test file:

1. Start from a similar existing test (same layer: hook/component/effect).
2. Mock all network/LLM/haptics/realtime dependencies.
3. Cover at least:
   - Happy path
   - Error path
   - Any key side‑effects (toasts, haptics, enqueueing, state updates)

---

## 6. Keeping the Web App Green

Use this loop per batch of changes:

1. **Local checks**
   - `pnpm --filter ./apps/web typecheck`
   - `pnpm --filter ./apps/web lint`
   - `pnpm --filter ./apps/web test:run -- <pattern>` (for the area you’re editing)

2. **Before merging / marking an area done**
   - `pnpm --filter ./apps/web test:run`

3. **Periodic full strict pass** (heavier, but ideal before releases)
   - `pnpm --filter ./apps/web strict`

If any command fails, treat it as a **bug to fix in code**, not a reason to relax the configuration.

---

## 7. Current Work Done in This Pass

As part of making chat production‑ready:

- Added `useMessageHandling` hook tests at `apps/web/src/hooks/__tests__/use-message-handling.test.tsx`, covering:
  - Empty‑message guard
  - Message creation/enqueueing
  - Reactions (add/change/remove)
  - LLM translation success + error paths (with proper error handling and toasts)
- Updated `apps/web/src/hooks/use-message-delivery-transition.test.tsx` so it matches the current `useMessageStatusMotion` API (no deprecated fields, no config loosening).

Use these files as patterns for future chat‑related fixes and tests.

