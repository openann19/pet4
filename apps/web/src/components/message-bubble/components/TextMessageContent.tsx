import { MotionView   type AnimatedStyle,
} from '@petspark/motion';
import { AnimatedAIWrapper, BubbleWrapperGodTier } from '@/components/chat/bubble-wrapper-god-tier';

import type { Message } from '@/lib/chat-types';
import type { useAITypingReveal } from '@/hooks/use-ai-typing-reveal';
import type { DeleteAnimationContext } from '@/hooks/use-delete-bubble-animation';

interface TextMessageContentProps {
  message: Message;
  isAIMessage: boolean;
  typingReveal: ReturnType<typeof useAITypingReveal>;
  deleteContext: DeleteAnimationContext;
  onDeleteFinish: () => void;
}

export function TextMessageContent({
  message,
  isAIMessage,
  typingReveal,
  deleteContext,
  onDeleteFinish,
}: TextMessageContentProps) {
  return (
    <BubbleWrapperGodTier
      isAIMessage={isAIMessage}
      messageText={message.content}
      timestamp={message.createdAt}
      deleteContext={deleteContext}
      onDeleteFinish={onDeleteFinish}
      enabled={true}
    >
      {isAIMessage && typingReveal.revealedText.length > 0 ? (
        <AnimatedAIWrapper enabled={true}>
          <>
            <MotionView style={typingReveal.animatedStyle as AnimatedStyle}>
              {typingReveal.revealedText}
            </MotionView>
            {!typingReveal.isComplete && (
              <MotionView style={typingReveal.cursorStyle as AnimatedStyle}>
                <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse">|</span>
              </MotionView>
            )}
          </>
        </AnimatedAIWrapper>
      ) : (
        <div className="wrap-break-word whitespace-pre-wrap">{message.content}</div>
      )}
    </BubbleWrapperGodTier>
  );
}

