import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import type { Message, LocationData } from '../types';
import { useStorage } from '../hooks/useStorage';
import { MessageReactions, StickerPicker, VoiceRecorder, LocationShare } from '../components/chat';

export default function ChatScreen({
  route,
}: {
  route: { params: { matchId: string } };
}): React.JSX.Element {
  const { matchId } = route.params;
  const [messages, setMessages] = useStorage<Message[]>(`chat-${matchId}`, []);
  const [inputText, setInputText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showLocationShare, setShowLocationShare] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const currentUserId = 'my-user-id';

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      matchId,
      senderId: currentUserId,
      content: inputText,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'text',
      reactions: [],
    };

    await setMessages([...messages, newMessage]);
    setInputText('');
  };

  const sendSticker = async (sticker: { emoji: string }) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      matchId,
      senderId: currentUserId,
      content: sticker.emoji,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'sticker',
      reactions: [],
    };

    await setMessages([...messages, newMessage]);
  };

  const sendVoiceMessage = async (uri: string, duration: number) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      matchId,
      senderId: currentUserId,
      content: uri,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'voice',
      voiceDuration: duration,
      reactions: [],
    };

    await setMessages([...messages, newMessage]);
    setShowVoiceRecorder(false);
  };

  const sendLocation = async (location: LocationData) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      matchId,
      senderId: currentUserId,
      content: location.address || `${location.latitude}, ${location.longitude}`,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'location',
      locationData: location,
      reactions: [],
    };

    await setMessages([...messages, newMessage]);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find((r) => r.emoji === emoji);

        if (existingReaction) {
          // Add user to existing reaction
          return {
            ...msg,
            reactions: reactions.map((r) =>
              r.emoji === emoji ? { ...r, users: [...r.users, currentUserId] } : r
            ),
          };
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...reactions, { emoji, users: [currentUserId] }],
          };
        }
      }
      return msg;
    });

    await setMessages(updatedMessages);
  };

  // Helper function to remove reaction from a single message
  const removeReactionFromMessage = (message: Message, emoji: string, userId: string): Message => {
    const reactions = (message.reactions || [])
      .map((r) => (r.emoji === emoji ? { ...r, users: r.users.filter((u) => u !== userId) } : r))
      .filter((r) => r.users.length > 0);

    return { ...message, reactions };
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId) {
        return removeReactionFromMessage(msg, emoji, currentUserId);
      }
      return msg;
    });

    await setMessages(updatedMessages);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUserId;

    const renderContent = () => {
      switch (item.type) {
        case 'sticker':
          return <Text style={styles.stickerText}>{item.content}</Text>;
        case 'voice':
          return (
            <View style={styles.voiceMessage}>
              <Text style={styles.voiceIcon}>🎤</Text>
              <Text style={styles.voiceText}>Voice message ({item.voiceDuration}s)</Text>
              <Pressable style={styles.playButton}>
                <Text style={styles.playIcon}>▶️</Text>
              </Pressable>
            </View>
          );
        case 'location':
          return (
            <View style={styles.locationMessage}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{item.content}</Text>
              <Pressable style={styles.viewMapButton}>
                <Text style={styles.viewMapText}>View Map</Text>
              </Pressable>
            </View>
          );
        default:
          return <Text style={styles.messageText}>{item.content}</Text>;
      }
    };

    return (
      <View style={styles.messageContainer}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
          {renderContent()}
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Reactions */}
        <MessageReactions
          messageId={item.id}
          reactions={item.reactions || []}
          currentUserId={currentUserId}
          onAddReaction={(emoji) => addReaction(item.id, emoji)}
          onRemoveReaction={(emoji) => removeReaction(item.id, emoji)}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />
      {/* Input Container */}
      {showVoiceRecorder ? (
        <View style={styles.inputContainer}>
          <VoiceRecorder
            onSendVoice={sendVoiceMessage}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </View>
      ) : (
        <View style={styles.inputContainer}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={() => setShowStickerPicker(true)}>
              <Text style={styles.actionIcon}>😊</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => setShowLocationShare(true)}>
              <Text style={styles.actionIcon}>📍</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => setShowVoiceRecorder(true)}>
              <Text style={styles.actionIcon}>🎤</Text>
            </Pressable>
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
          />

          {/* Send Button */}
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <StickerPicker
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={sendSticker}
      />

      <LocationShare
        visible={showLocationShare}
        onClose={() => setShowLocationShare(false)}
        onSendLocation={sendLocation}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  stickerText: {
    fontSize: 64,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
  },
  voiceIcon: {
    fontSize: 20,
  },
  voiceText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 12,
  },
  locationMessage: {
    gap: 8,
    minWidth: 200,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  viewMapButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewMapText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
