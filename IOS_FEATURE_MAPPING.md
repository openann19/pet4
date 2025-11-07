# iOS Feature → Library Mapping Table

## Complete Feature Inventory

| Feature | Priority | Library | RN Coverage | Gaps | Decision | Implementation Path |
|---------|----------|---------|-------------|------|----------|-------------------|
| **Push Notifications** | Critical | `expo-notifications` | ✅ Full | None | **RN-only** | Install + configure APNs |
| **Deep Links** | Critical | `expo-linking` | ✅ Full | None | **RN-only** | Install + Universal Links setup |
| **Maps** | Critical | `react-native-maps` (Apple Maps) | ✅ Full | None | **RN-only** | Install + MapKit integration |
| **In-App Purchases** | High | `react-native-iap` | ✅ Full | Server validation | **RN-only** | Install + App Store validation |
| **Live Streaming** | High | `react-native-webrtc` + `@livekit/react-native` | ✅ Full | None | **RN-only** | Install + LiveKit server config |
| **Chat** | Critical | Socket.io (existing) | ✅ Full | None | **RN-only** | No changes needed |
| **KYC Verification** | Medium | `@onfido/react-native-sdk` or `react-native-persona` | ⚠️ Partial | May need bridge | **Check RN first** | Try RN wrapper → Swift bridge if needed |
| **Background Tasks** | Low | `expo-task-manager` + `expo-background-fetch` | ✅ 90% | Advanced modes | **RN-only** | Use RN unless proven insufficient |
| **Face ID / Touch ID** | High | `expo-local-authentication` | ✅ Full | None | **RN-only** | Install + auth flow |
| **Geolocation** | Critical | `expo-location` | ✅ Full | None | **RN-only** | Install + permissions |
| **Camera/Media** | High | `expo-camera` + `expo-image-picker` | ✅ Full | None | **RN-only** | Install + permissions |
| **File Uploads** | High | `expo-file-system` | ✅ Full | None | **RN-only** | Install + upload logic |
| **Secure Storage** | High | `expo-secure-store` | ✅ Full | None | **RN-only** | Install + token storage (Keychain) |
| **Permissions** | Critical | `expo-permissions` | ✅ Full | None | **RN-only** | Install + runtime handling |
| **Haptics** | Medium | `expo-haptics` | ✅ Full | None | **RN-only** | Install + feedback triggers |
| **Sharing** | Low | `expo-sharing` | ✅ Full | None | **RN-only** | Install + share sheet |

## iOS-Specific Features

### Biometric Authentication
- **Library**: `expo-local-authentication`
- **Coverage**: 100%
- **Features**: Face ID, Touch ID, Passcode fallback
- **iOS-Specific**: Native iOS biometric APIs
- **Implementation**: `expo install expo-local-authentication`

### Universal Links
- **Library**: `expo-linking`
- **Coverage**: 100%
- **Features**: Associated Domains, App Site Association
- **iOS-Specific**: Requires entitlements + AASA file
- **Implementation**: Configure `associatedDomains` in `app.json`

### Privacy Manifest (iOS 17+)
- **Library**: Expo handles automatically
- **Coverage**: 100%
- **Features**: Required Reason APIs, Privacy Nutrition Labels
- **iOS-Specific**: Required for App Store submission
- **Implementation**: Auto-generated via `expo prebuild`

### App Store Connect Integration
- **Library**: `react-native-iap`
- **Coverage**: 100%
- **Features**: Receipt validation, subscriptions, Family Sharing
- **iOS-Specific**: App Store Connect API
- **Implementation**: `npm install react-native-iap` + server validation

## Detailed Analysis

### ✅ **RN-Only Features (No Swift)**

#### 1. Push Notifications
- **Library**: `expo-notifications`
- **Coverage**: 100%
- **Features**: APNs integration, badges, foreground handling, categories
- **iOS-Specific**: APNs certificates, push notification entitlements
- **Implementation**: `expo install expo-notifications` + APNs setup

#### 2. Deep Links
- **Library**: `expo-linking`
- **Coverage**: 100%
- **Features**: Universal Links, custom URL schemes
- **iOS-Specific**: Associated Domains, App Site Association file
- **Implementation**: `expo install expo-linking` + configure entitlements

#### 3. Maps
- **Library**: `react-native-maps`
- **Coverage**: 100%
- **Features**: Apple Maps (native), MapKit integration, markers, clustering
- **iOS-Specific**: Native iOS MapKit
- **Implementation**: `npm install react-native-maps` + configure

#### 4. In-App Purchases
- **Library**: `react-native-iap`
- **Coverage**: 100% (with server validation)
- **Features**: App Store Connect, subscriptions, receipt validation
- **iOS-Specific**: App Store Connect API, Family Sharing
- **Implementation**: `npm install react-native-iap` + server receipt validation

#### 5. WebRTC / Live Streaming
- **Library**: `react-native-webrtc` + `@livekit/react-native`
- **Coverage**: 100%
- **Features**: Peer connections, media streams, live streaming
- **iOS-Specific**: WebRTC native iOS implementation
- **Implementation**: `npm install react-native-webrtc @livekit/react-native`

#### 6. Chat
- **Library**: Socket.io (existing implementation)
- **Coverage**: 100%
- **Features**: WebSocket connections, message queuing, offline support
- **iOS-Specific**: None (pure JS)
- **Implementation**: No changes needed

#### 7. Face ID / Touch ID
- **Library**: `expo-local-authentication`
- **Coverage**: 100%
- **Features**: Biometric authentication, passcode fallback
- **iOS-Specific**: LocalAuthentication framework
- **Implementation**: `expo install expo-local-authentication`

#### 8. Background Tasks
- **Library**: `expo-task-manager` + `expo-background-fetch`
- **Coverage**: 90% (background fetch, periodic tasks)
- **Features**: Background processing, location updates
- **iOS-Specific**: Background modes in Info.plist
- **Implementation**: `expo install expo-task-manager expo-background-fetch`

### ⚠️ **Potentially Swift Needed**

#### 1. KYC Verification (Priority: Medium)
- **Libraries to Try**:
  - `@onfido/react-native-sdk` (check if maintained)
  - `react-native-persona` (check if available)
  - `react-native-sumsub-passport` (if Sumsub used)
- **RN Coverage**: 80% (if wrapper exists)
- **Gaps**: May need native SDK bridge
- **Decision**: Try RN wrapper first → Swift bridge if needed
- **Implementation Path**:
  1. Test `@onfido/react-native-sdk` or `react-native-persona`
  2. If works → RN-only ✅
  3. If fails → Create minimal Swift bridge (see below)

#### 2. Advanced Background Modes (Priority: Low)
- **Library**: `expo-task-manager` (may be insufficient)
- **RN Coverage**: 90% (periodic tasks only)
- **Gaps**: Foreground services for long uploads
- **Decision**: Use RN unless proven insufficient
- **Implementation Path**: Test RN first → Swift wrapper if needed

## Swift Bridge (If KYC Needed)

### Minimal KYC Module

**File**: `ios/PawfectMatch/KycModule.swift`

```swift
import Foundation
import React

@objc(KycModule)
class KycModule: RCTEventEmitter {
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func supportedEvents() -> [String]! {
        return ["KycProgress", "KycResult"]
    }
    
    @objc
    func startKycSession(_ config: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let userId = config["userId"] as? String,
              let token = config["token"] as? String else {
            reject("INVALID_CONFIG", "userId and token are required", nil)
            return
        }
        
        // TODO: Bridge to KYC SDK (e.g., Onfido/Persona native SDK)
        let result: [String: Any] = [
            "sessionId": "kyc_session_\(Date().timeIntervalSince1970)",
            "status": "started",
            "userId": userId
        ]
        
        resolve(result)
        
        sendEvent(withName: "KycProgress", body: [
            "progress": 0,
            "stage": "initialized"
        ])
    }
    
    @objc
    func getKycStatus(_ userId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard !userId.isEmpty else {
            reject("INVALID_INPUT", "userId cannot be empty", nil)
            return
        }
        
        let status: [String: Any] = [
            "status": "pending",
            "verificationId": "verify_\(userId)",
            "lastUpdated": Date().timeIntervalSince1970
        ]
        
        resolve(status)
    }
    
    @objc
    func cancelKycSession(_ sessionId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard !sessionId.isEmpty else {
            reject("INVALID_INPUT", "sessionId cannot be empty", nil)
            return
        }
        
        resolve(true)
    }
}
```

**Bridge Header**: `ios/PawfectMatch/KycModule.m`

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(KycModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startKycSession:(NSDictionary *)config
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getKycStatus:(NSString *)userId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelKycSession:(NSString *)sessionId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
```

**JS Interface**: Same `kyc-native.ts` as Android (reusable!)

## iOS Configuration

### app.json / app.config.js

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.pawfectmatch.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "PawfectMatch needs location to show nearby pets.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "PawfectMatch needs location to show nearby pets.",
        "NSCameraUsageDescription": "PawfectMatch needs camera access to take pet photos.",
        "NSPhotoLibraryUsageDescription": "PawfectMatch needs photo library access to select pet photos.",
        "NSMicrophoneUsageDescription": "PawfectMatch needs microphone access for voice messages.",
        "NSFaceIDUsageDescription": "PawfectMatch uses Face ID for secure authentication.",
        "ITSAppUsesNonExemptEncryption": false
      },
      "associatedDomains": [
        "applinks:pawfectmatch.com",
        "applinks:*.pawfectmatch.com"
      ],
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

### Entitlements (auto-generated)

```xml
<!-- ios/PawfectMatch/PawfectMatch.entitlements -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:pawfectmatch.com</string>
    <string>applinks:*.pawfectmatch.com</string>
</array>
```

## Implementation Checklist

### Phase 1: RN-Only Core (Week 1-2)
- [ ] Install Expo modules: `expo-notifications`, `expo-linking`, `expo-location`, `expo-camera`, `expo-image-picker`, `expo-local-authentication`
- [ ] Install RN modules: `react-native-maps`, `react-native-iap`, `react-native-webrtc`, `@livekit/react-native`
- [ ] Configure APNs (push notifications)
- [ ] Setup Universal Links (Associated Domains)
- [ ] Configure Apple Maps
- [ ] Test IAP flow
- [ ] Test WebRTC calls
- [ ] Test Face ID/Touch ID

### Phase 2: KYC Evaluation (Week 2-3)
- [ ] Test `@onfido/react-native-sdk` or `react-native-persona`
- [ ] If RN wrapper works → Use RN-only ✅
- [ ] If no RN wrapper → Create Swift bridge (see above)

### Phase 3: iOS Polish (Week 3-4)
- [ ] Configure notification permissions (EN/BG)
- [ ] Setup Universal Links (AASA file)
- [ ] Configure Face ID/Touch ID
- [ ] iOS-specific UI (safe area, status bar)
- [ ] Privacy manifest (auto-generated by Expo)
- [ ] App Store metadata

### Phase 4: App Store Prep (Week 4-5)
- [ ] App Store Connect setup
- [ ] Privacy Nutrition Labels
- [ ] App preview/screenshots
- [ ] Store listing (EN/BG)
- [ ] TestFlight beta testing
- [ ] App Store Review submission

## Final Recommendation

**Start RN-only. Add Swift only if KYC requires it.**

### Why RN-Only?
- ✅ 95%+ feature coverage
- ✅ Faster development
- ✅ Easier maintenance
- ✅ Cross-platform (reuse Android code)
- ✅ Well-maintained modules

### When to Add Swift?
- ⚠️ KYC SDK has no RN wrapper → Minimal bridge (50-100 lines)
- ⚠️ Advanced background modes → Background tasks wrapper (if RN insufficient)
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
    "expo-local-authentication": "~14.0.0",
    "expo-secure-store": "~13.0.0",
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

| Feature | RN Coverage | Swift Needed? | Status |
|---------|-------------|--------------|--------|
| Push Notifications | ✅ 100% | ❌ No | RN-only |
| Deep Links | ✅ 100% | ❌ No | RN-only |
| Maps | ✅ 100% | ❌ No | RN-only |
| IAP | ✅ 100% | ❌ No | RN-only |
| WebRTC/Live | ✅ 100% | ❌ No | RN-only |
| Chat | ✅ 100% | ❌ No | RN-only |
| Face ID/Touch ID | ✅ 100% | ❌ No | RN-only |
| KYC | ⚠️ 80% | ⚠️ Maybe | Check RN wrappers first |
| Background Tasks | ✅ 90% | ⚠️ Only for advanced | RN-first |

**Verdict: Start RN-only. Add Swift only if KYC requires it.**

## iOS vs Android Code Reuse

| Component | iOS | Android | Shared Code |
|-----------|-----|---------|-------------|
| Push Notifications | expo-notifications | expo-notifications | ✅ 100% |
| Deep Links | expo-linking | expo-linking | ✅ 100% |
| Maps | react-native-maps | react-native-maps | ✅ 100% |
| IAP | react-native-iap | react-native-iap | ✅ 100% |
| WebRTC | react-native-webrtc | react-native-webrtc | ✅ 100% |
| Chat | Socket.io | Socket.io | ✅ 100% |
| KYC | kyc-native.ts | kyc-native.ts | ✅ 100% |
| Biometrics | expo-local-authentication | expo-local-authentication | ✅ 100% |

**Result: 95%+ code reuse between iOS and Android!**

