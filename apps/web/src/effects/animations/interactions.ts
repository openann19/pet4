import { springTransition, smoothTransition } from './transitions'

export const hoverLift = {
  scale: 1.05,
  y: -4,
  transition: springTransition
}

export const hoverGrow = {
  scale: 1.02,
  transition: springTransition
}

export const tapShrink = {
  scale: 0.95,
  transition: { duration: 0.1 }
}

export const cardHover = {
  y: -8,
  scale: 1.02,
  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
  transition: smoothTransition
}

export const buttonHover = {
  scale: 1.05,
  boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.2)',
  transition: springTransition
}

export const iconHover = {
  scale: 1.15,
  rotate: 5,
  transition: springTransition
}

