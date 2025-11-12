import { useEffect, useState } from 'react';
import { Heart, CheckCircle, Translate } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import { ConsentBanner } from '@/components/gdpr/ConsentBanner';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExplore: () => void;
  isOnline?: boolean;
  deepLinkMessage?: string;
}

const track = (name: string, props?: Record<string, string | number | boolean>) => {
  try {
    analytics.track(name, props);
  } catch {
    // Ignore analytics errors
  }
};

export default function WelcomeScreen({
  onGetStarted,
  onSignIn,
  onExplore,
  isOnline = true,
  deepLinkMessage,
}: WelcomeScreenProps) {
  const { t, language } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    track('welcome_viewed');
  }, []);

  useEffect(() => {
    if (!isOnline) track('welcome_offline_state_shown');
  }, [isOnline]);

  const handleGetStarted = () => {
    if (!isOnline) return;
    haptics.trigger('light');
    track('welcome_get_started_clicked');
    onGetStarted();
  };

  const handleSignIn = () => {
    haptics.trigger('light');
    track('welcome_sign_in_clicked');
    onSignIn();
  };

  const handleExplore = () => {
    haptics.trigger('light');
    track('welcome_explore_clicked');
    onExplore();
  };

  const handleLanguageToggle = () => {
    haptics.trigger('selection');
    const from = language || 'en';
    const to = language === 'en' ? 'bg' : 'en';
    track('welcome_language_changed', { from, to });
  };

  const handleLegalClick = (type: 'terms' | 'privacy') => {
    track(`welcome_${type}_opened`);
  };

  // Animation values
  const loadingOpacity = useSharedValue(0);
  const languageButtonOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const logoY = useSharedValue(20);
  const logoShadow = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const proofItemsOpacity = useSharedValue(0);
  const proofItemsY = useSharedValue(20);
  const deepLinkOpacity = useSharedValue(0);
  const deepLinkY = useSharedValue(20);
  const offlineOpacity = useSharedValue(0);
  const offlineY = useSharedValue(20);
  const buttonsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(20);
  const legalOpacity = useSharedValue(0);
  const legalY = useSharedValue(20);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    track('welcome_viewed');
  }, []);

  useEffect(() => {
    if (!isOnline) track('welcome_offline_state_shown');
  }, [isOnline]);

  // Initialize animations
  useEffect(() => {
    if (!isLoading) {
      loadingOpacity.value = withTiming(1, { duration: 300 });
      languageButtonOpacity.value = withTiming(1, { duration: 400 });

      if (!shouldReduceMotion) {
        logoOpacity.value = withTiming(1, { duration: 500 });
        logoScale.value = withSpring(1, { damping: 20, stiffness: 300 });
        logoY.value = withSpring(0, { damping: 20, stiffness: 300 });
        logoShadow.value = withRepeat(
          withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
          -1,
          true
        );

        titleOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
        titleY.value = withDelay(200, withSpring(0, { damping: 20, stiffness: 300 }));

        proofItemsOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
        proofItemsY.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 300 }));

        if (deepLinkMessage) {
          deepLinkOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
          deepLinkY.value = withDelay(600, withSpring(0, { damping: 20, stiffness: 300 }));
        }

        if (!isOnline) {
          offlineOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
          offlineY.value = withDelay(600, withSpring(0, { damping: 20, stiffness: 300 }));
        }

        buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
        buttonsY.value = withDelay(700, withSpring(0, { damping: 20, stiffness: 300 }));

        legalOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
        legalY.value = withDelay(900, withSpring(0, { damping: 20, stiffness: 300 }));
      } else {
        // Reduced motion - instant appearance
        logoOpacity.value = 1;
        logoScale.value = 1;
        logoY.value = 0;
        titleOpacity.value = 1;
        titleY.value = 0;
        proofItemsOpacity.value = 1;
        proofItemsY.value = 0;
        if (deepLinkMessage) {
          deepLinkOpacity.value = 1;
          deepLinkY.value = 0;
        }
        if (!isOnline) {
          offlineOpacity.value = 1;
          offlineY.value = 0;
        }
        buttonsOpacity.value = 1;
        buttonsY.value = 0;
        legalOpacity.value = 1;
        legalY.value = 0;
      }
    }
  }, [
    isLoading,
    shouldReduceMotion,
    deepLinkMessage,
    isOnline,
    loadingOpacity,
    languageButtonOpacity,
    logoOpacity,
    logoScale,
    logoY,
    logoShadow,
    titleOpacity,
    titleY,
    proofItemsOpacity,
    proofItemsY,
    deepLinkOpacity,
    deepLinkY,
    offlineOpacity,
    offlineY,
    buttonsOpacity,
    buttonsY,
    legalOpacity,
    legalY,
  ]);

  // Animated styles
  const loadingStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  })) as AnimatedStyle;

  const languageButtonStyle = useAnimatedStyle(() => ({
    opacity: languageButtonOpacity.value,
  })) as AnimatedStyle;

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
    boxShadow: shouldReduceMotion
      ? undefined
      : `0 ${10 + logoShadow.value * 10}px ${40 + logoShadow.value * 20}px rgba(0,0,0,${0.15 + logoShadow.value * 0.15})`,
  })) as AnimatedStyle;

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  })) as AnimatedStyle;

  const proofItemsStyle = useAnimatedStyle(() => ({
    opacity: proofItemsOpacity.value,
    transform: [{ translateY: proofItemsY.value }],
  })) as AnimatedStyle;

  const deepLinkStyle = useAnimatedStyle(() => ({
    opacity: deepLinkOpacity.value,
    transform: [{ translateY: deepLinkY.value }],
  })) as AnimatedStyle;

  const offlineStyle = useAnimatedStyle(() => ({
    opacity: offlineOpacity.value,
    transform: [{ translateY: offlineY.value }],
  })) as AnimatedStyle;

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  })) as AnimatedStyle;

  const legalStyle = useAnimatedStyle(() => ({
    opacity: legalOpacity.value,
    transform: [{ translateY: legalY.value }],
  })) as AnimatedStyle;

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 bg-background flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <AnimatedView
          style={loadingStyle}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
        >
          <Heart size={32} className="text-white" weight="fill" aria-hidden />
          <span className="sr-only">{t.common.loading}</span>
        </AnimatedView>
      </div>
    );
  }

  return (
    <main className="fixed inset-0 bg-(--background-cream) overflow-auto">
      <div className="min-h-screen flex flex-col">
        <AnimatedView style={languageButtonStyle} className="absolute top-6 right-6 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLanguageToggle}
            className="rounded-full h-11 px-4 border-[1.5px] font-semibold text-sm"
            aria-pressed={language === 'bg'}
            aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
          >
            <Translate size={20} weight="bold" aria-hidden />
            <span>{language === 'en' ? 'БГ' : 'EN'}</span>
          </Button>
        </AnimatedView>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <AnimatedView style={titleStyle} className="flex flex-col items-center mb-12">
              <AnimatedView
                style={logoStyle}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center mb-6"
              >
                <Heart size={40} className="text-white" weight="fill" aria-hidden />
              </AnimatedView>

              <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-3">
                {t.welcome.title}
              </h1>

              <p className="text-lg text-muted-foreground text-center">{t.welcome.subtitle}</p>
            </AnimatedView>

            <AnimatedView style={proofItemsStyle} className="space-y-3 mb-10">
              {[t.welcome.proof1, t.welcome.proof2, t.welcome.proof3].map((text, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle
                    size={20}
                    weight="fill"
                    className="text-primary shrink-0"
                    aria-hidden
                  />
                  <span className="text-muted-foreground text-sm">{text}</span>
                </div>
              ))}
            </AnimatedView>

            {deepLinkMessage && (
              <AnimatedView
                style={deepLinkStyle}
                className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20"
                role="note"
              >
                <p className="text-sm text-muted-foreground text-center">{deepLinkMessage}</p>
              </AnimatedView>
            )}

            {!isOnline && (
              <AnimatedView
                style={offlineStyle}
                className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm text-destructive text-center">{t.welcome.offlineMessage}</p>
              </AnimatedView>
            )}

            <AnimatedView style={buttonsStyle} className="space-y-3">
              <Button
                size="lg"
                onClick={handleGetStarted}
                disabled={!isOnline}
                className="w-full"
                style={{
                  transform: shouldReduceMotion ? 'none' : undefined,
                }}
                onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
              >
                {t.welcome.getStarted}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSignIn}
                  className="flex-1 h-12 text-sm font-medium"
                >
                  {t.welcome.signIn}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleExplore}
                  className="flex-1 h-12 text-sm font-medium"
                >
                  {t.welcome.explore}
                </Button>
              </div>
            </AnimatedView>

            <AnimatedView style={legalStyle} className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                {t.welcome.legal}{' '}
                <a
                  href="https://pawfectmatch.app/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLegalClick('terms')}
                  className="text-(--coral-primary) font-medium hover:underline focus:outline-none"
                >
                  {t.welcome.terms}
                </a>{' '}
                {t.welcome.and}{' '}
                <a
                  href="https://pawfectmatch.app/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLegalClick('privacy')}
                  className="text-(--coral-primary) font-medium hover:underline focus:outline-none"
                >
                  {t.welcome.privacy}
                </a>
                .
              </p>
            </AnimatedView>
          </div>
        </div>
      </div>
      <ConsentBanner showOnMount={true} />
    </main>
  );
}
