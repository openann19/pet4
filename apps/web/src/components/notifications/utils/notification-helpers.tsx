/**
 * Notification Helper Utilities
 *
 * Icon and style helper functions for notifications
 */

import type { ReactNode } from 'react';
import {
  Bell,
  Heart,
  ChatCircle,
  CheckCircle,
  Camera,
  ShieldCheck,
  Crown,
  Users,
  Confetti,
  Info,
  type IconWeight,
} from '@phosphor-icons/react';
import type { PremiumNotification } from '../types';

/**
 * Get icon for notification type and priority
 */
export function getNotificationIcon(
  type: PremiumNotification['type'],
  priority: PremiumNotification['priority']
): ReactNode {
  const iconProps = {
    size: 24 as const,
    weight: (priority === 'urgent' || priority === 'critical' ? 'fill' : 'regular') as IconWeight,
  };

  switch (type) {
    case 'match':
      return <Heart {...iconProps} className="text-primary" />;
    case 'message':
      return <ChatCircle {...iconProps} className="text-secondary" />;
    case 'like':
      return <Heart {...iconProps} className="text-accent" />;
    case 'verification':
      return <CheckCircle {...iconProps} className="text-green-500" />;
    case 'story':
      return <Camera {...iconProps} className="text-purple-500" />;
    case 'moderation':
      return <ShieldCheck {...iconProps} className="text-orange-500" />;
    case 'achievement':
      return <Crown {...iconProps} className="text-yellow-500" />;
    case 'social':
      return <Users {...iconProps} className="text-blue-500" />;
    case 'event':
      return <Confetti {...iconProps} className="text-pink-500" />;
    case 'system':
      return <Info {...iconProps} className="text-blue-500" />;
    default:
      return <Bell {...iconProps} />;
  }
}

/**
 * Get priority-based styles
 */
export function getPriorityStyles(priority: PremiumNotification['priority']): string {
  switch (priority) {
    case 'critical':
      return 'border-l-4 border-l-destructive bg-linear-to-r from-destructive/10 to-transparent';
    case 'urgent':
      return 'border-l-4 border-l-destructive bg-destructive/5';
    case 'high':
      return 'border-l-4 border-l-accent bg-accent/5';
    case 'normal':
      return 'border-l-2 border-l-primary/30';
    case 'low':
      return 'border-l border-l-border/50';
    default:
      return 'border-l border-l-border/50';
  }
}
