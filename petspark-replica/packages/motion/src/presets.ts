/**
 * Animation presets for common PETSPARK UI patterns
 */

import { ANIMATION_PRESETS, TRANSITIONS } from './animations'
import type { AnimationVariants, AnimationPreset } from './types'

// Common color constants
const SKELETON_BASE_COLOR = 'rgba(0,0,0,0.1)'

// PETSPARK-specific animation presets

// Pet card animations
export const petCardVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: TRANSITIONS.spring,
  },
  hover: {
    y: -12,
    scale: 1.03,
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    transition: TRANSITIONS.spring,
  },
  tap: { scale: 0.97 },
  disabled: { opacity: 0.4, scale: 0.9 },
}

// Like button animations
export const likeButtonVariants: AnimationVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  idle: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 5 },
  active: {
    scale: [1, 1.3, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  disabled: { scale: 0.8, opacity: 0.5 },
}

// Heart animation for likes
export const heartVariants: AnimationVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  burst: {
    scale: [1, 1.5, 0],
    opacity: [1, 1, 0],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

// Message bubble animations
export const messageBubbleVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: TRANSITIONS.spring,
  },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5 },
}

// Chat room list animations
export const chatRoomVariants: AnimationVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  hover: { x: 4, backgroundColor: 'rgba(0,0,0,0.02)' },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5 },
}

// Notification animations
export const notificationVariants: AnimationVariants = {
  hidden: { opacity: 0, y: -50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: TRANSITIONS.spring,
  },
  hover: { scale: 1.02 },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
  disabled: { opacity: 0.5 },
}

// Tab bar animations
export const tabBarVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITIONS.spring,
  },
  hover: {},
  tap: {},
  disabled: { opacity: 0.5 },
}

// Tab indicator animations
export const tabIndicatorVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  active: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  disabled: { opacity: 0.5 },
}

// Swipe card animations (for discovery)
export const swipeCardVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: TRANSITIONS.spring,
  },
  hover: { scale: 1.05 },
  swipeLeft: {
    x: -300,
    rotate: -30,
    opacity: 0,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  swipeRight: {
    x: 300,
    rotate: 30,
    opacity: 0,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  swipeUp: {
    y: -300,
    opacity: 0,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  disabled: { opacity: 0.5, scale: 0.9 },
}

// Image gallery animations
export const galleryImageVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: TRANSITIONS.spring,
  },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  disabled: { opacity: 0.5 },
}

// Loading skeleton animations
export const skeletonVariants: AnimationVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    backgroundColor: SKELETON_BASE_COLOR,
  },
  animate: {
    backgroundColor: [SKELETON_BASE_COLOR, 'rgba(0,0,0,0.05)', SKELETON_BASE_COLOR],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
  disabled: { opacity: 0.3 },
}

// Progress bar animations
export const progressVariants: AnimationVariants = {
  hidden: { width: 0, opacity: 0 },
  visible: {
    width: '100%',
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
    },
  },
  disabled: { opacity: 0.5 },
}

// Floating action button animations
export const fabVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: TRANSITIONS.springBouncy,
  },
  hover: {
    scale: 1.1,
    rotate: 90,
    transition: TRANSITIONS.spring,
  },
  tap: { scale: 0.9 },
  disabled: { opacity: 0.5, scale: 0.8 },
}

// Search bar animations
export const searchBarVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TRANSITIONS.spring,
  },
  focus: {
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    transition: TRANSITIONS.spring,
  },
  disabled: { opacity: 0.5 },
}

// Avatar animations
export const avatarVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: TRANSITIONS.spring,
  },
  hover: {
    scale: 1.1,
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    transition: TRANSITIONS.spring,
  },
  tap: { scale: 0.95 },
  disabled: { opacity: 0.5, scale: 0.9 },
}

// Badge animations
export const badgeVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: TRANSITIONS.springBouncy,
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'easeInOut',
    },
  },
  disabled: { opacity: 0.5 },
}

// Chip/tag animations
export const chipVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: TRANSITIONS.spring,
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: TRANSITIONS.spring,
  },
  tap: { scale: 0.95 },
  disabled: { opacity: 0.5 },
}

// Story animations
export const storyVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: TRANSITIONS.spring,
  },
  hover: {
    scale: 1.08,
    rotate: 5,
    transition: TRANSITIONS.spring,
  },
  tap: { scale: 0.95 },
  disabled: { opacity: 0.5 },
}

// Location pin animations
export const locationPinVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TRANSITIONS.springBouncy,
  },
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'easeInOut',
    },
  },
  disabled: { opacity: 0.5 },
}

// PETSPARK animation presets collection
export const PETSPARK_PRESETS: Record<string, AnimationPreset> = {
  petCard: {
    name: 'petCard',
    variants: petCardVariants,
    transition: TRANSITIONS.spring,
  },
  likeButton: {
    name: 'likeButton',
    variants: likeButtonVariants,
    transition: TRANSITIONS.spring,
  },
  heart: {
    name: 'heart',
    variants: heartVariants,
    transition: TRANSITIONS.default,
  },
  messageBubble: {
    name: 'messageBubble',
    variants: messageBubbleVariants,
    transition: TRANSITIONS.spring,
  },
  chatRoom: {
    name: 'chatRoom',
    variants: chatRoomVariants,
    transition: TRANSITIONS.default,
  },
  notification: {
    name: 'notification',
    variants: notificationVariants,
    transition: TRANSITIONS.spring,
  },
  tabBar: {
    name: 'tabBar',
    variants: tabBarVariants,
    transition: TRANSITIONS.spring,
  },
  tabIndicator: {
    name: 'tabIndicator',
    variants: tabIndicatorVariants,
    transition: TRANSITIONS.spring,
  },
  swipeCard: {
    name: 'swipeCard',
    variants: swipeCardVariants,
    transition: TRANSITIONS.spring,
  },
  galleryImage: {
    name: 'galleryImage',
    variants: galleryImageVariants,
    transition: TRANSITIONS.spring,
  },
  skeleton: {
    name: 'skeleton',
    variants: skeletonVariants,
    transition: TRANSITIONS.default,
  },
  progress: {
    name: 'progress',
    variants: progressVariants,
    transition: TRANSITIONS.default,
  },
  fab: {
    name: 'fab',
    variants: fabVariants,
    transition: TRANSITIONS.springBouncy,
  },
  searchBar: {
    name: 'searchBar',
    variants: searchBarVariants,
    transition: TRANSITIONS.spring,
  },
  avatar: {
    name: 'avatar',
    variants: avatarVariants,
    transition: TRANSITIONS.spring,
  },
  badge: {
    name: 'badge',
    variants: badgeVariants,
    transition: TRANSITIONS.springBouncy,
  },
  chip: {
    name: 'chip',
    variants: chipVariants,
    transition: TRANSITIONS.spring,
  },
  story: {
    name: 'story',
    variants: storyVariants,
    transition: TRANSITIONS.spring,
  },
  locationPin: {
    name: 'locationPin',
    variants: locationPinVariants,
    transition: TRANSITIONS.springBouncy,
  },
}

// Helper functions
export function getPetsparkPreset(name: keyof typeof PETSPARK_PRESETS): AnimationPreset {
  return PETSPARK_PRESETS[name]!
}

export function getAllPresets(): Record<string, AnimationPreset> {
  return { ...ANIMATION_PRESETS, ...PETSPARK_PRESETS }
}
