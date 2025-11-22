export type AdoptionStatus = 'available' | 'pending' | 'adopted' | 'on-hold';

export type HouseholdType = 'house' | 'apartment' | 'condo' | 'other';

export interface AdoptionProfile {
  _id: string;
  petId: string;
  petName: string;
  petPhoto: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  location: string;
  shelterId: string;
  shelterName: string;
  status: AdoptionStatus;
  description: string;
  healthStatus: string;
  vaccinated: boolean;
  spayedNeutered: boolean;
  goodWithKids: boolean;
  goodWithPets: boolean;
  energyLevel: 'low' | 'medium' | 'high';
  specialNeeds?: string;
  adoptionFee: number;
  postedDate: string;
  personality: string[];
  photos: string[];
  videoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  applicationUrl?: string;
}

export interface AdoptionApplication {
  _id: string;
  adoptionProfileId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  householdType: HouseholdType;
  hasYard: boolean;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  hasChildren: boolean;
  childrenAges?: string;
  experience: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface Shelter {
  _id: string;
  name: string;
  location: string;
  email: string;
  phone: string;
  website?: string;
  description: string;
  verified: boolean;
  adoptablePetsCount: number;
}
