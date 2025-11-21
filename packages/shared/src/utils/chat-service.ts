import { generateULID } from './utils'
import type { ChatMessage } from './chat-utils'

const mockMessages: Record<string, ChatMessage[]> = {}

function generateMockMessage(roomId: string, senderId: string, content: string): ChatMessage {
  const now = new Date().toISOString()
  return {
    id: generateULID(),
    roomId,
    senderId,
    senderName: senderId === 'user-1' ? 'You' : 'Bot',
    content,
    type: 'text',
    timestamp: now,
    createdAt: now,
    status: 'read',
  }
}

export async function getRoomMessages(roomId: string): Promise<{ messages: ChatMessage[] }> {
  mockMessages[roomId] ??= [
    generateMockMessage(roomId, 'bot-1', 'Hello! How can I help you today?'),
  ]
  return Promise.resolve({ messages: mockMessages[roomId] ?? [] })
}

export async function sendMessage(
  roomId: string,
  message: Partial<ChatMessage>
): Promise<ChatMessage> {
  const newMessage: ChatMessage = {
    id: generateULID(),
    roomId,
    senderId: message.senderId ?? 'user-1',
    senderName: message.senderName ?? 'You',
    content: message.content ?? '',
    type: message.type ?? 'text',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: 'sent',
    ...message,
  }
  mockMessages[roomId] ??= []
  mockMessages[roomId]?.push(newMessage)
  return Promise.resolve(newMessage)
}
