import { MotionView } from '@petspark/motion';
/**
 * Chat Header Component
 *
 * Header section with user info and actions
 */

import {
  ArrowLeft,
  DotsThree,
  Phone,
  VideoCamera,
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import type { ChatRoom } from '@/lib/chat-types';
import { useUIConfig } from '@/hooks/use-ui-config';
import { getTypographyClasses } from '@/lib/typography';
import { TypingIndicator } from './TypingIndicator';

export interface ChatHeaderProps {
  room: ChatRoom;
  typingUsers: { userName?: string }[];
  awayMode: boolean;
  onBack?: () => void;
  onToggleAwayMode: () => void;
  onBlockUser: () => void;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
}

export function ChatHeader({
  room,
  typingUsers,
  awayMode,
  onBack,
  onToggleAwayMode,
  onBlockUser,
  onVideoCall,
  onVoiceCall,
}: ChatHeaderProps): JSX.Element {
  const _uiConfig = useUIConfig();
  const animation = useEntryAnimation({ initialY: -20, delay: 0 });

  return (
    <MotionView
      style={animation.animatedStyle}
      className="glass-strong border-b border-white/20 p-4 shadow-xl backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
            aria-label="Back to chat list"
          >
            <ArrowLeft size={20} />
          </Button>
        )}

        <Avatar className="w-10 h-10 ring-2 ring-white/30">
          <AvatarImage src={room.matchedPetPhoto} alt={room.matchedPetName} />
          <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
            {room.matchedPetName?.[0] ?? '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className={getTypographyClasses('subheading')}>
            {room.matchedPetName}
          </h2>
          {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
        </div>

        {onVoiceCall && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onVoiceCall}
            aria-label="Start voice call"
          >
            <Phone size={24} />
          </Button>
        )}
        {onVideoCall && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onVideoCall}
            aria-label="Start video call"
          >
            <VideoCamera size={24} />
          </Button>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Chat options menu"
            >
              <DotsThree size={24} weight="bold" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 glass-strong">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={onToggleAwayMode}
              >
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
    </MotionView>
  );
}
