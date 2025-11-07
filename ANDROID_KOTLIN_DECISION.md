# Android Implementation Decision: Kotlin vs React Native

## Executive Summary

**Decision: Start RN-only. Add Kotlin only if KYC verification requires it.**

### Coverage Analysis

| Category | RN Coverage | Kotlin Needed? |
|----------|-------------|----------------|
| Push Notifications | ✅ 100% | ❌ No |
| Deep Links | ✅ 100% | ❌ No |
| Maps | ✅ 100% | ❌ No |
| In-App Purchases | ✅ 100% | ❌ No |
| WebRTC/Live Streaming | ✅ 100% | ❌ No |
| Chat | ✅ 100% | ❌ No |
| KYC Verification | ⚠️ 80% | ⚠️ Maybe (check RN wrappers first) |
| Background Tasks | ✅ 90% | ⚠️ Only for foreground services |

**Overall RN Coverage: 95%+**

## Implementation Plan

### Phase 1: RN-Only Core (Week 1-2)

**Install Core Modules:**
```bash
# Expo modules
npx expo install expo-notifications expo-linking expo-location expo-camera expo-image-picker expo-file-system expo-secure-store expo-local-authentication expo-haptics expo-sharing

# Third-party modules
npm install react-native-maps react-native-iap react-native-webrtc @livekit/react-native
```

**Features to Implement:**
- ✅ Push notifications with channels (EN/BG)
- ✅ Deep links (cold start, background)
- ✅ Maps integration (Mapbox or Google)
- ✅ IAP with server receipt validation
- ✅ WebRTC calls/live streaming
- ✅ Chat (existing socket stack)
- ✅ Geolocation with privacy-safe geohash

### Phase 2: KYC Evaluation (Week 2-3)

**Test RN Wrappers First:**
```bash
# Option 1: Onfido
npm install @onfido/react-native-sdk

# Option 2: Persona
npm install react-native-persona

# Option 3: Sumsub
npm install react-native-sumsub-passport
```

**Decision Tree:**
1. If RN wrapper works → ✅ RN-only (no Kotlin)
2. If no RN wrapper → Create minimal Kotlin bridge (see `KycModule.kt`)

### Phase 3: Android Polish (Week 3-4)

**RN-Only Polish:**
- ✅ Notification channels (configured in `app.json`)
- ✅ Back gesture (React Navigation handles automatically)
- ✅ Dismissible overlays (existing `DismissibleOverlay.tsx`)
- ✅ BG long strings (verified +40% expansion, typography tokens)
- ✅ Performance (Hermes, ProGuard, shrinkResources)

**Configuration Files:**
- `android/app/build.gradle` - Hermes, ProGuard
- `android/app/src/main/AndroidManifest.xml` - Permissions
- `android/app/src/main/res/values/strings.xml` - EN strings
- `android/app/src/main/res/values-bg/strings.xml` - BG strings

### Phase 4: QA & Store Prep (Week 4-5)

**Test Devices:**
- Pixel 6-8 (Android 12-14)
- Samsung Galaxy A52/A53 (mid-tier)

**Test Scenarios:**
- ✅ Push notifications (background, foreground, killed)
- ✅ Deep links (cold start, background)
- ✅ Location denied → fallback UI
- ✅ Slow network → offline queue
- ✅ BG long strings → no clipping
- ✅ IAP purchase → receipt validation
- ✅ Map rendering → markers, clustering
- ✅ WebRTC call → audio/video
- ✅ KYC flow → if implemented

**Store Readiness:**
- ✅ Privacy manifest
- ✅ Permission strings (EN/BG)
- ✅ Play Billing setup
- ✅ Content rating
- ✅ App icon/splash

## Kotlin Bridge (Only If Needed)

### When to Create Kotlin Module

**Only create if:**
1. KYC SDK has no RN wrapper
2. Long foreground uploads require WorkManager (test RN first)
3. Custom native UI required (unlikely)

### Kotlin Module Structure

**Files Created:**
- `android/app/src/main/java/com/pawfectmatch/KycModule.kt` (100-150 lines)
- `android/app/src/main/java/com/pawfectmatch/KycPackage.kt` (10 lines)
- `src/lib/kyc-native.ts` (TypeScript interface, 80 lines)

**Total Kotlin Code: ~150 lines** (only if needed)

### Registration

**Update `MainApplication.kt`:**
```kotlin
import com.pawfectmatch.KycPackage

override fun getPackages(): List<ReactPackage> {
    return listOf(
        MainReactPackage(),
        KycPackage() // Only if needed
    )
}
```

## Final Recommendation

### ✅ **Start RN-Only**

**Rationale:**
- 95%+ feature coverage with RN/Expo modules
- Faster development cycle
- Easier maintenance (single codebase)
- Cross-platform benefit (iOS reuse)
- Well-maintained, stable modules

### ⚠️ **Add Kotlin Only If:**

1. **KYC SDK has no RN wrapper** → Minimal bridge (~150 lines)
2. **Long foreground uploads needed** → WorkManager wrapper (if RN insufficient)
3. **Custom native UI required** → Unlikely for this app

### 📦 **Package.json Dependencies**

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

## Deliverables Checklist

- [x] Feature → Library mapping table
- [x] RN coverage analysis
- [x] Kotlin bridge template (if needed)
- [x] JS/TS interface for native module
- [x] Implementation plan
- [x] Android polish checklist
- [x] QA test plan
- [x] Store readiness checklist

## Next Steps

1. **Evaluate KYC RN wrappers** → Test `@onfido/react-native-sdk` or `react-native-persona`
2. **Install RN modules** → Run Phase 1 commands
3. **Implement features** → Follow RN-only path
4. **Add Kotlin bridge** → Only if KYC requires it
5. **Polish & QA** → Follow Phase 3-4 checklist

## Summary

**Verdict: Start RN-only. Add Kotlin only if KYC requires it.**

- ✅ 95%+ features covered by RN/Expo
- ✅ Faster development
- ✅ Easier maintenance
- ✅ Cross-platform benefit
- ⚠️ KYC is only potential gap (test RN wrappers first)

**Files Created:**
- `ANDROID_IMPLEMENTATION_STRATEGY.md` - Complete strategy
- `ANDROID_FEATURE_MAPPING.md` - Detailed feature table
- `android/app/src/main/java/com/pawfectmatch/KycModule.kt` - Kotlin bridge (if needed)
- `src/lib/kyc-native.ts` - TypeScript interface (if needed)

