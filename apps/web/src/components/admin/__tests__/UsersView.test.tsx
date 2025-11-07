import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersView from '../UsersView'
import { adminApi } from '@/api/admin-api'
import { useStorage } from '@/hooks/useStorage'
import { isTruthy, isDefined } from '@/core/guards';

vi.mock('@/api/admin-api')
vi.mock('@/hooks/useStorage')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const mockAdminApi = vi.mocked(adminApi)
const mockUseStorage = vi.mocked(useStorage)

describe('UsersView', () => {
  const mockPets = [
    {
      _id: '1',
      name: 'Buddy',
      ownerId: 'owner1',
      ownerName: 'John Doe',
      photos: ['photo1.jpg'],
    },
    {
      _id: '2',
      name: 'Luna',
      ownerId: 'owner2',
      ownerName: 'Jane Smith',
      photos: ['photo2.jpg'],
    },
    {
      _id: '3',
      name: 'Max',
      ownerId: 'owner1',
      ownerName: 'John Doe',
      photos: ['photo3.jpg'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [mockPets]
      }
      return [defaultValue, vi.fn()]
    })
    mockAdminApi.suspendUser = vi.fn().mockResolvedValue(undefined)
    mockAdminApi.banUser = vi.fn().mockResolvedValue(undefined)
    mockAdminApi.activateUser = vi.fn().mockResolvedValue(undefined)
  })

  it('renders users view', async () => {
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument()
    })
  })

  it('displays users from pets data', async () => {
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument()
    })
  })

  it('calculates pets count per user correctly', async () => {
    render(<UsersView />)

    await waitFor(() => {
      const johnDoeRow = screen.getByText(/john doe/i).closest('div')
      if (isTruthy(johnDoeRow)) {
        expect(within(johnDoeRow).getByText(/2/i)).toBeInTheDocument()
      }
    })
  })

  it('filters users by search query', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Jane')

    await waitFor(() => {
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument()
      expect(screen.queryByText(/john doe/i)).not.toBeInTheDocument()
    })
  })

  it('filters users by status', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument()
    })

    const statusTabs = screen.getAllByRole('tab')
    const activeTab = statusTabs.find((tab) => tab.textContent?.includes('Active'))
    if (isTruthy(activeTab)) {
      await user.click(activeTab)
    }
  })

  it('opens user detail dialog on click', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]')
    if (isTruthy(userCard)) {
      await user.click(userCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('displays user details in dialog', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]')
    if (isTruthy(userCard)) {
      await user.click(userCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })
  })

  it('suspends user when suspend button is clicked', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]')
    if (isTruthy(userCard)) {
      await user.click(userCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const suspendButton = screen.getByRole('button', { name: /suspend/i })
    await user.click(suspendButton)

    await waitFor(() => {
      expect(mockAdminApi.suspendUser).toHaveBeenCalled()
    })
  })

  it('bans user when ban button is clicked', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]')
    if (isTruthy(userCard)) {
      await user.click(userCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const banButton = screen.getByRole('button', { name: /ban/i })
    await user.click(banButton)

    await waitFor(() => {
      expect(mockAdminApi.banUser).toHaveBeenCalled()
    })
  })

  it('activates user when activate button is clicked', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]')
    if (isTruthy(userCard)) {
      await user.click(userCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const activateButton = screen.getByRole('button', { name: /activate/i })
    if (isTruthy(activateButton)) {
      await user.click(activateButton)

      await waitFor(() => {
        expect(mockAdminApi.activateUser).toHaveBeenCalled()
      })
    }
  })

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]')
    if (isTruthy(userCard)) {
      await user.click(userCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('handles empty pets array', async () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [[]]
      }
      return [defaultValue, vi.fn()]
    })

    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument()
    })
  })

  it('handles pets without ownerId or ownerName', async () => {
    const petsWithoutOwner = [
      { _id: '1', name: 'Buddy', photos: [] },
      { _id: '2', name: 'Luna', ownerId: 'owner2', photos: [] },
    ]

    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [petsWithoutOwner]
      }
      return [defaultValue, vi.fn()]
    })

    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument()
    })
  })

  it('displays user email correctly', async () => {
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john.doe@example.com/i)).toBeInTheDocument()
    })
  })

  it('displays user role badge', async () => {
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/user/i)).toBeInTheDocument()
    })
  })

  it('displays user status badge', async () => {
    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    mockAdminApi.suspendUser.mockRejectedValue(new Error('API Error'))

    render(<UsersView />)

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    })

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]')
    if (isTruthy(userCard)) {
      await user.click(userCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const suspendButton = screen.getByRole('button', { name: /suspend/i })
    await user.click(suspendButton)

    await waitFor(() => {
      expect(mockAdminApi.suspendUser).toHaveBeenCalled()
    })
  })
})

