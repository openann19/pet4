# Notifications System

Unified notification system with animations, haptic feedback, and micro-interactions.

## Features

- ✅ Animated toast notifications
- ✅ Haptic feedback based on notification type
- ✅ Multiple notification types (success, error, warning, info)
- ✅ Action buttons support
- ✅ Auto-dismiss with configurable duration
- ✅ Smooth spring animations
- ✅ Accessible (ARIA roles)

## Usage

### Setup

Wrap your app with `NotificationProvider`:

```typescript
import { NotificationProvider } from '@mobile/components/notifications'

export default function App() {
  return (
    <NotificationProvider maxNotifications={3}>
      {/* Your app */}
    </NotificationProvider>
  )
}
```

### Showing Notifications

#### Using the hook:

```typescript
import { useNotificationToast } from '@mobile/hooks/use-notification-toast'

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotificationToast()

  const handleSuccess = () => {
    showSuccess('Operation successful!', 'Your changes have been saved.')
  }

  const handleError = () => {
    showError('Something went wrong', 'Please try again later.')
  }

  return (
    <Button onPress={handleSuccess}>Save</Button>
  )
}
```

#### Direct usage:

```typescript
import { useNotifications } from '@mobile/components/notifications'

function MyComponent() {
  const { showNotification } = useNotifications()

  const handleAction = () => {
    showNotification({
      type: 'info',
      title: 'New message',
      message: 'You have a new message from John',
      duration: 5000,
      action: {
        label: 'View',
        onPress: () => {
          // Navigate to messages
        },
      },
    })
  }

  return <Button onPress={handleAction}>Show Notification</Button>
}
```

## Notification Types

- **success**: Green notification with success haptic
- **error**: Red notification with error haptic
- **warning**: Orange notification with warning haptic
- **info**: Blue notification with light haptic

## Options

- `type`: Notification type (required)
- `title`: Notification title (required)
- `message`: Optional message text
- `duration`: Auto-dismiss duration in ms (default: 4000, 0 = no auto-dismiss)
- `action`: Optional action button
- `icon`: Optional icon (future support)

## Micro-Interactions

All notifications include:
- Spring animations on show/hide
- Haptic feedback based on type
- Smooth scale and fade transitions
- Bounce effect on press

