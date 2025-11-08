/**
 * Verification API Service
 *
 * Handles pet verification requests and status updates through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { VerificationRequest, VerificationStatus } from '@/lib/verification-types';

const logger = createLogger('VerificationAPI');

export interface GetVerificationRequestsResponse {
  requests: VerificationRequest[];
}

export interface UpdateVerificationStatusRequest {
  status: 'approved' | 'rejected';
  reviewedBy: string;
  notes?: string;
}

export interface UpdateVerificationStatusResponse {
  request: VerificationRequest;
}

class VerificationApiImpl {
  /**
   * GET /verification/requests
   * Get verification requests
   */
  async getVerificationRequests(filters?: {
    status?: VerificationStatus[];
    petId?: string;
    userId?: string;
  }): Promise<VerificationRequest[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status && filters.status.length > 0) {
        filters.status.forEach((s) => queryParams.append('status', s));
      }
      if (filters?.petId) queryParams.append('petId', filters.petId);
      if (filters?.userId) queryParams.append('userId', filters.userId);

      const url = `/verification/requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await APIClient.get<GetVerificationRequestsResponse>(url);
      return response.data.requests;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get verification requests', err, { filters });
      throw err;
    }
  }

  /**
   * POST /verification/update-status
   * Update pet verification status
   */
  async updateVerificationStatus(
    requestId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    notes?: string
  ): Promise<VerificationRequest> {
    try {
      const request: UpdateVerificationStatusRequest = {
        status,
        reviewedBy,
      };
      if (notes !== undefined) {
        request.notes = notes;
      }

      const response = await APIClient.post<UpdateVerificationStatusResponse>(
        `/verification/update-status?requestId=${requestId}`,
        request
      );
      return response.data.request;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update verification status', err, { requestId, status });
      throw err;
    }
  }
}

export const verificationApi = new VerificationApiImpl();
