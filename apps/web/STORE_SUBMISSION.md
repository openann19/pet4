# App Store Submission Package

## PawfectMatch v1.0.0

### App Metadata (EN + BG)

#### English

**App Name**: PawfectMatch
**Subtitle**: Find Perfect Pet Companions
**Short Description**: AI-powered pet matching for playdates and friendships
**Long Description**:
PawfectMatch helps pet owners discover compatible companions for their furry friends. Using smart matching algorithms, find pets nearby for playdates, walks, and lasting friendships.

Features:
• Smart matching based on personality and interests
• Safe, private messaging between pet owners
• Interactive maps with privacy protection
• Plan playdates at pet-friendly venues
• Real-time chat with match notifications
• Dark mode and bilingual support (EN/BG)

Perfect for dogs, cats, and other social pets looking for companions!

**Keywords**: pet, dog, cat, playdate, match, companion, social, friends, chat

#### Bulgarian (Български)

**App Name**: PawfectMatch
**Subtitle**: Намерете перфектни спътници за любимци
**Short Description**: AI подбор на любимци за игра и приятелство
**Long Description**:
PawfectMatch помага на собствениците на домашни любимци да открият съвместими спътници за техните пухкави приятели. Използвайки интелигентни алгоритми за съвпадение, намерете любимци в близост за срещи за игра, разходки и трайни приятелства.

Функции:
• Интелигентно съвпадение въз основа на личност и интереси
• Сигурен, частен чат между собственици на любимци
• Интерактивни карти със защита на поверителността
• Планиране на срещи в места, приятелски настроени към любимци
• Чат в реално време с известия за съвпадения
• Тъмен режим и двуезична подкрепа (EN/BG)

Перфектно за кучета, котки и други социални любимци, търсещи спътници!

**Keywords**: любимец, куче, котка, среща, съвпадение, спътник, социален, приятели, чат

---

### Privacy Labels

**Data Collected**:

- **Contact Info**: Email (for account creation)
- **User Content**: Photos, messages, pet profiles
- **Location**: Approximate location only (snapped to 500m-1km grid)
- **Usage Data**: App interactions, feature usage analytics

**Data Not Collected**:

- Precise home addresses
- Device identifiers for tracking
- Browsing history
- Financial information (until in-app purchases implemented)

**Data Use**:

- Account authentication
- Matching algorithm
- In-app messaging
- Service improvement

**Data Sharing**: None. Data stays within PawfectMatch.

---

### iOS Usage Strings (EN + BG)

```xml
<!-- English -->
<key>NSCameraUsageDescription</key>
<string>Take photos of your pet to create their profile and share moments with matches.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Choose photos from your library to showcase your pet's personality.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>See pets and pet-friendly places near you. Your exact location is never shared.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>Get notified when you have new matches and messages from other pet owners.</string>

<!-- Bulgarian -->
<key>NSCameraUsageDescription</key>
<string>Направете снимки на вашия любимец, за да създадете профила му и да споделяте моменти със съвпадения.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Изберете снимки от вашата библиотека, за да покажете личността на вашия любимец.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Вижте любимци и места, приятелски настроени към любимци, близо до вас. Точното ви местоположение никога не се споделя.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>Получавайте известия, когато имате нови съвпадения и съобщения от други собственици на любимци.</string>
```

---

### Android Permission Rationales (EN + BG)

```kotlin
// English
CAMERA: "Take photos to create your pet's profile"
READ_EXTERNAL_STORAGE: "Choose photos to showcase your pet"
ACCESS_COARSE_LOCATION: "Find pets near you (approximate area only)"
POST_NOTIFICATIONS: "Stay updated on matches and messages"

// Bulgarian
CAMERA: "Направете снимки, за да създадете профила на вашия любимец"
READ_EXTERNAL_STORAGE: "Изберете снимки, за да покажете вашия любимец"
ACCESS_COARSE_LOCATION: "Намерете любимци близо до вас (само приблизителна зона)"
POST_NOTIFICATIONS: "Бъдете информирани за съвпадения и съобщения"
```

---

### Reviewer Access

**Test Account**:

- Email: reviewer@pawfectmatch.test
- Password: ReviewPass2024!
- Role: Standard user with demo data

**Review Path**:

1. Launch app → Welcome screen appears
2. Tap "Explore first" to browse without account
3. Or tap "Get started" and use test credentials
4. Navigate through Discover, Matches, Map, Chat, Profile tabs
5. All features functional with simulated backend
6. Admin Console accessible via shield icon (top-right)

**Demo Content**: Pre-seeded with 20+ pet profiles, 5+ matches, sample conversations

---

### Release Plan

**Version**: 1.0.0 (Build 1)
**Staged Rollout**:

- Day 1: 10% (internal testing + early adopters)
- Day 3: 50% (monitor crash-free rate ≥ 99.5%)
- Day 7: 100% (full public release)

**Rollback Trigger**: Crash rate > 0.5% or critical bug reports

**Monitoring KPIs**:

- Crash-free sessions ≥ 99.5%
- Cold start time < 3s (median)
- Frame rate ≥ 60fps steady
- API success rate ≥ 99%
- Push notification open rate

---

### Compliance Checklist

✅ Privacy Policy accessible in-app and web
✅ Terms of Service accessible in-app and web
✅ Account deletion available (Profile → Settings → Delete Account)
✅ Data export on request (manual via support)
✅ No tracking without consent
✅ Minimum age requirement: 13+
✅ COPPA compliant (no child-directed content)
✅ GDPR ready (EU users can request data deletion)
✅ Accessibility: VoiceOver/TalkBack compatible, min 44×44px hit areas
✅ Localized for EN + BG markets

---

### Technical Requirements Met

✅ iOS 14.0+ / Android 8.0+ support
✅ Responsive design (phones + tablets)
✅ Offline functionality with sync queue
✅ Dark mode support
✅ Reduced motion respected
✅ Screen reader optimized
✅ Right-to-left layout ready (future Arabic/Hebrew)
✅ Memory stable under stress testing
✅ No deprecated APIs
✅ Privacy-first location (no exact coordinates shared)

---

### Support & Contact

**Support Email**: support@pawfectmatch.app
**Website**: https://pawfectmatch.app
**Privacy Policy**: https://pawfectmatch.app/privacy
**Terms**: https://pawfectmatch.app/terms
