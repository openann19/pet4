import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContentView from '../ContentView'
import { useStorage } from '@/hooks/useStorage'

vi.mock('@/hooks/useStorage')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUseStorage = vi.mocked(useStorage)

describe('ContentView', () => {
  const mockPets = [
    {
      _id: '1',
      name: 'Buddy',
      breed: 'Golden Retriever',
      photos: ['photo1.jpg'],
    },
    {
      _id: '2',
      name: 'Luna',
      breed: 'Siamese',
      photos: ['photo2.jpg'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [mockPets, vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })
  })

  it('renders content view', () => {
    render(<ContentView />)

    expect(screen.getByText(/content moderation/i)).toBeInTheDocument()
  })

  it('displays pet profiles', () => {
    render(<ContentView />)

    expect(screen.getByText(/buddy/i)).toBeInTheDocument()
    expect(screen.getByText(/luna/i)).toBeInTheDocument()
  })

  it('filters pets by search query', async () => {
    const user = userEvent.setup()
    render(<ContentView />)

    const searchInput = screen.getByPlaceholderText(/search pets/i)
    await user.type(searchInput, 'Buddy')

    await waitFor(() => {
      expect(screen.getByText(/buddy/i)).toBeInTheDocument()
      expect(screen.queryByText(/luna/i)).not.toBeInTheDocument()
    })
  })

  it('filters pets by breed', async () => {
    const user = userEvent.setup()
    render(<ContentView />)

    const searchInput = screen.getByPlaceholderText(/search pets/i)
    await user.type(searchInput, 'Golden')

    await waitFor(() => {
      expect(screen.getByText(/buddy/i)).toBeInTheDocument()
    })
  })

  it('opens pet detail dialog when pet is clicked', async () => {
    const user = userEvent.setup()
    render(<ContentView />)

    await waitFor(() => {
      expect(screen.getByText(/buddy/i)).toBeInTheDocument()
    })

    const petCard = screen.getByText(/buddy/i).closest('[role="button"]')
    if (petCard) {
      await user.click(petCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('approves pet when approve button is clicked', async () => {
    const user = userEvent.setup()
    render(<ContentView />)

    await waitFor(() => {
      expect(screen.getByText(/buddy/i)).toBeInTheDocument()
    })

    const petCard = screen.getByText(/buddy/i).closest('[role="button"]')
    if (petCard) {
      await user.click(petCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const approveButton = screen.getByRole('button', { name: /approve/i })
    await user.click(approveButton)
  })

  it('removes pet when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<ContentView />)

    await waitFor(() => {
      expect(screen.getByText(/buddy/i)).toBeInTheDocument()
    })

    const petCard = screen.getByText(/buddy/i).closest('[role="button"]')
    if (petCard) {
      await user.click(petCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const removeButton = screen.getByRole('button', { name: /remove/i })
    await user.click(removeButton)
  })

  it('filters by status tabs', async () => {
    const user = userEvent.setup()
    render(<ContentView />)

    const allTab = screen.getByRole('tab', { name: /all/i })
    await user.click(allTab)

    expect(screen.getByText(/content moderation/i)).toBeInTheDocument()
  })

  it('displays pet count in tabs', () => {
    render(<ContentView />)

    expect(screen.getByText(/all \(2\)/i)).toBeInTheDocument()
  })

  it('handles empty pets array', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [[], vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    render(<ContentView />)

    expect(screen.getByText(/content moderation/i)).toBeInTheDocument()
  })

  it('handles null pets', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [null, vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    render(<ContentView />)

    expect(screen.getByText(/content moderation/i)).toBeInTheDocument()
  })

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<ContentView />)

    await waitFor(() => {
      expect(screen.getByText(/buddy/i)).toBeInTheDocument()
    })

    const petCard = screen.getByText(/buddy/i).closest('[role="button"]')
    if (petCard) {
      await user.click(petCard)
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
})

