import { APIClient } from '@/lib/api-client';
import type { ReactionEmoji } from '@/lib/community-types';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import type { ToggleReactionRequest, ToggleReactionResponse } from '../community-api-types';

const logger = createLogger('CommunityReactionsApi');

/**
 * Reactions-related API methods
 */
export class CommunityReactionsApi {
  async toggleReaction(
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: ReactionEmoji
  ): Promise<{ added: boolean; reactionsCount: number }> {
    try {
      const request: ToggleReactionRequest = {
        userId,
        userName,
        ...(userAvatar !== undefined && { userAvatar }),
        emoji,
      };

      const response = await APIClient.post<ToggleReactionResponse>(
        ENDPOINTS.COMMUNITY.LIKE_POST(postId),
        request
      );

      return response.data;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to toggle reaction', err, { postId, userId });
      throw err;
    }
  }
}

