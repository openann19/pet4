export type AdoptionListingStatus = 'active' | 'pending_review' | 'adopted' | 'withdrawn';

export type AdoptionApplicationStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected';

export interface AdoptionListingLocation {
  city: string;
  country: string;
  lat?: number;
  lon?: number;
  privacyRadiusM?: number;
}

export interface AdoptionFee {
  amount: number;
  currency: string;
}

export interface VetDocument {
  id: string;
  type:
    | 'vaccination'
    | 'medical_record'
    | 'spay_neuter'
    | 'health_certificate'
    | 'microchip'
    | 'other';
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
}

export interface AdoptionListing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  petId: string;
  petName: string;
  petBreed: string;
  petAge: number;
  petGender: 'male' | 'female';
  petSize: 'tiny' | 'small' | 'medium' | 'large' | 'extra-large';
  petSpecies: 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other';
  petColor?: string;
  petPhotos: string[];
  petDescription: string;
  status: AdoptionListingStatus;
  fee?: AdoptionFee | null;
  location: AdoptionListingLocation;
  requirements: string[];
  vetDocuments: VetDocument[];
  vaccinated: boolean;
  spayedNeutered: boolean;
  microchipped: boolean;
  goodWithKids: boolean;
  goodWithPets: boolean;
  goodWithCats?: boolean;
  goodWithDogs?: boolean;
  energyLevel: 'low' | 'medium' | 'high' | 'very-high';
  temperament: string[];
  specialNeeds?: string;
  reasonForAdoption: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  viewsCount: number;
  applicationsCount: number;
  featured: boolean;
}

export interface AdoptionApplication {
  id: string;
  listingId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  message: string;
  homeType: 'house' | 'apartment' | 'condo' | 'farm' | 'other';
  hasYard: boolean;
  yardFenced?: boolean;
  hasChildren: boolean;
  childrenAges?: string;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  previousPetExperience: string;
  employmentStatus: 'employed' | 'self-employed' | 'retired' | 'student' | 'unemployed' | 'other';
  hoursAlonePerDay?: number;
  homeCheckConsent: boolean;
  veterinarianReference?: string;
  personalReferences?: string[];
  status: AdoptionApplicationStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  ownerNotes?: string;
}

export interface AdoptionListingFilters {
  species?: string[];
  breed?: string[];
  ageMin?: number;
  ageMax?: number;
  size?: string[];
  location?: string;
  maxDistance?: number;
  userLocation?: {
    lat: number;
    lon: number;
  };
  goodWithKids?: boolean;
  goodWithPets?: boolean;
  goodWithCats?: boolean;
  goodWithDogs?: boolean;
  energyLevel?: string[];
  temperament?: string[];
  vaccinated?: boolean;
  spayedNeutered?: boolean;
  feeMax?: number;
  status?: AdoptionListingStatus[];
  featured?: boolean;
  sortBy?: 'recent' | 'distance' | 'age' | 'fee_low' | 'fee_high';
}

export interface CreateAdoptionListingData {
  petId?: string;
  petName: string;
  petBreed: string;
  petAge: number;
  petGender: 'male' | 'female';
  petSize: 'tiny' | 'small' | 'medium' | 'large' | 'extra-large';
  petSpecies: 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other';
  petColor?: string;
  petPhotos: string[];
  petDescription: string;
  fee?: AdoptionFee | null;
  locationCity: string;
  locationCountry: string;
  locationLat?: number;
  locationLon?: number;
  requirements: string[];
  vetDocuments: VetDocument[];
  vaccinated: boolean;
  spayedNeutered: boolean;
  microchipped: boolean;
  goodWithKids: boolean;
  goodWithPets: boolean;
  goodWithCats?: boolean;
  goodWithDogs?: boolean;
  energyLevel: 'low' | 'medium' | 'high' | 'very-high';
  temperament: string[];
  specialNeeds?: string;
  reasonForAdoption: string;
}
