/**
 * MessageAttachments Component (Mobile)
 * Premium attachment viewer with smooth animations and native interactions
 * Location: apps/mobile/src/components/chat/MessageAttachments.tsx
 */

import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion'
// MessageAttachment type - should be shared, using inline type for now
interface MessageAttachment {
  id: string
  type: 'photo' | 'video' | 'voice' | 'document'
  url: string
  thumbnail?: string
  name?: string
  size?: number
  duration?: number
  mimeType?: string
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)
const AnimatedView = Animated.createAnimatedComponent(View)

export interface MessageAttachmentsProps {
  attachments: (MessageAttachment & { waveform?: number[] })[]
}

export default function MessageAttachments({
  attachments,
}: MessageAttachmentsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {attachments.map(attachment => {
        if (attachment.type === 'voice') {
          return <VoiceAttachment key={attachment.id} attachment={attachment} />
        }
        if (attachment.type === 'photo') {
          return <PhotoAttachment key={attachment.id} attachment={attachment} />
        }
        if (attachment.type === 'video') {
          return <VideoAttachment key={attachment.id} attachment={attachment} />
        }
        if (attachment.type === 'document') {
          return <DocumentAttachment key={attachment.id} attachment={attachment} />
        }
        return null
      })}
    </View>
  )
}

interface VoiceAttachmentProps {
  attachment: MessageAttachment & { waveform?: number[] }
}

function VoiceAttachment({ attachment }: VoiceAttachmentProps): React.JSX.Element {
  const [isPlaying, setIsPlaying] = useState(false)

  const formatDuration = useCallback((seconds = 0): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins ?? '')}:${String(secs.toString().padStart(2, '0') ?? '')}`
  }, [])

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const waveform = attachment.waveform ?? Array.from({ length: 30 }, () => 0.5)

  return (
    <View style={styles.voiceContainer}>
      <TouchableOpacity
        onPress={togglePlayback}
        style={styles.playButton}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      <View style={styles.voiceContent}>
        <View
          style={styles.waveformContainer}
          accessibilityRole="image"
          accessibilityLabel="Audio waveform"
        >
          {waveform.map((value, idx) => (
            <View key={idx} style={[styles.waveformBar, { height: Math.max(8, value * 16) }]} />
          ))}
        </View>
        <Text style={styles.duration}>{formatDuration(attachment.duration)}</Text>
      </View>
    </View>
  )
}

interface PhotoAttachmentProps {
  attachment: MessageAttachment
}

function PhotoAttachment({ attachment }: PhotoAttachmentProps): React.JSX.Element {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 })
  }, [scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }, [scale])

  const handleDownload = useCallback(() => {
    void (async () => {
      try {
        const supported = await Linking.canOpenURL(attachment.url)
        if (supported) {
          await Linking.openURL(attachment.url)
        }
      } catch {
        // Handle error silently
      }
    })()
  }, [attachment.url])

  return (
    <AnimatedView style={[styles.photoContainer, animatedStyle]}>
      <Image
        source={{ uri: attachment.url }}
        style={styles.photo}
        resizeMode="cover"
        accessibilityLabel={attachment.name ?? 'Photo attachment'}
      />
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownload}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Download photo"
      >
        <Text style={styles.downloadIcon}>⬇</Text>
      </TouchableOpacity>
    </AnimatedView>
  )
}

interface VideoAttachmentProps {
  attachment: MessageAttachment
}

function VideoAttachment({ attachment }: VideoAttachmentProps): React.JSX.Element {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 })
  }, [scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }, [scale])

  return (
    <AnimatedView
      style={[styles.videoContainer, animatedStyle]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoIcon}>▶</Text>
        <Text style={styles.videoLabel}>{attachment.name ?? 'Video attachment'}</Text>
      </View>
    </AnimatedView>
  )
}

interface DocumentAttachmentProps {
  attachment: MessageAttachment
}

function DocumentAttachment({ attachment }: DocumentAttachmentProps): React.JSX.Element {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const formatFileSize = useCallback((bytes = 0): string => {
    if (bytes < 1024) return `${String(bytes ?? '')} B`
    if (bytes < 1024 * 1024) return `${String((bytes / 1024).toFixed(1) ?? '')} KB`
    return `${String((bytes / (1024 * 1024)).toFixed(1) ?? '')} MB`
  }, [])

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 })
  }, [scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }, [scale])

  const handleDownload = useCallback(() => {
    void (async () => {
      try {
        const supported = await Linking.canOpenURL(attachment.url)
        if (supported) {
          await Linking.openURL(attachment.url)
        }
      } catch {
        // Handle error silently
      }
    })()
  }, [attachment.url])

  return (
    <AnimatedTouchable
      style={[styles.documentContainer, animatedStyle]}
      onPress={handleDownload}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Download ${attachment.name ?? 'document'}`}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>DOC</Text>
      </View>
      <View style={styles.documentContent}>
        <Text style={styles.documentName} numberOfLines={1}>
          {attachment.name ?? 'Document'}
        </Text>
        <Text style={styles.documentSize}>{formatFileSize(attachment.size ?? 0)}</Text>
      </View>
      <Text style={styles.downloadIcon}>⬇</Text>
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: 'var(--color-accent-secondary-9)',
  },
  voiceContent: {
    flex: 1,
    gap: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 16,
  },
  waveformBar: {
    flex: 1,
    backgroundColor: 'var(--color-accent-secondary-9)',
    opacity: 0.4,
    borderRadius: 2,
    minHeight: 4,
  },
  duration: {
    fontSize: 10,
    opacity: 0.7,
    color: '#666',
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 300,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  downloadButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: 16,
    color: 'var(--color-bg-overlay)',
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 300,
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'var(--color-fg)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  videoIcon: {
    fontSize: 48,
    color: 'var(--color-bg-overlay)',
  },
  videoLabel: {
    fontSize: 12,
    color: 'var(--color-bg-overlay)',
    opacity: 0.8,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'var(--color-accent-secondary-9)',
  },
  documentContent: {
    flex: 1,
    minWidth: 0,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: 'var(--color-fg)',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
})
