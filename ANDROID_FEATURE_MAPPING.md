# Android Feature → Library Mapping Table

## Complete Feature Inventory

| Feature | Priority | Library | RN Coverage | Gaps | Decision | Implementation Path |
|---------|----------|---------|-------------|------|----------|-------------------|
| **Push Notifications** | Critical | `expo-notifications` | ✅ Full | None | **RN-only** | Install + configure channels |
| **Deep Links** | Critical | `expo-linking` | ✅ Full | None | **RN-only** | Install + universal links setup |
| **Maps** | Critical | `react-native-maps` (Google) or `@react-native-mapbox/maps` | ✅ Full | None | **RN-only** | Install + Mapbox token |
| **In-App Purchases** | High | `react-native-iap` | ✅ Full | Server validation | **RN-only** | Install + server receipt validation |
| **Live Streaming** | High | `react-native-webrtc` + `@livekit/react-native` | ✅ Full | None | **RN-only** | Install + LiveKit server config |
| **Chat** | Critical | Socket.io (existing) | ✅ Full | None | **RN-only** | No changes needed |
| **KYC Verification** | Medium | `@onfido/react-native-sdk` or `react-native-persona` | ⚠️ Partial | May need bridge | **Check RN first** | Try RN wrapper → Kotlin bridge if needed |
| **Background Tasks** | Low | `expo-task-manager` + `expo-background-fetch` | ✅ 90% | Foreground services | **RN-only** | Use RN unless proven insufficient |
| **Geolocation** | Critical | `expo-location` | ✅ Full | None | **RN-only** | Install + permissions |
| **Camera/Media** | High | `expo-camera` + `expo-image-picker` | ✅ Full | None | **RN-only** | Install + permissions |
| **File Uploads** | High | `expo-file-system` | ✅ Full | None | **RN-only** | Install + upload logic |
| **Biometrics** | Low | `expo-local-authentication` | ✅ Full | None | **RN-only** | Install + auth flow |
| **Secure Storage** | High | `expo-secure-store` | ✅ Full | None | **RN-only** | Install + token storage |
| **Permissions** | Critical | `expo-permissions` | ✅ Full | None | **RN-only** | Install + runtime handling |
| **Haptics** | Medium | `expo-haptics` | ✅ Full | None | **RN-only** | Install + feedback triggers |
| **Sharing** | Low | `expo-sharing` | ✅ Full | None | **RN-only** | Install + share sheet |

## Detailed Analysis

### ✅ **RN-Only Features (No Kotlin)**

#### 1. Push Notifications
- **Library**: `expo-notifications`
- **Coverage**: 100%
- **Features**: Channels, categories, foreground handling, badges, actions
- **Android-Specific**: Notification channels, exact heads-up behavior
- **Implementation**: `expo install expo-notifications` + configure channels

#### 2. Deep Links
- **Library**: `expo-linking`
- **Coverage**: 100%
- **Features**: Universal links, app links, custom schemes, cold start handling
- **Android-Specific**: Android App Links (intent-filter)
- **Implementation**: `expo install expo-linking` + configure intent-filter

#### 3. Maps
- **Library**: `react-native-maps` (Google) or `@react-native-mapbox/maps`
- **Coverage**: 100%
- **Features**: Map rendering, markers, polygons, clustering, geocoding
- **Android-Specific**: Google Maps or Mapbox GL
- **Implementation**: `npm install react-native-maps` + API key

#### 4. In-App Purchases
- **Library**: `react-native-iap`
- **Coverage**: 100% (with server validation)
- **Features**: Google Play Billing, subscriptions, one-time purchases
- **Android-Specific**: Play Billing Library integration
- **Implementation**: `npm install react-native-iap` + server receipt validation

#### 5. WebRTC / Live Streaming
- **Library**: `react-native-webrtc` + `@livekit/react-native`
- **Coverage**: 100%
- **Features**: Peer connections, media streams, live streaming
- **Android-Specific**: WebRTC native implementation
- **Implementation**: `npm install react-native-webrtc @livekit/react-native`

#### 6. Chat
- **Library**: Socket.io (existing implementation)
- **Coverage**: 100%
- **Features**: WebSocket connections, message queuing, offline support
- **Android-Specific**: None (pure JS)
- **Implementation**: No changes needed

#### 7. Background Tasks
- **Library**: `expo-task-manager` + `expo-background-fetch`
- **Coverage**: 90% (periodic tasks)
- **Features**: Periodic background tasks, location updates
- **Android-Specific**: WorkManager integration
- **Implementation**: `expo install expo-task-manager expo-background-fetch`

### ⚠️ **Potentially Kotlin Needed**

#### 1. KYC Verification (Priority: Medium)
- **Libraries to Try**:
  - `@onfido/react-native-sdk` (check if maintained)
  - `react-native-persona` (check if available)
  - `react-native-sumsub-passport` (if Sumsub used)
- **RN Coverage**: 80% (if wrapper exists)
- **Gaps**: May need native SDK bridge
- **Decision**: Try RN wrapper first → Kotlin bridge if needed
- **Implementation Path**:
  1. Test `@onfido/react-native-sdk` or `react-native-persona`
  2. If works → RN-only ✅
  3. If fails → Create minimal Kotlin bridge (see below)

#### 2. Long Foreground Uploads (Priority: Low)
- **Library**: `expo-task-manager` (may be insufficient)
- **RN Coverage**: 90% (periodic tasks only)
- **Gaps**: Foreground services for long uploads
- **Decision**: Use RN unless proven insufficient
- **Implementation Path**: Test RN first → Kotlin WorkManager wrapper if needed

## Kotlin Bridge (If KYC Needed)

### Minimal KYC Module

**File**: `android/app/src/main/java/com/pawfectmatch/KycModule.kt`

```kotlin
package com.pawfectmatch

import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class KycModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "KycModule"
    
    @ReactMethod
    fun startKycSession(config: ReadableMap, promise: Promise) {
        try {
            val userId = config.getString("userId") ?: throw IllegalArgumentException("userId required")
            val token = config.getString("token") ?: throw IllegalArgumentException("token required")
            
            // Bridge to KYC SDK (e.g., Onfido/Persona native SDK)
            // Implementation depends on chosen provider
            
            val result = Arguments.createMap().apply {
                putString("sessionId", "session_123")
                putString("status", "started")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("KYC_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun getKycStatus(userId: String, promise: Promise) {
        try {
            // Check verification status via SDK
            val status = Arguments.createMap().apply {
                putString("status", "verified")
                putString("verificationId", "verify_123")
            }
            promise.resolve(status)
        } catch (e: Exception) {
            promise.reject("KYC_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun addListener(eventName: String) {
        // Setup event listeners for KYC progress
    }
    
    @ReactMethod
    fun removeListeners(count: Int) {
        // Remove event listeners
    }
}
```

**Registration**: `android/app/src/main/java/com/pawfectmatch/MainApplication.kt`

```kotlin
import com.pawfectmatch.KycModule

override fun getPackages(): List<ReactPackage> {
    return listOf(
        MainReactPackage(),
        object : ReactPackage {
            override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
                return listOf(KycModule(reactContext))
            }
            override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
                return emptyList()
            }
        }
    )
}
```

**JS Interface**: `src/lib/kyc-native.ts`

```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';

interface KycConfig {
  userId: string;
  token: string;
  locale?: 'en' | 'bg';
}

interface KycResult {
  sessionId: string;
  status: 'started' | 'completed' | 'failed';
}

interface KycStatus {
  status: 'pending' | 'verified' | 'rejected';
  verificationId?: string;
}

const { KycModule } = NativeModules;

class KycNative {
  private emitter: NativeEventEmitter;

  constructor() {
    this.emitter = new NativeEventEmitter(KycModule);
  }

  async startKycSession(config: KycConfig): Promise<KycResult> {
    return KycModule.startKycSession(config);
  }

  async getKycStatus(userId: string): Promise<KycStatus> {
    return KycModule.getKycStatus(userId);
  }

  onProgress(callback: (progress: number) => void) {
    return this.emitter.addListener('KycProgress', callback);
  }

  onResult(callback: (result: KycResult) => void) {
    return this.emitter.addListener('KycResult', callback);
  }
}

export const kycNative = new KycNative();
```

## Implementation Checklist

### Phase 1: RN-Only Core (Week 1-2)
- [ ] Install Expo modules: `expo-notifications`, `expo-linking`, `expo-location`, `expo-camera`, `expo-image-picker`
- [ ] Install RN modules: `react-native-maps`, `react-native-iap`, `react-native-webrtc`, `@livekit/react-native`
- [ ] Configure notification channels
- [ ] Setup deep links (intent-filter)
- [ ] Configure maps (API key)
- [ ] Test IAP flow
- [ ] Test WebRTC calls

### Phase 2: KYC Evaluation (Week 2-3)
- [ ] Test `@onfido/react-native-sdk` or `react-native-persona`
- [ ] If RN wrapper works → Use RN-only ✅
- [ ] If no RN wrapper → Create Kotlin bridge (see above)

### Phase 3: Android Polish (Week 3-4)
- [ ] Configure notification channels (EN/BG)
- [ ] Test back gesture (React Navigation)
- [ ] Verify BG long strings (no clipping)
- [ ] Enable Hermes + ProGuard
- [ ] Setup permissions (EN/BG strings)
- [ ] Configure Play Billing

### Phase 4: QA & Store Prep (Week 4-5)
- [ ] Test on Pixel 6-8 (Android 12-14)
- [ ] Test on Samsung mid-tier
- [ ] Test notifications (background, foreground, killed)
- [ ] Test deep links (cold start)
- [ ] Test location denied → fallback
- [ ] Test slow network → offline queue
- [ ] Test BG long strings
- [ ] Privacy manifest
- [ ] Store listing (EN/BG)

## Final Recommendation

**Start RN-only. Add Kotlin only if KYC requires it.**

### Why RN-Only?
- ✅ 95%+ feature coverage
- ✅ Faster development
- ✅ Easier maintenance
- ✅ Cross-platform (iOS reuse)
- ✅ Well-maintained modules

### When to Add Kotlin?
- ⚠️ KYC SDK has no RN wrapper → Minimal bridge (50-100 lines)
- ⚠️ Long foreground uploads → WorkManager wrapper (if RN insufficient)
- ⚠️ Custom native UI → Unlikely for this app

### Package.json Additions

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-notifications": "~0.28.0",
    "expo-linking": "~6.3.0",
    "expo-location": "~17.0.0",
    "expo-camera": "~15.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-file-system": "~17.0.0",
    "expo-secure-store": "~13.0.0",
    "expo-local-authentication": "~14.0.0",
    "expo-haptics": "~13.0.0",
    "expo-sharing": "~12.0.0",
    "react-native-maps": "^1.10.0",
    "react-native-iap": "^12.0.0",
    "react-native-webrtc": "^124.0.0",
    "@livekit/react-native": "^2.0.0",
    "@onfido/react-native-sdk": "^9.0.0"
  }
}
```

## Summary Table

| Feature | RN Coverage | Kotlin Needed? | Status |
|---------|-------------|----------------|--------|
| Push Notifications | ✅ 100% | ❌ No | RN-only |
| Deep Links | ✅ 100% | ❌ No | RN-only |
| Maps | ✅ 100% | ❌ No | RN-only |
| IAP | ✅ 100% | ❌ No | RN-only |
| WebRTC/Live | ✅ 100% | ❌ No | RN-only |
| Chat | ✅ 100% | ❌ No | RN-only |
| KYC | ⚠️ 80% | ⚠️ Maybe | Check RN wrappers first |
| Background Tasks | ✅ 90% | ⚠️ Only for foreground | RN-first |

**Verdict: Start RN-only. Add Kotlin only if KYC requires it.**

