import { generateULID } from './utils';
import { APIClient } from './api-client';
import { ENDPOINTS } from './endpoints';
import type { AppNotification } from '@/components/notifications/NotificationCenter';

export async function addNotification(
  notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
) {
  const newNotification: AppNotification = {
    ...notification,
    id: generateULID(),
    timestamp: Date.now(),
    read: false,
  };

  // Store notification via API
  await APIClient.post(ENDPOINTS.NOTIFICATIONS.LIST, {
    notificationId: newNotification.id,
    userId: '', // Will be determined by backend from auth context
    type: newNotification.type,
    title: newNotification.title,
    body: newNotification.message,
    data: newNotification.metadata ?? {},
    read: false,
    createdAt: new Date(newNotification.timestamp).toISOString(),
  });

  return newNotification;
}

export async function createMatchNotification(
  petName: string,
  yourPetName: string,
  matchId: string
) {
  return addNotification({
    type: 'match',
    title: "It's a Match! 🎉",
    message: `${String(yourPetName ?? '')} and ${String(petName ?? '')} are perfect companions!`,
    priority: 'high',
    actionUrl: `/matches/${String(matchId ?? '')}`,
    actionLabel: 'View Match',
    metadata: {
      petName,
      matchId,
    },
  });
}

export async function createMessageNotification(
  senderName: string,
  message: string,
  roomId: string
) {
  return addNotification({
    type: 'message',
    title: `New message from ${String(senderName ?? '')}`,
    message: message.length > 80 ? message.substring(0, 80) + '...' : message,
    priority: 'normal',
    actionUrl: `/chat/${String(roomId ?? '')}`,
    actionLabel: 'Reply',
    metadata: {
      userName: senderName,
      messageId: roomId,
    },
  });
}

export async function createLikeNotification(petName: string, count = 1) {
  return addNotification({
    type: 'like',
    title: count > 1 ? 'New Likes!' : 'Someone liked your pet!',
    message:
      count > 1
        ? `${petName} and ${count - 1} others liked your pet!`
        : `${petName} liked your pet!`,
    priority: 'normal',
    actionUrl: '/matches',
    actionLabel: 'View',
    metadata: {
      petName,
      count,
    },
  });
}

export async function createVerificationNotification(
  status: 'approved' | 'rejected',
  petName: string
) {
  return addNotification({
    type: 'verification',
    title: status === 'approved' ? 'Pet Verified! ✅' : 'Verification Update',
    message:
      status === 'approved'
        ? `${petName} has been verified and is now visible to other users!`
        : `${petName}'s verification needs more information. Please check your profile.`,
    priority: status === 'approved' ? 'high' : 'normal',
    actionUrl: '/profile',
    actionLabel: 'View Profile',
  });
}

export async function createStoryNotification(userName: string, count = 1) {
  return addNotification({
    type: 'story',
    title: count > 1 ? 'New Stories' : 'New Story',
    message:
      count > 1
        ? `${userName} and ${count - 1} others posted new stories`
        : `${userName} posted a new story`,
    priority: 'low',
    actionUrl: '/stories',
    metadata: {
      userName,
      count,
    },
  });
}

export async function createModerationNotification(action: string, reason: string) {
  return addNotification({
    type: 'moderation',
    title: 'Moderation Notice',
    message: `${String(action ?? '')}: ${String(reason ?? '')}`,
    priority: 'urgent',
    actionUrl: '/profile',
    actionLabel: 'Learn More',
  });
}

export async function createSystemNotification(
  title: string,
  message: string,
  priority: AppNotification['priority'] = 'normal'
) {
  return addNotification({
    type: 'system',
    title,
    message,
    priority,
  });
}

export async function clearAllNotifications() {
  await APIClient.post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
}

export async function markNotificationAsRead(id: string) {
  await APIClient.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
}

export async function deleteNotification(id: string) {
  // Delete notification via API (using mark as read endpoint or a delete endpoint)
  // Note: Backend may need a DELETE endpoint for this
  await APIClient.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
}
