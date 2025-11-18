/**
 * Adoption Service
 *
 * Handles adoption profiles, applications, and shelters.
 * Migrated from legacy KV mocks to use backend API endpoints.
 */

import type { AdoptionProfile, AdoptionApplication, Shelter } from './adoption-types';
import { adoptionApi } from '@/api/adoption-api';
import { createLogger } from './logger';

const logger = createLogger('AdoptionService');

export const adoptionService = {
  async getAdoptionProfiles(filters?: {
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
  }): Promise<{ profiles: AdoptionProfile[]; hasMore: boolean; nextCursor?: string }> {
    try {
      return await adoptionApi.getAdoptionProfiles(filters);
    } catch (_error) {
      logger.error(
        'Failed to get adoption profiles',
        _error instanceof Error ? _error : new Error(String(_error)),
        { filters }
      );
      return { profiles: [], hasMore: false };
    }
  },

  async getProfileById(id: string): Promise<AdoptionProfile | null> {
    try {
      return await adoptionApi.getProfileById(id);
    } catch (_error) {
      logger.error(
        'Failed to get profile by ID',
        _error instanceof Error ? _error : new Error(String(_error)),
        { id }
      );
      return null;
    }
  },

  async getAllProfiles(): Promise<AdoptionProfile[]> {
    try {
      const result = await adoptionApi.getAdoptionProfiles({ limit: 1000 });
      return result.profiles;
    } catch (_error) {
      logger.error(
        'Failed to get all profiles',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      return [];
    }
  },

  async submitApplication(
    application: Omit<AdoptionApplication, '_id' | 'submittedAt' | 'status'>
  ): Promise<AdoptionApplication> {
    try {
      return await adoptionApi.submitApplication(application);
    } catch (_error) {
      logger.error(
        'Failed to submit application',
        _error instanceof Error ? _error : new Error(String(_error)),
        { adoptionProfileId: application.adoptionProfileId }
      );
      throw _error;
    }
  },

  async getUserApplications(userId: string): Promise<AdoptionApplication[]> {
    try {
      return await adoptionApi.getUserApplications(userId);
    } catch (_error) {
      logger.error(
        'Failed to get user applications',
        _error instanceof Error ? _error : new Error(String(_error)),
        { userId }
      );
      return [];
    }
  },

  async getShelters(): Promise<Shelter[]> {
    try {
      return await adoptionApi.getShelters();
    } catch (_error) {
      logger.error(
        'Failed to get shelters',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      return [];
    }
  },

  async createAdoptionProfile(
    profile: Omit<AdoptionProfile, '_id' | 'postedDate'>
  ): Promise<AdoptionProfile> {
    try {
      return await adoptionApi.createAdoptionProfile(profile);
    } catch (_error) {
      logger.error(
        'Failed to create adoption profile',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      throw _error;
    }
  },

  async updateProfileStatus(profileId: string, status: AdoptionProfile['status']): Promise<void> {
    try {
      await adoptionApi.updateProfileStatus(profileId, status);
    } catch (_error) {
      logger.error(
        'Failed to update profile status',
        _error instanceof Error ? _error : new Error(String(_error)),
        { profileId, status }
      );
      throw _error;
    }
  },

  async getAllApplications(): Promise<AdoptionApplication[]> {
    try {
      return await adoptionApi.getAllApplications();
    } catch (_error) {
      logger.error(
        'Failed to get all applications',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      return [];
    }
  },

  async updateApplicationStatus(
    applicationId: string,
    status: AdoptionApplication['status'],
    reviewNotes?: string
  ): Promise<void> {
    try {
      await adoptionApi.updateApplicationStatus(applicationId, {
        status,
        ...(reviewNotes !== undefined && { reviewNotes }),
      });
    } catch (_error) {
      logger.error(
        'Failed to update application status',
        _error instanceof Error ? _error : new Error(String(_error)),
        { applicationId, status }
      );
      throw _error;
    }
  },

  async getApplicationsByProfile(profileId: string): Promise<AdoptionApplication[]> {
    try {
      return await adoptionApi.getApplicationsByProfile(profileId);
    } catch (_error) {
      logger.error(
        'Failed to get applications by profile',
        _error instanceof Error ? _error : new Error(String(_error)),
        { profileId }
      );
      return [];
    }
  },
};
