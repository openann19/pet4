import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationsView from '../NotificationsView'
import type { CommunityNotification } from '@/lib/community-types'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

vi.mock('@/effects/reanimated/use-entry-animation', () => ({
  useEntryAnimation: vi.fn(() => ({
    animatedStyle: {}
  }))
}))

vi.mock('@/effects/reanimated/transitions', () => ({
  springConfigs: {
    smooth: {}
  }
}))

// Mock dependencies
vi.mock('@/lib/community-service', () => ({
  communityService: {
    getNotifications: vi.fn(() => Promise.resolve([])),
    markNotificationRead: vi.fn(() => Promise.resolve())
  }
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}))

vi.mock('@/components/community/PostDetailView', () => ({
  PostDetailView: ({ open, onOpenChange, postId }: { open: boolean; onOpenChange: (open: boolean) => void; postId: string }) => 
    open ? <div data-testid="post-detail-view">Post Detail: {postId}</div> : null
}))

const mockNotifications: CommunityNotification[] = [
  {
    id: '1',
    type: 'like',
    actorId: 'user1',
    actorName: 'Fluffy Owner',
    actorAvatar: 'https://example.com/avatar1.jpg',
    targetId: 'post1',
    targetType: 'post',
    content: undefined,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false
  },
  {
    id: '2',
    type: 'comment',
    actorId: 'user2',
    actorName: 'Buddy Parent',
    actorAvatar: undefined,
    targetId: 'post2',
    targetType: 'post',
    content: undefined,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: true
  },
  {
    id: '3',
    type: 'follow',
    actorId: 'user3',
    actorName: 'Max Owner',
    targetId: 'user4',
    targetType: 'user',
    content: undefined,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false
  },
  {
    id: '4',
    type: 'mention',
    actorId: 'user5',
    actorName: 'Luna Parent',
    targetId: 'post3',
    targetType: 'post',
    content: undefined,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false
  }
]

describe('NotificationsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render notifications view with header', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
    })

    it('should render back button when onBack is provided', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue([])

      const onBack = vi.fn()
      render(<NotificationsView onBack={onBack} />)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).toBeInTheDocument()
      })
    })

    it('should not render back button when onBack is not provided', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue([])

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })

      const backButtons = screen.queryAllByRole('button', { name: /back/i })
      expect(backButtons.length).toBe(0)
    })

    it('should render tabs for all and unread', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue([])

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
        expect(screen.getByText('Unread')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading skeletons while loading', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      )

      render(<NotificationsView />)

      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
    })

    it('should hide loading skeletons after notifications load', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.queryByTestId(/skeleton/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Notification Display', () => {
    it('should display notifications when loaded', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Fluffy Owner liked your post/i)).toBeInTheDocument()
        expect(screen.getByText(/Buddy Parent commented on your post/i)).toBeInTheDocument()
      })
    })

    it('should show unread count in header', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/3 unread/i)).toBeInTheDocument()
      })
    })

    it('should show mark all read button when there are unread notifications', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Mark all read/i)).toBeInTheDocument()
      })
    })

    it('should not show mark all read button when all notifications are read', async () => {
      const { communityService } = await import('@/lib/community-service')
      const allRead = mockNotifications.map(n => ({ ...n, read: true }))
      vi.mocked(communityService.getNotifications).mockResolvedValue(allRead)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.queryByText(/Mark all read/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    it('should show all notifications by default', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Fluffy Owner/i)).toBeInTheDocument()
        expect(screen.getByText(/Buddy Parent/i)).toBeInTheDocument()
        expect(screen.getByText(/Max Owner/i)).toBeInTheDocument()
      })
    })

    it('should filter to unread notifications when unread tab is selected', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText('Unread')).toBeInTheDocument()
      })

      const unreadTab = screen.getByText('Unread')
      await user.click(unreadTab)

      await waitFor(() => {
        expect(screen.getByText(/Fluffy Owner/i)).toBeInTheDocument()
        expect(screen.getByText(/Max Owner/i)).toBeInTheDocument()
        expect(screen.queryByText(/Buddy Parent/i)).not.toBeInTheDocument()
      })
    })

    it('should show unread count in unread tab', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Unread \(3\)/i)).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no notifications', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue([])

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument()
        expect(screen.getByText(/When you get notifications, they'll appear here/i)).toBeInTheDocument()
      })
    })

    it('should show appropriate empty state for unread filter', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const allRead = mockNotifications.map(n => ({ ...n, read: true }))
      vi.mocked(communityService.getNotifications).mockResolvedValue(allRead)

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText('Unread')).toBeInTheDocument()
      })

      const unreadTab = screen.getByText('Unread')
      await user.click(unreadTab)

      await waitFor(() => {
        expect(screen.getByText('No unread notifications')).toBeInTheDocument()
        expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument()
      })
    })
  })

  describe('Mark as Read', () => {
    it('should mark notification as read when clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const { haptics } = await import('@/lib/haptics')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)
      vi.mocked(communityService.markNotificationRead).mockResolvedValue()

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Fluffy Owner/i)).toBeInTheDocument()
      })

      const notification = screen.getByText(/Fluffy Owner liked your post/i).closest('div[class*="cursor-pointer"]')
      if (notification) {
        await user.click(notification)
      }

      await waitFor(() => {
        expect(communityService.markNotificationRead).toHaveBeenCalledWith('1')
        expect(haptics.impact).toHaveBeenCalledWith('light')
      })
    })

    it('should mark all notifications as read when button is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const { haptics } = await import('@/lib/haptics')
      const { toast } = await import('sonner')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)
      vi.mocked(communityService.markNotificationRead).mockResolvedValue()

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Mark all read/i)).toBeInTheDocument()
      })

      const markAllButton = screen.getByText(/Mark all read/i)
      await user.click(markAllButton)

      await waitFor(() => {
        expect(communityService.markNotificationRead).toHaveBeenCalledTimes(3)
        expect(haptics.impact).toHaveBeenCalledWith('medium')
        expect(toast.success).toHaveBeenCalledWith('All notifications marked as read')
      })
    })

    it('should not mark as read if notification is already read', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const readNotification = { ...mockNotifications[1] } // Already read
      vi.mocked(communityService.getNotifications).mockResolvedValue([readNotification])

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Buddy Parent/i)).toBeInTheDocument()
      })

      const notification = screen.getByText(/Buddy Parent/i).closest('div[class*="cursor-pointer"]')
      if (notification) {
        await user.click(notification)
      }

      await waitFor(() => {
        expect(communityService.markNotificationRead).not.toHaveBeenCalled()
      })
    })
  })

  describe('Notification Click Handlers', () => {
    it('should call onPostClick when post notification is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const onPostClick = vi.fn()
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)
      vi.mocked(communityService.markNotificationRead).mockResolvedValue()

      render(<NotificationsView onPostClick={onPostClick} />)

      await waitFor(() => {
        expect(screen.getByText(/Fluffy Owner/i)).toBeInTheDocument()
      })

      const notification = screen.getByText(/Fluffy Owner liked your post/i).closest('div[class*="cursor-pointer"]')
      if (notification) {
        await user.click(notification)
      }

      await waitFor(() => {
        expect(onPostClick).toHaveBeenCalledWith('post1')
      })
    })

    it('should call onUserClick when user notification is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const onUserClick = vi.fn()
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)
      vi.mocked(communityService.markNotificationRead).mockResolvedValue()

      render(<NotificationsView onUserClick={onUserClick} />)

      await waitFor(() => {
        expect(screen.getByText(/Max Owner/i)).toBeInTheDocument()
      })

      const notification = screen.getByText(/Max Owner/i).closest('div[class*="cursor-pointer"]')
      if (notification) {
        await user.click(notification)
      }

      await waitFor(() => {
        expect(onUserClick).toHaveBeenCalledWith('user4')
      })
    })

    it('should open post detail dialog when post notification is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)
      vi.mocked(communityService.markNotificationRead).mockResolvedValue()

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Fluffy Owner/i)).toBeInTheDocument()
      })

      const notification = screen.getByText(/Fluffy Owner liked your post/i).closest('div[class*="cursor-pointer"]')
      if (notification) {
        await user.click(notification)
      }

      await waitFor(() => {
        expect(screen.getByTestId('post-detail-view')).toBeInTheDocument()
        expect(screen.getByText(/Post Detail: post1/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle error when loading notifications fails', async () => {
      const { communityService } = await import('@/lib/community-service')
      const { toast } = await import('sonner')
      vi.mocked(communityService.getNotifications).mockRejectedValue(new Error('Failed to load'))

      render(<NotificationsView />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load notifications')
      })
    })

    it('should handle error when marking notification as read fails', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getNotifications).mockResolvedValue(mockNotifications)
      vi.mocked(communityService.markNotificationRead).mockRejectedValue(new Error('Failed to mark'))

      render(<NotificationsView />)

      await waitFor(() => {
        expect(screen.getByText(/Fluffy Owner/i)).toBeInTheDocument()
      })

      const notification = screen.getByText(/Fluffy Owner/i).closest('div[class*="cursor-pointer"]')
      if (notification) {
        await user.click(notification)
      }

      await waitFor(() => {
        expect(communityService.markNotificationRead).toHaveBeenCalled()
      })
    })
  })

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const onBack = vi.fn()
      vi.mocked(communityService.getNotifications).mockResolvedValue([])

      render(<NotificationsView onBack={onBack} />)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      expect(onBack).toHaveBeenCalled()
    })
  })
})

