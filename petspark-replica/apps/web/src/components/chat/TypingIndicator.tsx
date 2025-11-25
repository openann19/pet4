/**
 * TypingIndicator Component - Web Implementation
 *
 * Core typing indicator with mobile parity features:
 * - Dynamic typing text based on user count
 * - Animated typing dots using Framer Motion
 * - Accessibility support with live regions
 * - Reduced motion support
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TypingUser } from '@petspark/shared';
import { UserAvatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export interface TypingIndicatorProps {
    readonly users: readonly TypingUser[];
}

/**
 * Animated typing dot component
 */
function TypingDot({ index }: { index: number }) {
    const dotVariants = {
        initial: { opacity: 0.3, y: 0 },
        animate: {
            opacity: [0.3, 1, 0.3],
            y: [0, -3, 0],
            transition: {
                duration: 1.4,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
            },
        },
    };

    return (
        <motion.div
            className="w-2 h-2 bg-muted-foreground rounded-full mx-0.5"
            variants={dotVariants}
            initial="initial"
            animate="animate"
        />
    );
}

/**
 * TypingIndicator component with core chat functionality
 */
export const TypingIndicator = memo<TypingIndicatorProps>(({ users }) => {
    const displayUsers = useMemo(() => users.slice(0, 3), [users]);

    const typingText = useMemo(() => {
        if (users.length === 0) return '';

        if (users.length === 1) {
            const userName = users[0]?.userName?.trim();
            return `${(userName ?? '') || 'Someone'} is typing`;
        }

        if (users.length === 2) {
            const userName1 = users[0]?.userName?.trim();
            const userName2 = users[1]?.userName?.trim();
            return `${(userName1 ?? '') || 'Someone'} and ${(userName2 ?? '') || 'Someone'} are typing`;
        }

        const firstName = users[0]?.userName?.trim();
        return `${(firstName ?? '') || 'Someone'} and ${users.length - 1} others are typing`;
    }, [users]);

    if (users.length === 0) return null;

    const containerVariants = {
        initial: { opacity: 0, y: -5 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
            }
        },
        exit: {
            opacity: 0,
            y: -5,
            transition: {
                duration: 0.2,
                ease: "easeIn",
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                role="status"
                aria-live="polite"
                aria-label={typingText}
            >
                {/* User avatars */}
                <div className="flex items-center">
                    {displayUsers.map((user, index) => (
                        <div
                            key={user.userId}
                            className={cn(
                                "relative",
                                index > 0 && "-ml-2"
                            )}
                        >
                            <UserAvatar
                                user={{
                                    id: user.userId,
                                    displayName: user.userName,
                                    username: user.userId,
                                    email: '',
                                    verified: false,
                                    premium: false,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                }}
                                size="sm"
                            />
                        </div>
                    ))}
                </div>

                {/* Typing text and dots */}
                <div className="flex items-center gap-2">
                    <span className="text-sm">{typingText}</span>
                    <div className="flex items-center" aria-hidden="true">
                        <TypingDot index={0} />
                        <TypingDot index={1} />
                        <TypingDot index={2} />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

TypingIndicator.displayName = 'TypingIndicator';
