'use client';

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import { useBounceOnTap } from '@/effects/reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: number;
}

const items: NavItem[] = [
  { to: '/discover', label: 'Discover', icon: '🧭' },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/matches', label: 'Matches', icon: '❤️' },
  { to: '/adopt', label: 'Adopt', icon: '🐾' },
  { to: '/community', label: 'Community', icon: '👥' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNavBar() {
  const { pathname } = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const barOpacity = useSharedValue(0);
  const barY = useSharedValue(20);

  useEffect(() => {
    barOpacity.value = withDelay(200, withTiming(1, timingConfigs.smooth));
    barY.value = withDelay(200, withSpring(0, springConfigs.smooth));
  }, [barOpacity, barY]);

  const barStyle = useAnimatedStyle(() => {
    return {
      opacity: barOpacity.value,
      transform: [{ translateY: barY.value }],
    };
  }) as AnimatedStyle;

  // Holographic shimmer effect
  const shimmerX = useSharedValue(-100);
  useEffect(() => {
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(300, { duration: 4000 }),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    );
  }, [shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerX.value }],
    };
  }) as AnimatedStyle;

  const holographicGlow = useSharedValue(0.4);
  useEffect(() => {
    holographicGlow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000 }),
        withTiming(0.4, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [holographicGlow]);

  const glowStyle2 = useAnimatedStyle(() => {
    return {
      opacity: holographicGlow.value,
    };
  }) as AnimatedStyle;

  return (
    <AnimatedView style={barStyle} className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <nav className="border-t border-border/40 bg-card/85 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="relative overflow-hidden">
          {/* Holographic gradient layers */}
          <div className="absolute inset-0 bg-linear-to-t from-primary/15 via-accent/10 to-secondary/15 opacity-60 pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />

          {/* Animated shimmer effect */}
          <AnimatedView
            style={shimmerStyle}
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-1/2 h-full pointer-events-none"
          />

          {/* Pulsing glow effect */}
          <AnimatedView
            style={glowStyle2}
            className="absolute inset-0 bg-linear-to-t from-accent/20 via-primary/15 to-accent/20 blur-2xl pointer-events-none"
          />

          {/* Glassmorphism overlay with enhanced blur */}
          <div className="absolute inset-0 bg-linear-to-t from-background/70 to-background/50 backdrop-blur-2xl pointer-events-none" />

          {/* Holographic color shift overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-accent/10 via-secondary/10 to-primary/10 opacity-40 pointer-events-none mix-blend-overlay" />

          <ul className="grid grid-cols-6 relative z-10">
            {items.map((item) => {
              const isActive = pathname.startsWith(item.to);
              const isHovered = hoveredItem === item.to;

              return (
                <NavItem
                  key={item.to}
                  item={item}
                  isActive={isActive}
                  isHovered={isHovered}
                  onHover={() => { setHoveredItem(item.to); }}
                  onLeave={() => { setHoveredItem(null); }}
                />
              );
            })}
          </ul>
        </div>
      </nav>
    </AnimatedView>
  );
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function NavItem({ item, isActive, isHovered, onHover, onLeave }: NavItemProps) {
  const animation = useNavButtonAnimation({
    isActive,
    enablePulse: true,
    enableRotation: false,
    hapticFeedback: true,
  });

  const bounceAnimation = useBounceOnTap({
    scale: 0.85,
    hapticFeedback: false,
  });

  const iconScale = useSharedValue(1);
  const iconY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      iconScale.value = withSpring(1.15, springConfigs.bouncy);
      iconY.value = withSpring(-2, springConfigs.smooth);
      glowOpacity.value = withSpring(1, springConfigs.smooth);
    } else {
      iconScale.value = withSpring(1, springConfigs.smooth);
      iconY.value = withSpring(0, springConfigs.smooth);
      glowOpacity.value = withSpring(0, springConfigs.smooth);
    }
  }, [isActive, iconScale, iconY, glowOpacity]);

  useEffect(() => {
    if (isHovered && !isActive) {
      iconScale.value = withSpring(1.1, springConfigs.smooth);
    } else if (!isActive) {
      iconScale.value = withSpring(1, springConfigs.smooth);
    }
  }, [isHovered, isActive, iconScale]);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: iconScale.value * animation.iconScale.value },
        { translateY: iconY.value },
      ],
    };
  }) as AnimatedStyle;

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value * 0.6,
    };
  }) as AnimatedStyle;

  const handleClick = useCallback(() => {
    bounceAnimation.handlePress();
    if (!isActive) {
      haptics.impact('light');
    }
  }, [bounceAnimation, isActive]);

  return (
    <li className="text-center relative">
      <Link
        to={item.to}
        className="block py-3 px-1 relative group"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={handleClick}
      >
        <AnimatedView
          style={animation.buttonStyle}
          className="relative flex flex-col items-center justify-center gap-1"
        >
          {/* Active indicator background */}
          {isActive && (
            <AnimatedView
              style={animation.indicatorStyle}
              className="absolute inset-0 rounded-2xl bg-(--coral-primary)/20 blur-xl"
            >
              <></>
            </AnimatedView>
          )}

          {/* Glow effect for active item */}
          {isActive && (
            <AnimatedView
              style={glowStyle}
              className="absolute inset-0 rounded-2xl bg-(--coral-primary)/30 blur-2xl -z-10"
            >
              <></>
            </AnimatedView>
          )}

          {/* Icon container */}
          <AnimatedView style={iconStyle} className="relative z-10">
            <span className="text-2xl leading-none select-none">{item.icon}</span>
          </AnimatedView>

          {/* Label */}
          <span
            className={cn(
              'text-[10px] leading-tight font-semibold transition-all duration-200 relative z-10',
              isActive ? 'text-(--coral-primary) font-bold' : 'text-(--text-secondary) opacity-70'
            )}
          >
            {item.label}
          </span>

          {/* Active indicator dot */}
          {isActive && (
            <AnimatedView
              style={animation.indicatorStyle}
              className="absolute bottom-0 w-1 h-1 rounded-full bg-(--coral-primary)"
            >
              <></>
            </AnimatedView>
          )}

          {/* Badge */}
          {item.badge && item.badge > 0 && <Badge count={item.badge} isActive={isActive} />}
        </AnimatedView>
      </Link>
    </li>
  );
}

interface BadgeProps {
  count: number;
  isActive: boolean;
}

function Badge({ count, isActive }: BadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1, springConfigs.bouncy);
    opacity.value = withTiming(1, timingConfigs.fast);
  }, [scale, opacity]);

  useEffect(() => {
    if (isTruthy(isActive)) {
      pulseScale.value = withSpring(1.2, springConfigs.bouncy, () => {
        pulseScale.value = withSpring(1, springConfigs.smooth);
      });
    }
  }, [isActive, pulseScale]);

  const badgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * pulseScale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  return (
    <AnimatedView
      style={badgeStyle}
      className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-destructive flex items-center justify-center shadow-lg z-20"
    >
      <span className="text-[10px] font-bold text-destructive-foreground">
        {count > 9 ? '9+' : count}
      </span>
    </AnimatedView>
  );
}
