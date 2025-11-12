/**
 * Ultra-Advanced Media Editor
 * CapCut-outperforming photo/video editor with AI-powered features
 *
 * Features:
 * - AI-powered background removal with edge refinement
 * - 30+ professional filters (vintage, cinematic, anime, etc.)
 * - Multi-track timeline video editor with keyframe animation
 * - Smart crop with face detection
 * - Content-aware scaling
 * - 12 aspect ratio presets for all platforms
 * - Haptic feedback and gesture controls
 * - Undo/redo system
 * - Keyboard shortcuts
 * - Real-time preview
 */

// Core media processing
export { useMediaProcessor } from './use-media-processor';
export type {
  MediaAsset,
  MediaMetadata,
  ProcessingOptions,
  CanvasOperation,
  VideoFrame,
  ProcessingProgress,
  ShaderProgram,
} from './use-media-processor';

// Background removal
export { useBackgroundRemoval } from './use-background-removal';
export type {
  BackgroundRemovalOptions,
  SegmentationResult,
  EdgeDetectionParams,
  AlphaMattingParams,
} from './use-background-removal';

// Filters
export { useFilters, FILTER_PRESETS } from './use-filters';
export type {
  FilterOptions,
  FilterPreset,
  FilterCategory,
  FilterParams,
  LUT,
} from './use-filters';

// Video timeline
export { useVideoTimeline } from './use-video-timeline';
export type {
  TimelineTrack,
  TimelineClip,
  MediaSource,
  Effect,
  Transition,
  Transform,
  Keyframe,
  TimelineState,
  AudioWaveform,
} from './use-video-timeline';

// Smart resize & crop
export { useSmartResize, ASPECT_RATIO_PRESETS } from './use-smart-resize';
export type {
  AspectRatioPreset,
  CropRegion,
  FaceDetectionResult,
  SmartCropOptions,
  ContentAwareScaleOptions,
  PanZoomAnimation,
} from './use-smart-resize';

// UI components & interactions
export {
  useAdvancedSlider,
  useUndoRedo,
  useKeyboardShortcuts,
  useGestures,
  triggerHaptic,
} from './use-editor-ui';
export type {
  SliderProps,
  SliderState,
  GestureState,
  UndoRedoState,
  KeyboardShortcut,
  SwipeGesture,
} from './use-editor-ui';

// Main editor orchestrator
export { useMediaEditor } from './use-media-editor';
export type {
  MediaEditorOptions,
  EditorState,
  EditorPreset,
} from './use-media-editor';
