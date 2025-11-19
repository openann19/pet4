import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Sparkle, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateSamplePets } from '@/lib/seedData';
import type { Pet } from '@/lib/types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { useSharedValue, withRepeat, withTiming, motion, type AnimatedStyle, useAnimatedStyle, MotionView } from '@petspark/motion';

interface GenerateProfilesButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export default function GenerateProfilesButton({
  variant = 'default',
  size = 'default',
  showLabel = true,
}: GenerateProfilesButtonProps) {
  const [, setAllPets] = useStorage<Pet[]>('all-pets', []);
  const [isGenerating, setIsGenerating] = useState(false);

  const buttonHover = useHoverTap({ hoverScale: 1.02, tapScale: 0.98 });
  const shimmerX = useSharedValue<number>(-100);
  const iconRotate = useSharedValue<number>(0);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  useEffect(() => {
    if (isGenerating) {
      shimmerX.value = withRepeat(withTiming(200, { duration: 1500 }), -1, false);
      iconRotate.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false);
    } else {
      shimmerX.value = -100;
      iconRotate.value = 0;
    }
  }, [isGenerating, shimmerX, iconRotate]);

  const handleGenerateProfiles = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    haptics.trigger('selection');

    try {
      const newPets = await generateSamplePets(15);
      void setAllPets((current) => {
        const currentPets = current ?? [];
        return [...currentPets, ...newPets];
      });

      haptics.trigger('success');
      toast.success('Profiles Generated!', {
        description: `${newPets.length} new pet profiles added to discovery`,
      });
    } catch (_error) {
      const logger = createLogger('GenerateProfilesButton');
      logger.error(
        'Failed to generate profiles',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      haptics.trigger('error');
      toast.error('Error', {
        description: 'Failed to generate new profiles. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={showLabel ? 'w-full' : ''}>
      <MotionView
        style={buttonHover.animatedStyle}
        onMouseEnter={buttonHover.handleMouseEnter}
        onMouseLeave={buttonHover.handleMouseLeave}
      >
        <Button
          onClick={() => {
            void handleGenerateProfiles();
          }}
          disabled={isGenerating}
          variant={variant}
          size={size}
          className={
            showLabel
              ? 'w-full h-12 bg-linear-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group'
              : 'relative overflow-hidden'
          }
        >
          {showLabel && (
            <MotionView
              style={shimmerStyle}
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
            />
          )}
          <MotionView style={iconStyle} className={showLabel ? 'mr-2' : ''}>
            {isGenerating ? <Sparkle size={20} weight="fill" /> : <Plus size={20} weight="bold" />}
          </MotionView>
          {showLabel && (
            <span className="relative z-10 font-semibold">
              {isGenerating ? 'Generating Profiles...' : 'Generate More Profiles'}
            </span>
          )}
        </Button>
      </MotionView>
    </div>
  );
}
