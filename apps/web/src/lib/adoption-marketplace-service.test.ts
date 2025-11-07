import { describe, it, expect, beforeEach, vi } from 'vitest'
import { adoptionMarketplaceService } from './adoption-marketplace-service'
import { adoptionApi } from '@/api/adoption-api'

vi.mock('@/api/adoption-api', async () => {
  const actual = await vi.importActual<typeof import('@/api/adoption-api')>('@/api/adoption-api')
  return {
    ...actual,
    adoptionApi: {
      createAdoptionProfile: vi.fn(),
      updateAdoptionProfile: vi.fn(),
      updateProfileStatus: vi.fn(),
      getProfileById: vi.fn(),
      deleteAdoptionProfile: vi.fn(),
      getApplicationsByProfile: vi.fn()
    }
  }
})

describe('AdoptionMarketplaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createListing', () => {
    it('should create a listing successfully', async () => {
      const mockListing = {
        id: '1',
        petId: 'pet-1',
        petName: 'Fluffy',
        status: 'pending' as const,
        location: 'Sofia, Bulgaria',
        breed: 'Golden Retriever',
        age: 2,
        gender: 'male',
        size: 'large',
        createdAt: new Date().toISOString()
      }

      vi.mocked(adoptionApi.createAdoptionProfile).mockResolvedValue(mockListing as never)

      const listingData = {
        petId: 'pet-1',
        petName: 'Fluffy',
        petBreed: 'Golden Retriever',
        petAge: 2,
        petGender: 'male' as const,
        petSize: 'large' as const,
        locationCity: 'Sofia',
        locationCountry: 'Bulgaria',
        petDescription: 'A friendly dog',
        ownerId: 'owner-1',
        ownerName: 'John Doe',
        vaccinated: true,
        spayedNeutered: true,
        goodWithKids: true,
        goodWithPets: true,
        energyLevel: 'high' as const,
        specialNeeds: false,
        fee: { amount: 100, currency: 'BGN' },
        temperament: ['friendly', 'playful'],
        petPhotos: ['photo1.jpg']
      }

      const result = await adoptionMarketplaceService.createListing(listingData)

      expect(result).toBeDefined()
      expect(adoptionApi.createAdoptionProfile).toHaveBeenCalledTimes(1)
    })

    it('should handle errors during listing creation', async () => {
      vi.mocked(adoptionApi.createAdoptionProfile).mockRejectedValue(new Error('API Error'))

      const listingData = {
        petId: 'pet-1',
        petName: 'Fluffy',
        petBreed: 'Golden Retriever',
        petAge: 2,
        petGender: 'male' as const,
        petSize: 'large' as const,
        locationCity: 'Sofia',
        locationCountry: 'Bulgaria',
        petDescription: 'A friendly dog',
        ownerId: 'owner-1',
        ownerName: 'John Doe',
        vaccinated: true,
        spayedNeutered: true,
        goodWithKids: true,
        goodWithPets: true,
        energyLevel: 'high' as const,
        specialNeeds: false,
        fee: { amount: 100, currency: 'BGN' },
        temperament: [],
        petPhotos: []
      }

      await expect(adoptionMarketplaceService.createListing(listingData)).rejects.toThrow()
    })
  })

  describe('updateListingStatus', () => {
    it('should update listing status successfully', async () => {
      vi.mocked(adoptionApi.updateProfileStatus).mockResolvedValue(undefined)

      await expect(adoptionMarketplaceService.updateListingStatus('1', 'active')).resolves.not.toThrow()
      expect(adoptionApi.updateProfileStatus).toHaveBeenCalledWith('1', 'available')
    })
  })

  describe('getListingById', () => {
    it('should retrieve a listing by ID', async () => {
      const mockListing = {
        _id: '1',
        petId: 'pet-1',
        petName: 'Fluffy',
        status: 'available' as const,
        location: 'Sofia, Bulgaria',
        breed: 'Golden Retriever',
        age: 2,
        gender: 'male',
        size: 'large',
        shelterId: 'owner-1',
        shelterName: 'John Doe',
        photos: [],
        description: 'A friendly dog',
        adoptionFee: 100,
        vaccinated: true,
        spayedNeutered: true,
        goodWithKids: true,
        goodWithPets: true,
        energyLevel: 'high' as const,
        personality: [],
        postedDate: new Date().toISOString()
      }

      vi.mocked(adoptionApi.getProfileById).mockResolvedValue(mockListing as never)

      const result = await adoptionMarketplaceService.getListingById('1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('1')
      expect(adoptionApi.getProfileById).toHaveBeenCalledWith('1')
    })

    it('should return undefined for non-existent listing', async () => {
      vi.mocked(adoptionApi.getProfileById).mockResolvedValue(undefined as never)

      const result = await adoptionMarketplaceService.getListingById('non-existent')

      expect(result).toBeUndefined()
    })
  })

  describe('getListingApplications', () => {
    it('should retrieve listing applications', async () => {
      const mockApplications = [
        { id: 'app-1', listingId: '1', applicantId: 'user-1', status: 'pending' as const },
        { id: 'app-2', listingId: '1', applicantId: 'user-2', status: 'pending' as const }
      ]

      vi.mocked(adoptionApi.getApplicationsByProfile).mockResolvedValue(mockApplications as never)

      const result = await adoptionMarketplaceService.getListingApplications('1')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(adoptionApi.getApplicationsByProfile).toHaveBeenCalledWith('1')
    })

    it('should handle empty applications', async () => {
      vi.mocked(adoptionApi.getApplicationsByProfile).mockResolvedValue([] as never)

      const result = await adoptionMarketplaceService.getListingApplications('1')

      expect(result).toEqual([])
    })
  })

  describe('data transformation', () => {
    it('should map size correctly', async () => {
      const mockListing = {
        id: '1',
        petName: 'Tiny',
        status: 'pending' as const,
        location: 'Sofia, Bulgaria',
        breed: 'Chihuahua',
        age: 1,
        gender: 'female',
        size: 'small'
      }

      vi.mocked(adoptionApi.createAdoptionProfile).mockResolvedValue(mockListing as never)

      const listingData = {
        petId: 'pet-1',
        petName: 'Tiny',
        petBreed: 'Chihuahua',
        petAge: 1,
        petGender: 'female' as const,
        petSize: 'tiny' as const,
        locationCity: 'Sofia',
        locationCountry: 'Bulgaria',
        petDescription: 'Small dog',
        ownerId: 'owner-1',
        ownerName: 'Jane Doe',
        vaccinated: true,
        spayedNeutered: false,
        goodWithKids: true,
        goodWithPets: false,
        energyLevel: 'low' as const,
        specialNeeds: false,
        fee: { amount: 50, currency: 'BGN' },
        temperament: [],
        petPhotos: []
      }

      await adoptionMarketplaceService.createListing(listingData)

      const callArgs = vi.mocked(adoptionApi.createAdoptionProfile).mock.calls[0]?.[0]
      expect(callArgs?.size).toBe('small')
    })
  })
})

