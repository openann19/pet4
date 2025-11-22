/**
 * Share functionality hook
 * Location: src/hooks/use-share.ts
 */

import * as Haptics from 'expo-haptics'
import * as Sharing from 'expo-sharing'
import { useCallback } from 'react'
import { createLogger } from '../utils/logger'

const logger = createLogger('useShare')

export interface ShareOptions {
  title?: string
  message?: string
  url?: string
  mimeType?: string
}

export interface UseShareReturn {
  share: (options: ShareOptions) => Promise<boolean>
  shareFile: (uri: string, options?: ShareOptions) => Promise<boolean>
  canShare: () => Promise<boolean>
}

export function useShare(): UseShareReturn {
  const share = useCallback(async (options: ShareOptions): Promise<boolean> => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        return false
      }

      // For text sharing, we'd typically use React Native's Share API
      // but Expo Sharing is primarily for files
      // For now, return false for text-only sharing
      if (!options.url && options.message) {
        // Would need React Native Share API for text
        return false
      }

      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Share failed', err)
      return false
    }
  }, [])

  const shareFile = useCallback(async (uri: string, options?: ShareOptions): Promise<boolean> => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        return false
      }

      const sharingOptions: Sharing.SharingOptions = {
        ...(options?.mimeType !== undefined ? { mimeType: options.mimeType } : {}),
        ...(options?.title !== undefined ? { dialogTitle: options.title } : {}),
      }
      await Sharing.shareAsync(uri, sharingOptions)

      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Share file failed', err)
      return false
    }
  }, [])

  const canShare = useCallback(async (): Promise<boolean> => {
    try {
      return await Sharing.isAvailableAsync()
    } catch {
      return false
    }
  }, [])

  return {
    share,
    shareFile,
    canShare,
  }
}
