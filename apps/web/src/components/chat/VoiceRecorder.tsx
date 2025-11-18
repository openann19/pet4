import { useState, useEffect, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  MotionView,
} from '@petspark/motion';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@petspark/motion';
import { Microphone, X, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUIConfig } from "@/hooks/use-ui-config";

interface VoiceRecorderProps {
  onRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  onCancel: () => void;
  maxDuration?: number;
}

export default function VoiceRecorder({
  onRecorded,
  onCancel,
  maxDuration = 120,
}: VoiceRecorderProps) {
    const _uiConfig = useUIConfig();
    const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const timerRef = useRef<number | undefined>(undefined);

  // Animation values
  const containerOpacity = useSharedValue<number>(0);
  const containerScale = useSharedValue<number>(0.9);
  const micScale = useSharedValue<number>(1);

  useEffect(() => {
    void startRecording();

    // Animate container in
    const targetOpacity = 1 as const;
    const targetScale = 1 as const;
    containerOpacity.value = withTiming(targetOpacity, { duration: 300 });
    containerScale.value = withTiming(targetScale, { duration: 300 });

    // Animate microphone icon
    const micScaleMax = 1.2 as const;
    const micScaleMin = 1 as const;
    micScale.value = withRepeat(
      withSequence(withTiming(micScaleMax, { duration: 750 }), withTiming(micScaleMin, { duration: 750 })),
      -1,
      true
    );

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.start();
      visualize();

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            handleStopAndSend();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error('Unable to access microphone');
      onCancel();
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateWaveform = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalized = Math.min(average / 128, 1);

      setWaveform((prev) => {
        const newWaveform = [...prev, normalized];
        return newWaveform.slice(-50);
      });

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleStopAndSend = () => {
    stopRecording();

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.addEventListener(
        'stop',
        () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onRecorded(audioBlob, duration, waveform);
        },
        { once: true }
      );
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  })) as AnimatedStyle;

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  })) as AnimatedStyle;

  const containerStyleValue = useAnimatedStyleValue(containerStyle);
  const micStyleValue = useAnimatedStyleValue(micStyle);

  return (
    <div
      style={containerStyleValue}
      className="flex-1 flex items-center gap-3 glass-effect rounded-2xl p-3"
    >
      <div style={micStyleValue} className="shrink-0">
        <Microphone size={24} weight="fill" className="text-red-500" />
      </div>

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
            <WaveformBar key={idx} value={value} />
          ))}
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => void handleCancel()}
        className="shrink-0 w-10 h-10 p-0"
        aria-label="Cancel recording"
      >
        <X size={20} />
      </Button>

      <Button
        size="sm"
        onClick={() => void handleStopAndSend()}
        className="shrink-0 w-10 h-10 p-0 bg-linear-to-br from-primary to-accent"
        aria-label="Stop and send recording"
      >
        <Check size={20} weight="bold" />
      </Button>
    </div>
  );
}

function WaveformBar({ value }: { value: number }) {
  const height = useSharedValue<number>(0);

  useEffect(() => {
    const targetHeight = value * 100;
    height.value = withTiming(targetHeight, { duration: 100 });
  }, [value, height]);

  const barStyle = useAnimatedStyle(() => ({
    height: `${height.value}%`,
  }));

  return (
    <MotionView style={barStyle} className="flex-1 bg-primary rounded-full">
      <div />
    </MotionView>
  );
}
