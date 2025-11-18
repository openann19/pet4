'use client';
import { cn } from '@/lib/utils';
import { type ReactNode, useCallback, useState } from 'react';
import { motion } from '@petspark/motion';
import { TypingDotsWeb } from './TypingDotsWeb';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface WebBubbleWrapperProps {
  children: ReactNode;
  isIncoming?: boolean;
  index?: number;
  onClick?: () => void;
  onLongPress?: () => void;
  hasReaction?: boolean;
  reactionEmoji?: string;
  showTyping?: boolean;
  className?: string;
  bubbleClassName?: string;
  enable3DTilt?: boolean;
  enableSwipeReply?: boolean;
  staggerDelay?: number;
  glowOpacity?: number;
  glowIntensity?: number;
}

const DEFAULT_STAGGER_DELAY = 0.04;

export function WebBubbleWrapper({
  children,
  isIncoming = false,
  index = 0,
  onClick,
  onLongPress,
  hasReaction = false,
  reactionEmoji = '❤️',
  showTyping = false,
  className,
  bubbleClassName,
  enable3DTilt = true,
  staggerDelay = DEFAULT_STAGGER_DELAY,
  glowOpacity = 0,
  glowIntensity = 0.85,
}: WebBubbleWrapperProps) {
  const _uiConfig = useUIConfig();
  const [isHovered, setIsHovered] = useState(false);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onLongPress) {
        onLongPress();
      }
    },
    [onLongPress]
  );

  const entryDirection = isIncoming ? -20 : 20;

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20, 
        x: entryDirection,
        scale: 0.95,
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        x: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.4,
        delay: index * staggerDelay,
        ease: 'easeOut',
      }}
      onClick={() => void onClick()}
      onContextMenu={handleContextMenu}
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow trail effect */}
      {glowOpacity > 0 && (
        <motion.div
          className="absolute inset-0 -m-1 rounded-2xl pointer-events-none -z-10"
          style={{
            background: `radial-gradient(circle, ${
              isIncoming ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.8)'
            } 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: glowOpacity * glowIntensity,
          }}
        />
      )}
      
      <motion.div
        animate={{
          scale: isHovered && enable3DTilt ? 1.02 : 1,
          rotateX: enable3DTilt && isHovered ? 2 : 0,
          rotateY: enable3DTilt && isHovered ? (isIncoming ? -2 : 2) : 0,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-2 shadow-lg transition-all duration-200',
          isIncoming
            ? 'bg-neutral-800 text-white self-start rounded-bl-sm'
            : 'bg-blue-600 text-white self-end rounded-br-sm',
          bubbleClassName
        )}
      >
        {showTyping ? (
          <TypingDotsWeb 
            dotColor={isIncoming ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))'} 
            dotSize={6} 
          />
        ) : (
          children
        )}
      </motion.div>
      
      {hasReaction && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: 0.1, 
            type: 'spring', 
            stiffness: 400, 
            damping: 20 
          }}
          className="absolute -bottom-4 -right-2 text-base pointer-events-none"
        >
          {reactionEmoji}
        </motion.div>
      )}
    </motion.div>
  );
}
