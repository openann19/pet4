import * as React from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import type { ChatMessage } from '@/lib/chat-types'
import { MessageItem } from './MessageItem.native'

export interface VirtualMessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  typingUsers: Array<{ userName?: string }>
  onReaction: (messageId: string, emoji: string) => void
  onTranslate: (messageId: string) => void
  className?: string
}

export function VirtualMessageList({ messages, currentUserId, onReaction, onTranslate }: VirtualMessageListProps): JSX.Element {
  const data = React.useMemo(() => messages ?? [], [messages])
  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={data}
        estimatedItemSize={84}
        keyExtractor={(m) => m.id}
        renderItem={({ item, index }) => (
          <MessageItem
            message={item}
            isCurrentUser={item.sender?.id === currentUserId}
            currentUserId={currentUserId}
            delay={index * 20}
            onReaction={onReaction}
            onTranslate={onTranslate}
          />
        )}
      />
    </View>
  )
}

