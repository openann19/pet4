/**
 * GDPR Service
 *
 * Platform-agnostic GDPR service for data export and deletion.
 * This is a base class that should be extended by platform-specific implementations.
 */

import type {
  UserDataExport,
  DataDeletionResult,
  DataExportRequest,
  DataDeletionRequest,
} from './gdpr-types';

export interface GDPRServiceInterface {
  exportUserData(request: DataExportRequest): Promise<UserDataExport>;
  deleteUserData(request: DataDeletionRequest): Promise<DataDeletionResult>;
}

export abstract class BaseGDPRService implements GDPRServiceInterface {
  /**
   * Export all user data (GDPR Right to Access)
   */
  abstract exportUserData(request: DataExportRequest): Promise<UserDataExport>;

  /**
   * Delete all user data (GDPR Right to Erasure)
   */
  abstract deleteUserData(request: DataDeletionRequest): Promise<DataDeletionResult>;

  /**
   * Validate user ID
   */
  protected validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid user ID');
    }
  }

  /**
   * Validate deletion request
   */
  protected validateDeletionRequest(request: DataDeletionRequest): void {
    this.validateUserId(request.userId);

    if (!request.confirmDeletion) {
      throw new Error('Deletion confirmation required');
    }
  }
}
