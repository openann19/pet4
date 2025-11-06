export const motion = {
  // tuned to feel premium, not cartoonish
  durations: { xs: 90, sm: 140, md: 220, lg: 360, xl: 600 },
  // critically damped springs for "expensive" feel
  spring: {
    soft:  { stiffness: 140, damping: 16, mass: 1 },
    smooth:{ stiffness: 220, damping: 22, mass: 1 },
    crisp: { stiffness: 320, damping: 28, mass: 1 },
  },
  curves: {
    // for fallback timings (web-only CSS or non-worklet)
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    emphasis: 'cubic-bezier(0.3, 0.7, 0, 1)',
  },
} as const;

