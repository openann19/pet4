import { MotionView } from '@petspark/motion';
import { ChatCircle, Check, Checks } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ChatRoom } from '@/lib/chat-types';
import { formatMessageTime } from '@/lib/chat-utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { cn } from '@/lib/utils';

interface ChatRoomsListProps {
  rooms: ChatRoom[];
  onSelectRoom: (room: ChatRoom) => void;
  selectedRoomId?: string;
}

export default function ChatRoomsList({ rooms, onSelectRoom, selectedRoomId }: ChatRoomsListProps) {
  if (rooms.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center min-h-[60vh] text-center',
          getSpacingClassesFromConfig({ paddingX: 'lg' })
        )}
      >
        <MotionView
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"
        >
          <MotionView
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChatCircle size={48} className="text-primary" weight="fill" />
          </MotionView>
          <MotionView
            className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-accent/20"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </MotionView>
        <MotionView
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(getTypographyClasses('h2'), 'mb-2')}
        >
          No Conversations Yet
        </MotionView>
        <MotionView
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(getTypographyClasses('body'), 'text-muted-foreground max-w-md')}
        >
          Start chatting with your matches to plan playdates and get to know each other!
        </MotionView>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-full pr-1">
      {rooms.map((room, idx) => {
        const unreadValue =
          typeof room.unreadCount === 'number'
            ? room.unreadCount
            : typeof room.unreadCount === 'object' && room.unreadCount
              ? Object.values(room.unreadCount).reduce((sum, count) => sum + count, 0)
              : 0;
        const hasUnread = unreadValue > 0;
        const isSelected = selectedRoomId === room.id;

        return (
          <MotionView
            key={room.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
          >
            <button
              type="button"
              onClick={() => onSelectRoom(room)}
              className={cn(
                'w-full rounded-2xl border px-4 py-3 text-left transition-all flex items-start gap-3 bg-background/80 hover:bg-background/95',
                isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-primary/40'
              )}
            >
              <div className="relative shrink-0">
                <Avatar
                  className={cn('w-12 h-12 ring-2', hasUnread ? 'ring-primary/60' : 'ring-border/50')}
                >
                  <AvatarImage src={room.matchedPetPhoto} alt={room.matchedPetName ?? 'Pet'} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                    {room.matchedPetName?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 min-w-[1.5rem] h-6 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center px-1">
                    {unreadValue > 99 ? '99+' : String(unreadValue)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={cn(
                      'truncate text-sm font-semibold',
                      hasUnread ? 'text-foreground' : 'text-foreground/90'
                    )}
                  >
                    {room.matchedPetName ?? 'Unknown Pet'}
                  </h3>
                  {room.lastMessage && (
                    <span className="text-[11px] text-muted-foreground">
                      {formatMessageTime(room.lastMessage.timestamp ?? room.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {room.lastMessage ? (
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      {room.lastMessage.status &&
                        ['sent', 'delivered', 'read'].includes(room.lastMessage.status) && (
                          <span className="shrink-0">
                            {room.lastMessage.status === 'read' ? (
                              <Checks size={14} weight="bold" className="text-primary" />
                            ) : (
                              <Check size={14} weight="bold" className="text-muted-foreground" />
                            )}
                          </span>
                        )}
                      <p className={cn('truncate', hasUnread && 'text-foreground')}>
                        {room.lastMessage.type === 'text'
                          ? room.lastMessage.content
                          : room.lastMessage.type === 'sticker'
                            ? `${room.lastMessage.content} Sticker`
                            : room.lastMessage.type === 'voice'
                              ? '🎤 Voice message'
                              : '📷 Image'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic truncate">Say hello! 👋</p>
                  )}
                </div>

                {room.isTyping && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-primary">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <MotionView
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    typing…
                  </div>
                )}
              </div>
            </button>
          </MotionView>
        );
      })}
    </div>
  );
}
