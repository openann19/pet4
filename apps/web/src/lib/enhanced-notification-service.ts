/**
 * Enhanced Notification Service
 *
 * Handles in-app and push notifications with quiet hours, idempotency, and deduplication
 */

import { pushNotifications as pushNotificationManager } from './push-notifications';
import { createLogger } from './logger';
import { generateULID } from './utils';
import { APIClient } from './api-client';
import { ENDPOINTS } from './endpoints';
import type { Notification, User, Match } from './contracts';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('EnhancedNotifications');

export class EnhancedNotificationService {
  private seenNotificationIds = new Set<string>();
  private readonly DEDUPE_WINDOW_MS = 5 * 60 * 1000;

  /**
   * Check if notification should be sent based on quiet hours
   */
  private isWithinQuietHours(user: User, now: Date = new Date()): boolean {
    if (!user.preferences.quietHours) {
      return false;
    }

    const { start, end } = user.preferences.quietHours;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(start);
    const endTime = this.parseTime(end);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  private parseTime(time: string): number {
    const parts = time.split(':');
    const hours = parts[0] ? Number.parseInt(parts[0], 10) : 0;
    const minutes = parts[1] ? Number.parseInt(parts[1], 10) : 0;
    return hours * 60 + minutes;
  }

  /**
   * Check if notification is idempotent (already seen)
   */
  private isDuplicate(notificationId: string): boolean {
    if (this.seenNotificationIds.has(notificationId)) {
      return true;
    }

    this.seenNotificationIds.add(notificationId);

    setTimeout(() => {
      this.seenNotificationIds.delete(notificationId);
    }, this.DEDUPE_WINDOW_MS);

    return false;
  }

  /**
   * Send match created notification
   */
  async notifyMatchCreated(match: Match, userA: User, userB: User): Promise<void> {
    const correlationId = generateULID();

    try {
      const notificationId = `match-${match.id}-${userA.id}`;

      if (this.isDuplicate(notificationId)) {
        logger.debug('Duplicate notification suppressed', { notificationId, correlationId });
        return;
      }

      const shouldNotifyA =
        userA.preferences.notifications.matches && !this.isWithinQuietHours(userA);
      const shouldNotifyB =
        userB.preferences.notifications.matches && !this.isWithinQuietHours(userB);

      if (shouldNotifyA) {
        await this.sendNotification(
          {
            id: notificationId,
            userId: userA.id,
            type: 'match_created',
            title: 'New Match!',
            body: `You matched with ${userB.displayName}`,
            data: {
              matchId: match.id,
              petBId: match.petBId,
              chatRoomId: match.chatRoomId,
            },
            read: false,
            createdAt: new Date().toISOString(),
          },
          userA
        );
      }

      const notificationIdB = `match-${match.id}-${userB.id}`;
      if (!this.isDuplicate(notificationIdB) && shouldNotifyB) {
        await this.sendNotification(
          {
            id: notificationIdB,
            userId: userB.id,
            type: 'match_created',
            title: 'New Match!',
            body: `You matched with ${userA.displayName}`,
            data: {
              matchId: match.id,
              petAId: match.petAId,
              chatRoomId: match.chatRoomId,
            },
            read: false,
            createdAt: new Date().toISOString(),
          },
          userB
        );
      }

      logger.info('Match notification sent', {
        matchId: match.id,
        userA: userA.id,
        userB: userB.id,
        correlationId,
      });
    } catch (_error) {
      logger.error(
        'Failed to send match notification',
        _error instanceof Error ? _error : new Error(String(_error)),
        {
          matchId: match.id,
          correlationId,
        }
      );
    }
  }

  /**
   * Send like received notification
   */
  async notifyLikeReceived(fromPetId: string, toPetId: string, toUserId: string): Promise<void> {
    const correlationId = generateULID();

    try {
      const notificationId = `like-${fromPetId}-${toPetId}`;

      if (this.isDuplicate(notificationId)) {
        logger.debug('Duplicate notification suppressed', { notificationId, correlationId });
        return;
      }

      // Get user from API
      const response = await APIClient.get<User>(`${ENDPOINTS.USERS.PROFILE}?userId=${toUserId}`);
      const user = response.data;

      if (!user?.preferences.notifications.likes) {
        return;
      }

      if (this.isWithinQuietHours(user)) {
        logger.debug('Notification suppressed due to quiet hours', {
          userId: toUserId,
          correlationId,
        });
        return;
      }

      await this.sendNotification(
        {
          id: notificationId,
          userId: toUserId,
          type: 'like_received',
          title: 'Someone likes your pet!',
          body: 'Check out who swiped right on your pet',
          data: {
            fromPetId,
            toPetId,
          },
          read: false,
          createdAt: new Date().toISOString(),
        },
        user
      );

      logger.info('Like notification sent', {
        fromPetId,
        toPetId,
        correlationId,
      });
    } catch (_error) {
      logger.error(
        'Failed to send like notification',
        _error instanceof Error ? _error : new Error(String(_error)),
        {
          fromPetId,
          toPetId,
          correlationId,
        }
      );
    }
  }

  /**
   * Send new message notification
   */
  async notifyNewMessage(
    chatRoomId: string,
    senderId: string,
    recipientId: string,
    messagePreview: string
  ): Promise<void> {
    const correlationId = generateULID();

    try {
      const notificationId = `message-${chatRoomId}-${senderId}-${Date.now()}`;

      // Get recipient from API
      const response = await APIClient.get<User>(
        `${ENDPOINTS.USERS.PROFILE}?userId=${recipientId}`
      );
      const recipient = response.data;

      if (!recipient?.preferences.notifications.messages) {
        return;
      }

      if (this.isWithinQuietHours(recipient)) {
        logger.debug('Notification suppressed due to quiet hours', {
          userId: recipientId,
          correlationId,
        });
        return;
      }

      await this.sendNotification(
        {
          id: notificationId,
          userId: recipientId,
          type: 'new_message',
          title: 'New Message',
          body: messagePreview.slice(0, 100),
          data: {
            chatRoomId,
            senderId,
          },
          read: false,
          createdAt: new Date().toISOString(),
        },
        recipient
      );

      logger.info('Message notification sent', {
        chatRoomId,
        senderId,
        recipientId,
        correlationId,
      });
    } catch (_error) {
      logger.error(
        'Failed to send message notification',
        _error instanceof Error ? _error : new Error(String(_error)),
        {
          chatRoomId,
          senderId,
          correlationId,
        }
      );
    }
  }

  /**
   * Internal: Send notification (in-app + push)
   */
  private async sendNotification(notification: Notification, user: User): Promise<void> {
    const correlationId = generateULID();

    try {
      // Store notification via API
      await APIClient.post(ENDPOINTS.NOTIFICATIONS.LIST, {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt,
      });

      if (isTruthy(user.preferences.notifications.push)) {
        const notificationData = {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          icon: user.avatarUrl ?? '/icon-192.png',
          tag: notification.type,
          data: {
            ...notification.data,
            notificationId: notification.id,
            deepLink: this.getDeepLink(notification.type, notification.data),
          },
          requireInteraction: false,
        };

        await pushNotificationManager.showNotification(notificationData);
      }

      logger.debug('Notification sent', {
        notificationId: notification.id,
        userId: user.id,
        type: notification.type,
        correlationId,
      });
    } catch (_error) {
      logger.error(
        'Failed to send notification',
        _error instanceof Error ? _error : new Error(String(_error)),
        {
          notificationId: notification.id,
          correlationId,
        }
      );
      throw error;
    }
  }

  /**
   * Get deep link for notification type
   */
  private getDeepLink(type: Notification['type'], data: Record<string, unknown>): string {
    switch (type) {
      case 'match_created':
        return `/matches/${data.matchId as string}`;
      case 'new_message':
        return `/chat/${data.chatRoomId as string}`;
      case 'like_received':
        return '/discover';
      default:
        return '/';
    }
  }

  /**
   * Create digest for low-priority notifications
   */
  async createDigest(userId: string, notifications: Notification[]): Promise<Notification | null> {
    if (notifications.length === 0) {
      return null;
    }

    const summary =
      notifications.length === 1 && notifications[0]
        ? notifications[0].body ?? 'New notification'
        : `You have ${notifications.length} new notifications`;

    return {
      id: `digest-${String(userId ?? '')}-${String(Date.now() ?? '')}`,
      userId,
      type: 'like_received',
      title: 'Notifications Summary',
      body: summary,
      data: {
        count: notifications.length,
        notificationIds: notifications.map((n) => n.id),
      },
      read: false,
      createdAt: new Date().toISOString(),
    };
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
