# Chat Effects Integration Guide

**Universal Pattern for Mobile & Web Effects**

This guide demonstrates the drop-in integration pattern for ultra-streamlined chat effects across mobile and web platforms.

---

## 🎯 Mobile Integration: SwipeToReply, ShimmerOverlay, DeliveryTicks

### Import Pattern

```tsx
import { SwipeToReply, DeliveryTicks, ShimmerOverlay } from '@/effects/chat'
```

### Example: MessageBubble Component

```tsx
import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { SwipeToReply, DeliveryTicks, ShimmerOverlay } from '@/effects/chat'

function MessageBubble({ message, currentUserId }) {
  const [width, setWidth] = useState(0)
  const isOwn = message.senderId === currentUserId
  
  return (
    <SwipeToReply onReply={() => handleReply(message.id)}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {/* ShimmerOverlay shows when message is loading/sending */}
        {message.status === 'sending' && <ShimmerOverlay width={width} />}
        
        <Text>{message.text}</Text>
        
        {/* DeliveryTicks show status for own messages */}
        {isOwn && <DeliveryTicks state={message.status} />}
      </View>
    </SwipeToReply>
  )
}
```

### Key Features

- **SwipeToReply**: Gesture wrapper component
  - Enables swipe-left-to-reply gesture
  - `onReply` callback triggered on threshold cross
  - Works with any child content

- **ShimmerOverlay**: Loading state overlay
  - Requires `width` prop for sizing
  - Automatically measures and animates
  - Shows gradient shimmer effect

- **DeliveryTicks**: Status indicator
  - `state` prop: `'sending' | 'sent' | 'delivered' | 'read'`
  - Animates on status changes
  - Shows appropriate checkmarks

### Real-World Integration

**File**: `apps/mobile/src/components/chat/MessageBubble.tsx`

```tsx
export function MessageBubble({
  message,
  currentUserId,
  onReact,
  onLongPress,
}: MessageBubbleProps): React.ReactElement {
  const isOwn = message.senderId === currentUserId
  const isLoading = message.status === 'sending'
  const [bubbleWidth, setBubbleWidth] = useState(0)

  const handleReply = (): void => {
    logger.debug('Reply triggered', { messageId: message.id })
  }

  return (
    <SwipeToReply onReply={handleReply}>
      <Animated.View
        style={[
          styles.container,
          isOwn ? styles.ownContainer : styles.otherContainer,
        ]}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onLongPress={() => onLongPress?.(message.id)}
          onLayout={(e) => setBubbleWidth(e.nativeEvent.layout.width)}
          style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
        >
          {isLoading && <ShimmerOverlay width={bubbleWidth} />}
          
          <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>

          {isOwn && <DeliveryTicks state={message.status} />}
        </TouchableOpacity>
      </Animated.View>
    </SwipeToReply>
  )
}
```

**File**: `apps/mobile/src/components/chat/AdvancedChatWindow.native.tsx`

```tsx
import { MessageBubble } from './MessageBubble'

export default function AdvancedChatWindow({ room, currentUserId }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  return (
    <ScrollView>
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={{
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            timestamp: new Date(msg.timestamp).getTime(),
            status: msg.status as 'sending' | 'sent' | 'delivered' | 'read',
          }}
          currentUserId={currentUserId}
          onReact={(msgId) => toast.info(`React to ${msgId}`)}
          onLongPress={(msgId) => toast.warning(`Long press ${msgId}`)}
        />
      ))}
    </ScrollView>
  )
}
```

---

## 🌐 Web Integration: AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash

### Import Pattern

```tsx
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'
```

### Example: App.tsx Integration

```tsx
import HoloBackground from '@/components/chrome/HoloBackground'
import GlowTrail from '@/effects/cursor/GlowTrail'
// Ultra overlays (web-only, zero deps)
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'

function App() {
  const [currentView, setCurrentView] = useState<View>('discover')

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Base background effects */}
      <HoloBackground intensity={0.6} />
      <GlowTrail />
      
      {/* Ultra overlays: moving aurora backdrop, page flash, and scroll progress */}
      <AmbientAuroraBackground intensity={0.35} className="hidden md:block" />
      <PageChangeFlash key={currentView} />
      <ScrollProgressBar />
      
      {/* Your app content */}
      <MainContent />
    </div>
  )
}
```

### Key Features

- **AmbientAuroraBackground**: Premium gradient backdrop
  - `intensity` prop controls opacity (0-1)
  - 4 rotating gradient layers
  - Respects `prefers-reduced-motion`
  - Use `className="hidden md:block"` for desktop-only

- **PageChangeFlash**: View transition effect
  - Key component with `currentView` to trigger flash
  - Radial gradient flash from center
  - 500ms duration, automatic cleanup

- **ScrollProgressBar**: Scroll tracking indicator
  - Auto-tracks scroll position
  - Shows progress at top of viewport
  - Theme-aware colors

### Real-World Integration

**File**: `apps/web/src/App.tsx` (Lines 244-252)

```tsx
{appState === 'main' && (
  <div className="min-h-screen pb-20 sm:pb-24 bg-background text-foreground relative overflow-hidden">
    {/* Ultra-premium ambient background with layered animated gradients */}
    <HoloBackground intensity={0.6} />
    <GlowTrail />
    
    {/* Ultra overlays: moving aurora backdrop, page flash, and scroll progress */}
    <AmbientAuroraBackground intensity={0.35} className="hidden md:block" />
    <PageChangeFlash key={currentView} />
    <ScrollProgressBar />
    
    {/* Rest of app content */}
  </div>
)}
```

---

## 📦 Export Configuration

### Mobile Barrel Export

**File**: `apps/mobile/src/effects/chat/index.ts`

```typescript
export * from './bubbles'
export * from './core'
export * from './gestures'
export * from './media'
export * from './reactions'
export * from './shaders'
export * from './status'
export * from './typing'
export * from './ui'  // Contains all-in-chat-effects
```

**File**: `apps/mobile/src/effects/chat/ui/index.ts`

```typescript
export * from './use-scroll-fab-magnetic'
export * from './all-in-chat-effects'  // SwipeToReply, DeliveryTicks, ShimmerOverlay, etc.
```

### Web Barrel Export

**File**: `apps/web/src/effects/index.ts`

```typescript
export * from './ultra-web-overlays'  // AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash
```

---

## ✅ Implementation Checklist

### Mobile Chat Components

- [x] `MessageBubble.tsx` - Refactored to use SwipeToReply, ShimmerOverlay, DeliveryTicks
- [x] `AdvancedChatWindow.native.tsx` - Uses MessageBubble component
- [x] Barrel exports configured in `effects/chat/index.ts`
- [x] All effects respect TypeScript strict mode
- [x] Demo component created in `ChatEffectsDemo.native.tsx`

### Web App Components

- [x] `App.tsx` - Integrated AmbientAuroraBackground, PageChangeFlash, ScrollProgressBar
- [x] Barrel exports configured in `effects/index.ts`
- [x] All overlays respect `prefers-reduced-motion`
- [x] Desktop-only aurora with `hidden md:block`
- [x] Page flash keyed to `currentView` state

---

## 🎨 Customization Examples

### Mobile: Custom Shimmer Colors

```tsx
// In all-in-chat-effects.tsx, modify shimmerColors:
const shimmerColors = [
  'rgba(255, 255, 255, 0)',    // transparent
  'rgba(139, 92, 246, 0.3)',   // violet-500 at 30%
  'rgba(255, 255, 255, 0)',    // transparent
]
```

### Web: Custom Aurora Intensity

```tsx
// Lower intensity for subtle effect
<AmbientAuroraBackground intensity={0.2} />

// Higher intensity for dramatic effect
<AmbientAuroraBackground intensity={0.5} />
```

### Mobile: Custom Delivery Tick Colors

```tsx
// In all-in-chat-effects.tsx, modify DeliveryTicks colors:
const getTickColor = (state: DeliveryState): string => {
  switch (state) {
    case 'sending': return '#9CA3AF'  // gray-400
    case 'sent': return '#9CA3AF'     // gray-400
    case 'delivered': return '#60A5FA' // blue-400
    case 'read': return '#34D399'     // emerald-400
  }
}
```

---

## 🚀 Performance Characteristics

### Mobile Effects

- **60fps animations** using Reanimated worklets
- **Transform/opacity only** - no layout recalculations
- **Gesture-optimized** with `react-native-gesture-handler`
- **Conditional rendering** - effects only active when needed

### Web Overlays

- **CSS animations** - GPU-accelerated
- **Zero JavaScript runtime** after mount
- **Intersection Observer** for scroll tracking
- **RequestAnimationFrame** for smooth updates
- **Automatic cleanup** on unmount

---

## 📱 Platform-Specific Notes

### Mobile (React Native)

- Requires `react-native-reanimated` ≥3.10.1
- Requires `react-native-gesture-handler` ≥2.16.2
- All animations run on UI thread
- Supports Android & iOS

### Web (React)

- Pure CSS animations where possible
- Uses `matchMedia` for reduced motion detection
- Responsive breakpoints with Tailwind classes
- Works in all modern browsers

---

## 🔧 Troubleshooting

### Mobile: "Cannot find module '@/effects/chat'"

**Solution**: Ensure `tsconfig.json` has path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Web: "All imports are unused"

**Solution**: Ensure components are actually rendered in JSX:

```tsx
// ❌ Bad - imported but not used
import { AmbientAuroraBackground } from '@/effects/ultra-web-overlays'

// ✅ Good - imported and rendered
import { AmbientAuroraBackground } from '@/effects/ultra-web-overlays'
<AmbientAuroraBackground intensity={0.35} />
```

### Mobile: Effects not animating

**Solution**: Check Reanimated plugin in `babel.config.js`:

```js
module.exports = {
  plugins: ['react-native-reanimated/plugin'], // Must be last
}
```

---

## 📚 Additional Resources

- **Mobile Effects Library**: `apps/mobile/src/effects/chat/ui/all-in-chat-effects.tsx`
- **Mobile Demo**: `apps/mobile/src/effects/chat/ui/ChatEffectsDemo.native.tsx`
- **Web Overlays Library**: `apps/web/src/effects/ultra-web-overlays.tsx`
- **Mobile README**: `apps/mobile/src/effects/chat/ui/ALL_IN_CHAT_EFFECTS_README.md`

---

## 🎉 Summary

**Mobile Pattern**:
```tsx
import { SwipeToReply, DeliveryTicks, ShimmerOverlay } from '@/effects/chat'

<SwipeToReply onReply={handleReply}>
  <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
    {isLoading && <ShimmerOverlay width={width} />}
    <Text>{content}</Text>
    {isOwn && <DeliveryTicks state={status} />}
  </View>
</SwipeToReply>
```

**Web Pattern**:
```tsx
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'

<div>
  <HoloBackground />
  <GlowTrail />
  <AmbientAuroraBackground intensity={0.35} className="hidden md:block" />
  <PageChangeFlash key={currentView} />
  <ScrollProgressBar />
</div>
```

Both patterns provide **zero-risk, drop-in integration** with comprehensive TypeScript types, accessibility support, and performance optimization.
