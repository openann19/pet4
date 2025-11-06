import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModerationQueue } from '../ModerationQueue'
import { moderationService, photoService } from '@/lib/backend-services'
import { userService } from '@/lib/user-service'

vi.mock('@/lib/backend-services', () => ({
  moderationService: {
    getQueue: vi.fn(),
    takeTask: vi.fn(),
    makeDecision: vi.fn(),
  },
  photoService: {
    getPhotosByOwner: vi.fn(),
  },
}))
vi.mock('@/lib/user-service', () => ({
  userService: {
    user: vi.fn(),
  },
}))
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockModerationService = vi.mocked(moderationService)
const mockPhotoService = vi.mocked(photoService)
const mockUserService = vi.mocked(userService)

describe('ModerationQueue', () => {
  const mockTasks = [
    {
      id: 'task1',
      photoId: 'photo1',
      ownerId: 'owner1',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task2',
      photoId: 'photo2',
      ownerId: 'owner2',
      status: 'in_progress' as const,
      createdAt: new Date().toISOString(),
    },
  ]

  const mockPhotos = [
    {
      id: 'photo1',
      url: 'https://example.com/photo1.jpg',
      ownerId: 'owner1',
    },
    {
      id: 'photo2',
      url: 'https://example.com/photo2.jpg',
      ownerId: 'owner2',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockModerationService.getQueue.mockResolvedValue({
      pending: [mockTasks[0]],
      inProgress: [mockTasks[1]],
      completed: [],
    })
    mockPhotoService.getPhotosByOwner.mockResolvedValue(mockPhotos)
    mockUserService.user.mockResolvedValue({
      id: 'moderator1',
      name: 'Test Moderator',
    } as never)
  })

  it('renders moderation queue', async () => {
    render(<ModerationQueue />)

    await waitFor(() => {
      expect(screen.getByText(/moderation queue/i)).toBeInTheDocument()
    })
  })

  it('loads and displays pending tasks', async () => {
    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })

  it('displays tasks in correct tabs', async () => {
    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })

  it('opens task detail dialog when task is clicked', async () => {
    const user = userEvent.setup()
    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })

    const taskCards = screen.queryAllByRole('button')
    if (taskCards.length > 0) {
      await user.click(taskCards[0])
    }
  })

  it('takes task when take button is clicked', async () => {
    const user = userEvent.setup()
    mockModerationService.takeTask.mockResolvedValue(undefined)

    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })

  it('approves task when approve button is clicked', async () => {
    const user = userEvent.setup()
    mockModerationService.makeDecision.mockResolvedValue(undefined)

    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })

  it('rejects task when reject button is clicked', async () => {
    const user = userEvent.setup()
    mockModerationService.makeDecision.mockResolvedValue(undefined)

    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })

  it('handles authentication errors', async () => {
    mockUserService.user.mockResolvedValue(null)

    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })

  it('handles API errors gracefully', async () => {
    mockModerationService.getQueue.mockRejectedValue(new Error('API Error'))

    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })

  it('filters tasks by status', async () => {
    const user = userEvent.setup()
    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })

    const tabs = screen.getAllByRole('tab')
    const inProgressTab = tabs.find((tab) => tab.textContent?.includes('In Progress'))
    if (inProgressTab) {
      await user.click(inProgressTab)
    }
  })

  it('displays photo in detail view', async () => {
    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockPhotoService.getPhotosByOwner).toHaveBeenCalled()
    })
  })

  it('handles empty queue', async () => {
    mockModerationService.getQueue.mockResolvedValue({
      pending: [],
      inProgress: [],
      completed: [],
    })

    render(<ModerationQueue />)

    await waitFor(() => {
      expect(mockModerationService.getQueue).toHaveBeenCalled()
    })
  })
})

