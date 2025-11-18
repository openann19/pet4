import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adoptionMarketplaceService } from '@/lib/adoption-marketplace-service';
import type { CreateAdoptionListingData } from '@/lib/adoption-marketplace-types';
import { createLogger } from '@/lib/logger';
import { userService } from '@/lib/user-service';
import { ArrowLeft, ArrowRight, Check, MapPin, Upload, X } from '@phosphor-icons/react';
import { Presence, MotionView } from '@petspark/motion';
import { useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('CreateAdoptionListingWizard');

interface CreateAdoptionListingWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

type WizardStep = 'basic' | 'details' | 'health' | 'requirements' | 'location' | 'review';

const STEPS: { id: WizardStep; label: string; description: string }[] = [
  { id: 'basic', label: 'Basic Info', description: 'Pet details' },
  { id: 'details', label: 'Personality', description: 'Temperament & behavior' },
  { id: 'health', label: 'Health', description: 'Medical records' },
  { id: 'requirements', label: 'Requirements', description: 'Adoption criteria' },
  { id: 'location', label: 'Location', description: 'Where to meet' },
  { id: 'review', label: 'Review', description: 'Confirm & submit' },
];

const TEMPERAMENT_OPTIONS = [
  'Friendly',
  'Playful',
  'Calm',
  'Energetic',
  'Affectionate',
  'Independent',
  'Loyal',
  'Gentle',
  'Curious',
  'Protective',
  'Social',
  'Shy',
];

const REQUIREMENT_OPTIONS = [
  'Fenced yard required',
  'No small children',
  'No other pets',
  'Experience with breed required',
  'Active lifestyle required',
  'Home check required',
  'References required',
  'Indoor only',
  'Regular grooming commitment',
  'Special diet needs',
];

export function CreateAdoptionListingWizard({
  onClose,
  onSuccess,
}: CreateAdoptionListingWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<CreateAdoptionListingData>>({
    petPhotos: [],
    requirements: [],
    temperament: [],
    vetDocuments: [],
    vaccinated: false,
    spayedNeutered: false,
    microchipped: false,
    goodWithKids: true,
    goodWithPets: true,
    energyLevel: 'medium',
    locationCountry: 'USA',
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateField = <K extends keyof CreateAdoptionListingData>(
    field: K,
    value: CreateAdoptionListingData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = <K extends keyof CreateAdoptionListingData>(field: K, value: string) => {
    setFormData((prev) => {
      const current = (prev[field] as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (
        !formData.petName ||
        !formData.petBreed ||
        !formData.petAge ||
        !formData.petGender ||
        !formData.petSize ||
        !formData.petSpecies ||
        !formData.petDescription ||
        !formData.locationCity ||
        !formData.reasonForAdoption
      ) {
        toast.error('Please fill in all required fields');
        return;
      }

      const user = await userService.user();
      if (!user) {
        throw new Error('User context unavailable');
      }

      await adoptionMarketplaceService.createListing({
        ...(formData as CreateAdoptionListingData),
        ownerId: user.id,
        ownerName: user.displayName ?? user.login ?? 'Guest User',
      });

      toast.success('Adoption listing submitted for review!');
      onSuccess();
      onClose();
    } catch (error) {
      logger.error(
        'Failed to create listing',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return (
          formData.petName &&
          formData.petBreed &&
          formData.petAge &&
          formData.petGender &&
          formData.petSize &&
          formData.petSpecies
        );
      case 'details':
        return formData.petDescription && (formData.temperament?.length ?? 0) > 0;
      case 'health':
        return true;
      case 'requirements':
        return formData.reasonForAdoption;
      case 'location':
        return formData.locationCity && formData.locationCountry;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg overflow-auto">
      <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Create Adoption Listing</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {currentStepIndex + 1} of {STEPS.length}:{' '}
              {currentStepIndex >= 0 && currentStepIndex < STEPS.length
                ? (STEPS[currentStepIndex]?.description ?? '')
                : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onClick={onClose}
            aria-label="Close adoption listing wizard"
            className="w-10 h-10 p-0"
          >
            <X size={24} />
          </Button>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap ${currentStep === step.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : index < currentStepIndex
                    ? 'border-green-500/50 bg-green-500/5 text-green-600 dark:text-green-400'
                    : 'border-border bg-card hover:border-primary/50'
                  }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {index < currentStepIndex ? <Check size={14} weight="bold" /> : index + 1}
                </div>
                <span className="text-sm font-medium">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Presence visible={true}>
          <MotionView
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStepIndex >= 0 && currentStepIndex < STEPS.length
                    ? (STEPS[currentStepIndex]?.label ?? '')
                    : ''}
                </CardTitle>
                <CardDescription>
                  {currentStepIndex >= 0 && currentStepIndex < STEPS.length
                    ? (STEPS[currentStepIndex]?.description ?? '')
                    : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentStep === 'basic' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="petName">Pet Name *</Label>
                        <Input
                          id="petName"
                          value={formData.petName ?? ''}
                          onChange={(e) => { updateField('petName', e.target.value); }}
                          placeholder="e.g., Max"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="petSpecies">Species *</Label>
                        <Select
                          value={formData.petSpecies ?? ''}
                          onValueChange={(value) =>
                            updateField(
                              'petSpecies',
                              value as CreateAdoptionListingData['petSpecies']
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">Dog</SelectItem>
                            <SelectItem value="cat">Cat</SelectItem>
                            <SelectItem value="bird">Bird</SelectItem>
                            <SelectItem value="rabbit">Rabbit</SelectItem>
                            <SelectItem value="fish">Fish</SelectItem>
                            <SelectItem value="reptile">Reptile</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="petBreed">Breed *</Label>
                        <Input
                          id="petBreed"
                          value={formData.petBreed ?? ''}
                          onChange={(e) => { updateField('petBreed', e.target.value); }}
                          placeholder="e.g., Golden Retriever"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="petAge">Age (years) *</Label>
                        <Input
                          id="petAge"
                          type="number"
                          min="0"
                          max="30"
                          value={formData.petAge ?? ''}
                          onChange={(e) => { updateField('petAge', parseInt(e.target.value) || 0); }}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="petGender">Gender *</Label>
                        <Select
                          value={formData.petGender ?? ''}
                          onValueChange={(value) =>
                            updateField(
                              'petGender',
                              value as CreateAdoptionListingData['petGender']
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="petSize">Size *</Label>
                        <Select
                          value={formData.petSize ?? ''}
                          onValueChange={(value) =>
                            updateField('petSize', value as CreateAdoptionListingData['petSize'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tiny">Tiny (0-5 lbs)</SelectItem>
                            <SelectItem value="small">Small (6-20 lbs)</SelectItem>
                            <SelectItem value="medium">Medium (21-50 lbs)</SelectItem>
                            <SelectItem value="large">Large (51-100 lbs)</SelectItem>
                            <SelectItem value="extra-large">Extra Large (100+ lbs)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="petColor">Color</Label>
                        <Input
                          id="petColor"
                          value={formData.petColor ?? ''}
                          onChange={(e) => { updateField('petColor', e.target.value); }}
                          placeholder="e.g., Golden"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="petPhotos">Photos</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click or drag photos here</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Up to 6 photos, max 5MB each
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 'details' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="petDescription">Description *</Label>
                      <Textarea
                        id="petDescription"
                        value={formData.petDescription ?? ''}
                        onChange={(e) => { updateField('petDescription', e.target.value); }}
                        placeholder="Tell us about this pet's personality, habits, and what makes them special..."
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.petDescription?.length ?? 0} characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Temperament * (Select all that apply)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {TEMPERAMENT_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleArrayItem('temperament', option)}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${formData.temperament?.includes(option)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                              }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="energyLevel">Energy Level *</Label>
                      <Select
                        value={formData.energyLevel ?? 'medium'}
                        onValueChange={(value) =>
                          updateField(
                            'energyLevel',
                            value as CreateAdoptionListingData['energyLevel']
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select energy level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Prefers calm activities</SelectItem>
                          <SelectItem value="medium">Medium - Balanced activity</SelectItem>
                          <SelectItem value="high">High - Very active</SelectItem>
                          <SelectItem value="very-high">
                            Very High - Needs constant activity
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label>Good With:</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="goodWithKids"
                            {...(formData.goodWithKids !== undefined
                              ? { checked: formData.goodWithKids }
                              : {})}
                            onCheckedChange={(checked) => updateField('goodWithKids', !!checked)}
                          />
                          <Label htmlFor="goodWithKids" className="cursor-pointer">
                            Children
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="goodWithPets"
                            {...(formData.goodWithPets !== undefined
                              ? { checked: formData.goodWithPets }
                              : {})}
                            onCheckedChange={(checked) => updateField('goodWithPets', !!checked)}
                          />
                          <Label htmlFor="goodWithPets" className="cursor-pointer">
                            Other Pets
                          </Label>
                        </div>
                        {formData.petSpecies === 'dog' && (
                          <>
                            <div className="flex items-center space-x-2 ml-6">
                              <Checkbox
                                id="goodWithDogs"
                                {...(formData.goodWithDogs !== undefined
                                  ? { checked: formData.goodWithDogs }
                                  : {})}
                                onCheckedChange={(checked) =>
                                  updateField('goodWithDogs', !!checked)
                                }
                              />
                              <Label htmlFor="goodWithDogs" className="cursor-pointer">
                                Specifically good with dogs
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 ml-6">
                              <Checkbox
                                id="goodWithCats"
                                {...(formData.goodWithCats !== undefined
                                  ? { checked: formData.goodWithCats }
                                  : {})}
                                onCheckedChange={(checked) =>
                                  updateField('goodWithCats', !!checked)
                                }
                              />
                              <Label htmlFor="goodWithCats" className="cursor-pointer">
                                Specifically good with cats
                              </Label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 'health' && (
                  <>
                    <div className="space-y-4">
                      <Label>Health Status</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="vaccinated"
                            {...(formData.vaccinated !== undefined
                              ? { checked: formData.vaccinated }
                              : {})}
                            onCheckedChange={(checked) => updateField('vaccinated', !!checked)}
                          />
                          <Label htmlFor="vaccinated" className="cursor-pointer">
                            Up-to-date on vaccinations
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="spayedNeutered"
                            {...(formData.spayedNeutered !== undefined
                              ? { checked: formData.spayedNeutered }
                              : {})}
                            onCheckedChange={(checked) => updateField('spayedNeutered', !!checked)}
                          />
                          <Label htmlFor="spayedNeutered" className="cursor-pointer">
                            Spayed/Neutered
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="microchipped"
                            {...(formData.microchipped !== undefined
                              ? { checked: formData.microchipped }
                              : {})}
                            onCheckedChange={(checked) => updateField('microchipped', !!checked)}
                          />
                          <Label htmlFor="microchipped" className="cursor-pointer">
                            Microchipped
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialNeeds">Special Needs (if any)</Label>
                      <Textarea
                        id="specialNeeds"
                        value={formData.specialNeeds ?? ''}
                        onChange={(e) => { updateField('specialNeeds', e.target.value); }}
                        placeholder="Any medical conditions, dietary restrictions, or special care requirements..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Veterinary Documents</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Upload vaccination records, medical documents
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, JPG, or PNG - Max 10MB
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 'requirements' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reasonForAdoption">Reason for Adoption *</Label>
                      <Textarea
                        id="reasonForAdoption"
                        value={formData.reasonForAdoption ?? ''}
                        onChange={(e) => { updateField('reasonForAdoption', e.target.value); }}
                        placeholder="Why are you putting this pet up for adoption?"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Adoption Requirements (Select all that apply)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {REQUIREMENT_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleArrayItem('requirements', option)}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all text-left ${formData.requirements?.includes(option)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                              }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adoptionFee">Adoption Fee (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="adoptionFee"
                          type="number"
                          min="0"
                          value={formData.fee?.amount ?? ''}
                          onChange={(e) =>
                            updateField('fee', {
                              amount: parseFloat(e.target.value) || 0,
                              currency: formData.fee?.currency ?? 'USD',
                            })
                          }
                          placeholder="0"
                          className="flex-1"
                        />
                        <Select
                          value={formData.fee?.currency ?? 'USD'}
                          onValueChange={(value) =>
                            updateField('fee', {
                              amount: formData.fee?.amount ?? 0,
                              currency: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optional adoption fee to cover medical costs. Leave at 0 for free adoption.
                      </p>
                    </div>
                  </>
                )}

                {currentStep === 'location' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="locationCity">City *</Label>
                        <Input
                          id="locationCity"
                          value={formData.locationCity ?? ''}
                          onChange={(e) => { updateField('locationCity', e.target.value); }}
                          placeholder="e.g., San Francisco"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locationCountry">Country *</Label>
                        <Input
                          id="locationCountry"
                          value={formData.locationCountry ?? ''}
                          onChange={(e) => { updateField('locationCountry', e.target.value); }}
                          placeholder="e.g., USA"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Precise Location (Optional)</Label>
                      <div className="border-2 border-border rounded-lg p-6 bg-muted/30">
                        <div className="flex items-center gap-3 mb-3">
                          <MapPin size={24} className="text-primary" />
                          <div>
                            <p className="text-sm font-medium">Pin Your Location</p>
                            <p className="text-xs text-muted-foreground">
                              Your exact address won't be shared publicly
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
                          <MapPin size={16} className="mr-2" />
                          Set Location on Map
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only city will be shown publicly. Exact location shared after application
                        approval.
                      </p>
                    </div>
                  </>
                )}

                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                      <h3 className="font-semibold text-lg">Review Your Listing</h3>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Pet Name</p>
                          <p className="font-medium">{formData.petName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Species</p>
                          <p className="font-medium capitalize">{formData.petSpecies}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Breed</p>
                          <p className="font-medium">{formData.petBreed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Age</p>
                          <p className="font-medium">{formData.petAge} years</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Size</p>
                          <p className="font-medium capitalize">{formData.petSize}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gender</p>
                          <p className="font-medium capitalize">{formData.petGender}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Temperament</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.temperament?.map((trait) => (
                            <Badge key={trait} variant="secondary">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Health Status</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.vaccinated && <Badge variant="outline">Vaccinated</Badge>}
                          {formData.spayedNeutered && (
                            <Badge variant="outline">Spayed/Neutered</Badge>
                          )}
                          {formData.microchipped && <Badge variant="outline">Microchipped</Badge>}
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Location</p>
                        <p className="font-medium">
                          {formData.locationCity}, {formData.locationCountry}
                        </p>
                      </div>

                      {formData.fee && formData.fee.amount > 0 && (
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Adoption Fee</p>
                          <p className="font-medium">
                            {formData.fee.currency} {formData.fee.amount}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2">What happens next?</h4>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check size={16} className="text-primary mt-0.5 shrink-0" />
                          <span>
                            Your listing will be reviewed by our team (usually within 24 hours)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={16} className="text-primary mt-0.5 shrink-0" />
                          <span>Once approved, it will be visible to potential adopters</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={16} className="text-primary mt-0.5 shrink-0" />
                          <span>You'll receive applications and can choose the best match</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionView>
        </Presence>

        <div className="flex items-center justify-between mt-6 sticky bottom-0 bg-background pt-4 pb-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSubmitting}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {currentStepIndex < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed() || isSubmitting}>
                Next
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  void handleSubmit().catch((error) => {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger.error('Failed to submit adoption listing from button', err);
                  });
                }}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
