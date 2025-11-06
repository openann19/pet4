# Workspace Commands Quick Reference

## ✅ Setup Complete

- ✅ Killed stray dev servers
- ✅ Workspace root verified: `/home/ben/Public/PETSPARK`
- ✅ pnpm-workspace.yaml configured correctly
- ✅ Package names identified (use these in `--filter`)
- ✅ Build scripts approved
- ✅ Expo peer versions aligned
- ✅ Metro config verified (babel.config.js has Reanimated plugin)

## 📦 Package Names

Use these exact names in `--filter` commands:

- **Mobile**: `petspark-mobile`
- **Web**: `spark-template`
- **Native**: `expo-native-app`
- **Shared**: `@petspark/shared`

## 🚀 Development Commands

### ⚠️ CRITICAL: Always Start from Workspace Root

```bash
# First, ensure you're in the workspace root
cd /home/ben/Public/PETSPARK

# Verify you're in the right place (should show "petspark-monorepo")
pnpm -r list --depth -1 | head -1
```

### From Workspace Root (Recommended)

```bash
# Mobile (Expo)
pnpm mobile-start          # Start Expo dev server
pnpm mobile-android        # Open Android emulator
pnpm mobile-ios           # Open iOS simulator

# Web (Vite)
pnpm web-dev               # Start Vite dev server (stays running)
# OR run directly:
cd apps/web && pnpm dev

# Type checking
pnpm tsc:mobile           # Type check mobile
pnpm tsc:web              # Type check web
```

### Direct Filter Commands

```bash
# Mobile
pnpm --filter petspark-mobile start
pnpm --filter petspark-mobile android
pnpm --filter petspark-mobile ios

# Web
pnpm --filter spark-template dev

# Type checking
pnpm --filter petspark-mobile typecheck
pnpm --filter spark-template typecheck
```

### From App Directories (Still Works)

```bash
cd apps/mobile && pnpm start
cd apps/web && pnpm dev
```

## 🔧 Troubleshooting

### "NOTHING WORKS" / "Command not found"

**Step 1: Verify you're in workspace root**
```bash
cd /home/ben/Public/PETSPARK
pwd  # Should show /home/ben/Public/PETSPARK
```

**Step 2: Run diagnostic script**
```bash
./diagnose-workspace.sh
```

**Step 3: Check package names**
```bash
pnpm -r list --depth -1
# Use EXACT names shown (petspark-mobile, spark-template)
```

**Step 4: Test commands (these should work and stay running)**
```bash
# Web dev server - should start and stay running
pnpm web-dev
# OR: cd apps/web && pnpm dev
# Should see: "VITE v6.4.1 ready" and "Local: http://localhost:5173/"

# Mobile dev server - should start and stay running  
pnpm mobile-start
# OR: cd apps/mobile && pnpm start
# Should see Expo QR code and Metro bundler
```

### "No projects matched the filters"

- **Cause**: Using wrong package name or path, or not in workspace root
- **Fix**: 
  1. Ensure you're in `/home/ben/Public/PETSPARK`
  2. Use exact package name from `pnpm -r list --depth -1`
  3. ✅ Correct: `pnpm --filter petspark-mobile start`
  4. ❌ Wrong: `pnpm --filter './apps/mobile' start`

### Port Conflicts

- **Vite**: Accepts next available port (5177 is fine)
- **Expo**: Accepts next available port (8082 is fine)

### Metro "__esModule/default" Warning

- Metro config is correct (`.cjs` file with CommonJS exports)
- Warning is harmless - Metro is parsing the config correctly

### Android SDK Missing

```bash
# Install Android Studio, then:
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"

# Add to ~/.zshrc for persistence
```

## 📝 Configuration Files

### Workspace Root
- `pnpm-workspace.yaml` - Workspace package locations
- `package.json` - Root scripts and shared dependencies

### Mobile App (`apps/mobile/`)
- `metro.config.cjs` - Metro bundler config (workspace-aware)
- `babel.config.js` - Babel config with Reanimated plugin ✅
- `package.json` - Mobile dependencies (Expo SDK 51)

### Web App (`apps/web/`)
- `vite.config.ts` - Vite configuration
- `package.json` - Web dependencies

## 🎯 Quick Start

```bash
# 1. ALWAYS start from workspace root
cd /home/ben/Public/PETSPARK

# 2. Verify you're in the right place
pwd  # Must be /home/ben/Public/PETSPARK

# 3. Kill any stray dev servers
pkill -f "vite|expo|metro" || true

# 4. Start mobile (in terminal 1)
pnpm mobile-start
# OR: pnpm --filter petspark-mobile start

# 5. Start web (in terminal 2, from root)
pnpm web-dev
# OR: pnpm --filter spark-template dev
```

## 🆘 Still Having Issues?

Run the diagnostic:
```bash
cd /home/ben/Public/PETSPARK
./diagnose-workspace.sh
```

This will show exactly what's working and what's not.

## ✅ Verification Checklist

- [x] Workspace root isolation (no React Native deps at root)
- [x] Mobile app has all Expo/React Native dependencies
- [x] Package names correctly identified
- [x] Scripts work with package names
- [x] Expo peer versions aligned
- [x] Metro config verified
- [x] Babel config has Reanimated plugin

