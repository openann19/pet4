'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence as FramerAnimatePresence, useMotionValue, animate, type Variants } from '@petspark/motion';
import { timingConfigs, springConfigs } from './transitions';
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

function _PresenceChild({ children, isVisible, onExitComplete }: PresenceChildProps) {
  const _uiConfig = useUIConfig();
  const opacity = useMotionValue(isVisible ? 1 : 0);
  const scale = useMotionValue(isVisible ? 1 : 0.95);
  const translateY = useMotionValue(isVisible ? 0 : -8);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      animate(opacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      animate(translateY, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else {
      const fastDuration = timingConfigs.fast.duration ?? 200;
      animate(opacity, 0, {
        duration: fastDuration / 1000,
        ease: 'easeInOut',
      });
      animate(scale, 0.95, {
        duration: fastDuration / 1000,
        ease: 'easeInOut',
      });
      animate(translateY, -8, {
        duration: fastDuration / 1000,
        ease: 'easeInOut',
      });

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }

      exitTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        onExitComplete?.();
      }, fastDuration);
    }

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [isVisible, opacity, scale, translateY, onExitComplete]);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -8,
      transition: {
        duration: (timingConfigs.fast.duration ?? 200) / 1000,
        ease: 'easeInOut',
      },
    },
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate={isVisible ? "visible" : "exit"}
      exit="exit"
      style={{ opacity, scale, y: translateY }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export function AnimatePresence({
  children,
  mode = 'sync',
  onExitComplete,
}: AnimatePresenceProps) {
  // Use Framer Motion's AnimatePresence directly for better performance
  return (
    <FramerAnimatePresence mode={mode === 'wait' ? 'wait' : 'sync'} onExitComplete={onExitComplete}>
      {children}
    </FramerAnimatePresence>
  );
}
