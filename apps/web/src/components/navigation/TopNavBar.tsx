'use client';

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import {
  Heart,
  Translate,
  Sun,
  Moon,
  ShieldCheck,
  Bell,
  User,
  Menu,
  X,
} from '@phosphor-icons/react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import { useBounceOnTap } from '@/effects/reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

interface TopNavBarProps {
  onAdminClick?: () => void;
  onThemeToggle?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

export default function TopNavBar({
  onAdminClick,
  onThemeToggle,
  onNotificationsClick,
  onProfileClick,
}: TopNavBarProps) {
  const { pathname } = useLocation();
  const { theme, toggleTheme, language, toggleLanguage, t } = useApp();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation values
  const barOpacity = useSharedValue(1);
  const barY = useSharedValue(0);
  const blurIntensity = useSharedValue(20);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isScrolled) {
      barY.value = withSpring(0, springConfigs.smooth);
      blurIntensity.value = withTiming(30, timingConfigs.smooth);
      glowOpacity.value = withTiming(0.5, timingConfigs.smooth);
    } else {
      barY.value = withSpring(0, springConfigs.smooth);
      blurIntensity.value = withTiming(20, timingConfigs.smooth);
      glowOpacity.value = withTiming(0.3, timingConfigs.smooth);
    }
  }, [isScrolled, barY, blurIntensity, glowOpacity]);

  // Holographic shimmer effect
  const shimmerX = useSharedValue(-100);
  useEffect(() => {
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(200, { duration: 3000 }),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    );
  }, [shimmerX]);

  const barStyle = useAnimatedStyle(() => {
    return {
      opacity: barOpacity.value,
      transform: [{ translateY: barY.value }],
    };
  }) as AnimatedStyle;

  const backdropStyle = useAnimatedStyle(() => {
    return {
      backdropFilter: `blur(${blurIntensity.value}px)`,
    };
  }) as AnimatedStyle;

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  }) as AnimatedStyle;

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerX.value }],
    };
  }) as AnimatedStyle;

  const handleThemeToggle = useCallback(() => {
    haptics.trigger('light');
    toggleTheme();
    onThemeToggle?.();
  }, [toggleTheme, onThemeToggle]);

  const handleLanguageToggle = useCallback(() => {
    haptics.trigger('selection');
    toggleLanguage();
  }, [toggleLanguage]);

  const handleAdminClick = useCallback(() => {
    haptics.impact('medium');
    onAdminClick?.();
  }, [onAdminClick]);

  const handleNotificationsClick = useCallback(() => {
    haptics.trigger('light');
    onNotificationsClick?.();
  }, [onNotificationsClick]);

  const handleProfileClick = useCallback(() => {
    haptics.trigger('light');
    onProfileClick?.();
  }, [onProfileClick]);

  const toggleMobileMenu = useCallback(() => {
    haptics.trigger('light');
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <AnimatedView
      style={barStyle}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'shadow-2xl shadow-primary/20' : 'shadow-lg'
      )}
    >
      {/* Holographic backdrop with blur */}
      <div className="absolute inset-0 bg-card/90 border-b border-border/50">
        <AnimatedView
          style={backdropStyle}
          className="absolute inset-0 backdrop-blur-xl"
        />
        {/* Holographic gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-accent/10 to-secondary/10 opacity-60" />
        {/* Shimmer effect */}
        <AnimatedView
          style={shimmerStyle}
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent w-1/3 h-full"
        />
        {/* Glow effect */}
        <AnimatedView
          style={glowStyle}
          className="absolute inset-0 bg-linear-to-r from-primary/20 via-accent/20 to-primary/20 blur-2xl"
        />
      </div>

      {/* Content */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/discover"
            className="flex items-center gap-2 sm:gap-3 group"
            onClick={() => haptics.trigger('light')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
              <Heart
                className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300"
                size={28}
                weight="fill"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {t.app?.title || 'PawfectMatch'}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavButton
              icon={<Translate size={20} weight="bold" />}
              label={language === 'en' ? 'БГ' : 'EN'}
              onClick={handleLanguageToggle}
              ariaLabel={
                language === 'en'
                  ? 'Switch to Bulgarian'
                  : 'Превключи на English'
              }
            />
            <NavButton
              icon={
                theme === 'dark' ? (
                  <Sun size={20} weight="bold" />
                ) : (
                  <Moon size={20} weight="bold" />
                )
              }
              onClick={handleThemeToggle}
              ariaLabel={
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
            />
            {isAuthenticated && (
              <>
                <NavButton
                  icon={<Bell size={20} weight="bold" />}
                  onClick={handleNotificationsClick}
                  ariaLabel="Notifications"
                  badge={0}
                />
                <NavButton
                  icon={<ShieldCheck size={20} weight="bold" />}
                  onClick={handleAdminClick}
                  ariaLabel="Admin Console"
                />
                <NavButton
                  icon={<User size={20} weight="bold" />}
                  onClick={handleProfileClick}
                  ariaLabel="Profile"
                />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X size={24} weight="bold" />
            ) : (
              <Menu size={24} weight="bold" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4 space-y-2">
            <MobileNavButton
              icon={<Translate size={20} weight="bold" />}
              label={
                language === 'en'
                  ? 'Switch to Bulgarian'
                  : 'Превключи на English'
              }
              onClick={() => {
                handleLanguageToggle();
                setIsMobileMenuOpen(false);
              }}
            />
            <MobileNavButton
              icon={
                theme === 'dark' ? (
                  <Sun size={20} weight="bold" />
                ) : (
                  <Moon size={20} weight="bold" />
                )
              }
              label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              onClick={() => {
                handleThemeToggle();
                setIsMobileMenuOpen(false);
              }}
            />
            {isAuthenticated && (
              <>
                <MobileNavButton
                  icon={<Bell size={20} weight="bold" />}
                  label="Notifications"
                  onClick={() => {
                    handleNotificationsClick();
                    setIsMobileMenuOpen(false);
                  }}
                />
                <MobileNavButton
                  icon={<ShieldCheck size={20} weight="bold" />}
                  label="Admin Console"
                  onClick={() => {
                    handleAdminClick();
                    setIsMobileMenuOpen(false);
                  }}
                />
                <MobileNavButton
                  icon={<User size={20} weight="bold" />}
                  label="Profile"
                  onClick={() => {
                    handleProfileClick();
                    setIsMobileMenuOpen(false);
                  }}
                />
              </>
            )}
          </div>
        )}
      </nav>
    </AnimatedView>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  ariaLabel?: string;
  badge?: number;
}

function NavButton({
  icon,
  label,
  onClick,
  ariaLabel,
  badge,
}: NavButtonProps) {
  const animation = useNavButtonAnimation({
    isActive: false,
    enablePulse: false,
    enableRotation: false,
    hapticFeedback: true,
  });

  const bounceAnimation = useBounceOnTap({
    scale: 0.9,
    hapticFeedback: false,
  });

  return (
    <button
      onClick={() => {
        bounceAnimation.handlePress();
        onClick();
      }}
      aria-label={ariaLabel || label}
      className="relative p-2.5 rounded-xl hover:bg-primary/10 active:bg-primary/20 transition-all duration-200 group"
    >
      <AnimatedView style={animation.buttonStyle} className="relative">
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-destructive flex items-center justify-center text-xs font-bold text-destructive-foreground">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        <div className="text-(--text-primary) group-hover:text-(--coral-primary) transition-colors">
          {icon}
        </div>
      </AnimatedView>
    </button>
  );
}

interface MobileNavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MobileNavButton({ icon, label, onClick }: MobileNavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors text-left"
    >
      <div className="text-(--text-primary)">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
