/**
 * Chat Demo Page for Visual Regression Testing
 * 
 * Dedicated test page for Playwright visual regression testing of premium chat components.
 * Provides controlled environment with mock data and testing APIs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { Button } from '@/components/ui/button';
import type { Message, MessageStatus, ReactionType, TypingUser } from '@/lib/chat-types';
import { cn } from '@/lib/utils';

// Type definitions for testing APIs exposed to window
declare global {
  interface Window {
    __setChatMessages?: (messages: Message[]) => void;
    __sendMessage?: (content: string) => void;
    __setMessageStatus?: (messageId: string, status: MessageStatus) => void;
    __showTypingIndicator?: (user: string) => void;
    __hideTypingIndicator?: () => void;
    __setConnectionStatus?: (status: 'online' | 'offline') => void;
  }
}

type ReactionMap = Partial<Record<ReactionType, string[]>>;

const toReactionMap = (source: Message['reactions']): ReactionMap => {
  if (!source) {
    return {};
  }

  if (Array.isArray(source)) {
    return source.reduce<ReactionMap>((acc, reaction) => {
      if (reaction.userIds?.length) {
        acc[reaction.emoji as ReactionType] = [...reaction.userIds];
      }
      return acc;
    }, {});
  }

  return Object.entries(source).reduce<ReactionMap>((acc, [emoji, users]) => {
    acc[emoji as ReactionType] = [...users];
    return acc;
  }, {});
};

const toMessageReactions = (
  reactionMap: ReactionMap
): Record<ReactionType, string[]> | undefined => {
  const resultEntries: [ReactionType, string[]][] = [];

  for (const [emoji, users] of Object.entries(reactionMap)) {
    if (!users?.length) {
      continue;
    }
    resultEntries.push([emoji as ReactionType, [...users]]);
  }

  if (resultEntries.length === 0) {
    return undefined;
  }

  return resultEntries.reduce<Record<ReactionType, string[]>>((acc, [emoji, users]) => {
    acc[emoji] = users;
    return acc;
  }, {} as Record<ReactionType, string[]>);
};

// Mock message data for testing
const initialMessages: Message[] = [
  {
    id: '1',
    roomId: 'test-room',
    content: 'Hello! This is a regular message from another user.',
    senderId: 'user1',
    type: 'text',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 300000).toISOString(),
    status: 'read',
    reactions: toMessageReactions({
      '❤️': ['user2'],
      '😂': ['user2', 'user3'],
    }),
  },
  {
    id: '2',
    roomId: 'test-room',
    content: 'This is my message with a longer text that might wrap to multiple lines and test the bubble layout properly. It includes emojis 🚀 and mentions @user.',
    senderId: 'currentUser',
    type: 'text',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    createdAt: new Date(Date.now() - 240000).toISOString(),
    status: 'delivered',
  },
  {
    id: '3',
    roomId: 'test-room',
    content: 'Short reply',
    senderId: 'user1',
    type: 'text',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    createdAt: new Date(Date.now() - 180000).toISOString(),
    status: 'sent',
  },
  {
    id: '4',
    roomId: 'test-room',
    content: 'Another message from me with reactions! 🎉',
    senderId: 'currentUser',
    type: 'text',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    createdAt: new Date(Date.now() - 120000).toISOString(),
    status: 'read',
    reactions: toMessageReactions({
      '👍': ['user1'],
      '🔥': ['user1', 'user2', 'user3'],
    }),
  },
  {
    id: '5',
    roomId: 'test-room',
    content: 'Latest message just sent',
    senderId: 'currentUser',
    type: 'text',
    timestamp: new Date(Date.now() - 5000).toISOString(),
    createdAt: new Date(Date.now() - 5000).toISOString(),
    status: 'sending',
  },
];

interface ChatDemoPageProps {
  variant?: 'default' | 'empty';
}

export function ChatDemoPage({ variant = 'default' }: ChatDemoPageProps) {
  const [messages, setMessages] = useState<Message[]>(variant === 'empty' ? [] : initialMessages);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const currentUserId = 'currentUser';

  // Expose testing APIs to window for Playwright
  useEffect(() => {
    window.__setChatMessages = (newMessages: Message[]) => {
      setMessages(newMessages);
    };

    window.__sendMessage = (content: string) => {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        roomId: 'test-room',
        content,
        senderId: currentUserId,
        type: 'text',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'sending',
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Simulate status progression
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'sent' as MessageStatus } : msg
        ));
      }, 500);
      
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as MessageStatus } : msg
        ));
      }, 1000);
    };

    window.__setMessageStatus = (messageId: string, status: MessageStatus) => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      ));
    };

    window.__showTypingIndicator = (user: string) => {
      setTypingUsers([{ userId: 'user1', userName: user, startedAt: new Date().toISOString() }]);
    };

    window.__hideTypingIndicator = () => {
      setTypingUsers([]);
    };

    window.__setConnectionStatus = (status: 'online' | 'offline') => {
      setIsOnline(status === 'online');
    };

    return () => {
      delete window.__setChatMessages;
      delete window.__sendMessage;
      delete window.__setMessageStatus;
      delete window.__showTypingIndicator;
      delete window.__hideTypingIndicator;
      delete window.__setConnectionStatus;
    };
  }, [currentUserId]);

  // Helper to determine if message is from current user
  const isOwnMessage = useCallback((message: Message) => {
    return message.senderId === currentUserId;
  }, [currentUserId]);

  // Helper to determine message clustering 
  const getClusteringInfo = useCallback((messages: Message[], index: number) => {
    const current = messages[index];
    const previous = messages[index - 1];
    const next = messages[index + 1];

    if (!current) return { isClusterStart: true, isClusterEnd: true };

    const isClusterStart = !previous || previous.senderId !== current.senderId;
    const isClusterEnd = !next || next.senderId !== current.senderId;

    return { isClusterStart, isClusterEnd };
  }, []);

  // Message handlers
  const handleReact = useCallback((messageId: string, reaction: ReactionType) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = toReactionMap(msg.reactions);
      const reactionUsers = reactions[reaction] ?? [];
      
      if (reactionUsers.includes(currentUserId)) {
        // Remove reaction
        const newUsers = reactionUsers.filter(id => id !== currentUserId);
        if (newUsers.length === 0) {
          delete reactions[reaction];
        } else {
          reactions[reaction] = newUsers;
        }
      } else {
        // Add reaction
        reactions[reaction] = [...reactionUsers, currentUserId];
      }
      
      return {
        ...msg,
        reactions: toMessageReactions(reactions),
      };
    }));
  }, [currentUserId]);

  const handleReply = useCallback((_messageId: string) => {
    // Reply functionality would be implemented here
    // Note: Removed console.log for lint compliance
  }, []);

  const handleCopy = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      void navigator.clipboard.writeText(message.content).catch((_error: unknown) => {
        // Clipboard access can fail in tests; swallow to keep demo deterministic
      });
    }
  }, [messages]);

  const handleDelete = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      roomId: 'test-room',
      content,
      senderId: currentUserId,
      type: 'text',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate message progression
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'sent' as MessageStatus } : msg
      ));
    }, 500);
  }, [currentUserId]);

  const renderEmptyState = () => (
    <div className="flex h-screen flex-col">
      <div 
        className="flex-1 flex items-center justify-center p-8"
        data-testid="chat-container"
      >
        <div 
          className="text-center space-y-4"
          data-testid="empty-chat-state"
        >
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold text-muted-foreground">
            No messages yet
          </h2>
          <p className="text-muted-foreground max-w-md">
            Start a conversation by sending your first message.
          </p>
          <div className="flex justify-start">
            <TypingIndicator data-testid="typing-indicator" users={typingUsers} />
          </div>
        </div>
      </div>
      
      <div className="border-t bg-background p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
            if (input.value.trim()) {
              handleSendMessage(input.value);
              input.value = '';
            }
          }}
          data-testid="chat-input-bar"
        >
          <input
            name="message"
            type="text"
            placeholder="Type your first message..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </form>
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="border-b bg-background p-4">
      <h1 className="text-lg font-semibold">Chat Demo - Visual Regression Testing</h1>
      <div className="flex gap-2 mt-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => {
            if (typingUsers.length > 0) {
              setTypingUsers([]);
            } else {
              setTypingUsers([
                { userId: 'user1', userName: 'Someone', startedAt: new Date().toISOString() }
              ]);
            }
          }}
        >
          {typingUsers.length > 0 ? 'Hide' : 'Show'} Typing
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setIsOnline(!isOnline)}
        >
          Go {isOnline ? 'Offline' : 'Online'}
        </Button>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-2"
      data-testid="messages-container"
    >
      {messages.map((message, index) => {
        const { isClusterStart, isClusterEnd } = getClusteringInfo(messages, index);
        const isOwn = isOwnMessage(message);
        
        return (
          <div
            key={message.id}
            className={cn(
              'flex',
              isOwn ? 'justify-end' : 'justify-start'
            )}
          >
            <MessageBubble
              data-testid="message-bubble"
              data-status={message.status}
              message={message}
              isOwn={isOwn}
              isClusterStart={isClusterStart}
              isClusterEnd={isClusterEnd}
              index={index}
              isNew={index === messages.length - 1}
              onReact={handleReact}
              onReply={handleReply}
              onCopy={handleCopy}
              onDelete={handleDelete}
              showTimestamp={isClusterEnd}
            />
          </div>
        );
      })}
      
      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex justify-start">
          <TypingIndicator 
            data-testid="typing-indicator"
            users={typingUsers}
          />
        </div>
      )}
    </div>
  );

  const renderInput = () => (
    <div className="border-t bg-background p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
          if (input.value.trim()) {
            handleSendMessage(input.value);
            input.value = '';
          }
        }}
        data-testid="chat-input-bar"
      >
        <input
          name="message"
          type="text"
          placeholder="Type a message..."
          data-testid="message-input"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </form>
    </div>
  );

  if (variant === 'empty') {
    return renderEmptyState();
  }

  return (
    <div className="flex h-screen flex-col" data-testid="chat-container">
      {/* Connection Status */}
      {!isOnline && (
        <div 
          className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm"
          data-testid="offline-indicator"
        >
          You're offline. Messages will be sent when you reconnect.
        </div>
      )}

      {renderHeader()}

      {renderMessages()}

      {renderInput()}
    </div>
  );
}

export default ChatDemoPage;