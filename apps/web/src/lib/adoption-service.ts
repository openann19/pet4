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
    } catch (error) {
      logger.error(
        'Failed to get adoption profiles',
        error instanceof Error ? error : new Error(String(error)),
        { filters }
      );
      return { profiles: [], hasMore: false };
    }
  },

  async getProfileById(id: string): Promise<AdoptionProfile | null> {
    try {
      return await adoptionApi.getProfileById(id);
    } catch (error) {
      logger.error(
        'Failed to get profile by ID',
        error instanceof Error ? error : new Error(String(error)),
        { id }
      );
      return null;
    }
  },

  async getAllProfiles(): Promise<AdoptionProfile[]> {
    try {
      const result = await adoptionApi.getAdoptionProfiles({ limit: 1000 });
      return result.profiles;
    } catch (error) {
      logger.error(
        'Failed to get all profiles',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  },

  async submitApplication(
    application: Omit<AdoptionApplication, '_id' | 'submittedAt' | 'status'>
  ): Promise<AdoptionApplication> {
    try {
      return await adoptionApi.submitApplication(application);
    } catch (error) {
      logger.error(
        'Failed to submit application',
        error instanceof Error ? error : new Error(String(error)),
        { adoptionProfileId: application.adoptionProfileId }
      );
      throw error;
    }
  },

  async getUserApplications(userId: string): Promise<AdoptionApplication[]> {
    try {
      return await adoptionApi.getUserApplications(userId);
    } catch (error) {
      logger.error(
        'Failed to get user applications',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return [];
    }
  },

  async getShelters(): Promise<Shelter[]> {
    try {
      return await adoptionApi.getShelters();
    } catch (error) {
      logger.error(
        'Failed to get shelters',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  },

  async createAdoptionProfile(
    profile: Omit<AdoptionProfile, '_id' | 'postedDate'>
  ): Promise<AdoptionProfile> {
    try {
      return await adoptionApi.createAdoptionProfile(profile);
    } catch (error) {
      logger.error(
        'Failed to create adoption profile',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  },

  async updateProfileStatus(profileId: string, status: AdoptionProfile['status']): Promise<void> {
    try {
      await adoptionApi.updateProfileStatus(profileId, status);
    } catch (error) {
      logger.error(
        'Failed to update profile status',
        error instanceof Error ? error : new Error(String(error)),
        { profileId, status }
      );
      throw error;
    }
  },

  async getAllApplications(): Promise<AdoptionApplication[]> {
    try {
      return await adoptionApi.getAllApplications();
    } catch (error) {
      logger.error(
        'Failed to get all applications',
        error instanceof Error ? error : new Error(String(error))
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
    } catch (error) {
      logger.error(
        'Failed to update application status',
        error instanceof Error ? error : new Error(String(error)),
        { applicationId, status }
      );
      throw error;
    }
  },

  async getApplicationsByProfile(profileId: string): Promise<AdoptionApplication[]> {
    try {
      return await adoptionApi.getApplicationsByProfile(profileId);
    } catch (error) {
      logger.error(
        'Failed to get applications by profile',
        error instanceof Error ? error : new Error(String(error)),
        { profileId }
      );
      return [];
    }
  },
};
