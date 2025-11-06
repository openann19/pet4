/**
 * AgeGateModal tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgeGateModal from '@/components/auth/AgeGateModal'

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      auth: {
        birthDateRequired: 'Please enter your birth date',
        ageTooYoung: 'You must be at least 18 years old to use this app',
        verificationError: 'Verification failed. Please try again.',
        verifyAge: 'Verify Age',
        enterBirthDate: 'Enter your birth date',
        country: 'Country (optional)',
      },
    },
  }),
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}))

vi.mock('@/lib/kyc-service', () => ({
  recordAgeVerification: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn(() => ['user-1']),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('AgeGateModal', () => {
  const mockOnVerified = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when closed', () => {
    render(<AgeGateModal open={false} onVerified={mockOnVerified} onClose={mockOnClose} />)

    expect(screen.queryByText(/enter your birth date/i)).not.toBeInTheDocument()
  })

  it('should render when open', () => {
    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />)

    expect(screen.getByText(/enter your birth date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify age/i })).toBeInTheDocument()
  })

  it('should show error when birth date is not provided', async () => {
    const user = userEvent.setup()
    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />)

    const verifyButton = screen.getByRole('button', { name: /verify age/i })
    await user.click(verifyButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter your birth date')).toBeInTheDocument()
    })
  })

  it('should show error when user is too young', async () => {
    const user = userEvent.setup()
    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />)

    // Set birth date to 5 years ago (too young)
    const birthDateInput = screen.getByLabelText(/birth date/i)
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    const dateString = fiveYearsAgo.toISOString().split('T')[0]

    await user.type(birthDateInput, dateString)
    await user.click(screen.getByRole('button', { name: /verify age/i }))

    await waitFor(() => {
      expect(screen.getByText(/you must be at least 18 years old/i)).toBeInTheDocument()
    })
  })

  it('should verify age successfully when user is 18 or older', async () => {
    const user = userEvent.setup()
    const { recordAgeVerification } = await import('@/lib/kyc-service')
    vi.mocked(recordAgeVerification).mockResolvedValue({})

    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />)

    // Set birth date to 20 years ago (old enough)
    const birthDateInput = screen.getByLabelText(/birth date/i)
    const twentyYearsAgo = new Date()
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20)
    const dateString = twentyYearsAgo.toISOString().split('T')[0]

    await user.type(birthDateInput, dateString)
    await user.click(screen.getByRole('button', { name: /verify age/i }))

    await waitFor(() => {
      expect(recordAgeVerification).toHaveBeenCalledWith('user-1', true, undefined)
      expect(mockOnVerified).toHaveBeenCalled()
    })
  })

  it('should include country when provided', async () => {
    const user = userEvent.setup()
    const { recordAgeVerification } = await import('@/lib/kyc-service')
    vi.mocked(recordAgeVerification).mockResolvedValue({})

    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />)

    const birthDateInput = screen.getByLabelText(/birth date/i)
    const countryInput = screen.getByLabelText(/country/i)

    const twentyYearsAgo = new Date()
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20)
    const dateString = twentyYearsAgo.toISOString().split('T')[0]

    await user.type(birthDateInput, dateString)
    await user.type(countryInput, 'US')
    await user.click(screen.getByRole('button', { name: /verify age/i }))

    await waitFor(() => {
      expect(recordAgeVerification).toHaveBeenCalledWith('user-1', true, 'US')
    })
  })

  it('should handle verification error', async () => {
    const user = userEvent.setup()
    const { recordAgeVerification } = await import('@/lib/kyc-service')
    vi.mocked(recordAgeVerification).mockRejectedValue(new Error('Verification failed'))

    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />)

    const birthDateInput = screen.getByLabelText(/birth date/i)
    const twentyYearsAgo = new Date()
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20)
    const dateString = twentyYearsAgo.toISOString().split('T')[0]

    await user.type(birthDateInput, dateString)
    await user.click(screen.getByRole('button', { name: /verify age/i }))

    await waitFor(() => {
      expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})

