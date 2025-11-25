/**
 * MessageBubble Component - Web Implementation
 *
 * Core chat message bubble with mobile parity features:
 * - Text message display with proper styling
 * - Own vs other message positioning
 * - Basic status indicators
 * - Framer Motion animations
 * - Accessibility support
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Message, MessageStatus } from '@petspark/shared';
import { UserAvatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    isClusterStart: boolean;
    isClusterEnd: boolean;
    index?: number;
    isNew?: boolean;
    isHighlighted?: boolean;
    variant?: 'ai-answer' | 'user-reply' | 'thread-message' | 'default';
    previousStatus?: MessageStatus;
    roomType?: 'direct' | 'group';
    onReact?: (messageId: string, reaction: string) => void;
    onReply?: (messageId: string) => void;
    onCopy?: (messageId: string) => void;
    onDelete?: (messageId: string) => void;
    showTimestamp?: boolean;
}

/**
 * Status indicator component for message delivery/read status
 */
function StatusIndicator({ status }: { status: MessageStatus }) {
    switch (status) {
        case 'sending':
            return <span className="text-xs text-muted-foreground">Sending...</span>;
        case 'sent':
            return <span className="text-xs text-muted-foreground">✓</span>;
        case 'delivered':
            return <span className="text-xs text-muted-foreground">✓✓</span>;
        case 'read':
            return <span className="text-xs text-blue-500">✓✓</span>;
        case 'failed':
            return <span className="text-xs text-red-500">Failed</span>;
        default:
            return null;
    }
}

/**
 * MessageBubble component with core chat functionality
 */
export const MessageBubble = memo<MessageBubbleProps>(({
    message,
    isOwn,
    isClusterStart,
    isClusterEnd: _isClusterEnd,
    index = 0,
    isNew = false,
    isHighlighted = false,
    variant: _variant = 'default',
    previousStatus: _previousStatus,
    roomType: _roomType = 'direct',
    onReact: _onReact,
    onReply: _onReply,
    onCopy: _onCopy,
    onDelete: _onDelete,
    showTimestamp = false,
}) => {
    const messageVariants = {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: index * 0.05
            }
        },
        hover: { scale: 1.02, transition: { duration: 0.2 } },
        tap: { scale: 0.98, transition: { duration: 0.1 } }
    };

    const bubbleClass = cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
        "break-words text-sm",
        isOwn
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted text-foreground",
        isHighlighted && "ring-2 ring-primary ring-offset-2",
        isNew && "animate-pulse"
    );

    const containerClass = cn(
        "flex items-end gap-2 mb-1",
        isOwn ? "flex-row-reverse" : "flex-row",
        !isClusterStart && (isOwn ? "mr-12" : "ml-12")
    );

    return (
        <motion.div
            className={containerClass}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            layout
        >
            {/* Avatar for other users' messages */}
            {!isOwn && isClusterStart && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                >
                    <UserAvatar
                        user={{
                            id: message.senderId || message.author.id,
                            displayName: message.senderName || message.author.displayName,
                            username: message.senderId || message.author.username,
                            email: message.author.email,
                            verified: message.author.verified,
                            premium: message.author.premium,
                            createdAt: message.author.createdAt,
                            updatedAt: message.author.updatedAt,
                        }}
                        size="sm"
                    />
                </motion.div>
            )}

            {/* Message bubble */}
            <div className="flex flex-col space-y-1">
                <motion.div className={bubbleClass}>
                    {message.type === 'text' && (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                    )}

                    {/* TODO: Add support for other message types (image, video, sticker, etc.) */}
                </motion.div>

                {/* Timestamp and status */}
                {(showTimestamp || isOwn) && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs text-muted-foreground px-1",
                        isOwn && "flex-row-reverse"
                    )}>
                        {showTimestamp && (
                            <span>
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        )}
                        {isOwn && <StatusIndicator status={message.status || 'sent' as MessageStatus} />}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

MessageBubble.displayName = 'MessageBubble';
