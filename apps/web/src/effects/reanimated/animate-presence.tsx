'use client';

import { useEffect, useRef, useState, type ReactNode, Children, isValidElement } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { AnimatedView } from './animated-view';
import { timingConfigs, springConfigs } from './transitions';
import type { AnimatedStyle } from './animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

interface AnimatePresenceProps {
  children: ReactNode;
  mode?: 'wait' | 'sync';
  initial?: boolean;
  onExitComplete?: () => void;
}

interface PresenceChildProps {
  children: ReactNode;
  isVisible: boolean;
  onExitComplete?: () => void;
  childKey: string | number;
}

function PresenceChild({ children, isVisible, onExitComplete, childKey }: PresenceChildProps) {
    const uiConfig = useUIConfig();
    const opacity = useSharedValue(isVisible ? 1 : 0);
  const scale = useSharedValue(isVisible ? 1 : 0.95);
  const translateY = useSharedValue(isVisible ? 0 : -8);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const exitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      opacity.value = withSpring(1, springConfigs.smooth);
      scale.value = withSpring(1, springConfigs.smooth);
      translateY.value = withSpring(0, springConfigs.smooth);
    } else {
      opacity.value = withTiming(0, timingConfigs.fast);
      scale.value = withTiming(0.95, timingConfigs.fast);
      translateY.value = withTiming(-8, timingConfigs.fast);

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }

      exitTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        onExitComplete?.();
      }, timingConfigs.fast.duration);
    }

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [isVisible, opacity, scale, translateY, onExitComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: `${translateY.value}px` }],
    };
  }) as AnimatedStyle;

  if (!shouldRender) {
    return null;
  }

  return (
    <AnimatedView style={animatedStyle} className="w-full">
      {children}
    </AnimatedView>
  );
}

export function AnimatePresence({
  children,
  mode = 'sync',
  initial = false,
  onExitComplete,
}: AnimatePresenceProps) {
  const childrenArray = Children.toArray(children);
  const [visibleKeys, setVisibleKeys] = useState<Set<string | number>>(() => {
    const keys = new Set<string | number>();
    childrenArray.forEach((child, index) => {
      const key = isValidElement(child) && child.key !== null ? child.key : index;
      if (initial) {
        keys.add(key);
      }
    });
    return keys;
  });

  useEffect(() => {
    const newVisibleKeys = new Set<string | number>();
    childrenArray.forEach((child, index) => {
      const key = isValidElement(child) && child.key !== null ? child.key : index;
      newVisibleKeys.add(key);
    });
    setVisibleKeys(newVisibleKeys);
  }, [childrenArray]);

  const handleExitComplete = (key: string | number) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      if (next.size === 0) {
        onExitComplete?.();
      }
      return next;
    });
  };

  return (
    <>
      {childrenArray.map((child, index) => {
        const key = isValidElement(child) && child.key !== null ? child.key : index;
        const isVisible = visibleKeys.has(key);

        return (
          <PresenceChild
            key={key}
            childKey={key}
            isVisible={isVisible}
            onExitComplete={() => handleExitComplete(key)}
          >
            {child}
          </PresenceChild>
        );
      })}
    </>
  );
}
