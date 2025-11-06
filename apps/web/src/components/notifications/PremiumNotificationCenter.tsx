'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, withDelay, interpolate, Extrapolation } from 'react-native-reanimated'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Bell,
  BellRinging,
  Heart,
  ChatCircle,
  CheckCircle,
  Info,
  Check,
  Trash,
  DotsThreeVertical,
  Camera,
  ShieldCheck,
  MoonStars,
  Archive,
  SlidersHorizontal,
  Users,
  Confetti,
  Fire,
  Crown,
  Sparkle
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { formatDistanceToNow, isToday, isYesterday, isSameWeek } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useHoverTap } from '@/effects/reanimated'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface PremiumNotification {
  id: string
  type: 'match' | 'message' | 'like' | 'verification' | 'story' | 'system' | 'moderation' | 'achievement' | 'social' | 'event'
  title: string
  message: string
  timestamp: number
  read: boolean
  archived: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  actionUrl?: string
  actionLabel?: string
  imageUrl?: string
  avatarUrl?: string
  mediaType?: 'image' | 'video' | 'audio' | 'gif'
  groupId?: string
  metadata?: {
    petName?: string
    userName?: string
    matchId?: string
    messageId?: string
    count?: number
    compatibilityScore?: number
    reactionType?: string
    location?: string
    eventType?: string
    achievementBadge?: string
  }
}

interface NotificationGroup {
  id: string
  type: string
  notifications: PremiumNotification[]
  title: string
  summary: string
  timestamp: number
  read: boolean
}

interface PremiumNotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationPreferences {
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  groupSimilar: boolean
  showPreviews: boolean
  soundEnabled: boolean
  pushEnabled: boolean
}

export function PremiumNotificationCenter({ isOpen, onClose }: PremiumNotificationCenterProps): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const [notifications, setNotifications] = useKV<PremiumNotification[]>('premium-notifications', [])
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const [preferences, setPreferences] = useKV<NotificationPreferences>('notification-preferences', {
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    groupSimilar: true,
    showPreviews: true,
    soundEnabled: true,
    pushEnabled: true
  })
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [view, setView] = useState<'grouped' | 'list'>('grouped')
  const [showSettings, setShowSettings] = useState(false)

  const allNotifications: PremiumNotification[] = (notifications ?? []) as PremiumNotification[]
  
  const filteredNotifications = allNotifications
    .filter((n: PremiumNotification) => {
      if (filter === 'archived') return n.archived
      if (filter === 'unread') return !n.read && !n.archived
      return !n.archived
    })
    .filter((n: PremiumNotification) => selectedCategory === 'all' || n.type === selectedCategory)
    .sort((a: PremiumNotification, b: PremiumNotification) => b.timestamp - a.timestamp)

  const groupedNotifications = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!preferences?.groupSimilar || view === 'list') {
      return []
    }

    const groups = new Map<string, PremiumNotification[]>()
    
    filteredNotifications.forEach((notification: PremiumNotification) => {
      const groupKey = notification.groupId ?? `${notification.type}-${notification.metadata?.userName ?? notification.metadata?.petName ?? 'solo'}`
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(notification)
    })

    return Array.from(groups.entries())
      .map(([key, notifs]): NotificationGroup => {
        const latest = notifs[0]
        const allRead = notifs.every((n: PremiumNotification) => n.read)
        
        return {
          id: key,
          type: latest.type,
          notifications: notifs,
          title: notifs.length === 1 ? latest.title : `${latest.title} and ${notifs.length - 1} more`,
          summary: notifs.length === 1 
            ? latest.message 
            : `${notifs.length} notifications from ${latest.metadata?.userName ?? latest.metadata?.petName ?? 'various users'}`,
          timestamp: latest.timestamp,
          read: allRead
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  }, [filteredNotifications, preferences?.groupSimilar, view])

  const unreadCount = allNotifications.filter((n: PremiumNotification) => !n.read && !n.archived).length
  const archivedCount = allNotifications.filter((n: PremiumNotification) => n.archived).length

  const markAsRead = useCallback((id: string) => {
    haptics.trigger('light')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    setNotifications((current: PremiumNotification[] | undefined) =>
      (current ?? []).map((n: PremiumNotification) => n.id === id ? { ...n, read: true } : n)
    )
  }, [setNotifications])

  const markGroupAsRead = useCallback((groupId: string) => {
    haptics.trigger('medium')
    const group = groupedNotifications.find(g => g.id === groupId)
    if (group) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setNotifications((current: PremiumNotification[] | undefined) =>
        (current ?? []).map((n: PremiumNotification) => 
          group.notifications.some((gn: PremiumNotification) => gn.id === n.id) ? { ...n, read: true } : n
        )
      )
    }
  }, [groupedNotifications, setNotifications])

  const markAllAsRead = useCallback(() => {
    haptics.trigger('medium')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    setNotifications((current: PremiumNotification[] | undefined) =>
      (current ?? []).map((n: PremiumNotification) => ({ ...n, read: true }))
    )
  }, [setNotifications])

  const archiveNotification = useCallback((id: string) => {
    haptics.trigger('medium')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    setNotifications((current: PremiumNotification[] | undefined) =>
      (current ?? []).map((n: PremiumNotification) => n.id === id ? { ...n, archived: true, read: true } : n)
    )
  }, [setNotifications])

  const archiveGroup = useCallback((groupId: string) => {
    haptics.trigger('heavy')
    const group = groupedNotifications.find(g => g.id === groupId)
    if (group) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setNotifications((current: PremiumNotification[] | undefined) =>
        (current ?? []).map((n: PremiumNotification) => 
          group.notifications.some((gn: PremiumNotification) => gn.id === n.id) 
            ? { ...n, archived: true, read: true } 
            : n
        )
      )
    }
  }, [groupedNotifications, setNotifications])

  const deleteNotification = useCallback((id: string) => {
    haptics.trigger('medium')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    setNotifications((current: PremiumNotification[] | undefined) =>
      (current ?? []).filter((n: PremiumNotification) => n.id !== id)
    )
  }, [setNotifications])

  const deleteGroup = useCallback((groupId: string) => {
    haptics.trigger('heavy')
    const group = groupedNotifications.find(g => g.id === groupId)
    if (group) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setNotifications((current: PremiumNotification[] | undefined) =>
        (current ?? []).filter((n: PremiumNotification) => !group.notifications.some((gn: PremiumNotification) => gn.id === n.id))
      )
    }
  }, [groupedNotifications, setNotifications])

  const deleteAllArchived = useCallback(() => {
    haptics.trigger('heavy')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    setNotifications((current: PremiumNotification[] | undefined) =>
      (current ?? []).filter((n: PremiumNotification) => !n.archived)
    )
  }, [setNotifications])

  const getNotificationIcon = useCallback((type: PremiumNotification['type'], priority: PremiumNotification['priority']) => {
    const iconProps = {
      size: 24,
      weight: priority === 'urgent' || priority === 'critical' ? 'fill' : 'regular'
    } as const

    switch (type) {
      case 'match':
        return <Heart {...iconProps} className="text-primary" />
      case 'message':
        return <ChatCircle {...iconProps} className="text-secondary" />
      case 'like':
        return <Heart {...iconProps} className="text-accent" />
      case 'verification':
        return <CheckCircle {...iconProps} className="text-green-500" />
      case 'story':
        return <Camera {...iconProps} className="text-purple-500" />
      case 'moderation':
        return <ShieldCheck {...iconProps} className="text-orange-500" />
      case 'achievement':
        return <Crown {...iconProps} className="text-yellow-500" />
      case 'social':
        return <Users {...iconProps} className="text-blue-500" />
      case 'event':
        return <Confetti {...iconProps} className="text-pink-500" />
      case 'system':
        return <Info {...iconProps} className="text-blue-500" />
      default:
        return <Bell {...iconProps} />
    }
  }, [])

  const getPriorityStyles = useCallback((priority: PremiumNotification['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-l-destructive bg-gradient-to-r from-destructive/10 to-transparent'
      case 'urgent':
        return 'border-l-4 border-l-destructive bg-destructive/5'
      case 'high':
        return 'border-l-4 border-l-accent bg-accent/5'
      case 'normal':
        return 'border-l-2 border-l-primary/30'
      case 'low':
        return 'border-l border-l-border/50'
    }
  }, [])

  const getTimeGroup = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isSameWeek(date, new Date())) return 'This Week'
    return 'Earlier'
  }, [])

  const notificationsByTime = useMemo(() => {
    const groups: Record<string, PremiumNotification[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': []
    }

    filteredNotifications.forEach((notification: PremiumNotification) => {
      const group = getTimeGroup(notification.timestamp)
      groups[group].push(notification)
    })

    return Object.entries(groups).filter(([_, notifs]) => notifs.length > 0)
  }, [filteredNotifications, getTimeGroup])

  const categories = [
    { value: 'all', label: 'All', icon: Bell },
    { value: 'match', label: 'Matches', icon: Heart },
    { value: 'message', label: 'Messages', icon: ChatCircle },
    { value: 'like', label: 'Likes', icon: Heart },
    { value: 'achievement', label: 'Achievements', icon: Crown },
    { value: 'social', label: 'Social', icon: Users },
  ]

  // Bell icon animation
  const bellRotate = useSharedValue(0)
  const bellScale = useSharedValue(1)

  useEffect(() => {
    bellRotate.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 125 }),
        withTiming(10, { duration: 125 }),
        withTiming(-10, { duration: 125 }),
        withTiming(0, { duration: 125 })
      ),
      -1,
      false
    )
    bellScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 250 }),
        withTiming(1, { duration: 250 })
      ),
      -1,
      false
    )
  }, [bellRotate, bellScale])

  const bellStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${bellRotate.value}deg` },
        { scale: bellScale.value }
      ]
    }
  }) as AnimatedStyle

  // Settings panel animation
  const settingsHeight = useSharedValue(0)
  const settingsOpacity = useSharedValue(0)

  useEffect(() => {
    if (showSettings) {
      settingsHeight.value = withSpring(1, springConfigs.smooth)
      settingsOpacity.value = withTiming(1, timingConfigs.fast)
    } else {
      settingsHeight.value = withSpring(0, springConfigs.smooth)
      settingsOpacity.value = withTiming(0, timingConfigs.fast)
    }
  }, [showSettings, settingsHeight, settingsOpacity])

  const settingsStyle = useAnimatedStyle(() => {
    return {
      opacity: settingsOpacity.value,
      height: interpolate(
        settingsHeight.value,
        [0, 1],
        [0, 200],
        Extrapolation.CLAMP
      )
    }
  }) as AnimatedStyle

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-br from-background via-primary/5 to-accent/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AnimatedView style={bellStyle}>
                <BellRinging size={28} weight="fill" className="text-primary" />
              </AnimatedView>
              <div>
                <SheetTitle className="text-xl">Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {unreadCount} unread {archivedCount > 0 && `· ${archivedCount} archived`}
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
                  haptics.trigger('selection')
                  setShowSettings(!showSettings)
                }}
              >
                <SlidersHorizontal size={20} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <DotsThreeVertical size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                    <Check size={16} className="mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setView(view === 'grouped' ? 'list' : 'grouped')}
                  >
                    <Sparkle size={16} className="mr-2" />
                    {view === 'grouped' ? 'List view' : 'Grouped view'}
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
            <AnimatedView style={settingsStyle} className="overflow-hidden">
              <div className="pt-4 space-y-4 border-t border-border/30 mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours" className="text-sm font-medium">
                    <MoonStars size={16} className="inline mr-2" />
                    Quiet hours
                  </Label>
                  <Switch
                    id="quiet-hours"
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    checked={preferences?.quietHours.enabled ?? false}
                    onCheckedChange={(enabled) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                      setPreferences((current: NotificationPreferences | undefined) => ({
                        ...current!,
                        quietHours: { ...current!.quietHours, enabled }
                      }))
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="group-similar" className="text-sm font-medium">
                    <Sparkle size={16} className="inline mr-2" />
                    Group similar
                  </Label>
                  <Switch
                    id="group-similar"
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    checked={preferences?.groupSimilar ?? false}
                    onCheckedChange={(groupSimilar) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                      setPreferences((current: NotificationPreferences | undefined) => ({
                        ...current!,
                        groupSimilar
                      }))
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sound" className="text-sm font-medium">
                    <Bell size={16} className="inline mr-2" />
                    Sound
                  </Label>
                  <Switch
                    id="sound"
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    checked={preferences?.soundEnabled ?? false}
                    onCheckedChange={(soundEnabled) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                      setPreferences((current: NotificationPreferences | undefined) => ({
                        ...current!,
                        soundEnabled
                      }))
                    }}
                  />
                </div>
              </div>
            </AnimatedView>
          )}

          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 -mb-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              const count = allNotifications.filter((n: PremiumNotification) => 
                (cat.value === 'all' || n.type === cat.value) && !n.read && !n.archived
              ).length

              return (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    haptics.trigger('selection')
                    setSelectedCategory(cat.value)
                  }}
                  className={cn(
                    'rounded-full flex-shrink-0 h-9',
                    selectedCategory === cat.value && 'shadow-lg'
                  )}
                >
                  <Icon size={16} weight="fill" className="mr-1.5" />
                  {cat.label}
                  {count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-1.5 min-w-[20px] h-5 rounded-full text-xs font-bold"
                    >
                      {count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </SheetHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread' | 'archived')} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-6 py-3 bg-muted/30 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="all" className="rounded-full">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-full">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 min-w-[18px] h-5 rounded-full text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="rounded-full">
                <Archive size={16} className="mr-1.5" />
                Archived
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filter} className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {filteredNotifications.length === 0 ? (
                  <EmptyState filter={filter} />
                ) : view === 'grouped' && groupedNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {groupedNotifications.map((group) => (
                      <NotificationGroupItem
                        key={group.id}
                        group={group}
                        index={0}
                        onMarkAsRead={markGroupAsRead}
                        onArchive={archiveGroup}
                        onDelete={deleteGroup}
                        getIcon={getNotificationIcon}
                        getPriorityStyles={getPriorityStyles}
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        preferences={preferences ?? null}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {notificationsByTime.map(([timeGroup, notifs]) => (
                      <div key={timeGroup}>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                          {timeGroup}
                        </h3>
                        <div className="space-y-2">
                          {notifs.map((notification) => (
                            <PremiumNotificationItem
                              key={notification.id}
                              notification={notification}
                              index={0}
                              onMarkAsRead={markAsRead}
                              onArchive={archiveNotification}
                              onDelete={deleteNotification}
                              getIcon={getNotificationIcon}
                              getPriorityStyles={getPriorityStyles}
                              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                              preferences={preferences ?? null}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

interface EmptyStateProps {
  filter: 'all' | 'unread' | 'archived'
}

function EmptyState({ filter }: EmptyStateProps): JSX.Element {
  const emptyOpacity = useSharedValue(0)
  const emptyScale = useSharedValue(0.9)
  const bellRotate = useSharedValue(0)
  const bellScale = useSharedValue(1)

  useEffect(() => {
    emptyOpacity.value = withTiming(1, timingConfigs.smooth)
    emptyScale.value = withSpring(1, springConfigs.smooth)
    
    bellRotate.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 200 }),
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 }),
          withTiming(0, { duration: 200 })
        ),
        -1,
        false
      )
    )
    bellScale.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      )
    )
  }, [emptyOpacity, emptyScale, bellRotate, bellScale])

  const emptyStyle = useAnimatedStyle(() => {
    return {
      opacity: emptyOpacity.value,
      transform: [{ scale: emptyScale.value }]
    }
  }) as AnimatedStyle

  const bellAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${bellRotate.value}deg` },
        { scale: bellScale.value }
      ]
    }
  }) as AnimatedStyle

  return (
    <AnimatedView style={emptyStyle} className="flex flex-col items-center justify-center py-16 px-4">
      <AnimatedView style={bellAnimatedStyle}>
        <Bell size={64} weight="thin" className="text-muted-foreground/40" />
      </AnimatedView>
      <p className="text-muted-foreground mt-4 text-center text-lg font-medium">
        {filter === 'unread' && 'All caught up!'}
        {filter === 'archived' && 'No archived notifications'}
        {filter === 'all' && 'No notifications yet'}
      </p>
      <p className="text-sm text-muted-foreground/60 mt-1 text-center max-w-xs">
        {filter === 'unread' && "You've read all your notifications"}
        {filter === 'archived' && 'Archived notifications will appear here'}
        {filter === 'all' && "We'll notify you when something important happens"}
      </p>
    </AnimatedView>
  )
}

interface NotificationGroupItemProps {
  group: NotificationGroup
  index: number
  onMarkAsRead: (groupId: string) => void
  onArchive: (groupId: string) => void
  onDelete: (groupId: string) => void
  getIcon: (type: PremiumNotification['type'], priority: PremiumNotification['priority']) => React.ReactNode
  getPriorityStyles: (priority: PremiumNotification['priority']) => string
  preferences: NotificationPreferences | null
}

function NotificationGroupItem({
  group,
  index: _index,
  onMarkAsRead,
  onArchive,
  onDelete: _onDelete,
  getIcon,
  getPriorityStyles: _getPriorityStyles,
  preferences: _preferences
}: NotificationGroupItemProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const latestNotification = group.notifications[0]

  const itemOpacity = useSharedValue(0)
  const itemTranslateY = useSharedValue(20)
  const groupHover = useHoverTap({
    hoverScale: 1.005,
    tapScale: 1
  })
  const iconHover = useHoverTap({
    hoverScale: 1.05,
    tapScale: 1
  })

  useEffect(() => {
    itemOpacity.value = withTiming(1, { duration: 200 })
    itemTranslateY.value = withSpring(0, springConfigs.smooth)
  }, [itemOpacity, itemTranslateY])

  const itemStyle = useAnimatedStyle(() => {
    return {
      opacity: itemOpacity.value,
      transform: [
        { translateY: itemTranslateY.value },
        { scale: groupHover.scale.value }
      ]
    }
  }) as AnimatedStyle

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconHover.scale.value }]
    }
  }) as AnimatedStyle

  const unreadDotScale = useSharedValue(group.read ? 0 : 1)

  useEffect(() => {
    unreadDotScale.value = withSpring(group.read ? 0 : 1, springConfigs.bouncy)
  }, [group.read, unreadDotScale])

  const unreadDotStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: unreadDotScale.value }]
    }
  }) as AnimatedStyle

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <AnimatedView
        style={itemStyle}
        onMouseEnter={groupHover.handleMouseEnter}
        onMouseLeave={groupHover.handleMouseLeave}
        className={cn(
          'relative rounded-xl overflow-hidden transition-all bg-card border border-border/50',
          !group.read && 'ring-2 ring-primary/20'
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <AnimatedView
              style={iconStyle}
              onMouseEnter={iconHover.handleMouseEnter}
              onMouseLeave={iconHover.handleMouseLeave}
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 relative"
            >
              {getIcon(group.type as PremiumNotification['type'], latestNotification.priority)}
              {group.notifications.length > 1 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full text-xs font-bold"
                >
                  {group.notifications.length}
                </Badge>
              )}
            </AnimatedView>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-tight">
                    {group.title}
                  </h4>
                  <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                    {group.summary}
                  </p>
                </div>

                {!group.read && (
                  <AnimatedView style={unreadDotStyle} className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                )}
              </div>

              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(group.timestamp, { addSuffix: true })}
                </span>

                <div className="flex items-center gap-1">
                  {!group.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onMarkAsRead(group.id)}
                    >
                      <Check size={16} />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onArchive(group.id)}
                  >
                    <Archive size={16} />
                  </Button>

                  {group.notifications.length > 1 && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full h-8 text-xs"
                      >
                        {isExpanded ? 'Hide' : 'View all'}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <Separator />
          <div className="p-4 bg-muted/20 space-y-2">
            {group.notifications.slice(1).map(notification => (
              <div key={notification.id} className="text-sm p-3 bg-background rounded-lg border border-border/30">
                <p className="font-medium">{notification.title}</p>
                <p className="text-muted-foreground text-xs mt-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </AnimatedView>
    </Collapsible>
  )
}

interface PremiumNotificationItemProps {
  notification: PremiumNotification
  index: number
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: PremiumNotification['type'], priority: PremiumNotification['priority']) => React.ReactNode
  getPriorityStyles: (priority: PremiumNotification['priority']) => string
  preferences: NotificationPreferences | null
}

function PremiumNotificationItem({
  notification,
  index: _index,
  onMarkAsRead,
  onArchive,
  onDelete,
  getIcon,
  getPriorityStyles,
  preferences
}: PremiumNotificationItemProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)

  const itemOpacity = useSharedValue(0)
  const itemTranslateX = useSharedValue(20)
  const itemHover = useHoverTap({
    hoverScale: 1.01,
    tapScale: 1
  })
  const imageHover = useHoverTap({
    hoverScale: 1.02,
    tapScale: 1
  })

  useEffect(() => {
    itemOpacity.value = withTiming(1, { duration: 200 })
    itemTranslateX.value = withSpring(0, springConfigs.smooth)
  }, [itemOpacity, itemTranslateX])

  const itemStyle = useAnimatedStyle(() => {
    return {
      opacity: itemOpacity.value,
      transform: [
        { translateX: itemTranslateX.value },
        { scale: itemHover.scale.value }
      ]
    }
  }) as AnimatedStyle

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageHover.scale.value }]
    }
  }) as AnimatedStyle

  // Icon pulse animation for urgent/critical
  const iconScale = useSharedValue(1)
  const iconPulseEnabled = !notification.read && (notification.priority === 'urgent' || notification.priority === 'critical')

  useEffect(() => {
    if (iconPulseEnabled) {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      )
    } else {
      iconScale.value = withSpring(1, springConfigs.smooth)
    }
  }, [iconPulseEnabled, iconScale])

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }]
    }
  }) as AnimatedStyle

  // Unread dot animation
  const unreadDotScale = useSharedValue(notification.read ? 0 : 1)

  useEffect(() => {
    unreadDotScale.value = withSpring(notification.read ? 0 : 1, springConfigs.bouncy)
  }, [notification.read, unreadDotScale])

  const unreadDotStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: unreadDotScale.value }]
    }
  }) as AnimatedStyle

  // Action buttons animation
  const actionButtonsOpacity = useSharedValue(isHovered || notification.priority === 'urgent' ? 1 : 0)

  useEffect(() => {
    actionButtonsOpacity.value = withTiming(
      isHovered || notification.priority === 'urgent' ? 1 : 0,
      timingConfigs.fast
    )
  }, [isHovered, notification.priority, actionButtonsOpacity])

  const actionButton1Style = useAnimatedStyle(() => {
    return {
      opacity: actionButtonsOpacity.value,
      transform: [{ scale: actionButtonsOpacity.value }]
    }
  }) as AnimatedStyle

  const actionButton2Style = useAnimatedStyle(() => {
    return {
      opacity: actionButtonsOpacity.value,
      transform: [{ scale: actionButtonsOpacity.value }]
    }
  }) as AnimatedStyle

  const actionButton3Style = useAnimatedStyle(() => {
    return {
      opacity: actionButtonsOpacity.value,
      transform: [{ scale: actionButtonsOpacity.value }]
    }
  }) as AnimatedStyle

  // Priority bar animation
  const priorityBarOpacity = useSharedValue(
    (notification.priority === 'urgent' || notification.priority === 'critical') && !notification.read ? 1 : 0
  )

  useEffect(() => {
    if ((notification.priority === 'urgent' || notification.priority === 'critical') && !notification.read) {
      priorityBarOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: notification.priority === 'critical' ? 400 : 750 }),
          withTiming(1, { duration: notification.priority === 'critical' ? 400 : 750 })
        ),
        -1,
        false
      )
    } else {
      priorityBarOpacity.value = 0
    }
  }, [notification.priority, notification.read, priorityBarOpacity])

  const priorityBarStyle = useAnimatedStyle(() => {
    return {
      opacity: priorityBarOpacity.value
    }
  }) as AnimatedStyle

  // Critical pulse animation
  const criticalPulse = useSharedValue(0)

  useEffect(() => {
    if (notification.priority === 'critical' && !notification.read) {
      criticalPulse.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
    } else {
      criticalPulse.value = 0
    }
  }, [notification.priority, notification.read, criticalPulse])

  const criticalPulseStyle = useAnimatedStyle(() => {
    return {
      boxShadow: `0 0 0 ${criticalPulse.value * 4}px rgba(239, 68, 68, ${0.2 * (1 - criticalPulse.value)})`
    }
  }) as AnimatedStyle

  return (
    <AnimatedView
      style={itemStyle}
      onMouseEnter={() => {
        setIsHovered(true)
        itemHover.handleMouseEnter()
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        itemHover.handleMouseLeave()
      }}
      className={cn(
        'relative rounded-xl overflow-hidden transition-all',
        !notification.read && 'bg-primary/5',
        getPriorityStyles(notification.priority)
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AnimatedView
            style={iconAnimatedStyle}
            className={cn(
              'flex-shrink-0 rounded-xl overflow-hidden',
              notification.avatarUrl ? 'w-12 h-12' : 'w-12 h-12 flex items-center justify-center',
              !notification.avatarUrl && notification.priority === 'urgent' && 'bg-destructive/10',
              !notification.avatarUrl && notification.priority === 'high' && 'bg-accent/10',
              !notification.avatarUrl && notification.priority === 'normal' && 'bg-primary/10',
              !notification.avatarUrl && notification.priority === 'low' && 'bg-muted'
            )}
          >
            {notification.avatarUrl ? (
              <Avatar className="w-12 h-12">
                <AvatarImage src={notification.avatarUrl} />
                <AvatarFallback>{notification.metadata?.userName?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
            ) : (
              getIcon(notification.type, notification.priority)
            )}
          </AnimatedView>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  'font-semibold text-sm leading-tight',
                  !notification.read && 'text-foreground',
                  notification.read && 'text-muted-foreground'
                )}>
                  {notification.title}
                </h4>
                {preferences?.showPreviews && (
                  <p className={cn(
                    'text-sm mt-1 leading-relaxed',
                    !notification.read && 'text-foreground/80',
                    notification.read && 'text-muted-foreground/70'
                  )}>
                    {notification.message}
                  </p>
                )}
              </div>

              {!notification.read && (
                <AnimatedView style={unreadDotStyle} className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
              )}
            </div>

            {notification.imageUrl && (
              <AnimatedView 
                style={imageStyle}
                onMouseEnter={imageHover.handleMouseEnter}
                onMouseLeave={imageHover.handleMouseLeave}
                className="mt-3 rounded-lg overflow-hidden w-full h-32 bg-muted"
              >
                <img 
                  src={notification.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </AnimatedView>
            )}

            {notification.metadata && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {notification.metadata.petName && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {notification.metadata.petName}
                  </Badge>
                )}
                {notification.metadata.compatibilityScore && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    <Fire size={12} className="mr-1" weight="fill" />
                    {notification.metadata.compatibilityScore}% match
                  </Badge>
                )}
                {notification.metadata.achievementBadge && (
                  <Badge variant="secondary" className="text-xs rounded-full bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                    <Crown size={12} className="mr-1" weight="fill" />
                    {notification.metadata.achievementBadge}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </span>

              <div className="flex items-center gap-1">
                {!notification.read && (
                  <AnimatedView style={actionButton1Style}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Check size={16} />
                    </Button>
                  </AnimatedView>
                )}
                <AnimatedView style={actionButton2Style}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onArchive(notification.id)}
                  >
                    <Archive size={16} />
                  </Button>
                </AnimatedView>
                <AnimatedView style={actionButton3Style}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(notification.id)}
                  >
                    <Trash size={16} />
                  </Button>
                </AnimatedView>

                {notification.actionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 text-xs"
                    onClick={() => haptics.trigger('medium')}
                  >
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {(notification.priority === 'urgent' || notification.priority === 'critical') && !notification.read && (
        <AnimatedView
          style={priorityBarStyle}
          className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-destructive via-accent to-destructive"
        />
      )}

      {notification.priority === 'critical' && !notification.read && (
        <AnimatedView
          style={criticalPulseStyle}
          className="absolute inset-0 pointer-events-none"
        />
      )}
    </AnimatedView>
  )
}
