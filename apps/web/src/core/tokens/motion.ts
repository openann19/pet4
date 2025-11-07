/**
 * Design Token Motion - Single Source of Truth
 * Generated from android-design-tokens/tokens/motion.json
 */

export const Motion = {
  durations: {
    instant: 0,
    fast: 150,
    normal: 240,
    smooth: 320,
    slow: 400,
    slower: 600,
  },
  
  easing: {
    standard: [0.2, 0, 0, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
    emphasized: [0.2, 0, 0, 1],
    spring: {
      damping: 15,
      stiffness: 250,
      mass: 0.9,
    },
  },
  
  transitions: {
    fade: {
      duration: 240,
      easing: 'standard' as const,
    },
    slide: {
      duration: 320,
      easing: 'emphasized' as const,
    },
    scale: {
      duration: 240,
      easing: 'decelerate' as const,
    },
    slideUp: {
      duration: 320,
      easing: 'emphasized' as const,
    },
    slideDown: {
      duration: 240,
      easing: 'accelerate' as const,
    },
  },
  
  components: {
    button: {
      press: {
        duration: 150,
        easing: 'spring' as const,
        scale: 0.95,
      },
      hover: {
        duration: 240,
        easing: 'standard' as const,
      },
    },
    card: {
      entry: {
        duration: 320,
        easing: 'emphasized' as const,
      },
      exit: {
        duration: 240,
        easing: 'accelerate' as const,
      },
    },
    sheet: {
      open: {
        duration: 320,
        easing: 'emphasized' as const,
      },
      close: {
        duration: 240,
        easing: 'accelerate' as const,
      },
    },
    modal: {
      open: {
        duration: 320,
        easing: 'emphasized' as const,
      },
      close: {
        duration: 240,
        easing: 'accelerate' as const,
      },
    },
    toast: {
      show: {
        duration: 240,
        easing: 'decelerate' as const,
      },
      hide: {
        duration: 150,
        easing: 'accelerate' as const,
      },
    },
  },
} as const;

