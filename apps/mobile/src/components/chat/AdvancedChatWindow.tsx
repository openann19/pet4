import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { isTruthy } from '../../utils/shared'
// Stubs for unavailable imports
function useKV<T>(_key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Ignore key for mobile stub
  return useState<T>(initial)
}
const haptics = { trigger: (_: string) => {} }
const toast = { success: (_: string) => {}, error: (_: string) => {}, info: (_: string) => {}, warning: (_: string) => {} }

// Types
export interface ChatRoom {
  id: string
  matchedPetName: string
  matchedPetPhoto?: string
  isTyping?: boolean
  typingUsers?: string[]
}
export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderAvatar?: string // optional
  content: string
  type: 'text' | 'sticker' | 'voice' | 'location' | 'pet-card'
  timestamp: string
  status: string
  reactions?: Array<{ emoji: string; userId: string; userName: string }>
  attachments?: Array<{ type: string; url: string; name?: string }>
  metadata?: Record<string, unknown>
}

export interface AdvancedChatWindowProps {
  room: ChatRoom
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onBack?: () => void
}

export default function AdvancedChatWindow({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack,
}: AdvancedChatWindowProps): React.JSX.Element {
  const [messages, setMessages] = useKV<ChatMessage[]>(`chat-messages-${room.id}`, [])
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (isTruthy(scrollRef.current)) {
      scrollRef.current.scrollToEnd({ animated: true })
    }
  }, [messages])

  const handleSendMessage = (content: string): void => {
    if (!content.trim()) return
    haptics.trigger('light')
    const newMessage: ChatMessage = {
      id: String(Date.now() ?? ''),
      roomId: room.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar ?? '',
      content: content.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent',
    }
    setMessages((current: ChatMessage[] = []) => [...current, newMessage])
    setInputValue('')
    toast.success('Message sent!')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{'<'} Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{room.matchedPetName[0]}</Text>
          </View>
          <Text style={styles.petName}>{room.matchedPetName}</Text>
        </View>
      </View>
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ padding: 16 }}>
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.senderId === currentUserId ? styles.messageRowSelf : null,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                msg.senderId === currentUserId ? styles.messageBubbleSelf : null,
              ]}
            >
              <Text style={styles.messageText}>{msg.content}</Text>
              <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleTimeString()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Type a message..."
          editable={true}
        />
        <TouchableOpacity onPress={() => handleSendMessage(inputValue)} style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--color-bg-overlay)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'var(--color-bg-overlay)',
    fontWeight: 'bold',
    fontSize: 18,
  },
  petName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  messages: {
    flex: 1,
    backgroundColor: 'var(--color-bg-overlay)',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageRowSelf: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#eee',
    borderRadius: 16,
    padding: 12,
    maxWidth: '80%',
  },
  messageBubbleSelf: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    color: '#222',
    fontSize: 15,
  },
  timestamp: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'var(--color-bg-overlay)',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendText: {
    color: 'var(--color-bg-overlay)',
    fontWeight: 'bold',
    fontSize: 15,
  },
})
