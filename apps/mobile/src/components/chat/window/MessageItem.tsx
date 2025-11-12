import { Text, View } from 'react-native'
import type { ChatMessage } from '@/lib/chat-types'

export interface MessageItemProps {
  message: ChatMessage
  isCurrentUser: boolean
  currentUserId: string
  delay: number
  onReaction: (messageId: string, emoji: string) => void
  onTranslate: (messageId: string) => void
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps): JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        marginVertical: 4,
      }}
    >
      <View
        style={{
          maxWidth: '75%',
          backgroundColor: isCurrentUser ? '#2563EB' : 'rgba(255,255,255,0.1)',
          padding: 8,
          borderRadius: 16,
        }}
      >
        <Text style={{ color: isCurrentUser ? 'var(--color-bg-overlay)' : 'var(--color-fg)' }}>{String(message.content)}</Text>
      </View>
    </View>
  )
}
