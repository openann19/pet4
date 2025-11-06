export interface ChatMessage {
  id: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file'
  sender: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: number
  status: 'sending' | 'sent' | 'delivered' | 'read'
  replyTo?: {
    id: string
    content: string
    sender: string
  }
  metadata?: {
    fileSize?: number
    fileName?: string
    mimeType?: string
    duration?: number
    dimensions?: {
      width: number
      height: number
    }
  }
}

export interface ChatThread {
  id: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
    status: 'online' | 'offline' | 'typing'
  }>
  messages: ChatMessage[]
  lastMessage?: ChatMessage
  unreadCount: number
  createdAt: number
  updatedAt: number
}

export type MessageStatus = ChatMessage['status']
export type MessageType = ChatMessage['type']