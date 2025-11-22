# Mobile App Testing Script

## PawfectMatch v2.0.0 - Ultra Polish Verification

**Test Date**: \***\*\_\*\***  
**Tester Name**: \***\*\_\*\***  
**Device**: \***\*\_\*\***  
**OS Version**: \***\*\_\*\***  
**Language**: EN / BG (circle one)

---

## Test 1: Visual Polish (No Clipping, No Jank)

### 1.1 Text Clipping (EN + BG)

- [ ] Welcome screen: All text visible, no overflow
- [ ] Pet card long names: Wrap or truncate with ellipsis
- [ ] Chat messages: Long words break correctly
- [ ] Button labels: Fit within button bounds
- [ ] Error messages: Never overflow toast/banner
- [ ] **Switch to BG**: Repeat all above checks
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

### 1.2 Overlay Dismissal

- [ ] Dialog: Tap backdrop → closes
- [ ] Bottom sheet: Swipe down → closes
- [ ] Dropdown: Tap outside → closes
- [ ] Android: Press Back → closes top overlay only
- [ ] Desktop: Press Esc → closes top overlay only
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

### 1.3 Haptic Feedback

- [ ] Swipe card: Feel light haptic
- [ ] Navigate tabs: Feel medium haptic
- [ ] Match celebration: Feel success haptic pattern
- [ ] Purchase complete: Feel success haptic
- [ ] Enable Reduce Motion → No haptics
- [ ] **Result**: PASS / FAIL (or N/A if no haptics)
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

### 1.4 Dark Mode

- [ ] Toggle dark mode in header (moon icon)
- [ ] All screens adapt instantly
- [ ] No white flashes or unstyled elements
- [ ] Text contrast remains readable (AA+)
- [ ] Buttons, cards, inputs all themed
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

---

## Test 2: Performance & Stability

### 2.1 Cold Start

- [ ] Force quit app
- [ ] Launch app
- [ ] **Time to interactive**: **\_** seconds (target: < 3s)
- [ ] **Result**: PASS (< 3s) / FAIL (≥ 3s)

### 2.2 Frame Rate

- [ ] Open Discover, swipe 10 cards rapidly
- [ ] Observe for stuttering or frame drops
- [ ] **Perceived FPS**: 60 / 45-59 / 30-44 / < 30
- [ ] **Result**: PASS (≥ 55fps) / FAIL (< 55fps)

### 2.3 Stress Test

- [ ] Swipe 50 cards in Discover
- [ ] Open/close 20 dialogs
- [ ] Scroll chat with 500 messages
- [ ] **Memory**: Stable / Growing slowly / Leaking
- [ ] **Result**: PASS (stable) / FAIL (leaks)

### 2.4 Crash-Free

- [ ] Use app for 10 minutes
- [ ] Perform all major actions (swipe, chat, map, settings)
- [ ] **Crashes encountered**: **\_** (target: 0)
- [ ] **Result**: PASS (0 crashes) / FAIL (≥ 1 crash)

### 2.5 Error Handling

- [ ] Trigger network error (airplane mode, then refresh)
- [ ] Error message is human-friendly (not "Error 500")
- [ ] Retry button is present
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

---

## Test 3: Internationalization (EN + BG)

### 3.1 Language Switch

- [ ] Tap language icon (bottom-left)
- [ ] Select "Български"
- [ ] **All UI translates**: YES / NO / PARTIAL
- [ ] Navigate through all main screens
- [ ] **Any untranslated strings**: YES / NO
- [ ] **Result**: PASS (all translated) / FAIL

### 3.2 Permission Rationales (BG Mode)

- [ ] Trigger camera permission → Rationale in Bulgarian
- [ ] Trigger location permission → Rationale in Bulgarian
- [ ] Trigger notification permission → Rationale in Bulgarian
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

### 3.3 Accessibility

- [ ] Enable VoiceOver (iOS) or TalkBack (Android)
- [ ] Navigate through paywall
- [ ] Navigate through dialog
- [ ] **All elements have labels**: YES / NO
- [ ] **Focus order is logical**: YES / NO
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

---

## Test 4: Privacy & Permissions

### 4.1 Permission Prompts

- [ ] Camera: Triggers only when "Take Photo" tapped
- [ ] Photos: Triggers only when "Choose Photo" tapped
- [ ] Location: Triggers only when Map view opened
- [ ] Notifications: Triggers after first match or in settings
- [ ] **No premature prompts**: YES / NO
- [ ] **Result**: PASS / FAIL

### 4.2 Pre-Prompt Rationales

- [ ] Camera pre-prompt appears before system prompt
- [ ] Explains why permission is needed
- [ ] Option to cancel without triggering system prompt
- [ ] **Result**: PASS / FAIL
- [ ] **Notes**: **\*\*\*\***\*\***\*\*\*\***\_\_\_**\*\*\*\***\*\***\*\*\*\***

### 4.3 Permission Denial

- [ ] Deny camera → App still works, "Upload" option available
- [ ] Deny location → App still works, card view available
- [ ] Deny notifications → App still works, no prompts
- [ ] **Graceful degradation**: YES / NO
- [ ] **Result**: PASS / FAIL

### 4.4 Location Privacy

- [ ] Open Map view
- [ ] Check permission: "While Using App" (iOS) or "Coarse" (Android)
- [ ] **NO "Always" or "Precise" requested**: Confirmed
- [ ] Markers show approximate area (not exact address)
- [ ] **Result**: PASS / FAIL

---

## Test 5: Subscriptions & Purchases

### 5.1 Purchase Flow

- [ ] Tap "Upgrade to Premium"
- [ ] See paywall with 3 plans
- [ ] Select Premium → "Start 7-Day Free Trial"
- [ ] Complete sandbox/test purchase
- [ ] **Purchase completes**: YES / NO
- [ ] Premium features unlock immediately
- [ ] **Result**: PASS / FAIL

### 5.2 Paywall Copy

- [ ] Trial terms visible: "7-day free trial, then $9.99/month"
- [ ] Renewal info visible: "Renews monthly unless canceled..."
- [ ] Cancel path visible: "Manage in App Store/Play Store"
- [ ] **All info clear**: YES / NO
- [ ] **Result**: PASS / FAIL

### 5.3 Restore Purchases

- [ ] Reinstall app (or logout/login)
- [ ] Tap "Restore Purchases" on paywall
- [ ] Wait 5-10 seconds
- [ ] **Subscription restores**: YES / NO
- [ ] **No duplicate charge**: Confirmed
- [ ] **Result**: PASS / FAIL

### 5.4 Grace Period (Simulated)

- [ ] Trigger failed payment (test mode)
- [ ] Banner appears: "Payment issue. Update payment method."
- [ ] Retry button present
- [ ] Features remain active during grace period
- [ ] **Result**: PASS / FAIL (or N/A if not testable)

---

## Test 6: Push Notifications & Deep Links

### 6.1 Push Opt-In

- [ ] Get first match
- [ ] Notification prompt appears: "Get notified when..."
- [ ] Prompt appears AFTER value is shown (not on launch)
- [ ] **Timing is appropriate**: YES / NO
- [ ] **Result**: PASS / FAIL

### 6.2 Notification Deep Link (App Closed)

- [ ] Force quit app
- [ ] Send test notification: "New match with Buddy"
- [ ] Tap notification
- [ ] **App launches**: YES / NO
- [ ] **Opens correct screen (match detail)**: YES / NO
- [ ] **Result**: PASS / FAIL

### 6.3 Notification Deep Link (App Backgrounded)

- [ ] Background app (home screen)
- [ ] Send test notification: "New message from Max"
- [ ] Tap notification
- [ ] **App resumes**: YES / NO
- [ ] **Opens correct screen (chat room)**: YES / NO
- [ ] **Result**: PASS / FAIL

### 6.4 Notification Deep Link (App Foreground)

- [ ] App is open and visible
- [ ] Send test notification: "Story reply from Whiskers"
- [ ] **In-app notification appears**: YES / NO
- [ ] Tap in-app notification
- [ ] **Opens correct screen (story viewer)**: YES / NO
- [ ] **Result**: PASS / FAIL

---

## Test 7: Offline & Network Resilience

### 7.1 Offline Banner

- [ ] Enable airplane mode
- [ ] **Banner appears**: "You're offline. Some features are limited."
- [ ] Banner is non-intrusive (top banner, not blocking)
- [ ] Disable airplane mode
- [ ] **Banner dismisses**: YES / NO
- [ ] **Result**: PASS / FAIL

### 7.2 Offline Actions Queue

- [ ] Enable airplane mode
- [ ] Swipe to like 3 pets
- [ ] Send 2 chat messages
- [ ] **Actions show as "Queued" or "Pending"**: YES / NO
- [ ] Disable airplane mode
- [ ] Wait 5 seconds
- [ ] **Actions process automatically**: YES / NO
- [ ] **No duplicates**: Confirmed
- [ ] **Result**: PASS / FAIL

### 7.3 Upload Resume

- [ ] Start uploading large photo (or simulate)
- [ ] Enable airplane mode mid-upload
- [ ] **Upload pauses**: YES / NO
- [ ] Disable airplane mode
- [ ] **Upload resumes from last chunk**: YES / NO
- [ ] **Result**: PASS / FAIL (or N/A)

### 7.4 No Zombie Records

- [ ] Start upload
- [ ] Cancel upload
- [ ] Check backend/KV storage
- [ ] **No partial/zombie records**: Confirmed
- [ ] **Result**: PASS / FAIL

---

## Test 8: Maps & Location

### 8.1 Cards | Map Toggle

- [ ] Open Discover view
- [ ] Tap "Map" button (top-right)
- [ ] View switches to map with markers
- [ ] Tap "Cards" button
- [ ] View switches back to card stack
- [ ] **Toggle works smoothly**: YES / NO
- [ ] **Result**: PASS / FAIL

### 8.2 Map Privacy

- [ ] Open Map view
- [ ] Check marker locations
- [ ] **Markers are approximate (not exact addresses)**: YES / NO
- [ ] Tap marker → Bottom sheet shows pet
- [ ] **No precise home addresses visible**: Confirmed
- [ ] **Result**: PASS / FAIL

### 8.3 Venue Picker

- [ ] Go to Matches view
- [ ] Tap a match → "Plan Playdate"
- [ ] See list of pet-friendly venues (parks, cafés, etc.)
- [ ] Tap venue → "Directions"
- [ ] **Opens Maps app**: YES / NO
- [ ] **Result**: PASS / FAIL

### 8.4 Chat Location Sharing

- [ ] Open chat
- [ ] Tap location icon
- [ ] Grant location permission (if needed)
- [ ] Preview map appears
- [ ] **Location is approximate**: YES / NO
- [ ] Tap "Send Location"
- [ ] Recipient sees location bubble in chat
- [ ] Tap bubble → Full map opens
- [ ] **Result**: PASS / FAIL

---

## Test 9: Admin Console (Reviewer Access)

### 9.1 Admin Access

- [ ] Login with reviewer credentials
- [ ] Tap shield icon (top-right header)
- [ ] Admin console opens
- [ ] **Accessible**: YES / NO
- [ ] **Result**: PASS / FAIL

### 9.2 Dashboard

- [ ] View system metrics (users, matches, reports)
- [ ] All metrics display correctly
- [ ] **No errors**: YES / NO
- [ ] **Result**: PASS / FAIL

### 9.3 Reports Management

- [ ] Navigate to Reports tab
- [ ] See list of demo reports
- [ ] Filter by status (pending, resolved)
- [ ] **Read-only mode**: Cannot take destructive actions
- [ ] **Result**: PASS / FAIL

### 9.4 Feature Flags

- [ ] Navigate to Settings tab
- [ ] See list of feature flags
- [ ] Toggle a flag (e.g., "Map Discovery")
- [ ] **Flag state changes**: YES / NO
- [ ] **Result**: PASS / FAIL (or N/A)

---

## Test 10: Store Assets Compliance

### 10.1 App Icon

- [ ] Check home screen icon
- [ ] **Clear at small size (60×60px)**: YES / NO
- [ ] **No text overlay**: YES / NO
- [ ] **Recognizable**: YES / NO
- [ ] **Result**: PASS / FAIL

### 10.2 App Name & Metadata

- [ ] App name in store: "PawfectMatch"
- [ ] Subtitle: "Find Perfect Pet Companions" (EN)
- [ ] **Matches actual app**: YES / NO
- [ ] **Result**: PASS / FAIL

### 10.3 Screenshots

- [ ] Store screenshots show real UI (not mockups)
- [ ] Localized captions (EN + BG)
- [ ] **10 screenshots present**: YES / NO
- [ ] **Result**: PASS / FAIL

### 10.4 Privacy Labels

- [ ] Privacy labels in store match actual data collection
- [ ] **Data collected**: Email, photos, messages, approximate location
- [ ] **Data NOT collected**: Precise location, device IDs, browsing history
- [ ] **Accurate**: YES / NO
- [ ] **Result**: PASS / FAIL

### 10.5 Account Deletion

- [ ] Settings → Account → "Delete Account"
- [ ] Confirmation dialog appears
- [ ] **Deletion path is discoverable**: YES / NO
- [ ] **Result**: PASS / FAIL

---

## Overall Test Results

### Summary

- **Total Tests**: 60
- **Passed**: **\_** / 60
- **Failed**: **\_** / 60
- **N/A**: **\_** / 60
- **Pass Rate**: **\_**% (target: ≥ 95%)

### Critical Issues (Block Submission)

1. ***
2. ***
3. ***

### Non-Critical Issues (Can Ship With)

1. ***
2. ***
3. ***

### Recommendations

- [ ] **APPROVE FOR SUBMISSION** (≥ 95% pass rate, no critical issues)
- [ ] **FIX AND RETEST** (< 95% pass rate or critical issues present)
- [ ] **NEEDS CLARIFICATION** (see notes)

### Tester Sign-Off

**Name**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***  
**Date**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***  
**Signature**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***

---

**End of Testing Script**
