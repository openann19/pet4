import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
export const BG_UPLOAD_TASK = "bg-upload-task"

async function flushPendingUploads(): Promise<boolean> {
  try {
    // Dynamic import with type assertion for optional module
    // @ts-expect-error - Optional module that may not exist
    const mod = await import('../lib/upload-queue').catch(() => null) as {
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
;(async () => {
  if (Platform.OS === 'web') return
  try {
    const TaskManager = await import('expo-task-manager')
    TaskManager.defineTask(BG_UPLOAD_TASK, () => {
      void (async () => {
        const net = await NetInfo.fetch()
        if (!net.isConnected) return
        await flushPendingUploads()
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
      startOnBoot: true
    })
  } catch {
    // Task registration failed or module unavailable; ignore on unsupported platforms
  }
}
