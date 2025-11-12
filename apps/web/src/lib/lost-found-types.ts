/**
 * Lost & Found Alerts Data Models
 * As specified in the feature pack
 */

export type LostAlertStatus = 'active' | 'found' | 'archived';

export interface PetSummary {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  color?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'extra-large';
  age?: number;
  gender?: 'male' | 'female';
  microchipId?: string;
  distinguishingFeatures?: string[];
  distinctiveFeatures?: string[]; // Alias for compatibility
}

export interface LastSeenLocation {
  whenISO: string;
  lat?: number;
  lon?: number;
  radiusM: number;
  address?: string; // Blurred/masked address
  description?: string;
  landmarks?: string[]; // Alias for compatibility
}

export interface LostAlert {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  petSummary: PetSummary;
  lastSeen: LastSeenLocation;
  reward?: number;
  rewardCurrency?: string; // Alias for compatibility
  contactMask: string; // Partially masked phone/email
  photos: string[]; // Stripped of EXIF
  status: LostAlertStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
  foundAt?: string;
  archivedAt?: string;
  viewsCount: number;
  sightingsCount: number;
  notificationsSent?: number; // Alias for compatibility
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Sighting {
  id: string;
  alertId: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string;
  whenISO: string;
  lat?: number;
  lon?: number;
  radiusM: number;
  description: string;
  photos: string[]; // Stripped of EXIF
  contactMask: string; // Partially masked contact
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LostAlertFilters {
  species?: ('dog' | 'cat' | 'other')[];
  location?: {
    lat: number;
    lon: number;
    radiusKm: number;
  };
  status?: LostAlertStatus[];
  minReward?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateLostAlertData {
  petSummary: PetSummary;
  lastSeen: LastSeenLocation;
  reward?: number;
  contactMask: string;
  photos: string[];
  description?: string;
}

export interface CreateSightingData {
  alertId: string;
  whenISO: string;
  lat?: number;
  lon?: number;
  radiusM: number;
  description: string;
  photos: string[];
  contactMask: string;
}
