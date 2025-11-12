'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { DotsThree, ArrowLeft } from '@phosphor-icons/react';
import { blockService } from '@/lib/block-service';
import type { ChatRoom } from '@/lib/chat-types';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

const logger = createLogger('ChatHeader');

export interface ChatHeaderProps {
  room: ChatRoom;
  typingIndicator: ReactNode;
  onBack?: () => void;
  awayMode: boolean;
  setAwayMode: (next: boolean | ((p: boolean) => boolean)) => void;
}

export function ChatHeader({
  room,
  typingIndicator,
  onBack,
  awayMode,
  setAwayMode,
}: ChatHeaderProps): JSX.Element {
  const _uiConfig = useUIConfig();
  const headerAnim = useEntryAnimation({ initialY: -20, delay: 0 });

  return (
    <AnimatedView
      style={headerAnim.animatedStyle}
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
            {room.matchedPetName?.[0] || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-bold text-foreground">{room.matchedPetName}</h2>
          {typingIndicator}
        </div>

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
                onClick={() => {
                  setAwayMode((p) => !p);
                }}
              >
                {awayMode ? '🟢 Available' : '🌙 Away Mode'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={async () => {
                  try {
                    const currentUserId = room.participantIds[0]; // parent should pass if different ownership needed
                    const otherUserId = room.participantIds.find((id) => id !== currentUserId);

                    if (!otherUserId || !currentUserId) {
                      return;
                    }

                    const confirmed = window.confirm('Block this user?');

                    if (!confirmed) {
                      return;
                    }

                    await blockService.blockUser(currentUserId, otherUserId, 'harassment');

                    toast.success('User blocked.');

                    onBack?.();
                  } catch (e) {
                    const err = e instanceof Error ? e : new Error(String(e));
                    logger.error('Block failed', err);
                    toast.error('Failed to block user');
                  }
                }}
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
