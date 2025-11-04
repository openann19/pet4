import { useState, useMemo } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion, AnimatePresence } from 'framer-motion'
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
import { NotificationTabs, type TabKey } from './NotificationTabs'
import { useLanguage } from '@/hooks/useLanguage'
import { analytics } from '@/lib/analytics'

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

export function PremiumNotificationCenter({ isOpen, onClose }: PremiumNotificationCenterProps) {
  const [notifications, setNotifications] = useStorage<PremiumNotification[]>('premium-notifications', [])
  const [preferences, setPreferences] = useStorage<NotificationPreferences>('notification-preferences', {
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    groupSimilar: true,
    showPreviews: true,
    soundEnabled: true,
    pushEnabled: true
  })
  
  const { language } = useLanguage()
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const [view, setView] = useState<'grouped' | 'list'>('grouped')
  const [showSettings, setShowSettings] = useState(false)

  const allNotifications = notifications || []
  
  // Calculate unread counts per tab
  const unreadCounts = useMemo(() => {
    const all = allNotifications.filter(n => !n.read && !n.archived).length
    const matches = allNotifications.filter(n => !n.read && !n.archived && (n.type === 'match' || n.type === 'like')).length
    const messages = allNotifications.filter(n => !n.read && !n.archived && n.type === 'message').length
    return { all, matches, messages }
  }, [allNotifications])

  // Filter notifications based on filter state (all/unread/archived) - tab filtering happens in renderPanel
  const filteredNotifications = useMemo(() => {
    return allNotifications
      .filter(n => {
        if (filter === 'archived') return n.archived
        if (filter === 'unread') return !n.read && !n.archived
        return !n.archived
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [allNotifications, filter])

  const groupedNotifications = useMemo(() => {
    if (!preferences?.groupSimilar || view === 'list') {
      return []
    }

    const groups: Map<string, PremiumNotification[]> = new Map()
    
    filteredNotifications.forEach(notification => {
      const groupKey = notification.groupId || `${notification.type}-${notification.metadata?.userName || notification.metadata?.petName || 'solo'}`
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(notification)
    })

    return Array.from(groups.entries())
      .map(([key, notifs]): NotificationGroup => {
        const latest = notifs[0]
        if (!latest) {
          throw new Error('Notification group is empty')
        }
        const allRead = notifs.every(n => n.read)
        
        return {
          id: key,
          type: latest.type,
          notifications: notifs,
          title: notifs.length === 1 ? latest.title : `${latest.title} and ${notifs.length - 1} more`,
          summary: notifs.length === 1 
            ? latest.message 
            : `${notifs.length} notifications from ${latest.metadata?.userName || latest.metadata?.petName || 'various users'}`,
          timestamp: latest.timestamp,
          read: allRead
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [filteredNotifications, preferences?.groupSimilar, view])

  const unreadCount = allNotifications.filter(n => !n.read && !n.archived).length
  const archivedCount = allNotifications.filter(n => n.archived).length

  const markAsRead = (id: string) => {
    haptics.trigger('light')
    setNotifications(current =>
      (current || []).map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markGroupAsRead = (groupId: string) => {
    haptics.trigger('medium')
    const group = groupedNotifications.find(g => g.id === groupId)
    if (group) {
      setNotifications(current =>
        (current || []).map(n => 
          group.notifications.some(gn => gn.id === n.id) ? { ...n, read: true } : n
        )
      )
    }
  }

  const markAllAsRead = () => {
    haptics.trigger('medium')
    setNotifications(current =>
      (current || []).map(n => ({ ...n, read: true }))
    )
  }

  const archiveNotification = (id: string) => {
    haptics.trigger('medium')
    setNotifications(current =>
      (current || []).map(n => n.id === id ? { ...n, archived: true, read: true } : n)
    )
  }

  const archiveGroup = (groupId: string) => {
    haptics.trigger('heavy')
    const group = groupedNotifications.find(g => g.id === groupId)
    if (group) {
      setNotifications(current =>
        (current || []).map(n => 
          group.notifications.some(gn => gn.id === n.id) 
            ? { ...n, archived: true, read: true } 
            : n
        )
      )
    }
  }

  const deleteNotification = (id: string) => {
    haptics.trigger('medium')
    setNotifications(current =>
      (current || []).filter(n => n.id !== id)
    )
  }

  const deleteGroup = (groupId: string) => {
    haptics.trigger('heavy')
    const group = groupedNotifications.find(g => g.id === groupId)
    if (group) {
      setNotifications(current =>
        (current || []).filter(n => !group.notifications.some(gn => gn.id === n.id))
      )
    }
  }

  const deleteAllArchived = () => {
    haptics.trigger('heavy')
    setNotifications(current =>
      (current || []).filter(n => !n.archived)
    )
  }

  const getNotificationIcon = (type: PremiumNotification['type'], priority: PremiumNotification['priority']) => {
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
  }

  const getPriorityStyles = (priority: PremiumNotification['priority']) => {
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
  }

  const getTimeGroup = (timestamp: number) => {
    const date = new Date(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isSameWeek(date, new Date())) return 'This Week'
    return 'Earlier'
  }


  // Handle tab change with analytics
  const handleTabChange = (from: TabKey, to: TabKey): void => {
    analytics.track('notification.tab_changed', { from, to })
  }

  // Handle optimistic unread count updates
  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-br from-background via-primary/5 to-accent/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
              >
                <BellRinging size={28} weight="fill" className="text-primary" />
              </motion.div>
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
                  <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
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

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4 border-t border-border/30 mt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quiet-hours" className="text-sm font-medium">
                      <MoonStars size={16} className="inline mr-2" />
                      Quiet hours
                    </Label>
                    <Switch
                      id="quiet-hours"
                      checked={preferences?.quietHours.enabled || false}
                      onCheckedChange={(enabled) => {
                        setPreferences(current => ({
                          ...current,
                          quietHours: { ...current.quietHours, enabled }
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
                      checked={preferences?.groupSimilar || false}
                      onCheckedChange={(groupSimilar) => {
                        setPreferences(current => ({
                          ...current,
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
                      checked={preferences?.soundEnabled || false}
                      onCheckedChange={(soundEnabled) => {
                        setPreferences(current => ({
                          ...current,
                          soundEnabled
                        }))
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </SheetHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-6 py-3 bg-muted/30 shrink-0">
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
            {/* Segmented tabs using NotificationTabs component - replaces category slider */}
            <NotificationTabs
              locale={language}
              unread={unreadCounts}
              onTabChange={handleTabChange}
              onRequestClose={onClose}
              renderPanel={(tabKey) => {
                // Filter notifications by tab and current filter state
                const tabFilteredNotifications = allNotifications
                  .filter(n => {
                    if (filter === 'archived') return n.archived
                    if (filter === 'unread') return !n.read && !n.archived
                    return !n.archived
                  })
                  .filter(n => {
                    if (tabKey === 'all') return true
                    if (tabKey === 'matches') return n.type === 'match' || n.type === 'like'
                    if (tabKey === 'messages') return n.type === 'message'
                    return true
                  })
                  .sort((a, b) => b.timestamp - a.timestamp)

                // Calculate grouped notifications (no hooks inside renderPanel)
                const tabGroupedNotifications = (() => {
                  if (!preferences?.groupSimilar || view === 'list') {
                    return []
                  }

                  const groups: Map<string, PremiumNotification[]> = new Map()
                  
                  tabFilteredNotifications.forEach(notification => {
                    const groupKey = notification.groupId || `${notification.type}-${notification.metadata?.userName || notification.metadata?.petName || 'solo'}`
                    
                    if (!groups.has(groupKey)) {
                      groups.set(groupKey, [])
                    }
                    groups.get(groupKey)!.push(notification)
                  })

                  return Array.from(groups.entries())
                    .map(([key, notifs]): NotificationGroup => {
                      const latest = notifs[0]
                      if (!latest) {
                        throw new Error('Notification group is empty')
                      }
                      const allRead = notifs.every(n => n.read)
                      
                      return {
                        id: key,
                        type: latest.type,
                        notifications: notifs,
                        title: notifs.length === 1 ? latest.title : `${latest.title} and ${notifs.length - 1} more`,                                            
                        summary: notifs.length === 1 
                          ? latest.message 
                          : `${notifs.length} notifications from ${latest.metadata?.userName || latest.metadata?.petName || 'various users'}`,                  
                        timestamp: latest.timestamp,
                        read: allRead
                      }
                    })
                    .sort((a, b) => b.timestamp - a.timestamp)
                })()

                // Calculate time-grouped notifications (no hooks inside renderPanel)
                const tabNotificationsByTime = (() => {
                  const groups: Record<string, PremiumNotification[]> = {
                    'Today': [],
                    'Yesterday': [],
                    'This Week': [],
                    'Earlier': []
                  }

                  tabFilteredNotifications.forEach(notification => {
                    const group = getTimeGroup(notification.timestamp)
                    const groupArray = groups[group]
                    if (groupArray) {
                      groupArray.push(notification)
                    }
                  })

                  return Object.entries(groups).filter(([_, notifs]) => notifs.length > 0)
                })()

                return (
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <AnimatePresence mode="popLayout">
                        {tabFilteredNotifications.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center justify-center py-16 px-4"
                          >
                            <motion.div
                              animate={{
                                rotate: [0, -10, 10, -10, 0],
                                scale: [1, 1.05, 1]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                              }}
                            >
                              <Bell size={64} weight="thin" className="text-muted-foreground/40" />
                            </motion.div>
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
                          </motion.div>
                        ) : view === 'grouped' && tabGroupedNotifications.length > 0 ? (
                          <div className="space-y-3">
                            {tabGroupedNotifications.map((group, index) => (
                              <motion.div
                                key={group.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20, height: 0 }}
                                transition={{ 
                                  delay: index * 0.03,
                                  layout: { duration: 0.2 }
                                }}
                              >
                                <NotificationGroupItem
                                  group={group}
                                  onMarkAsRead={markGroupAsRead}
                                  onArchive={archiveGroup}
                                  onDelete={deleteGroup}
                                  getIcon={getNotificationIcon}
                                  getPriorityStyles={getPriorityStyles}
                                  preferences={preferences || null}
                                />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {tabNotificationsByTime.map(([timeGroup, notifs]) => (
                              <div key={timeGroup}>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                                  {timeGroup}
                                </h3>
                                <div className="space-y-2">
                                  {notifs.map((notification, index) => (
                                    <motion.div
                                      key={notification.id}
                                      layout
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -20, height: 0 }}
                                      transition={{ 
                                        delay: index * 0.02,
                                        layout: { duration: 0.2 }
                                      }}
                                    >
                                      <PremiumNotificationItem
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                        onArchive={archiveNotification}
                                        onDelete={deleteNotification}
                                        getIcon={getNotificationIcon}
                                        getPriorityStyles={getPriorityStyles}
                                        preferences={preferences || null}
                                      />
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )
              }}
              storageKey="notifications:lastTab"
              edgeFade={true}
              className="flex-1 flex flex-col overflow-hidden h-full"
              ariaLabel={language === 'bg' ? 'Сегменти известия' : 'Notification segments'}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

interface NotificationGroupItemProps {
  group: NotificationGroup
  onMarkAsRead: (groupId: string) => void
  onArchive: (groupId: string) => void
  onDelete: (groupId: string) => void
  getIcon: (type: PremiumNotification['type'], priority: PremiumNotification['priority']) => React.ReactNode
  getPriorityStyles: (priority: PremiumNotification['priority']) => string
  preferences: NotificationPreferences | null
}

function NotificationGroupItem({
  group,
  onMarkAsRead,
  onArchive,
  onDelete,
  getIcon,
  getPriorityStyles,
  preferences
}: NotificationGroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const latestNotification = group.notifications[0]
  if (!latestNotification) return null

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <motion.div
        className={cn(
          'relative rounded-xl overflow-hidden transition-all bg-card border border-border/50',
          !group.read && 'ring-2 ring-primary/20',
          getPriorityStyles(latestNotification.priority)
        )}
        whileHover={{ scale: 1.005 }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <motion.div
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 relative"
              whileHover={{ scale: 1.05 }}
            >
              {getIcon(group.type as any, latestNotification.priority)}
              {group.notifications.length > 1 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full text-xs font-bold"
                >
                  {group.notifications.length}
                </Badge>
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-tight">
                    {group.title}
                  </h4>
                  {preferences?.showPreviews && (
                    <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                      {group.summary}
                    </p>
                  )}
                </div>

                {!group.read && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1"
                  />
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(group.id)}
                  >
                    <Trash size={16} />
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
      </motion.div>
    </Collapsible>
  )
}

interface PremiumNotificationItemProps {
  notification: PremiumNotification
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: PremiumNotification['type'], priority: PremiumNotification['priority']) => React.ReactNode
  getPriorityStyles: (priority: PremiumNotification['priority']) => string
  preferences: NotificationPreferences | null
}

function PremiumNotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  getIcon,
  getPriorityStyles,
  preferences
}: PremiumNotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={cn(
        'relative rounded-xl overflow-hidden transition-all',
        !notification.read && 'bg-primary/5',
        getPriorityStyles(notification.priority)
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <motion.div
            className={cn(
              'shrink-0 rounded-xl overflow-hidden',
              notification.avatarUrl ? 'w-12 h-12' : 'w-12 h-12 flex items-center justify-center',
              !notification.avatarUrl && notification.priority === 'urgent' && 'bg-destructive/10',
              !notification.avatarUrl && notification.priority === 'high' && 'bg-accent/10',
              !notification.avatarUrl && notification.priority === 'normal' && 'bg-primary/10',
              !notification.avatarUrl && notification.priority === 'low' && 'bg-muted'
            )}
            animate={{
              scale: !notification.read && (notification.priority === 'urgent' || notification.priority === 'critical')
                ? [1, 1.05, 1] 
                : 1
            }}
            transition={{ 
              duration: 1, 
              repeat: !notification.read && (notification.priority === 'urgent' || notification.priority === 'critical') ? Infinity : 0 
            }}
          >
            {notification.avatarUrl ? (
              <Avatar className="w-12 h-12">
                <AvatarImage src={notification.avatarUrl} />
                <AvatarFallback>{notification.metadata?.userName?.[0] || '?'}</AvatarFallback>
              </Avatar>
            ) : (
              getIcon(notification.type, notification.priority)
            )}
          </motion.div>

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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1"
                />
              )}
            </div>

            {notification.imageUrl && (
              <motion.div 
                className="mt-3 rounded-lg overflow-hidden w-full h-32 bg-muted"
                whileHover={{ scale: 1.02 }}
              >
                <img 
                  src={notification.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
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
                <AnimatePresence>
                  {(isHovered || notification.priority === 'urgent') && (
                    <>
                      {!notification.read && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => onMarkAsRead(notification.id)}
                          >
                            <Check size={16} />
                          </Button>
                        </motion.div>
                      )}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => onArchive(notification.id)}
                        >
                          <Archive size={16} />
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete(notification.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

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
        <motion.div
          className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-destructive via-accent to-destructive"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: notification.priority === 'critical' ? 0.8 : 1.5,
            repeat: Infinity
          }}
        />
      )}

      {notification.priority === 'critical' && !notification.read && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0)',
              '0 0 0 4px rgba(239, 68, 68, 0.2)',
              '0 0 0 0 rgba(239, 68, 68, 0)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        />
      )}
    </motion.div>
  )
}
