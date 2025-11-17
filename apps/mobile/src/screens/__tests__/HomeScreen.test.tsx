/**
 * HomeScreen Component Tests
 *
 * Tests for the HomeScreen component including:
 * - Rendering
 * - Loading states
 * - Error states
 * - Offline handling
 * - Accessibility
 * - i18n support
 */
import { HomeScreen } from '@mobile/screens/HomeScreen'
import { render, waitFor } from '@testing-library/react-native'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock React Native Reanimated
vi.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock')
    Reanimated.default.call = () => { }
    return Reanimated
})

// Mock translations
vi.mock('@mobile/i18n/translations', () => ({
    getTranslations: vi.fn(() => ({
        home: {
            title: 'PetSpark Mobile Readiness',
            description: 'Key slices from the shared domain layer rendered with native-first components.',
            adoption: {
                title: 'Adoption',
                subtitle: 'Marketplace governance and workflows',
                canEditActiveListing: 'Active listings can be edited:',
                acceptingApplications: 'Accepting new applications:',
            },
            community: {
                title: 'Community',
                subtitle: 'Engagement guardrails',
                pendingPostsEditable: 'Pending posts editable:',
                commentsOnLivePosts: 'Comments on live posts:',
            },
            matching: {
                title: 'Matching',
                subtitle: 'Signal-driven pairing',
                hardGates: 'Hard gates:',
                weightedScore: 'Weighted score:',
            },
            footer: 'Navigation routes map directly to production domain slices, keeping parity with the web surface.',
        },
        common: {
            loading: 'Loading...',
            error: 'Error',
            retry: 'Retry',
            yes: 'Yes',
            no: 'No',
            enabled: 'Enabled',
            paused: 'Paused',
            allowed: 'Allowed',
            locked: 'Locked',
            open: 'Open',
            closed: 'Closed',
            allClear: 'All clear',
            requiresReview: 'Requires review',
        },
    })),
}))

// Mock network status
const mockNetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
}

vi.mock('@mobile/hooks/use-network-status', () => ({
    useNetworkStatus: vi.fn(() => mockNetworkStatus),
}))

// Mock domain snapshots hook
const mockSnapshots: {
    data: {
        adoption: {
            canEditActiveListing: boolean
            canReceiveApplications: boolean
            statusTransitions: Array<{ status: string; allowed: boolean }>
            applicationTransitions: Array<{ status: string; allowed: boolean }>
        }
        community: {
            canEditPendingPost: boolean
            canReceiveCommentsOnActivePost: boolean
            postTransitions: Array<{ status: string; allowed: boolean }>
            commentTransitions: Array<{ status: string; allowed: boolean }>
        }
        matching: {
            hardGatesPassed: boolean
            hardGateFailures: Array<{ code: string; message: string }>
            score: {
                totalScore: number
                breakdown: Record<string, unknown>
            }
        }
    }
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
} = {
    data: {
        adoption: {
            canEditActiveListing: true,
            canReceiveApplications: true,
            statusTransitions: [],
            applicationTransitions: [],
        },
        community: {
            canEditPendingPost: true,
            canReceiveCommentsOnActivePost: true,
            postTransitions: [],
            commentTransitions: [],
        },
        matching: {
            hardGatesPassed: true,
            hardGateFailures: [],
            score: {
                totalScore: 85.5,
                breakdown: {},
            },
        },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
}

vi.mock('@mobile/hooks/use-domain-snapshots', () => ({
    useDomainSnapshots: vi.fn(() => mockSnapshots),
}))

// Mock components
vi.mock('@mobile/components/PullableContainer', () => ({
    PullableContainer: ({
        children,
    }: {
        children: React.ReactNode
        onRefresh: () => Promise<void>
    }) => {
        return <>{children}</>
    },
}))

vi.mock('@mobile/components/ErrorScreen', () => ({
    ErrorScreen: ({ error, onRetry }: { error: Error | string; onRetry?: () => void }) => {
        const React = require('react')
        const { View, Text } = require('react-native')
        return (
            <View testID="error-screen">
                <Text>Error: {error instanceof Error ? error.message : error}</Text>
            </View>
        )
    },
}))

vi.mock('@mobile/components/LoadingIndicator', () => ({
    LoadingIndicator: ({ message }: { message?: string }) => {
        const React = require('react')
        const { View, Text, ActivityIndicator } = require('react-native')
        return (
            <View testID="loading-indicator">
                <ActivityIndicator />
                {message && <Text>{message}</Text>}
            </View>
        )
    },
}))

vi.mock('@mobile/components/OfflineIndicator', () => ({
    OfflineIndicator: ({ message }: { message?: string }) => {
        const React = require('react')
        const { View, Text } = require('react-native')
        return (
            <View testID="offline-indicator">
                <Text>{message || 'Offline'}</Text>
            </View>
        )
    },
}))

// Create a test query client
const createTestQueryClient = (): QueryClient => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    })
}

// Wrapper component with QueryClient
const QueryWrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    const queryClient = createTestQueryClient()
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('HomeScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset mock snapshots to default
        mockSnapshots.data = {
            adoption: {
                canEditActiveListing: true,
                canReceiveApplications: true,
                statusTransitions: [],
                applicationTransitions: [],
            },
            community: {
                canEditPendingPost: true,
                canReceiveCommentsOnActivePost: true,
                postTransitions: [],
                commentTransitions: [],
            },
            matching: {
                hardGatesPassed: true,
                hardGateFailures: [],
                score: {
                    totalScore: 85.5,
                    breakdown: {},
                },
            },
        }
        mockSnapshots.isLoading = false
        mockSnapshots.error = null
        mockNetworkStatus.isConnected = true
    })

    describe('Rendering', () => {
        it('should render without crashing', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText('PetSpark Mobile Readiness')).toBeTruthy()
        })

        it('should display adoption domain information', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText('Adoption')).toBeTruthy()
            expect(getByText(/Active listings can be edited:/)).toBeTruthy()
            expect(getByText(/Accepting new applications:/)).toBeTruthy()
        })

        it('should display community domain information', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText('Community')).toBeTruthy()
            expect(getByText(/Pending posts editable:/)).toBeTruthy()
            expect(getByText(/Comments on live posts:/)).toBeTruthy()
        })

        it('should display matching domain information', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText('Matching')).toBeTruthy()
            expect(getByText(/Hard gates:/)).toBeTruthy()
            expect(getByText(/Weighted score:/)).toBeTruthy()
        })

        it('should display adoption canEditActiveListing status', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Active listings can be edited: Yes/)).toBeTruthy()
        })

        it('should display adoption canReceiveApplications status', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Accepting new applications: Enabled/)).toBeTruthy()
        })

        it('should display community canEditPendingPost status', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Pending posts editable: Allowed/)).toBeTruthy()
        })

        it('should display community canReceiveCommentsOnActivePost status', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Comments on live posts: Open/)).toBeTruthy()
        })

        it('should display matching hardGatesPassed status', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Hard gates: All clear/)).toBeTruthy()
        })

        it('should display matching score', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Weighted score: 85\.5 \/ 100/)).toBeTruthy()
        })

        it('should display footer text', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Navigation routes map directly to production domain slices/)).toBeTruthy()
        })
    })

    describe('Loading States', () => {
        it('should display loading indicator when loading and no data', () => {
            // Mock the hook to return loading state with undefined adoption (to trigger loading screen)
            const { useDomainSnapshots: mockUseDomainSnapshots } = require('@mobile/hooks/use-domain-snapshots')
            mockUseDomainSnapshots.mockReturnValueOnce({
                data: {
                    adoption: undefined as never,
                    community: undefined as never,
                    matching: undefined as never,
                },
                isLoading: true,
                error: null,
                refetch: vi.fn(),
            })

            const { getByTestId } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByTestId('loading-indicator')).toBeTruthy()
        })

        it('should display content when loading is false', () => {
            mockSnapshots.isLoading = false
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText('PetSpark Mobile Readiness')).toBeTruthy()
        })
    })

    describe('Error States', () => {
        it('should display error screen when error occurs', () => {
            mockSnapshots.error = new Error('Failed to fetch')
            mockSnapshots.data = {
                adoption: {
                    canEditActiveListing: false,
                    canReceiveApplications: false,
                    statusTransitions: [],
                    applicationTransitions: [],
                },
                community: {
                    canEditPendingPost: false,
                    canReceiveCommentsOnActivePost: false,
                    postTransitions: [],
                    commentTransitions: [],
                },
                matching: {
                    hardGatesPassed: false,
                    hardGateFailures: [],
                    score: {
                        totalScore: 0,
                        breakdown: {},
                    },
                },
            }

            const { getByTestId } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByTestId('error-screen')).toBeTruthy()
        })
    })

    describe('Offline Handling', () => {
        it('should display offline indicator when offline', () => {
            mockNetworkStatus.isConnected = false

            const { getByTestId } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByTestId('offline-indicator')).toBeTruthy()
        })

        it('should not display offline indicator when online', () => {
            mockNetworkStatus.isConnected = true

            const { queryByTestId } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(queryByTestId('offline-indicator')).toBeNull()
        })
    })

    describe('Data Validation', () => {
        it('should handle invalid data gracefully', () => {
            mockSnapshots.data = {
                adoption: {
                    canEditActiveListing: false,
                    canReceiveApplications: false,
                    statusTransitions: [],
                    applicationTransitions: [],
                },
                community: {
                    canEditPendingPost: false,
                    canReceiveCommentsOnActivePost: false,
                    postTransitions: [],
                    commentTransitions: [],
                },
                matching: {
                    hardGatesPassed: false,
                    hardGateFailures: [],
                    score: {
                        totalScore: 0,
                        breakdown: {},
                    },
                },
            }

            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByText(/Active listings can be edited: No/)).toBeTruthy()
        })
    })

    describe('Accessibility', () => {
        it('should have proper accessibility labels', () => {
            const { getByLabelText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            expect(getByLabelText('PetSpark Mobile Readiness')).toBeTruthy()
        })

        it('should have accessibility labels for feature cards', () => {
            const { getByLabelText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            // Feature cards should have accessibility labels
            expect(
                getByLabelText('Adoption. Marketplace governance and workflows')
            ).toBeTruthy()
        })
    })

    describe('i18n Support', () => {
        it('should use translations for all text', () => {
            const { getByText } = render(
                <QueryWrapper>
                    <HomeScreen />
                </QueryWrapper>
            )
            // All text should come from translations
            expect(getByText('PetSpark Mobile Readiness')).toBeTruthy()
            expect(getByText('Adoption')).toBeTruthy()
            expect(getByText('Community')).toBeTruthy()
            expect(getByText('Matching')).toBeTruthy()
        })
    })
})
