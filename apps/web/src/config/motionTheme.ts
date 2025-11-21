export const motionTheme = {
  durations: {
    instant: 80,
    fast: 140,
    normal: 220,
    slow: 320,
    deliberate: 450,
    staggerItem: 60,
  },
  easing: {
    snappy: 'cubic-bezier(0.2, 0.9, 0.35, 1.0)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    gentle: 'cubic-bezier(0.25, 0.8, 0.4, 1.0)',
  },
  spring: {
    bouncy: { stiffness: 420, damping: 28, mass: 1 },
    responsive: { stiffness: 340, damping: 30, mass: 1 },
    settled: { stiffness: 260, damping: 32, mass: 1 },
  },
  scale: {
    hover: 1.03,
    press: 0.96,
    subtleHover: 1.01,
    modalInitial: 0.98,
    presenceInitial: 0.96,
    presenceExit: 0.9,
  },
  distance: {
    hoverLift: 4,
    modalOffsetY: 16,
    listStaggerY: 12,
    toastOffsetY: 24,
  },
  opacity: {
    faint: 0.12,
    subtle: 0.35,
    visible: 1.0,
  },
} as const;
