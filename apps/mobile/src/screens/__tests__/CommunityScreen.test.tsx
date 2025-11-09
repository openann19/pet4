import { CommunityScreen } from '@mobile/screens/CommunityScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@mobile/hooks/use-domain-snapshots', () => ({
    useDomainSnapshots: vi.fn(() => ({
        community: {
            canEditPendingPost: true,
            canReceiveCommentsOnActivePost: true,
            postTransitions: [
                { status: 'pending', allowed: true },
                { status: 'active', allowed: false },
                { status: 'archived', allowed: true },
            ],
            commentTransitions: [
                { status: 'pending', allowed: true },
                { status: 'active', allowed: false },
                { status: 'deleted', allowed: true },
            ],
        },
    })),
}))

vi.mock('@mobile/components/PullableContainer', () => ({
    PullableContainer: ({ children }: { children: React.ReactNode }) => {
        return children
    },
}))

describe('CommunityScreen', () => {
    it('should render without crashing', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText('Community safety rails')).toBeTruthy()
    })

    it('should display section header', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText('Community safety rails')).toBeTruthy()
        expect(getByText(/Moderation and engagement policies/)).toBeTruthy()
    })

    it('should display post moderation card', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText('Post moderation')).toBeTruthy()
    })

    it('should display post moderation rules', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText(/Pending posts can be edited: Yes/)).toBeTruthy()
        expect(getByText(/Comments allowed on active posts: Yes/)).toBeTruthy()
    })

    it('should display post transitions card', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText('Post transitions')).toBeTruthy()
    })

    it('should display post transition statuses', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText('pending')).toBeTruthy()
        expect(getByText('active')).toBeTruthy()
        expect(getByText('archived')).toBeTruthy()
    })

    it('should display comment transitions card', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText('Comment transitions')).toBeTruthy()
    })

    it('should display comment transition statuses', () => {
        const { getByText } = render(<CommunityScreen />)
        expect(getByText('pending')).toBeTruthy()
        expect(getByText('active')).toBeTruthy()
        expect(getByText('deleted')).toBeTruthy()
    })

    it('should display permitted status for allowed transitions', () => {
        const { getAllByText } = render(<CommunityScreen />)
        const permittedTexts = getAllByText('permitted')
        expect(permittedTexts.length).toBeGreaterThan(0)
    })

    it('should display blocked status for disallowed transitions', () => {
        const { getAllByText } = render(<CommunityScreen />)
        const blockedTexts = getAllByText('blocked')
        expect(blockedTexts.length).toBeGreaterThan(0)
    })
})
