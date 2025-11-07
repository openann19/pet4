import type {
  AdoptionListing,
  AdoptionApplication,
  AdoptionListingFilters,
  CreateAdoptionListingData,
  AdoptionListingStatus,
  AdoptionApplicationStatus
} from './adoption-marketplace-types'
import { adoptionApi } from '@/api/adoption-api'
import type { CreateAdoptionProfileRequest } from '@/api/adoption-api'
import type { AdoptionProfile, AdoptionApplication as APIAdoptionApplication } from './adoption-types'
import { createLogger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('AdoptionMarketplaceService')

class AdoptionMarketplaceService {

  async createListing(data: CreateAdoptionListingData & { ownerId: string; ownerName: string; ownerAvatar?: string }): Promise<AdoptionListing> {
    try {
      // Map to AdoptionProfile format expected by API
      const profile = await adoptionApi.createAdoptionProfile({
        petId: data.petId || '',
        petName: data.petName,
        petPhoto: data.petPhotos?.[0] || '',
        breed: data.petBreed,
        age: data.petAge,
        gender: data.petGender,
        size: data.petSize === 'tiny' ? 'small' : data.petSize,
        location: `${String(data.locationCity ?? '')}, ${String(data.locationCountry ?? '')}`,
        shelterId: data.ownerId,
        shelterName: data.ownerName,
        status: 'pending',
        description: data.petDescription,
        healthStatus: 'good',
        vaccinated: data.vaccinated,
        spayedNeutered: data.spayedNeutered,
        goodWithKids: data.goodWithKids,
        goodWithPets: data.goodWithPets,
        energyLevel: data.energyLevel === 'very-high' ? 'high' : data.energyLevel,
        specialNeeds: data.specialNeeds,
        adoptionFee: data.fee?.amount || 0,
        personality: data.temperament || [],
        photos: data.petPhotos,
        contactEmail: '',
        contactPhone: data.ownerId
      } as CreateAdoptionProfileRequest)
      
      // Convert AdoptionProfile to AdoptionListing format
      return this.convertProfileToListing(profile, data)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create listing', err, { ownerId: data.ownerId })
      throw err
    }
  }

  async getListingById(id: string): Promise<AdoptionListing | undefined> {
    try {
      const profile = await adoptionApi.getProfileById(id)
      if (!profile) return undefined
      
      // Convert AdoptionProfile to AdoptionListing format
      return this.convertProfileToListing(profile)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get listing', err, { id })
      return undefined
    }
  }

  async getActiveListings(filters?: AdoptionListingFilters): Promise<AdoptionListing[]> {
    try {
      const response = await adoptionApi.getAdoptionProfiles({
        status: 'active',
        ...(filters?.breed && { breed: filters.breed.join(',') }),
        ...(filters?.ageMin !== undefined && { minAge: filters.ageMin }),
        ...(filters?.ageMax !== undefined && { maxAge: filters.ageMax }),
        ...(filters?.size && filters.size.length > 0 && { size: filters.size }),
        ...(filters?.location && { location: filters.location }),
        ...(filters?.goodWithKids !== undefined && { goodWithKids: filters.goodWithKids }),
        ...(filters?.goodWithPets !== undefined && { goodWithPets: filters.goodWithPets })
      })
      
      let listings = response.profiles.map((p: AdoptionProfile) => this.convertProfileToListing(p))
      
      // Apply additional filters client-side
      if (filters?.species && filters.species.length > 0) {
        listings = listings.filter((l: AdoptionListing) => filters.species!.includes(l.petSpecies))
      }

      if (isTruthy(filters?.goodWithCats)) {
        listings = listings.filter((l: AdoptionListing) => l.goodWithCats === true)
      }

      if (isTruthy(filters?.goodWithDogs)) {
        listings = listings.filter((l: AdoptionListing) => l.goodWithDogs === true)
      }

      if (filters?.energyLevel && filters.energyLevel.length > 0) {
        listings = listings.filter((l: AdoptionListing) => filters.energyLevel!.includes(l.energyLevel))
      }

      if (filters?.temperament && filters.temperament.length > 0) {
        listings = listings.filter((l: AdoptionListing) =>
          filters.temperament!.some(trait => l.temperament.includes(trait))
        )
      }

      if (isTruthy(filters?.vaccinated)) {
        listings = listings.filter((l: AdoptionListing) => l.vaccinated)
      }

      if (isTruthy(filters?.spayedNeutered)) {
        listings = listings.filter((l: AdoptionListing) => l.spayedNeutered)
      }

      if (filters?.feeMax !== undefined) {
        listings = listings.filter((l: AdoptionListing) =>
          !l.fee || l.fee.amount <= filters.feeMax!
        )
      }

      if (isTruthy(filters?.featured)) {
        listings = listings.filter((l: AdoptionListing) => l.featured)
      }

      if (isTruthy(filters?.sortBy)) {
        switch (filters.sortBy) {
          case 'recent':
            listings.sort((a: AdoptionListing, b: AdoptionListing) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            break
          case 'age':
            listings.sort((a: AdoptionListing, b: AdoptionListing) => a.petAge - b.petAge)
            break
          case 'fee_low':
            listings.sort((a: AdoptionListing, b: AdoptionListing) => (a.fee?.amount || 0) - (b.fee?.amount || 0))
            break
          case 'fee_high':
            listings.sort((a: AdoptionListing, b: AdoptionListing) => (b.fee?.amount || 0) - (a.fee?.amount || 0))
            break
        }
      } else {
        listings.sort((a: AdoptionListing, b: AdoptionListing) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      }

      return listings
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get active listings', err, { filters })
      return []
    }
  }

  async getUserListings(userId: string): Promise<AdoptionListing[]> {
    try {
      const response = await adoptionApi.getAdoptionProfiles({})
      return response.profiles
        .filter((p: AdoptionProfile) => p.shelterId === userId)
        .map((p: AdoptionProfile) => this.convertProfileToListing(p))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get user listings', err, { userId })
      return []
    }
  }

  async updateListingStatus(
    listingId: string,
    status: AdoptionListingStatus,
    _adminId?: string,
    _reason?: string
  ): Promise<void> {
    try {
      await adoptionApi.updateProfileStatus(listingId, status === 'pending_review' ? 'pending' : status === 'adopted' ? 'adopted' : status === 'withdrawn' ? 'on-hold' : 'available')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update listing status', err, { listingId, status })
      throw err
    }
  }

  async incrementViewCount(_listingId: string): Promise<void> {
    // View count increment is handled by backend API when fetching listing
    // This is a no-op as the API handles view tracking
  }

  async createApplication(data: Omit<AdoptionApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<AdoptionApplication> {
    try {
      const apiApp = await adoptionApi.submitApplication({
        adoptionProfileId: data.listingId,
        applicantId: data.applicantId,
        applicantName: data.applicantName,
        applicantEmail: data.applicantEmail,
        applicantPhone: data.applicantPhone || '',
        householdType: data.homeType === 'house' ? 'house' : data.homeType === 'apartment' ? 'apartment' : data.homeType === 'condo' ? 'condo' : 'other',
        hasYard: data.hasYard,
        hasOtherPets: data.hasOtherPets,
        ...(data.otherPetsDetails && { otherPetsDetails: data.otherPetsDetails }),
        hasChildren: data.hasChildren,
        ...(data.childrenAges && { childrenAges: data.childrenAges }),
        experience: data.message || '',
        reason: data.message
      })
      
      // Convert API AdoptionApplication to marketplace AdoptionApplication
      return {
        id: apiApp._id,
        listingId: apiApp.adoptionProfileId,
        applicantId: apiApp.applicantId,
        applicantName: apiApp.applicantName,
        applicantEmail: apiApp.applicantEmail,
        applicantPhone: apiApp.applicantPhone,
        message: apiApp.reason || apiApp.experience || '',
        homeType: apiApp.householdType === 'house' ? 'house' : apiApp.householdType === 'apartment' ? 'apartment' : apiApp.householdType === 'condo' ? 'condo' : 'other',
        hasYard: apiApp.hasYard,
        yardFenced: undefined,
        hasOtherPets: apiApp.hasOtherPets,
        otherPetsDetails: apiApp.otherPetsDetails,
        previousPetExperience: apiApp.experience || '',
        employmentStatus: 'other',
        hoursAlonePerDay: undefined,
        homeCheckConsent: true,
        veterinarianReference: undefined,
        personalReferences: undefined,
        hasChildren: apiApp.hasChildren,
        childrenAges: apiApp.childrenAges,
        status: apiApp.status === 'pending' ? 'submitted' : apiApp.status === 'approved' ? 'accepted' : apiApp.status === 'rejected' ? 'rejected' : 'submitted',
        createdAt: apiApp.submittedAt,
        updatedAt: apiApp.submittedAt,
        reviewedAt: apiApp.reviewedAt,
        reviewedBy: undefined,
        reviewNotes: apiApp.reviewNotes,
        ownerNotes: undefined
      } as unknown as AdoptionApplication
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create application', err, { listingId: data.listingId })
      throw err
    }
  }

  async getApplicationById(id: string): Promise<AdoptionApplication | undefined> {
    try {
      const applications = await adoptionApi.getAllApplications()
      const apiApp = applications.find((a: APIAdoptionApplication) => a._id === id)
      if (!apiApp) return undefined
      
      // Convert API AdoptionApplication to marketplace AdoptionApplication
      return {
        id: apiApp._id,
        listingId: apiApp.adoptionProfileId,
        applicantId: apiApp.applicantId,
        applicantName: apiApp.applicantName,
        applicantEmail: apiApp.applicantEmail,
        applicantPhone: apiApp.applicantPhone,
        message: apiApp.reason || apiApp.experience || '',
        homeType: apiApp.householdType === 'house' ? 'house' : apiApp.householdType === 'apartment' ? 'apartment' : apiApp.householdType === 'condo' ? 'condo' : 'other',
        hasYard: apiApp.hasYard,
        yardFenced: undefined,
        hasOtherPets: apiApp.hasOtherPets,
        otherPetsDetails: apiApp.otherPetsDetails,
        previousPetExperience: apiApp.experience || '',
        employmentStatus: 'other',
        hoursAlonePerDay: undefined,
        homeCheckConsent: true,
        veterinarianReference: undefined,
        personalReferences: undefined,
        hasChildren: apiApp.hasChildren,
        childrenAges: apiApp.childrenAges,
        status: apiApp.status === 'pending' ? 'submitted' : apiApp.status === 'approved' ? 'accepted' : apiApp.status === 'rejected' ? 'rejected' : 'submitted',
        createdAt: apiApp.submittedAt,
        updatedAt: apiApp.submittedAt,
        reviewedAt: apiApp.reviewedAt,
        reviewedBy: undefined,
        reviewNotes: apiApp.reviewNotes,
        ownerNotes: undefined
      } as unknown as AdoptionApplication
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get application', err, { id })
      return undefined
    }
  }

  async getListingApplications(listingId: string): Promise<AdoptionApplication[]> {
    try {
      const apiApps = await adoptionApi.getApplicationsByProfile(listingId)
      return apiApps.map((apiApp: APIAdoptionApplication) => ({
        id: apiApp._id,
        listingId: apiApp.adoptionProfileId,
        applicantId: apiApp.applicantId,
        applicantName: apiApp.applicantName,
        applicantEmail: apiApp.applicantEmail,
        applicantPhone: apiApp.applicantPhone,
        message: apiApp.reason || apiApp.experience || '',
        homeType: apiApp.householdType === 'house' ? 'house' : apiApp.householdType === 'apartment' ? 'apartment' : apiApp.householdType === 'condo' ? 'condo' : 'other',
        hasYard: apiApp.hasYard,
        yardFenced: undefined,
        hasOtherPets: apiApp.hasOtherPets,
        otherPetsDetails: apiApp.otherPetsDetails,
        previousPetExperience: apiApp.experience || '',
        employmentStatus: 'other' as const,
        hoursAlonePerDay: undefined,
        homeCheckConsent: true,
        veterinarianReference: undefined,
        personalReferences: undefined,
        hasChildren: apiApp.hasChildren,
        childrenAges: apiApp.childrenAges,
        status: apiApp.status === 'pending' ? 'submitted' : apiApp.status === 'approved' ? 'accepted' : apiApp.status === 'rejected' ? 'rejected' : 'submitted',
        createdAt: apiApp.submittedAt,
        updatedAt: apiApp.submittedAt,
        reviewedAt: apiApp.reviewedAt,
        reviewedBy: undefined,
        reviewNotes: apiApp.reviewNotes,
        ownerNotes: undefined
      } as unknown as AdoptionApplication))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get listing applications', err, { listingId })
      return []
    }
  }

  async getUserApplications(userId: string): Promise<AdoptionApplication[]> {
    try {
      const apiApps = await adoptionApi.getUserApplications(userId)
      return apiApps.map((apiApp: APIAdoptionApplication) => ({
        id: apiApp._id,
        listingId: apiApp.adoptionProfileId,
        applicantId: apiApp.applicantId,
        applicantName: apiApp.applicantName,
        applicantEmail: apiApp.applicantEmail,
        applicantPhone: apiApp.applicantPhone,
        message: apiApp.reason || apiApp.experience || '',
        homeType: apiApp.householdType === 'house' ? 'house' : apiApp.householdType === 'apartment' ? 'apartment' : apiApp.householdType === 'condo' ? 'condo' : 'other',
        hasYard: apiApp.hasYard,
        yardFenced: undefined,
        hasOtherPets: apiApp.hasOtherPets,
        otherPetsDetails: apiApp.otherPetsDetails,
        previousPetExperience: apiApp.experience || '',
        employmentStatus: 'other' as const,
        hoursAlonePerDay: undefined,
        homeCheckConsent: true,
        veterinarianReference: undefined,
        personalReferences: undefined,
        hasChildren: apiApp.hasChildren,
        childrenAges: apiApp.childrenAges,
        status: apiApp.status === 'pending' ? 'submitted' : apiApp.status === 'approved' ? 'accepted' : apiApp.status === 'rejected' ? 'rejected' : 'submitted',
        createdAt: apiApp.submittedAt,
        updatedAt: apiApp.submittedAt,
        reviewedAt: apiApp.reviewedAt,
        reviewedBy: undefined,
        reviewNotes: apiApp.reviewNotes,
        ownerNotes: undefined
      } as unknown as AdoptionApplication))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get user applications', err, { userId })
      return []
    }
  }

  async updateApplicationStatus(
    applicationId: string,
    status: AdoptionApplicationStatus,
    _reviewerId?: string,
    notes?: string
  ): Promise<void> {
    try {
      const apiStatus = status === 'submitted' || status === 'under_review' ? 'pending' : status === 'accepted' ? 'approved' : 'rejected'
      await adoptionApi.updateApplicationStatus(applicationId, {
        status: apiStatus,
        ...(notes !== undefined && { reviewNotes: notes })
      })
      
      // If accepted, update listing status to adopted
      if (status === 'accepted') {
        const application = await this.getApplicationById(applicationId)
        if (isTruthy(application)) {
          await this.updateListingStatus(application.listingId, 'adopted')
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update application status', err, { applicationId, status })
      throw err
    }
  }

  async getPendingListings(): Promise<AdoptionListing[]> {
    try {
      const response = await adoptionApi.getAdoptionProfiles({ status: 'pending_review' })
      return response.profiles
        .map((p: AdoptionProfile) => this.convertProfileToListing(p))
        .sort((a: AdoptionListing, b: AdoptionListing) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get pending listings', err)
      return []
    }
  }

  async getPendingApplications(): Promise<AdoptionApplication[]> {
    try {
      const applications = await adoptionApi.getAllApplications()
      return (applications
        .filter((a: APIAdoptionApplication) => a.status === 'pending' || a.status === 'approved')
        .map((apiApp: APIAdoptionApplication) => ({
          id: apiApp._id,
          listingId: apiApp.adoptionProfileId,
          applicantId: apiApp.applicantId,
          applicantName: apiApp.applicantName,
          applicantEmail: apiApp.applicantEmail,
          applicantPhone: apiApp.applicantPhone,
          message: apiApp.reason || apiApp.experience || '',
          homeType: (apiApp.householdType === 'house' ? 'house' : apiApp.householdType === 'apartment' ? 'apartment' : apiApp.householdType === 'condo' ? 'condo' : 'other') as 'house' | 'apartment' | 'condo' | 'farm' | 'other',
          hasYard: apiApp.hasYard,
          yardFenced: false,
          hasOtherPets: apiApp.hasOtherPets,
          otherPetsDetails: apiApp.otherPetsDetails,
          hasChildren: apiApp.hasChildren,
          childrenAges: apiApp.childrenAges,
          previousPetExperience: apiApp.experience || '',
          employmentStatus: 'other' as const,
          hoursAlonePerDay: undefined,
          homeCheckConsent: true,
          veterinarianReference: undefined,
          personalReferences: undefined,
          status: apiApp.status === 'pending' ? 'submitted' : apiApp.status === 'approved' ? 'accepted' : apiApp.status === 'rejected' ? 'rejected' : 'submitted',
          createdAt: apiApp.submittedAt,
          updatedAt: apiApp.submittedAt,
          reviewedAt: apiApp.reviewedAt,
          reviewedBy: undefined,
          reviewNotes: apiApp.reviewNotes,
          ownerNotes: undefined
        })) as unknown as AdoptionApplication[])
        .filter((a: AdoptionApplication) => a.status === 'submitted' || a.status === 'under_review')
        .sort((a: AdoptionApplication, b: AdoptionApplication) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get pending applications', err)
      return []
    }
  }

  private convertProfileToListing(profile: AdoptionProfile, originalData?: CreateAdoptionListingData & { ownerAvatar?: string }): AdoptionListing {
    // Parse location string into object
    const locationParts = profile.location.split(', ')
    const city = locationParts[0] || ''
    const country = locationParts[1] || ''
    
    // Map AdoptionStatus to AdoptionListingStatus
    const statusMap: Record<string, AdoptionListingStatus> = {
      'available': 'active',
      'pending': 'pending_review',
      'adopted': 'adopted',
      'on-hold': 'pending_review'
    }
    
    return {
      id: profile._id,
      ownerId: profile.shelterId,
      ownerName: profile.shelterName,
      ...(originalData?.ownerAvatar !== undefined && { ownerAvatar: originalData.ownerAvatar }),
      petId: profile.petId,
      petName: profile.petName,
      petBreed: profile.breed,
      petAge: profile.age,
      petGender: profile.gender,
      petSize: profile.size === 'extra-large' ? 'extra-large' : profile.size,
      petSpecies: originalData?.petSpecies || 'dog',
      petColor: originalData?.petColor || '',
      petPhotos: profile.photos,
      petDescription: profile.description,
      status: statusMap[profile.status] || 'pending_review',
      fee: profile.adoptionFee > 0 ? { amount: profile.adoptionFee, currency: 'USD' } : null,
      location: {
        city,
        country,
        privacyRadiusM: 1000
      },
      requirements: originalData?.requirements || [],
      vetDocuments: originalData?.vetDocuments || [],
      vaccinated: profile.vaccinated,
      spayedNeutered: profile.spayedNeutered,
      microchipped: originalData?.microchipped || false,
      goodWithKids: profile.goodWithKids,
      goodWithPets: profile.goodWithPets,
      ...(originalData?.goodWithCats !== undefined && { goodWithCats: originalData.goodWithCats }),
      ...(originalData?.goodWithDogs !== undefined && { goodWithDogs: originalData.goodWithDogs }),
      energyLevel: profile.energyLevel === 'high' ? 'high' : profile.energyLevel,
      temperament: profile.personality || [],
      ...(profile.specialNeeds !== undefined && { specialNeeds: profile.specialNeeds }),
      reasonForAdoption: originalData?.reasonForAdoption || '',
      createdAt: profile.postedDate,
      updatedAt: profile.postedDate,
      viewsCount: 0,
      applicationsCount: 0,
      featured: false
    } as AdoptionListing
  }
}

export const adoptionMarketplaceService = new AdoptionMarketplaceService()
