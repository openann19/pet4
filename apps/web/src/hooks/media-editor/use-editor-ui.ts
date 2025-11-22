import { useCallback, useState, useRef, useEffect } from 'react';

/**
 * Ultra-polished slider components with micro-interactions
 * Haptic feedback, gesture controls, undo/redo, keyboard shortcuts, beautiful animations
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SliderProps {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly label?: string;
  readonly unit?: string;
  readonly precision?: number;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly showValue?: boolean;
  readonly showTicks?: boolean;
  readonly tickInterval?: number;
  readonly disabled?: boolean;
  readonly hapticFeedback?: boolean;
  readonly onChange: (value: number) => void;
  readonly onChangeStart?: () => void;
  readonly onChangeEnd?: () => void;
}

export interface SliderState {
  readonly value: number;
  readonly isDragging: boolean;
  readonly isFocused: boolean;
  readonly isHovered: boolean;
  readonly touchIdentifier: number | null;
}

export interface GestureState {
  readonly startX: number;
  readonly startY: number;
  readonly startValue: number;
  readonly velocity: number;
  readonly lastMoveTime: number;
}

export interface UndoRedoState<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
}

export interface KeyboardShortcut {
  readonly key: string;
  readonly modifiers?: readonly ('ctrl' | 'shift' | 'alt' | 'meta')[];
  readonly action: () => void;
  readonly description: string;
}

// ============================================================================
// Constants
// ============================================================================

const HAPTIC_PATTERNS: Record<string, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  tick: [5, 5, 5],
  success: [10, 50, 10],
  error: [50, 10, 50, 10, 50],
};

const _ANIMATION_DURATION = 200; // ms
const VELOCITY_THRESHOLD = 0.5;
const MOMENTUM_DECAY = 0.95;
const _SNAP_THRESHOLD = 0.1;

// ============================================================================
// Haptic Feedback
// ============================================================================

export function triggerHaptic(pattern: keyof typeof HAPTIC_PATTERNS = 'light') {
  if ('vibrate' in navigator) {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    if (vibrationPattern) {
      navigator.vibrate(vibrationPattern);
    }
  }
}

// ============================================================================
// Undo/Redo Hook
// ============================================================================

export function useUndoRedo<T>(initialState: T, maxHistory = 50) {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback((newValue: T) => {
    setState(prev => ({
      past: [...prev.past, prev.present].slice(-maxHistory),
      present: newValue,
      future: [],
    }));
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      if (!previous) return prev;

      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      if (!next) return prev;

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setState({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    history: state,
  };
}

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

export function useKeyboardShortcuts(
  shortcuts: readonly KeyboardShortcut[],
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const modifiersMatch =
          (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
          shortcut.modifiers.every(modifier => {
            switch (modifier) {
              case 'ctrl':
                return event.ctrlKey;
              case 'shift':
                return event.shiftKey;
              case 'alt':
                return event.altKey;
              case 'meta':
                return event.metaKey;
              default:
                return false;
            }
          });

        if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// ============================================================================
// Advanced Slider Hook
// ============================================================================

export function useAdvancedSlider(props: SliderProps) {
  const {
    value: propValue,
    min,
    max,
    step = 1,
    hapticFeedback = true,
    onChange,
    onChangeStart,
    onChangeEnd,
  } = props;

  const [sliderState, setSliderState] = useState<SliderState>({
    value: propValue,
    isDragging: false,
    isFocused: false,
    isHovered: false,
    touchIdentifier: null,
  });

  const [gesture, setGesture] = useState<GestureState | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastHapticValueRef = useRef<number>(propValue);

  // ============================================================================
  // Value Calculation & Validation
  // ============================================================================

  const normalizeValue = useCallback(
    (value: number): number => {
      const _range = max - min;
      const normalized = Math.max(min, Math.min(max, value));

      if (step) {
        const steps = Math.round((normalized - min) / step);
        return min + steps * step;
      }

      return normalized;
    },
    [min, max, step]
  );

  const getValueFromPosition = useCallback(
    (clientX: number, clientY: number): number => {
      if (!sliderRef.current) return propValue;

      const rect = sliderRef.current.getBoundingClientRect();
      const isHorizontal = props.orientation !== 'vertical';

      let ratio: number;
      if (isHorizontal) {
        ratio = (clientX - rect.left) / rect.width;
      } else {
        ratio = 1 - (clientY - rect.top) / rect.height;
      }

      ratio = Math.max(0, Math.min(1, ratio));
      const value = min + ratio * (max - min);

      return normalizeValue(value);
    },
    [min, max, props.orientation, propValue, normalizeValue]
  );

  // ============================================================================
  // Haptic Feedback
  // ============================================================================

  const triggerHapticIfNeeded = useCallback(
    (newValue: number) => {
      if (!hapticFeedback) return;

      const valueChanged = Math.abs(newValue - lastHapticValueRef.current) >= step;

      if (valueChanged) {
        triggerHaptic('light');
        lastHapticValueRef.current = newValue;
      }
    },
    [hapticFeedback, step]
  );

  // ============================================================================
  // Mouse Handlers
  // ============================================================================

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (props.disabled) return;

      event.preventDefault();
      const newValue = getValueFromPosition(event.clientX, event.clientY);

      setSliderState(prev => ({
        ...prev,
        isDragging: true,
        value: newValue,
      }));

      setGesture({
        startX: event.clientX,
        startY: event.clientY,
        startValue: newValue,
        velocity: 0,
        lastMoveTime: Date.now(),
      });

      triggerHapticIfNeeded(newValue);
      onChangeStart?.();
      onChange(newValue);
    },
    [props.disabled, getValueFromPosition, triggerHapticIfNeeded, onChangeStart, onChange]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!sliderState.isDragging || props.disabled) return;

      const newValue = getValueFromPosition(event.clientX, event.clientY);
      const now = Date.now();

      setSliderState(prev => ({
        ...prev,
        value: newValue,
      }));

      setGesture(prev => {
        if (!prev) return null;

        const dt = (now - prev.lastMoveTime) / 1000;
        const velocity = dt > 0 ? (newValue - sliderState.value) / dt : 0;

        return {
          ...prev,
          velocity,
          lastMoveTime: now,
        };
      });

      triggerHapticIfNeeded(newValue);
      onChange(newValue);
    },
    [sliderState.isDragging, sliderState.value, props.disabled, getValueFromPosition, triggerHapticIfNeeded, onChange]
  );

  const handleMouseUp = useCallback(() => {
    if (!sliderState.isDragging) return;

    setSliderState(prev => ({
      ...prev,
      isDragging: false,
    }));

    // Apply momentum if velocity is high enough
    if (gesture && Math.abs(gesture.velocity) > VELOCITY_THRESHOLD) {
      let currentVelocity = gesture.velocity;
      let currentValue = sliderState.value;

      const applyMomentum = () => {
        currentVelocity *= MOMENTUM_DECAY;
        currentValue += currentVelocity * (1 / 60); // Assume 60fps

        const newValue = normalizeValue(currentValue);

        if (Math.abs(currentVelocity) > 0.01) {
          onChange(newValue);
          animationFrameRef.current = requestAnimationFrame(applyMomentum);
        } else {
          onChange(newValue);
          onChangeEnd?.();
        }
      };

      applyMomentum();
    } else {
      onChangeEnd?.();
    }

    setGesture(null);
  }, [sliderState.isDragging, sliderState.value, gesture, normalizeValue, onChange, onChangeEnd]);

  // ============================================================================
  // Touch Handlers
  // ============================================================================

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (props.disabled) return;

      const touch = event.touches[0];
      if (!touch) return;

      const newValue = getValueFromPosition(touch.clientX, touch.clientY);

      setSliderState(prev => ({
        ...prev,
        isDragging: true,
        value: newValue,
        touchIdentifier: touch.identifier,
      }));

      setGesture({
        startX: touch.clientX,
        startY: touch.clientY,
        startValue: newValue,
        velocity: 0,
        lastMoveTime: Date.now(),
      });

      triggerHapticIfNeeded(newValue);
      onChangeStart?.();
      onChange(newValue);
    },
    [props.disabled, getValueFromPosition, triggerHapticIfNeeded, onChangeStart, onChange]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!sliderState.isDragging || props.disabled) return;

      const touch = Array.from(event.touches).find(
        t => t.identifier === sliderState.touchIdentifier
      );

      if (!touch) return;

      const newValue = getValueFromPosition(touch.clientX, touch.clientY);
      const now = Date.now();

      setSliderState(prev => ({
        ...prev,
        value: newValue,
      }));

      setGesture(prev => {
        if (!prev) return null;

        const dt = (now - prev.lastMoveTime) / 1000;
        const velocity = dt > 0 ? (newValue - sliderState.value) / dt : 0;

        return {
          ...prev,
          velocity,
          lastMoveTime: now,
        };
      });

      triggerHapticIfNeeded(newValue);
      onChange(newValue);
    },
    [sliderState.isDragging, sliderState.value, sliderState.touchIdentifier, props.disabled, getValueFromPosition, triggerHapticIfNeeded, onChange]
  );

  const handleTouchEnd = useCallback(() => {
    if (!sliderState.isDragging) return;

    setSliderState(prev => ({
      ...prev,
      isDragging: false,
      touchIdentifier: null,
    }));

    onChangeEnd?.();
    setGesture(null);
  }, [sliderState.isDragging, onChangeEnd]);

  // ============================================================================
  // Keyboard Handlers
  // ============================================================================

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (props.disabled || !sliderState.isFocused) return;

      let newValue = sliderState.value;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          event.preventDefault();
          newValue = normalizeValue(sliderState.value - step);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          event.preventDefault();
          newValue = normalizeValue(sliderState.value + step);
          break;
        case 'Home':
          event.preventDefault();
          newValue = min;
          break;
        case 'End':
          event.preventDefault();
          newValue = max;
          break;
        case 'PageDown':
          event.preventDefault();
          newValue = normalizeValue(sliderState.value - step * 10);
          break;
        case 'PageUp':
          event.preventDefault();
          newValue = normalizeValue(sliderState.value + step * 10);
          break;
        default:
          return;
      }

      setSliderState(prev => ({ ...prev, value: newValue }));
      triggerHapticIfNeeded(newValue);
      onChange(newValue);
    },
    [props.disabled, sliderState.isFocused, sliderState.value, step, min, max, normalizeValue, triggerHapticIfNeeded, onChange]
  );

  // ============================================================================
  // Event Listeners
  // ============================================================================

  useEffect(() => {
    if (sliderState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }

    return undefined;
  }, [sliderState.isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return undefined;
    };
  }, []);

  // ============================================================================
  // Sync prop value
  // ============================================================================

  useEffect(() => {
    if (!sliderState.isDragging) {
      setSliderState(prev => ({ ...prev, value: propValue }));
    }
  }, [propValue, sliderState.isDragging]);

  return {
    sliderState,
    sliderRef,
    handlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      onKeyDown: handleKeyDown,
      onFocus: () => setSliderState(prev => ({ ...prev, isFocused: true })),
      onBlur: () => setSliderState(prev => ({ ...prev, isFocused: false })),
      onMouseEnter: () => setSliderState(prev => ({ ...prev, isHovered: true })),
      onMouseLeave: () => setSliderState(prev => ({ ...prev, isHovered: false })),
    },
    percentage: ((sliderState.value - min) / (max - min)) * 100,
  };
}

// ============================================================================
// Gesture Recognition Hook
// ============================================================================

export interface SwipeGesture {
  readonly direction: 'left' | 'right' | 'up' | 'down';
  readonly distance: number;
  readonly velocity: number;
  readonly duration: number;
}

export function useGestures(element: HTMLElement | null) {
  const [gesture, setGesture] = useState<SwipeGesture | null>(null);
  const gestureStateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
  } | null>(null);

  useEffect(() => {
    if (!element) return undefined;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      gestureStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!gestureStateRef.current) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - gestureStateRef.current.startX;
      const deltaY = touch.clientY - gestureStateRef.current.startY;
      const duration = Date.now() - gestureStateRef.current.startTime;

      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const velocity = distance / duration;

      let direction: SwipeGesture['direction'];
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      setGesture({
        direction,
        distance,
        velocity,
        duration,
      });

      gestureStateRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element]);

  return gesture;
}
