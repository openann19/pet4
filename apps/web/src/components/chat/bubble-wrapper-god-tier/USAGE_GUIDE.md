# BubbleWrapperGodTier - Where It Can Be Used

## ✅ Already Integrated

### 1. MessageBubble.tsx ✅

**Status:** Fully integrated with all effects

- Location: `src/components/chat/MessageBubble.tsx`
- Lines: 550-586
- Effects active: AI animations, mood themes, age effects, particles, haptics

---

## 🔄 Ready to Integrate (7 Components)

### 2. AdvancedChatWindow.tsx

**File:** `src/components/chat/AdvancedChatWindow.tsx`  
**Lines:** 392-416  
**Replace:** Basic `motion.div` bubbles  
**Impact:** HIGH - Main chat window

```tsx
import { BubbleWrapperGodTier, AnimatedAIWrapper } from './bubble-wrapper-god-tier';

// Replace motion.div at line 393 with:
<BubbleWrapperGodTier
  isAIMessage={message.senderId === 'ai'}
  messageText={message.content}
  timestamp={message.createdAt}
  enabled={true}
>
  <div className={`rounded-2xl p-3 ${isCurrentUser ? 'bg-primary' : 'bg-card'}`}>
    {message.content}
  </div>
</BubbleWrapperGodTier>;
```

---

### 3. ChatWindowNew.tsx

**File:** `src/components/ChatWindowNew.tsx`  
**Lines:** 464-477  
**Replace:** Static message bubbles  
**Impact:** HIGH - Alternative chat window

```tsx
import { BubbleWrapperGodTier, PresenceGlow } from './chat/bubble-wrapper-god-tier';

// Wrap message content + add PresenceGlow to avatars
```

---

### 4. LiveStreamRoom.tsx

**File:** `src/components/streaming/LiveStreamRoom.tsx`  
**Lines:** 305-320  
**Replace:** Basic chat message rendering  
**Impact:** MEDIUM - Live streaming chat

```tsx
import { BubbleWrapperGodTier, PresenceGlow } from '../chat/bubble-wrapper-god-tier';

// Add PresenceGlow to avatars + wrap messages
```

---

### 5. TypingIndicator.tsx

**File:** `src/components/chat/TypingIndicator.tsx`  
**Lines:** 31-56  
**Replace:** Custom typing dots  
**Impact:** MEDIUM - Better animations

```tsx
import { TypingDots } from './bubble-wrapper-god-tier';

<TypingDots dotSize={4} enabled={true} />;
```

---

### 6. TypingPlaceholder.tsx

**File:** `src/components/chat/TypingPlaceholder.tsx`  
**Lines:** 26-50  
**Replace:** Custom animated bars  
**Impact:** LOW - Consistency

---

### 7. ChatRoomsList.tsx

**File:** `src/components/ChatRoomsList.tsx`  
**Lines:** 162-180  
**Replace:** Typing indicator in room list  
**Impact:** MEDIUM - Room list UX

```tsx
import { PresenceGlow, TypingDots } from '../chat/bubble-wrapper-god-tier';
```

---

### 8. BubbleWrapper.tsx

**File:** `src/components/chat/BubbleWrapper.tsx`  
**Lines:** Entire component  
**Enhance:** Add god-tier effects or replace  
**Impact:** HIGH - Foundation component

---

## 🎯 Individual Effect Hooks (Use Anywhere)

### useHapticFeedback

**Use in:** Buttons, interactions, actions

```tsx
import { useHapticFeedback } from './bubble-wrapper-god-tier';

const haptics = useHapticFeedback({ enabled: true });
haptics.trigger('send'); // 'tap', 'delete', 'react', 'swipe', etc.
```

### useParticleBurstOnEvent

**Use in:** Send buttons, reactions, deletes

```tsx
import { useParticleBurstOnEvent } from './bubble-wrapper-god-tier';

const particles = useParticleBurstOnEvent({ enabled: true });
particles.triggerBurst('send', x, y); // 'delete', 'reaction', 'ai-reply'
```

### usePresenceGlow

**Use in:** Avatar components, user lists

```tsx
import { PresenceGlow } from './bubble-wrapper-god-tier';

<PresenceGlow isActive={user.isOnline}>
  <Avatar>
    <AvatarImage src={user.avatar} />
  </Avatar>
</PresenceGlow>;
```

### useBubbleMoodTheme

**Use in:** Text messages (automatic sentiment)

```tsx
import { useBubbleMoodTheme } from './bubble-wrapper-god-tier';

const mood = useBubbleMoodTheme({ text: message.content });
// Returns: backgroundColor, gradientFrom, gradientTo, animatedStyle
```

### useMessageAgeEffect

**Use in:** Message lists, chat history

```tsx
import { useMessageAgeEffect } from './bubble-wrapper-god-tier';

const ageEffect = useMessageAgeEffect({ timestamp: message.createdAt });
// Apply ageEffect.animatedStyle for progressive fading
```

### useAiReplyAnimation

**Use in:** AI responses, bot messages

```tsx
import { useAiReplyAnimation } from './bubble-wrapper-god-tier';

const aiEffects = useAiReplyAnimation({ enabled: true });
// Use: shimmerStyle, glowStyle, sparkleStyle
```

### useThreadLayoutAnimator

**Use in:** Thread replies, nested messages

```tsx
import { useThreadLayoutAnimator } from './bubble-wrapper-god-tier';

const threadAnim = useThreadLayoutAnimator({ isExpanded: showThread });
// Use: containerStyle, messageStyle(index)
```

### useBubbleCompressionOnSpeed

**Use in:** Rapid message sending scenarios

```tsx
import { useBubbleCompressionOnSpeed } from './bubble-wrapper-god-tier';

const compression = useBubbleCompressionOnSpeed({ messageRate: rate });
// Apply compression.animatedStyle when spam detected
```

### useReactionTrail

**Use in:** Reaction buttons, emoji pickers

```tsx
import { useReactionTrail } from './bubble-wrapper-god-tier';

const trail = useReactionTrail({ enabled: true });
trail.triggerTrail(fromX, fromY, toX, toY, '❤️');
```

### TypingDots Component

**Use in:** Typing indicators, loading states

```tsx
import { TypingDots } from './bubble-wrapper-god-tier';

<TypingDots dotSize={6} dotColor="#3B82F6" enabled={isTyping} />;
```

---

## 📦 Import Path

```tsx
// Full component
import {
  BubbleWrapperGodTier,
  AnimatedAIWrapper,
  PresenceGlow,
  TypingDots,
} from '@/components/chat/bubble-wrapper-god-tier';

// Individual hooks
import {
  useHapticFeedback,
  useParticleBurstOnEvent,
  useBubbleMoodTheme,
  useMessageAgeEffect,
  useAiReplyAnimation,
  useThreadLayoutAnimator,
  useBubbleCompressionOnSpeed,
  useReactionTrail,
  useTypingIndicator,
} from '@/components/chat/bubble-wrapper-god-tier';
```

---

## 🎬 Quick Examples

### Basic Message

```tsx
<BubbleWrapperGodTier messageText={message.content} timestamp={message.createdAt}>
  <div className="rounded-2xl p-3 bg-card">{message.content}</div>
</BubbleWrapperGodTier>
```

### AI Message

```tsx
<BubbleWrapperGodTier isAIMessage={true} messageText={text}>
  <AnimatedAIWrapper>{text}</AnimatedAIWrapper>
</BubbleWrapperGodTier>
```

### With Presence

```tsx
<PresenceGlow isActive={user.isOnline}>
  <Avatar>
    <AvatarImage src={user.avatar} />
  </Avatar>
</PresenceGlow>
```

### Typing State

```tsx
<BubbleWrapperGodTier showTyping={true}>
  <TypingDots enabled={true} />
</BubbleWrapperGodTier>
```

---

## 📊 Priority Order

1. ✅ MessageBubble.tsx - DONE
2. AdvancedChatWindow.tsx - HIGH
3. ChatWindowNew.tsx - HIGH
4. BubbleWrapper.tsx - HIGH
5. LiveStreamRoom.tsx - MEDIUM
6. TypingIndicator.tsx - MEDIUM
7. ChatRoomsList.tsx - MEDIUM
8. TypingPlaceholder.tsx - LOW
