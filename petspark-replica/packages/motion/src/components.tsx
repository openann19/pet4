/**
 * Animated components for PETSPARK
 */

import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { PETSPARK_PRESETS } from './presets';
import type { AnimationVariants, MotionProps as CustomMotionProps } from './types';

// Animated Card component
export interface AnimatedCardProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly whileHover?: boolean;
  readonly whileTap?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, preset = 'petCard', variants, whileHover = true, whileTap = true, ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={animationVariants}
        initial="hidden"
        animate="visible"
        {...(whileHover && { whileHover: 'hover' })}
        {...(whileTap && { whileTap: 'tap' })}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Animated Button component
export interface AnimatedButtonProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, preset = 'button', variants, disabled = false, onPress, ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    return (
      <motion.button
        ref={ref}
        className={className}
        variants={animationVariants}
        initial="hidden"
        animate="visible"
        {...(!disabled && { whileHover: 'hover' })}
        {...(!disabled && { whileTap: 'tap' })}
        disabled={disabled}
        onClick={onPress}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

// Animated Modal component
export interface AnimatedModalProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly isOpen: boolean;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly onClose?: () => void;
}

export const AnimatedModal = forwardRef<HTMLDivElement, AnimatedModalProps>(
  ({ children, className, isOpen, preset = 'modal', variants, onClose, ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            className={className}
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            {...(true && { exit: 'hidden' })}
            onClick={onClose}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

AnimatedModal.displayName = 'AnimatedModal';

// Animated List component
export interface AnimatedListProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly staggerDelay?: number;
}

export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ children, className, preset = 'list', variants, staggerDelay = 0.1, ...props }, ref) => {
    let animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    // Add stagger to list variants
    if (animationVariants?.visible && typeof animationVariants.visible === 'object') {
      animationVariants = {
        ...animationVariants,
        visible: {
          ...animationVariants.visible,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0,
          },
        },
      };
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={animationVariants}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedList.displayName = 'AnimatedList';

// Animated List Item component
export interface AnimatedListItemProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
}

export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ children, className, preset = 'listItem', variants, ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={animationVariants}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedListItem.displayName = 'AnimatedListItem';

// Animated Avatar component
export interface AnimatedAvatarProps extends CustomMotionProps {
  readonly src?: string;
  readonly alt?: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AnimatedAvatar = forwardRef<HTMLDivElement, AnimatedAvatarProps>(
  ({ children, className, preset = 'avatar', variants, size = 'md', ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20',
    };

    return (
      <motion.div
        ref={ref}
        className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className || ''}`}
        variants={animationVariants}
        initial="hidden"
        animate="visible"
        {...({ whileHover: 'hover' })}
        {...({ whileTap: 'tap' })}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedAvatar.displayName = 'AnimatedAvatar';

// Animated Badge component
export interface AnimatedBadgeProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly pulse?: boolean;
}

export const AnimatedBadge = forwardRef<HTMLSpanElement, AnimatedBadgeProps>(
  ({ children, className, preset = 'badge', variants, pulse = false, ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    return (
      <motion.span
        ref={ref}
        className={`inline-flex items-center ${className || ''}`}
        variants={animationVariants}
        initial="hidden"
        animate={pulse ? 'pulse' : 'visible'}
        {...({ whileHover: 'hover' })}
        {...({ whileTap: 'tap' })}
        {...props}
      >
        {children}
      </motion.span>
    );
  }
);

AnimatedBadge.displayName = 'AnimatedBadge';

// Animated Notification component
export interface AnimatedNotificationProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly isVisible: boolean;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly onClose?: () => void;
}

export const AnimatedNotification = forwardRef<HTMLDivElement, AnimatedNotificationProps>(
  ({ children, className, isVisible, preset = 'notification', variants, onClose, ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            className={className}
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            {...(true && { exit: 'hidden' })}
            onClick={onClose}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

AnimatedNotification.displayName = 'AnimatedNotification';

// Animated Skeleton component
export interface AnimatedSkeletonProps extends CustomMotionProps {
  readonly className?: string;
  readonly preset?: keyof typeof PETSPARK_PRESETS;
  readonly variants?: AnimationVariants;
  readonly width?: string | number;
  readonly height?: string | number;
}

export const AnimatedSkeleton = forwardRef<HTMLDivElement, AnimatedSkeletonProps>(
  ({ className, preset = 'skeleton', variants, width, height, ...props }, ref) => {
    const animationVariants = variants || PETSPARK_PRESETS[preset]?.variants;

    return (
      <motion.div
        ref={ref}
        className={`rounded ${className || ''}`}
        style={{ width, height }}
        variants={animationVariants}
        initial="hidden"
        animate="animate"
        {...props}
      />
    );
  }
);

AnimatedSkeleton.displayName = 'AnimatedSkeleton';

// Container component for AnimatePresence
export interface AnimatedContainerProps extends CustomMotionProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly mode?: 'wait' | 'sync' | 'popLayout';
}

export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(
  ({ children, className, mode = 'sync', ...props }, ref) => {
    return (
      <AnimatePresence mode={mode}>
        <motion.div
          ref={ref}
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          {...props}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }
);

AnimatedContainer.displayName = 'AnimatedContainer';
