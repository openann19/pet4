import { FlatList, View } from 'react-native'
import type { ChatMessage } from '@/lib/chat-types'
import { MessageItem } from './MessageItem'

export interface MessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  typingUsers: Array<{ userName?: string }>
  onReaction: (messageId: string, emoji: string) => void
  onTranslate: (messageId: string) => void
}

export function MessageList({
  messages,
  currentUserId,
  onReaction,
  onTranslate,
}: MessageListProps): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item, index }) => (
          <MessageItem
            message={item}
            isCurrentUser={item.senderId === currentUserId}
            currentUserId={currentUserId}
            delay={index * 50}
            onReaction={onReaction}
            onTranslate={onTranslate}
          />
        )}
      />
    </View>
  )
}
