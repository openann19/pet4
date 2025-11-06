import type { PremiumNotification } from '@/components/notifications/PremiumNotificationCenter'
import { storage } from './storage'
import { generateULID } from './utils'

const STORAGE_KEY = 'premium-notifications'

async function readNotifications(): Promise<PremiumNotification[]> {
  return (await storage.get<PremiumNotification[]>(STORAGE_KEY)) ?? []
}

async function writeNotifications(notifications: PremiumNotification[]): Promise<void> {
  await storage.set(STORAGE_KEY, notifications)
}

export async function createPremiumNotification(notification: Omit<PremiumNotification, 'id' | 'timestamp' | 'read' | 'archived'>) {
  const newNotification: PremiumNotification = {
    id: generateULID(),
    timestamp: Date.now(),
    read: false,
    archived: false,
    ...notification
  }

  const existing = await readNotifications()
  await writeNotifications([newNotification, ...existing])

  return newNotification
}

export async function createMatchNotification(
  yourPetName: string,
  matchedPetName: string,
  matchId: string,
  compatibilityScore?: number,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'match',
    title: `New Match! 🎉`,
    message: `${yourPetName} matched with ${matchedPetName}!`,
    priority: 'high',
    actionLabel: 'View Match',
    actionUrl: `/matches/${matchId}`,
    ...(avatarUrl ? { avatarUrl } : {}),
    metadata: {
      petName: matchedPetName,
      matchId,
      ...(compatibilityScore !== undefined ? { compatibilityScore } : {}),
    }
  })
}

export async function createMessageNotification(
  senderName: string,
  messagePreview: string,
  roomId: string,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'message',
    title: senderName,
    message: messagePreview,
    priority: 'normal',
    actionLabel: 'Reply',
    actionUrl: `/chat/${roomId}`,
    ...(avatarUrl ? { avatarUrl } : {}),
    metadata: {
      userName: senderName,
      messageId: roomId
    }
  })
}

export async function createLikeNotification(
  petName: string,
  count: number = 1,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'like',
    title: count === 1 ? `${petName} liked your pet!` : `${count} new likes!`,
    message: count === 1 
      ? `${petName} is interested in your pet` 
      : `${petName} and ${count - 1} others liked your pet`,
    priority: 'normal',
    actionLabel: 'View Profile',
    ...(avatarUrl ? { avatarUrl } : {}),
    metadata: {
      petName,
      count
    }
  })
}

export async function createVerificationNotification(
  status: 'approved' | 'rejected' | 'pending',
  petName: string
) {
  const messages = {
    approved: {
      title: 'Pet Verified! ✅',
      message: `${petName} has been verified and is now live`,
      priority: 'high' as const
    },
    rejected: {
      title: 'Verification Issue',
      message: `${petName}'s verification needs attention`,
      priority: 'urgent' as const
    },
    pending: {
      title: 'Verification Pending',
      message: `${petName} is being reviewed`,
      priority: 'normal' as const
    }
  }

  const config = messages[status]

  return createPremiumNotification({
    type: 'verification',
    title: config.title,
    message: config.message,
    priority: config.priority,
    actionLabel: 'View Details',
    metadata: {
      petName
    }
  })
}

export async function createStoryNotification(
  userName: string,
  count: number = 1,
  avatarUrl?: string,
  imageUrl?: string
) {
  return createPremiumNotification({
    type: 'story',
    title: count === 1 ? `${userName} posted a story` : `${count} new stories`,
    message: count === 1
      ? 'View their latest update'
      : `${userName} and others shared new stories`,
    priority: 'low',
    actionLabel: 'Watch',
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    metadata: {
      userName,
      count
    }
  })
}

export async function createModerationNotification(
  title: string,
  message: string,
  priority: PremiumNotification['priority'] = 'urgent'
) {
  return createPremiumNotification({
    type: 'moderation',
    title,
    message,
    priority,
    actionLabel: 'Learn More'
  })
}

export async function createAchievementNotification(
  achievementName: string,
  description: string,
  badge?: string,
  imageUrl?: string
) {
  return createPremiumNotification({
    type: 'achievement',
    title: `Achievement Unlocked! 🏆`,
    message: `You earned "${achievementName}" - ${description}`,
    priority: 'high',
    actionLabel: 'View Achievements',
    ...(imageUrl ? { imageUrl } : {}),
    metadata: {
      achievementBadge: badge || achievementName
    }
  })
}

export async function createSocialNotification(
  title: string,
  message: string,
  userName?: string,
  avatarUrl?: string
) {
  return createPremiumNotification({
    type: 'social',
    title,
    message,
    priority: 'normal',
    ...(avatarUrl ? { avatarUrl } : {}),
    metadata: {
      ...(userName ? { userName } : {}),
    }
  })
}

export async function createEventNotification(
  eventName: string,
  eventDetails: string,
  location?: string,
  imageUrl?: string
) {
  return createPremiumNotification({
    type: 'event',
    title: eventName,
    message: eventDetails,
    priority: 'normal',
    actionLabel: 'View Event',
    ...(imageUrl ? { imageUrl } : {}),
    metadata: {
      ...(location ? { location } : {}),
      eventType: eventName
    }
  })
}

export async function createSystemNotification(
  title: string,
  message: string,
  priority: PremiumNotification['priority'] = 'normal'
) {
  return createPremiumNotification({
    type: 'system',
    title,
    message,
    priority
  })
}

export async function markNotificationAsRead(id: string) {
  const notifications = await readNotifications()
  const updated = notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  )
  
  await writeNotifications(updated)
}

export async function archiveNotification(id: string) {
  const notifications = await readNotifications()
  const updated = notifications.map(n => 
    n.id === id ? { ...n, archived: true, read: true } : n
  )
  
  await writeNotifications(updated)
}

export async function deleteNotification(id: string) {
  const notifications = await readNotifications()
  const updated = notifications.filter(n => n.id !== id)
  
  await writeNotifications(updated)
}

export async function clearAllNotifications() {
  await writeNotifications([])
}

export async function getUnreadCount() {
  const notifications = await readNotifications()
  return notifications.filter(n => !n.read && !n.archived).length
}

export async function getUrgentNotifications() {
  const notifications = await readNotifications()
  return notifications.filter(n => 
    !n.read && 
    !n.archived && 
    (n.priority === 'urgent' || n.priority === 'critical')
  )
}

export async function createGroupedNotifications(
  type: PremiumNotification['type'],
  items: Array<{ name: string; avatarUrl?: string }>,
  baseMessage: string
) {
  const groupId = generateULID()
  
  const notifications = items.map((item, index) => ({
    id: generateULID(),
    type,
    title: `${item.name} ${baseMessage}`,
    message: `Check out what ${item.name} shared`,
    timestamp: Date.now() - (items.length - index) * 1000,
    read: false,
    archived: false,
    priority: 'normal' as const,
    ...(item.avatarUrl !== undefined && { avatarUrl: item.avatarUrl }),
    groupId,
    metadata: {
      userName: item.name
    }
  }))

  const existing = await readNotifications()
  await writeNotifications([...notifications, ...existing])

  return notifications
}
