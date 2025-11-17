'use client';

import { MotionView } from "@petspark/motion";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useRotation } from '@/effects/reanimated/use-rotation';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { adoptionService } from '@/lib/adoption-service';
import type { AdoptionProfile, HouseholdType } from '@/lib/adoption-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { userService } from '@/lib/user-service';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('AdoptionApplicationDialog');

function isValidHouseholdType(value: string): value is HouseholdType {
  return value === 'house' || value === 'apartment' || value === 'condo' || value === 'other';
}

function isBoolean(value: boolean | 'indeterminate'): value is boolean {
  return typeof value === 'boolean';
}

function LoadingSpinner() {
  const rotationAnimation = useRotation({
    enabled: true,
    duration: 1000,
    repeat: true,
  });

  const style = useAnimatedStyleValue(rotationAnimation.rotationStyle);

  return (
    <MotionView style={style} className="inline-block">
      <PaperPlaneRight size={18} />
    </MotionView>
  );
}

interface AdoptionApplicationDialogProps {
  profile: AdoptionProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess: () => void;
}

export function AdoptionApplicationDialog({
  profile,
  open,
  onOpenChange,
  onSubmitSuccess,
}: AdoptionApplicationDialogProps) {
  const { t } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    householdType: HouseholdType;
    hasYard: boolean;
    hasOtherPets: boolean;
    otherPetsDetails: string;
    hasChildren: boolean;
    childrenAges: string;
    experience: string;
    reason: string;
  }>({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    householdType: 'house',
    hasYard: false,
    hasOtherPets: false,
    otherPetsDetails: '',
    hasChildren: false,
    childrenAges: '',
    experience: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applicantName || !formData.applicantEmail || !formData.reason) {
      toast.error(t.adoption?.fillRequired ?? 'Please fill in all required fields');
      haptics.trigger('error');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.trigger('light');

      const user = await userService.user();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      await adoptionService.submitApplication({
        adoptionProfileId: profile._id,
        applicantId: user.id,
        ...formData,
      });

      haptics.trigger('success');
      toast.success(t.adoption?.applicationSubmitted ?? 'Application Submitted!', {
        description:
          t.adoption?.applicationSubmittedDesc ??
          'The shelter will review your application and contact you soon.',
      });

      setFormData({
        applicantName: '',
        applicantEmail: '',
        applicantPhone: '',
        householdType: 'house',
        hasYard: false,
        hasOtherPets: false,
        otherPetsDetails: '',
        hasChildren: false,
        childrenAges: '',
        experience: '',
        reason: '',
      });

      onSubmitSuccess();
    } catch (error) {
      logger.error(
        'Failed to submit application',
        error instanceof Error ? error : new Error(String(error))
      );
      haptics.trigger('error');
      toast.error(
        t.adoption?.applicationFailed ?? 'Failed to submit application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t.adoption?.applyToAdopt ?? 'Apply to Adopt'} {profile.petName}
          </DialogTitle>
          <DialogDescription>
            {t.adoption?.applicationDesc ??
              'Fill out this application to express your interest in adopting. The shelter will review and contact you.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-6 mt-4"
        >
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {t.adoption?.contactInfo ?? 'Contact Information'}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="name">
                {t.adoption?.fullName ?? 'Full Name'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.applicantName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, applicantName: e.target.value }); }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {t.adoption?.email ?? 'Email'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.applicantEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, applicantEmail: e.target.value }); }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.adoption?.phone ?? 'Phone Number'}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.applicantPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, applicantPhone: e.target.value }); }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {t.adoption?.householdInfo ?? 'Household Information'}
            </h3>

            <div className="space-y-2">
              <Label>{t.adoption?.householdType ?? 'Household Type'}</Label>
              <RadioGroup
                value={formData.householdType}
                onValueChange={(value) => {
                  if (isValidHouseholdType(value)) {
                    setFormData({
                      ...formData,
                      householdType: value,
                    });
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="house" id="house" />
                  <Label htmlFor="house" className="font-normal cursor-pointer">
                    {t.adoption?.house ?? 'House'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="apartment" id="apartment" />
                  <Label htmlFor="apartment" className="font-normal cursor-pointer">
                    {t.adoption?.apartment ?? 'Apartment'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="condo" id="condo" />
                  <Label htmlFor="condo" className="font-normal cursor-pointer">
                    {t.adoption?.condo ?? 'Condo'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">
                    {t.adoption?.other ?? 'Other'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="yard"
                checked={formData.hasYard}
                onCheckedChange={(checked) => {
                  if (isBoolean(checked)) {
                    setFormData({ ...formData, hasYard: checked });
                  }
                }}
              />
              <Label htmlFor="yard" className="font-normal cursor-pointer">
                {t.adoption?.hasYard ?? 'I have a yard'}
              </Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="other-pets"
                  checked={formData.hasOtherPets}
                  onCheckedChange={(checked) => {
                    if (isBoolean(checked)) {
                      setFormData({ ...formData, hasOtherPets: checked });
                    }
                  }}
                />
                <Label htmlFor="other-pets" className="font-normal cursor-pointer">
                  {t.adoption?.hasOtherPets ?? 'I have other pets'}
                </Label>
              </div>
              {formData.hasOtherPets && (
                <Input
                  placeholder={t.adoption?.describeOtherPets ?? 'Describe your other pets...'}
                  value={formData.otherPetsDetails}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, otherPetsDetails: e.target.value }); }}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="children"
                  checked={formData.hasChildren}
                  onCheckedChange={(checked) => {
                    if (isBoolean(checked)) {
                      setFormData({ ...formData, hasChildren: checked });
                    }
                  }}
                />
                <Label htmlFor="children" className="font-normal cursor-pointer">
                  {t.adoption?.hasChildren ?? 'I have children'}
                </Label>
              </div>
              {formData.hasChildren && (
                <Input
                  placeholder={t.adoption?.childrenAges ?? 'Ages of children...'}
                  value={formData.childrenAges}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, childrenAges: e.target.value }); }}
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {t.adoption?.additionalInfo ?? 'Additional Information'}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="experience">
                {t.adoption?.petExperience ?? 'Pet ownership experience'}
              </Label>
              <Textarea
                id="experience"
                placeholder={
                  t.adoption?.experiencePlaceholder ?? 'Tell us about your experience with pets...'
                }
                value={formData.experience}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, experience: e.target.value }); }}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                {t.adoption?.whyAdopt ?? 'Why do you want to adopt this pet?'}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder={t.adoption?.reasonPlaceholder ?? 'Tell us why you want to adopt...'}
                value={formData.reason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, reason: e.target.value }); }}
                rows={4}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); }}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t.common?.cancel ?? 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  {t.common?.submitting ?? 'Submitting...'}
                </>
              ) : (
                <>
                  <PaperPlaneRight size={18} weight="fill" />
                  {t.adoption?.submitApplication ?? 'Submit Application'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
