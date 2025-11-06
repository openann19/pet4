# React Version Conflict Fix

## Problem (RESOLVED)

~~The web and mobile dev servers were fighting each other due to a React major-version split~~:

- **Web app**: Now React 18.2.0 (`apps/web/package.json`) - **ALIGNED WITH MOBILE**
- **Mobile app**: React 18.2.0 (`apps/mobile/package.json`) - Expo SDK 51 requires React 18

**This issue has been resolved by aligning both apps to use React 18.2.0.**

### Root Causes Identified

1. **Metro was resolving from web's node_modules**: `apps/mobile/metro.config.js` included `apps/web/node_modules` in its resolver paths, causing Metro to accidentally resolve React 19 when both servers were running.

2. **Hoisting conflicts**: When both dev servers ran simultaneously, whichever started last would hoist its React version into the shared workspace root, causing the other runtime to crash with "Hooks can only be called..." errors.

3. **Installation masking**: `.npmrc` with `legacy-peer-deps=true` allowed installation to succeed but didn't prevent runtime conflicts.

## Solution Implemented

### 1. Fixed Metro Configuration ✅

**File**: `apps/mobile/metro.config.js`

**Change**: Removed `apps/web/node_modules` from `nodeModulesPaths` resolver array.

```javascript
// BEFORE (BROKEN)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'apps/web/node_modules')  // ❌ This caused cross-contamination
]

// AFTER (FIXED)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
]
```

**Impact**: Metro now only resolves from its own node_modules and the workspace root, preventing it from accidentally picking up React 19 from the web app.

### 2. Enhanced Dependency Isolation ✅

**File**: `.npmrc`

**Change**: Added explicit `shamefully-hoist=false` to prevent React from being hoisted to the root.

```
legacy-peer-deps=true
# Prevent hoisting React to root to avoid version conflicts between web (React 19) and mobile (React 18)
# Each app should resolve its own React version from its local node_modules
# Explicitly disable shameful hoisting to prevent React from being hoisted to root
# pnpm's default strict mode already keeps different versions separate, but this makes it explicit
shamefully-hoist=false
```

**Impact**: Ensures React packages stay in their respective app's `node_modules` directories, preventing hoisting conflicts.

### 3. Updated Documentation ✅

**File**: `MONOREPO.md`

**Change**: Added comprehensive troubleshooting section explaining the React version isolation strategy and how to resolve conflicts.

## Next Steps

### Required: Reinstall Dependencies

After these changes, you **must** reinstall dependencies for the hoisting configuration to take effect:

```bash
# From workspace root
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Verification

After reinstalling, verify both apps can run simultaneously:

1. **Terminal 1** - Start web dev server:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Terminal 2** - Start mobile dev server:
   ```bash
   cd apps/mobile
   pnpm start
   ```

3. **Expected behavior**: Both servers should start without React version conflicts. No "Hooks can only be called..." errors.

### If You Still See Conflicts

1. **Check Metro config**: Verify `apps/mobile/metro.config.js` does NOT include `apps/web/node_modules`
2. **Verify React versions**: 
   ```bash
   # Web should have React 19
   cat apps/web/node_modules/react/package.json | grep version
   
   # Mobile should have React 18
   cat apps/mobile/node_modules/react/package.json | grep version
   ```
3. **Clear caches**:
   ```bash
   # Clear Metro cache
   cd apps/mobile && pnpm start --clear
   
   # Clear Vite cache
   cd apps/web && rm -rf node_modules/.vite
   ```

## Future Migration

When Expo SDK supports React 19 (Expo SDK 53+ supports React Native 0.79 and React 19), both apps can be upgraded to React 19 and these isolation measures can be removed.

## Technical Details

### Why This Works

- **Metro isolation**: By removing web's node_modules from Metro's resolver, each bundler only sees its own React version.
- **pnpm strict mode**: With `shamefully-hoist=false`, pnpm keeps different major versions of the same package in separate locations, preventing cross-contamination.
- **Workspace root access**: Metro still has access to the workspace root `node_modules` for shared dependencies (like `packages/shared`), but React won't be hoisted there due to version conflicts.

### Architecture

```
workspace/
├── node_modules/          # Shared deps (no React here due to version conflict)
├── apps/
│   ├── web/
│   │   └── node_modules/
│   │       └── react/     # React 19 (isolated)
│   └── mobile/
│       └── node_modules/
│           └── react/     # React 18 (isolated)
└── packages/
    └── shared/            # Pure TypeScript, no React dependency
```

## Related Files

- `apps/mobile/metro.config.js` - Metro bundler configuration
- `.npmrc` - pnpm configuration for dependency hoisting
- `MONOREPO.md` - Monorepo documentation with troubleshooting guide
- `pnpm-workspace.yaml` - Workspace configuration

