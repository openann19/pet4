# Quick Reference: Universal Effects Integration

## 📱 Mobile Pattern

```tsx
import { SwipeToReply, DeliveryTicks, ShimmerOverlay } from '@/effects/chat'

function MessageBubble({ message }) {
  const [width, setWidth] = useState(0)
  
  return (
    <SwipeToReply onReply={() => handleReply(message.id)}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {message.isLoading && <ShimmerOverlay width={width} />}
        <Text>{message.text}</Text>
        <DeliveryTicks state={message.status} />
      </View>
    </SwipeToReply>
  )
}
```

## 🌐 Web Pattern

```tsx
import { AmbientAuroraBackground, ScrollProgressBar, PageChangeFlash } from '@/effects/ultra-web-overlays'

// Inside your appState === 'main' container
<div className="relative overflow-hidden">
  <HoloBackground intensity={0.6} />
  <GlowTrail />
  {/* Ultra overlays */}
  <AmbientAuroraBackground intensity={0.35} className="hidden md:block" />
  <PageChangeFlash key={currentView} />
  <ScrollProgressBar />
</div>
```

## 🔑 Key Points

### Mobile
- **SwipeToReply**: Wrapper component, `onReply` callback
- **ShimmerOverlay**: Requires `width` prop, shows when loading
- **DeliveryTicks**: `state` prop: `'sending' | 'sent' | 'delivered' | 'read'`

### Web
- **AmbientAuroraBackground**: `intensity` 0-1, use `hidden md:block` for desktop-only
- **PageChangeFlash**: Key with view state to trigger flash
- **ScrollProgressBar**: Zero props, auto-tracks scroll

## 📦 Exports

- Mobile: `import { ... } from '@/effects/chat'`
- Web: `import { ... } from '@/effects/ultra-web-overlays'`

## ✅ Checklist

- [ ] Import effects from correct barrel export
- [ ] Measure width for ShimmerOverlay (`onLayout`)
- [ ] Key PageChangeFlash to trigger on changes
- [ ] Order overlays correctly (HoloBackground → Aurora → GlowTrail → Flash → ScrollBar)
- [ ] Use `className="hidden md:block"` for desktop-only effects

## 📚 Full Documentation

See `CHAT_EFFECTS_INTEGRATION_GUIDE.md` for comprehensive examples, troubleshooting, and customization.
