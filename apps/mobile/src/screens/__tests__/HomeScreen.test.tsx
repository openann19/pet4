import { HomeScreen } from '@mobile/screens/HomeScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@mobile/hooks/use-domain-snapshots', () => ({
    useDomainSnapshots: vi.fn(() => ({
        adoption: {
            canEditActiveListing: true,
            canReceiveApplications: true,
            statusTransitions: [
                { status: 'active', allowed: true },
                { status: 'pending_review', allowed: false },
            ],
            applicationTransitions: [
                { status: 'pending', allowed: true },
                { status: 'approved', allowed: false },
            ],
        },
        community: {
            canEditPendingPost: true,
            canReceiveCommentsOnActivePost: true,
            postTransitions: [
                { status: 'pending', allowed: true },
                { status: 'active', allowed: false },
            ],
            commentTransitions: [
                { status: 'pending', allowed: true },
                { status: 'active', allowed: false },
            ],
        },
        matching: {
            hardGatesPassed: true,
            hardGateFailures: [],
            score: {
                totalScore: 85.5,
                breakdown: {},
            },
        },
    })),
}))

vi.mock('@mobile/components/PullableContainer', () => ({
    PullableContainer: ({
        children,
    }: {
        children: React.ReactNode
        onRefresh: () => Promise<void>
    }) => {
        return children
    },
}))

describe('HomeScreen', () => {
    it('should render without crashing', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText('PetSpark Mobile Readiness')).toBeTruthy()
    })

    it('should display adoption domain information', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText('Adoption')).toBeTruthy()
        expect(getByText(/Active listings can be edited/)).toBeTruthy()
        expect(getByText(/Accepting new applications/)).toBeTruthy()
    })

    it('should display community domain information', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText('Community')).toBeTruthy()
        expect(getByText(/Pending posts editable/)).toBeTruthy()
        expect(getByText(/Comments on live posts/)).toBeTruthy()
    })

    it('should display matching domain information', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText('Matching')).toBeTruthy()
        expect(getByText(/Hard gates/)).toBeTruthy()
        expect(getByText(/Weighted score/)).toBeTruthy()
    })

    it('should display adoption canEditActiveListing status', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText(/Active listings can be edited: Yes/)).toBeTruthy()
    })

    it('should display adoption canReceiveApplications status', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText(/Accepting new applications: Enabled/)).toBeTruthy()
    })

    it('should display community canEditPendingPost status', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText(/Pending posts editable: Allowed/)).toBeTruthy()
    })

    it('should display community canReceiveCommentsOnActivePost status', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText(/Comments on live posts: Open/)).toBeTruthy()
    })

    it('should display matching hardGatesPassed status', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText(/Hard gates: All clear/)).toBeTruthy()
    })

    it('should display matching score', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText(/Weighted score: 85\.5 \/ 100/)).toBeTruthy()
    })

    it('should display footer text', () => {
        const { getByText } = render(<HomeScreen />)
        expect(getByText(/Navigation routes map directly to production domain slices/)).toBeTruthy()
    })
})
