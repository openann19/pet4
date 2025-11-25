---
description: audit
auto_execution_mode: 3
---

# 🔥 ULTRA-ENHANCED HOLISTIC DEEP SEMANTIC AUDIT PROTOCOL v3.0

## ⚠️ FAILURE TRIGGERS - INSTANT AUDIT FAILURE

```
❌ ANY file skipped → FAIL
❌ ANY P0/P1 issue unfixed → FAIL
❌ App doesn't start after fixes → FAIL
❌ Report incomplete → FAIL
❌ typecheck has errors → FAIL
❌ lint has warnings → FAIL
❌ Tests regressed → FAIL
❌ "TODO" or placeholder left behind → FAIL
```

---

# 📋 MANDATORY EXECUTION PHASES

You MUST execute ALL phases in STRICT order. NO SKIPPING. NO SHORTCUTS.

---

## PHASE 0: FULL CODEBASE RECONNAISSANCE

**Objective:** Map EVERY file, EVERY dependency, EVERY module before touching anything.

### 0.1 Discover All Workspaces

```bash
# turbo
pnpm -r list --depth=0
```

### 0.2 Map File Tree

Read and catalog EVERY file in these directories:

| Directory | Type | Priority |
|-----------|------|----------|
| `apps/web/src/` | Web Application | P0 |
| `apps/mobile/src/` | Mobile Application | P0 |
| `apps/backend/src/` | Backend Services | P0 |
| `apps/native/` | Native Modules | P1 |
| `packages/core/src/` | Core Logic | P0 |
| `packages/shared/src/` | Shared Utils | P0 |
| `packages/motion/src/` | Animation System | P1 |
| `packages/chat-core/src/` | Chat Engine | P0 |
| `packages/ui-mobile/src/` | Mobile UI | P1 |
| `packages/config/` | Configuration | P1 |
| `packages/spec-*/src/` | Spec Packages | P2 |

### 0.3 Dependency Graph Analysis

For EACH package.json found:
1. List ALL dependencies (prod + dev)
2. Identify version conflicts
3. Map internal workspace references
4. Flag deprecated packages
5. Note security advisories

### 0.4 Configuration Inventory

Read and understand:
- `tsconfig.*.json` - ALL TypeScript configs
- `eslint.config.js` - Lint rules
- `.env*` files - Environment variables
- `vite.config.*` - Build configs
- `tailwind.config.*` - Styling configs
- `package.json` scripts - Available commands

### 0.5 Output Phase 0 Checkpoint

```markdown
## PHASE 0 CHECKPOINT
- Total files discovered: [N]
- Total packages: [N]
- Total dependencies: [N]
- Configuration files: [N]
- Potential conflicts: [LIST]
```

---

## PHASE 1: LINE-BY-LINE SEMANTIC ANALYSIS

**Objective:** Read EVERY file. Analyze EVERY line. Document EVERY issue.

### 1.1 Analysis Categories (MANDATORY FOR EVERY FILE)

| Category | What to Check |
|----------|---------------|
| **Structural Integrity** | Imports valid? Exports correct? Circular deps? |
| **Type Safety** | Any `any`? Null checks? Generic constraints? |
| **Error Handling** | Try/catch present? Errors typed? Recovery paths? |
| **Security** | Input validation? XSS? Injection? Secrets exposed? |
| **Concurrency** | Race conditions? Async/await correct? Promise handling? |
| **Memory** | Leaks? Unbounded growth? Cleanup on unmount? |
| **Performance** | O(n²) loops? Unnecessary re-renders? Memoization? |
| **Accessibility** | ARIA labels? Keyboard nav? Screen reader? |
| **Logging** | Console.* present? Structured logging? Sensitive data? |

### 1.2 Issue Classification System

| Priority | Definition | SLA |
|----------|------------|-----|
| **P0-CRITICAL** | App crashes, security breach, data loss | FIX IMMEDIATELY |
| **P1-SEVERE** | Major feature broken, type errors, test failures | FIX SAME SESSION |
| **P2-MODERATE** | Poor UX, missing validation, code smell | FIX BEFORE COMPLETION |
| **P3-MINOR** | Style issues, naming, minor optimization | FIX IF TIME PERMITS |

### 1.3 File-by-File Protocol

For EACH source file (.ts, .tsx, .js, .jsx):

```
1. READ the entire file (use read_file tool)
2. ANALYZE every:
   - Import statement
   - Type definition
   - Function declaration
   - Hook usage
   - Effect subscription
   - Event handler
   - API call
   - State mutation
   - Error boundary
   - JSX element
3. DOCUMENT issues with:
   - File path
   - Line number
   - Issue category
   - Priority (P0-P3)
   - Root cause
   - Proposed fix
4. MOVE to next file only after completing analysis
```

### 1.4 Issue Tracking Template

```markdown
## ISSUE: [ID]-[PRIORITY]
- **File:** `path/to/file.tsx`
- **Lines:** L42-L55
- **Category:** [Type Safety | Error Handling | Security | ...]
- **Description:** Clear explanation of the issue
- **Root Cause:** Why this issue exists
- **Impact:** What breaks if unfixed
- **Fix:** Exact code changes required
- **Verification:** How to confirm fix works
```

---

## PHASE 2: MODULE-SPECIFIC DEEP DIVE

**Objective:** Trace EVERY code path. Understand EVERY behavior.

### 2.1 Critical Module Audit Checklist

#### Authentication Module (`apps/*/src/auth/`, `packages/*/auth/`)
- [ ] Login flow complete and secure
- [ ] Token refresh implemented
- [ ] Session management correct
- [ ] OAuth providers working
- [ ] Password reset functional
- [ ] MFA if applicable
- [ ] Logout cleans all state

#### API Layer (`apps/*/src/api/`, `packages/core/src/api/`)
- [ ] All endpoints typed
- [ ] Error handling consistent
- [ ] Retry logic implemented
- [ ] Rate limiting respected
- [ ] Request/response logging
- [ ] Timeout handling
- [ ] Cache strategy defined

#### State Management (`apps/*/src/stores/`, `apps/*/src/hooks/`)
- [ ] No prop drilling beyond 2 levels
- [ ] Derived state computed correctly
- [ ] Subscriptions cleaned up
- [ ] Persistence working
- [ ] Hydration correct
- [ ] DevTools integration

#### UI Components (`apps/*/src/components/`)
- [ ] Props fully typed
- [ ] Refs forwarded correctly
- [ ] Accessible (ARIA, keyboard)
- [ ] Responsive design
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Memoization where needed

#### Navigation/Routing
- [ ] All routes defined
- [ ] Guards working
- [ ] Deep links functional
- [ ] History management
- [ ] 404 handling
- [ ] Redirect logic

#### Data Layer (`apps/*/src/services/`)
- [ ] CRUD operations complete
- [ ] Optimistic updates
- [ ] Conflict resolution
- [ ] Offline support
- [ ] Sync mechanism
- [ ] Validation on both ends

### 2.2 Cross-Cutting Concerns

| Concern | Files to Check | Verification |
|---------|---------------|--------------|
| Logging | `*/logger.ts`, `*/logging/*` | Structured, no PII |
| Analytics | `*/analytics/*`, `*/tracking/*` | Events fire, no PII |
| i18n | `*/i18n/*`, `*/locales/*` | All strings translated |
| Theming | `*/theme/*`, `*/tokens/*` | Dark/light works |
| Error Reporting | `*/sentry/*`, `*/error-*` | Captures all errors |

---

## PHASE 3: COMPREHENSIVE FIX PROTOCOL

**Objective:** Fix EVERY issue found. Leave ZERO technical debt.

### 3.1 Fix Execution Order

```
1. P0-CRITICAL → Fix immediately, verify, commit
2. P1-SEVERE → Fix in batch, verify all, commit
3. P2-MODERATE → Fix systematically, verify, commit
4. P3-MINOR → Fix as encountered, batch commit
```

### 3.2 Fix Template (MANDATORY FORMAT)

For each fix:

```typescript
// BEFORE (problematic code)
// File: path/to/file.tsx
// Lines: 42-55
// Issue: [P1] Missing null check causes runtime crash

const userData = response.data; // ❌ response could be null
return userData.name;

// AFTER (fixed code)
// Fix: Added null check with proper fallback

const userData = response?.data;
if (!userData) {
  throw new DataFetchError('Failed to fetch user data', { response });
}
return userData.name; // ✅ Safe access
```

### 3.3 Root Cause Analysis (MANDATORY)

For every P0 and P1 issue:

| Question | Answer Required |
|----------|-----------------|
| What is the immediate cause? | [Describe] |
| What is the root cause? | [Describe] |
| Why wasn't this caught earlier? | [Describe] |
| What systemic fix prevents recurrence? | [Describe] |
| What tests should be added? | [List tests] |

### 3.4 Verification Protocol

After EVERY fix:

```bash
# turbo
pnpm typecheck  # Must pass: 0 errors

# turbo
pnpm lint  # Must pass: 0 warnings

# turbo
pnpm test  # Must pass: no regressions
```

### 3.5 Fix Tracking Table

Maintain running tally:

| Priority | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 0 | 0 | 0 |
| P3 | 0 | 0 | 0 |

**SUCCESS CRITERIA: Remaining P0 = 0, Remaining P1 = 0**

---

## PHASE 4: ENHANCEMENT PROTOCOL

**Objective:** Elevate codebase to production-grade excellence.

### 4.1 Documentation Enhancements

| File Type | Required Documentation |
|-----------|----------------------|
| Components | JSDoc with props, examples, accessibility notes |
| Hooks | Usage example, parameters, return type, side effects |
| Utils | Pure function contract, edge cases |
| Services | API contract, error conditions, retry behavior |
| Types | Property descriptions, constraints |

### 4.2 Logging Enhancements

Replace ALL `console.*` with structured logger:

```typescript
// ❌ BEFORE
console.log('User logged in', userId);

// ✅ AFTER
logger.info('user.login.success', { userId, timestamp: Date.now() });
```

### 4.3 Configuration Enhancements

- [ ] All magic numbers → named constants
- [ ] All hardcoded strings → config/env vars
- [ ] All feature flags → feature flag system
- [ ] All timeouts → configurable values
- [ ] All retries → configurable policies

### 4.4 Robustness Enhancements

| Pattern | Implementation |
|---------|----------------|
| Error Boundaries | Wrap all route-level components |
| Retry Logic | Exponential backoff for API calls |
| Circuit Breaker | For external service calls |
| Timeout Handling | All async operations |
| Graceful Degradation | Feature-level fallbacks |
| Offline Support | Queue mutations, sync on reconnect |

### 4.5 Performance Enhancements

- [ ] React.memo on pure components
- [ ] useMemo for expensive computations
- [ ] useCallback for stable references
- [ ] Code splitting on routes
- [ ] Lazy loading for heavy modules
- [ ] Virtual scrolling for long lists
- [ ] Image optimization
- [ ] Bundle analysis and tree shaking

### 4.6 Security Enhancements

- [ ] Input sanitization on all user inputs
- [ ] Output encoding for XSS prevention
- [ ] CSRF tokens on mutations
- [ ] Rate limiting awareness
- [ ] Secure headers configured
- [ ] No secrets in code
- [ ] Dependency audit clean

---

## PHASE 5: PRODUCTION READINESS CHECKLIST

**Objective:** Verify 100% production readiness.

### 5.1 Functionality Verification

```bash
# Application starts without errors
# turbo
pnpm web-dev  # Web app starts

# turbo
pnpm mobile-start  # Mobile app starts

# All critical paths work:
□ User can register
□ User can login
□ User can logout
□ Core feature 1 works
□ Core feature 2 works
□ Core feature N works
□ Error states display correctly
□ Loading states display correctly
□ Empty states display correctly
```

### 5.2 Quality Gates (ALL MUST PASS)

| Gate | Command | Required Result |
|------|---------|-----------------|
| TypeScript | `pnpm typecheck` | 0 errors |
| ESLint | `pnpm lint` | 0 errors, 0 warnings |
| Tests | `pnpm test` | All passing |
| Build | `pnpm build` | Success |
| Bundle Size | Check output | Under limits |

### 5.3 Performance Targets

| Metric | Target | Verification |
|--------|--------|--------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.0s | Lighthouse |
| Bundle Size (gzipped) | < 500KB | Build output |
| Lighthouse Score | > 90 | Lighthouse audit |

### 5.4 Security Targets

| Check | Tool | Required |
|-------|------|----------|
| Dependency Audit | `pnpm audit` | 0 high/critical |
| Static Analysis | ESLint security | 0 issues |
| Secrets Scan | git-secrets | 0 findings |
| OWASP Top 10 | Manual review | All mitigated |

### 5.5 Stability Targets

| Metric | Target |
|--------|--------|
| Error Rate | < 0.1% |
| Test Coverage | > 80% |
| TypeScript Coverage | 100% |
| No console.* in prod | 0 instances |

---

## PHASE 6: DELIVERABLES

**Objective:** Generate comprehensive audit report with all metrics.

### 6.1 Final Audit Report Structure

```markdown
# 🔥 PETSPARK PRODUCTION AUDIT REPORT
**Date:** [DATE]
**Auditor:** AI Production Audit System
**Version:** [VERSION]

## Executive Summary
- Total files audited: [N]
- Total issues found: [N]
- Total issues fixed: [N]
- Production readiness: [READY/NOT READY]

## Issue Summary by Priority
| Priority | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| P0 | X | X | 0 |
| P1 | X | X | 0 |
| P2 | X | X | X |
| P3 | X | X | X |

## Issue Summary by Category
| Category | Count | Fixed |
|----------|-------|-------|
| Type Safety | X | X |
| Error Handling | X | X |
| Security | X | X |
| Performance | X | X |
| Accessibility | X | X |
| Logging | X | X |

## Quality Gate Results
| Gate | Status | Details |
|------|--------|---------|
| TypeScript | ✅/❌ | X errors |
| ESLint | ✅/❌ | X warnings |
| Tests | ✅/❌ | X/Y passing |
| Build | ✅/❌ | [output] |
| Bundle | ✅/❌ | X KB |

## Performance Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | Xs | <1.5s | ✅/❌ |
| LCP | Xs | <2.5s | ✅/❌ |
| TTI | Xs | <3.0s | ✅/❌ |
| Bundle | XKB | <500KB | ✅/❌ |

## Files Modified
[List all files modified with change summary]

## Recommendations for Next Audit
[List any deferred items or future improvements]

## Verification Commands
```bash
pnpm typecheck  # Expected: 0 errors
pnpm lint       # Expected: 0 warnings
pnpm test       # Expected: all pass
pnpm build      # Expected: success
```
```

### 6.2 Success Criteria

The audit is **COMPLETE** only when:

```
✅ ALL P0 issues: FIXED (0 remaining)
✅ ALL P1 issues: FIXED (0 remaining)
✅ TypeScript: 0 errors
✅ ESLint: 0 errors, 0 warnings
✅ Tests: All passing, no regressions
✅ Build: Successful
✅ App: Starts without errors
✅ Report: Complete and accurate
```

---

# 🚨 ENFORCEMENT RULES

## Never Skip

1. **Never skip a file** - Every .ts/.tsx/.js/.jsx must be read
2. **Never skip an issue** - Every finding must be documented
3. **Never skip verification** - Every fix must be tested
4. **Never leave TODOs** - All code must be production-ready

## Never Assume

1. **Never assume code works** - Verify with tests
2. **Never assume types are correct** - Verify with typecheck
3. **Never assume imports exist** - Verify file exists
4. **Never assume config is valid** - Verify with build

## Always Document

1. **Always document root cause** - Why did this happen?
2. **Always document the fix** - What exactly changed?
3. **Always document verification** - How do we know it's fixed?
4. **Always document impact** - What does this affect?

## Always Verify

After EVERY change:

```bash
# turbo
pnpm typecheck && pnpm lint && pnpm test
```

---

# 📊 PROGRESS TRACKING

Maintain this checklist throughout the audit:

```markdown
## AUDIT PROGRESS

### Phase 0: Reconnaissance
- [ ] All packages discovered
- [ ] All dependencies mapped
- [ ] All configs understood
- [ ] Checkpoint documented

### Phase 1: Analysis
- [ ] apps/web/ analyzed
- [ ] apps/mobile/ analyzed
- [ ] apps/backend/ analyzed
- [ ] packages/core/ analyzed
- [ ] packages/shared/ analyzed
- [ ] packages/motion/ analyzed
- [ ] All other packages analyzed
- [ ] Issue list complete

### Phase 2: Deep Dive
- [ ] Auth module verified
- [ ] API layer verified
- [ ] State management verified
- [ ] UI components verified
- [ ] Navigation verified
- [ ] Data layer verified

### Phase 3: Fixes
- [ ] All P0 fixed
- [ ] All P1 fixed
- [ ] P2 addressed
- [ ] P3 addressed
- [ ] Verification passed

### Phase 4: Enhancements
- [ ] Documentation added
- [ ] Logging improved
- [ ] Config cleaned
- [ ] Robustness added
- [ ] Performance optimized
- [ ] Security hardened

### Phase 5: Readiness
- [ ] App starts
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Metrics met

### Phase 6: Report
- [ ] Report generated
- [ ] Metrics accurate
- [ ] Recommendations listed
- [ ] Sign-off ready
```

---

# ✅ DEFINITION OF DONE

The audit is **DONE** when:

1. **Every file** in the codebase has been read line-by-line
2. **Every issue** has been documented with priority and root cause
3. **Every P0/P1 issue** has been fixed and verified
4. **Zero TypeScript errors** remain
5. **Zero ESLint warnings** remain
6. **All tests pass** with no regressions
7. **The app builds** and starts successfully
8. **The final report** is complete and accurate
9. **No TODO/FIXME/placeholder** code remains
10. **The codebase is production-ready**

---

**⚠️ CRITICAL: This workflow is MANDATORY. Partial completion is FAILURE. Execute ALL phases. Fix ALL issues. Ship production-grade code. No exceptions.**
