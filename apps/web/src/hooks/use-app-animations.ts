/**
 * useAppAnimations Hook
 *
 * Aggregates all animation hooks used in the main App component.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { useBounceOnTap } from '@/effects/reanimated';
import {
  useHeaderAnimation,
  useHeaderButtonAnimation
  useHoverLift,
  useIconRotation
  useLogoAnimation,
  useLogoGlow
  useModalAnimation,
  useNavBarAnimation
  usePageTransition,
  useStaggeredContainer
} from '@/effects/reanimated';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import type { View } from '@/hooks/use-app-navigation';

interface UseAppAnimationsOptions {
  currentView: View;
  language: string;
  showGenerateProfiles: boolean;
  showStats: boolean;
  showMap: boolean;
  showAdminConsole: boolean;
  showThemeSettings: boolean;
}

export interface UseAppAnimationsReturn {
  lostFoundAnimation: ReturnType<typeof useNavButtonAnimation>;
  logoAnimation: ReturnType<typeof useLogoAnimation>;
  logoGlow: ReturnType<typeof useLogoGlow>;
  logoButtonHover: ReturnType<typeof useHoverLift>;
  headerButtonsContainer: ReturnType<typeof useStaggeredContainer>;
  headerButton1: ReturnType<typeof useHeaderButtonAnimation>;
  headerButton2: ReturnType<typeof useHeaderButtonAnimation>;
  headerButton3: ReturnType<typeof useHeaderButtonAnimation>;
  headerButton4: ReturnType<typeof useHeaderButtonAnimation>;
  headerButton5: ReturnType<typeof useHeaderButtonAnimation>;
  headerButton6: ReturnType<typeof useHeaderButtonAnimation>;
  languageIconRotation: ReturnType<typeof useIconRotation>;
  pageTransition: ReturnType<typeof usePageTransition>;
  loadingTransition: ReturnType<typeof usePageTransition>;
  generateProfilesModal: ReturnType<typeof useModalAnimation>;
  generateProfilesContent: ReturnType<typeof useModalAnimation>;
  statsModal: ReturnType<typeof useModalAnimation>;
  statsContent: ReturnType<typeof useModalAnimation>;
  mapModal: ReturnType<typeof useModalAnimation>;
  mapContent: ReturnType<typeof useModalAnimation>;
  adminModal: ReturnType<typeof useModalAnimation>;
  adminContent: ReturnType<typeof useModalAnimation>;
  themeContent: ReturnType<typeof useModalAnimation>;
  headerAnimation: ReturnType<typeof useHeaderAnimation>;
  navBarAnimation: ReturnType<typeof useNavBarAnimation>;
  closeButtonBounce: ReturnType<typeof useBounceOnTap>;
}

export function useAppAnimations(options: UseAppAnimationsOptions): UseAppAnimationsReturn {
  const { currentView, language, showGenerateProfiles, showStats, showMap, showAdminConsole, showThemeSettings } = options;

  const lostFoundAnimation = useNavButtonAnimation({
    isActive: currentView === 'lost-found',
    enablePulse: true,
    enableRotation: true,
    hapticFeedback: true,
  });

  const logoAnimation = useLogoAnimation();
  const logoGlow = useLogoGlow();
  const logoButtonHover = useHoverLift({ scale: 1.06 });

  const headerButtonsContainer = useStaggeredContainer({ delay: 0.2 });
  const headerButton1 = useHeaderButtonAnimation({
    delay: 0.3,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton2 = useHeaderButtonAnimation({
    delay: 0.35,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton3 = useHeaderButtonAnimation({
    delay: 0.4,
    scale: 1.1,
    translateY: -2,
    rotation: -3,
  });
  const headerButton4 = useHeaderButtonAnimation({
    delay: 0.45,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton5 = useHeaderButtonAnimation({
    delay: 0.5,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });
  const headerButton6 = useHeaderButtonAnimation({
    delay: 0.55,
    scale: 1.12,
    translateY: -3,
    rotation: -5,
  });

  const languageIconRotation = useIconRotation({ enabled: language === 'bg', targetRotation: 360 });

  const pageTransition = usePageTransition({
    isVisible: true,
    direction: 'up',
  });
  const loadingTransition = usePageTransition({
    isVisible: true,
    direction: 'fade',
    duration: 300,
  });

  const generateProfilesModal = useModalAnimation({
    isVisible: showGenerateProfiles,
    duration: 200,
  });
  const generateProfilesContent = useModalAnimation({
    isVisible: showGenerateProfiles,
    duration: 300,
  });
  const statsModal = useModalAnimation({ isVisible: showStats, duration: 200 });
  const statsContent = useModalAnimation({ isVisible: showStats, duration: 300 });
  const mapModal = useModalAnimation({ isVisible: showMap, duration: 200 });
  const mapContent = useModalAnimation({ isVisible: showMap, duration: 300 });
  const adminModal = useModalAnimation({ isVisible: showAdminConsole, duration: 200 });
  const adminContent = useModalAnimation({ isVisible: showAdminConsole, duration: 300 });
  const themeContent = useModalAnimation({ isVisible: showThemeSettings, duration: 300 });

  const headerAnimation = useHeaderAnimation({ delay: 0.1 });
  const navBarAnimation = useNavBarAnimation({ delay: 0.2 });
  const closeButtonBounce = useBounceOnTap({ hapticFeedback: true });

  return {
    lostFoundAnimation,
    logoAnimation,
    logoGlow,
    logoButtonHover,
    headerButtonsContainer,
    headerButton1,
    headerButton2,
    headerButton3,
    headerButton4,
    headerButton5,
    headerButton6,
    languageIconRotation,
    pageTransition,
    loadingTransition,
    generateProfilesModal,
    generateProfilesContent,
    statsModal,
    statsContent,
    mapModal,
    mapContent,
    adminModal,
    adminContent,
    themeContent,
    headerAnimation,
    navBarAnimation,
    closeButtonBounce,
  };
}
