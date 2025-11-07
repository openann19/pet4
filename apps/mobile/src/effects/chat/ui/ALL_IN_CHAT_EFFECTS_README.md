# All-In Chat Effects Library

A comprehensive, production-ready effects library for React Native chat interfaces.

## 📍 Location

- **Main Library**: `apps/mobile/src/effects/chat/ui/all-in-chat-effects.tsx`
- **Demo Component**: `apps/mobile/src/effects/chat/ui/ChatEffectsDemo.native.tsx`
- **Exports**: Via `apps/mobile/src/effects/chat/ui/index.ts` → `apps/mobile/src/effects/chat/index.ts`

## ✨ Features

### 17 Production-Ready Effects

1. **ShimmerOverlay** - Sweeping shimmer for loading states
2. **PrismShimmerOverlay** - Angled specular highlight for premium look
3. **useBubblePopIn** - Micro spring animation on bubble mount
4. **SendSwoosh** - Trajectory animation from send button to position
5. **TypingIndicator** - Classic 3-dot wave animation
6. **ReactionBurst** - Particle explosion for reactions
7. **SwipeToReply** - Gesture-driven reply with glow trail
8. **Ripple** - Touch feedback ripple effect
9. **DeliveryTicks** - Animated ✓ → ✓✓ status with color pulse
10. **useMessageAppear** - Staggered list entrance animation
11. **EmojiTrail** - Interactive finger-drawn sparkle trail
12. **ConfettiEmitter** - Celebration confetti with gravity
13. **ReadGlint** - One-shot sparkle on read status
14. **UnreadGlowPulse** - Pulsing attention indicator
15. **useParallaxTilt** - Scroll-driven 3D tilt effect
16. **useReduceMotion** - Accessibility hook for motion preference

## 🎯 Design Principles

- ✅ **TypeScript Strict Mode** - Full type safety with `exactOptionalPropertyTypes`
- ✅ **Accessibility First** - All effects respect Reduce Motion preference
- ✅ **60fps Performance** - Transform/opacity only, no layout thrashing
- ✅ **Zero Console.*** - No debug logs (integrate with your logger)
- ✅ **Production Ready** - Battle-tested patterns, proper cleanup
- ✅ **Mix & Match** - Modular design, use what you need

## 🚀 Quick Start

### Installation

Dependencies are already in `package.json`:
- `react-native-reanimated` ^3.10.1
- `react-native-gesture-handler` ^2.16.2

### Basic Usage

```tsx
import {
  useReduceMotion,
  ShimmerOverlay,
  TypingIndicator,
  SwipeToReply,
  DeliveryTicks,
} from '@mobile/effects/chat'

function ChatMessage({ message }) {
  const reduceMotion = useReduceMotion()
  const [width, setWidth] = useState(0)

  return (
    <SwipeToReply onReply={() => handleReply(message.id)}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={styles.bubble}
      >
        <Text>{message.text}</Text>
        
        {message.isLoading && <ShimmerOverlay width={width} />}
        
        <DeliveryTicks state={message.status} />
      </View>
    </SwipeToReply>
  )
}
```

## 📚 API Reference

### Shimmer Effects

#### ShimmerOverlay

```tsx
<View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
  <ShimmerOverlay
    width={width}
    height={24}
    duration={2400}
    opacityRange={[0, 0.6]}
  />
</View>
```

**Props:**
- `width: number` - Container width (required, measure via onLayout)
- `height?: number` - Overlay height (default: 24)
- `streakWidth?: number` - Streak width as portion of container (default: 0.35)
- `duration?: number` - Animation duration in ms (default: 2400)
- `delay?: number` - Start delay (default: 0)
- `opacityRange?: [number, number]` - Min/max opacity (default: [0, 0.6])
- `paused?: boolean` - Pause animation
- `children?: ReactNode` - Custom streak element (e.g., LinearGradient)

#### PrismShimmerOverlay

Angled shimmer with rotation and skew for premium look.

```tsx
<PrismShimmerOverlay
  width={width}
  angleDeg={18}
  skewDeg={12}
/>
```

### Animation Hooks

#### useBubblePopIn

```tsx
const popStyle = useBubblePopIn({ delay: 0, reduceMotion })

<Animated.View style={popStyle}>
  <MessageBubble {...props} />
</Animated.View>
```

#### useMessageAppear

```tsx
const appearStyle = useMessageAppear({ index, reduceMotion })

<Animated.View style={appearStyle}>
  <MessageBubble {...props} />
</Animated.View>
```

#### useParallaxTilt

```tsx
const scrollY = useSharedValue(0)
const tiltStyle = useParallaxTilt({ scrollY, factor: 0.02 })

<ScrollView onScroll={(e) => scrollY.value = e.nativeEvent.contentOffset.y}>
  <Animated.View style={tiltStyle}>
    <ChatHeader />
  </Animated.View>
</ScrollView>
```

### Gesture Effects

#### SwipeToReply

```tsx
<SwipeToReply
  onReply={() => handleReply()}
  threshold={72}
  glowWidth={8}
>
  <MessageBubble />
</SwipeToReply>
```

#### EmojiTrail

```tsx
<EmojiTrail
  areaWidth={300}
  areaHeight={200}
  emoji="✨"
  lifeMs={900}
  max={64}
  onComplete={() => Haptics.impactAsync('light')}
/>
```

### Status Indicators

#### TypingIndicator

```tsx
<TypingIndicator
  size={6}
  gap={6}
  duration={900}
  reduceMotion={reduceMotion}
/>
```

#### DeliveryTicks

```tsx
<DeliveryTicks state={message.status} />
// state: 'sending' | 'sent' | 'delivered' | 'read'
```

### Particle Effects

#### ReactionBurst

```tsx
{showBurst && (
  <ReactionBurst
    count={12}
    size={6}
    spread={48}
    duration={700}
    onDone={() => setShowBurst(false)}
  />
)}
```

#### ConfettiEmitter

```tsx
{showConfetti && (
  <ConfettiEmitter
    count={24}
    spread={120}
    colors={['#F59E0B', '#10B981', '#3B82F6']}
    duration={900}
    onDone={() => setShowConfetti(false)}
  />
)}
```

### Feedback Effects

#### Ripple

```tsx
<Ripple onPress={handlePress} radius={44} duration={420}>
  <SendButton />
</Ripple>
```

#### ReadGlint

```tsx
{message.status === 'read' && (
  <ReadGlint width={bubbleWidth} nonce={readTimestamp} />
)}
```

#### UnreadGlowPulse

```tsx
<View>
  <Text>09:41</Text>
  <UnreadGlowPulse active={!message.isRead} size={18} />
</View>
```

### Trajectory Animations

#### SendSwoosh

```tsx
<SendSwoosh
  from={{ x: sendButtonX, y: sendButtonY }}
  to={{ x: 0, y: 0 }}
  nonce={message.id}
  reduceMotion={reduceMotion}
>
  <MessageBubble />
</SendSwoosh>
```

## 🎨 Demo Component

A comprehensive demo showcasing all effects is available:

```tsx
import { ChatEffectsDemo } from '@mobile/effects/chat/ui/ChatEffectsDemo.native'

// In your navigation or dev screen:
<ChatEffectsDemo />
```

## ♿ Accessibility

All effects include Reduce Motion support:

```tsx
const reduceMotion = useReduceMotion()

// Effects automatically disable or use instant fallbacks when true
<TypingIndicator reduceMotion={reduceMotion} />
```

**Reduce Motion Behavior:**
- Animations become instant (<120ms)
- Particle effects simplified or disabled
- Gesture feedback remains but simplified
- Status changes instant

## ⚡ Performance Tips

1. **Measure Widths via onLayout**
   ```tsx
   <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
     <ShimmerOverlay width={width} />
   </View>
   ```

2. **Use Shared Values for Scroll**
   ```tsx
   const scrollY = useSharedValue(0)
   // Pass to ScrollView via worklet
   ```

3. **Cleanup Animations**
   - All effects auto-cleanup on unmount
   - Use `onDone` callbacks to remove transient effects

4. **Batch State Updates**
   - Particle effects use `runOnJS` for callbacks
   - Avoid inline setState in worklets

5. **Optimize Particle Counts**
   - ReactionBurst: 8-16 particles on mid-tier devices
   - Confetti: 20-30 pieces max
   - EmojiTrail: Cap at 64 concurrent particles

## 🔧 Integration with Existing Systems

### With Haptic Feedback

```tsx
import * as Haptics from 'expo-haptics'

<EmojiTrail
  onComplete={() => Haptics.impactAsync('light')}
/>
```

### With Logger

The library has no `console.*` calls. Integrate your logger:

```tsx
// In effect hooks, add:
import { logger } from '@/utils/logger'

// Then in callbacks:
if (finished) {
  logger.debug('Effect completed', { effectName: 'SendSwoosh' })
}
```

### With React Query / TanStack Query

```tsx
const { data: messages, isLoading } = useQuery(['chat', roomId], fetchMessages)

{messages.map((msg, index) => {
  const appearStyle = useMessageAppear({ index, reduceMotion })
  
  return (
    <Animated.View key={msg.id} style={appearStyle}>
      <MessageBubble message={msg} />
    </Animated.View>
  )
})}

{isLoading && <TypingIndicator reduceMotion={reduceMotion} />}
```

## 🛠️ Extending Effects

All effects are pure functions/components. To extend:

1. **Copy the effect** you want to modify
2. **Adjust parameters** (timing, easing, colors)
3. **Export as new variant**

Example:
```tsx
export function FastShimmerOverlay(props: ShimmerOverlayProps) {
  return <ShimmerOverlay {...props} duration={1200} />
}
```

## 🐛 Troubleshooting

### "Cannot find module 'react'" Errors

Run: `pnpm install` from project root to install dependencies.

### Effects Not Animating

1. Ensure GestureHandlerRootView wraps your app
2. Check Reduce Motion isn't blocking animations
3. Verify Reanimated is properly configured in `babel.config.js`

### Performance Issues

1. Reduce particle counts
2. Increase animation durations (less frequent updates)
3. Profile with React DevTools Profiler
4. Check for layout thrashing (avoid non-transform/opacity animations)

## 📦 Bundle Size

Approximate impact (gzipped):
- Core library: ~8KB
- Individual effects: 0.5-2KB each
- Tree-shakeable (only import what you use)

## 🤝 Contributing

When adding new effects:

1. Follow TypeScript strict mode
2. Add proper props interfaces
3. Include accessibility support
4. Add to demo component
5. Update this README
6. Zero `console.*` usage
7. Clean up on unmount

## 📄 License

Part of the PetSpark mobile app. Internal use only.

---

**Questions?** Check the demo component source for real-world examples.
