import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import {
  Funnel,
  X,
  CheckCircle,
  Lightning,
  Camera,
  VideoCamera,
  Sparkle,
  Clock,
  ChatCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface DiscoveryPreferences {
  minAge: number;
  maxAge: number;
  sizes: string[];
  maxDistance: number;
  personalities: string[];
  interests: string[];
  lookingFor: string[];
  minCompatibility: number;
  mediaFilters: {
    cropSize: 'any' | 'square' | 'portrait' | 'landscape';
    photoQuality: 'any' | 'high' | 'verified';
    hasVideo: boolean | 'any';
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

const DEFAULT_PREFERENCES: DiscoveryPreferences = {
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

const ALL_PERSONALITIES = [
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
];

const ALL_INTERESTS = [
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
];

const ALL_LOOKING_FOR = [
  'playdate',
  'walking buddy',
  'training partner',
  'best friend',
  'adventure companion',
  'cuddle buddy',
  'active friend',
  'gentle friend',
];

export default function DiscoveryFilters() {
  const [preferences, setPreferences] = useStorage<DiscoveryPreferences>(
    'discovery-preferences',
    DEFAULT_PREFERENCES
  );
  const [open, setOpen] = useState(false);

  const filterButtonHover = useHoverTap({ hoverScale: 1.05, tapScale: 0.95 });

  // Animated badge pulse
  const badgeScale = useSharedValue(1);
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  })) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  // Animated emoji rotation
  const emojiRotate = useSharedValue(0);
  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emojiRotate.value}deg` }],
  })) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  const currentPrefs = preferences || DEFAULT_PREFERENCES;
  const [minAge, setMinAge] = useState(currentPrefs.minAge);
  const [maxAge, setMaxAge] = useState(currentPrefs.maxAge);
  const [sizes, setSizes] = useState(currentPrefs.sizes);
  const [maxDistance, setMaxDistance] = useState(currentPrefs.maxDistance);
  const [personalities, setPersonalities] = useState(currentPrefs.personalities || []);
  const [interests, setInterests] = useState(currentPrefs.interests || []);
  const [lookingFor, setLookingFor] = useState(currentPrefs.lookingFor || []);
  const [minCompatibility, setMinCompatibility] = useState(currentPrefs.minCompatibility || 0);

  const [cropSize, setCropSize] = useState(currentPrefs.mediaFilters?.cropSize || 'any');
  const [photoQuality, setPhotoQuality] = useState(
    currentPrefs.mediaFilters?.photoQuality || 'any'
  );
  const [hasVideo, setHasVideo] = useState(currentPrefs.mediaFilters?.hasVideo || false);
  const [minPhotos, setMinPhotos] = useState(currentPrefs.mediaFilters?.minPhotos || 1);

  const [verified, setVerified] = useState(currentPrefs.advancedFilters?.verified || false);
  const [activeToday, setActiveToday] = useState(
    currentPrefs.advancedFilters?.activeToday || false
  );
  const [hasStories, setHasStories] = useState(currentPrefs.advancedFilters?.hasStories || false);
  const [respondQuickly, setRespondQuickly] = useState(
    currentPrefs.advancedFilters?.respondQuickly || false
  );
  const [superLikesOnly, setSuperLikesOnly] = useState(
    currentPrefs.advancedFilters?.superLikesOnly || false
  );

  const hasActiveFilters =
    minAge !== DEFAULT_PREFERENCES.minAge ||
    maxAge !== DEFAULT_PREFERENCES.maxAge ||
    sizes.length !== DEFAULT_PREFERENCES.sizes.length ||
    maxDistance !== DEFAULT_PREFERENCES.maxDistance ||
    personalities.length > 0 ||
    interests.length > 0 ||
    lookingFor.length > 0 ||
    minCompatibility > 0 ||
    cropSize !== 'any' ||
    photoQuality !== 'any' ||
    hasVideo !== false ||
    minPhotos > 1 ||
    verified ||
    activeToday ||
    hasStories ||
    respondQuickly ||
    superLikesOnly;

  useEffect(() => {
    if (hasActiveFilters) {
      badgeScale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 750 }), withTiming(1, { duration: 750 })),
        -1,
        true
      );
    } else {
      badgeScale.value = 1;
    }
  }, [hasActiveFilters, badgeScale]);

  useEffect(() => {
    emojiRotate.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 1000 }),
        withTiming(-10, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [emojiRotate]);

  const allSizes = ['small', 'medium', 'large', 'extra-large'];

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const togglePersonality = (trait: string) => {
    if (personalities.includes(trait)) {
      setPersonalities(personalities.filter((p) => p !== trait));
    } else {
      setPersonalities([...personalities, trait]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const toggleLookingFor = (goal: string) => {
    if (lookingFor.includes(goal)) {
      setLookingFor(lookingFor.filter((g) => g !== goal));
    } else {
      setLookingFor([...lookingFor, goal]);
    }
  };

  const handleSave = () => {
    setPreferences((current) => ({
      ...(current || DEFAULT_PREFERENCES),
      minAge,
      maxAge,
      sizes,
      maxDistance,
      personalities,
      interests,
      lookingFor,
      minCompatibility,
      mediaFilters: {
        cropSize,
        photoQuality,
        hasVideo,
        minPhotos,
      },
      advancedFilters: {
        verified,
        activeToday,
        hasStories,
        respondQuickly,
        superLikesOnly,
      },
    }));
    setOpen(false);
  };

  const handleReset = () => {
    setMinAge(DEFAULT_PREFERENCES.minAge);
    setMaxAge(DEFAULT_PREFERENCES.maxAge);
    setSizes(DEFAULT_PREFERENCES.sizes);
    setMaxDistance(DEFAULT_PREFERENCES.maxDistance);
    setPersonalities(DEFAULT_PREFERENCES.personalities);
    setInterests(DEFAULT_PREFERENCES.interests);
    setLookingFor(DEFAULT_PREFERENCES.lookingFor);
    setMinCompatibility(DEFAULT_PREFERENCES.minCompatibility);
    setCropSize(DEFAULT_PREFERENCES.mediaFilters.cropSize);
    setPhotoQuality(DEFAULT_PREFERENCES.mediaFilters.photoQuality);
    setHasVideo(DEFAULT_PREFERENCES.mediaFilters.hasVideo);
    setMinPhotos(DEFAULT_PREFERENCES.mediaFilters.minPhotos);
    setVerified(DEFAULT_PREFERENCES.advancedFilters.verified);
    setActiveToday(DEFAULT_PREFERENCES.advancedFilters.activeToday);
    setHasStories(DEFAULT_PREFERENCES.advancedFilters.hasStories);
    setRespondQuickly(DEFAULT_PREFERENCES.advancedFilters.respondQuickly);
    setSuperLikesOnly(DEFAULT_PREFERENCES.advancedFilters.superLikesOnly);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div>
          <AnimatedView
            style={filterButtonHover.animatedStyle}
            onMouseEnter={filterButtonHover.handleMouseEnter}
            onMouseLeave={filterButtonHover.handleMouseLeave}
            onClick={filterButtonHover.handlePress}
          >
            <Button variant="outline" size="sm" className="gap-2 relative">
              <Funnel size={16} weight={hasActiveFilters ? 'fill' : 'regular'} />
              Filters
              {hasActiveFilters && (
                <AnimatedView
                  style={badgeAnimatedStyle}
                  className="w-2 h-2 bg-primary rounded-full absolute -top-0.5 -right-0.5"
                />
              )}
            </Button>
          </AnimatedView>
        </div>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-2xl flex items-center gap-2">
            <AnimatedView style={emojiAnimatedStyle}>
              <span>🎯</span>
            </AnimatedView>
            Discovery Preferences
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full -mx-6 px-6">
              <div className="space-y-6 py-2">
                <div>
                  <Label className="text-base mb-4 block font-semibold">Age Range</Label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Minimum Age</span>
                        <span className="text-sm font-medium">
                          {minAge} {minAge === 0 ? 'year' : 'years'}
                        </span>
                      </div>
                      <Slider
                        value={[minAge]}
                        onValueChange={(value) => setMinAge(value[0] ?? 0)}
                        max={15}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Maximum Age</span>
                        <span className="text-sm font-medium">{maxAge} years</span>
                      </div>
                      <Slider
                        value={[maxAge]}
                        onValueChange={(value) => setMaxAge(value[0] ?? 0)}
                        max={15}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-3 block font-semibold">Size Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => (
                      <Badge
                        key={size}
                        variant={sizes.includes(size) ? 'default' : 'outline'}
                        className="cursor-pointer capitalize transition-all hover:scale-105"
                        onClick={() => toggleSize(size)}
                      >
                        {size.replace('-', ' ')}
                        {sizes.includes(size) && <X size={14} className="ml-1" weight="bold" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-4 block font-semibold">Maximum Distance</Label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Within</span>
                    <span className="text-sm font-medium">{maxDistance} miles</span>
                  </div>
                  <Slider
                    value={[maxDistance]}
                    onValueChange={(value) => setMaxDistance(value[0] ?? 0)}
                    min={5}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-3 block font-semibold">
                    Personality Traits{' '}
                    {personalities.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({personalities.length} selected)
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Find pets with these personality traits
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PERSONALITIES.map((trait) => (
                      <Badge
                        key={trait}
                        variant={personalities.includes(trait) ? 'default' : 'outline'}
                        className="cursor-pointer capitalize transition-all hover:scale-105"
                        onClick={() => togglePersonality(trait)}
                      >
                        {trait}
                        {personalities.includes(trait) && (
                          <X size={14} className="ml-1" weight="bold" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-3 block font-semibold">
                    Interests{' '}
                    {interests.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({interests.length} selected)
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Find pets who enjoy these activities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_INTERESTS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={interests.includes(interest) ? 'default' : 'outline'}
                        className="cursor-pointer capitalize transition-all hover:scale-105"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                        {interests.includes(interest) && (
                          <X size={14} className="ml-1" weight="bold" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-3 block font-semibold">
                    Looking For{' '}
                    {lookingFor.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({lookingFor.length} selected)
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Find pets seeking these connections
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_LOOKING_FOR.map((goal) => (
                      <Badge
                        key={goal}
                        variant={lookingFor.includes(goal) ? 'default' : 'outline'}
                        className="cursor-pointer capitalize transition-all hover:scale-105"
                        onClick={() => toggleLookingFor(goal)}
                      >
                        {goal}
                        {lookingFor.includes(goal) && (
                          <X size={14} className="ml-1" weight="bold" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-4 block font-semibold">
                    Minimum Compatibility Score
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Only show pets with at least this compatibility
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Minimum Score</span>
                    <span className="text-sm font-medium">{minCompatibility}%</span>
                  </div>
                  <Slider
                    value={[minCompatibility]}
                    onValueChange={(value) => setMinCompatibility(value[0] ?? 0)}
                    min={0}
                    max={90}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="media" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full -mx-6 px-6">
              <div className="space-y-6 py-2">
                <div>
                  <Label className="text-base mb-4 font-semibold flex items-center gap-2">
                    <Camera size={18} weight="bold" />
                    Photo Crop Size
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Filter profiles by photo aspect ratio
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'any', label: 'Any Size', icon: '📐' },
                      { value: 'square', label: 'Square (1:1)', icon: '⬜' },
                      { value: 'portrait', label: 'Portrait (3:4)', icon: '📱' },
                      { value: 'landscape', label: 'Landscape (4:3)', icon: '🖼️' },
                    ].map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          const cropSizeValue = value as
                            | 'any'
                            | 'square'
                            | 'portrait'
                            | 'landscape';
                          if (['any', 'square', 'portrait', 'landscape'].includes(cropSizeValue)) {
                            setCropSize(cropSizeValue);
                          }
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-[1.02] active:scale-[0.98] ${
                          cropSize === value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{icon}</div>
                        <div className="text-sm font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-4 font-semibold flex items-center gap-2">
                    <Sparkle size={18} weight="bold" />
                    Photo Quality
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Prefer high-quality or verified photos
                  </p>
                  <div className="flex flex-col gap-2">
                    {[
                      { value: 'any', label: 'Any Quality', desc: 'Show all profiles' },
                      { value: 'high', label: 'High Quality', desc: 'Clear, well-lit photos only' },
                      {
                        value: 'verified',
                        label: 'Verified Photos',
                        desc: 'Authenticated by moderators',
                      },
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          const photoQualityValue = value as 'any' | 'high' | 'verified';
                          if (['any', 'high', 'verified'].includes(photoQualityValue)) {
                            setPhotoQuality(photoQualityValue);
                          }
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-[1.01] active:scale-[0.99] ${
                          photoQuality === value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm flex items-center gap-2">
                          {photoQuality === value && (
                            <CheckCircle size={16} weight="fill" className="text-primary" />
                          )}
                          {label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-4 font-semibold flex items-center gap-2">
                    <VideoCamera size={18} weight="bold" />
                    Video Content
                  </Label>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div>
                      <div className="font-medium text-sm">Has Video</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Only show profiles with video content
                      </div>
                    </div>
                    <Switch
                      checked={hasVideo === true}
                      onCheckedChange={(checked) => setHasVideo(checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-4 font-semibold flex items-center gap-2">
                    <Camera size={18} weight="bold" />
                    Minimum Photos
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Profiles must have at least this many photos
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Minimum</span>
                    <span className="text-sm font-medium">
                      {minPhotos} photo{minPhotos !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Slider
                    value={[minPhotos]}
                    onValueChange={(value) => setMinPhotos(value[0] ?? 0)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="advanced" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full -mx-6 px-6">
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-base mb-4 font-semibold flex items-center gap-2">
                    <Lightning size={18} weight="bold" />
                    Enhanced Filters
                  </Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Find the most active and responsive matches
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} weight="duotone" className="text-primary" />
                        <div>
                          <div className="font-medium text-sm">Verified Profiles</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            ID or photo verified accounts
                          </div>
                        </div>
                      </div>
                      <Switch checked={verified} onCheckedChange={setVerified} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Clock size={20} weight="duotone" className="text-secondary" />
                        <div>
                          <div className="font-medium text-sm">Active Today</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Online in the last 24 hours
                          </div>
                        </div>
                      </div>
                      <Switch checked={activeToday} onCheckedChange={setActiveToday} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Sparkle size={20} weight="duotone" className="text-accent" />
                        <div>
                          <div className="font-medium text-sm">Has Stories</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Posted stories recently
                          </div>
                        </div>
                      </div>
                      <Switch checked={hasStories} onCheckedChange={setHasStories} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <ChatCircle size={20} weight="duotone" className="text-primary" />
                        <div>
                          <div className="font-medium text-sm">Responds Quickly</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Average response under 1 hour
                          </div>
                        </div>
                      </div>
                      <Switch checked={respondQuickly} onCheckedChange={setRespondQuickly} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Lightning size={20} weight="duotone" className="text-accent" />
                        <div>
                          <div className="font-medium text-sm">Super Likes Only</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Show only profiles that super liked you
                          </div>
                        </div>
                      </div>
                      <Switch checked={superLikesOnly} onCheckedChange={setSuperLikesOnly} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkle size={20} weight="duotone" className="text-accent shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm mb-1">Premium Filters Active</div>
                      <div className="text-xs text-muted-foreground">
                        Advanced filters help you find the most compatible and active matches. Some
                        filters may reduce the number of available profiles.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" className="flex-1" onClick={handleReset}>
            Reset All
          </Button>
          <Button type="button" className="flex-1" onClick={handleSave}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
