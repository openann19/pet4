# Mobile App Release Guide

This guide covers building and releasing the PetSpark mobile app for iOS and Android using Expo Application Services (EAS).

## Prerequisites

- Expo account (sign up at https://expo.dev)
- EAS CLI installed: `npm install -g eas-cli`
- Apple Developer account (for iOS production builds)
- Google Play Console account (for Android production releases)

## Initial Setup

### 1. Login to EAS

```bash
eas login
```

### 2. Configure EAS Project

```bash
cd apps/mobile
eas build:configure
```

This will update `eas.json` with your project ID.

### 3. Configure iOS Credentials (Production)

For production iOS builds, you need to set up credentials:

```bash
eas credentials
```

Follow the prompts to:
- Select iOS platform
- Choose production profile
- Configure Apple Developer account
- Set up provisioning profiles and certificates

### 4. Configure Android Credentials

For Android, EAS can generate a keystore automatically:

```bash
eas credentials
```

Choose Android platform and let EAS generate the keystore, or provide your own.

## Building

### Development Builds

```bash
# iOS Simulator
eas build --platform ios --profile development

# Android APK
eas build --platform android --profile development
```

### Preview Builds (Internal Testing)

```bash
# Both platforms
eas build --platform all --profile preview

# iOS only
eas build --platform ios --profile preview

# Android only
eas build --platform android --profile preview
```

### Production Builds

```bash
# iOS (generates .ipa)
eas build --platform ios --profile production

# Android (generates .aab)
eas build --platform android --profile production
```

## Submitting to App Stores

### iOS (App Store)

1. Build production IPA:
```bash
eas build --platform ios --profile production
```

2. Submit to App Store Connect:
```bash
eas submit --platform ios
```

Or configure automatic submission in `eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### Android (Google Play)

1. Build production AAB:
```bash
eas build --platform android --profile production
```

2. Submit to Google Play:
```bash
eas submit --platform android
```

Or configure automatic submission with service account:
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

## CI/CD Integration

### GitHub Actions

The repository includes GitHub Actions workflows:

- **mobile-ci.yml**: Runs typecheck, lint, and tests on push/PR
- **eas-build.yml**: Triggers EAS builds on tags or manual dispatch

### Setting Up GitHub Secrets

Add these secrets to your GitHub repository:

- `EXPO_TOKEN`: Your Expo access token (get from https://expo.dev/accounts/[username]/settings/access-tokens)

### Triggering Builds via CI

**Manual Dispatch:**
Go to Actions → EAS Build → Run workflow → Select platform and profile

**Tag-based (Automatic):**
```bash
git tag mobile-v1.0.0
git push origin mobile-v1.0.0
```

## Local Development

### Running on iOS Simulator

```bash
cd apps/mobile
expo start
# Press 'i' to open iOS simulator
```

Or:
```bash
expo run:ios
```

### Running on Android Emulator

```bash
cd apps/mobile
expo start
# Press 'a' to open Android emulator
```

Or:
```bash
expo run:android
```

### Running on Web

```bash
cd apps/mobile
expo start --web
```

## Environment Variables

Create `.env` file in `apps/mobile/`:

```env
EXPO_PUBLIC_API_URL=https://api.petspark.com
EXPO_PUBLIC_ENV=development
```

Access in code:
```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

## Troubleshooting

### Build Failures

1. Check EAS build logs:
```bash
eas build:list
eas build:view [build-id]
```

2. Clear cache and rebuild:
```bash
eas build --platform ios --clear-cache
```

### Credential Issues

```bash
# View current credentials
eas credentials

# Reset credentials (careful!)
eas credentials --reset
```

### Local Build Issues

```bash
# Clear Expo cache
expo start -c

# Reset Metro bundler
rm -rf node_modules/.cache
```

## Monitoring

- View builds: https://expo.dev/accounts/[username]/projects/[project-slug]/builds
- View updates: https://expo.dev/accounts/[username]/projects/[project-slug]/updates

## Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Expo Updates](https://docs.expo.dev/guides/over-the-air-updates/)

