import { MotionView } from "@petspark/motion";
import { useState } from 'react';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MapPin,
  CheckCircle,
  Heart,
  CaretLeft,
  CaretRight,
  X,
  PaperPlaneRight,
} from '@phosphor-icons/react';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { adoptionMarketplaceService } from '@/lib/adoption-marketplace-service';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import { FocusRing } from '@/core/tokens';

const logger = createLogger('AdoptionListingDetailDialog');

interface AdoptionListingDetailDialogProps {
  listing: AdoptionListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSubmitted: () => void;
}

export function AdoptionListingDetailDialog({
  listing,
  open,
  onOpenChange,
  onApplicationSubmitted,
}: AdoptionListingDetailDialogProps): JSX.Element | null {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState({
    message: '',
    homeType: 'house' as 'house' | 'apartment' | 'condo' | 'farm' | 'other',
    hasYard: false,
    yardFenced: false,
    hasChildren: false,
    childrenAges: '',
    hasOtherPets: false,
    otherPetsDetails: '',
    previousPetExperience: '',
    employmentStatus: 'employed' as
      | 'employed'
      | 'self-employed'
      | 'retired'
      | 'student'
      | 'unemployed'
      | 'other',
    hoursAlonePerDay: 0,
    homeCheckConsent: false,
    veterinarianReference: '',
    personalReferences: '',
  });

  const photoPresence = useAnimatePresence({
    isVisible: true,
    enterTransition: 'fade',
    exitTransition: 'fade',
  });

  const prevButtonHover = useHoverTap({ hoverScale: 1.1, tapScale: 0.95 });
  const nextButtonHover = useHoverTap({ hoverScale: 1.1, tapScale: 0.95 });
  const applicationFormPresence = useAnimatePresence({
    isVisible: showApplicationForm,
    enterTransition: 'slideUp',
    exitTransition: 'fade',
  });

  if (!listing) return null;

  const photos =
    listing.petPhotos && listing.petPhotos.length > 0
      ? listing.petPhotos
      : ['/placeholder-pet.jpg'];

  const nextPhoto = (): void => {
    haptics.trigger('selection');
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (): void => {
    haptics.trigger('selection');
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleApply = async (): Promise<void> => {
    if (!applicationData.message || !applicationData.homeCheckConsent) {
      toast.error('Please fill in all required fields');
      haptics.trigger('error');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.trigger('light');

      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();

      if (!user) {
        toast.error('Authentication required');
        haptics.trigger('error');
        setIsSubmitting(false);
        return;
      }

      await adoptionMarketplaceService.createApplication({
        listingId: listing.id,
        applicantId: String(user.id),
        applicantName: user.login ?? 'Anonymous',
        applicantEmail: user.email ?? '',
        message: applicationData.message,
        homeType: applicationData.homeType,
        hasYard: applicationData.hasYard,
        yardFenced: applicationData.yardFenced,
        hasChildren: applicationData.hasChildren,
        childrenAges: applicationData.childrenAges,
        hasOtherPets: applicationData.hasOtherPets,
        otherPetsDetails: applicationData.otherPetsDetails,
        previousPetExperience: applicationData.previousPetExperience,
        employmentStatus: applicationData.employmentStatus,
        hoursAlonePerDay: applicationData.hoursAlonePerDay,
        homeCheckConsent: applicationData.homeCheckConsent,
        veterinarianReference: applicationData.veterinarianReference,
        personalReferences: applicationData.personalReferences
          ? applicationData.personalReferences.split(',').map((r) => r.trim())
          : [],
      });

      haptics.trigger('success');
      toast.success('Application submitted successfully!', {
        description: 'The owner will review your application and contact you.',
      });

      setShowApplicationForm(false);
      setApplicationData({
        message: '',
        homeType: 'house',
        hasYard: false,
        yardFenced: false,
        hasChildren: false,
        childrenAges: '',
        hasOtherPets: false,
        otherPetsDetails: '',
        previousPetExperience: '',
        employmentStatus: 'employed',
        hoursAlonePerDay: 0,
        homeCheckConsent: false,
        veterinarianReference: '',
        personalReferences: '',
      });

      onApplicationSubmitted();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : undefined;
      logger.error(
        'Failed to submit application',
        error instanceof Error ? error : new Error(String(error))
      );
      haptics.trigger('error');
      toast.error(errorMessage ?? 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative h-80 bg-muted">
          {photoPresence.shouldRender && (
            <MotionView key={currentPhotoIndex} style={useAnimatedStyleValue(photoPresence.animatedStyle)}>
              <img
                src={photos[currentPhotoIndex]}
                alt={`${listing.petName} - Photo ${currentPhotoIndex + 1}`}
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
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg z-10 ${FocusRing.standard}`}
                  aria-label="Previous photo"
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
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg z-10 ${FocusRing.standard}`}
                  aria-label="Next photo"
                >
                  <CaretRight size={20} weight="bold" />
                </button>
              </MotionView>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${FocusRing.standard} ${index === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
                      }`}
                    aria-label={`Go to photo ${index + 1}`}
                    aria-current={index === currentPhotoIndex ? 'true' : undefined}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-4 right-4 z-10">
            {listing.status === 'active' && (
              <Badge className="bg-green-500/90 text-white backdrop-blur-sm">{'Available'}</Badge>
            )}
            {listing.status === 'pending_review' && (
              <Badge className="bg-yellow-500/90 text-white backdrop-blur-sm">
                {'Pending Review'}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <DialogHeader>
              <DialogTitle className="text-2xl">{listing.petName}</DialogTitle>
              <DialogDescription>
                Adoption listing for {listing.petName} located in {listing.location.city}, {listing.location.country}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <MapPin size={16} weight="fill" />
              <span>
                {listing.location.city}, {listing.location.country}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{'Breed'}</p>
              <p className="font-semibold">{listing.petBreed}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{'Age'}</p>
              <p className="font-semibold">
                {listing.petAge} {listing.petAge === 1 ? 'year' : 'years'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{'Gender'}</p>
              <p className="font-semibold capitalize">{listing.petGender}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{'Size'}</p>
              <p className="font-semibold capitalize">{listing.petSize}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">{'About'}</h3>
            <p className="text-muted-foreground">{listing.petDescription}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {listing.vaccinated && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle size={14} weight="fill" />
                {'Vaccinated'}
              </Badge>
            )}
            {listing.spayedNeutered && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle size={14} weight="fill" />
                {'Spayed/Neutered'}
              </Badge>
            )}
            {listing.microchipped && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle size={14} weight="fill" />
                {'Microchipped'}
              </Badge>
            )}
            {listing.goodWithKids && <Badge variant="secondary">{'Good with kids'}</Badge>}
            {listing.goodWithPets && <Badge variant="secondary">{'Good with pets'}</Badge>}
          </div>

          {listing.requirements && listing.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{'Requirements'}</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {listing.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {listing.fee && listing.fee.amount > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">{'Adoption Fee'}</p>
              <p className="text-xl font-bold">
                {listing.fee.currency} {listing.fee.amount.toLocaleString()}
              </p>
            </div>
          )}

          {listing.status === 'active' && (
            <div className="flex gap-2">
              <Button
                onClick={() => { setShowApplicationForm(true); }}
                className="flex-1 gap-2"
                size="lg"
              >
                <Heart size={20} weight="fill" />
                {'Apply to Adopt'}
              </Button>
            </div>
          )}

          {applicationFormPresence.shouldRender && showApplicationForm && (
            <MotionView
              style={useAnimatedStyleValue(applicationFormPresence.animatedStyle)}
              className="space-y-4 p-4 border rounded-lg bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{'Apply to Adopt'}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApplicationForm(false)}
                  className="w-10 h-10 p-0"
                  aria-label="Close application form"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="application-message">{'Message'}</Label>
                  <Textarea
                    id="application-message"
                    placeholder={'Tell the owner why you want to adopt...'}
                    value={applicationData.message}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setApplicationData({ ...applicationData, message: e.target.value })
                    }
                    rows={4}
                    aria-label="Application message"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeCheckConsent"
                    checked={applicationData.homeCheckConsent}
                    onCheckedChange={(checked) =>
                      { setApplicationData({ ...applicationData, homeCheckConsent: checked === true }); }
                    }
                  />
                  <Label htmlFor="homeCheckConsent" className="text-sm">
                    {'I consent to a home visit'}
                  </Label>
                </div>

                <Button
                  onClick={() => {
                    void handleApply();
                  }}
                  disabled={
                    isSubmitting || !applicationData.message || !applicationData.homeCheckConsent
                  }
                  className="w-full gap-2"
                >
                  <PaperPlaneRight size={20} weight="fill" />
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </MotionView>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
