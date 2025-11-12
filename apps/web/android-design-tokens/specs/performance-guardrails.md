# Performance Guardrails & Budgets

## Animation Performance

### Rules

- **Animate Only**: `transform`, `opacity`
- **Avoid Animating**: `width`, `height`, `layout`
- **Max Concurrent**: 8 animations
- **Gesture Priority**: Cancel animations on gesture start

### Budgets

- **Target FPS**: 60fps
- **Frame Budget**: 16ms per frame
- **Animation Overhead**: < 5% CPU

### Implementation

```kotlin
// ✅ CORRECT - Animate transform/opacity
val scale = remember { Animatable(1f) }
val alpha = remember { Animatable(0f) }

LaunchedEffect(Unit) {
    scale.animateTo(1f, animationSpec = tween(240))
    alpha.animateTo(1f, animationSpec = tween(240))
}

// ❌ WRONG - Don't animate width/height
val width = remember { Animatable(100.dp) } // Avoid
```

## List Performance

### Virtualization

- **Use**: `LazyColumn`, `LazyRow`, `LazyVerticalGrid`
- **Avoid**: `Column` with `items()` for long lists
- **Key Strategy**: Stable keys, avoid index-based keys

### Implementation

```kotlin
// ✅ CORRECT - Virtualized list
LazyColumn {
    items(
        items = pets,
        key = { it.id } // Stable key
    ) { pet ->
        PetCard(pet = pet)
    }
}

// ❌ WRONG - Non-virtualized
Column {
    pets.forEach { pet ->
        PetCard(pet = pet) // Renders all items
    }
}
```

## Image Performance

### Preloading

- **Strategy**: Preload next card image
- **Cache**: Use Coil/Glide cache
- **Memory**: Cap image memory (max 100MB)

### Skeleton Loading

- **Reserved Height**: Match final card height
- **No CLS**: Prevent content layout shift
- **Aspect Ratio**: Maintain 16:9 for cards

### Implementation

```kotlin
// ✅ CORRECT - Preload next image
val nextImage = remember { mutableStateOf<ImageBitmap?>(null) }

LaunchedEffect(cardIndex) {
    // Preload next card
    nextImage.value = loadImage(pets[cardIndex + 1].imageUrl)
}

// ✅ CORRECT - Reserved height skeleton
Card(
    modifier = Modifier
        .fillMaxWidth()
        .height(400.dp) // Match final height
) {
    if (loading) {
        SkeletonCard()
    } else {
        PetCard(pet = pet)
    }
}
```

## Memory Management

### Image Memory

- **Cap**: 100MB total
- **Per Image**: 5MB max
- **Recycle**: Dispose images on card dismiss

### List Recycling

- **Strategy**: Recycle views, reuse bitmaps
- **Dispose**: Clear references on scroll out

### Implementation

```kotlin
// ✅ CORRECT - Dispose on dismiss
DisposableEffect(pet.id) {
    onDispose {
        // Clear image cache
        imageLoader.clear(pet.imageUrl)
    }
}
```

## Shadow Performance

### Budgets

- **Max Blur Radius**: 32dp
- **Max Elevation**: 24dp
- **Shadow Count**: Max 10 per screen

### Implementation

```kotlin
// ✅ CORRECT - Modest shadow
Card(
    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
) {
    // Content
}

// ❌ WRONG - Heavy shadow
Card(
    elevation = CardDefaults.cardElevation(defaultElevation = 48.dp) // Too high
) {
    // Content
}
```

## Performance Hotspots Removed

### Before

- ❌ Animating width/height during gestures
- ❌ Non-virtualized long lists
- ❌ Images without preloading
- ❌ Heavy shadows (48dp+)
- ❌ No image memory cap

### After

- ✅ Transform/opacity only
- ✅ Virtualized lists
- ✅ Image preloading
- ✅ Modest shadows (max 32dp)
- ✅ Image memory cap (100MB)

## Performance Budgets

### Target Metrics

- **TTI (Time to Interactive)**: < 2s
- **FCP (First Contentful Paint)**: < 1s
- **Average Frame Time**: < 16ms (60fps)
- **Memory Usage**: < 200MB
- **Animation Overhead**: < 5% CPU

### Measurement

- Use Android Profiler
- Monitor frame times
- Track memory usage
- Measure animation performance

## Implementation Checklist

### ✅ Performance

- [ ] Animate transform/opacity only
- [ ] Virtualize long lists
- [ ] Preload next card image
- [ ] Reserved height skeletons
- [ ] Cap image memory
- [ ] Modest shadow blur
- [ ] Dispose images on dismiss
- [ ] Recycle list items

### ✅ Testing

- [ ] Test frame rate (60fps)
- [ ] Test memory usage (< 200MB)
- [ ] Test animation performance
- [ ] Test list scrolling
- [ ] Test image loading
- [ ] Test on low-end devices
