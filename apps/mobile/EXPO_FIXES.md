# Expo Setup Fixes

## Issues Fixed

1. **Removed conflicting lock file**: Removed `package-lock.json` from root (using pnpm, not npm)
2. **Removed problematic packages**:
   - Removed `eas-cli` from devDependencies (should be installed globally or used via `npx`)
   - Removed `@types/react-native` (types are included with react-native package)
3. **Updated Expo version**: Updated from `~51.0.34` to `~51.0.39` to match installed version
4. **Added missing web dependency**: Installed `@expo/metro-runtime@~3.2.3` for web support
5. **Explicit entry point**: Added `main: 'index.js'` to `app.config.ts` for explicit entry point configuration

## Remaining Peer Dependency Warnings

These are warnings and won't prevent the app from running:

- `react-native-screens@~3.31.1` vs expected `>= 4.0.0` for React Navigation packages
- ESLint version mismatches (using ESLint 9, some plugins expect 8)
- React version mismatches across workspace projects

These can be addressed later but don't block development.

## Running Expo

**Important**: Always run Expo commands from the `apps/mobile` directory:

```bash
cd apps/mobile
npx expo start --clear
```

Or for web:
```bash
cd apps/mobile
npx expo start --web
```

## Next Steps

1. Run `npx expo-doctor` again to verify fixes
2. Test web bundling: `npx expo start --web`
3. Test native bundling: `npx expo start`
4. Consider updating `react-native-screens` to v4+ if React Navigation features require it

