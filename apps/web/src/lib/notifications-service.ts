import {
  pushNotifications as pushNotificationManager,
  deepLinks as deepLinkManager,
} from './push-notifications';
import { lostFoundAPI } from '@/api/lost-found-api';
import { notificationsApi } from '@/api/notifications-api';
import type { LostAlert, Sighting } from './lost-found-types';
import type { Post } from './community-types';
import type { LiveStream } from './live-streaming-types';
import { createLogger } from './logger';

const logger = createLogger('NotificationsService');

interface ServiceWorkerNotificationEvent extends Event {
  notification: Notification;
  action?: string;
}

/**
 * Notification Service for Lost & Found, Community, and Go Live features
 * Handles push notifications and deep links for new content
 */

export class NotificationsService {
  /**
   * Send notification when a new lost alert is created nearby
   */
  async notifyNewLostAlert(alert: LostAlert, _userId: string): Promise<void> {
    try {
      await pushNotificationManager.showNotification({
        id: `lost-alert-${alert.id}`,
        title: `Lost Pet Alert: ${alert.petSummary.name}`,
        body: `${alert.petSummary.species} • Last seen ${new Date(alert.lastSeen.whenISO).toLocaleDateString()}`,
        icon:
          (alert.photos && alert.photos.length > 0 ? alert.photos[0] : '/icon-192.png') ??
          '/icon-192.png',
        ...(alert.photos && alert.photos.length > 0 ? { image: alert.photos[0] } : {}),
        tag: 'lost-alert',
        data: {
          type: 'lost-alert',
          alertId: alert.id,
          deepLink: `/lost-found/alert/${alert.id}`,
        },
        actions: [
          {
            action: 'view',
            title: 'View Alert',
            icon: '/icon-192.png',
          },
          {
            action: 'report-sighting',
            title: 'Report Sighting',
            icon: '/icon-192.png',
          },
        ],
        requireInteraction: false,
      });

      // Handle deep link - register route for navigation
      // Routes are registered in the main app router
    } catch (_error) {
      logger.error(
        'Failed to send lost alert notification',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  /**
   * Send notification when a sighting is reported for user's lost pet
   */
  async notifyNewSighting(sighting: Sighting, alert: LostAlert): Promise<void> {
    try {
      await pushNotificationManager.showNotification({
        id: `sighting-${String(sighting.id ?? '')}`,
        title: `New Sighting Reported!`,
        body: `Someone reported seeing ${alert.petSummary.name}`,
        icon:
          (alert.photos && alert.photos.length > 0 ? alert.photos[0] : '/icon-192.png') ??
          '/icon-192.png',
        ...(sighting.photos && sighting.photos.length > 0 ? { image: sighting.photos[0] } : {}),
        tag: 'sighting',
        data: {
          type: 'sighting',
          sightingId: sighting.id,
          alertId: alert.id,
          deepLink: `/lost-found/alert/${alert.id}/sighting/${sighting.id}`,
        },
        actions: [
          {
            action: 'view',
            title: 'View Sighting',
            icon: '/icon-192.png',
          },
        ],
        requireInteraction: true,
      });

      // Handle deep link - register route for navigation
    } catch (_error) {
      logger.error(
        'Failed to send sighting notification',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  /**
   * Send notification when a new community post is created by followed users
   */
  async notifyNewCommunityPost(post: Post, userId: string): Promise<void> {
    try {
      // Only notify if user follows the author
      const { shouldNotifyForPost } = await import('@/core/services/follow-graph');
      const shouldNotify = await shouldNotifyForPost(post.authorId, userId);

      if (!shouldNotify) {
        return; // Don't notify if user doesn't follow the author
      }

      const imageUrl =
        post.media && post.media.length > 0 && post.media[0]
          ? typeof post.media[0] === 'string'
            ? post.media[0]
            : (post.media[0] as { url?: string }).url
          : undefined;
      await pushNotificationManager.showNotification({
        id: `community-post-${String(post.id ?? '')}`,
        title: `New Post by ${String(post.authorName ?? '')}`,
        body: post.text ? post.text.slice(0, 100) : 'New post',
        icon: post.authorAvatar ?? '/icon-192.png',
        ...(imageUrl ? { image: imageUrl } : {}),
        tag: 'community-post',
        data: {
          type: 'community-post',
          postId: post.id,
          deepLink: `/community/post/${post.id}`,
        },
        actions: [
          {
            action: 'view',
            title: 'View Post',
            icon: '/icon-192.png',
          },
          {
            action: 'react',
            title: 'React',
            icon: '/icon-192.png',
          },
        ],
        requireInteraction: false,
      });

      // Handle deep link - register route for navigation
    } catch (_error) {
      logger.error(
        'Failed to send community post notification',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  /**
   * Send notification when a user goes live
   */
  async notifyGoLive(stream: LiveStream, userId: string): Promise<void> {
    try {
      // Only notify if user follows the host
      const { shouldNotifyForStream } = await import('@/core/services/follow-graph');
      const shouldNotify = await shouldNotifyForStream(stream.hostId, userId);

      if (!shouldNotify) {
        return; // Don't notify if user doesn't follow the host
      }

      await pushNotificationManager.showNotification({
        id: `live-stream-${String(stream.id ?? '')}`,
        title: `${String(stream.hostName ?? '')} is Live!`,
        body: stream.title,
        icon: stream.hostAvatar ?? '/icon-192.png',
        tag: 'live-stream',
        data: {
          type: 'live-stream',
          streamId: stream.id,
          deepLink: `/live/${stream.id}`,
        },
        actions: [
          {
            action: 'join',
            title: 'Join Stream',
            icon: '/icon-192.png',
          },
        ],
        requireInteraction: false,
      });

      // Handle deep link - register route for navigation
    } catch (_error) {
      logger.error(
        'Failed to send go live notification',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  /**
   * Send notification when user's lost pet alert gets a new view
   */
  async notifyAlertView(alertId: string, viewCount: number): Promise<void> {
    try {
      // Only notify for significant milestones (e.g., 10, 50, 100 views)
      if (viewCount === 10 || viewCount === 50 || viewCount === 100) {
        const alert = await lostFoundAPI.getAlertById(alertId);
        if (!alert) return;

        const iconUrl =
          (alert.photos && alert.photos.length > 0 ? alert.photos[0] : '/icon-192.png') ??
          '/icon-192.png';
        await pushNotificationManager.showNotification({
          id: `alert-view-${String(alertId ?? '')}-${String(viewCount ?? '')}`,
          title: `${String(viewCount ?? '')} People Viewed Your Alert`,
          body: `${String(alert.petSummary.name ?? '')}'s alert has been seen by ${String(viewCount ?? '')} people`,
          icon: iconUrl,
          tag: 'alert-view',
          data: {
            type: 'alert-view',
            alertId: alert.id,
            deepLink: `/lost-found/alert/${alert.id}`,
          },
          requireInteraction: false,
        });
      }
    } catch (_error) {
      logger.error(
        'Failed to send alert view notification',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  /**
   * Send notification when a post gets popular
   */
  async notifyPostPopular(post: Post, reactionCount: number): Promise<void> {
    try {
      // Notify when post reaches certain milestones
      if (reactionCount === 10 || reactionCount === 50 || reactionCount === 100) {
        await pushNotificationManager.showNotification({
          id: `post-popular-${String(post.id ?? '')}-${String(reactionCount ?? '')}`,
          title: `Your Post is Getting Popular!`,
          body: `Your post has ${reactionCount} reactions`,
          icon: post.authorAvatar ?? '/icon-192.png',
          tag: 'post-popular',
          data: {
            type: 'post-popular',
            postId: post.id,
            deepLink: `/community/post/${post.id}`,
          },
          requireInteraction: false,
        });
      }
    } catch (_error) {
      logger.error(
        'Failed to send post popular notification',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  /**
   * Initialize notification listeners for API events
   */
  async initialize(): Promise<void> {
    // Initialize push notification manager
    await pushNotificationManager.initialize();

    // Listen for notification clicks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('notificationclick', (event: Event) => {
        const notificationEvent = event as ServiceWorkerNotificationEvent;
        notificationEvent.notification.close();

        const data = notificationEvent.notification.data as
          | {
              deepLink?: string;
              params?: Record<string, string>;
              alertId?: string;
              streamId?: string;
            }
          | undefined;
        if (data?.deepLink) {
          // Navigate to deep link
          deepLinkManager.navigate(data.deepLink, data.params ?? {});
        }

        // Handle action clicks
        if (notificationEvent.action === 'view') {
          if (data?.deepLink) {
            deepLinkManager.navigate(data.deepLink, data.params ?? {});
          }
        } else if (notificationEvent.action === 'report-sighting') {
          if (data?.alertId) {
            deepLinkManager.navigate(`/lost-found/alert/${data.alertId}/report-sighting`, {});
          }
        } else if (notificationEvent.action === 'join') {
          if (data?.streamId) {
            deepLinkManager.navigate(`/live/${data.streamId}`, {});
          }
        }
      });
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    return await pushNotificationManager.requestPermission();
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return pushNotificationManager.isSupported();
  }

  /**
   * Check if user has granted permission
   */
  hasPermission(): boolean {
    return pushNotificationManager.hasPermission();
  }

  /**
   * Trigger geofenced push notifications for a lost alert
   * Sends notifications to users within the specified radius
   */
  async triggerGeofencedNotifications(
    alert: LostAlert,
    radiusKm = 10 // Default 10km radius
  ): Promise<void> {
    try {
      if (!alert.lastSeen.lat || !alert.lastSeen.lon) {
        logger.warn('Alert missing location data, skipping geofenced notifications', {
          alertId: alert.id,
        });
        return;
      }

      // Use API to trigger geofenced notifications
      await notificationsApi.triggerGeofence(
        alert.id,
        alert.lastSeen.lat,
        alert.lastSeen.lon,
        radiusKm
      );

      logger.info('Geofenced notifications triggered', {
        alertId: alert.id,
        radiusKm,
      });
    } catch (_error) {
      logger.error(
        'Failed to trigger geofenced notifications',
        _error instanceof Error ? _error : new Error(String(_error)),
        {
          alertId: alert.id,
        }
      );
      // Don't throw - this is a background operation
    }
  }
}

export const notificationsService = new NotificationsService();

// Initialize on module load
if (typeof window !== 'undefined') {
  notificationsService.initialize().catch((error) => {
    logger.error(
      'Failed to initialize notifications service',
      _error instanceof Error ? _error : new Error(String(_error))
    );
  });
}
