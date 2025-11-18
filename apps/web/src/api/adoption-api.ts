/**
 * Adoption API Service
 *
 * Handles adoption listings, applications, and shelters through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { AdoptionProfile, AdoptionApplication, Shelter } from '@/lib/adoption-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AdoptionApi', undefined, { enableSentry: false });

export interface GetAdoptionProfilesFilters {
  status?: string;
  breed?: string;
  minAge?: number;
  maxAge?: number;
  size?: string[];
  location?: string;
  goodWithKids?: boolean;
  goodWithPets?: boolean;
  cursor?: string;
  limit?: number;
}

export interface GetAdoptionProfilesResponse {
  profiles: AdoptionProfile[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface SubmitApplicationRequest {
  adoptionProfileId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  householdType: 'house' | 'apartment' | 'condo' | 'other';
  hasYard: boolean;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  hasChildren: boolean;
  childrenAges?: string;
  experience: string;
  reason: string;
}

export type CreateAdoptionProfileRequest = Omit<AdoptionProfile, '_id' | 'postedDate'>;

export interface UpdateApplicationStatusRequest {
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  reviewNotes?: string;
}

class AdoptionApiImpl {
  /**
   * Get adoption profiles with filters
   */
  async getAdoptionProfiles(
    filters?: GetAdoptionProfilesFilters
  ): Promise<GetAdoptionProfilesResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.breed) params.append('breed', filters.breed);
      if (filters?.minAge) params.append('minAge', String(filters.minAge));
      if (filters?.maxAge) params.append('maxAge', String(filters.maxAge));
      if (filters?.size && filters.size.length > 0) {
        filters.size.forEach((s) => params.append('size', s));
      }
      if (filters?.location) params.append('location', filters.location);
      if (filters?.goodWithKids !== undefined)
        params.append('goodWithKids', String(filters.goodWithKids));
      if (filters?.goodWithPets !== undefined)
        params.append('goodWithPets', String(filters.goodWithPets));
      if (filters?.cursor) params.append('cursor', filters.cursor);
      if (filters?.limit) params.append('limit', String(filters.limit));

      const query = params.toString();
      const response = await APIClient.get<GetAdoptionProfilesResponse>(
        `${ENDPOINTS.ADOPTION.LISTINGS}${query ? `?${query}` : ''}`
      );
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get adoption profiles', err, { filters });
      throw err;
    }
  }

  /**
   * Get adoption profile by ID
   */
  async getProfileById(id: string): Promise<AdoptionProfile | null> {
    try {
      const response = await APIClient.get<AdoptionProfile>(ENDPOINTS.ADOPTION.GET_LISTING(id));
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      // Return null if not found (404)
      if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
        return null;
      }
      logger.error('Failed to get adoption profile', err, { id });
      throw err;
    }
  }

  /**
   * Submit adoption application
   */
  async submitApplication(request: SubmitApplicationRequest): Promise<AdoptionApplication> {
    try {
      const response = await APIClient.post<AdoptionApplication>(ENDPOINTS.ADOPTION.APPLY, request);
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to submit application', err, {
        adoptionProfileId: request.adoptionProfileId,
      });
      throw err;
    }
  }

  /**
   * Get user's applications
   */
  async getUserApplications(userId: string): Promise<AdoptionApplication[]> {
    try {
      const response = await APIClient.get<AdoptionApplication[]>(
        `${ENDPOINTS.ADOPTION.APPLICATIONS}?applicantId=${userId}`
      );
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get user applications', err, { userId });
      return [];
    }
  }

  /**
   * Get all applications (admin)
   */
  async getAllApplications(): Promise<AdoptionApplication[]> {
    try {
      const response = await APIClient.get<AdoptionApplication[]>(ENDPOINTS.ADOPTION.APPLICATIONS);
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get all applications', err);
      return [];
    }
  }

  /**
   * Get applications by profile ID
   */
  async getApplicationsByProfile(profileId: string): Promise<AdoptionApplication[]> {
    try {
      const response = await APIClient.get<AdoptionApplication[]>(
        `${ENDPOINTS.ADOPTION.APPLICATIONS}?adoptionProfileId=${profileId}`
      );
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get applications by profile', err, { profileId });
      return [];
    }
  }

  /**
   * Create adoption profile
   */
  async createAdoptionProfile(request: CreateAdoptionProfileRequest): Promise<AdoptionProfile> {
    try {
      const response = await APIClient.post<AdoptionProfile>(
        ENDPOINTS.ADOPTION.CREATE_LISTING,
        request
      );
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to create adoption profile', err);
      throw err;
    }
  }

  /**
   * Update profile status
   */
  async updateProfileStatus(profileId: string, status: AdoptionProfile['status']): Promise<void> {
    try {
      await APIClient.patch(ENDPOINTS.ADOPTION.UPDATE_LISTING(profileId), { status });
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to update profile status', err, { profileId, status });
      throw err;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    request: UpdateApplicationStatusRequest
  ): Promise<void> {
    try {
      await APIClient.patch(ENDPOINTS.ADOPTION.UPDATE_APPLICATION(applicationId), request);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to update application status', err, {
        applicationId,
        status: request.status,
      });
      throw err;
    }
  }

  /**
   * Get shelters
   */
  async getShelters(): Promise<Shelter[]> {
    try {
      const response = await APIClient.get<Shelter[]>('/api/v1/adoption/shelters');
      return response.data;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get shelters', err);
      return [];
    }
  }

  /**
   * Delete adoption profile (admin only)
   */
  async deleteProfile(profileId: string): Promise<void> {
    try {
      await APIClient.delete(ENDPOINTS.ADOPTION.DELETE_LISTING(profileId));
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to delete adoption profile', err, { profileId });
      throw err;
    }
  }
}

export const adoptionApi = new AdoptionApiImpl();
