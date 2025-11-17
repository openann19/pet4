/**
 * Premium Notification Center
 *
 * Main notification center component with modular architecture
 * Refactored from 1248 lines to use hooks and component modules
 */

'use client';;
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  MotionView,
} from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  BellRinging,
  Check,
  Trash,
  DotsThreeVertical,
  SlidersHorizontal,
  Sparkle,
} from '@phosphor-icons/react';
import { timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@petspark/motion';
import { haptics } from '@/lib/haptics';
import { useNotifications } from './hooks/useNotifications';
import { useNotificationActions } from './hooks/useNotificationActions';
import { useNotificationFilters } from './hooks/useNotificationFilters';
import { NotificationList } from './components/NotificationList';
import { NotificationGroupList } from './components/NotificationGroupList';
import { NotificationFilters } from './components/NotificationFilters';
import { NotificationSettings } from './components/NotificationSettings';
import { getNotificationIcon, getPriorityStyles } from './utils/notification-helpers';
import type { PremiumNotification, NotificationPreferences, NotificationFilter } from './types';

export interface PremiumNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumNotificationCenter({
  isOpen,
  onClose,
}: PremiumNotificationCenterProps): JSX.Element {
  const [preferences, setPreferences] = useLocalStorage<NotificationPreferences>(
    'notification-preferences',
    {
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
      groupSimilar: true,
      showPreviews: true,
      soundEnabled: true,
      pushEnabled: true,
    }
  );

  const [showSettings, setShowSettings] = useState(false);

  const filters = useNotificationFilters([]);

  const notifications = useNotifications({
    preferences,
    view: filters.view,
    filter: filters.filter,
    selectedCategory: filters.selectedCategory,
  });

  // Update filters when notifications change
  const filtersWithNotifications = useNotificationFilters(notifications.notifications);

  const actions = useNotificationActions({
    onMarkAsRead: notifications.markAsRead,
    onMarkAllAsRead: notifications.markAllAsRead,
    onArchive: notifications.archive,
    onDelete: notifications.deleteNotification,
    enableHaptics: true,
  });

  const archivedCount = useMemo(
    () => notifications.notifications.filter((n: PremiumNotification) => n.archived).length,
    [notifications.notifications]
  );

  const deleteAllArchived = useCallback(() => {
    haptics.impact('heavy');
    notifications.notifications
      .filter((n: PremiumNotification) => n.archived)
      .forEach((n: PremiumNotification) => {
        notifications.deleteNotification(n.id);
      });
  }, [notifications]);

  // Bell icon animation
  const bellRotate = useSharedValue(0);
  const bellScale = useSharedValue(1);

  useEffect(() => {
    if (isOpen && notifications.unreadCount > 0) {
      bellRotate.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 125 }),
          withTiming(10, { duration: 125 }),
          withTiming(-10, { duration: 125 }),
          withTiming(0, { duration: 125 })
        ),
        2,
        false
      );
      bellScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 200 }), withTiming(1, { duration: 200 })),
        2,
        false
      );
    }
  }, [isOpen, notifications.unreadCount, bellRotate, bellScale]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotate.value}deg` }, { scale: bellScale.value }],
  })) as AnimatedStyle;

  const settingsOpacity = useSharedValue(showSettings ? 1 : 0);
  const settingsHeight = useSharedValue(showSettings ? 1 : 0);

  useEffect(() => {
    settingsOpacity.value = withTiming(showSettings ? 1 : 0, timingConfigs.smooth);
    settingsHeight.value = withTiming(showSettings ? 1 : 0, timingConfigs.smooth);
  }, [showSettings, settingsOpacity, settingsHeight]);

  const settingsStyle = useAnimatedStyle(() => ({
    opacity: settingsOpacity.value,
    height: settingsHeight.value === 1 ? 'auto' : '0',
    overflow: 'hidden',
  })) as AnimatedStyle;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border/50 bg-linear-to-br from-background via-primary/5 to-accent/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MotionView style={bellStyle}>
                <BellRinging size={28} weight="fill" className="text-primary" />
              </MotionView>
              <div>
                <SheetTitle className="text-xl">Notifications</SheetTitle>
                {notifications.unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {notifications.unreadCount} unread{' '}
                    {archivedCount > 0 && `· ${archivedCount} archived`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  haptics.impact('light');
                  setShowSettings(!showSettings);
                }}
              >
                <SlidersHorizontal size={20} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Dots Three Vertical">
                    <DotsThreeVertical size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={actions.handleMarkAllAsRead}
                    disabled={notifications.unreadCount === 0}
                  >
                    <Check size={16} className="mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      filtersWithNotifications.setView(
                        filtersWithNotifications.view === 'grouped' ? 'list' : 'grouped'
                      )
                    }
                  >
                    <Sparkle size={16} className="mr-2" />
                    {filtersWithNotifications.view === 'grouped' ? 'List view' : 'Grouped view'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={deleteAllArchived} disabled={archivedCount === 0}>
                    <Trash size={16} className="mr-2" />
                    Delete archived ({archivedCount})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {showSettings && (
            <MotionView style={settingsStyle} className="overflow-hidden">
              <div className="pt-4 space-y-4 border-t border-border/30 mt-4">
                <NotificationSettings
                  preferences={preferences}
                  onPreferencesChange={setPreferences}
                />
              </div>
            </MotionView>
          )}
        </SheetHeader>

        <Tabs
          value={filtersWithNotifications.filter}
          onValueChange={(value) => filtersWithNotifications.setFilter(value as NotificationFilter)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/50 shrink-0">
            <NotificationFilters
              filter={filtersWithNotifications.filter}
              view={filtersWithNotifications.view}
              categories={filtersWithNotifications.categories}
              selectedCategory={filtersWithNotifications.selectedCategory}
              unreadCount={notifications.unreadCount}
              onFilterChange={filtersWithNotifications.setFilter}
              onViewChange={filtersWithNotifications.setView}
              onCategoryChange={filtersWithNotifications.setSelectedCategory}
              onShowSettings={() => { setShowSettings(true); }}
            />
          </div>

          <TabsContent
            value={filtersWithNotifications.filter}
            className="flex-1 overflow-hidden m-0"
          >
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                {filtersWithNotifications.view === 'grouped' &&
                notifications.groupedNotifications.length > 0 ? (
                  <NotificationGroupList
                    groups={notifications.groupedNotifications}
                    filter={filtersWithNotifications.filter}
                    preferences={preferences}
                    onMarkAsRead={notifications.archiveGroup}
                    onArchive={notifications.archiveGroup}
                    onDelete={notifications.deleteGroup}
                    getIcon={getNotificationIcon}
                    getPriorityStyles={getPriorityStyles}
                  />
                ) : (
                  <NotificationList
                    notifications={notifications.filteredNotifications}
                    filter={filtersWithNotifications.filter}
                    preferences={preferences}
                    onMarkAsRead={actions.handleMarkAsRead}
                    onArchive={actions.handleArchive}
                    onDelete={actions.handleDelete}
                    getIcon={getNotificationIcon}
                    getPriorityStyles={getPriorityStyles}
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
