import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native'
// Stubs for unavailable imports
const useApp = () => ({
  t: {
    community: {
      createPost: 'Create Post',
      postPlaceholder: "Share what's on your mind...",
      charsRemaining: 'characters remaining',
    },
    common: {
      cancel: 'Cancel',
      post: 'Post',
    },
  },
})
const haptics = { selection: () => {}, error: () => {}, success: () => {}, light: () => {}, impact: () => {} }
const toast = { success: (_: string) => {}, error: (_: string) => {} }

export type PostComposerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: (() => void) | undefined
}

const MAX_CHARS = 1000

export function PostComposer({ open, onOpenChange, onPostCreated }: PostComposerProps) {
  const { t } = useApp()
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const remainingChars = MAX_CHARS - text.length
  const canPost = text.trim().length > 0 && remainingChars >= 0 && !isSubmitting

  const handleSubmit = async () => {
    if (!canPost) return
    setIsSubmitting(true)
    haptics.impact()
    setTimeout(() => {
      haptics.success()
      toast.success('Post created successfully!')
      setText('')
      setIsSubmitting(false)
      onPostCreated?.()
      onOpenChange(false)
    }, 1200)
  }

  if (!open) return null

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.community?.createPost || 'Create Post'}</Text>
        <TextInput
          style={styles.textarea}
          placeholder={t.community?.postPlaceholder || "Share what's on your mind..."}
          value={text}
          onChangeText={setText}
          maxLength={MAX_CHARS}
          multiline
        />
        <Text style={styles.charCount}>{remainingChars} {t.community?.charsRemaining || 'characters remaining'}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onOpenChange(false)} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t.common?.cancel || 'Cancel'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={[styles.postButton, !canPost && styles.postButtonDisabled]} disabled={!canPost}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postText}>{t.common?.post || 'Post'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  textarea: {
    width: '100%',
    minHeight: 120,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  postButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginLeft: 12,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
})
