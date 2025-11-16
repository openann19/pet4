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
import { useAnimatedStyle, useSharedValue, withRepeat, withTiming, MotionView } from '@petspark/motion';

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
  const shimmerX = useSharedValue(-100);
  const iconRotate = useSharedValue(0);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  })) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  })) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  useEffect(() => {
    if (isGenerating) {
      shimmerX.value = withRepeat(withTiming(200 as const, { duration: 1500 }), -1, false) as { target: 200; transition: import('@petspark/motion').Transition };
      iconRotate.value = withRepeat(withTiming(360 as const, { duration: 2000 }), -1, false) as { target: 360; transition: import('@petspark/motion').Transition };
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
    } catch (error) {
      const logger = createLogger('GenerateProfilesButton');
      logger.error(
        'Failed to generate profiles',
        error instanceof Error ? error : new Error(String(error))
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
        style={buttonHover.animatedStyle as React.CSSProperties}
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
              style={shimmerStyle as React.CSSProperties}
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"                                                          
            />
          )}
          <MotionView style={iconStyle as React.CSSProperties} className={showLabel ? 'mr-2' : ''}>
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
