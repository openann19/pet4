import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportsView from '../ReportsView'
import { adminApi } from '@/api/admin-api'
import { useStorage } from '@/hooks/useStorage'

vi.mock('@/api/admin-api')
vi.mock('@/hooks/useStorage')
vi.mock('@/lib/utils', () => ({
  generateULID: vi.fn(() => 'test-ulid-123'),
}))
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const mockAdminApi = vi.mocked(adminApi)
const mockUseStorage = vi.mocked(useStorage)

describe('ReportsView', () => {
  const mockReports = [
    {
      id: '1',
      reportedBy: 'User #1234',
      reportedPetId: 'pet-001',
      reason: 'Inappropriate content',
      description: 'Pet profile contains inappropriate images',
      status: 'pending' as const,
      priority: 'high' as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      reportedBy: 'User #5678',
      reportedUserId: 'user-002',
      reason: 'Harassment',
      description: 'User sending harassing messages',
      status: 'reviewing' as const,
      priority: 'critical' as const,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      reportedBy: 'User #9012',
      reportedPetId: 'pet-003',
      reason: 'Fake profile',
      description: 'Suspected fake pet profile',
      status: 'resolved' as const,
      priority: 'medium' as const,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-reports') {
        return [[], vi.fn()]
      }
      return [defaultValue, vi.fn()]
    })
    mockAdminApi.resolveReport = vi.fn().mockResolvedValue(undefined)
    mockAdminApi.dismissReport = vi.fn().mockResolvedValue(undefined)
  })

  it('renders reports view', async () => {
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/reports/i)).toBeInTheDocument()
    })
  })

  it('displays sample reports when storage is empty', async () => {
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })
  })

  it('displays existing reports from storage', async () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-reports') {
        return [mockReports, vi.fn()]
      }
      return [defaultValue, vi.fn()]
    })

    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
      expect(screen.getByText(/harassment/i)).toBeInTheDocument()
    })
  })

  it('filters reports by status', async () => {
    const user = userEvent.setup()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-reports') {
        return [mockReports, vi.fn()]
      }
      return [defaultValue, vi.fn()]
    })

    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })

    const pendingTab = screen.getByRole('tab', { name: /pending/i })
    await user.click(pendingTab)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
      expect(screen.queryByText(/harassment/i)).not.toBeInTheDocument()
    })
  })

  it('opens report detail dialog on click', async () => {
    const user = userEvent.setup()
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })

    const reportCard = screen.getByText(/inappropriate content/i).closest('[role="button"]')
    if (reportCard) {
      await user.click(reportCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('displays report details in dialog', async () => {
    const user = userEvent.setup()
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })

    const reportCard = screen.getByText(/inappropriate content/i).closest('[role="button"]')
    if (reportCard) {
      await user.click(reportCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
      expect(screen.getByText(/pet profile contains/i)).toBeInTheDocument()
    })
  })

  it('resolves report with resolution text', async () => {
    const user = userEvent.setup()
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })

    const reportCard = screen.getByText(/inappropriate content/i).closest('[role="button"]')
    if (reportCard) {
      await user.click(reportCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const resolutionTextarea = screen.getByPlaceholderText(/resolution/i)
    await user.type(resolutionTextarea, 'Content removed and user warned')

    const actionSelect = screen.getByRole('combobox')
    await user.click(actionSelect)

    const resolveOption = screen.getByText(/resolve/i)
    await user.click(resolveOption)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAdminApi.resolveReport).toHaveBeenCalled()
    })
  })

  it('dismisses report', async () => {
    const user = userEvent.setup()
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })

    const reportCard = screen.getByText(/inappropriate content/i).closest('[role="button"]')
    if (reportCard) {
      await user.click(reportCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const actionSelect = screen.getByRole('combobox')
    await user.click(actionSelect)

    const dismissOption = screen.getByText(/dismiss/i)
    await user.click(dismissOption)

    const resolutionTextarea = screen.getByPlaceholderText(/resolution/i)
    await user.type(resolutionTextarea, 'No violation found')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAdminApi.dismissReport).toHaveBeenCalled()
    })
  })

  it('displays priority badges correctly', async () => {
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/high/i)).toBeInTheDocument()
      expect(screen.getByText(/critical/i)).toBeInTheDocument()
    })
  })

  it('displays status badges correctly', async () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-reports') {
        return [mockReports, vi.fn()]
      }
      return [defaultValue, vi.fn()]
    })

    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
      expect(screen.getByText(/reviewing/i)).toBeInTheDocument()
      expect(screen.getByText(/resolved/i)).toBeInTheDocument()
    })
  })

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })

    const reportCard = screen.getByText(/inappropriate content/i).closest('[role="button"]')
    if (reportCard) {
      await user.click(reportCard)
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

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    mockAdminApi.resolveReport.mockRejectedValue(new Error('API Error'))

    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    })

    const reportCard = screen.getByText(/inappropriate content/i).closest('[role="button"]')
    if (reportCard) {
      await user.click(reportCard)
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    const resolutionTextarea = screen.getByPlaceholderText(/resolution/i)
    await user.type(resolutionTextarea, 'Test resolution')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAdminApi.resolveReport).toHaveBeenCalled()
    })
  })

  it('displays report timestamp', async () => {
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/user #1234/i)).toBeInTheDocument()
    })
  })

  it('displays reported by information', async () => {
    render(<ReportsView />)

    await waitFor(() => {
      expect(screen.getByText(/user #1234/i)).toBeInTheDocument()
      expect(screen.getByText(/user #5678/i)).toBeInTheDocument()
    })
  })
})

