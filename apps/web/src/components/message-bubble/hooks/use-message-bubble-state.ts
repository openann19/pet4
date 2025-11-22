import { useState, useRef } from 'react';
import type { Message } from '@/lib/chat-types';

export function useMessageBubbleState(previousStatus?: Message['status']) {
  const [showReactions, setShowReactions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [imageError] = useState(false);
  const [isPlayingVoice] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [deletedMessage, setDeletedMessage] = useState<Message | null>(null);
  const [showPeek, setShowPeek] = useState(false);
  const [peekPosition, setPeekPosition] = useState<{ x: number; y: number } | undefined>();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleContentRef = useRef<HTMLDivElement>(null);
  const previousStatusRef = useRef<Message['status'] | undefined>(previousStatus);

  return {
    showReactions,
    setShowReactions,
    showContextMenu,
    setShowContextMenu,
    imageError,
    isPlayingVoice,
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
    bubbleRef,
    bubbleContentRef,
    previousStatusRef,
  };
}

