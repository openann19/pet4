# Directory Structure Analysis

## Executive Summary

**Status:** ⚠️ **STRUCTURE MISMATCH**

The current codebase is a **single-package application** but the system prompt expects a **monorepo architecture**. This document identifies gaps and provides alignment recommendations.

---

## Current Structure

```
/home/ben/Downloads/PETSPARK/
├── package.json                    # Root package.json (minimal, dev dependencies only)
├── pnpm-lock.yaml
├── README.md                       # Minimal
├── pawfectmatch-premium-main/      # Single application package
│   ├── package.json               # Main app (Vite + React)
│   ├── src/
│   │   ├── api/                   # API clients
│   │   ├── components/            # React components
│   │   ├── core/                  # Domain logic & services
│   │   │   ├── domain/            # Domain models
│   │   │   ├── services/          # Business services
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── lib/                   # Utilities
│   │   ├── hooks/                 # React hooks
│   │   ├── types/                 # TypeScript types
│   │   └── styles/                # CSS/styles
│   ├── design-system/             # Design tokens (inline)
│   ├── scripts/                   # Build scripts
│   ├── .github/
│   │   └── workflows/
│   │       └── ci.yml             # Single CI workflow
│   └── public/                    # Static assets
└── src/                           # Additional source (minimal)
    └── lib/
```

**Type:** Single-package Vite application (React + TypeScript)

---

## Expected Structure (Per System Prompt)

```
/home/ben/Downloads/PETSPARK/
├── pnpm-workspace.yaml            # ⚠️ MISSING - Monorepo workspace config
├── package.json                   # Root workspace package.json
├── apps/
│   ├── mobile/                    # ⚠️ MISSING - Expo React Native
│   ├── web/                       # ⚠️ MISSING - Next.js 15
│   ├── admin/                     # ⚠️ MISSING - Next.js Admin
│   └── video-render/              # ⚠️ MISSING - Node + FFmpeg
├── packages/
│   ├── core/                      # ⚠️ MISSING - Core domain logic
│   ├── ui/                        # ⚠️ MISSING - Shared UI components
│   ├── types/                     # ⚠️ MISSING - Shared TypeScript types
│   ├── validation/                # ⚠️ MISSING - Zod schemas
│   ├── analytics/                 # ⚠️ MISSING - Analytics SDK
│   └── design-tokens/             # ⚠️ MISSING - Design system tokens
├── services/
│   ├── backend/                   # ⚠️ MISSING - Node/Express API
│   └── ai-service/                # ⚠️ MISSING - Python/FastAPI
├── infra/
│   ├── docker/                    # ⚠️ MISSING - Docker configs
│   ├── k8s/                       # ⚠️ MISSING - Kubernetes manifests
│   ├── terraform/                 # ⚠️ MISSING - Infrastructure as code
│   └── helm/                      # ⚠️ MISSING - Helm charts
└── .github/
    └── workflows/                 # ⚠️ PARTIAL - Only 1 workflow file
        ├── ci-web.yml
        ├── ci-mobile.yml
        ├── ci-backend.yml
        ├── ci-ai-service.yml
        └── ci-admin.yml
```

**Type:** Monorepo with pnpm workspaces

---

## Gap Analysis

### Critical Missing Elements

| Component | Expected | Current | Status |
|-----------|----------|---------|--------|
| **Monorepo Config** | `pnpm-workspace.yaml` | ❌ Missing | 🔴 CRITICAL |
| **Apps Directory** | `apps/{mobile,web,admin,video-render}` | ❌ Missing | 🔴 CRITICAL |
| **Packages Directory** | `packages/{core,ui,types,validation,analytics,design-tokens}` | ❌ Missing | 🔴 CRITICAL |
| **Services Directory** | `services/{backend,ai-service}` | ❌ Missing | 🔴 CRITICAL |
| **Infra Directory** | `infra/{docker,k8s,terraform,helm}` | ❌ Missing | 🔴 CRITICAL |
| **CI Workflows** | Multiple workflows per app/service | ⚠️ Only 1 workflow | 🟡 PARTIAL |

### Current State Mapping

| Current Location | Equivalent Monorepo Location | Migration Complexity |
|-----------------|------------------------------|---------------------|
| `pawfectmatch-premium-main/src/core/` | `packages/core/src/` | 🟡 Medium |
| `pawfectmatch-premium-main/src/components/ui/` | `packages/ui/src/` | 🟡 Medium |
| `pawfectmatch-premium-main/src/types/` | `packages/types/src/` | 🟢 Low |
| `pawfectmatch-premium-main/src/api/` | `apps/web/src/api/` OR `packages/core/src/api/` | 🟡 Medium |
| `pawfectmatch-premium-main/src/components/` | `apps/web/src/components/` | 🟡 Medium |
| `pawfectmatch-premium-main/design-system/` | `packages/design-tokens/` | 🟢 Low |
| `pawfectmatch-premium-main/.github/workflows/ci.yml` | `.github/workflows/ci-web.yml` | 🟢 Low |

---

## Architecture Alignment Options

### Option 1: Restructure to Monorepo (Recommended)

**Pros:**
- ✅ Matches system prompt expectations
- ✅ Enables code sharing across apps
- ✅ Proper separation of concerns
- ✅ Scalable for multiple apps/services

**Cons:**
- ❌ Requires significant refactoring
- ❌ Migration effort for existing code
- ❌ Need to update all imports
- ❌ CI/CD needs restructuring

**Effort:** High (2-3 days)

**Steps:**
1. Create `pnpm-workspace.yaml`
2. Create directory structure (`apps/`, `packages/`, `services/`, `infra/`)
3. Migrate code to appropriate locations
4. Update imports and dependencies
5. Create per-app/service CI workflows
6. Update build scripts

### Option 2: Keep Current Structure, Document Gap

**Pros:**
- ✅ No migration effort
- ✅ Current code continues working
- ✅ Can adopt monorepo incrementally

**Cons:**
- ❌ Doesn't match system prompt
- ❌ Limited code sharing
- ❌ Harder to scale

**Effort:** Low (documentation only)

### Option 3: Hybrid Approach (Incremental Migration)

**Pros:**
- ✅ Incremental migration
- ✅ Low risk
- ✅ Can test each step

**Cons:**
- ❌ Temporary inconsistency
- ❌ Need careful import management

**Effort:** Medium (1-2 weeks, incremental)

**Steps:**
1. Create `pnpm-workspace.yaml` and base structure
2. Migrate shared code to `packages/` first
3. Create `apps/web/` and migrate gradually
4. Add other apps/services as needed

---

## Recommendations

### Immediate Actions

1. **Decision Point:** Choose migration strategy (Option 1, 2, or 3)

2. **If Option 1 (Full Migration):**
   - Create `docs/MIGRATION_PLAN.md` with detailed steps
   - Create `pnpm-workspace.yaml`
   - Set up directory structure
   - Migrate code incrementally with tests

3. **If Option 2 (Document Only):**
   - Update system prompt to reflect current structure
   - Document what needs to be added for monorepo

4. **If Option 3 (Hybrid):**
   - Start with `packages/core/` migration
   - Migrate `design-system/` to `packages/design-tokens/`
   - Create `apps/web/` skeleton
   - Migrate app code gradually

### Code Quality Gates (Current State)

✅ **Working:**
- TypeScript strict mode
- ESLint configuration
- Vitest tests
- Coverage reporting
- CI workflow (single app)

⚠️ **Missing for Monorepo:**
- Workspace-level scripts (`pnpm -w type-check`, `pnpm -w lint`)
- Per-app/service CI workflows
- Shared package dependencies
- Cross-package type references

---

## Next Steps

1. **User Decision Required:** Choose migration strategy
2. **If migrating:** Create detailed migration plan
3. **If documenting:** Update system prompt expectations
4. **Either way:** Ensure quality gates work at appropriate level

---

## Verification Checklist

After alignment (if Option 1 or 3):

- [ ] `pnpm-workspace.yaml` exists at root
- [ ] `apps/` directory with expected apps
- [ ] `packages/` directory with shared packages
- [ ] `services/` directory with backend services
- [ ] `infra/` directory with infrastructure configs
- [ ] Root `package.json` has workspace scripts
- [ ] Each app/service has own `package.json`
- [ ] Shared packages have proper exports
- [ ] CI workflows exist for each app/service
- [ ] `pnpm -w type-check` passes
- [ ] `pnpm -w lint` passes
- [ ] `pnpm -w build` succeeds
- [ ] Cross-package imports work correctly

---

## Related Documentation

- `ARCHITECTURE.md` - Current architecture documentation
- `docs/PROJECT_CONTEXT.md` - Project context (if exists)
- `docs/ARCHITECTURE_OVERVIEW.md` - Architecture overview (if exists)

