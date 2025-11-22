# Premium Notification System

## Overview

PawfectMatch features an enterprise-grade, premium notification system with advanced features including notification grouping, rich media support, priority levels, quiet hours, archiving, and sophisticated filtering.

## Features

### ✨ Premium Features

- **Smart Grouping**: Automatically groups similar notifications for a cleaner inbox
- **Rich Media Support**: Images, avatars, and custom media in notifications
- **Priority Levels**: 5 priority levels (low, normal, high, urgent, critical) with visual indicators
- **Archiving**: Archive notifications for later review without deleting them
- **Advanced Filtering**: Filter by read/unread, category, time periods, and more
- **Quiet Hours**: Configurable do-not-disturb mode
- **Collapsible Groups**: Expand/collapse notification groups for better organization
- **Time Grouping**: Automatic grouping by Today, Yesterday, This Week, Earlier
- **Preferences**: User-configurable notification settings
- **Achievement System**: Special achievement notifications with badges
- **Social Features**: Integrated social activity notifications
- **Event Notifications**: Location-based event reminders

### 🎨 Premium UI/UX

- **Glassmorphic Design**: Modern glass-effect styling
- **Smooth Animations**: Framer Motion powered micro-interactions
- **Responsive Layout**: Optimized for mobile and desktop
- **Haptic Feedback**: Tactile responses on interactions
- **Visual Priority Indicators**: Color-coded borders and backgrounds
- **Pulsing Animations**: Critical notifications pulse to demand attention
- **Expandable Content**: Rich content revealed on demand
- **Smart Empty States**: Contextual messages when no notifications exist

### 📱 Notification Types

1. **Match** - New pet matches with compatibility scores
2. **Message** - Chat messages with previews
3. **Like** - Profile likes and interest notifications
4. **Verification** - Pet verification status updates
5. **Story** - New stories from connections
6. **Moderation** - Moderation actions and warnings
7. **Achievement** - Gamification achievements and milestones
8. **Social** - Social interactions and follows
9. **Event** - Location-based events and meetups
10. **System** - Important system announcements

## Installation

The premium notification system is ready to use. Simply import and add to your app:

```tsx
import { PremiumNotificationBell } from '@/components/notifications';

// In your app header
<PremiumNotificationBell />;
```

## Usage

### Creating Notifications

```typescript
import {
  createMatchNotification,
  createMessageNotification,
  createLikeNotification,
  createVerificationNotification,
  createStoryNotification,
  createModerationNotification,
  createAchievementNotification,
  createSocialNotification,
  createEventNotification,
  createSystemNotification,
} from '@/lib/premium-notifications';

// Match notification with compatibility score
await createMatchNotification(
  'Buddy', // Your pet name
  'Max', // Matched pet name
  'match-123', // Match ID
  95, // Compatibility score (optional)
  '/avatar/max.jpg' // Avatar URL (optional)
);

// Message notification
await createMessageNotification(
  'Sarah', // Sender name
  'Hey! Would love to set up a playdate!',
  'room-456', // Chat room ID
  '/avatar/sarah.jpg' // Avatar URL (optional)
);

// Like notification (single or grouped)
await createLikeNotification(
  'Luna', // Pet name
  1, // Count (1 for single, >1 for multiple)
  '/avatar/luna.jpg' // Avatar URL (optional)
);

// Verification notification
await createVerificationNotification(
  'approved', // Status: 'approved' | 'rejected' | 'pending'
  'Charlie' // Pet name
);

// Story notification
await createStoryNotification(
  'Mike', // Username
  1, // Count
  '/avatar/mike.jpg', // Avatar URL (optional)
  '/story/preview.jpg' // Story preview image (optional)
);

// Moderation notification
await createModerationNotification(
  'Content Removed', // Title
  'Inappropriate language detected',
  'urgent' // Priority (optional, defaults to 'urgent')
);

// Achievement notification
await createAchievementNotification(
  'Super Matcher', // Achievement name
  '10 successful matches',
  'super-matcher', // Badge ID (optional)
  '/badges/matcher.png' // Badge image (optional)
);

// Social notification
await createSocialNotification(
  'New Follower', // Title
  'Emma started following you',
  'Emma', // Username (optional)
  '/avatar/emma.jpg' // Avatar URL (optional)
);

// Event notification
await createEventNotification(
  'Dog Park Meetup', // Event name
  'Join us this Saturday at 3 PM',
  'Central Park', // Location (optional)
  '/events/meetup.jpg' // Event image (optional)
);

// System notification
await createSystemNotification(
  'Maintenance Scheduled',
  'System will be down Sunday at 2 AM EST',
  'high' // Priority (optional, defaults to 'normal')
);
```

### Advanced: Grouped Notifications

Create multiple related notifications that automatically group together:

```typescript
import { createGroupedNotifications } from '@/lib/premium-notifications';

// Create grouped story notifications
await createGroupedNotifications(
  'story', // Notification type
  [
    { name: 'Mike', avatarUrl: '/avatar/mike.jpg' },
    { name: 'Sarah', avatarUrl: '/avatar/sarah.jpg' },
    { name: 'John', avatarUrl: '/avatar/john.jpg' },
  ],
  'posted a story' // Base message
);
```

### Managing Notifications

```typescript
import {
  markNotificationAsRead,
  archiveNotification,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  getUrgentNotifications,
} from '@/lib/premium-notifications';

// Mark as read
await markNotificationAsRead('notification-id');

// Archive notification
await archiveNotification('notification-id');

// Delete notification
await deleteNotification('notification-id');

// Clear all notifications
await clearAllNotifications();

// Get unread count
const unreadCount = await getUnreadCount();

// Get urgent notifications
const urgent = await getUrgentNotifications();
```

## Priority Levels

### Critical (Level 5)

- **Use for**: Security alerts, account warnings, payment failures
- **Behavior**: Pulsing red border, continuous animation, top of list
- **Visual**: Red gradient bar, pulsing glow effect
- **Example**: "Account Security Alert"

### Urgent (Level 4)

- **Use for**: Time-sensitive actions, moderation warnings, report outcomes
- **Behavior**: Animated top bar, pulsing icon, prominent display
- **Visual**: Red border, gradient animation
- **Example**: "Content Removed"

### High (Level 3)

- **Use for**: New matches, verification approvals, achievements
- **Behavior**: Accent-colored border, prominent placement
- **Visual**: Accent color accent, slightly elevated
- **Example**: "New Match Found!"

### Normal (Level 2)

- **Use for**: Messages, likes, social interactions
- **Behavior**: Standard display, primary border
- **Visual**: Standard styling, regular placement
- **Example**: "New Message from Sarah"

### Low (Level 1)

- **Use for**: Stories, non-urgent updates, promotional content
- **Behavior**: Subtle display, bottom of category
- **Visual**: Muted styling, minimal emphasis
- **Example**: "New Story from Mike"

## Notification Preferences

Users can configure their notification experience:

### Quiet Hours

- Enable/disable quiet hours
- Set start and end times
- Notifications still arrive but won't trigger sounds/haptics

### Grouping

- Toggle smart grouping on/off
- Grouped notifications collapse similar items
- Individual access available via expand

### Previews

- Show/hide message previews
- Privacy option for sensitive content
- Affects message and content previews

### Sound & Haptics

- Enable/disable notification sounds
- Toggle haptic feedback
- Per-notification-type settings (future)

## Best Practices

### When to Send Notifications

✅ **DO send for:**

- Real-time actions that require immediate attention (matches, messages)
- Status changes that affect the user (verification, moderation)
- Achievements and milestones that delight
- Time-sensitive events and opportunities
- Security and account-related information

❌ **DON'T send for:**

- Every minor interaction or action
- User's own actions (liking their own content)
- Routine background operations
- Overly frequent updates (implement rate limiting)
- Marketing content without opt-in

### Notification Copy Guidelines

1. **Be Concise**: Keep titles under 50 characters
2. **Be Specific**: Use names and details ("Max liked your pet" not "Someone liked your pet")
3. **Be Actionable**: Include clear CTAs when appropriate
4. **Be Timely**: Send notifications when they're relevant
5. **Be Friendly**: Use warm, conversational language
6. **Be Consistent**: Follow established patterns and tone

### Examples of Good Notification Copy

**Matches:**

- ✅ "Buddy matched with Max! 95% compatibility"
- ❌ "You have a new match"

**Messages:**

- ✅ "Sarah: Hey! Would love to set up a playdate!"
- ❌ "New message received"

**Achievements:**

- ✅ "Achievement Unlocked! Super Matcher - 10 successful matches"
- ❌ "You earned a badge"

**Moderation:**

- ✅ "Content Removed: Inappropriate language detected in your post"
- ❌ "Action taken on your content"

## Technical Details

### Data Structure

```typescript
interface PremiumNotification {
  id: string; // Unique ULID
  type: NotificationType; // Category
  title: string; // Bold headline
  message: string; // Body text
  timestamp: number; // Unix timestamp (ms)
  read: boolean; // Read status
  archived: boolean; // Archive status
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  actionUrl?: string; // Navigation target
  actionLabel?: string; // CTA button text
  imageUrl?: string; // Rich media image
  avatarUrl?: string; // User/pet avatar
  mediaType?: 'image' | 'video' | 'audio' | 'gif';
  groupId?: string; // Group identifier
  metadata?: {
    petName?: string;
    userName?: string;
    matchId?: string;
    messageId?: string;
    count?: number;
    compatibilityScore?: number;
    reactionType?: string;
    location?: string;
    eventType?: string;
    achievementBadge?: string;
  };
}
```

### Storage

Notifications are persisted using the Spark KV storage system:

```typescript
// Key: 'premium-notifications'
// Value: PremiumNotification[]

// Notifications are sorted by timestamp (newest first)
// Archived notifications are filtered from main views
// Preferences stored in separate key: 'notification-preferences'
```

### Performance Considerations

1. **Pagination**: Consider implementing virtual scrolling for 100+ notifications
2. **Retention**: Implement automatic cleanup of old notifications (30-90 days)
3. **Rate Limiting**: Prevent notification spam with client-side throttling
4. **Deduplication**: Use groupId to prevent duplicate notifications
5. **Lazy Loading**: Load notification details on-demand for large lists

## Integration with Real-Time Features

### WebSocket Integration

```typescript
// Example WebSocket integration
socket.on('new_match', async (data) => {
  await createMatchNotification(
    data.yourPetName,
    data.matchedPetName,
    data.matchId,
    data.compatibilityScore
  );

  // Show toast for immediate feedback
  notifications.success('New Match!', 'Check your notifications');
});

socket.on('new_message', async (data) => {
  await createMessageNotification(
    data.senderName,
    data.messagePreview,
    data.roomId,
    data.avatarUrl
  );
});
```

### Combined with Toast Notifications

Use both systems for optimal UX:

```typescript
// Toast: Immediate, transient feedback
notifications.success('Match created!');

// Premium Notification: Persistent, actionable record
await createMatchNotification('Buddy', 'Max', 'match-123');
```

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation fully supported
- Focus management handles automatically
- Screen reader friendly descriptions
- High contrast mode compatible
- Reduced motion support via `prefers-reduced-motion`

## Browser Support

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)
- Progressive enhancement for older browsers
- Graceful degradation without JavaScript

## Future Enhancements

Planned features for future iterations:

- [ ] Web Push API for background notifications
- [ ] Email digest for unread notifications
- [ ] Rich media player for video/audio notifications
- [ ] Notification threading and conversations
- [ ] Snooze functionality with reminders
- [ ] Custom notification sounds per type
- [ ] Per-type notification preferences
- [ ] Notification analytics and insights
- [ ] Webhook integrations for external services
- [ ] Multi-device sync and read receipts
- [ ] Smart notification bundling by AI
- [ ] Notification scheduling and delays

## Troubleshooting

### Notifications not appearing

1. Check browser console for errors
2. Verify KV storage is working: `await spark.kv.get('premium-notifications')`
3. Ensure notification functions are awaited properly
4. Check if notifications are being filtered by category/read status
5. Verify the notification bell component is rendered

### Bell not updating

1. Ensure `useKV` hook is being used correctly
2. Check for stale closures in functional updates
3. Verify state updates use functional form: `setNotifications(current => ...)`
4. Check React DevTools for state changes

### Performance issues

1. Check notification count - consider pagination if >100
2. Implement retention policy for old notifications
3. Use React DevTools Profiler to identify rendering bottlenecks
4. Consider virtualization for long lists
5. Lazy load notification images

### Grouping not working

1. Verify `groupSimilar` preference is enabled
2. Ensure notifications have consistent `groupId`
3. Check that notification types match for grouping
4. Verify the `view` state is set to 'grouped'

## Support

For issues or questions:

- Check component code comments
- Review demo implementations
- Consult the PRD for design decisions
- Reference the main NOTIFICATIONS_GUIDE.md for basic features
