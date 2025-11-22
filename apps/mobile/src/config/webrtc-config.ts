/**
 * WebRTC Configuration
 *
 * STUN/TURN server configuration for WebRTC peer connections
 * Location: apps/mobile/src/config/webrtc-config.ts
 */

export interface STUNServer {
  urls: string | string[]
}

export interface TURNServer {
  urls: string | string[]
  username?: string
  credential?: string
}

export interface WebRTCConfig {
  stunServers: STUNServer[]
  turnServers: TURNServer[]
}

/**
 * Get STUN servers configuration
 * Uses Google's public STUN servers for development
 */
export function getSTUNServers(): STUNServer[] {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}

/**
 * Get TURN servers configuration
 * Uses environment variables for production credentials
 * Falls back to empty array for development (STUN-only)
 */
export function getTURNServers(): TURNServer[] {
  // Get TURN server configuration from environment variables
  const turnServerUrl = process.env.EXPO_PUBLIC_TURN_SERVER_URL
  const turnServerUsername = process.env.EXPO_PUBLIC_TURN_SERVER_USERNAME
  const turnServerCredential = process.env.EXPO_PUBLIC_TURN_SERVER_CREDENTIAL

  if (turnServerUrl && turnServerUsername && turnServerCredential) {
    return [
      {
        urls: turnServerUrl,
        username: turnServerUsername,
        credential: turnServerCredential,
      },
    ]
  }

  // No TURN server configured - use STUN only
  // This works for development but may fail behind NAT/firewall
  return []
}

/**
 * Get complete WebRTC configuration
 */
export function getWebRTCConfig(): WebRTCConfig {
  return {
    stunServers: getSTUNServers(),
    turnServers: getTURNServers(),
  }
}

/**
 * Default WebRTC configuration
 */
export const defaultWebRTCConfig: WebRTCConfig = {
  stunServers: getSTUNServers(),
  turnServers: getTURNServers(),
}
