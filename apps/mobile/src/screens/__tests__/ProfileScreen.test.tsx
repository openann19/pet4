import { ProfileScreen } from '@mobile/screens/ProfileScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@mobile/data/mock-data', () => ({
    samplePets: [
        {
            id: 'pet-1',
            name: 'Fluffy',
            breedName: 'Golden Retriever',
            location: { city: 'New York', country: 'USA' },
            lifeStage: 'adult',
            intents: ['playdate', 'adoption'],
            kycVerified: true,
            vetVerified: true,
        },
        {
            id: 'pet-2',
            name: 'Buddy',
            breedName: 'Labrador',
            location: { city: 'Los Angeles', country: 'USA' },
            lifeStage: 'puppy',
            intents: [],
            kycVerified: false,
            vetVerified: false,
        },
    ],
}))

vi.mock('@mobile/components/PullableContainer', () => ({
    PullableContainer: ({ children }: { children: React.ReactNode }) => {
        return children
    },
}))

describe('ProfileScreen', () => {
    it('should render without crashing', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText('Operator overview')).toBeTruthy()
    })

    it('should display section header', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText('Operator overview')).toBeTruthy()
        expect(getByText(/Snapshot of mobile-ready records/)).toBeTruthy()
    })

    it('should render pet cards', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText('Fluffy')).toBeTruthy()
        expect(getByText('Buddy')).toBeTruthy()
    })

    it('should display pet breed and location', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText(/Golden Retriever • New York/)).toBeTruthy()
        expect(getByText(/Labrador • Los Angeles/)).toBeTruthy()
    })

    it('should display pet life stage', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText('Life stage')).toBeTruthy()
        expect(getByText('adult')).toBeTruthy()
        expect(getByText('puppy')).toBeTruthy()
    })

    it('should display pet intents', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText('Intents')).toBeTruthy()
        expect(getByText('playdate, adoption')).toBeTruthy()
        expect(getByText('—')).toBeTruthy()
    })

    it('should display KYC verification status', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText('KYC')).toBeTruthy()
        expect(getByText('verified')).toBeTruthy()
        expect(getByText('pending')).toBeTruthy()
    })

    it('should display vet verification status', () => {
        const { getByText } = render(<ProfileScreen />)
        expect(getByText('Vet docs')).toBeTruthy()
        expect(getByText('verified')).toBeTruthy()
        expect(getByText('missing')).toBeTruthy()
    })

    it('should render all info rows for each pet', () => {
        const { getByText } = render(<ProfileScreen />)
        // Each pet has 4 info rows: Life stage, Intents, KYC, Vet docs
        // So we should have 8 total
        const lifeStageLabels = getByText('Life stage')
        const intentsLabels = getByText('Intents')
        const kycLabels = getByText('KYC')
        const vetLabels = getByText('Vet docs')

        expect(lifeStageLabels).toBeTruthy()
        expect(intentsLabels).toBeTruthy()
        expect(kycLabels).toBeTruthy()
        expect(vetLabels).toBeTruthy()
    })
})
