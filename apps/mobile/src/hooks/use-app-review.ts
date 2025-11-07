/**
 * App review prompt hook
 * Location: src/hooks/use-app-review.ts
 */

import * as StoreReview from 'expo-store-review'
import { useCallback, useEffect, useState } from 'react'
import { createLogger } from '../utils/logger'

const logger = createLogger('useAppReview')

export interface UseAppReviewReturn {
  requestReview: () => Promise<void>
  isAvailable: boolean
  checkAvailability: () => Promise<void>
}

export function useAppReview(): UseAppReviewReturn {
  const [isAvailable, setIsAvailable] = useState(false)

  const checkAvailability = useCallback(async (): Promise<void> => {
    try {
    const available = await StoreReview.isAvailableAsync()
    setIsAvailable(available)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to check review availability', err)
      setIsAvailable(false)
    }
  }, [])

  useEffect(() => {
    void checkAvailability()
  }, [checkAvailability])

  const requestReview = useCallback(async (): Promise<void> => {
    try {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview()
        logger.info('Review requested successfully')
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Request review failed', err)
    }
  }, [])

  return {
    requestReview,
    isAvailable,
    checkAvailability,
  }
}

