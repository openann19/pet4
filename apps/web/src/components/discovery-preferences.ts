export type PetSize = 'small' | 'medium' | 'large' | 'extra-large';
export type CropSize = 'any' | 'square' | 'portrait' | 'landscape';
export type PhotoQuality = 'any' | 'high' | 'verified';
export type HasVideoFilter = boolean | 'any';

export interface DiscoveryPreferences {
  minAge: number;
  maxAge: number;
  sizes: PetSize[];
  maxDistance: number;
  personalities: string[];
  interests: string[];
  lookingFor: string[];
  minCompatibility: number;
  mediaFilters: {
    cropSize: CropSize;
    photoQuality: PhotoQuality;
    hasVideo: HasVideoFilter;
    minPhotos: number;
  };
  advancedFilters: {
    verified: boolean;
    activeToday: boolean;
    hasStories: boolean;
    respondQuickly: boolean;
    superLikesOnly: boolean;
  };
}

export const DEFAULT_PREFERENCES: DiscoveryPreferences = {
  minAge: 0,
  maxAge: 15,
  sizes: ['small', 'medium', 'large', 'extra-large'],
  maxDistance: 50,
  personalities: [],
  interests: [],
  lookingFor: [],
  minCompatibility: 0,
  mediaFilters: {
    cropSize: 'any',
    photoQuality: 'any',
    hasVideo: 'any',
    minPhotos: 1,
  },
  advancedFilters: {
    verified: false,
    activeToday: false,
    hasStories: false,
    respondQuickly: false,
    superLikesOnly: false,
  },
};

export const ALL_PERSONALITIES = [
  'playful',
  'calm',
  'energetic',
  'gentle',
  'social',
  'independent',
  'affectionate',
  'curious',
  'protective',
  'loyal',
  'friendly',
  'outgoing',
  'confident',
  'quiet',
  'relaxed',
  'active',
  'adventurous',
  'cuddly',
  'loving',
  'intelligent',
] as const;

export const ALL_INTERESTS = [
  'fetch',
  'swimming',
  'hiking',
  'cuddling',
  'playing',
  'training',
  'running',
  'walking',
  'agility',
  'tricks',
  'sleeping',
  'eating',
  'exploring',
  'meeting new friends',
  'car rides',
  'beach',
  'park',
  'toys',
] as const;

export const ALL_LOOKING_FOR = [
  'playdate',
  'walking buddy',
  'training partner',
  'best friend',
  'adventure companion',
  'cuddle buddy',
  'active friend',
  'gentle friend',
] as const;

export const ALL_SIZES: PetSize[] = ['small', 'medium', 'large', 'extra-large'];

export function hasActiveDiscoveryFilters(prefs: DiscoveryPreferences): boolean {
  const base = DEFAULT_PREFERENCES;

  return (
    prefs.minAge !== base.minAge ||
    prefs.maxAge !== base.maxAge ||
    prefs.sizes.length !== base.sizes.length ||
    prefs.maxDistance !== base.maxDistance ||
    prefs.personalities.length > 0 ||
    prefs.interests.length > 0 ||
    prefs.lookingFor.length > 0 ||
    prefs.minCompatibility > 0 ||
    prefs.mediaFilters.cropSize !== 'any' ||
    prefs.mediaFilters.photoQuality !== 'any' ||
    prefs.mediaFilters.hasVideo === true ||
    prefs.mediaFilters.minPhotos > 1 ||
    prefs.advancedFilters.verified ||
    prefs.advancedFilters.activeToday ||
    prefs.advancedFilters.hasStories ||
    prefs.advancedFilters.respondQuickly ||
    prefs.advancedFilters.superLikesOnly
  );
}
