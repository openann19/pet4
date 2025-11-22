/**
 * Token Signing Service
 *
 * Provides secure token signing for LiveKit integration.
 * In production, this should be implemented server-side with proper JWT signing.
 *
 * Configuration priority:
 * 1. Provided config parameter
 * 2. Admin panel configuration (from localStorage)
 * 3. Environment variables
 *
 * Environment variables:
 * - LIVEKIT_API_KEY: LiveKit API key
 * - LIVEKIT_API_SECRET: LiveKit API secret
 * - LIVEKIT_WS_URL: LiveKit WebSocket URL (optional, defaults to wss://your-project.livekit.cloud)
 */

import { createLogger } from '@/lib/logger';
import type { APIConfig } from '@/api/api-config-api';

const logger = createLogger('TokenSigning');

export interface TokenSigningConfig {
  apiKey: string;
  apiSecret: string;
  issuer?: string;
  apiUrl?: string;
}

export class TokenSigningError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TokenSigningError';
  }
}

function getConfigFromAdmin(): TokenSigningConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const adminConfigStr = localStorage.getItem('admin-api-config');
    if (!adminConfigStr) {
      return null;
    }

    const adminConfig = JSON.parse(adminConfigStr) as APIConfig;
    if (
      !adminConfig.livekit?.enabled ||
      !adminConfig.livekit?.apiKey ||
      !adminConfig.livekit?.apiSecret
    ) {
      return null;
    }

    return {
      apiKey: adminConfig.livekit.apiKey,
      apiSecret: adminConfig.livekit.apiSecret,
      issuer: 'livekit',
      ...(adminConfig.livekit.wsUrl && { apiUrl: adminConfig.livekit.wsUrl }),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Failed to read admin config', err);
    return null;
  }
}

function getConfigFromEnv(): TokenSigningConfig | null {
  const apiKey = import.meta.env.VITE_LIVEKIT_API_KEY ?? import.meta.env.LIVEKIT_API_KEY;
  const apiSecret =
    import.meta.env.VITE_LIVEKIT_API_SECRET ?? import.meta.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  const apiUrl = import.meta.env.VITE_LIVEKIT_WS_URL ?? import.meta.env.LIVEKIT_WS_URL;

  return {
    apiKey,
    apiSecret,
    issuer: import.meta.env.VITE_LIVEKIT_ISSUER ?? 'livekit',
    ...(apiUrl !== undefined && { apiUrl }),
  };
}

function getEffectiveConfig(config?: TokenSigningConfig): TokenSigningConfig | null {
  // Priority: provided config > admin config > environment variables
  if (config) {
    return config;
  }

  const adminConfig = getConfigFromAdmin();
  if (adminConfig) {
    return adminConfig;
  }

  return getConfigFromEnv();
}

export interface TokenPayload {
  room: string;
  participant: string;
  permissions: {
    canPublish: boolean;
    canSubscribe: boolean;
    canPublishData: boolean;
  };
  exp?: number;
}

/**
 * Generate a secure token for LiveKit
 *
 * This function requires LiveKit SDK to be installed server-side.
 * Client-side token signing is not secure and should only be used for development.
 *
 * For production, implement this server-side using:
 * ```typescript
 * import { AccessToken } from 'livekit-server-sdk'
 * const token = new AccessToken(config.apiKey, config.apiSecret, {
 *   identity: payload.participant,
 *   name: payload.participant
 * })
 * token.addGrant({
 *   room: payload.room,
 *   roomJoin: true,
 *   canPublish: payload.permissions.canPublish,
 *   canSubscribe: payload.permissions.canSubscribe,
 *   canPublishData: payload.permissions.canPublishData
 * })
 * return await token.toJwt()
 * ```
 */
export function signLiveKitToken(
  payload: TokenPayload,
  config?: TokenSigningConfig
): Promise<string> {
  const effectiveConfig = getEffectiveConfig(config);

  if (!effectiveConfig) {
    throw new TokenSigningError(
      'LiveKit configuration missing. Configure via Admin Panel > API Configuration > LiveKit, or set LIVEKIT_API_KEY and LIVEKIT_API_SECRET environment variables, or provide config parameter.',
      'CONFIG_MISSING',
      { room: payload.room, participant: payload.participant }
    );
  }

  // Check if LiveKit SDK is available (server-side only)
  // Client-side token signing is not secure - this should be done server-side
  if (typeof window !== 'undefined') {
    logger.error(
      'Client-side token signing is not secure. This should be implemented server-side.',
      {
        room: payload.room,
        participant: payload.participant,
      }
    );

    throw new TokenSigningError(
      'Client-side token signing is not secure. Implement token signing server-side using LiveKit SDK.',
      'CLIENT_SIDE_SIGNING_NOT_SUPPORTED',
      { room: payload.room, participant: payload.participant }
    );
  }

  // Server-side implementation would go here
  // For now, we throw an error indicating server-side implementation is required
  throw new TokenSigningError(
    'Token signing must be implemented server-side using livekit-server-sdk package.',
    'SERVER_SIDE_REQUIRED',
    {
      room: payload.room,
      participant: payload.participant,
      suggestion: 'Install livekit-server-sdk and implement token signing on your backend API',
    }
  );
}

/**
 * Verify a LiveKit token
 *
 * This function requires LiveKit SDK to be installed server-side.
 * Token verification should be done server-side for security.
 *
 * For production, implement this server-side using:
 * ```typescript
 * import { AccessToken } from 'livekit-server-sdk'
 * try {
 *   const tokenObj = AccessToken.fromJwt(token, config.apiSecret)
 *   return {
 *     room: tokenObj.grants.room,
 *     participant: tokenObj.identity,
 *     permissions: {
 *       canPublish: tokenObj.grants.canPublish,
 *       canSubscribe: tokenObj.grants.canSubscribe,
 *       canPublishData: tokenObj.grants.canPublishData
 *     }
 *   }
 * } catch (error) {
 *   return null
 * }
 * ```
 */
export function verifyLiveKitToken(
  token: string,
  config?: TokenSigningConfig
): Promise<TokenPayload | null> {
  const effectiveConfig = getEffectiveConfig(config);

  if (!effectiveConfig) {
    logger.error('LiveKit configuration missing for token verification', {
      tokenPrefix: token.substring(0, 20),
    });
    return Promise.resolve(null);
  }

  // Server-side implementation would use LiveKit SDK here
  // For now, we return null to indicate verification is not implemented
  logger.warn('Token verification not implemented. Implement server-side using LiveKit SDK.', {
    tokenPrefix: token.substring(0, 20),
  });

  return Promise.resolve(null);
}

/**
 * Check if token signing is properly configured
 */
export function isTokenSigningConfigured(): boolean {
  const config = getEffectiveConfig();
  return config !== null && !!config.apiKey && !!config.apiSecret;
}

/**
 * Delete a LiveKit room
 *
 * This function requires LiveKit SDK to be installed server-side.
 * Room deletion should be done server-side for security.
 *
 * For production, implement this server-side using:
 * ```typescript
 * import { RoomServiceClient } from 'livekit-server-sdk'
 * const roomService = new RoomServiceClient(config.apiUrl, config.apiKey, config.apiSecret)
 * await roomService.deleteRoom(roomId)
 * ```
 */
export function deleteLiveKitRoom(
  roomId: string,
  config?: TokenSigningConfig
): Promise<void> {
  const effectiveConfig = getEffectiveConfig(config);

  if (!effectiveConfig) {
    throw new TokenSigningError(
      'LiveKit configuration missing. Configure via Admin Panel > API Configuration > LiveKit, or set LIVEKIT_API_KEY and LIVEKIT_API_SECRET environment variables, or provide config parameter.',
      'CONFIG_MISSING',
      { roomId }
    );
  }

  logger.info('LiveKit room deletion requested', {
    roomId,
  });

  // Server-side implementation would go here
  // For now, we throw an error indicating server-side implementation is required
  throw new TokenSigningError(
    'Room deletion must be implemented server-side using livekit-server-sdk package.',
    'SERVER_SIDE_REQUIRED',
    {
      roomId,
      suggestion: 'Install livekit-server-sdk and implement room deletion on your backend API',
    }
  );
}

/**
 * Trigger HLS VOD recording and composite
 *
 * This function requires LiveKit SDK to be installed server-side.
 * Recording and compositing should be done server-side for security and performance.
 *
 * For production, implement this server-side using:
 * ```typescript
 * import { RoomServiceClient } from 'livekit-server-sdk'
 * const roomService = new RoomServiceClient(config.apiUrl, config.apiKey, config.apiSecret)
 *
 * // Start recording if not already started
 * const recording = await roomService.startRecording({
 *   room: roomId,
 *   output: {
 *     filepath: `vod/${roomId}/${Date.now()}.m3u8`
 *   }
 * })
 *
 * // Wait for recording to complete
 * await recording.waitForCompletion()
 *
 * // Composite to HLS
 * const vodUrl = await roomService.compositeToHLS(roomId, {
 *   layout: 'grid',
 *   output: {
 *     filepath: `vod/${roomId}/composite.m3u8`
 *   }
 * })
 *
 * // Generate poster frame
 * const posterUrl = await generatePosterFromHLS(vodUrl)
 *
 * return { vodUrl, posterUrl }
 * ```
 */
export function compositeStreamToHLS(
  roomId: string,
  config?: TokenSigningConfig
): Promise<{ vodUrl: string; posterUrl: string } | null> {
  const effectiveConfig = getEffectiveConfig(config);

  if (!effectiveConfig) {
    logger.error('LiveKit configuration missing for HLS recording', {
      roomId,
    });
    return Promise.resolve(null);
  }

  logger.info('HLS VOD recording requested', {
    roomId,
  });

  // Server-side implementation would go here
  // For now, we return null to indicate recording is not implemented
  logger.warn('HLS VOD recording not implemented. Implement server-side using LiveKit SDK.', {
    roomId,
  });

  return Promise.resolve(null);
}
