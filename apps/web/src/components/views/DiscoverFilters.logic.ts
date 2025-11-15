import { useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';

export interface DiscoveryPreferences {
  readonly minAge: number;
  readonly maxAge: number;
  readonly sizes: readonly string[];
  readonly maxDistance: number;
  readonly personalities: readonly string[];
  readonly interests: readonly string[];
  readonly lookingFor: readonly string[];
  readonly minCompatibility: number;
  readonly mediaFilters: {
    readonly cropSize: 'any' | 'square' | 'portrait' | 'landscape';
    readonly photoQuality: 'any' | 'high' | 'verified';
    readonly hasVideo: boolean | 'any';
    readonly minPhotos: number;
  };
  readonly advancedFilters: {
    readonly verified: boolean;
    readonly activeToday: boolean;
    readonly hasStories: boolean;
    readonly respondQuickly: boolean;
    readonly superLikesOnly: boolean;
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
    hasVideo: false,
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

function useDiscoveryBasicFilters(current: DiscoveryPreferences) {
  const [minAge, setMinAge] = useState(current.minAge);
  const [maxAge, setMaxAge] = useState(current.maxAge);
  const [sizes, setSizes] = useState<string[]>([...current.sizes]);
  const [maxDistance, setMaxDistance] = useState(current.maxDistance);
  const [personalities, setPersonalities] = useState<string[]>([...current.personalities]);
  const [interests, setInterests] = useState<string[]>([...current.interests]);
  const [lookingFor, setLookingFor] = useState<string[]>([...current.lookingFor]);
  const [minCompatibility, setMinCompatibility] = useState(current.minCompatibility);

  const toggleSize = (size: string) =>
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  const togglePersonality = (trait: string) =>
    setPersonalities((prev) =>
      prev.includes(trait) ? prev.filter((p) => p !== trait) : [...prev, trait]
    );
  const toggleInterest = (interest: string) =>
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  const toggleLookingFor = (goal: string) =>
    setLookingFor((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );

  return {
    minAge,
    maxAge,
    setMinAge,
    setMaxAge,
    sizes,
    setSizes,
    toggleSize,
    maxDistance,
    setMaxDistance,
    personalities,
    togglePersonality,
    interests,
    toggleInterest,
    lookingFor,
    toggleLookingFor,
    minCompatibility,
    setMinCompatibility,
  } as const;
}

function useDiscoveryMediaFilters(current: DiscoveryPreferences) {
  const [cropSize, setCropSize] = useState(current.mediaFilters.cropSize);
  const [photoQuality, setPhotoQuality] = useState(current.mediaFilters.photoQuality);
  const [hasVideo, setHasVideo] = useState(current.mediaFilters.hasVideo);
  const [minPhotos, setMinPhotos] = useState(current.mediaFilters.minPhotos);
  return {
    cropSize,
    setCropSize,
    photoQuality,
    setPhotoQuality,
    hasVideo,
    setHasVideo,
    minPhotos,
    setMinPhotos,
  } as const;
}

function useDiscoveryAdvancedFilters(current: DiscoveryPreferences) {
  const [verified, setVerified] = useState(current.advancedFilters.verified);
  const [activeToday, setActiveToday] = useState(current.advancedFilters.activeToday);
  const [hasStories, setHasStories] = useState(current.advancedFilters.hasStories);
  const [respondQuickly, setRespondQuickly] = useState(current.advancedFilters.respondQuickly);
  const [superLikesOnly, setSuperLikesOnly] = useState(current.advancedFilters.superLikesOnly);
  return {
    verified,
    setVerified,
    activeToday,
    setActiveToday,
    hasStories,
    setHasStories,
    respondQuickly,
    setRespondQuickly,
    superLikesOnly,
    setSuperLikesOnly,
  } as const;
}

function computeHasActiveFilters(
  basic: ReturnType<typeof useDiscoveryBasicFilters>,
  media: ReturnType<typeof useDiscoveryMediaFilters>,
  advanced: ReturnType<typeof useDiscoveryAdvancedFilters>
) {
  return (
    basic.minAge !== DEFAULT_PREFERENCES.minAge ||
    basic.maxAge !== DEFAULT_PREFERENCES.maxAge ||
    basic.sizes.length !== DEFAULT_PREFERENCES.sizes.length ||
    basic.maxDistance !== DEFAULT_PREFERENCES.maxDistance ||
    basic.personalities.length > 0 ||
    basic.interests.length > 0 ||
    basic.lookingFor.length > 0 ||
    basic.minCompatibility > 0 ||
    media.cropSize !== 'any' ||
    media.photoQuality !== 'any' ||
    media.hasVideo !== false ||
    media.minPhotos > 1 ||
    advanced.verified ||
    advanced.activeToday ||
    advanced.hasStories ||
    advanced.respondQuickly ||
    advanced.superLikesOnly
  );
}

function createSaveHandler(
  prefs: DiscoveryPreferences,
  setPreferences: (
    updater: (current: DiscoveryPreferences | undefined) => DiscoveryPreferences
  ) => void,
  basic: ReturnType<typeof useDiscoveryBasicFilters>,
  media: ReturnType<typeof useDiscoveryMediaFilters>,
  advanced: ReturnType<typeof useDiscoveryAdvancedFilters>,
  setOpen: (open: boolean) => void
) {
  return () => {
    void setPreferences((current) => {
      const base = current ?? prefs;
      return {
        ...base,
        minAge: basic.minAge,
        maxAge: basic.maxAge,
        sizes: basic.sizes,
        maxDistance: basic.maxDistance,
        personalities: basic.personalities,
        interests: basic.interests,
        lookingFor: basic.lookingFor,
        minCompatibility: basic.minCompatibility,
        mediaFilters: {
          cropSize: media.cropSize,
          photoQuality: media.photoQuality,
          hasVideo: media.hasVideo,
          minPhotos: media.minPhotos,
        },
        advancedFilters: {
          verified: advanced.verified,
          activeToday: advanced.activeToday,
          hasStories: advanced.hasStories,
          respondQuickly: advanced.respondQuickly,
          superLikesOnly: advanced.superLikesOnly,
        },
      };
    });
    setOpen(false);
  };
}

function createResetHandler(
  basic: ReturnType<typeof useDiscoveryBasicFilters>,
  media: ReturnType<typeof useDiscoveryMediaFilters>,
  advanced: ReturnType<typeof useDiscoveryAdvancedFilters>
) {
  return () => {
    basic.setMinAge(DEFAULT_PREFERENCES.minAge);
    basic.setMaxAge(DEFAULT_PREFERENCES.maxAge);
    basic.setSizes([...DEFAULT_PREFERENCES.sizes]);
    basic.setMaxDistance(DEFAULT_PREFERENCES.maxDistance);
    basic.setMinCompatibility(DEFAULT_PREFERENCES.minCompatibility);
    media.setCropSize(DEFAULT_PREFERENCES.mediaFilters.cropSize);
    media.setPhotoQuality(DEFAULT_PREFERENCES.mediaFilters.photoQuality);
    media.setHasVideo(DEFAULT_PREFERENCES.mediaFilters.hasVideo);
    media.setMinPhotos(DEFAULT_PREFERENCES.mediaFilters.minPhotos);
    advanced.setVerified(DEFAULT_PREFERENCES.advancedFilters.verified);
    advanced.setActiveToday(DEFAULT_PREFERENCES.advancedFilters.activeToday);
    advanced.setHasStories(DEFAULT_PREFERENCES.advancedFilters.hasStories);
    advanced.setRespondQuickly(DEFAULT_PREFERENCES.advancedFilters.respondQuickly);
    advanced.setSuperLikesOnly(DEFAULT_PREFERENCES.advancedFilters.superLikesOnly);
  };
}

function useDiscoveryPersistence(params: {
  readonly prefs: DiscoveryPreferences;
  readonly setPreferences: (
    updater: (current: DiscoveryPreferences | undefined) => DiscoveryPreferences
  ) => unknown; // accepts sync or async impl
  readonly basic: ReturnType<typeof useDiscoveryBasicFilters>;
  readonly media: ReturnType<typeof useDiscoveryMediaFilters>;
  readonly advanced: ReturnType<typeof useDiscoveryAdvancedFilters>;
  readonly setOpen: (open: boolean) => void;
}) {
  const { prefs, setPreferences, basic, media, advanced, setOpen } = params;
  const hasActiveFilters = computeHasActiveFilters(basic, media, advanced);
  const handleSave = createSaveHandler(prefs, setPreferences, basic, media, advanced, setOpen);
  const handleReset = createResetHandler(basic, media, advanced);
  return { hasActiveFilters, handleSave, handleReset } as const;
}

export function useDiscoveryFiltersLogic() {
  const interaction = useInteractionFeedback();
  const [preferences, setPreferences] = useStorage<DiscoveryPreferences>(
    'discovery-preferences',
    DEFAULT_PREFERENCES
  );
  const [open, setOpen] = useState(false);
  const current = preferences || DEFAULT_PREFERENCES;
  const basic = useDiscoveryBasicFilters(current);
  const media = useDiscoveryMediaFilters(current);
  const advanced = useDiscoveryAdvancedFilters(current);
  const persistence = useDiscoveryPersistence({
    prefs: current,
    setPreferences,
    basic,
    media,
    advanced,
    setOpen,
  });
  return { interaction, open, setOpen, ...basic, ...media, ...advanced, ...persistence } as const;
}
