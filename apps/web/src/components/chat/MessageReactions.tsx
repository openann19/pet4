'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { MessageReaction } from '@/lib/chat-types';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { haptics } from '@/lib/haptics';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface MessageReactionsProps {
  reactions: MessageReaction[];
  availableReactions: readonly string[];
  onReact: (emoji: string) => void;
  currentUserId: string;
}

export default function MessageReactions({
  reactions,
  availableReactions,
  onReact,
  currentUserId,
}: MessageReactionsProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const [showPicker, setShowPicker] = useState(false);
  const [visibleReactions, setVisibleReactions] = useState<Set<string>>(new Set());

  const reactionGroups = useMemo(() => {
    return reactions.reduce(
      (acc, reaction) => {
        if (!reaction.emoji) return acc;
        acc[reaction.emoji] ??= [];
        const group = acc[reaction.emoji];
        if (group !== undefined) {
          group.push(reaction);
        }
        return acc;
      },
      {} as Record<string, MessageReaction[]>
    );
  }, [reactions]);

  const hasUserReacted = useCallback(
    (reactionList: MessageReaction[]): boolean => {
      return reactionList.some((r) => r.userId === currentUserId);
    },
    [currentUserId]
  );

  // Track visible reactions for exit animations
  useEffect(() => {
    const currentEmojis = new Set(Object.keys(reactionGroups));
    setVisibleReactions((prev) => {
      const next = new Set(prev);
      // Add new reactions
      currentEmojis.forEach((emoji) => {
        next.add(emoji);
      });
      // Remove reactions that are no longer present
      prev.forEach((emoji) => {
        if (!currentEmojis.has(emoji)) {
          next.delete(emoji);
        }
      });
      return next;
    });
  }, [reactionGroups]);

  const handleReactionClick = useCallback(
    (emoji: string) => {
      haptics.selection();
      onReact(emoji);
    },
    [onReact]
  );

  const handlePickerReaction = useCallback(
    (emoji: string) => {
      haptics.selection();
      onReact(emoji);
      setShowPicker(false);
    },
    [onReact]
  );

  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {Object.entries(reactionGroups).map(([emoji, reactionList]) => {
        if (!visibleReactions.has(emoji)) return null;

        const userReacted = hasUserReacted(reactionList);

        return (
          <ReactionButton
            key={emoji}
            emoji={emoji}
            count={reactionList.length}
            userReacted={userReacted}
            reactions={reactionList}
            onClick={() => { handleReactionClick(emoji); }}
          />
        );
      })}

      <AddReactionButton
        showPicker={showPicker}
        onTogglePicker={setShowPicker}
        availableReactions={availableReactions}
        onSelectReaction={handlePickerReaction}
      />
    </div>
  );
}

interface ReactionButtonProps {
  emoji: string;
  count: number;
  userReacted: boolean;
  reactions: MessageReaction[];
  onClick: () => void;
}

function ReactionButton({
  emoji,
  count,
  userReacted,
  reactions,
  onClick,
}: ReactionButtonProps): React.JSX.Element {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const hoverScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, springConfigs.bouncy);
    opacity.value = withTiming(1, timingConfigs.fast);
  }, [scale, opacity]);

  const bounce = useBounceOnTap({
    onPress: onClick,
    hapticFeedback: true,
    scale: 0.95,
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * hoverScale.value * bounce.scale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  const handleMouseEnter = useCallback(() => {
    hoverScale.value = withSpring(1.1, springConfigs.smooth);
  }, [hoverScale]);

  const handleMouseLeave = useCallback(() => {
    hoverScale.value = withSpring(1, springConfigs.smooth);
  }, [hoverScale]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={bounce.handlePress}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors cursor-pointer ${
            userReacted ? 'bg-primary/20 ring-1 ring-primary' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <AnimatedView style={buttonStyle} className="flex items-center gap-1">
            <span className="text-sm">{emoji}</span>
            <span className="text-[10px] font-semibold">{count}</span>
          </AnimatedView>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 glass-strong p-2">
        <div className="space-y-2">
          {reactions.map((reaction, idx) => (
            <div key={`${reaction.userId ?? idx}-${String(idx ?? '')}`} className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={reaction.userAvatar} alt={reaction.userName ?? 'User'} />
                <AvatarFallback className="text-[10px]">
                  {reaction.userName?.[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{reaction.userName ?? 'Unknown'}</span>
              <span className="ml-auto text-sm">{emoji}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface AddReactionButtonProps {
  showPicker: boolean;
  onTogglePicker: (show: boolean) => void;
  availableReactions: readonly string[];
  onSelectReaction: (emoji: string) => void;
}

function AddReactionButton({
  showPicker,
  onTogglePicker,
  availableReactions,
  onSelectReaction,
}: AddReactionButtonProps): React.JSX.Element {
  const hoverScale = useSharedValue(1);
  const pickerScale = useSharedValue(0.9);
  const pickerOpacity = useSharedValue(0);

  const bounce = useBounceOnTap({
    onPress: () => { onTogglePicker(!showPicker); },
    hapticFeedback: true,
    scale: 0.95,
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: hoverScale.value * bounce.scale.value }],
    };
  }) as AnimatedStyle;

  const pickerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pickerScale.value }],
      opacity: pickerOpacity.value,
    };
  }) as AnimatedStyle;

  useEffect(() => {
    if (showPicker) {
      pickerScale.value = withSpring(1, springConfigs.bouncy);
      pickerOpacity.value = withTiming(1, timingConfigs.fast);
    } else {
      pickerScale.value = withTiming(0.9, timingConfigs.fast);
      pickerOpacity.value = withTiming(0, timingConfigs.fast);
    }
  }, [showPicker, pickerScale, pickerOpacity]);

  const handleMouseEnter = useCallback(() => {
    hoverScale.value = withSpring(1.1, springConfigs.smooth);
  }, [hoverScale]);

  const handleMouseLeave = useCallback(() => {
    hoverScale.value = withSpring(1, springConfigs.smooth);
  }, [hoverScale]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      haptics.selection();
      onSelectReaction(emoji);
    },
    [onSelectReaction]
  );

  return (
    <Popover open={showPicker} onOpenChange={onTogglePicker}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={bounce.handlePress}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <AnimatedView style={buttonStyle}>
            <Plus size={12} weight="bold" />
          </AnimatedView>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 glass-strong p-3">
        <AnimatedView style={pickerStyle}>
          <div className="grid grid-cols-6 gap-2">
            {availableReactions.map((emoji) => (
              <EmojiButton key={emoji} emoji={emoji} onClick={() => handleEmojiClick(emoji)} />
            ))}
          </div>
        </AnimatedView>
      </PopoverContent>
    </Popover>
  );
}

interface EmojiButtonProps {
  emoji: string;
  onClick: () => void;
}

function EmojiButton({ emoji, onClick }: EmojiButtonProps): React.JSX.Element {
  const hoverScale = useSharedValue(1);

  const bounce = useBounceOnTap({
    onPress: onClick,
    hapticFeedback: true,
    scale: 0.9,
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: hoverScale.value * bounce.scale.value }],
    };
  }) as AnimatedStyle;

  const handleMouseEnter = useCallback(() => {
    hoverScale.value = withSpring(1.2, springConfigs.smooth);
  }, [hoverScale]);

  const handleMouseLeave = useCallback(() => {
    hoverScale.value = withSpring(1, springConfigs.smooth);
  }, [hoverScale]);

  return (
    <AnimatedView
      style={buttonStyle}
      onClick={bounce.handlePress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="text-2xl p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center"
    >
      {emoji}
    </AnimatedView>
  );
}
