import { useAnimatedStyle } from '@petspark/motion';
import {
  useButtonAnimations,
  useTemplatesPanelAnimations
} from './useChatAnimations';

/**
 * Hook for managing chat input bar button animations
 * Adapts useButtonAnimations to match ChatInputBar interface
 */
export function useChatInputAnimations(showTemplates: boolean) {
  const {
    templateButtonHover: _templateHoverBase,
    templateButtonHoverStyle,
    templateButtonTap: _templateTapBase,
    templateButtonTapStyle,
    stickerButtonHover: _stickerHoverBase,
    stickerButtonHoverStyle,
    stickerButtonTap: _stickerTapBase,
    stickerButtonTapStyle,
    emojiButtonHover: _emojiHoverBase,
    emojiButtonHoverStyle,
    emojiButtonTap: _emojiTapBase,
    emojiButtonTapStyle,
    sendButtonHover: _sendHoverBase,
    sendButtonHoverStyle,
    sendButtonTap: _sendTapBase,
    sendButtonTapStyle,
  } = useButtonAnimations();

  const { templatesStyle } = useTemplatesPanelAnimations(showTemplates);

  // Adapt to ChatInputBar expected format
  const templateButtonHover = {
    animatedStyle: templateButtonHoverStyle,
    handleEnter: () => {
      // Animation handled by animatedStyle
    },
    handleLeave: () => {
      // Animation handled by animatedStyle
    },
  };

  const templateButtonTap = {
    animatedStyle: templateButtonTapStyle,
    handlePress: () => {
      // Animation handled by animatedStyle
    },
  };

  const stickerButtonTap = {
    animatedStyle: stickerButtonTapStyle,
  };

  const stickerButtonHover = {
    animatedStyle: stickerButtonHoverStyle,
    handleEnter: () => {
      // Animation handled by animatedStyle
    },
    handleLeave: () => {
      // Animation handled by animatedStyle
    },
  };

  const emojiButtonTap = {
    animatedStyle: emojiButtonTapStyle,
  };

  const emojiButtonHover = {
    animatedStyle: emojiButtonHoverStyle,
    handleEnter: () => {
      // Animation handled by animatedStyle
    },
    handleLeave: () => {
      // Animation handled by animatedStyle
    },
  };

  const sendButtonHover = {
    animatedStyle: sendButtonHoverStyle,
    handleEnter: () => {
      // Animation handled by animatedStyle
    },
    handleLeave: () => {
      // Animation handled by animatedStyle
    },
  };

  const sendButtonTap = {
    animatedStyle: sendButtonTapStyle,
  };

  return {
    templatesStyle,
    templateButtonHover,
    templateButtonTap,
    stickerButtonTap,
    stickerButtonHover,
    emojiButtonTap,
    emojiButtonHover,
    sendButtonHover,
    sendButtonTap,
  };
}

