import { useCallback, useState, useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Heart, Sparkle, PawPrint, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import {
  MotionView,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  type AnimatedStyle,
  type MotionValue,
} from '@petspark/motion';

export default function WelcomeModal(): JSX.Element | null {
  const { t } = useApp();
  const [hasSeenWelcome, setHasSeenWelcome] = useStorage<boolean>('has-seen-welcome', false);
  const [open, setOpen] = useState(false);

  // Animated values
  const bgScale = useSharedValue(1);
  const bgRotate = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconPulse = useSharedValue(1);
  const iconGlowScale = useSharedValue(1);
  const iconGlowOpacity = useSharedValue(0.5);
  const closeButtonHover = useHoverTap({ hoverScale: 1.1, tapScale: 0.9 });
  const buttonHover = useHoverTap({ hoverScale: 1.05, tapScale: 0.95 });
  const arrowX = useSharedValue(0);

  const bgAnimatedStyle = useAnimatedStyle(() => {
    const scale = bgScale.value;
    const rotate = bgRotate.value;
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ scale });
    transforms.push({ rotate: `${rotate}deg` });
    return { transform: transforms };
  });

  const _iconAnimatedStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ scale: iconScale.value });
    return { transform: transforms };
  });

  const iconPulseStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ scale: iconPulse.value });
    return { transform: transforms };
  });

  const iconGlowStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ scale: iconGlowScale.value });
    return {
      transform: transforms,
      opacity: iconGlowOpacity.value,
    };
  });

  const arrowStyle = useAnimatedStyle(() => {
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ translateX: arrowX.value });
    return { transform: transforms };
  });

  // Animation hooks
  const _containerEntry = useEntryAnimation({ initialOpacity: 0 });
  const _titleEntry = useEntryAnimation({ initialY: 20, delay: 300 });
  const _subtitleEntry = useEntryAnimation({ initialY: 20, delay: 400 });
  const _buttonEntry = useEntryAnimation({ initialY: 20, delay: 1000 });

  // Logo entry animation
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(-180);
  const logoStyle = useAnimatedStyle(() => {
    const scale = logoScale.value;
    const rotate = logoRotate.value;
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ scale });
    transforms.push({ rotate: `${rotate}deg` });
    return { transform: transforms };
  });

  useEffect(() => {
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasSeenWelcome]);

  useEffect(() => {
    bgScale.value = withRepeat(
      withSequence(withTiming(1, { duration: 4000 }), withTiming(1.2, { duration: 4000 })),
      -1,
      true
    );
    bgRotate.value = withRepeat(
      withSequence(withTiming(0, { duration: 4000 }), withTiming(5, { duration: 4000 })),
      -1,
      true
    );
    iconScale.value = withSpring(1, { stiffness: 200, damping: 15 });
    iconPulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 750 }), withTiming(1.2, { duration: 750 })),
      -1,
      true
    );
    iconGlowScale.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(1.5, { duration: 1000 })),
      -1,
      false
    );
    iconGlowOpacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 1000 }), withTiming(0, { duration: 1000 })),
      -1,
      false
    );
    arrowX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(5, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );
  }, [bgScale, bgRotate, iconScale, iconPulse, iconGlowScale, iconGlowOpacity, arrowX]);

  const handleClose = useCallback((): void => {
    void setHasSeenWelcome(true);
    setOpen(false);
  }, [setHasSeenWelcome]);

  const features = [
    {
      icon: PawPrint,
      title: t.welcome.proof1,
      description: 'AI-powered matching algorithm finds perfect companions for your pet',
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
    },
    {
      icon: Sparkle,
      title: t.welcome.proof2,
      description: 'Secure messaging platform to connect with other pet owners',
      color: 'from-accent/20 to-accent/5',
      iconColor: 'text-accent',
    },
    {
      icon: Heart,
      title: t.welcome.proof3,
      description: 'Join thousands of verified pet owners in our community',
      color: 'from-secondary/20 to-secondary/5',
      iconColor: 'text-secondary',
    },
  ];

  if (hasSeenWelcome) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0">
        <DialogTitle className="sr-only">Welcome to PawfectMatch</DialogTitle>
        <DialogDescription className="sr-only">
          Discover perfect companions for your pet with AI-powered matching, secure messaging, and a vibrant community
        </DialogDescription>
        <div className="relative bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-8 md:p-12 overflow-hidden animate-in fade-in duration-300">
          <MotionView
            style={bgAnimatedStyle}
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"
          />

          <MotionView
            style={closeButtonHover.animatedStyle}
            onMouseEnter={closeButtonHover.handleMouseEnter}
            onMouseLeave={closeButtonHover.handleMouseLeave}
            onClick={closeButtonHover.handlePress}
          >
            <button
              type="button"
              onClick={() => void handleClose()}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10 shadow-md focus:outline-none focus:ring-2 focus:ring-(--coral-primary) focus:ring-offset-2"
              aria-label="Close welcome dialog"
            >
              <X size={16} />
            </button>
          </MotionView>

          <MotionView
            style={logoStyle}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10"
          >
            <MotionView style={iconPulseStyle}>
              <Heart size={40} className="text-white" weight="fill" />
            </MotionView>
            <MotionView
              style={iconGlowStyle}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent"
            />
          </MotionView>

          <div className="text-3xl md:text-4xl font-bold text-center mb-4 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-300">
            {t.welcome.title} 🐾
          </div>

          <div className="text-center text-muted-foreground text-lg mb-8 max-w-xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-400">
            {t.welcome.subtitle}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8 relative z-10">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="text-center animate-in fade-in slide-in-from-bottom-4 duration-300 hover:scale-105 hover:-translate-y-1 transition-all"
                style={{ animationDelay: `${500 + idx * 150}ms` }}
              >
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-3 shadow-lg transition-transform hover:rotate-12`}
                >
                  <feature.icon size={32} className={feature.iconColor} weight="fill" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-1000">
            <MotionView
              style={buttonHover.animatedStyle}
              onMouseEnter={buttonHover.handleMouseEnter}
              onMouseLeave={buttonHover.handleMouseLeave}
              onClick={buttonHover.handlePress}
            >
              <Button
                size="lg"
                onClick={() => void handleClose()}
                className="px-8 shadow-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {t.welcome.getStarted}
                <MotionView style={arrowStyle} className="ml-2">
                  →
                </MotionView>
              </Button>
            </MotionView>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
