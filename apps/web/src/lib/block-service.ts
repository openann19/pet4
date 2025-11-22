import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BlockService');

export interface BlockRecord {
  id: string;
  blockerPetId: string;
  blockedPetId: string;
  blockedUserId: string;
  reason?: 'inappropriate' | 'spam' | 'harassment' | 'safety' | 'other';
  createdAt: string;
  expiresAt?: string;
}

export interface BlockStatus {
  isBlocked: boolean;
  blockRecord?: BlockRecord;
  canUnblock: boolean;
}

class BlockServiceImpl {
  /**
   * Block a pet/user
   */
  async blockPet(
    blockerPetId: string,
    blockedPetId: string,
    reason?: BlockRecord['reason']
  ): Promise<BlockRecord> {
    try {
      const response = await APIClient.post<BlockRecord>(ENDPOINTS.BLOCKING.BLOCK, {
        blockerPetId,
        blockedPetId,
        reason,
      });

      logger.info('Pet blocked successfully', {
        blockerPetId,
        blockedPetId,
        reason,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to block pet', error, {
        blockerPetId,
        blockedPetId,
      });
      throw error;
    }
  }

  /**
   * Block a user (blocks all their pets)
   */
  async blockUser(
    blockerUserId: string,
    blockedUserId: string,
    reason?: BlockRecord['reason']
  ): Promise<BlockRecord[]> {
    try {
      const response = await APIClient.post<BlockRecord[]>(ENDPOINTS.BLOCKING.BLOCK_USER, {
        blockerUserId,
        blockedUserId,
        reason,
      });

      logger.info('User blocked successfully', {
        blockerUserId,
        blockedUserId,
        reason,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to block user', error, {
        blockerUserId,
        blockedUserId,
      });
      throw error;
    }
  }

  /**
   * Unblock a pet
   */
  async unblockPet(blockerPetId: string, blockedPetId: string): Promise<void> {
    try {
      await APIClient.delete(ENDPOINTS.BLOCKING.UNBLOCK(blockerPetId, blockedPetId));

      logger.info('Pet unblocked successfully', {
        blockerPetId,
        blockedPetId,
      });
    } catch (error) {
      logger.error('Failed to unblock pet', error, {
        blockerPetId,
        blockedPetId,
      });
      throw error;
    }
  }

  /**
   * Unblock a user (unblocks all their pets)
   */
  async unblockUser(blockerUserId: string, blockedUserId: string): Promise<void> {
    try {
      await APIClient.delete(ENDPOINTS.BLOCKING.UNBLOCK_USER(blockerUserId, blockedUserId));

      logger.info('User unblocked successfully', {
        blockerUserId,
        blockedUserId,
      });
    } catch (error) {
      logger.error('Failed to unblock user', error, {
        blockerUserId,
        blockedUserId,
      });
      throw error;
    }
  }

  /**
   * Check if a pet is blocked by another pet
   */
  async checkBlockStatus(blockerPetId: string, blockedPetId: string): Promise<BlockStatus> {
    try {
      const response = await APIClient.get<BlockStatus>(
        ENDPOINTS.BLOCKING.STATUS(blockerPetId, blockedPetId)
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to check block status', error, {
        blockerPetId,
        blockedPetId,
      });
      // Return unblocked status on error
      return {
        isBlocked: false,
        canUnblock: false,
      };
    }
  }

  /**
   * Get all pets blocked by a pet
   */
  async getBlockedPets(petId: string): Promise<BlockRecord[]> {
    try {
      const response = await APIClient.get<BlockRecord[]>(ENDPOINTS.BLOCKING.BLOCKED_PETS(petId));

      return response.data;
    } catch (error) {
      logger.error('Failed to get blocked pets', error, { petId });
      return [];
    }
  }

  /**
   * Get all users blocked by a user
   */
  async getBlockedUsers(userId: string): Promise<BlockRecord[]> {
    try {
      const response = await APIClient.get<BlockRecord[]>(ENDPOINTS.BLOCKING.BLOCKED_USERS(userId));

      return response.data;
    } catch (error) {
      logger.error('Failed to get blocked users', error, { userId });
      return [];
    }
  }

  /**
   * Check if two pets can match (not blocked)
   */
  async canMatch(pet1Id: string, pet2Id: string): Promise<boolean> {
    const status1 = await this.checkBlockStatus(pet1Id, pet2Id);
    const status2 = await this.checkBlockStatus(pet2Id, pet1Id);

    return !status1.isBlocked && !status2.isBlocked;
  }

  /**
   * Report and block (for safety/abuse cases)
   */
  async reportAndBlock(
    reporterPetId: string,
    reportedPetId: string,
    reason: BlockRecord['reason'],
    description?: string
  ): Promise<BlockRecord> {
    try {
      // First report
      await APIClient.post('/reports', {
        reporterPetId,
        reportedPetId,
        reason,
        description,
        type: 'pet',
      });

      // Then block
      return this.blockPet(reporterPetId, reportedPetId, reason);
    } catch (error) {
      logger.error('Failed to report and block', error, {
        reporterPetId,
        reportedPetId,
        reason,
      });
      throw error;
    }
  }
}

export const blockService = new BlockServiceImpl();
