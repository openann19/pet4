import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adoptionService } from '../adoption-service';
import type { AdoptionProfile, AdoptionApplication, Shelter } from '../adoption-types';

// Create complete mock objects that match the full type definitions
const createMockProfile = (overrides: Partial<AdoptionProfile> = {}): AdoptionProfile => ({
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
  description: 'Friendly dog looking for a home',
  healthStatus: 'Healthy',
  vaccinated: true,
  spayedNeutered: true,
  goodWithKids: true,
  goodWithPets: false,
  energyLevel: 'medium',
  adoptionFee: 250,
  postedDate: '2023-01-01T00:00:00.000Z',
  personality: ['friendly', 'playful'],
  photos: ['buddy.jpg', 'buddy2.jpg'],
  contactEmail: 'contact@happypaws.com',
  contactPhone: '555-1234',
  ...overrides,
});

const createMockApplication = (
  overrides: Partial<AdoptionApplication> = {}
): AdoptionApplication => ({
  _id: 'app1',
  adoptionProfileId: '1',
  applicantId: 'user123',
  applicantName: 'John Doe',
  applicantEmail: 'john@example.com',
  applicantPhone: '555-5678',
  householdType: 'house',
  hasYard: true,
  hasOtherPets: false,
  hasChildren: false,
  experience: 'First time owner',
  reason: 'Looking for a companion',
  status: 'pending',
  submittedAt: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

const createMockShelter = (overrides: Partial<Shelter> = {}): Shelter => ({
  _id: 'shelter1',
  name: 'Happy Paws Shelter',
  location: 'New York, NY',
  email: 'info@happypaws.com',
  phone: '555-1234',
  description: 'A loving shelter for pets',
  verified: true,
  adoptablePetsCount: 25,
  ...overrides,
});

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
      const mockProfiles: AdoptionProfile[] = [createMockProfile()];
      const mockResponse = { profiles: mockProfiles, hasMore: true, nextCursor: 'abc123' };

      mockAdoptionApi.getAdoptionProfiles.mockResolvedValue(mockResponse);

      const result = await adoptionService.getAdoptionProfiles();

      expect(result).toEqual(mockResponse);
      expect(mockAdoptionApi.getAdoptionProfiles).toHaveBeenCalledWith(undefined);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should pass filters to API', async () => {
      const filters = {
        breed: 'Golden Retriever',
        minAge: 1,
        maxAge: 5,
        location: 'New York',
        limit: 10,
      };
      const mockResponse = { profiles: [], hasMore: false };

      mockAdoptionApi.getAdoptionProfiles.mockResolvedValue(mockResponse);

      await adoptionService.getAdoptionProfiles(filters);

      expect(mockAdoptionApi.getAdoptionProfiles).toHaveBeenCalledWith(filters);
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

    it('should handle string errors', async () => {
      mockAdoptionApi.getAdoptionProfiles.mockRejectedValue('Network error');

      const result = await adoptionService.getAdoptionProfiles();

      expect(result).toEqual({ profiles: [], hasMore: false });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get adoption profiles',
        expect.any(Error),
        { filters: undefined }
      );
    });
  });

  describe('getProfileById', () => {
    it('should return profile by ID', async () => {
      const mockProfile: AdoptionProfile = {
        _id: '1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        age: 2,
        status: 'available',
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

  describe('getAllProfiles', () => {
    it('should return all profiles', async () => {
      const mockProfiles: AdoptionProfile[] = [
        {
          _id: '1',
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 2,
          status: 'available',
        } as AdoptionProfile,
        {
          _id: '2',
          name: 'Lucy',
          breed: 'Labrador',
          age: 3,
          status: 'available',
        } as AdoptionProfile,
      ];
      mockAdoptionApi.getAdoptionProfiles.mockResolvedValue({
        profiles: mockProfiles,
        hasMore: false,
      });

      const result = await adoptionService.getAllProfiles();

      expect(result).toEqual(mockProfiles);
      expect(mockAdoptionApi.getAdoptionProfiles).toHaveBeenCalledWith({ limit: 1000 });
    });

    it('should handle API errors', async () => {
      mockAdoptionApi.getAdoptionProfiles.mockRejectedValue(new Error('API Error'));

      const result = await adoptionService.getAllProfiles();

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get all profiles',
        expect.any(Error)
      );
    });
  });

  describe('submitApplication', () => {
    it('should submit application successfully', async () => {
      const applicationData = {
        adoptionProfileId: '1',
        userId: 'user123',
        message: 'I would love to adopt this pet',
        contactInfo: { email: 'user@example.com', phone: '555-1234' },
      };
      const mockApplication: AdoptionApplication = {
        ...applicationData,
        _id: 'app1',
        submittedAt: new Date().toISOString(),
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
        userId: 'user123',
        message: 'I would love to adopt this pet',
        contactInfo: { email: 'user@example.com', phone: '555-1234' },
      };

      mockAdoptionApi.submitApplication.mockRejectedValue(apiError);

      await expect(adoptionService.submitApplication(applicationData)).rejects.toThrow(apiError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to submit application', apiError, {
        adoptionProfileId: '1',
      });
    });
  });

  describe('getUserApplications', () => {
    it('should return user applications', async () => {
      const mockApplications: AdoptionApplication[] = [
        {
          _id: 'app1',
          adoptionProfileId: '1',
          userId: 'user123',
          status: 'pending',
          submittedAt: '2023-01-01T00:00:00.000Z',
        } as AdoptionApplication,
      ];

      mockAdoptionApi.getUserApplications.mockResolvedValue(mockApplications);

      const result = await adoptionService.getUserApplications('user123');

      expect(result).toEqual(mockApplications);
      expect(mockAdoptionApi.getUserApplications).toHaveBeenCalledWith('user123');
    });

    it('should handle API errors', async () => {
      mockAdoptionApi.getUserApplications.mockRejectedValue(new Error('API Error'));

      const result = await adoptionService.getUserApplications('user123');

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get user applications',
        expect.any(Error),
        { userId: 'user123' }
      );
    });
  });

  describe('getShelters', () => {
    it('should return shelters', async () => {
      const mockShelters: Shelter[] = [
        {
          _id: 'shelter1',
          name: 'Happy Paws Shelter',
          location: { city: 'New York', state: 'NY' },
          contact: { email: 'info@happypaws.com', phone: '555-1234' },
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
        name: 'Buddy',
        breed: 'Golden Retriever',
        age: 2,
        description: 'Friendly dog looking for a home',
        images: ['image1.jpg'],
        location: 'New York',
      };
      const mockProfile: AdoptionProfile = {
        ...profileData,
        _id: 'profile1',
        postedDate: '2023-01-01T00:00:00.000Z',
        status: 'available',
      } as AdoptionProfile;

      mockAdoptionApi.createAdoptionProfile.mockResolvedValue(mockProfile);

      const result = await adoptionService.createAdoptionProfile(profileData);

      expect(result).toEqual(mockProfile);
      expect(mockAdoptionApi.createAdoptionProfile).toHaveBeenCalledWith(profileData);
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('Validation failed');
      const profileData = {
        name: 'Buddy',
        breed: 'Golden Retriever',
        age: 2,
        description: 'Friendly dog',
      };

      mockAdoptionApi.createAdoptionProfile.mockRejectedValue(apiError);

      await expect(adoptionService.createAdoptionProfile(profileData)).rejects.toThrow(apiError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create adoption profile', apiError);
    });
  });

  describe('updateProfileStatus', () => {
    it('should update profile status', async () => {
      mockAdoptionApi.updateProfileStatus.mockResolvedValue(undefined);

      await adoptionService.updateProfileStatus('profile1', 'adopted');

      expect(mockAdoptionApi.updateProfileStatus).toHaveBeenCalledWith('profile1', 'adopted');
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Update failed');
      mockAdoptionApi.updateProfileStatus.mockRejectedValue(apiError);

      await expect(adoptionService.updateProfileStatus('profile1', 'adopted')).rejects.toThrow(
        apiError
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update profile status', apiError, {
        profileId: 'profile1',
        status: 'adopted',
      });
    });
  });

  describe('getAllApplications', () => {
    it('should return all applications', async () => {
      const mockApplications: AdoptionApplication[] = [
        {
          _id: 'app1',
          adoptionProfileId: '1',
          userId: 'user123',
          status: 'pending',
          submittedAt: '2023-01-01T00:00:00.000Z',
        } as AdoptionApplication,
      ];

      mockAdoptionApi.getAllApplications.mockResolvedValue(mockApplications);

      const result = await adoptionService.getAllApplications();

      expect(result).toEqual(mockApplications);
      expect(mockAdoptionApi.getAllApplications).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockAdoptionApi.getAllApplications.mockRejectedValue(new Error('API Error'));

      const result = await adoptionService.getAllApplications();

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get all applications',
        expect.any(Error)
      );
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status', async () => {
      mockAdoptionApi.updateApplicationStatus.mockResolvedValue(undefined);

      await adoptionService.updateApplicationStatus('app1', 'approved', 'Great candidate!');

      expect(mockAdoptionApi.updateApplicationStatus).toHaveBeenCalledWith('app1', {
        status: 'approved',
        reviewNotes: 'Great candidate!',
      });
    });

    it('should update status without review notes', async () => {
      mockAdoptionApi.updateApplicationStatus.mockResolvedValue(undefined);

      await adoptionService.updateApplicationStatus('app1', 'rejected');

      expect(mockAdoptionApi.updateApplicationStatus).toHaveBeenCalledWith('app1', {
        status: 'rejected',
      });
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Update failed');
      mockAdoptionApi.updateApplicationStatus.mockRejectedValue(apiError);

      await expect(adoptionService.updateApplicationStatus('app1', 'approved')).rejects.toThrow(
        apiError
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update application status',
        apiError,
        { applicationId: 'app1', status: 'approved' }
      );
    });
  });

  describe('getApplicationsByProfile', () => {
    it('should return applications for profile', async () => {
      const mockApplications: AdoptionApplication[] = [
        {
          _id: 'app1',
          adoptionProfileId: 'profile1',
          userId: 'user123',
          status: 'pending',
          submittedAt: '2023-01-01T00:00:00.000Z',
        } as AdoptionApplication,
      ];

      mockAdoptionApi.getApplicationsByProfile.mockResolvedValue(mockApplications);

      const result = await adoptionService.getApplicationsByProfile('profile1');

      expect(result).toEqual(mockApplications);
      expect(mockAdoptionApi.getApplicationsByProfile).toHaveBeenCalledWith('profile1');
    });

    it('should handle API errors', async () => {
      mockAdoptionApi.getApplicationsByProfile.mockRejectedValue(new Error('API Error'));

      const result = await adoptionService.getApplicationsByProfile('profile1');

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get applications by profile',
        expect.any(Error),
        { profileId: 'profile1' }
      );
    });
  });

  describe('integration tests', () => {
    it('should handle complete adoption workflow', async () => {
      // Get profiles
      const mockProfiles: AdoptionProfile[] = [
        {
          _id: '1',
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 2,
          status: 'available',
        } as AdoptionProfile,
      ];
      mockAdoptionApi.getAdoptionProfiles.mockResolvedValue({
        profiles: mockProfiles,
        hasMore: false,
      });

      const profiles = await adoptionService.getAdoptionProfiles();
      expect(profiles.profiles).toHaveLength(1);

      // Submit application
      const applicationData = {
        adoptionProfileId: '1',
        userId: 'user123',
        message: 'I would love to adopt this pet',
        contactInfo: { email: 'user@example.com', phone: '555-1234' },
      };
      const mockApplication: AdoptionApplication = {
        ...applicationData,
        _id: 'app1',
        submittedAt: '2023-01-01T00:00:00.000Z',
        status: 'pending',
      } as AdoptionApplication;
      mockAdoptionApi.submitApplication.mockResolvedValue(mockApplication);

      const application = await adoptionService.submitApplication(applicationData);
      expect(application.status).toBe('pending');

      // Get user applications
      mockAdoptionApi.getUserApplications.mockResolvedValue([mockApplication]);

      const userApplications = await adoptionService.getUserApplications('user123');
      expect(userApplications).toHaveLength(1);

      // Update application status
      mockAdoptionApi.updateApplicationStatus.mockResolvedValue(undefined);

      await adoptionService.updateApplicationStatus('app1', 'approved', 'Great match!');
      expect(mockAdoptionApi.updateApplicationStatus).toHaveBeenCalledWith('app1', {
        status: 'approved',
        reviewNotes: 'Great match!',
      });

      // Update profile status
      mockAdoptionApi.updateProfileStatus.mockResolvedValue(undefined);

      await adoptionService.updateProfileStatus('1', 'adopted');
      expect(mockAdoptionApi.updateProfileStatus).toHaveBeenCalledWith('1', 'adopted');
    });

    it('should handle error recovery', async () => {
      // Simulate API failure
      mockAdoptionApi.getAdoptionProfiles.mockRejectedValueOnce(new Error('Network error'));

      const result = await adoptionService.getAdoptionProfiles();
      expect(result.profiles).toEqual([]);
      expect(result.hasMore).toBe(false);

      // Recovery on next call
      const mockProfiles: AdoptionProfile[] = [
        {
          _id: '1',
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 2,
          status: 'available',
        } as AdoptionProfile,
      ];
      mockAdoptionApi.getAdoptionProfiles.mockResolvedValueOnce({
        profiles: mockProfiles,
        hasMore: false,
      });

      const recoveredResult = await adoptionService.getAdoptionProfiles();
      expect(recoveredResult.profiles).toEqual(mockProfiles);
      expect(recoveredResult.hasMore).toBe(false);
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
