import NetInfo from '@react-native-community/netinfo'
import { Platform } from 'react-native'
import { createLogger } from '@/utils/logger'

export const BG_UPLOAD_TASK = 'bg-upload-task'

const logger = createLogger('background-uploads')

async function flushQueue(): Promise<boolean> {
  try {
    // Dynamic import with type assertion for optional module
    const mod = (await import('../lib/upload-queue').catch((): null => null)) as {
      flushPendingUploads?: () => Promise<boolean>
    } | null
    if (mod && typeof mod.flushPendingUploads === 'function') {
      return (await mod.flushPendingUploads()) === true
    }
    return false
  } catch {
    return false
  }
}

// Define background task only on native platforms to avoid web runtime errors
if (Platform.OS !== 'web') {
  import('expo-task-manager')
    .then(TaskManager => {
      TaskManager.defineTask(BG_UPLOAD_TASK, () => {
        void (async () => {
          const net = await NetInfo.fetch()
          if (!net.isConnected) return
          await flushQueue()
        })()
      })
    })
    .catch(() => {
      // Task manager not available; ignore on unsupported platforms
    })
}

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
