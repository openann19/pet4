import { useState, useRef, useCallback } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { generateMessageId } from '@/lib/chat-utils'
import { isTruthy, isDefined } from '@/core/guards';

interface VoiceMessageData {
  blob: string
  duration: number
  waveform: number[]
}

export function useVoiceMessages(roomId: string) {
  const [voiceMessages, setVoiceMessages] = useStorage<Record<string, VoiceMessageData>>(
    `voice-messages-${String(roomId ?? '')}`,
    {}
  )
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const saveVoiceMessage = useCallback(async (
    audioBlob: Blob,
    duration: number,
    waveform: number[]
  ) => {
    const messageId = generateMessageId()
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Audio = reader.result as string
        
        setVoiceMessages((current) => ({
          ...current,
          [messageId]: { blob: base64Audio, duration, waveform }
        }))

        resolve(messageId)
      }
      reader.onerror = reject
      reader.readAsDataURL(audioBlob)
    })
  }, [setVoiceMessages])

  const toggleVoicePlayback = useCallback((messageId: string) => {
    if (!voiceMessages) return
    
    const voiceData = voiceMessages[messageId]
    if (!voiceData) return

    if (playingVoice === messageId) {
      if (isTruthy(audioRef.current)) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingVoice(null)
      return
    }

    if (isTruthy(audioRef.current)) {
      audioRef.current.pause()
      audioRef.current = null
    }

    const audio = new Audio(voiceData.blob)
    audio.onended = () => {
      setPlayingVoice(null)
      audioRef.current = null
    }
    audio.play()
    audioRef.current = audio
    setPlayingVoice(messageId)
  }, [voiceMessages, playingVoice])

  const stopPlayback = useCallback(() => {
    if (isTruthy(audioRef.current)) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingVoice(null)
  }, [])

  return {
    voiceMessages,
    playingVoice,
    saveVoiceMessage,
    toggleVoicePlayback,
    stopPlayback,
    getVoiceMessage: (messageId: string) => voiceMessages?.[messageId],
  }
}

