# Effect Telemetry Usage Guide

**Enhanced telemetry system for tracking chat effects performance**

## Overview

The enhanced effect telemetry system provides comprehensive performance tracking for all chat effects, including:

- **Frame drop tracking** - Accurate detection of dropped frames based on device refresh rate
- **Device Hz integration** - Automatic detection and tracking of 60/120/240 Hz displays
- **Performance regression detection** - Automatic detection of performance degradation
- **Threshold alerts** - Configurable alerts for performance issues
- **Structured logging** - All metrics logged with structured data (no PII)

## Usage

### Basic Usage

```typescript
import { useEffectTelemetry } from '@/effects/core/use-effect-telemetry';

function MyEffectComponent() {
  const telemetry = useEffectTelemetry({
    effectName: 'send-warp',
    enabled: true,
  });

  const handleSend = useCallback(() => {
    // Start tracking
    telemetry.start();

    // Perform effect
    animateSend();

    // End tracking (success)
    telemetry.end(true);
  }, [telemetry]);

  return <button onClick={handleSend}>Send</button>;
}
```

### Advanced Usage with Error Handling

```typescript
import { useEffectTelemetry } from '@/effects/core/use-effect-telemetry';

function MyEffectComponent() {
  const telemetry = useEffectTelemetry({
    effectName: 'reaction-burst',
    enabled: true,
    alertOnThreshold: true,
    maxDroppedFrames: 2,
    maxDurationMs: 300,
  });

  const handleReaction = useCallback(async () => {
    try {
      // Start tracking
      const effectId = telemetry.start();

      // Perform effect
      await animateReaction();

      // End tracking (success)
      telemetry.end(true);
    } catch (error) {
      // End tracking (error)
      telemetry.end(false, error instanceof Error ? error : new Error(String(error)));
    }
  }, [telemetry]);

  return <button onClick={handleReaction}>React</button>;
}
```

### Custom Thresholds

```typescript
import { useEffectTelemetry } from '@/effects/core/use-effect-telemetry';

function MyEffectComponent() {
  const telemetry = useEffectTelemetry({
    effectName: 'confetti-match',
    enabled: true,
    alertOnThreshold: true,
    maxDroppedFrames: 5, // Allow more dropped frames for complex effects
    maxDurationMs: 600, // Allow longer duration for celebration effects
  });

  const handleMatch = useCallback(() => {
    telemetry.start();
    animateConfetti();
    telemetry.end(true);
  }, [telemetry]);

  return <button onClick={handleMatch}>Match!</button>;
}
```

### Accessing Device Information

```typescript
import { useEffectTelemetry } from '@/effects/core/use-effect-telemetry';

function MyEffectComponent() {
  const telemetry = useEffectTelemetry({
    effectName: 'typing-dots',
  });

  // Get device refresh rate
  const deviceHz = telemetry.getDeviceHz(); // 60, 120, or 240

  // Get current dropped frames (during effect)
  const droppedFrames = telemetry.getDroppedFrames();

  return (
    <div>
      <p>Device: {deviceHz}Hz</p>
      <p>Dropped Frames: {droppedFrames}</p>
    </div>
  );
}
```

## Effect Names

The following effect names are supported:

- `send-warp` - Send message warp effect
- `receive-air-cushion` - Receive message air cushion effect
- `typing-dots` - Typing indicator dots
- `reaction-burst` - Reaction burst effect
- `status-ticks` - Status ticks animation
- `swipe-reply-elastic` - Swipe to reply elastic effect
- `reply-ribbon` - Reply ribbon shader
- `glass-morph-zoom` - Glass morphism zoom effect
- `sticker-physics` - Sticker physics animation
- `scroll-fab-magnetic` - Scroll FAB magnetic effect
- `confetti-match` - Confetti match celebration
- `voice-wave` - Voice message waveform
- `link-preview` - Link preview fade-up
- `presence-aurora` - Presence aurora ring

## Performance Thresholds

### Default Thresholds

- **maxDroppedFrames**: 2 frames
- **maxDurationMs**: 300ms

### Custom Thresholds

You can customize thresholds per effect:

```typescript
const telemetry = useEffectTelemetry({
  effectName: 'confetti-match',
  maxDroppedFrames: 5, // Complex effects can drop more frames
  maxDurationMs: 600, // Celebration effects can take longer
});
```

## Performance Regression Detection

The telemetry system automatically detects performance regressions by:

1. **Tracking history** - Maintains a rolling history of the last 100 effect runs
2. **Comparing averages** - Compares current performance to recent average
3. **Detecting anomalies** - Flags regressions when:
   - Duration exceeds 1.5x average
   - Dropped frames exceed 2x average

### Regression Alerts

When a regression is detected, the system:

1. Logs a warning with regression details
2. Tracks the regression in telemetry
3. Optionally alerts via configured alert system

## Device Refresh Rate Detection

The telemetry system automatically detects device refresh rate:

- **Web**: Uses `requestAnimationFrame` timing
- **Mobile**: Uses native device detection (iOS/Android)
- **Fallback**: Defaults to 60Hz if detection fails

### Refresh Rate Scaling

The system automatically adjusts frame timing expectations based on detected refresh rate:

- **60Hz**: 16.67ms per frame
- **120Hz**: 8.33ms per frame
- **240Hz**: 4.17ms per frame

## Integration with Telemetry System

The hook integrates with the centralized telemetry system:

```typescript
import { logEffectStart, logEffectEnd, logEffectError } from '@/effects/chat/core/telemetry';

// Automatically called by useEffectTelemetry
logEffectStart('send-warp', {
  deviceHz: 120,
  reducedMotion: false,
});

logEffectEnd(effectId, {
  droppedFrames: 1,
  deviceHz: 120,
  reducedMotion: false,
  success: true,
});
```

## Logging

All telemetry events are logged with structured data:

```typescript
// Success
logger.info('Effect completed', {
  effect: 'send-warp',
  durationMs: 220,
  droppedFrames: 0,
  deviceHz: 120,
  reducedMotion: false,
  success: true,
});

// Threshold exceeded
logger.warn('Effect exceeded thresholds', {
  effect: 'send-warp',
  droppedFrames: 3,
  maxDroppedFrames: 2,
  durationMs: 350,
  maxDurationMs: 300,
});

// Performance regression
logger.warn('Performance regression detected', {
  effect: 'send-warp',
  durationMs: 450,
  droppedFrames: 5,
});

// Error
logger.error('Effect failed', error, {
  effect: 'send-warp',
  durationMs: 100,
  droppedFrames: 0,
  deviceHz: 120,
});
```

## Best Practices

### 1. Always Track Effects

```typescript
// ✅ Good
const telemetry = useEffectTelemetry({ effectName: 'send-warp' });
telemetry.start();
await animate();
telemetry.end(true);

// ❌ Bad
await animate(); // No tracking
```

### 2. Handle Errors

```typescript
// ✅ Good
try {
  telemetry.start();
  await animate();
  telemetry.end(true);
} catch (error) {
  telemetry.end(false, error);
}

// ❌ Bad
telemetry.start();
await animate(); // Error not tracked
```

### 3. Use Appropriate Thresholds

```typescript
// ✅ Good - Complex effects have higher thresholds
const telemetry = useEffectTelemetry({
  effectName: 'confetti-match',
  maxDroppedFrames: 5,
  maxDurationMs: 600,
});

// ❌ Bad - Simple effects shouldn't drop many frames
const telemetry = useEffectTelemetry({
  effectName: 'status-ticks',
  maxDroppedFrames: 10, // Too high
});
```

### 4. Disable in Development (Optional)

```typescript
const telemetry = useEffectTelemetry({
  effectName: 'send-warp',
  enabled: process.env.NODE_ENV === 'production',
});
```

## Examples

### Send Warp Effect

```typescript
import { useEffectTelemetry } from '@/effects/core/use-effect-telemetry';
import { useSendWarp } from '@/effects/chat/bubbles/use-send-warp';

function SendButton() {
  const telemetry = useEffectTelemetry({ effectName: 'send-warp' });
  const { animate } = useSendWarp();

  const handleSend = useCallback(async () => {
    telemetry.start();
    try {
      await animate();
      telemetry.end(true);
    } catch (error) {
      telemetry.end(false, error instanceof Error ? error : new Error(String(error)));
    }
  }, [telemetry, animate]);

  return <button onClick={handleSend}>Send</button>;
}
```

### Reaction Burst Effect

```typescript
import { useEffectTelemetry } from '@/effects/core/use-effect-telemetry';
import { useReactionBurst } from '@/effects/chat/reactions/use-reaction-burst';

function ReactionButton() {
  const telemetry = useEffectTelemetry({
    effectName: 'reaction-burst',
    maxDroppedFrames: 3,
  });
  const { animate } = useReactionBurst();

  const handleReaction = useCallback(async () => {
    telemetry.start();
    try {
      await animate('❤️');
      telemetry.end(true);
    } catch (error) {
      telemetry.end(false, error instanceof Error ? error : new Error(String(error)));
    }
  }, [telemetry, animate]);

  return <button onClick={handleReaction}>❤️</button>;
}
```

## Troubleshooting

### High Dropped Frames

If you're seeing high dropped frames:

1. **Check device refresh rate** - Use `telemetry.getDeviceHz()` to verify
2. **Reduce animation complexity** - Simplify animations for lower-end devices
3. **Adjust thresholds** - Increase `maxDroppedFrames` if appropriate
4. **Check for performance regressions** - Review logs for regression warnings

### Performance Regressions

If performance regressions are detected:

1. **Review recent changes** - Check what changed in the effect
2. **Compare device types** - Check if regression is device-specific
3. **Review logs** - Check telemetry logs for patterns
4. **Optimize effect** - Reduce animation complexity or duration

## API Reference

### `useEffectTelemetry(options)`

#### Options

- `effectName: EffectName | string` - Effect name to track
- `enabled?: boolean` - Enable/disable tracking (default: `true`)
- `alertOnThreshold?: boolean` - Enable threshold alerts (default: `true`)
- `maxDroppedFrames?: number` - Maximum dropped frames threshold (default: `2`)
- `maxDurationMs?: number` - Maximum duration threshold (default: `300`)

#### Returns

- `start: () => string | null` - Start tracking, returns effect ID
- `end: (success?: boolean, error?: Error) => void` - End tracking
- `getDeviceHz: () => number` - Get device refresh rate
- `getDroppedFrames: () => number` - Get current dropped frames count

## Related Documentation

- [Effect Telemetry Core](./EFFECT_TELEMETRY_CORE.md)
- [Device Refresh Rate Detection](./DEVICE_REFRESH_RATE.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING.md)
