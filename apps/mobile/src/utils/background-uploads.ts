import NetInfo from '@react-native-community/netinfo'
import { Platform } from 'react-native'
import { flushPendingUploads } from '../lib/upload-queue'
import { createLogger } from './logger'

export const BG_UPLOAD_TASK = 'bg-upload-task'

const logger = createLogger('background-uploads')

async function flushQueue(): Promise<boolean> {
  try {
    const processed = await flushPendingUploads()
    logger.debug('Background flush completed', { processed })
    return processed
  } catch (error) {
    logger.error('Background flush failed', error)
    return false
  }
}

// Define background task only on native platforms to avoid web runtime errors
;(async () => {
  if (Platform.OS === 'web') return
  try {
    const TaskManager = await import('expo-task-manager')
    TaskManager.defineTask(BG_UPLOAD_TASK, () => {
      void (async () => {
        const net = await NetInfo.fetch()
        if (!net.isConnected) return
        await flushQueue()
      })()
    })
  } catch {
    // Task manager not available; ignore on unsupported platforms
  }
})()

export async function initBackgroundUploads(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    const BackgroundFetch = await import('expo-background-fetch')
    await BackgroundFetch.registerTaskAsync(BG_UPLOAD_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    })
    logger.info('Background upload task registered')
  } catch {
    // Task registration failed or module unavailable; ignore on unsupported platforms
  }
}
