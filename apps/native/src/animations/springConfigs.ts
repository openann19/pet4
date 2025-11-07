/**
 * Spring animation configurations for consistent motion design
 */

export const SpringConfig = {
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },
  snappy: {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  },
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 1.2,
  },
  smooth: {
    damping: 25,
    stiffness: 120,
    mass: 1,
  },
};

export const TimingConfig = {
  quick: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};
