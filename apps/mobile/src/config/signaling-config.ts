/**
 * Signaling Configuration (Mobile)
 *
 * Provides a shared CallSignalingClient configuration compatible with @petspark/core
 * Location: apps/mobile/src/config/signaling-config.ts
 */

import type { SignalingConfig } from '@petspark/core'

/**
 * Build SignalingConfig using Expo public env vars when available, with sensible defaults.
 */
export function getSignalingConfig(userId: string, token?: string | null): SignalingConfig {
  const url =
    process.env.EXPO_PUBLIC_SIGNALING_URL?.trim() ||
    process.env.SIGNALING_URL?.trim() ||
    'ws://localhost:3001/signaling'

  return {
    url,
    userId,
    ...(token ? { token } : {}),
  }
}
