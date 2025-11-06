import React from 'react'
import { View, TextInput, Pressable, StyleSheet } from 'react-native'
import { MotionView } from '@petspark/motion'
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'
import type { ChatMessage } from '@/lib/chat-types'

export interface ChatInputBarNativeProps {
  value: string
  setValue: (v: string) => void
  onSend: (content: string, type?: ChatMessage['type']) => void
  inputRef?: React.RefObject<TextInput>
}

export function ChatInputBarNative({
  value,
  setValue,
  onSend,
  inputRef: externalInputRef,
}: ChatInputBarNativeProps): JSX.Element {
  const internalInputRef = React.useRef<TextInput>(null)
  const inputRef = externalInputRef ?? internalInputRef
  const bounce = useBounceOnTap()

  const handleSend = (): void => {
    if (value.trim()) {
      onSend(value.trim(), 'text')
      setValue('')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          placeholder="Type a message…"
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={styles.input}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          accessibilityLabel="Message input"
        />
        <MotionView animatedStyle={bounce.animatedStyle}>
          <Pressable
            onPressIn={bounce.handlePressIn}
            onPressOut={() => {
              bounce.handlePressOut()
              handleSend()
            }}
            style={styles.sendButton}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <View style={styles.sendIcon} />
          </Pressable>
        </MotionView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'white',
    fontSize: 16,
  },
  sendButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: '#6C7CFF',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 2,
  },
})

