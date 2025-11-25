import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/ui/Avatar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Send, Phone, Video, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@petspark/shared';
import { MessageType, MessageStatus } from '@petspark/shared';
import type { TypingUser } from '@petspark/shared';

// Constants for mock data to avoid duplication
const MOCK_DATE = new Date();
const MOCK_USER_VERIFIED = false;
const MOCK_USER_PREMIUM = false;
const MOCK_TYPING_START_TIME = new Date().toISOString();

// Mock typing users for demonstration
const mockTypingUsers: readonly TypingUser[] = [
  {
    userId: 'user-3',
    userName: 'Sarah',
    startedAt: MOCK_TYPING_START_TIME,
  },
];

// Mock message data for demonstration
const mockMessages: readonly Message[] = [
  {
    id: '1',
    type: MessageType.TEXT,
    content: 'Hey! How\'s Max doing?',
    status: MessageStatus.READ,
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    author: {
      id: 'user-1',
      displayName: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      verified: MOCK_USER_VERIFIED,
      premium: MOCK_USER_PREMIUM,
      createdAt: MOCK_DATE,
      updatedAt: MOCK_DATE,
    },
  },
  {
    id: '2',
    type: MessageType.TEXT,
    content: 'He\'s doing great! We just came back from the park 🐕',
    status: MessageStatus.READ,
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    author: {
      id: 'current-user',
      displayName: 'You',
      username: 'you',
      email: 'you@example.com',
      verified: MOCK_USER_VERIFIED,
      premium: MOCK_USER_PREMIUM,
      createdAt: MOCK_DATE,
      updatedAt: MOCK_DATE,
    },
  },
];

export function ChatPage() {
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState('1');

  const handleMessageBubblePress = (_messageId: string) => {
    // TODO: Implement message actions (reply, react, etc.)
  };

  return (
    <motion.div
      className="flex h-[calc(100vh-8rem)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Chat List */}
      <div className="w-80 border-r border-border">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full rounded-none border-0">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                <motion.div
                  whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--accent))' }}
                  className={`p-3 cursor-pointer rounded-lg ${selectedChat === '1' ? 'bg-accent' : ''}`}
                  onClick={() => setSelectedChat('1')}
                >
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={{
                      id: '1',
                      displayName: 'John Doe',
                      username: 'johndoe',
                      email: 'john@example.com',
                      verified: false,
                      premium: false,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">John Doe</span>
                        <span className="text-xs text-muted-foreground">2m ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">Hey! How's Max doing?</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <Card className="flex-1 rounded-none border-0">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserAvatar user={{
                    id: '1',
                    displayName: 'John Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    verified: false,
                    premium: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }} size="sm" />
                  <div>
                    <CardTitle className="text-base">John Doe</CardTitle>
                    <CardDescription className="text-xs">Active now</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-4">
              <div className="space-y-1">
                <AnimatePresence>
                  {mockMessages.map((msg, index) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === 'current-user'}
                      isClusterStart={index === 0 || mockMessages[index - 1]?.senderId !== msg.senderId}
                      isClusterEnd={index === mockMessages.length - 1 || mockMessages[index + 1]?.senderId !== msg.senderId}
                      index={index}
                      showTimestamp={true}
                      onReply={handleMessageBubblePress}
                    />
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                <TypingIndicator users={mockTypingUsers} />
              </div>
            </CardContent>
          </Card>

          {/* Message Input */}
          <motion.div
            className="p-4 border-t border-border"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
