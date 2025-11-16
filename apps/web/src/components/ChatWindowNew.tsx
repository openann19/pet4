import type { ChatRoom } from '@/lib/chat-types';
import { useChatWindow } from '@/components/chat/window/hooks/useChatWindow';
import { ChatWindowView } from '@/components/chat/window/ChatWindowView';

interface ChatWindowProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onBack?: () => void;
}

export default function ChatWindow({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack,
}: ChatWindowProps) {
  const chatWindowData = useChatWindow({
    room,
    currentUserId,
    currentUserName,
    currentUserAvatar,
  });

  return (
    <ChatWindowView
      room={room}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      onBack={onBack}
      chatWindowData={chatWindowData}
    />
  );
}
