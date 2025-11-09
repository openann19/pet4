/**
 * ChatInputBar - Mobile Implementation
 * Enhanced with Reanimated bounce, RN Gesture Handler, typing, send on return, a11y labels, haptics
 * Matches web version props exactly for parity
 */

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { View, TextInput, Pressable, StyleSheet, ScrollView, Modal, Text } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Animated } from '@petspark/motion'
import { haptics } from '@/lib/haptics'
import { TemplatePanel } from './TemplatePanel'
import type { ChatMessage, MessageTemplate, SmartSuggestion } from '@/lib/chat-types'
import { CHAT_STICKERS } from '@/lib/chat-utils'
import { REACTION_EMOJIS } from '@/lib/chat-types'

export interface ChatInputBarProps {
  inputValue: string
  setInputValue: (v: string) => void
  inputRef?: React.RefObject<TextInput>
  showStickers: boolean
  setShowStickers: (v: boolean) => void
  showTemplates: boolean
  setShowTemplates: (v: boolean) => void
  isRecordingVoice: boolean
  setIsRecordingVoice: (v: boolean) => void
  onSend: (
    content: string,
    type?: ChatMessage['type'],
    attachments?: ChatMessage['attachments'],
    metadata?: ChatMessage['metadata']
  ) => void
  onSuggestion: (s: SmartSuggestion) => void
  onShareLocation: () => void
  onTemplate: (t: MessageTemplate) => void
  onQuickReaction?: (emoji: string) => void
}

export function ChatInputBar({
  inputValue,
  setInputValue,
  inputRef: externalInputRef,
  showStickers,
  setShowStickers,
  showTemplates,
  setShowTemplates,
  isRecordingVoice,
  setIsRecordingVoice,
  onSend,
  onSuggestion: _onSuggestion,
  onShareLocation,
  onTemplate,
  onQuickReaction,
}: ChatInputBarProps): JSX.Element {
  const internalInputRef = useRef<TextInput>(null)
  const inputRef = externalInputRef ?? internalInputRef
  const [stickerTab, setStickerTab] = useState<'stickers' | 'reactions'>('stickers')
  const [, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendButtonScale = useSharedValue(1)
  const sendButtonOpacity = useSharedValue(inputValue.trim() ? 1 : 0.5)

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    opacity: sendButtonOpacity.value,
  }))

  useEffect(() => {
    sendButtonOpacity.value = withTiming(inputValue.trim() ? 1 : 0.5, { duration: 150 })
  }, [inputValue, sendButtonOpacity])

  const handleSend = useCallback((): void => {
    if (inputValue.trim()) {
      haptics.trigger('light')
      sendButtonScale.value = withSequence(
        withSpring(1.2, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      )
      onSend(inputValue.trim(), 'text')
      setInputValue('')
      setIsTyping(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [inputValue, onSend, setInputValue, sendButtonScale])

  const handleTextChange = useCallback(
    (text: string): void => {
      setInputValue(text)
      setIsTyping(true)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        typingTimeoutRef.current = null
      }, 2000)
    },
    [setInputValue]
  )

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const sendButtonGesture = Gesture.Tap()
    .onBegin(() => {
      haptics.trigger('light')
      sendButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
    })
    .onFinalize(() => {
      sendButtonScale.value = withSpring(1, { damping: 15, stiffness: 300 })
      if (inputValue.trim()) {
        handleSend()
      }
    })

  const handleSubmitEditing = useCallback((): void => {
    if (inputValue.trim() && !isRecordingVoice) {
      handleSend()
    }
  }, [inputValue, isRecordingVoice, handleSend])

  return (
    <View style={styles.container}>
      <View style={styles.quickActions}>
        <Pressable
          onPress={() => {
            setShowTemplates(!showTemplates)
          }}
          style={styles.quickActionButton}
          accessibilityRole="button"
          accessibilityLabel="Templates"
        >
          <Text style={styles.quickActionText}>✨ Templates</Text>
        </Pressable>
        <Pressable
          onPress={onShareLocation}
          style={styles.quickActionButton}
          accessibilityRole="button"
          accessibilityLabel="Share location"
        >
          <Text style={styles.quickActionText}>📍 Location</Text>
        </Pressable>
      </View>

      {showTemplates && (
        <View style={styles.templateContainer}>
          <TemplatePanel
            onClose={() => {
              setShowTemplates(false)
            }}
            onSelect={t => {
              onTemplate(t)
              setShowTemplates(false)
            }}
          />
        </View>
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={() => {
            setShowStickers(true)
          }}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Stickers and reactions"
        >
          <Text style={styles.iconText}>😊</Text>
        </Pressable>

        {!isRecordingVoice ? (
          <>
            <TextInput
              ref={inputRef}
              value={inputValue}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
              onSubmitEditing={handleSubmitEditing}
              returnKeyType="send"
              blurOnSubmit={false}
              multiline
              accessibilityLabel="Message input"
              accessibilityHint="Type your message here. Press return to send."
              autoCorrect
              autoCapitalize="sentences"
              textContentType="none"
            />

            <Pressable
              onPressIn={() => {
                setIsRecordingVoice(true)
              }}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Record voice message"
            >
              <Text style={styles.iconText}>🎤</Text>
            </Pressable>

            <GestureDetector gesture={sendButtonGesture}>
              <Animated.View style={[styles.sendButtonContainer, sendButtonAnimatedStyle]}>
                <Pressable
                  disabled={!inputValue.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  accessibilityHint="Sends the current message"
                  accessibilityState={{ disabled: !inputValue.trim() }}
                >
                  <Text style={styles.sendButtonText}>➤</Text>
                </Pressable>
              </Animated.View>
            </GestureDetector>
          </>
        ) : (
          <View style={styles.voiceRecorderContainer}>
            <Text style={styles.voiceRecorderText}>Recording...</Text>
            <Pressable
              onPress={() => {
                setIsRecordingVoice(false)
              }}
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel recording"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Modal
        visible={showStickers}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowStickers(false)
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowStickers(false)
          }}
        >
          <View style={styles.stickerModal}>
            <View style={styles.stickerHeader}>
              <View style={styles.tabContainer}>
                <Pressable
                  onPress={() => {
                    setStickerTab('stickers')
                  }}
                  style={[styles.tab, stickerTab === 'stickers' && styles.tabActive]}
                >
                  <Text style={[styles.tabText, stickerTab === 'stickers' && styles.tabTextActive]}>
                    Stickers
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setStickerTab('reactions')
                  }}
                  style={[styles.tab, stickerTab === 'reactions' && styles.tabActive]}
                >
                  <Text
                    style={[styles.tabText, stickerTab === 'reactions' && styles.tabTextActive]}
                  >
                    Reactions
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  setShowStickers(false)
                }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close stickers"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.stickerGrid}>
              {stickerTab === 'stickers' ? (
                <View style={styles.grid}>
                  {CHAT_STICKERS.map(sticker => (
                    <Pressable
                      key={sticker.id}
                      onPress={() => {
                        haptics.trigger('selection')
                        onSend(sticker.emoji, 'sticker')
                        setShowStickers(false)
                      }}
                      style={styles.stickerItem}
                      accessibilityRole="button"
                      accessibilityLabel={`Send ${sticker.name} sticker`}
                    >
                      <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.grid}>
                  {REACTION_EMOJIS.map(emoji => (
                    <Pressable
                      key={emoji}
                      onPress={() => {
                        haptics.trigger('selection')
                        onQuickReaction?.(emoji)
                        setShowStickers(false)
                      }}
                      style={styles.stickerItem}
                      accessibilityRole="button"
                      accessibilityLabel={`React with ${emoji}`}
                    >
                      <Text style={styles.stickerEmoji}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  templateContainer: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'white',
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  sendButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C7CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C7CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  voiceRecorderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  voiceRecorderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  stickerModal: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  stickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: '#6C7CFF',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stickerGrid: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stickerItem: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerEmoji: {
    fontSize: 32,
  },
})
