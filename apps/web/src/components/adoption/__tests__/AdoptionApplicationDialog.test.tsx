import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdoptionApplicationDialog } from '../AdoptionApplicationDialog'
import type { AdoptionProfile } from '@/lib/adoption-types'
import { adoptionService } from '@/lib/adoption-service'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'

vi.mock('@/lib/adoption-service', () => ({
  adoptionService: {
    submitApplication: vi.fn(),
  },
}))
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
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
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
  }),
}))
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/effects/reanimated/use-rotation', () => ({
  useRotation: () => ({
    rotationStyle: {},
  }),
}))

const mockAdoptionService = vi.mocked(adoptionService)
const mockUseApp = vi.mocked(useApp)
const mockHaptics = vi.mocked(haptics)

describe('AdoptionApplicationDialog', () => {
  const mockProfile: AdoptionProfile = {
    _id: '1',
    petId: 'pet1',
    petName: 'Buddy',
    petPhoto: 'https://example.com/buddy.jpg',
    breed: 'Golden Retriever',
    age: 3,
    gender: 'male',
    size: 'large',
    location: 'New York',
    shelterId: 'shelter1',
    shelterName: 'Happy Paws',
    status: 'available',
    description: 'Friendly dog',
    healthStatus: 'Healthy',
    vaccinated: true,
    spayedNeutered: true,
    goodWithKids: true,
    goodWithPets: true,
    energyLevel: 'high',
    adoptionFee: 200,
    postedDate: new Date().toISOString(),
    personality: ['friendly'],
    photos: [],
  }

  const mockOnOpenChange = vi.fn()
  const mockOnSubmitSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseApp.mockReturnValue({
      t: {
        adoption: {
          fillRequired: 'Please fill in all required fields',
        },
      },
    } as never)
    mockAdoptionService.submitApplication.mockResolvedValue({ id: 'app1' } as never)
  })

  it('renders dialog when open', () => {
    render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    expect(screen.getByText(/adoption application/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const { container } = render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('displays pet name', () => {
    render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    expect(screen.getByText(/buddy/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    expect(mockAdoptionService.submitApplication).not.toHaveBeenCalled()
    expect(mockHaptics.trigger).toHaveBeenCalledWith('error')
  })

  it('submits application with valid data', async () => {
    const user = userEvent.setup()
    render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    const nameInput = screen.getByLabelText(/name/i)
    await user.type(nameInput, 'John Doe')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'john@example.com')

    const reasonInput = screen.getByLabelText(/reason/i)
    await user.type(reasonInput, 'I love dogs')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAdoptionService.submitApplication).toHaveBeenCalled()
    })
  })

  it('handles submission error', async () => {
    const user = userEvent.setup()
    mockAdoptionService.submitApplication.mockRejectedValue(new Error('Submission failed'))

    render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    const nameInput = screen.getByLabelText(/name/i)
    await user.type(nameInput, 'John Doe')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'john@example.com')

    const reasonInput = screen.getByLabelText(/reason/i)
    await user.type(reasonInput, 'I love dogs')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAdoptionService.submitApplication).toHaveBeenCalled()
    })
  })

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets form when dialog closes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    const nameInput = screen.getByLabelText(/name/i)
    await user.type(nameInput, 'John Doe')

    rerender(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    rerender(
      <AdoptionApplicationDialog
        profile={mockProfile}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmitSuccess={mockOnSubmitSuccess}
      />
    )

    const nameInputAfterReset = screen.getByLabelText(/name/i)
    expect(nameInputAfterReset).toHaveValue('')
  })
})

