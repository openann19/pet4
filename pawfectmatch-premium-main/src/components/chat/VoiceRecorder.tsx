import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Microphone, X, Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface VoiceRecorderProps {
  onRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void
  onCancel: () => void
  maxDuration?: number
}

export default function VoiceRecorder({ 
  onRecorded, 
  onCancel,
  maxDuration = 120 
}: VoiceRecorderProps) {
  const [duration, setDuration] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number | undefined>(undefined)
  const audioContextRef = useRef<AudioContext | undefined>(undefined)
  const analyserRef = useRef<AnalyserNode | undefined>(undefined)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    startRecording()
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data)
      })

      mediaRecorder.start()
      visualize()

      timerRef.current = window.setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            handleStopAndSend()
            return prev
          }
          return prev + 1
        })
      }, 1000)

    } catch {
      toast.error('Unable to access microphone')
      onCancel()
    }
  }

  const visualize = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const updateWaveform = () => {
      if (!analyserRef.current) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      
      const average = dataArray.reduce((a, b) => a + b) / bufferLength
      const normalized = Math.min(average / 128, 1)
      
      setWaveform(prev => {
        const newWaveform = [...prev, normalized]
        return newWaveform.slice(-50)
      })

      animationFrameRef.current = requestAnimationFrame(updateWaveform)
    }

    updateWaveform()
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleStopAndSend = () => {
    stopRecording()

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        onRecorded(audioBlob, duration, waveform)
      }, { once: true })
    }
  }

  const handleCancel = () => {
    stopRecording()
    onCancel()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex-1 flex items-center gap-3 glass-effect rounded-2xl p-3"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="shrink-0"
      >
        <Microphone size={24} weight="fill" className="text-red-500" />
      </motion.div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Recording</span>
          <span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
          {maxDuration && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDuration(maxDuration - duration)} left
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5 h-6">
          {waveform.map((value, idx) => (
            <motion.div
              key={idx}
              className="flex-1 bg-primary rounded-full"
              initial={{ height: 0 }}
              animate={{ height: `${value * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={handleCancel}
        className="shrink-0"
      >
        <X size={20} />
      </Button>

      <Button
        size="icon"
        onClick={handleStopAndSend}
        className="shrink-0 bg-gradient-to-br from-primary to-accent"
      >
        <Check size={20} weight="bold" />
      </Button>
    </motion.div>
  )
}
