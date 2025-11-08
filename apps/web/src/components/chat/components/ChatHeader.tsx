/**
 * Chat Header Component
 *
 * Header section with user info and actions
 */

import { ArrowLeft, DotsThree } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { TypingIndicator as TypingIndicatorComponent } from './TypingIndicator';
import type { ChatRoom } from '@/lib/chat-types';

export interface ChatHeaderProps {
  room: ChatRoom;
  typingUsers: { userName?: string }[];
  awayMode: boolean;
  onBack?: () => void;
  onToggleAwayMode: () => void;
  onBlockUser: () => void;
}

export function ChatHeader({
  room,
  typingUsers,
  awayMode,
  onBack,
  onToggleAwayMode,
  onBlockUser,
}: ChatHeaderProps): JSX.Element {
  const animation = useEntryAnimation({ initialY: -20, delay: 0 });

  return (
    <AnimatedView
      style={animation.animatedStyle}
      className="glass-strong border-b border-white/20 p-4 shadow-xl backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft size={20} />
          </Button>
        )}

        <Avatar className="w-10 h-10 ring-2 ring-white/30">
          <AvatarImage src={room.matchedPetPhoto} alt={room.matchedPetName} />
          <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
            {room.matchedPetName?.[0] || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-bold text-foreground">{room.matchedPetName}</h2>
          {typingUsers.length > 0 && <TypingIndicatorComponent users={typingUsers} />}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <DotsThree size={24} weight="bold" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 glass-strong">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={onToggleAwayMode}>
                {awayMode ? '🟢 Available' : '🌙 Away Mode'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={onBlockUser}
              >
                🚫 Block User
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </AnimatedView>
  );
}
