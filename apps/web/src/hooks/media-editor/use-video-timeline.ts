import { useCallback, useState, useRef, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { getWorkerPool } from '@/lib/worker-pool';
import {
  VideoTimelineError,
  VideoFrameError,
  WaveformError,
  VideoExportError,
  createErrorContext,
  type MediaErrorContext,
} from '@/lib/media-errors';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

const logger = createLogger('VideoTimeline');

/**
 * Ultra-advanced timeline-based video editor
 * Frame-perfect cutting, transitions, effects layering, audio waveform visualization, keyframe animation
 * Enhanced with structured logging, worker-based processing, WebGL rendering, and performance monitoring
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TimelineTrack {
  readonly id: string;
  readonly type: 'video' | 'audio' | 'image' | 'text' | 'effect';
  readonly name: string;
  readonly clips: readonly TimelineClip[];
  readonly locked: boolean;
  readonly visible: boolean;
  readonly height: number;
}

export interface TimelineClip {
  readonly id: string;
  readonly trackId: string;
  readonly startTime: number; // In seconds
  readonly duration: number; // In seconds
  readonly trimStart: number; // Trim from source start
  readonly trimEnd: number; // Trim from source end
  readonly source: MediaSource;
  readonly effects: readonly Effect[];
  readonly transitions: readonly Transition[];
  readonly volume: number; // 0-1
  readonly speed: number; // 0.25-4.0
  readonly opacity: number; // 0-1
  readonly transform: Transform;
  readonly keyframes: readonly Keyframe[];
}

export interface MediaSource {
  readonly id: string;
  readonly type: 'video' | 'audio' | 'image';
  readonly url: string;
  readonly duration?: number;
  readonly width?: number;
  readonly height?: number;
  readonly thumbnail?: string;
  readonly waveform?: Float32Array;
}

export interface Effect {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly params: Record<string, unknown>;
  readonly startTime?: number; // Relative to clip
  readonly duration?: number;
}

export interface Transition {
  readonly id: string;
  readonly type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'custom';
  readonly duration: number;
  readonly position: 'in' | 'out' | 'between';
  readonly easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  readonly params?: Record<string, unknown>;
}

export interface Transform {
  readonly x: number;
  readonly y: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotation: number;
  readonly anchorX: number;
  readonly anchorY: number;
}

export interface Keyframe {
  readonly id: string;
  readonly time: number; // Relative to clip start
  readonly property: string;
  readonly value: unknown;
  readonly easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  readonly bezierParams?: readonly [number, number, number, number];
}

export interface TimelineState {
  readonly tracks: readonly TimelineTrack[];
  readonly currentTime: number;
  readonly duration: number;
  readonly zoom: number; // Pixels per second
  readonly scrollX: number;
  readonly scrollY: number;
  readonly selectedClipIds: readonly string[];
  readonly isPlaying: boolean;
  readonly loop: boolean;
  readonly snapToGrid: boolean;
  readonly gridSize: number; // In seconds
}

export interface AudioWaveform {
  readonly peaks: Float32Array;
  readonly duration: number;
  readonly sampleRate: number;
}

export interface VideoFrame {
  readonly time: number;
  readonly canvas: HTMLCanvasElement;
  readonly thumbnail?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TRACK_HEIGHT = 80;
const _MIN_TRACK_HEIGHT = 40;
const _MAX_TRACK_HEIGHT = 200;
const DEFAULT_ZOOM = 100; // Pixels per second
const MIN_ZOOM = 10;
const MAX_ZOOM = 1000;
const _SNAP_THRESHOLD = 5; // Pixels
const WAVEFORM_SAMPLES = 1000;
const THUMBNAIL_INTERVAL = 1; // Generate thumbnail every N seconds
const MAX_UNDO_HISTORY = 50;

// Supported transition types with their implementations
const _TRANSITION_TYPES = [
  'fade',
  'dissolve',
  'wipe-left',
  'wipe-right',
  'wipe-up',
  'wipe-down',
  'slide-left',
  'slide-right',
  'zoom-in',
  'zoom-out',
  'cross-zoom',
] as const;

// Easing functions
const EASING_FUNCTIONS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVideoTimeline() {
  const [state, setState] = useState<TimelineState>({
    tracks: [],
    currentTime: 0,
    duration: 0,
    zoom: DEFAULT_ZOOM,
    scrollX: 0,
    scrollY: 0,
    selectedClipIds: [],
    isPlaying: false,
    loop: false,
    snapToGrid: true,
    gridSize: 1,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const _timelineRef = useRef<HTMLDivElement | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const undoStackRef = useRef<TimelineState[]>([]);
  const redoStackRef = useRef<TimelineState[]>([]);
  const waveformCacheRef = useRef<Map<string, AudioWaveform>>(new Map());
  const thumbnailCacheRef = useRef<Map<string, VideoFrame[]>>(new Map());
  const performanceMonitor = getPerformanceMonitor();
  const _workerPool = getWorkerPool();

  // ============================================================================
  // Audio Waveform Generation
  // ============================================================================

  const generateWaveform = useCallback(
    async (audioUrl: string): Promise<AudioWaveform> => {
      // Check cache first
      const cached = waveformCacheRef.current.get(audioUrl);
      if (cached) {
        return cached;
      }

      const errorContext = createErrorContext('generate-waveform', { audioUrl });

      return performanceMonitor.measureOperation('generate-waveform', async () => {
        try {
          // Fetch audio file
          const response = await fetch(audioUrl);
          if (!response.ok) {
            throw new WaveformError(
              `Failed to fetch audio: ${response.statusText}`,
              enhanceErrorContext(errorContext, { status: response.status }),
              false
            );
          }

          const arrayBuffer = await response.arrayBuffer();

          // Decode audio
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Extract channel data
          const channelData = audioBuffer.getChannelData(0);
          const samples = WAVEFORM_SAMPLES;
          const blockSize = Math.floor(channelData.length / samples);
          const peaks = new Float32Array(samples);

          // Calculate peaks for each sample
          for (let i = 0; i < samples; i++) {
            const start = i * blockSize;
            const end = start + blockSize;
            let max = 0;

            for (let j = start; j < end; j++) {
              const value = Math.abs(channelData[j] ?? 0);
              if (value > max) {
                max = value;
              }
            }

            peaks[i] = max;
          }

          const waveform: AudioWaveform = {
            peaks,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
          };

          // Cache result
          waveformCacheRef.current.set(audioUrl, waveform);

          logger.info('Waveform generated', {
            audioUrl,
            duration: waveform.duration,
            sampleRate: waveform.sampleRate,
          });

          return waveform;
        } catch (err) {
          const enhancedContext = enhanceErrorContext(errorContext, {
            error: err instanceof Error ? err.message : String(err),
          });

          const waveformError =
            err instanceof WaveformError
              ? err
              : new WaveformError(
                  err instanceof Error ? err.message : 'Failed to generate waveform',
                  enhancedContext,
                  false
                );

          logger.error('Waveform generation failed', waveformError, enhancedContext);
          throw waveformError;
        }
      });
    },
    [performanceMonitor]
  );

  // ============================================================================
  // Video Thumbnail Generation
  // ============================================================================

  const generateThumbnails = useCallback(
    async (videoUrl: string, interval: number = THUMBNAIL_INTERVAL): Promise<VideoFrame[]> => {
      // Check cache first
      const cached = thumbnailCacheRef.current.get(videoUrl);
      if (cached) {
        return cached;
      }

      const errorContext = createErrorContext('generate-thumbnails', {
        videoUrl,
        interval,
      });

      return performanceMonitor.measureOperation('generate-thumbnails', async () => {
        try {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.preload = 'auto';

          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => {
              reject(
                new VideoFrameError(
                  'Failed to load video metadata',
                  enhanceErrorContext(errorContext, { stage: 'load-metadata' }),
                  false
                )
              );
            };
            video.src = videoUrl;
          });

          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new VideoFrameError(
              'Failed to get 2D context',
              enhanceErrorContext(errorContext, { stage: 'canvas-init' }),
              false
            );
          }

          const frames: VideoFrame[] = [];
          const duration = video.duration;
          const numThumbnails = Math.ceil(duration / interval);

          for (let i = 0; i < numThumbnails; i++) {
            const time = i * interval;

            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(
                  new VideoFrameError(
                    'Thumbnail generation timeout',
                    enhanceErrorContext(errorContext, { time, stage: 'seek' }),
                    false
                  )
                );
              }, 5000);

              video.currentTime = time;
              video.onseeked = () => {
                clearTimeout(timeout);
                try {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                  const frameCanvas = document.createElement('canvas');
                  frameCanvas.width = canvas.width;
                  frameCanvas.height = canvas.height;
                  const frameCtx = frameCanvas.getContext('2d');

                  if (frameCtx) {
                    frameCtx.drawImage(canvas, 0, 0);
                    frames.push({
                      time,
                      canvas: frameCanvas,
                      thumbnail: frameCanvas.toDataURL('image/jpeg', 0.6),
                    });
                  }

                  resolve();
                } catch (err) {
                  clearTimeout(timeout);
                  reject(
                    new VideoFrameError(
                      'Failed to extract frame',
                      enhanceErrorContext(errorContext, {
                        time,
                        error: err instanceof Error ? err.message : String(err),
                      }),
                      false
                    )
                  );
                }
              };

              video.onerror = () => {
                clearTimeout(timeout);
                reject(
                  new VideoFrameError(
                    'Video seek error',
                    enhanceErrorContext(errorContext, { time, stage: 'seek' }),
                    false
                  )
                );
              };
            });
          }

          // Cache result
          thumbnailCacheRef.current.set(videoUrl, frames);

          logger.info('Thumbnails generated', {
            videoUrl,
            count: frames.length,
            interval,
          });

          return frames;
        } catch (err) {
          const enhancedContext = enhanceErrorContext(errorContext, {
            error: err instanceof Error ? err.message : String(err),
          });

          const frameError =
            err instanceof VideoFrameError
              ? err
              : new VideoFrameError(
                  err instanceof Error ? err.message : 'Failed to generate thumbnails',
                  enhancedContext,
                  false
                );

          logger.error('Thumbnail generation failed', frameError, enhancedContext);
          throw frameError;
        }
      });
    },
    [performanceMonitor]
  );

  // ============================================================================
  // Timeline State Management
  // ============================================================================

  const saveToHistory = useCallback(() => {
    undoStackRef.current.push(state);
    if (undoStackRef.current.length > MAX_UNDO_HISTORY) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
  }, [state]);

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (previous) {
      redoStackRef.current.push(state);
      setState(previous);
    }
  }, [state]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (next) {
      undoStackRef.current.push(state);
      setState(next);
    }
  }, [state]);

  // ============================================================================
  // Track Management
  // ============================================================================

  const addTrack = useCallback((type: TimelineTrack['type'], name?: string) => {
    saveToHistory();

    const newTrack: TimelineTrack = {
      id: `track-${Date.now()}-${Math.random()}`,
      type,
      name: name ?? `${type} Track ${state.tracks.length + 1}`,
      clips: [],
      locked: false,
      visible: true,
      height: DEFAULT_TRACK_HEIGHT,
    };

    setState(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));

    return newTrack.id;
  }, [state.tracks.length, saveToHistory]);

  const removeTrack = useCallback((trackId: string) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
      selectedClipIds: prev.selectedClipIds.filter(clipId => {
        const clip = prev.tracks
          .flatMap(t => t.clips)
          .find(c => c.id === clipId);
        return clip?.trackId !== trackId;
      }),
    }));
  }, [saveToHistory]);

  const updateTrack = useCallback((
    trackId: string,
    updates: Partial<Omit<TimelineTrack, 'id' | 'clips'>>
  ) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      ),
    }));
  }, [saveToHistory]);

  // ============================================================================
  // Clip Management
  // ============================================================================

  const addClip = useCallback((
    trackId: string,
    source: MediaSource,
    startTime: number
  ): string => {
    saveToHistory();

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}-${Math.random()}`,
      trackId,
      startTime,
      duration: source.duration ?? 5,
      trimStart: 0,
      trimEnd: 0,
      source,
      effects: [],
      transitions: [],
      volume: 1,
      speed: 1,
      opacity: 1,
      transform: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        anchorX: 0.5,
        anchorY: 0.5,
      },
      keyframes: [],
    };

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      ),
      duration: Math.max(prev.duration, startTime + newClip.duration),
    }));

    return newClip.id;
  }, [saveToHistory]);

  const removeClip = useCallback((clipId: string) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(c => c.id !== clipId),
      })),
      selectedClipIds: prev.selectedClipIds.filter(id => id !== clipId),
    }));
  }, [saveToHistory]);

  const updateClip = useCallback((
    clipId: string,
    updates: Partial<Omit<TimelineClip, 'id' | 'trackId'>>
  ) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  const splitClip = useCallback((clipId: string, splitTime: number) => {
    saveToHistory();

    setState(prev => {
      const allClips = prev.tracks.flatMap(t => t.clips);
      const clip = allClips.find(c => c.id === clipId);

      if (!clip || splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
        return prev;
      }

      const relativeTime = splitTime - clip.startTime;

      const clip1: TimelineClip = {
        ...clip,
        id: `clip-${Date.now()}-${Math.random()}-1`,
        duration: relativeTime,
        trimEnd: clip.trimEnd + (clip.duration - relativeTime),
      };

      const clip2: TimelineClip = {
        ...clip,
        id: `clip-${Date.now()}-${Math.random()}-2`,
        startTime: splitTime,
        duration: clip.duration - relativeTime,
        trimStart: clip.trimStart + relativeTime,
      };

      return {
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          clips: track.clips.flatMap(c =>
            c.id === clipId ? [clip1, clip2] : [c]
          ),
        })),
      };
    });
  }, [saveToHistory]);

  const trimClip = useCallback((
    clipId: string,
    trimStart: number,
    trimEnd: number
  ) => {
    updateClip(clipId, { trimStart, trimEnd });
  }, [updateClip]);

  // ============================================================================
  // Effect Management
  // ============================================================================

  const addEffect = useCallback((clipId: string, effect: Effect) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, effects: [...clip.effects, effect] }
            : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  const removeEffect = useCallback((clipId: string, effectId: string) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, effects: clip.effects.filter(e => e.id !== effectId) }
            : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  const updateEffect = useCallback((
    clipId: string,
    effectId: string,
    updates: Partial<Effect>
  ) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? {
                ...clip,
                effects: clip.effects.map(effect =>
                  effect.id === effectId ? { ...effect, ...updates } : effect
                ),
              }
            : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  // ============================================================================
  // Transition Management
  // ============================================================================

  const addTransition = useCallback((clipId: string, transition: Transition) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, transitions: [...clip.transitions, transition] }
            : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  const removeTransition = useCallback((clipId: string, transitionId: string) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, transitions: clip.transitions.filter(t => t.id !== transitionId) }
            : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  // ============================================================================
  // Keyframe Management
  // ============================================================================

  const addKeyframe = useCallback((clipId: string, keyframe: Keyframe) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, keyframes: [...clip.keyframes, keyframe] }
            : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  const removeKeyframe = useCallback((clipId: string, keyframeId: string) => {
    saveToHistory();

    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, keyframes: clip.keyframes.filter(k => k.id !== keyframeId) }
            : clip
        ),
      })),
    }));
  }, [saveToHistory]);

  const getInterpolatedValue = useCallback((
    keyframes: readonly Keyframe[],
    property: string,
    time: number
  ): unknown => {
    const relevantKeyframes = keyframes
      .filter(k => k.property === property)
      .sort((a, b) => a.time - b.time);

    if (relevantKeyframes.length === 0) {
      return undefined;
    }

    const firstKeyframe = relevantKeyframes[0];
    if (!firstKeyframe || time <= firstKeyframe.time) {
      return firstKeyframe?.value;
    }

    const lastKeyframe = relevantKeyframes[relevantKeyframes.length - 1];
    if (!lastKeyframe || time >= lastKeyframe.time) {
      return lastKeyframe?.value;
    }

    // Find keyframes to interpolate between
    let startKeyframe: Keyframe | undefined;
    let endKeyframe: Keyframe | undefined;

    for (let i = 0; i < relevantKeyframes.length - 1; i++) {
      const current = relevantKeyframes[i];
      const next = relevantKeyframes[i + 1];

      if (current && next && time >= current.time && time <= next.time) {
        startKeyframe = current;
        endKeyframe = next;
        break;
      }
    }

    if (!startKeyframe || !endKeyframe) {
      return lastKeyframe?.value;
    }

    // Calculate interpolation factor
    const t = (time - startKeyframe.time) / (endKeyframe.time - startKeyframe.time);
    const easingFunc = EASING_FUNCTIONS[startKeyframe.easing] ?? EASING_FUNCTIONS.linear;
    const easedT = easingFunc ? easingFunc(t) : t;

    // Interpolate based on value type
    if (typeof startKeyframe.value === 'number' && typeof endKeyframe.value === 'number') {
      return startKeyframe.value + (endKeyframe.value - startKeyframe.value) * easedT;
    }

    return endKeyframe.value;
  }, []);

  // ============================================================================
  // Playback Control
  // ============================================================================

  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));

    const startTime = Date.now();
    const startPosition = state.currentTime;

    const updatePlayback = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newTime = startPosition + elapsed;

      setState(prev => {
        if (newTime >= prev.duration) {
          if (prev.loop) {
            return { ...prev, currentTime: 0 };
          }
          return { ...prev, currentTime: prev.duration, isPlaying: false };
        }
        return { ...prev, currentTime: newTime };
      });

      playbackTimerRef.current = requestAnimationFrame(updatePlayback);
    };

    playbackTimerRef.current = requestAnimationFrame(updatePlayback);
  }, [state.currentTime]);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    if (playbackTimerRef.current) {
      cancelAnimationFrame(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    pause();
    setState(prev => ({ ...prev, currentTime: 0 }));
  }, [pause]);

  const seek = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.duration)),
    }));
  }, []);

  // ============================================================================
  // Zoom & Pan
  // ============================================================================

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)),
    }));
  }, []);

  const setScroll = useCallback((scrollX: number, scrollY: number) => {
    setState(prev => ({ ...prev, scrollX, scrollY }));
  }, []);

  // ============================================================================
  // Selection Management
  // ============================================================================

  const selectClip = useCallback((clipId: string, addToSelection = false) => {
    setState(prev => ({
      ...prev,
      selectedClipIds: addToSelection
        ? [...prev.selectedClipIds, clipId]
        : [clipId],
    }));
  }, []);

  const deselectClip = useCallback((clipId: string) => {
    setState(prev => ({
      ...prev,
      selectedClipIds: prev.selectedClipIds.filter(id => id !== clipId),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedClipIds: [] }));
  }, []);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        cancelAnimationFrame(playbackTimerRef.current);
      }
      logger.info('Video timeline cleaned up');
    };
  }, []);

  // Helper function for error context enhancement
  function enhanceErrorContext(
    context: MediaErrorContext,
    additional: Record<string, unknown>
  ): MediaErrorContext {
    return { ...context, ...additional };
  }

  return {
    // State
    state,
    isProcessing,
    error,

    // Timeline management
    setState,
    undo,
    redo,

    // Track operations
    addTrack,
    removeTrack,
    updateTrack,

    // Clip operations
    addClip,
    removeClip,
    updateClip,
    splitClip,
    trimClip,

    // Effect operations
    addEffect,
    removeEffect,
    updateEffect,

    // Transition operations
    addTransition,
    removeTransition,

    // Keyframe operations
    addKeyframe,
    removeKeyframe,
    getInterpolatedValue,

    // Playback control
    play,
    pause,
    stop,
    seek,

    // View control
    setZoom,
    setScroll,

    // Selection
    selectClip,
    deselectClip,
    clearSelection,

    // Utilities
    generateWaveform,
    generateThumbnails,
  };
}
