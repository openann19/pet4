/**
 * Notification Filters Hook
 *
 * Manages filtering and categorization of notifications
 */

import { useState, useMemo, useCallback } from 'react';
import type { PremiumNotification, NotificationFilter } from '../types';

export interface UseNotificationFiltersReturn {
  filter: NotificationFilter;
  selectedCategory: string;
  view: 'grouped' | 'list';
  categories: { value: string; label: string; count: number }[];
  setFilter: (filter: NotificationFilter) => void;
  setSelectedCategory: (category: string) => void;
  setView: (view: 'grouped' | 'list') => void;
}

export function useNotificationFilters(
  notifications: PremiumNotification[]
): UseNotificationFiltersReturn {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [view, setView] = useState<'grouped' | 'list'>('grouped');

  const categories = useMemo(() => {
    const categoryCounts = new Map<string, number>();

    notifications.forEach((n: PremiumNotification) => {
      if (!n.archived) {
        const count = categoryCounts.get(n.type) || 0;
        categoryCounts.set(n.type, count + 1);
      }
    });

    const categoryLabels: Record<string, string> = {
      all: 'All',
      match: 'Matches',
      message: 'Messages',
      like: 'Likes',
      verification: 'Verification',
      story: 'Stories',
      system: 'System',
      moderation: 'Moderation',
      achievement: 'Achievements',
      social: 'Social',
      event: 'Events',
    };

    const allCategories = Array.from(categoryCounts.entries()).map(([value, count]) => ({
      value,
      label: categoryLabels[value] || value,
      count,
    }));

    const totalCount = notifications.filter((n: PremiumNotification) => !n.archived).length;

    return [
      { value: 'all', label: 'All', count: totalCount },
      ...allCategories.sort((a, b) => b.count - a.count),
    ];
  }, [notifications]);

  return {
    filter,
    selectedCategory,
    view,
    categories,
    setFilter,
    setSelectedCategory,
    setView,
  };
}
