export const glowPulse = {
  boxShadow: [
    '0 0 20px rgba(var(--primary), 0.3)',
    '0 0 40px rgba(var(--primary), 0.6)',
    '0 0 20px rgba(var(--primary), 0.3)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const shimmerEffect = {
  backgroundPosition: ['-200% 0', '200% 0'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
};

export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const rotateAnimation = {
  rotate: [0, 360],
  transition: {
    duration: 20,
    repeat: Infinity,
    ease: 'linear',
  },
};

export const pulseScale = {
  scale: [1, 1.1, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const heartbeat = {
  scale: [1, 1.2, 1, 1.2, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
    repeatDelay: 1,
  },
};

export const wiggle = {
  rotate: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 2,
  },
};

export const slideIndicator = {
  x: '100%',
  transition: {
    duration: 0.3,
    ease: 'easeInOut',
  },
};
