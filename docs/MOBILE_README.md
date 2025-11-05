# Mobile Development Guide

This guide covers local development, EAS builds, code signing, and deployment for the Pet3 native mobile applications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [EAS Build Setup](#eas-build-setup)
4. [Android Signing](#android-signing)
5. [iOS Provisioning](#ios-provisioning)
6. [CI/CD Setup](#cicd-setup)
7. [Deployment](#deployment)
8. [Shared Package Integration](#shared-package-integration)
9. [Migration Tips](#migration-tips)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **Expo CLI**: Installed via `npm install -g expo-cli` or use `npx expo`
- **EAS CLI**: Installed via `npm install -g eas-cli`

### Platform-Specific Requirements

#### iOS Development
- macOS with Xcode 14+ installed
- iOS Simulator (included with Xcode)
- Apple Developer account ($99/year) for device testing and App Store distribution

#### Android Development
- Android Studio with Android SDK
- Android Emulator or physical device
- Java Development Kit (JDK) 17

## Local Development

### Initial Setup

1. **Install dependencies from monorepo root:**
   ```bash
   npm install
   ```

2. **Build the shared package:**
   ```bash
   cd packages/shared
   npm run build
   ```

3. **Navigate to native app:**
   ```bash
   cd apps/native
   ```

### Running the App

#### Start Development Server
```bash
npm start
# or
expo start
```

This opens the Expo DevTools in your browser. From there you can:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app on your device

#### Run on Specific Platforms
```bash
npm run ios      # Launch iOS Simulator
npm run android  # Launch Android Emulator
npm run web      # Open in web browser
```

### Development Workflow

1. Make code changes in `apps/native/src/`
2. Changes hot-reload automatically
3. For shared package changes:
   ```bash
   cd ../../packages/shared
   npm run build
   ```
4. Restart the Metro bundler to pick up shared package changes

## EAS Build Setup

### 1. Create Expo Account

1. Sign up at [expo.dev](https://expo.dev)
2. Create a new project or link to existing one
3. Note your project ID

### 2. Configure EAS Project

1. Update `apps/native/app.json`:
   ```json
   "extra": {
     "eas": {
       "projectId": "YOUR_PROJECT_ID_HERE"
     }
   }
   ```

2. Login to EAS:
   ```bash
   cd apps/native
   eas login
   ```

3. Configure the project:
   ```bash
   eas build:configure
   ```

### 3. Update Bundle Identifiers

Update these values in `apps/native/app.json` to match your organization:

- **iOS**: `"ios.bundleIdentifier"`: Change from `com.openann19.pet3` to your identifier
- **Android**: `"android.package"`: Change from `com.openann19.pet3` to your package name

## Android Signing

### Create Android Keystore

1. **Generate a new keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore pet3-release.keystore \
     -alias pet3-key \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Store the keystore securely** (never commit to Git)

3. **Convert keystore to Base64** for GitHub Secrets:
   ```bash
   base64 pet3-release.keystore > keystore.base64.txt
   ```

### Configure EAS for Android

The `apps/native/eas.json` file is already configured to use environment variables for Android signing. The variables are:

- `ANDROID_KEYSTORE_BASE64`: Base64-encoded keystore file
- `ANDROID_KEYSTORE_PASSWORD`: Password for the keystore
- `ANDROID_KEY_ALIAS`: Key alias (e.g., `pet3-key`)
- `ANDROID_KEY_PASSWORD`: Password for the key

### Local Android Build

```bash
cd apps/native
eas build --platform android --profile production --local
```

## iOS Provisioning

### Option 1: EAS Managed (Recommended)

EAS can automatically manage iOS certificates and provisioning profiles:

```bash
cd apps/native
eas build --platform ios --profile production
```

EAS will:
- Create certificates if needed
- Generate provisioning profiles
- Store them securely in EAS servers

### Option 2: Manual Provisioning

1. **Create App ID** in Apple Developer Portal
   - Use bundle identifier from `app.json`

2. **Create Distribution Certificate**
   - Download from Apple Developer Portal
   - Convert to .p12 format

3. **Create Provisioning Profile**
   - Link to App ID and Distribution Certificate

4. **Configure in EAS:**
   ```bash
   eas credentials
   ```

## CI/CD Setup

### Required GitHub Secrets

Configure these secrets in GitHub repository settings (Settings → Secrets → Actions):

#### EAS Authentication
- **`EXPO_TOKEN`**: Your Expo access token
  - Get from: https://expo.dev/accounts/[account]/settings/access-tokens
  - Create a new token with appropriate permissions

#### Android Signing
- **`ANDROID_KEYSTORE_BASE64`**: Base64-encoded keystore file
- **`ANDROID_KEYSTORE_PASSWORD`**: Keystore password
- **`ANDROID_KEY_ALIAS`**: Key alias name
- **`ANDROID_KEY_PASSWORD`**: Key password

#### iOS Signing (if not using EAS managed)
- Managed automatically by EAS or configure manually via `eas credentials`

### GitHub Actions Workflows

Two workflows are provided:

#### 1. CI Workflow (`.github/workflows/ci.yml`)
- Runs on every push/PR to main/develop
- Type checks, lints, and tests all packages
- Does NOT trigger EAS builds (to save build minutes)

#### 2. EAS Build Workflow (`.github/workflows/eas-build.yml`)
- Triggered manually via workflow_dispatch
- Triggered automatically on version tags (v*.*.*)
- Builds Android AAB and iOS IPA
- Uploads artifacts

### Triggering Builds

#### Manual Trigger
1. Go to GitHub Actions tab
2. Select "EAS Build" workflow
3. Click "Run workflow"
4. Select platform and profile

#### Automatic Trigger
Create and push a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Deployment

### Android Deployment

#### 1. Build AAB
```bash
cd apps/native
eas build --platform android --profile production
```

#### 2. Download AAB
- From EAS dashboard: https://expo.dev
- Or use: `eas build:download`

#### 3. Upload to Google Play Console
1. Go to Google Play Console
2. Select your app
3. Navigate to Release → Production
4. Upload the AAB file
5. Complete the release form
6. Submit for review

### iOS Deployment

#### 1. Build IPA
```bash
cd apps/native
eas build --platform ios --profile production
```

#### 2. Submit to App Store
```bash
eas submit --platform ios
```

Or manually:
1. Download IPA from EAS
2. Upload via Transporter app or Xcode
3. Complete App Store Connect listing
4. Submit for review

## Shared Package Integration

### Using Shared Code

The `@pet3/shared` package contains platform-agnostic utilities and types.

#### Import in Native App
```typescript
import { getAppEnvironment, generateCorrelationId } from '@pet3/shared';

const env = getAppEnvironment();
const id = generateCorrelationId();
```

#### Import in Web App
```typescript
import { getAppEnvironment } from '@pet3/shared';
```

### Adding New Shared Code

1. **Add to shared package:**
   ```typescript
   // packages/shared/src/index.ts
   export function myNewUtil() {
     return 'platform-agnostic code';
   }
   ```

2. **Build the package:**
   ```bash
   cd packages/shared
   npm run build
   ```

3. **Use in apps:**
   ```typescript
   import { myNewUtil } from '@pet3/shared';
   ```

### Migration Strategy

When moving code from web to shared:

1. **Identify platform-agnostic logic**
   - Pure functions
   - Business logic
   - Type definitions
   - Utility functions

2. **Avoid platform-specific code**
   - No DOM APIs (document, window)
   - No React Native APIs (Platform, NativeModules)
   - No framework-specific hooks

3. **Extract and test**
   - Move code to `packages/shared/src/`
   - Export from `index.ts`
   - Build and test
   - Update imports in web and native

## Migration Tips

### Incremental Screen Migration

1. Start with simple, read-only screens
2. Implement in `apps/native/src/screens/`
3. Use React Navigation for navigation
4. Style with NativeWind or StyleSheet

### State Management

- Use React Context or state management library
- Keep state logic in shared package when possible
- Platform-specific UI in respective apps

### API Integration

- Move API client to shared package
- Use fetch or axios (works on all platforms)
- Handle platform-specific auth tokens in apps

### Styling Approach

**NativeWind** (Tailwind for React Native):
```typescript
import { View, Text } from 'react-native';

<View className="p-4 bg-blue-500">
  <Text className="text-white">Hello</Text>
</View>
```

**StyleSheet** (Traditional):
```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#3b82f6' }
});
```

## Troubleshooting

### Build Failures

#### "Module not found: @pet3/shared"
- Ensure shared package is built: `cd packages/shared && npm run build`
- Check Metro cache: `cd apps/native && expo start --clear`

#### "Keystore not found"
- Verify GitHub secrets are set correctly
- Check `eas.json` credential configuration

#### "Provisioning profile doesn't match"
- Update bundle identifier in `app.json`
- Run `eas credentials` to reset

### Development Issues

#### Hot Reload Not Working
```bash
expo start --clear
```

#### TypeScript Errors
```bash
cd apps/native
npm run typecheck
```

#### Metro Bundler Issues
```bash
rm -rf node_modules
npm install
expo start --clear
```

### EAS Build Issues

#### "Project ID mismatch"
Update `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "your-correct-project-id"
  }
}
```

#### "Build timeout"
- Increase timeout in workflow file
- Use `--local` flag for local builds
- Check EAS status page

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)
- [EAS Submit Guide](https://docs.expo.dev/submit/introduction/)

## Support

For issues specific to:
- **Expo/EAS**: Check [Expo Forums](https://forums.expo.dev/)
- **Build issues**: Review [EAS Build logs](https://expo.dev)
- **App-specific issues**: Open a GitHub issue in this repository
