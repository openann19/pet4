# iOS Implementation Strategy: Swift vs React Native

## Feature Inventory & RN Coverage Analysis

| Feature | Library Choice | RN Coverage | Gaps | Decision | Notes |
|---------|---------------|-------------|------|----------|-------|
| **Push Notifications** | `expo-notifications` | ✅ Yes | None | RN-only | APNs integration, badges, foreground handling |
| **Deep Links** | `expo-linking` | ✅ Yes | None | RN-only | Universal Links, Custom URL schemes |
| **Maps** | `react-native-maps` (Apple Maps) | ✅ Yes | None | RN-only | Native iOS MapKit integration |
| **In-App Purchases** | `react-native-iap` | ✅ Yes | Server-side validation | RN-only | App Store Connect integration |
| **Live Streaming / WebRTC** | `react-native-webrtc` + `@livekit/react-native` | ✅ Yes | None | RN-only | WebRTC native iOS support |
| **Chat** | Socket.io + existing | ✅ Yes | None | RN-only | Pure JS/TS; no native code |
| **KYC / Identity Verification** | `@onfido/react-native-sdk` or `react-native-persona` | ⚠️ Partial | May need custom wrapper | **Swift Needed** | Check if provider SDKs have RN wrappers |
| **Background Tasks** | `expo-task-manager` + `expo-background-fetch` | ✅ Yes | Limited to background fetch | RN-only | Background modes configured |
| **Face ID / Touch ID** | `expo-local-authentication` | ✅ Yes | None | RN-only | Biometric authentication |
| **Photo Library** | `expo-image-picker` | ✅ Yes | None | RN-only | Native iOS photo picker |
| **Camera** | `expo-camera` | ✅ Yes | None | RN-only | Native iOS camera |
| **Secure Storage** | `expo-secure-store` | ✅ Yes | None | RN-only | iOS Keychain access |
| **Haptics** | `expo-haptics` | ✅ Yes | None | RN-only | Haptic feedback (iOS 10+) |
| **Sharing** | `expo-sharing` | ✅ Yes | None | RN-only | Native iOS share sheet |

## Decision Matrix

### ✅ **RN-Only Features (No Swift Needed)**

1. **Push Notifications**: `expo-notifications`
   - APNs integration ✅
   - Foreground notifications ✅
   - Badge management ✅
   - Action buttons ✅
   - Notification categories ✅

2. **Deep Links**: `expo-linking`
   - Universal Links ✅
   - Custom URL schemes ✅
   - Associated Domains ✅

3. **Maps**: `react-native-maps`
   - Apple Maps (native) ✅
   - MapKit integration ✅
   - Markers, polygons ✅
   - Geocoding ✅

4. **IAP**: `react-native-iap`
   - App Store Connect ✅
   - Receipt validation (server-side) ✅
   - Subscriptions ✅
   - Family Sharing support ✅

5. **WebRTC/Live**: `react-native-webrtc` + `@livekit/react-native`
   - Peer connections ✅
   - Media streams ✅
   - LiveKit integration ✅

6. **Chat**: Existing socket stack
   - WebSocket connections ✅
   - Message queuing ✅
   - Offline support ✅

7. **Biometrics**: `expo-local-authentication`
   - Face ID ✅
   - Touch ID ✅
   - Passcode fallback ✅

### ⚠️ **Potentially Swift Needed**

1. **KYC Verification** (Priority: High)
   - **Status**: Check `@onfido/react-native-sdk` or `react-native-persona`
   - **If RN wrapper exists**: RN-only ✅
   - **If no RN wrapper**: Create minimal Swift bridge module
   - **Decision**: Try RN wrapper first; fallback to Swift if needed

2. **Advanced Background Modes** (Priority: Low)
   - **Status**: `expo-task-manager` handles background fetch
   - **If foreground service needed**: Swift required
   - **Decision**: Use RN unless proven insufficient

## iOS-Specific Considerations

### App Store Requirements

1. **Privacy Manifest** (iOS 17+)
   - Required for App Store submission
   - Lists required reason APIs
   - Expo handles automatically

2. **App Store Review Guidelines**
   - IAP must use App Store billing
   - Push notifications require user consent
   - Location services require justification
   - Camera/microphone require permissions

3. **Associated Domains**
   - Universal Links setup
   - Entitlements file configuration
   - Apple App Site Association file

### iOS Capabilities

1. **Background Modes**
   - Background fetch
   - Background processing
   - Remote notifications
   - Background location updates

2. **Permissions**
   - Location (Always/When In Use)
   - Camera
   - Microphone
   - Photo Library
   - Notifications

3. **Privacy Features**
   - Tracking Transparency (ATT)
   - Privacy Nutrition Labels
   - Required Reason APIs

## Recommended Implementation Plan

### Phase 1: RN-Only Core (Week 1-2)

```bash
# Install core Expo modules
npx expo install expo-notifications expo-linking expo-location expo-camera expo-image-picker expo-local-authentication expo-secure-store expo-haptics expo-sharing

# Install RN modules
npm install react-native-maps react-native-iap react-native-webrtc @livekit/react-native
```

**Features to implement:**
- ✅ Push notifications with APNs
- ✅ Deep links (Universal Links)
- ✅ Maps integration (Apple Maps)
- ✅ IAP with App Store validation
- ✅ WebRTC calls/live streaming
- ✅ Chat (existing socket stack)
- ✅ Face ID/Touch ID authentication

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
**If no RN wrapper:** Create minimal Swift bridge (see below)

### Phase 3: iOS Polish (Week 3-4)

**RN-Only Polish:**
- ✅ Notification permissions (expo-notifications)
- ✅ Universal Links setup (Associated Domains)
- ✅ App Store metadata (privacy, screenshots)
- ✅ Face ID/Touch ID flow
- ✅ iOS-specific UI (safe area, status bar)
- ✅ Privacy manifest (handled by Expo)

### Phase 4: App Store Prep (Week 4-5)

**Requirements:**
- ✅ App Store Connect setup
- ✅ Privacy Nutrition Labels
- ✅ App preview/screenshots
- ✅ Store listing (EN/BG)
- ✅ TestFlight beta testing
- ✅ App Store Review submission

## Swift Bridge (If Needed)

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
        // Example structure:
        // 1. Initialize SDK with token
        // 2. Start verification flow
        // 3. Return session ID
        
        let result: [String: Any] = [
            "sessionId": "kyc_session_\(Date().timeIntervalSince1970)",
            "status": "started",
            "userId": userId
        ]
        
        resolve(result)
        
        // Emit progress event
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
        
        // TODO: Query SDK for verification status
        let status: [String: Any] = [
            "status": "pending", // pending, verified, rejected
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
        
        // TODO: Cancel SDK session
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

## iOS Configuration Files

### app.json / app.config.js

```json
{
  "expo": {
    "name": "PawfectMatch",
    "slug": "pawfectmatch",
    "version": "1.0.0",
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
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF6B6B",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow PawfectMatch to use your location to show nearby pets."
        }
      ]
    ]
  }
}
```

### Info.plist (iOS-specific)

```xml
<!-- Handled by Expo, but documented for reference -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>PawfectMatch needs location to show nearby pets.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>PawfectMatch needs location to show nearby pets.</string>

<key>NSCameraUsageDescription</key>
<string>PawfectMatch needs camera access to take pet photos.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>PawfectMatch needs photo library access to select pet photos.</string>

<key>NSMicrophoneUsageDescription</key>
<string>PawfectMatch needs microphone access for voice messages.</string>

<key>NSFaceIDUsageDescription</key>
<string>PawfectMatch uses Face ID for secure authentication.</string>
```

## QA Test Plan

### Devices
- iPhone 12-15 (iOS 15-17)
- iPad Air/Pro (tablet support)
- iOS 15, 16, 17

### Scenarios
1. ✅ Push notifications (background, foreground, killed)
2. ✅ Universal Links (cold start, background)
3. ✅ Location denied → fallback UI
4. ✅ Slow network → offline queue
5. ✅ BG long strings → no clipping
6. ✅ IAP purchase → receipt validation
7. ✅ Map rendering → markers, clustering
8. ✅ WebRTC call → audio/video
9. ✅ Face ID/Touch ID → authentication
10. ✅ KYC flow → if implemented

## App Store Readiness

### Privacy Manifest (iOS 17+)
- ✅ Required Reason APIs listed
- ✅ Expo handles automatically
- ✅ Generate via `expo prebuild`

### Privacy Nutrition Labels
- Location data
- Contact info
- User content
- Identifiers
- Diagnostics

### App Store Connect Setup
- App information (EN/BG)
- Screenshots (all device sizes)
- App preview video
- Keywords
- Support URL
- Privacy policy URL

### TestFlight Beta
- Internal testing
- External testing
- Feedback collection

## Final Recommendation

### ✅ **Start RN-Only**

**Rationale:**
- 95%+ of features covered by RN/Expo modules
- KYC is the only potential gap (check RN wrappers first)
- Faster development, easier maintenance
- Cross-platform benefit (reuse Android implementation)

### ⚠️ **Add Swift Only If:**

1. **KYC SDK has no RN wrapper** → Create minimal bridge (50-100 lines)
2. **Advanced background modes needed** → Background tasks wrapper (if RN insufficient)
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

## Summary

| Category | RN Coverage | Swift Needed? |
|----------|-------------|---------------|
| Push Notifications | ✅ 100% | ❌ No |
| Deep Links | ✅ 100% | ❌ No |
| Maps | ✅ 100% | ❌ No |
| IAP | ✅ 100% | ❌ No |
| WebRTC/Live | ✅ 100% | ❌ No |
| Chat | ✅ 100% | ❌ No |
| Face ID/Touch ID | ✅ 100% | ❌ No |
| KYC | ⚠️ 80% | ⚠️ Maybe (check RN wrappers first) |
| Background Tasks | ✅ 90% | ⚠️ Only for advanced modes |

**Verdict: Start RN-only. Add Swift only if KYC requires it.**

## iOS vs Android Comparison

| Feature | iOS RN Coverage | Android RN Coverage | Shared? |
|---------|----------------|---------------------|---------|
| Push Notifications | ✅ 100% | ✅ 100% | ✅ Yes (expo-notifications) |
| Deep Links | ✅ 100% | ✅ 100% | ✅ Yes (expo-linking) |
| Maps | ✅ 100% | ✅ 100% | ✅ Yes (react-native-maps) |
| IAP | ✅ 100% | ✅ 100% | ✅ Yes (react-native-iap) |
| WebRTC | ✅ 100% | ✅ 100% | ✅ Yes (react-native-webrtc) |
| Chat | ✅ 100% | ✅ 100% | ✅ Yes (Socket.io) |
| Biometrics | ✅ 100% | ✅ 100% | ✅ Yes (expo-local-authentication) |
| KYC | ⚠️ 80% | ⚠️ 80% | ✅ Yes (same RN wrappers) |

**Result: 95%+ code reuse between iOS and Android!**

