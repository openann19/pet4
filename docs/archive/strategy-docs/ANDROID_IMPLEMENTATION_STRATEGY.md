# Android Implementation Strategy: Kotlin vs React Native

## Feature Inventory & RN Coverage Analysis

| Feature                         | Library Choice                                              | RN Coverage | Gaps                          | Decision          | Notes                                                                  |
| ------------------------------- | ----------------------------------------------------------- | ----------- | ----------------------------- | ----------------- | ---------------------------------------------------------------------- |
| **Push Notifications**          | `expo-notifications`                                        | ✅ Yes      | None                          | RN-only           | Channels, categories, badges, foreground handling all supported        |
| **Deep Links**                  | `expo-linking`                                              | ✅ Yes      | None                          | RN-only           | Universal links, app links, custom schemes                             |
| **Maps**                        | `react-native-maps` (Google) or `@react-native-mapbox/maps` | ✅ Yes      | None                          | RN-only           | Mapbox GL supported; Google Maps fallback available                    |
| **In-App Purchases**            | `react-native-iap`                                          | ✅ Yes      | Server-side validation needed | RN-only           | RN handles Android billing; backend validates receipts                 |
| **Live Streaming / WebRTC**     | `react-native-webrtc` + `@livekit/react-native`             | ✅ Yes      | None                          | RN-only           | LiveKit SDK has RN wrapper; WebRTC peer connections work               |
| **Chat**                        | Socket.io + existing implementation                         | ✅ Yes      | None                          | RN-only           | Pure JS/TS; no native code needed                                      |
| **KYC / Identity Verification** | `@onfido/react-native-sdk` or `react-native-persona`        | ⚠️ Partial  | May need custom wrapper       | **Kotlin Needed** | Check if provider SDKs have RN wrappers; if not, create minimal bridge |
| **Background Tasks**            | `expo-task-manager` + `expo-background-fetch`               | ✅ Yes      | Limited to periodic tasks     | RN-only           | Foreground services require Kotlin if needed for long uploads          |
| **Advanced Notifications**      | `expo-notifications`                                        | ✅ Yes      | None                          | RN-only           | Rich notifications, actions, categories supported                      |
| **Geolocation**                 | `expo-location`                                             | ✅ Yes      | None                          | RN-only           | Fine/coarse location, background tracking                              |
| **Camera/Media**                | `expo-camera` + `expo-image-picker`                         | ✅ Yes      | None                          | RN-only           | Camera, photo library, video recording                                 |
| **File System**                 | `expo-file-system`                                          | ✅ Yes      | None                          | RN-only           | Read/write files, uploads                                              |
| **Biometrics**                  | `expo-local-authentication`                                 | ✅ Yes      | None                          | RN-only           | Fingerprint, face unlock                                               |
| **Secure Storage**              | `expo-secure-store`                                         | ✅ Yes      | None                          | RN-only           | Keychain/Keystore access                                               |
| **Permissions**                 | `expo-permissions`                                          | ✅ Yes      | None                          | RN-only           | Runtime permission handling                                            |
| **Haptics**                     | `expo-haptics`                                              | ✅ Yes      | None                          | RN-only           | Vibration, haptic feedback                                             |
| **Sharing**                     | `expo-sharing`                                              | ✅ Yes      | None                          | RN-only           | Native share sheet                                                     |

## Decision Matrix

### ✅ **RN-Only Features (No Kotlin Needed)**

1. **Push Notifications**: `expo-notifications`
   - Notification channels ✅
   - Foreground notifications ✅
   - Badge management ✅
   - Action buttons ✅

2. **Deep Links**: `expo-linking`
   - Universal links ✅
   - App links ✅
   - Custom URL schemes ✅

3. **Maps**: `react-native-maps` or `@react-native-mapbox/maps`
   - Map rendering ✅
   - Markers, polygons ✅
   - Geocoding (via existing lib) ✅
   - Distance calculations (JS) ✅

4. **IAP**: `react-native-iap`
   - Google Play Billing ✅
   - Receipt validation (server-side) ✅
   - Subscription management ✅

5. **WebRTC/Live**: `react-native-webrtc` + `@livekit/react-native`
   - Peer connections ✅
   - Media streams ✅
   - LiveKit integration ✅

6. **Chat**: Existing socket stack
   - WebSocket connections ✅
   - Message queuing ✅
   - Offline support ✅

### ⚠️ **Potentially Kotlin Needed**

1. **KYC Verification** (Priority: High)
   - **Status**: Check `@onfido/react-native-sdk` or `react-native-persona`
   - **If RN wrapper exists**: RN-only ✅
   - **If no RN wrapper**: Create minimal Kotlin bridge module
   - **Decision**: Try RN wrapper first; fallback to Kotlin if needed

2. **Long Background Uploads** (Priority: Low)
   - **Status**: `expo-task-manager` handles periodic tasks
   - **If foreground service needed**: Kotlin required
   - **Decision**: Use RN unless proven insufficient

## Recommended Implementation Plan

### Phase 1: RN-Only Core (Week 1-2)

```bash
# Install core RN modules
npx expo install expo-notifications expo-linking expo-location expo-camera expo-image-picker
npm install react-native-maps react-native-iap react-native-webrtc @livekit/react-native
```

**Features to implement:**

- ✅ Push notifications with channels
- ✅ Deep links (cold start, background)
- ✅ Maps integration
- ✅ IAP with server validation
- ✅ WebRTC calls/live streaming
- ✅ Chat (existing socket stack)

### Phase 2: KYC Evaluation (Week 2-3)

**Test RN wrappers first:**

```bash
# Option 1: Onfido
npm install @onfido/react-native-sdk

# Option 2: Persona
npm install react-native-persona

# Option 3: Sumsub (if available)
npm install react-native-sumsub-passport
```

**If RN wrapper works:** ✅ RN-only
**If no RN wrapper:** Create minimal Kotlin bridge (see below)

### Phase 3: Kotlin Bridge (If Needed)

**Only if KYC requires native SDK:**

```kotlin
// android/app/src/main/java/com/pawfectmatch/KycModule.kt
package com.pawfectmatch

import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class KycModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "KycModule"

    @ReactMethod
    fun startKycSession(config: ReadableMap, promise: Promise) {
        // Bridge to KYC SDK (e.g., Onfido/Persona native SDK)
    }

    @ReactMethod
    fun getKycStatus(userId: String, promise: Promise) {
        // Check verification status
    }
}
```

**JS Interface:**

```typescript
// src/lib/kyc-native.ts
import { NativeModules } from 'react-native'

interface KycModule {
  startKycSession(config: KycConfig): Promise<KycResult>
  getKycStatus(userId: string): Promise<KycStatus>
}

export const KycNative = NativeModules.KycModule as KycModule
```

## Android Polish (RN-Only)

### Notification Channels

```typescript
// app.json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#FF6B6B",
      "androidMode": "default",
      "androidCollapsedTitle": "PawfectMatch"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF6B6B",
          "sounds": ["./assets/notification-sound.wav"],
          "mode": "production"
        }
      ]
    ]
  }
}
```

### Back Gesture & Dismissible Overlays

```typescript
// Already implemented: DismissibleOverlay.tsx
// React Navigation handles back gesture automatically
```

### i18n & Typography

```typescript
// BG strings verified for +40% expansion
// Typography tokens defined in src/core/tokens/typography.ts
```

### Performance

```typescript
// android/app/build.gradle
android {
    enableHermes = true
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## QA Test Plan

### Devices

- Pixel 6-8 (Android 12-14)
- Samsung Galaxy A52/A53 (mid-tier)
- Android 12, 13, 14

### Scenarios

1. ✅ Push notifications (background, foreground, killed)
2. ✅ Deep links (cold start, background)
3. ✅ Location denied → fallback UI
4. ✅ Slow network → offline queue
5. ✅ BG long strings → no clipping
6. ✅ IAP purchase → receipt validation
7. ✅ Map rendering → markers, clustering
8. ✅ WebRTC call → audio/video
9. ✅ KYC flow → if implemented

## Store Readiness (RN-Only)

### Privacy Manifest

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Permission Strings (EN/BG)

```xml
<!-- android/app/src/main/res/values/strings.xml -->
<string name="location_permission_title">Location Access</string>
<string name="location_permission_message">PawfectMatch needs location to show nearby pets.</string>

<!-- android/app/src/main/res/values-bg/strings.xml -->
<string name="location_permission_title">Достъп до местоположение</string>
<string name="location_permission_message">PawfectMatch се нуждае от местоположение, за да покаже близки домашни любимци.</string>
```

### Play Billing

- ✅ `react-native-iap` handles Play Billing
- ✅ Server-side receipt validation required
- ✅ Test with Google Play Console sandbox

## Final Recommendation

### ✅ **Start RN-Only**

**Rationale:**

- 95% of features covered by RN/Expo modules
- KYC is the only potential gap (check RN wrappers first)
- Faster development, easier maintenance
- Cross-platform benefit (iOS reuse)

### ⚠️ **Add Kotlin Only If:**

1. **KYC SDK has no RN wrapper** → Create minimal bridge (50-100 lines)
2. **Long foreground uploads needed** → WorkManager wrapper (if RN insufficient)
3. **Custom native UI required** → Unlikely for this app

### 📦 **Package.json Additions**

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-notifications": "~0.28.0",
    "expo-linking": "~6.3.0",
    "expo-location": "~17.0.0",
    "expo-camera": "~15.0.0",
    "react-native-maps": "^1.10.0",
    "react-native-iap": "^12.0.0",
    "react-native-webrtc": "^124.0.0",
    "@livekit/react-native": "^2.0.0",
    "@onfido/react-native-sdk": "^9.0.0"
  }
}
```

## Summary

| Category           | RN Coverage | Kotlin Needed?                     |
| ------------------ | ----------- | ---------------------------------- |
| Push Notifications | ✅ 100%     | ❌ No                              |
| Deep Links         | ✅ 100%     | ❌ No                              |
| Maps               | ✅ 100%     | ❌ No                              |
| IAP                | ✅ 100%     | ❌ No                              |
| WebRTC/Live        | ✅ 100%     | ❌ No                              |
| Chat               | ✅ 100%     | ❌ No                              |
| KYC                | ⚠️ 80%      | ⚠️ Maybe (check RN wrappers first) |
| Background Tasks   | ✅ 90%      | ⚠️ Only for foreground services    |

**Verdict: Start RN-only. Add Kotlin only if KYC requires it.**
