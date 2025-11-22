// Transition type definition
export type Transition =
  | {
      type: 'spring';
      stiffness: number;
      damping: number;
      mass?: number;
    }
  | {
      duration: number;
      ease?: number[] | string;
    };

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export const smoothTransition: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
};

export const elasticTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
};

export const butterySmoothTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
  mass: 0.8,
};

export const smoothPageTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1],
};
