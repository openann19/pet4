import type { MatchScore } from '@pet/domain/matching-engine'
import { createLogger } from '@mobile/utils/logger'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@mobile/utils/api-client'
import { queryKeys } from '@mobile/lib/query-client'

const logger = createLogger('useDomainSnapshots')

export interface AdoptionSnapshot {
  canEditActiveListing: boolean
  canReceiveApplications: boolean
  statusTransitions: Array<{ status: string; allowed: boolean }>
  applicationTransitions: Array<{ status: string; allowed: boolean }>
}

export interface CommunitySnapshot {
  canEditPendingPost: boolean
  canReceiveCommentsOnActivePost: boolean
  postTransitions: Array<{ status: string; allowed: boolean }>
  commentTransitions: Array<{ status: string; allowed: boolean }>
}

export interface MatchingSnapshot {
  hardGatesPassed: boolean
  hardGateFailures: Array<{ code: string; message: string }>
  score: MatchScore
}

export interface DomainSnapshots {
  adoption: AdoptionSnapshot
  community: CommunitySnapshot
  matching: MatchingSnapshot
}

// Default empty snapshots for fallback
const defaultSnapshots: DomainSnapshots = {
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
    hardGateFailures: [{ code: 'MISSING_DATA', message: 'Sample data not available' }],
    score: {
      totalScore: 0,
      factorScores: {
        temperamentFit: 0,
        energyLevelFit: 0,
        lifeStageProximity: 0,
        sizeCompatibility: 0,
        speciesBreedCompatibility: 0,
        socializationCompatibility: 0,
        intentMatch: 0,
        distance: 0,
        healthVaccinationBonus: 0,
      },
      explanation: {
        positive: [],
        negative: [],
      },
    },
  },
}

/**
 * Fetch domain snapshots from API
 * Never throws - returns defaults on error
 */
async function fetchDomainSnapshots(): Promise<DomainSnapshots> {
  try {
    const response = await apiClient.get<DomainSnapshots>('/api/domain/snapshots');
    return response;
  } catch (error) {
    logger.warn('Failed to fetch domain snapshots, using default values', {
      error: error instanceof Error ? error.message : String(error),
    });
    return defaultSnapshots;
  }
}

/**
 * Hook to get domain snapshots with React Query
 * Returns default values on error or loading
 */
export interface UseDomainSnapshotsReturn {
  data: DomainSnapshots
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDomainSnapshots(): UseDomainSnapshotsReturn {
  const {
    data,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: queryKeys.domain.snapshots,
    queryFn: fetchDomainSnapshots,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  })

  const refetch = async (): Promise<void> => {
    try {
      await refetchQuery()
    } catch (error) {
      logger.warn('Failed to refetch domain snapshots', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Validate and return data
  let snapshots: DomainSnapshots = defaultSnapshots

  if (isLoading) {
    snapshots = defaultSnapshots
  } else if (error || !data) {
    logger.warn('Domain snapshots not available, using default values', {
      error: error instanceof Error ? error.message : String(error),
    })
    snapshots = defaultSnapshots
  } else {
    // Validate and return data
    try {
      // Ensure all required fields are present
      if (
        data.adoption &&
        data.community &&
        data.matching &&
        typeof data.adoption.canEditActiveListing === 'boolean' &&
        typeof data.community.canEditPendingPost === 'boolean' &&
        typeof data.matching.hardGatesPassed === 'boolean'
      ) {
        snapshots = data
      } else {
        logger.warn('Invalid domain snapshots data, using default values')
        snapshots = defaultSnapshots
      }
    } catch (validationError) {
      logger.warn('Invalid domain snapshots data, using default values', {
        error: validationError instanceof Error ? validationError.message : String(validationError),
      })
      snapshots = defaultSnapshots
    }
  }

  return {
    data: snapshots,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch,
  }
}
