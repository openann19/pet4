import { MotionView } from "@petspark/motion";
import { useState } from 'react';
import { useAnimatePresence } from '@/effects/reanimated';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  CheckCircle,
  XCircle,
  Heart,
  Phone,
  Envelope,
  Calendar,
  PawPrint,
  Siren,
  House,
  UsersThree,
  Lightning,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import type { AdoptionProfile } from '@/lib/adoption-types';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { AdoptionApplicationDialog } from './AdoptionApplicationDialog';

interface AdoptionDetailDialogProps {
  profile: AdoptionProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdoptionDetailDialog({
  profile,
  open,
  onOpenChange,
}: AdoptionDetailDialogProps): JSX.Element | null {
  const { t } = useApp();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  const photoPresence = useAnimatePresence({
    isVisible: true,
    enterTransition: 'fade',
    exitTransition: 'fade',
  });

  const prevButtonHover = useHoverTap({ hoverScale: 1.1, tapScale: 0.95 });
  const nextButtonHover = useHoverTap({ hoverScale: 1.1, tapScale: 0.95 });

  if (!profile) return null;

  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [profile.petPhoto];

  const nextPhoto = (): void => {
    haptics.trigger('selection');
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (): void => {
    haptics.trigger('selection');
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleApply = (): void => {
    haptics.trigger('success');
    setShowApplicationDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="relative h-80 bg-muted">
            {photoPresence.shouldRender && (
              <MotionView key={currentPhotoIndex} style={photoPresence.animatedStyle}>
                <img
                  src={photos[currentPhotoIndex]}
                  alt={`${profile.petName} - Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </MotionView>
            )}

            {photos.length > 1 && (
              <>
                <MotionView
                  style={prevButtonHover.animatedStyle}
                  onMouseEnter={prevButtonHover.handleMouseEnter}
                  onMouseLeave={prevButtonHover.handleMouseLeave}
                  onClick={() => {
                    prevButtonHover.handlePress();
                    prevPhoto();
                  }}
                >
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                  >
                    <CaretLeft size={20} weight="bold" />
                  </button>
                </MotionView>
                <MotionView
                  style={nextButtonHover.animatedStyle}
                  onMouseEnter={nextButtonHover.handleMouseEnter}
                  onMouseLeave={nextButtonHover.handleMouseLeave}
                  onClick={() => {
                    nextButtonHover.handlePress();
                    nextPhoto();
                  }}
                >
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                  >
                    <CaretRight size={20} weight="bold" />
                  </button>
                </MotionView>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        haptics.trigger('selection');
                        setCurrentPhotoIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${index === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div className="p-6 space-y-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-3xl font-bold mb-2">{profile.petName}</DialogTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={16} weight="fill" />
                    <span>{profile.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">${profile.adoptionFee}</div>
                  <div className="text-sm text-muted-foreground">
                    {t.adoption?.adoptionFee || 'Adoption Fee'}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Calendar size={24} className="mx-auto mb-1 text-primary" />
                <div className="text-sm font-semibold">
                  {profile.age}{' '}
                  {profile.age === 1
                    ? t.common?.year_singular || 'year'
                    : t.common?.years || 'years'}
                </div>
                <div className="text-xs text-muted-foreground">{t.adoption?.age || 'Age'}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <PawPrint size={24} className="mx-auto mb-1 text-accent" />
                <div className="text-sm font-semibold capitalize">{profile.size}</div>
                <div className="text-xs text-muted-foreground">{t.adoption?.size || 'Size'}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Lightning size={24} className="mx-auto mb-1 text-secondary" />
                <div className="text-sm font-semibold capitalize">{profile.energyLevel}</div>
                <div className="text-xs text-muted-foreground">
                  {t.adoption?.energy || 'Energy'}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Heart size={24} className="mx-auto mb-1 text-destructive" weight="fill" />
                <div className="text-sm font-semibold capitalize">{profile.gender}</div>
                <div className="text-xs text-muted-foreground">
                  {t.adoption?.gender || 'Gender'}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t.adoption?.about || 'About'} {profile.petName}
              </h3>
              <p className="text-foreground leading-relaxed">{profile.description}</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">{t.adoption?.details || 'Details'}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${profile.vaccinated ? 'bg-green-500/10' : 'bg-gray-500/10'
                      }`}
                  >
                    {profile.vaccinated ? (
                      <CheckCircle
                        size={20}
                        className="text-green-600 dark:text-green-400"
                        weight="fill"
                      />
                    ) : (
                      <XCircle size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{t.adoption?.vaccinated || 'Vaccinated'}</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.vaccinated ? t.adoption?.yes || 'Yes' : t.adoption?.no || 'No'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${profile.spayedNeutered ? 'bg-green-500/10' : 'bg-gray-500/10'
                      }`}
                  >
                    {profile.spayedNeutered ? (
                      <CheckCircle
                        size={20}
                        className="text-green-600 dark:text-green-400"
                        weight="fill"
                      />
                    ) : (
                      <XCircle size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {t.adoption?.spayedNeutered || 'Spayed/Neutered'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {profile.spayedNeutered ? t.adoption?.yes || 'Yes' : t.adoption?.no || 'No'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${profile.goodWithKids ? 'bg-green-500/10' : 'bg-gray-500/10'
                      }`}
                  >
                    <UsersThree
                      size={20}
                      className={
                        profile.goodWithKids
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500'
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {t.adoption?.goodWithKids || 'Good with Kids'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {profile.goodWithKids ? t.adoption?.yes || 'Yes' : t.adoption?.no || 'No'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${profile.goodWithPets ? 'bg-green-500/10' : 'bg-gray-500/10'
                      }`}
                  >
                    <PawPrint
                      size={20}
                      className={
                        profile.goodWithPets
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500'
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {t.adoption?.goodWithPets || 'Good with Pets'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {profile.goodWithPets ? t.adoption?.yes || 'Yes' : t.adoption?.no || 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {profile.personality &&
              Array.isArray(profile.personality) &&
              profile.personality.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {t.adoption?.personality || 'Personality'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.personality.map((trait, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

            {profile.specialNeeds && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Siren size={20} className="text-accent" />
                    {t.adoption?.specialNeeds || 'Special Needs'}
                  </h3>
                  <p className="text-foreground">{profile.specialNeeds}</p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <House size={20} className="text-primary" />
                {t.adoption?.shelter || 'Shelter Information'}
              </h3>
              <div className="space-y-2">
                <div className="font-medium text-lg">{profile.shelterName}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  {profile.contactEmail && (
                    <a
                      href={`mailto:${String(profile.contactEmail ?? '')}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Envelope size={16} />
                      {profile.contactEmail}
                    </a>
                  )}
                  {profile.contactPhone && (
                    <a
                      href={`tel:${String(profile.contactPhone ?? '')}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Phone size={16} />
                      {profile.contactPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => void handleApply()}
                disabled={profile.status !== 'available'}
              >
                <Heart size={20} weight="fill" className="mr-2" />
                {profile.status === 'available'
                  ? t.adoption?.applyToAdopt || 'Apply to Adopt'
                  : t.adoption?.notAvailable || 'Not Available'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AdoptionApplicationDialog
        profile={profile}
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
        onSubmitSuccess={() => {
          setShowApplicationDialog(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
