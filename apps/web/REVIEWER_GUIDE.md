# PawfectMatch - App Review Guide
## Quick Reference for App Store & Play Store Reviewers

**App Name**: PawfectMatch  
**Version**: 2.0.0 (Build 100)  
**Category**: Lifestyle > Pets  
**Platforms**: iOS 14+, Android 8.0+ (API 26+)  
**Review Date**: 2024

---

## Test Credentials

### Standard User Account
```
Email: reviewer@pawfectmatch.app
Password: ReviewPass2024!
Role: Standard User + Reviewer Access
```

**Note**: This account has pre-seeded demo content (20+ pet profiles, 5+ matches, sample conversations) and access to the admin console for reviewing moderation features.

---

## Quick Start (3 Minutes)

### Option 1: Browse Without Account
1. Launch app
2. Welcome screen appears
3. Tap **"Explore first"** button
4. You're now in Discovery view with demo pets

### Option 2: Full Account Experience
1. Launch app
2. Welcome screen appears
3. Tap **"Get started"** button
4. Use credentials above to sign in
5. You'll see personalized matches and full features

---

## Core Features to Test

### 1. Discovery (Pet Matching)
**Location**: Main tab "Discover" (sparkle icon)

**How to Test**:
- **Card Swipe**: Drag card left (pass) or right (like)
- **Haptic Feedback**: Feel vibration on each swipe (if device supports)
- **Buttons**: Or use ❌ and ❤️ buttons at bottom
- **Filters**: Tap filter icon (top-right) to set age, size, distance preferences
- **Map View**: Tap "Map" button to switch to map-based discovery
- **Details**: Tap card to see full pet profile with gallery

**Expected**: Smooth animations, no lag, cards stack correctly, compatibility scores visible

---

### 2. Map View (Location Features)
**Location**: Discovery → Tap "Map" button

**How to Test**:
- **Permission**: App requests location (select "While Using App")
- **Markers**: Pet markers appear clustered on map
- **Privacy**: Locations are approximate (snapped to grid), not exact addresses
- **Tap Marker**: Bottom sheet slides up with pet details
- **Like/Pass**: Actions work directly from map view
- **Filters**: Same filters apply to map (age, size, distance)

**Expected**: Coarse location only (never precise), markers grouped, smooth interactions

**Privacy Note**: We NEVER access precise location. All coordinates are privacy-snapped to 500m-1km grid cells.

---

### 3. Matches View
**Location**: Second tab "Matches" (heart icon)

**How to Test**:
- See all matched pets
- Tap match card to see compatibility breakdown
- Chart shows personality, interests, size, age, location scores
- Tap "Chat" button to start conversation
- Tap "Plan Playdate" to see nearby venues (parks, cafés)

**Expected**: All matches load, compatibility charts animate smoothly, venue picker works

---

### 4. Chat & Messaging
**Location**: Third tab "Chat" (chat bubble icon)

**How to Test**:
- **Send Messages**: Type and send text messages
- **Reactions**: Hover over message, tap emoji to react
- **Stickers**: Tap sticker icon, select from 16 pet-themed stickers
- **Voice Notes** (if supported): Long-press mic icon to record
- **Location Sharing**: Tap location icon to share approximate area
- **Typing Indicator**: Open chat on second device to see typing animation
- **Message Templates**: Tap templates icon for quick replies

**Expected**: Messages send instantly, reactions appear inline, stickers animate

---

### 5. Stories (24-Hour Content)
**Location**: Discover tab → Horizontal story rings at top

**How to Test**:
- **View Story**: Tap any story ring with gradient border
- **Progress Bars**: Multiple stories auto-advance every 5 seconds
- **Reactions**: Tap emoji icon, select reaction
- **Reply**: Tap message icon, type reply
- **Create Story** (if logged in): Tap "+" button, upload photo, add caption
- **Save to Highlight**: Long-press story → "Save to Highlight"

**Expected**: Stories feel like Instagram, smooth transitions, 24hr expiration works

---

### 6. Profile & Settings
**Location**: Fourth tab "Profile" (user icon)

**How to Test**:
- **Edit Profile**: Tap "Edit Profile" to modify pet details
- **Stats**: View match count, success rate, profiles viewed
- **Highlights**: Permanent story collections (below stats)
- **Settings**: Access all preferences
  - **Theme**: Toggle light/dark mode (moon/sun icon in header)
  - **Language**: Switch EN ↔ BG (language icon, bottom-left)
  - **Notifications**: Enable/disable push notifications
  - **Account**: Logout, delete account options

**Expected**: Profile saves correctly, theme switches instantly, language changes all UI

---

### 7. Admin Console (Moderation)
**Location**: Shield icon in app header (top-right)

**How to Test**:
- **Dashboard**: System metrics, active users, pending reports
- **Reports**: View user reports, filtering, resolution actions
- **Users**: Search users, view profiles, moderation history
- **Content**: Browse pet profiles for review
- **Audit Log**: Complete history of admin actions
- **Settings**: Feature flags, system configuration

**Expected**: Reviewer has read-only access, can view but not delete/ban

**Note**: This demonstrates moderation capabilities for the review team. In production, only admins/moderators have access.

---

## Localization (EN + BG)

### How to Test
1. Tap language icon (globe/letters icon, usually bottom-left)
2. Select "Български" (Bulgarian)
3. Entire UI switches to Bulgarian
4. Navigate through all screens to verify translation
5. Switch back to "English" to continue testing

**Expected**: All UI text, buttons, errors, and labels translate correctly. No clipping or overflow.

---

## Permissions (Test All)

### 1. Camera
**Trigger**: Profile → Edit → Add Photo → "Take Photo"  
**Prompt**: "PawfectMatch needs camera access to let you take photos of your pet for their profile."  
**Test**: Allow → Camera opens → Take photo → Photo appears  
**Test**: Deny → Friendly message → "Upload from Library" still works

### 2. Photo Library
**Trigger**: Profile → Edit → Add Photo → "Choose from Library"  
**Prompt**: "PawfectMatch needs photo library access to let you choose photos..."  
**Test**: Allow → Photo picker opens → Select photo → Photo appears  
**Test**: Deny → Friendly message → Camera option still available

### 3. Location
**Trigger**: Discovery → Tap "Map" button  
**Prompt**: "PawfectMatch uses your approximate location to show you pets nearby. Your exact location is never shared."  
**Test**: Allow → Map loads with nearby pets  
**Test**: Deny → Friendly message → Card view still works

**Important**: We only request "While Using App" (iOS) and "Coarse Location" (Android). We NEVER access background location or precise coordinates.

### 4. Notifications
**Trigger**: After first match, or Settings → Notifications → Enable  
**Prompt**: "Get notified when you have new matches and messages from other pet owners."  
**Test**: Allow → Notifications enabled, test notification appears  
**Test**: Deny → App works normally, no notifications sent

**Note**: We do NOT track users. No App Tracking Transparency (ATT) prompt on iOS.

---

## Subscriptions & In-App Purchases

### How to Test (Sandbox/Test Mode)
1. Tap "Upgrade to Premium" (crown icon or banner)
2. See paywall with 3 plans: Free, Premium, Elite
3. Select "Premium" → Tap "Start 7-Day Free Trial"
4. **Sandbox payment**: Complete purchase (no real charge)
5. Premium features unlock immediately:
   - Unlimited swipes (vs 50/day free)
   - "Who Liked You" visibility
   - Video calls (if implemented)
   - Advanced filters (breed, personality)
6. Restart app → Subscription persists
7. Tap "Restore Purchases" → Subscription re-syncs

### Subscription Copy
- **Trial**: "7-day free trial, then $9.99/month"
- **Renewal**: "Renews monthly unless canceled 24 hours before period end"
- **Cancel**: "Manage subscription in App Store/Play Store settings"
- **Features**: Listed clearly with checkmarks

### One-Time Purchases
- **Boosts (5-pack)**: $4.99 → Increases profile visibility for 24 hours
- **Super Likes (10-pack)**: $2.99 → Priority message to standout pet

**Expected**: Purchases complete, entitlements grant instantly, restore works, no duplicate charges

---

## Offline Mode

### How to Test
1. Enable Airplane Mode on device
2. Open app → Yellow banner appears: "You're offline. Some features are limited."
3. **Works offline**:
   - Browse previously loaded pets
   - View matches and profiles
   - Draft messages (queued for sending)
4. **Doesn't work offline**:
   - Load new pets (shows cached content only)
   - Send messages (queued until online)
   - Upload photos (queued)
5. Disable Airplane Mode
6. Banner disappears
7. Queued actions process automatically
8. New content loads

**Expected**: Graceful degradation, clear messaging, no crashes, actions queue and sync

---

## Push Notifications & Deep Links

### Test Push Notifications (If Configured)
1. Send test notification:
   - **Type**: "New Match"
   - **Title**: "You matched with Buddy! 🎉"
   - **Body**: "Tap to start chatting"
2. **Test 1 - App Closed**: Tap notification → App launches → Match detail opens
3. **Test 2 - App Backgrounded**: Tap notification → App resumes → Match detail opens
4. **Test 3 - App Foreground**: Notification appears in-app → Tap → Match detail opens

### Test Deep Links
1. Open Safari (iOS) or Chrome (Android)
2. Navigate to: `https://pawfectmatch.app/matches?pet=demo123`
3. Tap "Open in PawfectMatch" (if installed)
4. App opens directly to match detail

**Expected**: Deep links work across all app states, routing is correct

---

## Dark Mode

### How to Test
1. **Method 1**: Tap moon/sun icon in app header (top-right)
2. **Method 2**: System Settings → Display → Dark Mode
3. Verify:
   - All screens adapt (welcome, discover, chat, profile, admin)
   - Text remains readable (contrast checks pass)
   - Buttons, cards, inputs all themed correctly
   - No white flashes or unstyled content

**Expected**: Seamless theme switch, all surfaces styled, good contrast

---

## Accessibility

### Screen Reader (VoiceOver/TalkBack)
1. Enable VoiceOver (iOS: Settings → Accessibility) or TalkBack (Android)
2. Navigate through app with swipe gestures
3. Verify:
   - All buttons have descriptive labels
   - Images have alt text ("Golden Retriever, 3 years old")
   - Focus order is logical (top-to-bottom, left-to-right)
   - Announcements for dynamic content (new messages, matches)

### Reduce Motion
1. Enable Reduce Motion (iOS: Settings → Accessibility → Motion)
2. Navigate app
3. Verify:
   - Animations are minimal or disabled
   - Haptic feedback is disabled
   - Page transitions are instant crossfades (no parallax)

**Expected**: Full accessibility support, no barriers to use

---

## Security & Privacy

### Privacy-First Features
- **Coarse location only**: No precise GPS coordinates ever accessed
- **Privacy snapping**: All locations jittered to 500m-1km grid
- **No tracking**: No IDFA, no cross-app tracking, no ATT prompt
- **Minimal data**: Only email, photos, messages, approximate location
- **No sharing**: Data never sold or shared with third parties
- **Account deletion**: Settings → Account → Delete Account (30-day grace period)

### Data Safety / Privacy Labels
- **Collected**: Email, photos, messages, approximate location, usage data
- **NOT Collected**: Precise location, device IDs, browsing history, financial info
- **Purpose**: Matching algorithm, messaging, service improvement
- **Sharing**: None

**Expected**: Privacy labels in App Store/Play Store match actual behavior

---

## Performance

### Cold Start
1. Force quit app
2. Launch app
3. Time until UI is interactive

**Expected**: < 3 seconds (target: 2-2.5s)

### Scrolling
1. Open Chat with long conversation (500+ messages)
2. Scroll rapidly up and down
3. Observe frame rate

**Expected**: Smooth 60fps, no stuttering, virtualized list

### Memory
1. Use app for 5 minutes: swipe 50 pets, open/close sheets, chat
2. Monitor memory (Instruments/Android Profiler)

**Expected**: Stable 40-80MB, no leaks or unbounded growth

---

## Demo Content (Pre-Seeded)

### Pets
- 20+ pet profiles (dogs, cats, various breeds, ages, personalities)
- Photos, bios, compatibility scores

### Matches
- 5+ pre-existing matches for testing chat/features
- Includes pets like "Buddy" (Golden Retriever), "Whiskers" (Tabby Cat), "Max" (Husky)

### Conversations
- Sample messages in each match
- Reactions, stickers, voice notes (simulated)

### Stories
- 3-5 active stories with < 24hr age
- 2 highlights on demo profile ("Best Moments", "Adventures")

---

## Common Issues & Troubleshooting

### Issue: "No pets found"
**Solution**: Pull down to refresh Discovery view, or switch to Map view.

### Issue: Camera not working
**Solution**: Check Settings → PawfectMatch → Camera permission is enabled.

### Issue: Messages not sending
**Solution**: Check network connection. Messages queue offline and send on reconnect.

### Issue: Subscription not restoring
**Solution**: Tap "Restore Purchases" on paywall. Wait 5-10 seconds for sync.

### Issue: Admin console not appearing
**Solution**: Shield icon is in top-right of header. Tap to open. (Requires reviewer account.)

---

## Feature Flags (For Testing)

If you have admin access, you can toggle features via Admin Console → Settings:

- **Video Calls**: Enable/disable video call feature
- **Story Highlights**: Enable/disable permanent story collections
- **Map Discovery**: Enable/disable map view in discovery
- **AI Photo Analysis**: Enable/disable automatic breed/age detection
- **Push Notifications**: Enable/disable all push notifications

**Note**: These are for demonstration only. In production, flags control gradual rollouts.

---

## Contact & Support

### For Review Questions
**Email**: support@pawfectmatch.app  
**Response Time**: 24-48 hours

### For Critical Issues During Review
**Email**: urgent@pawfectmatch.app  
**Response Time**: 2-4 hours (business hours)

### Documentation
- **Full PRD**: See `PRD.md` in project root
- **Architecture**: See `SYSTEM_ARCHITECTURE.md`
- **Store Submission**: See `STORE_SUBMISSION.md`
- **Mobile Readiness**: See `MOBILE_STORE_READINESS.md`

---

## Review Checklist (For Reviewers)

### Functionality ✅
- [ ] App launches without crashes
- [ ] Core features work (discover, match, chat, profile)
- [ ] Permissions requested appropriately (just-in-time)
- [ ] Offline mode handles gracefully
- [ ] Subscriptions purchase/restore correctly
- [ ] Push notifications route correctly (if tested)
- [ ] Deep links open correct screens

### Content ✅
- [ ] No objectionable content (age-appropriate for 4+)
- [ ] User-generated content has moderation (admin console)
- [ ] Reporting mechanism available
- [ ] Privacy policy and terms of service linked

### Privacy ✅
- [ ] Only coarse location requested (not precise)
- [ ] Permissions have clear usage strings
- [ ] No tracking (no ATT prompt on iOS)
- [ ] Account deletion available and functional
- [ ] Data practices match privacy labels

### Design ✅
- [ ] UI is polished and intuitive
- [ ] No broken layouts on various screen sizes
- [ ] Dark mode works correctly
- [ ] Animations are smooth (or disabled with Reduce Motion)
- [ ] Text is readable (contrast passes WCAG AA)

### Localization ✅
- [ ] App supports EN + BG fully
- [ ] No untranslated strings visible
- [ ] Language switch works correctly
- [ ] Store metadata matches app language

### Performance ✅
- [ ] Cold start < 3 seconds
- [ ] No ANRs or frozen UI
- [ ] Scrolling is smooth (60fps)
- [ ] Memory usage is reasonable

---

## Approval Recommendation

If all items above pass, app is ready for:
- ✅ **App Store approval** (iOS)
- ✅ **Google Play approval** (Android)

**Thank you for reviewing PawfectMatch!** 🐾

---

**End of Reviewer Guide**
