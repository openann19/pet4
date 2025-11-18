import { useState, useEffect, useRef } from 'react';
import { Check, Sparkle, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PET_PROFILE_TEMPLATES,
  type PetType,
  type PetProfileTemplate,
} from '@/lib/pet-profile-templates';
import { cn } from '@/lib/utils';
import {
  use
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  MotionView,
  type MotionValue,
} from '@petspark/motion';
import type  from '@petspark/motion';

interface PetProfileTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate?: (template: PetProfileTemplate) => void;
}

const PET_TYPE_LABELS: Record<PetType, { label: string; emoji: string }> = {
  dog: { label: 'Dogs', emoji: '🐕' },
  cat: { label: 'Cats', emoji: '🐈' },
  bird: { label: 'Birds', emoji: '🦜' },
  rabbit: { label: 'Rabbits', emoji: '🐰' },
  fish: { label: 'Fish', emoji: '🐠' },
  other: { label: 'Other', emoji: '🐾' },
};

const TOTAL_STEPS = 6;
const CURRENT_STEP = 1;

export default function PetProfileTemplatesDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: PetProfileTemplatesDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PetProfileTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<PetType>('dog');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  })) as AnimatedStyle;

  // Sparkle rotation
  const sparkleRotate = useSharedValue(0);
  const sparkleScale = useSharedValue(1);
  const sparkleStyle = useAnimatedStyle(() => {
    const rotate = sparkleRotate.value;
    const scale = sparkleScale.value;
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ rotate: `${rotate}deg` });
    transforms.push({ scale });
    return { transform: transforms };
  }) as AnimatedStyle;

  useEffect(() => {
    progressWidth.value = withTiming((CURRENT_STEP / TOTAL_STEPS) * 100, { duration: 600 });

    sparkleRotate.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 300 }),
        withTiming(-10, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ),
      -1,
      false
    );
    sparkleScale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 300 }), withTiming(1, { duration: 300 })),
      -1,
      false
    );
  }, [progressWidth, sparkleRotate, sparkleScale]);

  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }

      if (e.key === 'Enter' && selectedTemplate) {
        e.preventDefault();
        handleConfirmSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedTemplate, onOpenChange]);

  const handleSelectTemplate = (template: PetProfileTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
    }
  };

  const renderTemplateCard = (template: PetProfileTemplate) => {
    const isSelected = selectedTemplate?.id === template.id;

    return (
      <button
        key={template.id}
        type="button"
        onClick={() => handleSelectTemplate(template)}
        className={cn(
          'relative p-5 rounded-xl text-left transition-all duration-300 group',
          'min-h-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'hover:scale-[1.015] active:scale-[0.99]',
          isSelected
            ? 'bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10 shadow-xl border-2 border-transparent'
            : 'bg-card border-2 border-border/60 hover:border-primary/40 hover:shadow-lg hover:bg-card/95'
        )}
        aria-pressed={isSelected}
        aria-label={`Select ${String(template.name ?? '')} template`}
        style={{ minHeight: '44px' }}
      >
        {isSelected && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-accent to-primary opacity-40 blur-sm animate-in fade-in zoom-in duration-300" />
        )}

        <div className="relative z-10 flex items-start gap-4">
          <span className="text-4xl shrink-0 select-none" role="img" aria-label={template.type}>
            {template.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="font-semibold text-lg text-foreground leading-tight">
                {template.name}
              </h4>
              {isSelected && (
                <div className="bg-primary text-primary-foreground rounded-full p-1.5 shrink-0 shadow-lg animate-in zoom-in duration-300">
                  <Check size={16} weight="bold" />
                </div>
              )}
            </div>
            <p className="text-sm text-foreground/70 mb-3 line-clamp-2 leading-relaxed">
              {template.description}
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-foreground/60 font-medium text-xs">Personality:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {template.defaults.personality.slice(0, 3).map((trait) => (
                    <Badge
                      key={trait}
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-muted/60 text-foreground/80 hover:bg-muted/80 transition-colors border border-border/40"
                      style={{ minHeight: '24px' }}
                    >
                      {trait}
                    </Badge>
                  ))}
                  {template.defaults.personality.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-muted/60 text-foreground/80"
                      style={{ minHeight: '24px' }}
                    >
                      +{template.defaults.personality.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-foreground/60 font-medium text-xs">Interests:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {template.defaults.interests.slice(0, 3).map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="text-xs px-2 py-0.5 border-border/50 text-foreground/70 bg-background/40 hover:bg-background/60 transition-colors"
                      style={{ minHeight: '24px' }}
                    >
                      {interest}
                    </Badge>
                  ))}
                  {template.defaults.interests.length > 3 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 border-border/50 text-foreground/70"
                      style={{ minHeight: '24px' }}
                    >
                      +{template.defaults.interests.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isSelected && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-sm animate-in zoom-in duration-300">
            <CheckCircle size={14} weight="fill" className="text-primary" />
            <span className="text-xs font-medium text-primary">Selected</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-md" />
        <DialogContent
          className="max-w-5xl max-h-[90vh] p-0 gap-0 border-border/50 shadow-2xl"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            closeButtonRef.current?.focus();
          }}
        >
          <DialogHeader className="px-8 pt-8 pb-5 border-b border-border/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MotionView style={sparkleStyle as React.CSSProperties}>
                  <Sparkle size={28} weight="fill" className="text-primary" />
                </MotionView>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Pet Profile Templates
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground/70">
                        Step {CURRENT_STEP} of {TOTAL_STEPS}
                      </span>
                      <span className="text-xs text-muted-foreground">• Choose a template</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-2 w-32 bg-muted/50 rounded-full overflow-hidden">
                <MotionView
                  style={progressStyle as React.CSSProperties}
                  className="h-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>
            <DialogDescription className="text-sm text-foreground/60 mt-3">
              Browse pre-made templates to quickly set up your pet's profile with common traits and
              characteristics
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as PetType)}
            className="flex-1 flex flex-col"
          >
            <div className="px-8 pt-5 pb-3">
              <TabsList className="grid grid-cols-6 w-full h-12 bg-muted/40">
                {(Object.keys(PET_TYPE_LABELS) as PetType[]).map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground transition-all"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="mr-1.5 text-base">{PET_TYPE_LABELS[type].emoji}</span>
                    <span className="hidden sm:inline">{PET_TYPE_LABELS[type].label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-8">
              <div className="pb-6">
                {(Object.keys(PET_TYPE_LABELS) as PetType[]).map((type) => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {PET_PROFILE_TEMPLATES.filter((template) => template.type === type).map(
                        (template) => renderTemplateCard(template)
                      )}
                    </div>
                    {PET_PROFILE_TEMPLATES.filter((t) => t.type === type).length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <p className="text-base">No templates available for this pet type yet.</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </div>
            </ScrollArea>
          </Tabs>

          <div className="sticky bottom-0 px-8 py-5 border-t border-border/40 bg-card/95 backdrop-blur-sm flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {selectedTemplate ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} weight="fill" className="text-primary" />
                  <span className="font-medium text-foreground">
                    {selectedTemplate.name} selected
                  </span>
                </div>
              ) : (
                <span>Select a template to continue</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                ref={closeButtonRef}
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-w-25"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </Button>
              <Button
                ref={confirmButtonRef}
                onClick={() => void handleConfirmSelection()}
                disabled={!selectedTemplate}
                className="min-w-35 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                <Check size={18} weight="bold" className="mr-2" />
                Use Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
