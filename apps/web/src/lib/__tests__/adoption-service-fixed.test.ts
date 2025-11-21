import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adoptionService } from '../adoption-service';
import type { AdoptionProfile, AdoptionApplication, Shelter } from '../adoption-types';

// Mock the adoption API
const mockAdoptionApi = {
  getAdoptionProfiles: vi.fn(),
  getProfileById: vi.fn(),
  submitApplication: vi.fn(),
  getUserApplications: vi.fn(),
  getShelters: vi.fn(),
  createAdoptionProfile: vi.fn(),
  updateProfileStatus: vi.fn(),
  getAllApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
  getApplicationsByProfile: vi.fn(),
};

// Mock the logger
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/api/adoption-api', () => ({
  adoptionApi: mockAdoptionApi,
}));

vi.mock('../logger', () => ({
  createLogger: vi.fn(() => mockLogger),
}));

describe('adoptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdoptionProfiles', () => {
    it('should return profiles successfully', async () => {
      const mockProfiles: AdoptionProfile[] = [
        {
          _id: '1',
          petId: 'pet-1',
          petName: 'Buddy',
          petPhoto: 'buddy.jpg',
          breed: 'Golden Retriever',
          age: 2,
          gender: 'male',
          size: 'medium',
          location: 'New York',
          shelterId: 'shelter-1',
          shelterName: 'Happy Paws',
          status: 'available',
          description: 'Friendly dog',
          healthStatus: 'Healthy',
          vaccinated: true,
          spayedNeutered: true,
          goodWithKids: true,
          goodWithPets: false,
          energyLevel: 'medium',
          adoptionFee: 250,
          postedDate: '2023-01-01T00:00:00.000Z',
          personality: ['friendly'],
          photos: ['buddy.jpg'],
          contactEmail: 'contact@shelter.com',
        } as AdoptionProfile,
      ];
      const mockResponse = { profiles: mockProfiles, hasMore: true, nextCursor: 'abc123' };

      mockAdoptionApi.getAdoptionProfiles.mockResolvedValue(mockResponse);

      const result = await adoptionService.getAdoptionProfiles();

      expect(result).toEqual(mockResponse);
      expect(mockAdoptionApi.getAdoptionProfiles).toHaveBeenCalledWith(undefined);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error');
      mockAdoptionApi.getAdoptionProfiles.mockRejectedValue(apiError);

      const result = await adoptionService.getAdoptionProfiles();

      expect(result).toEqual({ profiles: [], hasMore: false });
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get adoption profiles', apiError, {
        filters: undefined,
      });
    });
  });

  describe('getProfileById', () => {
    it('should return profile by ID', async () => {
      const mockProfile: AdoptionProfile = {
        _id: '1',
        petId: 'pet-1',
        petName: 'Buddy',
        petPhoto: 'buddy.jpg',
        breed: 'Golden Retriever',
        age: 2,
        gender: 'male',
        size: 'medium',
        location: 'New York',
        shelterId: 'shelter-1',
        shelterName: 'Happy Paws',
        status: 'available',
        description: 'Friendly dog',
        healthStatus: 'Healthy',
        vaccinated: true,
        spayedNeutered: true,
        goodWithKids: true,
        goodWithPets: false,
        energyLevel: 'medium',
        adoptionFee: 250,
        postedDate: '2023-01-01T00:00:00.000Z',
        personality: ['friendly'],
        photos: ['buddy.jpg'],
        contactEmail: 'contact@shelter.com',
      } as AdoptionProfile;

      mockAdoptionApi.getProfileById.mockResolvedValue(mockProfile);

      const result = await adoptionService.getProfileById('1');

      expect(result).toEqual(mockProfile);
      expect(mockAdoptionApi.getProfileById).toHaveBeenCalledWith('1');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return null for non-existent profile', async () => {
      mockAdoptionApi.getProfileById.mockResolvedValue(null);

      const result = await adoptionService.getProfileById('999');

      expect(result).toBeNull();
      expect(mockAdoptionApi.getProfileById).toHaveBeenCalledWith('999');
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Profile not found');
      mockAdoptionApi.getProfileById.mockRejectedValue(apiError);

      const result = await adoptionService.getProfileById('1');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get profile by ID', apiError, {
        id: '1',
      });
    });
  });

  describe('submitApplication', () => {
    it('should submit application successfully', async () => {
      const applicationData = {
        adoptionProfileId: '1',
        applicantId: 'user123',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '555-1234',
        householdType: 'house' as const,
        hasYard: true,
        hasOtherPets: false,
        hasChildren: false,
        experience: 'First time owner',
        reason: 'Looking for a companion',
      };
      const mockApplication: AdoptionApplication = {
        ...applicationData,
        _id: 'app1',
        submittedAt: '2023-01-01T00:00:00.000Z',
        status: 'pending',
      } as AdoptionApplication;

      mockAdoptionApi.submitApplication.mockResolvedValue(mockApplication);

      const result = await adoptionService.submitApplication(applicationData);

      expect(result).toEqual(mockApplication);
      expect(mockAdoptionApi.submitApplication).toHaveBeenCalledWith(applicationData);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('Validation failed');
      const applicationData = {
        adoptionProfileId: '1',
        applicantId: 'user123',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '555-1234',
        householdType: 'house' as const,
        hasYard: true,
        hasOtherPets: false,
        hasChildren: false,
        experience: 'First time owner',
        reason: 'Looking for a companion',
      };

      mockAdoptionApi.submitApplication.mockRejectedValue(apiError);

      await expect(adoptionService.submitApplication(applicationData)).rejects.toThrow(apiError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to submit application', apiError, {
        adoptionProfileId: '1',
      });
    });
  });

  describe('getShelters', () => {
    it('should return shelters', async () => {
      const mockShelters: Shelter[] = [
        {
          _id: 'shelter1',
          name: 'Happy Paws Shelter',
          location: 'New York, NY',
          email: 'info@happypaws.com',
          phone: '555-1234',
          description: 'A loving shelter for pets',
          verified: true,
          adoptablePetsCount: 25,
        } as Shelter,
      ];

      mockAdoptionApi.getShelters.mockResolvedValue(mockShelters);

      const result = await adoptionService.getShelters();

      expect(result).toEqual(mockShelters);
      expect(mockAdoptionApi.getShelters).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockAdoptionApi.getShelters.mockRejectedValue(new Error('API Error'));

      const result = await adoptionService.getShelters();

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get shelters', expect.any(Error));
    });
  });

  describe('createAdoptionProfile', () => {
    it('should create profile successfully', async () => {
      const profileData = {
        petId: 'pet-1',
        petName: 'Buddy',
        petPhoto: 'buddy.jpg',
        breed: 'Golden Retriever',
        age: 2,
        gender: 'male' as const,
        size: 'medium' as const,
        location: 'New York',
        shelterId: 'shelter-1',
        shelterName: 'Happy Paws',
        status: 'available' as const,
        description: 'Friendly dog',
        healthStatus: 'Healthy',
        vaccinated: true,
        spayedNeutered: true,
        goodWithKids: true,
        goodWithPets: false,
        energyLevel: 'medium' as const,
        adoptionFee: 250,
        personality: ['friendly'],
        photos: ['buddy.jpg'],
        videoUrl: undefined,
        contactEmail: 'contact@shelter.com',
        contactPhone: undefined,
        applicationUrl: undefined,
        specialNeeds: undefined,
      };
      const mockProfile: AdoptionProfile = {
        ...profileData,
        _id: 'profile1',
        postedDate: '2023-01-01T00:00:00.000Z',
      } as AdoptionProfile;

      mockAdoptionApi.createAdoptionProfile.mockResolvedValue(mockProfile);

      const result = await adoptionService.createAdoptionProfile(profileData);

      expect(result).toEqual(mockProfile);
      expect(mockAdoptionApi.createAdoptionProfile).toHaveBeenCalledWith(profileData);
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('Validation failed');
      const profileData = {
        petId: 'pet-1',
        petName: 'Buddy',
        petPhoto: 'buddy.jpg',
        breed: 'Golden Retriever',
        age: 2,
        gender: 'male' as const,
        size: 'medium' as const,
        location: 'New York',
        shelterId: 'shelter-1',
        shelterName: 'Happy Paws',
        status: 'available' as const,
        description: 'Friendly dog',
        healthStatus: 'Healthy',
        vaccinated: true,
        spayedNeutered: true,
        goodWithKids: true,
        goodWithPets: false,
        energyLevel: 'medium' as const,
        adoptionFee: 250,
        personality: ['friendly'],
        photos: ['buddy.jpg'],
        videoUrl: undefined,
        contactEmail: 'contact@shelter.com',
        contactPhone: undefined,
        applicationUrl: undefined,
        specialNeeds: undefined,
      };

      mockAdoptionApi.createAdoptionProfile.mockRejectedValue(apiError);

      await expect(adoptionService.createAdoptionProfile(profileData)).rejects.toThrow(apiError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create adoption profile', apiError);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle null errors', async () => {
      mockAdoptionApi.getAdoptionProfiles.mockRejectedValue(null);

      const result = await adoptionService.getAdoptionProfiles();

      expect(result).toEqual({ profiles: [], hasMore: false });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get adoption profiles',
        expect.any(Error),
        { filters: undefined }
      );
    });

    it('should handle undefined errors', async () => {
      mockAdoptionApi.getAdoptionProfiles.mockRejectedValue(undefined);

      const result = await adoptionService.getAdoptionProfiles();

      expect(result).toEqual({ profiles: [], hasMore: false });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get adoption profiles',
        expect.any(Error),
        { filters: undefined }
      );
    });

    it('should handle object errors', async () => {
      const objectError = { message: 'Custom error', code: 'CUSTOM_ERROR' };
      mockAdoptionApi.getAdoptionProfiles.mockRejectedValue(objectError);

      const result = await adoptionService.getAdoptionProfiles();

      expect(result).toEqual({ profiles: [], hasMore: false });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get adoption profiles',
        expect.any(Error),
        { filters: undefined }
      );
    });
  });
});
