/**
 * ReportDialog tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportDialog } from '@/components/community/ReportDialog'

// Mock dependencies
vi.mock('@/api/community-api', () => ({
  communityAPI: {
    reportContent: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock spark.user()
global.spark = {
  user: vi.fn().mockResolvedValue({ id: 'user-1' }),
} as any

describe('ReportDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnReported = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    render(
      <ReportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    )

    expect(screen.getByText(/report/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(
      <ReportDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    )

    expect(screen.queryByText(/report/i)).not.toBeInTheDocument()
  })

  it('should show all report reasons', () => {
    render(
      <ReportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    )

    expect(screen.getByText(/spam/i)).toBeInTheDocument()
    expect(screen.getByText(/harassment/i)).toBeInTheDocument()
    expect(screen.getByText(/inappropriate/i)).toBeInTheDocument()
  })

  it('should require reason selection', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    render(
      <ReportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    )

    const submitButton = screen.getByRole('button', { name: /submit report/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select a reason for reporting')
    })
  })

  it('should submit report successfully', async () => {
    const user = userEvent.setup()
    const { communityAPI } = await import('@/api/community-api')
    const { toast } = await import('sonner')

    render(
      <ReportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
        onReported={mockOnReported}
      />
    )

    const spamOption = screen.getByLabelText(/spam/i)
    await user.click(spamOption)

    const submitButton = screen.getByRole('button', { name: /submit report/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(communityAPI.reportContent).toHaveBeenCalledWith({
        resourceType: 'post',
        resourceId: 'post-1',
        reason: 'spam',
        reporterId: 'user-1',
      })
      expect(toast.success).toHaveBeenCalled()
      expect(mockOnReported).toHaveBeenCalled()
    })
  })

  it('should include details when provided', async () => {
    const user = userEvent.setup()
    const { communityAPI } = await import('@/api/community-api')

    render(
      <ReportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    )

    const spamOption = screen.getByLabelText(/spam/i)
    await user.click(spamOption)

    const detailsTextarea = screen.getByLabelText(/additional details/i)
    await user.type(detailsTextarea, 'This is spam content')

    const submitButton = screen.getByRole('button', { name: /submit report/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(communityAPI.reportContent).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'This is spam content',
        })
      )
    })
  })

  it('should close dialog on cancel', async () => {
    const user = userEvent.setup()
    render(
      <ReportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})

