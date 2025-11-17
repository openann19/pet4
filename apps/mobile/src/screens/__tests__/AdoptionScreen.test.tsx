import { AdoptionScreen } from '@mobile/screens/AdoptionScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

const mockSamplePets = [
  {
    id: 'pet-1',
    name: 'Fluffy',
    breedName: 'Golden Retriever',
    location: { city: 'New York', country: 'USA' },
    lifeStage: 'adult',
  },
]

vi.mock('@mobile/data/mock-data', () => ({
  samplePets: mockSamplePets,
}))

vi.mock('@mobile/hooks/use-domain-snapshots', () => ({
  useDomainSnapshots: vi.fn(() => ({
    adoption: {
      canEditActiveListing: true,
      canReceiveApplications: true,
      statusTransitions: [
        { status: 'active', allowed: true },
        { status: 'pending_review', allowed: false },
        { status: 'adopted', allowed: true },
      ],
      applicationTransitions: [
        { status: 'pending', allowed: true },
        { status: 'approved', allowed: false },
        { status: 'rejected', allowed: true },
      ],
    },
  })),
}))

vi.mock('@mobile/components/PullableContainer', () => ({
  PullableContainer: ({ children }: { children: React.ReactNode }) => {
    return children
  },
}))

describe('AdoptionScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('Adoption domain parity')).toBeTruthy()
  })

  it('should display section header', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('Adoption domain parity')).toBeTruthy()
    expect(getByText(/Shared rules ensure that marketplace moderation/)).toBeTruthy()
  })

  it('should display listing card with pet information', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText(/Listing: Fluffy/)).toBeTruthy()
    expect(getByText(/New York, USA/)).toBeTruthy()
  })

  it('should display listing status information', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('Status: active')).toBeTruthy()
    expect(getByText(/Owner can edit: Yes/)).toBeTruthy()
    expect(getByText(/Applications accepted: Yes/)).toBeTruthy()
  })

  it('should display allowed listing transitions card', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('Allowed listing transitions')).toBeTruthy()
  })

  it('should display listing transition statuses', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('active')).toBeTruthy()
    expect(getByText('pending_review')).toBeTruthy()
    expect(getByText('adopted')).toBeTruthy()
  })

  it('should display application workflow card', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('Application workflow')).toBeTruthy()
  })

  it('should display application transition statuses', () => {
    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('pending')).toBeTruthy()
    expect(getByText('approved')).toBeTruthy()
    expect(getByText('rejected')).toBeTruthy()
  })

  it('should display permitted status for allowed transitions', () => {
    const { getAllByText } = render(<AdoptionScreen />)
    const permittedTexts = getAllByText('permitted')
    expect(permittedTexts.length).toBeGreaterThan(0)
  })

  it('should display blocked status for disallowed transitions', () => {
    const { getAllByText } = render(<AdoptionScreen />)
    const blockedTexts = getAllByText('blocked')
    expect(blockedTexts.length).toBeGreaterThan(0)
  })

  it('should handle missing pet data', () => {
    // Clear the mock array temporarily
    const originalLength = mockSamplePets.length
    mockSamplePets.length = 0

    const { getByText } = render(<AdoptionScreen />)
    expect(getByText('No pet data available')).toBeTruthy()

    // Restore
    mockSamplePets.length = originalLength
    if (originalLength > 0) {
      mockSamplePets.push({
        id: 'pet-1',
        name: 'Fluffy',
        breedName: 'Golden Retriever',
        location: { city: 'New York', country: 'USA' },
        lifeStage: 'adult',
      })
    }
  })
})
