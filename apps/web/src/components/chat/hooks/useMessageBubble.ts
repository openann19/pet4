'use client';

/**
 * Consolidated hook for MessageBubble component
 *
 * Note: This hook exceeds standard line limits due to:
 * - Consolidation of 10+ animation hooks
 * - Complex state management (UI states, refs, animated values)
 * - Multiple event handlers with side effects
 * - Delete context computation and particle effects
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useSharedValue, withSpring, withTiming } from '@petspark/motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { useAITypingReveal } from '@/hooks/use-ai-typing-reveal';
import { useBubbleHoverTilt } from '@/hooks/use-bubble-hover-tilt';
import { useBubbleVariant } from '@/hooks/use-bubble-variant';
import {
  useDeleteBubbleAnimation,
  type DeleteAnimationContext,
} from '@/hooks/use-delete-bubble-animation';
import { useMessageBubbleAnimation } from '@/hooks/use-message-bubble-animation';
import { useMessageStatusMotion } from '@/effects/chat/status';
import { useNewMessageDrop } from '@/hooks/use-new-message-drop';
import { useParticleExplosionDelete } from '@/hooks/use-particle-explosion-delete';
import { useSmartHighlight } from '@/hooks/use-smart-highlight';
import { useUndoSendAnimation } from '@/hooks/use-undo-send-animation';
import { useVoiceWaveform } from '@/hooks/use-voice-waveform';
import { useHapticFeedback } from '../bubble-wrapper-god-tier/effects/useHapticFeedback';
import { useParticleBurstOnEvent } from '../bubble-wrapper-god-tier/effects/useParticleBurstOnEvent';
import type { Message, ReactionType } from '@/lib/chat-types';
import { getStableMessageReference } from '@/core/a11y/fixed-references';

export interface UseMessageBubbleOptions {
  message: Message;
  isOwn: boolean;
  isAIMessage: boolean;
  isNew: boolean;
  isHighlighted: boolean;
  variant?: 'ai-answer' | 'user-reply' | 'thread-message' | 'default';
  previousStatus?: Message['status'];
  index?: number;
  roomType?: 'direct' | 'group';
  isAdmin?: boolean;
  onLongPress?: () => void;
  onUndo?: (messageId: string) => void;
  onReact?: (messageId: string, reaction: ReactionType) => void;
  onCopy?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  isPlayingVoice?: boolean;
}

export interface UseMessageBubbleReturn {
  // Animation hooks
  hoverTilt: ReturnType<typeof useBubbleHoverTilt>;
  statusMotion: ReturnType<typeof useMessageStatusMotion>;
  typingReveal: ReturnType<typeof useAITypingReveal>;
  smartHighlight: ReturnType<typeof useSmartHighlight>;
  undoAnimation: ReturnType<typeof useUndoSendAnimation>;
  dropEffect: ReturnType<typeof useNewMessageDrop>;
  bubbleVariant: ReturnType<typeof useBubbleVariant>;
  messageBubbleAnimation: ReturnType<typeof useMessageBubbleAnimation>;
  voiceWaveform: ReturnType<typeof useVoiceWaveform>;
  deleteAnimation: ReturnType<typeof useDeleteBubbleAnimation>;

  // Effect hooks
  particleBurst: ReturnType<typeof useParticleBurstOnEvent>;
  hapticFeedback: ReturnType<typeof useHapticFeedback>;
  particleExplosion: ReturnType<typeof useParticleExplosionDelete>;

  // UI state
  showReactions: boolean;
  setShowReactions: (show: boolean) => void;
  showContextMenu: boolean;
  setShowContextMenu: (show: boolean) => void;
  showDeleteConfirmation: boolean;
  setShowDeleteConfirmation: (show: boolean) => void;
  isDeleting: boolean;
  setIsDeleting: (deleting: boolean) => void;
  showUndo: boolean;
  setShowUndo: (show: boolean) => void;
  deletedMessage: Message | null;
  setDeletedMessage: (message: Message | null) => void;
  showPeek: boolean;
  setShowPeek: (show: boolean) => void;
  peekPosition: { x: number; y: number } | undefined;
  setPeekPosition: (position: { x: number; y: number } | undefined) => void;

  // Refs
  bubbleRef: React.RefObject<HTMLDivElement>;
  bubbleContentRef: React.RefObject<HTMLDivElement>;
  previousStatusRef: React.MutableRefObject<Message['status'] | undefined>;

  // Animated values
  contextMenuOpacity: ReturnType<typeof useSharedValue<string | number>>;
  contextMenuScale: ReturnType<typeof useSharedValue<string | number>>;
  reactionsPickerOpacity: ReturnType<typeof useSharedValue<string | number>>;
  reactionsPickerScale: ReturnType<typeof useSharedValue<string | number>>;
  reactionsPickerTranslateY: ReturnType<typeof useSharedValue<string | number>>;

  // Computed values
  deleteContext: DeleteAnimationContext;
  stableReference: ReturnType<typeof getStableMessageReference>;

  // Handlers
  handleLongPress: () => void;
  handleReact: (reaction: ReactionType) => void;
  handleCopy: () => void;
  handleReply: () => void;
  handleReport: () => void;
  handleDeleteClick: () => void;
  handleDeleteConfirm: () => void;
  handleDeleteCancel: () => void;
  handleUndoDelete: () => void;
  handleRetry: () => void;

  // Callbacks
  onReact?: (messageId: string, reaction: ReactionType) => void;
  onCopy?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onUndo?: (messageId: string) => void;
}

/* eslint-disable max-lines-per-function -- Consolidated hook managing multiple animations, state, and handlers */
export function useMessageBubble({
  message,
  isOwn,
  isAIMessage,
  isNew,
  isHighlighted,
  variant = 'default',
  previousStatus,
  index = 0,
  roomType = 'direct',
  isAdmin = false,
  onLongPress: onLongPressCallback,
  onUndo: onUndoCallback,
  onReact: onReactCallback,
  onCopy: onCopyCallback,
  onReply: onReplyCallback,
  onReport: onReportCallback,
  onDelete: onDeleteCallback,
  onRetry: onRetryCallback,
  isPlayingVoice = false,
}: UseMessageBubbleOptions): UseMessageBubbleReturn {
  // UI State
  const [showReactions, setShowReactions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [deletedMessage, setDeletedMessage] = useState<Message | null>(null);
  const [showPeek, setShowPeek] = useState(false);
  const [peekPosition, setPeekPosition] = useState<{ x: number; y: number } | undefined>();

  // Refs
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleContentRef = useRef<HTMLDivElement>(null);
  const previousStatusRef = useRef<Message['status'] | undefined>(previousStatus);

  // Create stable message reference for accessibility
  const stableReference = useMemo(() => {
    return getStableMessageReference(
      message.id,
      message.createdAt,
      message.senderName ?? 'Unknown',
      message.content,
      true // use relative timestamp
    );
  }, [message.id, message.createdAt, message.senderName, message.content]);

  // Effect hooks
  const particleBurst = useParticleBurstOnEvent({ enabled: true });
  const hapticFeedback = useHapticFeedback({ enabled: true });

  // Animation hooks
  const hoverTilt = useBubbleHoverTilt({
    enabled: typeof window !== 'undefined' && !isOwn,
  });

  const statusMotion = useMessageStatusMotion({
    status: message.status,
    ...(previousStatusRef.current !== undefined
      ? { previousStatus: previousStatusRef.current }
      : {}),
    isOwnMessage: isOwn,
  });

  const typingReveal = useAITypingReveal({
    text: message.content,
    enabled: isAIMessage && message.type === 'text',
    typingSpeed: 30,
  });

  const smartHighlight = useSmartHighlight({
    isHighlighted,
    highlightColor: 'rgba(255, 215, 0, 0.3)',
    glowColor: 'rgba(59, 130, 246, 0.6)',
  });

  const undoAnimation = useUndoSendAnimation({
    onComplete: () => {
      if (onUndoCallback) {
        onUndoCallback(message.id);
      }
    },
  });

  const dropEffect = useNewMessageDrop({
    isNew,
    delay: index * 50,
    dropHeight: -50,
    bounceIntensity: 15,
  });

  const bubbleVariant = useBubbleVariant({
    variant: variant ?? 'default',
    enabled: isNew,
    delay: index * 30,
  });

  const messageBubbleAnimation = useMessageBubbleAnimation({
    index,
    staggerDelay: 50,
    isHighlighted,
    isNew,
    onPress: () => {
      // Handle tap
    },
    onLongPress: () => {
      handleLongPress();
      hapticFeedback.trigger('longPress');
    },
    hapticFeedback: true,
  });

  const voiceWaveform = useVoiceWaveform({
    waveform: message.metadata?.voiceNote?.waveform ?? [],
    isPlaying: isPlayingVoice,
    barCount: 20,
  });

  // Animated values for UI elements
  const contextMenuOpacity = useSharedValue<number>(0);
  const contextMenuScale = useSharedValue<number>(0.95);
  const reactionsPickerOpacity = useSharedValue<number>(0);
  const reactionsPickerScale = useSharedValue<number>(0.9);
  const reactionsPickerTranslateY = useSharedValue<number>(10);

  // Delete context computation
  const getDeleteContext = (): DeleteAnimationContext => {
    if (isAdmin && !isOwn) {
      return 'admin-delete';
    }
    if (
      message.type === 'sticker' ||
      (message.type === 'text' && /^[\p{Emoji}]+$/u.test(message.content))
    ) {
      return 'emoji-media';
    }
    if (roomType === 'group') {
      return 'group-chat';
    }
    return 'self-delete';
  };

  const deleteContext = getDeleteContext();

  const particleExplosion = useParticleExplosionDelete({
    enabled: deleteContext === 'emoji-media',
  });

  const deleteAnimation = useDeleteBubbleAnimation({
    context: deleteContext,
    onFinish: () => {
      setIsDeleting(false);
      if (roomType === 'group' && !isOwn) {
        return;
      }
      setShowUndo(true);
      setTimeout(() => {
        setShowUndo(false);
      }, 5000);
    },
    hapticFeedback: true,
  });

  // Update previous status ref
  useEffect(() => {
    previousStatusRef.current = message.status;
  }, [message.status]);

  // Animate context menu
  useEffect(() => {
    if (showContextMenu) {
      contextMenuOpacity.value = withSpring(1, springConfigs.smooth);
      contextMenuScale.value = withSpring(1, springConfigs.smooth);
    } else {
      contextMenuOpacity.value = withTiming(0, timingConfigs.fast);
      contextMenuScale.value = withTiming(0.95, timingConfigs.fast);
    }
  }, [showContextMenu, contextMenuOpacity, contextMenuScale]);

  // Animate reactions picker
  useEffect(() => {
    if (showReactions) {
      reactionsPickerOpacity.value = withSpring(1, springConfigs.smooth);
      reactionsPickerScale.value = withSpring(1, springConfigs.bouncy);
      reactionsPickerTranslateY.value = withSpring(0, springConfigs.smooth);
    } else {
      reactionsPickerOpacity.value = withTiming(0, timingConfigs.fast);
      reactionsPickerScale.value = withTiming(0.9, timingConfigs.fast);
      reactionsPickerTranslateY.value = withTiming(10, timingConfigs.fast);
    }
  }, [showReactions, reactionsPickerOpacity, reactionsPickerScale, reactionsPickerTranslateY]);

  // Trigger highlight animation
  useEffect(() => {
    if (isHighlighted) {
      smartHighlight.trigger();
      messageBubbleAnimation.animateHighlight();
    }
  }, [isHighlighted, smartHighlight, messageBubbleAnimation]);

  // Handlers
  const handleLongPress = () => {
    if (isOwn && message.status === 'sending') return;

    // Show MessagePeek if feature is enabled
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      setPeekPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setShowPeek(true);
    }

    setShowContextMenu(true);

    if (onLongPressCallback) {
      onLongPressCallback();
    }
  };

  const handleReact = (reaction: ReactionType) => {
    if (onReactCallback) {
      onReactCallback(message.id, reaction);
    }
    messageBubbleAnimation.animateReaction(reaction);
    hapticFeedback.trigger('react');

    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      particleBurst.triggerBurst('reaction', centerX, centerY, reaction);
    }

    setShowReactions(false);
    setShowContextMenu(false);
  };

  const handleCopy = () => {
    if (onCopyCallback) {
      onCopyCallback(message.id);
    }
    setShowContextMenu(false);
  };

  const handleReply = () => {
    if (onReplyCallback) {
      onReplyCallback(message.id);
    }
    setShowContextMenu(false);
  };

  const handleReport = () => {
    if (onReportCallback) {
      onReportCallback(message.id);
    }
    setShowContextMenu(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
    setShowContextMenu(false);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirmation(false);
    setIsDeleting(true);
    setDeletedMessage(message);

    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (deleteContext === 'emoji-media') {
        const emojiColors = message.content
          .match(/[\p{Emoji}]/gu)
          ?.map(() => {
            const colors = [
              'hsl(var(--primary))',
              'hsl(var(--secondary))',
              'hsl(var(--accent))',
              'hsl(var(--success))',
              'hsl(var(--warning))',
              'hsl(var(--info))',
              'hsl(var(--muted))',
            ];
            return colors[Math.floor(Math.random() * colors.length)] ?? 'hsl(var(--primary))';
          })
          .filter((color): color is string => color !== undefined) ?? [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(var(--accent))',
        ];

        particleExplosion.triggerExplosion(centerX, centerY, emojiColors);
      }

      particleBurst.triggerBurst('delete', centerX, centerY);
      hapticFeedback.trigger('delete');
    }

    deleteAnimation.triggerDelete();

    setTimeout(() => {
      if (onDeleteCallback) {
        onDeleteCallback(message.id);
      }
    }, 350);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  const handleUndoDelete = () => {
    setShowUndo(false);
    setIsDeleting(false);
    if (onUndoCallback && deletedMessage) {
      onUndoCallback(deletedMessage.id);
    }
    setDeletedMessage(null);
  };

  const handleRetry = () => {
    if (onRetryCallback) {
      onRetryCallback(message.id);
    }
  };

  return {
    // Animation hooks
    hoverTilt,
    statusMotion,
    typingReveal,
    smartHighlight,
    undoAnimation,
    dropEffect,
    bubbleVariant,
    messageBubbleAnimation,
    voiceWaveform,
    deleteAnimation,

    // Effect hooks
    particleBurst,
    hapticFeedback,
    particleExplosion,

    // UI state
    showReactions,
    setShowReactions,
    showContextMenu,
    setShowContextMenu,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    isDeleting,
    setIsDeleting,
    showUndo,
    setShowUndo,
    deletedMessage,
    setDeletedMessage,
    showPeek,
    setShowPeek,
    peekPosition,
    setPeekPosition,

    // Refs
    bubbleRef,
    bubbleContentRef,
    previousStatusRef,

    // Animated values
    contextMenuOpacity: contextMenuOpacity as ReturnType<typeof useSharedValue<string | number>>,
    contextMenuScale: contextMenuScale as ReturnType<typeof useSharedValue<string | number>>,
    reactionsPickerOpacity: reactionsPickerOpacity as ReturnType<
      typeof useSharedValue<string | number>
    >,
    reactionsPickerScale: reactionsPickerScale as ReturnType<
      typeof useSharedValue<string | number>
    >,
    reactionsPickerTranslateY: reactionsPickerTranslateY as ReturnType<
      typeof useSharedValue<string | number>
    >,

    // Computed values
    deleteContext,
    stableReference,

    // Handlers
    handleLongPress,
    handleReact,
    handleCopy,
    handleReply,
    handleReport,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleUndoDelete,
    handleRetry,

    // Callbacks (for component to use)
    onReact: onReactCallback,
    onCopy: onCopyCallback,
    onReply: onReplyCallback,
    onReport: onReportCallback,
    onDelete: onDeleteCallback,
    onRetry: onRetryCallback,
    onUndo: onUndoCallback,
  };
}
