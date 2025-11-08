# Performance Validation Guide for Mobile Animations

## Overview

This guide provides comprehensive performance validation for mobile animation hooks and components to ensure 60fps performance on all target devices.

## Performance Targets

### Frame Budget

- **60Hz devices**: ≤ 16.6ms per frame
- **120Hz devices**: ≤ 8.3ms per frame
- **Average dropped frames**: ≤ 1 per animation sequence
- **95th percentile duration**: Within spec (±10%)

### Memory

- **Animation memory**: < 5MB per screen
- **No memory leaks**: Stable memory usage over 5 minutes
- **GC pauses**: < 16ms

## Device Matrix

### Test Devices

- **iOS**: iPhone 13 (A15), iPhone 12 (A14), iPhone XR (A12)
- **Android**: Pixel 6 (Tensor), Pixel 5 (Snapdragon 765G), Samsung Galaxy A52 (Snapdragon 720G)

### Performance Tiers

- **High-end**: iPhone 13, Pixel 6 (target: 120fps)
- **Mid-range**: iPhone 12, Pixel 5 (target: 60fps)
- **Low-end**: iPhone XR, Galaxy A52 (target: 60fps with reduced effects)

## Validation Scripts

### 1. Frame Rate Monitor

```typescript
// scripts/performance/frame-rate-monitor.ts
import { PerformanceObserver, performance } from 'react-native-performance'

export function setupFrameRateMonitor() {
  const observer = new PerformanceObserver(list => {
    const entries = list.getEntries()
    entries.forEach(entry => {
      if (entry.duration > 16.67) {
        console.warn(`Slow frame: ${entry.name} took ${entry.duration}ms`)
      }
    })
  })

  observer.observe({ entryTypes: ['measure', 'frame'] })
}
```

### 2. Animation Performance Test

```typescript
// scripts/performance/test-animation-performance.ts
export async function testAnimationPerformance(
  hook: () => void,
  duration: number
): Promise<{
  averageFrameTime: number
  droppedFrames: number
  maxFrameTime: number
}> {
  const frameTimes: number[] = []
  let droppedFrames = 0

  const startTime = performance.now()

  // Monitor frame times during animation
  const frameMonitor = setInterval(() => {
    const frameTime = performance.now() - startTime
    frameTimes.push(frameTime)

    if (frameTime > 16.67) {
      droppedFrames++
    }
  }, 16)

  hook()

  await new Promise(resolve => setTimeout(resolve, duration))

  clearInterval(frameMonitor)

  const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
  const maxFrameTime = Math.max(...frameTimes)

  return {
    averageFrameTime,
    droppedFrames,
    maxFrameTime,
  }
}
```

### 3. Memory Leak Detection

```typescript
// scripts/performance/memory-leak-detector.ts
export function detectMemoryLeaks(
  component: React.ComponentType,
  iterations: number = 100
): Promise<boolean> {
  const memorySnapshots: number[] = []

  return new Promise((resolve) => {
    for (let i = 0; i < iterations; i++) {
      // Mount and unmount component
      const instance = render(<component />)
      memorySnapshots.push(getMemoryUsage())
      instance.unmount()
    }

    // Check for memory growth
    const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0]
    resolve(memoryGrowth > 10 * 1024 * 1024) // 10MB threshold
  })
}
```

## Manual Testing Checklist

### Navigation Animations

- [ ] Nav bar entrance: Smooth, no jank
- [ ] Header animations: 60fps, no frame drops
- [ ] Button interactions: Responsive, haptic feedback works
- [ ] Page transitions: Smooth, no flicker

### Visual Effects

- [ ] Shimmer effects: Smooth, no performance impact
- [ ] Glow effects: GPU-accelerated, no CPU spikes
- [ ] Gradient animations: Smooth, memory efficient
- [ ] Floating particles: Limited count, no lag

### Bubble & Chat Effects

- [ ] Send warp: Smooth, within 220ms
- [ ] Receive air-cushion: Smooth, within 220ms
- [ ] Typing indicator: < 0.8ms per frame
- [ ] Reaction burst: Smooth, particle limit respected
- [ ] Swipe reply: Elastic, responsive

### Interaction Effects

- [ ] Parallax tilt: Smooth, touch-responsive
- [ ] Magnetic effect: Smooth, no lag
- [ ] Elastic scale: Bouncy, responsive
- [ ] Breathing animation: Smooth, CPU efficient

## Automated Performance Tests

### Run Performance Tests

```bash
# Run all performance tests
pnpm test:performance

# Test specific animation hook
pnpm test:performance --hook useNavBarAnimation

# Test on device
pnpm test:performance --device ios
pnpm test:performance --device android
```

### Performance Test Results

Tests should output:

- Average frame time
- Dropped frames count
- Memory usage
- CPU usage
- Animation duration
- Device info

## Performance Optimization Tips

### 1. Use Worklets

- All animations should use Reanimated worklets
- Avoid JS thread animations
- Use `runOnUI` for heavy computations

### 2. Limit Animations

- Maximum 200 particles per scene
- Maximum 120 particles on low-end devices
- Limit simultaneous animations to 10

### 3. Optimize Shadows

- Use elevation instead of shadowRadius on Android
- Limit shadow radius to 16px
- Cache shadow surfaces

### 4. Reduce Motion

- Respect `prefers-reduced-motion`
- Provide instant fallbacks
- Duration ≤ 120ms for reduced motion

## Performance Monitoring

### Production Monitoring

```typescript
// src/utils/performance-monitor.ts
export function trackAnimationPerformance(
  animationName: string,
  startTime: number,
  endTime: number
): void {
  const duration = endTime - startTime
  const deviceInfo = getDeviceInfo()

  analytics.track('animation_performance', {
    animation: animationName,
    duration,
    device: deviceInfo.model,
    os: deviceInfo.os,
    fps: deviceInfo.screenRefreshRate,
    reducedMotion: deviceInfo.reducedMotion,
  })
}
```

### Performance Alerts

Set up alerts for:

- Average frame time > 16.67ms
- Dropped frames > 2 per animation
- Memory usage > 10MB per screen
- Animation duration > spec + 10%

## Benchmarking

### Baseline Performance

Run baseline tests on each device:

- Empty screen render time
- Navigation transition time
- Button press response time
- List scroll performance

### Animation Performance

Compare animation performance against baseline:

- Animation should add < 2ms to render time
- No frame drops during animations
- Memory usage stable
- CPU usage < 30% during animations

## Reporting

### Performance Report Format

```
Animation: useNavBarAnimation
Device: iPhone 13 (A15)
OS: iOS 17.0
Frame Rate: 120Hz

Results:
- Average frame time: 6.2ms ✅
- Dropped frames: 0 ✅
- Memory usage: 2.3MB ✅
- CPU usage: 15% ✅
- Animation duration: 280ms ✅

Status: PASS
```

## Continuous Integration

### CI Performance Tests

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test:performance
      - run: pnpm test:memory
      - run: pnpm test:leaks
```

## Tools

### Recommended Tools

- **React Native Performance Monitor**: Built-in performance monitoring
- **Flipper**: Performance profiling
- **Chrome DevTools**: Memory profiling
- **Xcode Instruments**: iOS performance profiling
- **Android Profiler**: Android performance profiling

## Troubleshooting

### Common Issues

1. **Frame Drops**
   - Reduce animation complexity
   - Limit simultaneous animations
   - Use worklets for all animations
   - Optimize shadow effects

2. **Memory Leaks**
   - Clean up animations on unmount
   - Cancel running animations
   - Clear timers and intervals
   - Dispose of event listeners

3. **High CPU Usage**
   - Move animations to UI thread
   - Reduce animation count
   - Optimize interpolation
   - Use hardware acceleration

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Reanimated Performance](https://docs.swmansion.com/react-native-reanimated/docs/performance)
- [Android Performance](https://developer.android.com/topic/performance)
- [iOS Performance](https://developer.apple.com/documentation/xcode/analyzing-performance)

---

**Last Updated**: 2024
**Version**: 1.0.0
