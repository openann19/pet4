import { useMotionValue, animate, type AnimatedStyle } from '@petspark/motion';

export function useInteractiveAnimations() {
  const scale = useMotionValue(1);
  const translateY = useMotionValue(0);

  const handleHover = () => {
    void animate(scale, 1.1, { type: 'spring', stiffness: 400, damping: 10 });
    void animate(translateY, -2, { type: 'spring', stiffness: 400, damping: 10 });
  };

  const handleLeave = () => {
    void animate(scale, 1, { type: 'spring', stiffness: 400, damping: 10 });
    void animate(translateY, 0, { type: 'spring', stiffness: 400, damping: 10 });
  };

  const handleTap = () => {
    void animate(scale, 0.95, { duration: 0.1 }).then(() => {
      void animate(scale, 1, { duration: 0.1 });
    });
  };

  const templatesStyle: AnimatedStyle = {};

  const hoverAnimatedStyle: AnimatedStyle = {
    scale,
    y: translateY,
  };

  const tapAnimatedStyle: AnimatedStyle = {
    scale,
  };

  const buttonHoverAnimation = {
    animatedStyle: hoverAnimatedStyle,
    handleEnter: handleHover,
    handleLeave,
  } as const;

  const buttonTapAnimation = {
    animatedStyle: tapAnimatedStyle,
    handlePress: handleTap,
  } as const;

  return {
    templatesStyle,
    templateButtonHover: buttonHoverAnimation,
    templateButtonTap: buttonTapAnimation,
    stickerButtonHover: buttonHoverAnimation,
    stickerButtonTap: buttonTapAnimation,
    emojiButtonHover: buttonHoverAnimation,
    emojiButtonTap: buttonTapAnimation,
    sendButtonHover: buttonHoverAnimation,
    sendButtonTap: buttonTapAnimation,
  };
}
