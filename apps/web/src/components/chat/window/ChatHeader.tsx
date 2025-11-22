import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, VideoCamera, Phone, DotsThree, Moon, Sun, UserMinus } from '@phosphor-icons/react';
import type { ChatRoom } from '@/lib/chat-types';
import { cn } from '@/lib/utils';

export interface ChatHeaderProps {
  room: ChatRoom;
  typingUsers: { userName?: string | null }[];
  onBack?: () => void;
  onVideoCall: () => void;
  onVoiceCall: () => void;
  awayMode: boolean;
  onToggleAwayMode: () => void;
  onBlockUser: () => void;
}

function TypingIndicator({ users }: { users: { userName?: string | null }[] }): React.JSX.Element | null {
  if (users.length === 0) return null;

  return (
    <div className="text-xs text-primary flex items-center gap-1">
      <div>
        {users.length === 1
          ? `${users[0]?.userName ?? 'Someone'} is typing`
          : `${String(users.length ?? '')} people are typing`}
      </div>
      <div>...</div>
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  title,
  ariaLabel,
  className,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  ariaLabel: string;
  className?: string;
}): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('shrink-0 w-10 h-10 p-0', className)}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
    >
      {icon}
    </Button>
  );
}

function ChatHeaderContent({
  room,
  typingUsers,
  onBack,
}: {
  room: ChatHeaderProps['room'];
  typingUsers: ChatHeaderProps['typingUsers'];
  onBack?: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden w-10 h-10 p-0"
          aria-label="Back to chat list"
        >
          <ArrowLeft size={20} />
        </Button>
      )}
      <Avatar className="w-10 h-10 ring-2 ring-white/30">
        <AvatarImage src={room.matchedPetPhoto ?? undefined} alt={room.matchedPetName ?? undefined} />
        <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
          {room.matchedPetName?.[0] ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-foreground truncate">{room.matchedPetName ?? 'Unknown'}</h2>
        <TypingIndicator users={typingUsers} />
      </div>
    </div>
  );
}

export function ChatHeader({
  room,
  typingUsers,
  onBack,
  onVideoCall,
  onVoiceCall,
  awayMode,
  onToggleAwayMode,
  onBlockUser,
}: ChatHeaderProps) {
  return (
    <header className="glass-strong border-b border-white/20 p-4 shadow-xl backdrop-blur-2xl flex items-center gap-2">
      <ChatHeaderContent room={room} typingUsers={typingUsers} onBack={onBack} />
      <div className="flex items-center shrink-0">
        <ActionButton
          icon={<VideoCamera size={24} weight="regular" />}
          onClick={onVideoCall}
          title="Start video call"
          ariaLabel="Start video call"
        />
        <ActionButton
          icon={<Phone size={24} weight="regular" />}
          onClick={onVoiceCall}
          title="Start voice call"
          ariaLabel="Start voice call"
        />
        <ActionButton
          icon={awayMode ? <Sun size={24} /> : <Moon size={24} />}
          onClick={onToggleAwayMode}
          title={awayMode ? 'Disable Away Mode' : 'Enable Away Mode'}
          ariaLabel={awayMode ? 'Disable Away Mode' : 'Enable Away Mode'}
        />
        <ActionButton
          icon={<UserMinus size={24} />}
          onClick={onBlockUser}
          title="Block User"
          ariaLabel="Block User"
        />
        <Button variant="ghost" size="sm" className="shrink-0 w-10 h-10 p-0" aria-label="Chat options menu">
          <DotsThree size={24} weight="bold" />
        </Button>
      </div>
    </header>
  );
}
