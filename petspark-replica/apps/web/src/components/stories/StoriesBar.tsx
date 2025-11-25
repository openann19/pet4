/**
 * StoriesBar Component
 *
 * Web stories bar with Framer Motion animations
 */

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Story } from '@petspark/shared';
import { groupStoriesByUser, filterActiveStories } from '@petspark/shared';
import { UserAvatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface StoriesBarProps {
    allStories: readonly Story[];
    currentUserId: string;
    currentUserName: string;
    currentUserPetId: string;
    currentUserPetName: string;
    currentUserPetPhoto: string;
    currentUserAvatar?: string;
    onStoryCreated?: (story: Story) => void;
    onStoryUpdate?: (story: Story) => void;
    onStoryRingPress?: (stories: readonly Story[]) => void;
}

interface StoryRingProps {
    stories: readonly Story[];
    petName: string;
    petPhoto: string;
    isOwn?: boolean;
    hasUnviewed?: boolean;
    onPress: () => void;
    index: number;
}

function StoryRing({ stories, petName, petPhoto, isOwn, hasUnviewed, onPress, index }: StoryRingProps) {
    return (
        <motion.div
            className="flex flex-col items-center cursor-pointer"
            onClick={onPress}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <div className="relative">
                <div
                    className={cn(
                        'w-16 h-16 rounded-full border-2 p-0.5 transition-all',
                        hasUnviewed
                            ? 'border-primary border-3'
                            : 'border-border'
                    )}
                >
                    <UserAvatar
                        user={{
                            id: stories[0]?.userId || '',
                            displayName: petName,
                            username: petName.toLowerCase(),
                            email: '',
                            avatar: petPhoto,
                            verified: false,
                            premium: false,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }}
                        size="lg"
                        className="w-full h-full"
                    />
                </div>
                {isOwn && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                        <span className="text-background text-xs font-bold">+</span>
                    </div>
                )}
            </div>
            <span className="text-xs text-foreground mt-1 max-w-[70px] text-center truncate">
                {petName}
            </span>
        </motion.div>
    );
}

export function StoriesBar({
    allStories,
    currentUserId,
    currentUserPetName,
    currentUserPetPhoto,
    onStoryRingPress,
}: StoriesBarProps): React.ReactElement {
    const activeStories = useMemo(() => filterActiveStories(allStories), [allStories]);
    const storiesByUser = useMemo(() => groupStoriesByUser(activeStories), [activeStories]);

    const ownStories = useMemo(
        () => activeStories.filter((s) => s.userId === currentUserId),
        [activeStories, currentUserId]
    );
    const otherStories = useMemo(
        () => activeStories.filter((s) => s.userId !== currentUserId),
        [activeStories, currentUserId]
    );

    const uniqueUserIds = useMemo(
        () => Array.from(new Set([...otherStories.map((s) => s.userId)])),
        [otherStories]
    );

    const handleStoryRingClick = useCallback(
        (userId: string) => {
            const userStories = storiesByUser.get(userId);
            if (userStories && userStories.length > 0) {
                onStoryRingPress?.(userStories);
            }
        },
        [storiesByUser, onStoryRingPress]
    );

    const handleOwnStoryClick = useCallback(() => {
        if (ownStories.length > 0) {
            onStoryRingPress?.(ownStories);
        } else {
            // TODO: Implement story creation dialog
            // This should open a modal/form for creating new stories
        }
    }, [ownStories, onStoryRingPress]);

    if (activeStories.length === 0 && ownStories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg border">
                <h3 className="text-lg font-semibold text-foreground mb-2">Share Your Story</h3>
                <p className="text-sm text-muted-foreground">Be the first to share a story!</p>
                <Button className="mt-4" onClick={handleOwnStoryClick}>
                    Create Story
                </Button>
            </div>
        );
    }

    return (
        <div className="py-3 px-4 bg-card">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                <StoryRing
                    stories={ownStories}
                    petName={currentUserPetName}
                    petPhoto={currentUserPetPhoto}
                    isOwn
                    onPress={handleOwnStoryClick}
                    index={0}
                />

                {uniqueUserIds.map((userId, idx) => {
                    const userStories = storiesByUser.get(userId);
                    if (!userStories || userStories.length === 0) return null;

                    const firstStory = userStories[0];
                    const hasUnviewed = !userStories.some(
                        (s) =>
                            Array.isArray(s.views) && s.views.some((v) => v.userId === currentUserId)
                    );

                    if (!firstStory) return null;
                    return (
                        <StoryRing
                            key={userId}
                            stories={userStories}
                            petName={firstStory.petName ?? 'Pet'}
                            petPhoto={firstStory.petPhoto ?? ''}
                            hasUnviewed={hasUnviewed}
                            onPress={() => handleStoryRingClick(userId)}
                            index={idx + 1}
                        />
                    );
                })}
            </div>
        </div>
    );
}
