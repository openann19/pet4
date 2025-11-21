'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValue, animate, type Variants } from '@petspark/motion';
import {
  Heart,
  Translate,
  Sun,
  Moon,
  ShieldCheck,
  Bell,
  User,
  List,
  X,
} from '@phosphor-icons/react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import { useBounceOnTap } from '@/effects/reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaButtonAttributes } from '@/lib/accessibility';

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
  useLocation(); // Keep for potential future use
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

  // Animation values using Framer Motion
  const barY = useMotionValue(0);
  const blurIntensity = useMotionValue(20);
  const glowOpacity = useMotionValue(0.3);
  const shimmerX = useMotionValue(-100);
  const smoothDurationMs = timingConfigs.smooth.duration ?? 300;

  useEffect(() => {
    if (isScrolled) {
      animate(barY, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(blurIntensity, 30, {
        duration: smoothDurationMs / 1000,
        ease: 'easeInOut',
      });
      animate(glowOpacity, 0.5, {
        duration: smoothDurationMs / 1000,
        ease: 'easeInOut',
      });
    } else {
      animate(barY, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(blurIntensity, 20, {
        duration: smoothDurationMs / 1000,
        ease: 'easeInOut',
      });
      animate(glowOpacity, 0.3, {
        duration: smoothDurationMs / 1000,
        ease: 'easeInOut',
      });
    }
  }, [isScrolled, barY, blurIntensity, glowOpacity]);

  // Holographic shimmer effect
  useEffect(() => {
    animate(shimmerX, [200, -100], {
      duration: 3,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    });
  }, [shimmerX]);

  const barVariants: Variants = {
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const backdropVariants: Variants = {
    scrolled: {
      backdropFilter: 'blur(30px)',
    },
    normal: {
      backdropFilter: 'blur(20px)',
    },
  };

  const glowVariants: Variants = {
    scrolled: {
      opacity: 0.5,
    },
    normal: {
      opacity: 0.3,
    },
  };

  const shimmerVariants: Variants = {
    shimmer: {
      x: [-100, 200],
      transition: {
        duration: 3,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  };

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
    <motion.div
      variants={barVariants}
      initial="visible"
      animate="visible"
      style={{ y: barY }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'shadow-2xl shadow-primary/20' : 'shadow-lg'
      )}
    >
      {/* Holographic backdrop with blur */}
      <div className="absolute inset-0 bg-card/90 border-b border-border/50">
        <motion.div
          variants={backdropVariants}
          animate={isScrolled ? 'scrolled' : 'normal'}
          style={{ backdropFilter: `blur(${blurIntensity.get()}px)` }}
          className="absolute inset-0 backdrop-blur-xl"
        />
        {/* Holographic gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-accent/10 to-secondary/10 opacity-60" />
        {/* Shimmer effect */}
        <motion.div
          variants={shimmerVariants}
          animate="shimmer"
          style={{ x: shimmerX }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent w-1/3 h-full"
        />
        {/* Glow effect */}
        <motion.div
          variants={glowVariants}
          animate={isScrolled ? 'scrolled' : 'normal'}
          style={{ opacity: glowOpacity.get() }}
          className="absolute inset-0 bg-linear-to-r from-primary/20 via-accent/20 to-primary/20 blur-2xl"
        />
      </div>

      {/* Content */}
      <nav
        className={cn(
          'relative z-10 max-w-7xl mx-auto',
          getSpacingClassesFromConfig({ paddingX: 'lg' })
        )}
        aria-label="Main navigation"
      >
        <div className={cn(
          'flex items-center justify-between',
          getSpacingClassesFromConfig({ gap: 'md' })
        )}
          style={{ height: '4rem' }}
        >
          {/* Logo */}
          <Link
            to="/discover"
            className={cn(
              'flex items-center group',
              getSpacingClassesFromConfig({ gap: 'sm' })
            )}
            onClick={() => haptics.trigger('light')}
            aria-label="Go to home page"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              <Heart
                className="text-primary drop-shadow-2xl relative z-10 group-hover:scale-125 transition-transform duration-300"
                size={28}
                weight="fill"
                aria-hidden="true"
              />
            </div>
            <h1 className={cn(
              getTypographyClasses('subtitle'),
              'bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent'
            )}>
              {t.app?.title ?? 'PawfectMatch'}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className={cn(
            'hidden md:flex items-center',
            getSpacingClassesFromConfig({ gap: 'sm' })
          )}>
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
            className={cn(
              'md:hidden rounded-lg hover:bg-primary/10 transition-colors',
              getSpacingClassesFromConfig({ padding: 'sm' })
            )}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} weight="bold" aria-hidden="true" />
            ) : (
              <List size={24} weight="bold" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className={cn(
              'md:hidden border-t border-border/50',
              getSpacingClassesFromConfig({ paddingY: 'lg', spaceY: 'sm' })
            )}
            role="menu"
            aria-label="Mobile navigation menu"
          >
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
    </motion.div>
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

  const buttonAriaAttrs = getAriaButtonAttributes({
    label: ariaLabel ?? label ?? 'Button',
  });

  return (
    <button
      onClick={() => {
        bounceAnimation.handlePress();
        onClick();
      }}
      {...buttonAriaAttrs}
      className={cn(
        'relative rounded-xl hover:bg-primary/10 active:bg-primary/20 transition-all duration-200 group',
        getSpacingClassesFromConfig({ padding: 'md' })
      )}
    >
      <motion.div
        variants={animation.variants}
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileTap="tap"
        className="relative"
      >
        {badge !== undefined && badge > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground',
              getTypographyClasses('badge'),
              getSpacingClassesFromConfig({ paddingX: 'xs' })
            )}
            aria-label={`${badge} ${badge === 1 ? 'notification' : 'notifications'}`}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        <div className="text-(--text-primary) group-hover:text-(--coral-primary) transition-colors" aria-hidden="true">
          {icon}
        </div>
      </motion.div>
    </button>
  );
}

interface MobileNavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MobileNavButton({ icon, label, onClick }: MobileNavButtonProps) {
  const buttonAriaAttrs = getAriaButtonAttributes({
    label,
  });

  return (
    <button
      onClick={onClick}
      {...buttonAriaAttrs}
      className={cn(
        'w-full flex items-center rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors text-left',
        getSpacingClassesFromConfig({ gap: 'md', paddingX: 'lg', paddingY: 'md' })
      )}
      role="menuitem"
    >
      <div className="text-(--text-primary)" aria-hidden="true">{icon}</div>
      <span className={getTypographyClasses('caption')}>{label}</span>
    </button>
  );
}
