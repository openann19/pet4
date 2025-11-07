'use client'

import { editMedia } from '@/core/services/media/edit-media'
import { useUploadPicker } from '@/core/services/media/picker'
import type { ImageOperation, MediaInput, VideoOperation } from '@/core/types/media-types'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { createLogger } from '@/lib/logger'
import React, { useCallback, useState } from 'react'
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated'
import { DropZoneWeb } from './drop-zone-web'
import { MediaEditor } from './MediaEditor'
import { VideoTrimmer } from './video-trimmer'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('UploadAndEditScreen')

const isWeb = typeof window !== 'undefined'

export interface UploadAndEditScreenProps {
  onDone: (outputUri: string) => void
  onCancel?: () => void
}

export function UploadAndEditScreen({
  onDone,
  onCancel,
}: UploadAndEditScreenProps): React.ReactElement {
  const { pickAny } = useUploadPicker()
  const [media, setMedia] = useState<MediaInput | null>(null)
  const [startSec, setStartSec] = useState(0)
  const [endSec, setEndSec] = useState<number | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const aBusy = useSharedValue(0)

  const doPick = useCallback(async () => {
    const m = await pickAny()
    if (isTruthy(m)) {
      setMedia(m)
    }
  }, [pickAny])

  const onTrimChange = useCallback((s: number, e: number) => {
    setStartSec(s)
    setEndSec(e)
  }, [])

  const runExport = useCallback(async () => {
    if (!media || busy) {
      return
    }

    setBusy(true)
    aBusy.value = withTiming(1, { duration: 160 })

    try {
      if (media.type === 'image') {
        const ops: ImageOperation[] = []
        const out = await editMedia(media, ops, { imageFormat: 'jpeg', quality: 0.92 })
        onDone(out.uri)
      } else {
        const ops: VideoOperation[] = []

        if (typeof endSec === 'number' && endSec > startSec) {
          ops.push({
            type: 'trim',
            startSec: Math.max(0, startSec),
            endSec,
          })
        }

        ops.push({
          type: 'resize',
          width: 1080,
          height: 1920,
        })

        const out = await editMedia(media, ops, { quality: 0.9 })
        onDone(out.uri)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Export failed', err, { mediaType: media.type })
      throw err
    } finally {
      setBusy(false)
      aBusy.value = withTiming(0, { duration: 160 })
    }
  }, [media, busy, startSec, endSec, onDone, aBusy])

  const handleReplace = useCallback(() => {
    setMedia(null)
    setStartSec(0)
    setEndSec(undefined)
  }, [])

  const handleImageDone = useCallback(
    (uri: string) => {
      onDone(uri)
    },
    [onDone]
  )

  const handleDrop = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file)

      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => {
          setMedia({
            type: 'image',
            uri: url,
            width: img.naturalWidth,
            height: img.naturalHeight,
          })
        }
        img.onerror = () => {
          // Silently fail - user can try again
        }
        img.src = url
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          setMedia({
            type: 'video',
            uri: url,
            durationSec: video.duration,
          })
        }
        video.onerror = () => {
          // Silently fail - user can try again
        }
        video.src = url
      }
    },
    []
  )

  return (
    <div style={styles['container']}>
        <h2 style={styles['title']}>Upload & Edit</h2>

        <DropZoneWeb onDrop={handleDrop} />

        {!media ? (
          <div style={styles['row']}>
            <Button label="Upload Photo/Video" onPress={doPick} />
          </div>
        ) : media.type === 'image' ? (
          <div style={styles['editorWrap']}>
            <MediaEditor
              source={media}
              onDone={handleImageDone}
              {...(onCancel ? { onCancel } : {})}
            />
            <div style={styles['actions']}>
              <Button label={busy ? 'Processing…' : 'Export'} onPress={runExport} disabled={busy} />
              <Button label="Replace" variant="secondary" onPress={handleReplace} />
            </div>
          </div>
        ) : (
          <div style={styles['videoWrap']}>
            <VideoPreview uri={media.uri} />
            <VideoTrimmer
              uri={media.uri}
              {...(media.durationSec !== undefined ? { durationSec: media.durationSec } : {})}
              onChange={onTrimChange}
            />
            <div style={styles['actions']}>
              <Button label={busy ? 'Transcoding…' : 'Export'} onPress={runExport} disabled={busy} />
              <Button label="Replace" variant="secondary" onPress={handleReplace} />
            </div>
          </div>
        )}
    </div>
  )
}

interface VideoPreviewProps {
  uri: string
}

function VideoPreview({ uri }: VideoPreviewProps): React.ReactElement {
  if (isTruthy(isWeb)) {
    return (
      <video
        src={uri}
        controls
        style={{
          width: '100%',
          borderRadius: 12,
          outline: 'none',
          backgroundColor: '#222',
          marginBottom: 12,
        }}
      />
    )
  }

  return (
    <div style={styles['videoPlaceholder']}>
      <span style={styles['videoPlaceholderText']}>Video selected</span>
    </div>
  )
}

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps): React.ReactElement {
  const textColor = variant === 'primary' && !disabled ? '#000' : '#fff'

  const handleClick = disabled ? undefined : onPress

  return (
    <AnimatedView
      {...(handleClick ? { onClick: handleClick } : {})}
      style={{
        ...styles['btn'],
        ...(variant === 'secondary' ? styles['btnSecondary'] : styles['btnPrimary']),
        ...(disabled ? styles['btnDisabled'] : {}),
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Animated.Text
        style={{
          color: textColor,
          fontWeight: '600',
          fontSize: 14,
        }}
      >
        {label}
      </Animated.Text>
    </AnimatedView>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editorWrap: {
    flex: 1,
  },
  videoWrap: {
    flex: 1,
  },
  videoPlaceholder: {
    height: 220,
    borderRadius: 12,
    backgroundColor: '#222',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
  btn: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0af',
  },
  btnSecondary: {
    backgroundColor: '#444',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#666',
  },
  btnDisabled: {
    opacity: 0.6,
  },
}

