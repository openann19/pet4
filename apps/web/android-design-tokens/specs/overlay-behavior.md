# Overlay & Sheet Behavior Checklist

## Overlay Dismissal Rules

### Tap Outside
- **Behavior**: Dismiss overlay
- **Implementation**: `onDismissRequest` callback
- **Exceptions**: None (all overlays dismiss on tap outside)

### Swipe Down
- **Behavior**: Dismiss bottom sheet
- **Implementation**: `ModalBottomSheet` swipe gesture
- **Exceptions**: Dialog modals (use Back button only)

### Back Button
- **Behavior**: Pop top overlay first
- **Implementation**: `BackHandler` with priority
- **Stack Management**: Use `BackStackEntry` for overlay stack

### Implementation
```kotlin
@Composable
fun OverlayStack(
    overlays: List<Overlay>,
    onDismiss: (Overlay) -> Unit
) {
    val backHandler = remember { mutableStateOf<(() -> Unit)?>(null) }
    
    BackHandler(enabled = overlays.isNotEmpty()) {
        // Pop top overlay
        overlays.lastOrNull()?.let { onDismiss(it) }
    }
    
    overlays.forEach { overlay ->
        when (overlay) {
            is Overlay.Sheet -> {
                ModalBottomSheet(
                    onDismissRequest = { onDismiss(overlay) },
                    // ... content
                )
            }
            is Overlay.Dialog -> {
                AlertDialog(
                    onDismissRequest = { onDismiss(overlay) },
                    // ... content
                )
            }
        }
    }
}
```

## Focus Management

### Focus Trap
- **Behavior**: Trap focus inside overlay
- **Implementation**: `semantics { isTraversalGroup = true }`
- **Scope**: All modals and sheets

### Focus Return
- **Behavior**: Return focus to trigger on close
- **Implementation**: `FocusRequester` on trigger
- **Timing**: After close animation completes

### Implementation
```kotlin
@Composable
fun SheetWithFocusReturn(
    visible: Boolean,
    onDismiss: () -> Unit,
    triggerFocusRequester: FocusRequester
) {
    ModalBottomSheet(
        onDismissRequest = {
            onDismiss()
            // Return focus after animation
            LaunchedEffect(Unit) {
                delay(240) // Animation duration
                triggerFocusRequester.requestFocus()
            }
        },
        modifier = Modifier.semantics {
            isTraversalGroup = true
        }
    ) {
        // Content
    }
}
```

## Scroll Lock

### Background Scroll
- **Behavior**: Disable background scroll when overlay open
- **Implementation**: `interceptTouchEvents` or `enabled = false`
- **Scope**: All overlays

### Implementation
```kotlin
@Composable
fun OverlayWithScrollLock(
    visible: Boolean,
    content: @Composable () -> Unit
) {
    if (visible) {
        // Disable background scroll
        Box(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    // Intercept touch events
                }
        )
    }
    content()
}
```

## Safe Area Insets

### Cutouts
- **Behavior**: Respect notch/cutout areas
- **Implementation**: `WindowInsets` for padding
- **Applied**: All overlays

### IME (Keyboard)
- **Behavior**: Adjust layout when keyboard appears
- **Implementation**: `WindowInsets.ime` for padding
- **Applied**: TextField-containing overlays

### Implementation
```kotlin
@Composable
fun SheetWithSafeArea(
    content: @Composable ColumnScope.() -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = { },
        windowInsets = WindowInsets(
            top = WindowInsets.statusBars,
            bottom = WindowInsets.ime
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(WindowInsets.safeDrawing.asPaddingValues())
        ) {
            content()
        }
    }
}
```

## Behavior Matrix

### Sheet Behaviors
| Action | Bottom Sheet | Dialog | Modal |
|--------|--------------|--------|-------|
| Tap outside | ✅ Dismiss | ✅ Dismiss | ✅ Dismiss |
| Swipe down | ✅ Dismiss | ❌ No | ❌ No |
| Back button | ✅ Dismiss | ✅ Dismiss | ✅ Dismiss |
| Focus trap | ✅ Yes | ✅ Yes | ✅ Yes |
| Focus return | ✅ Yes | ✅ Yes | ✅ Yes |
| Scroll lock | ✅ Yes | ✅ Yes | ✅ Yes |
| Safe area | ✅ Yes | ✅ Yes | ✅ Yes |

### Implementation Checklist
- [ ] Tap outside dismisses overlay
- [ ] Swipe down dismisses bottom sheet
- [ ] Back button pops top overlay
- [ ] Focus trapped inside overlay
- [ ] Focus returns to trigger on close
- [ ] Background scroll locked
- [ ] Safe area insets respected
- [ ] IME adjustment correct

## Maps & Location UI Behavior

### Card ↔ Map Toggle
- **Behavior**: Share filters & density
- **State**: Preserve filter state when toggling
- **Implementation**: Shared state management

### Chip Wrapping
- **Behavior**: Wrap chips without overflow
- **Implementation**: `FlowRow` for chip layout
- **Spacing**: Use token spacing (8dp gap)

### Search Debouncing
- **Behavior**: Debounce search input (300ms)
- **Implementation**: `LaunchedEffect` with delay
- **Performance**: Avoid excessive API calls

### Location Privacy
- **Behavior**: Never reveal precise home coords
- **Implementation**: Round coordinates (100m precision)
- **Copy**: Explain rounding in UI

### Sheet Behavior
- **Behavior**: Matches global overlay rules
- **Dismissal**: Tap outside, swipe down, Back button
- **Focus**: Trap focus, return on close

### Implementation
```kotlin
@Composable
fun MapsScreen(
    filters: Filters,
    onFiltersChange: (Filters) -> Unit
) {
    var viewMode by remember { mutableStateOf(ViewMode.Cards) }
    
    Column {
        // Toggle button
        Row {
            Button(
                onClick = { viewMode = ViewMode.Cards },
                enabled = viewMode == ViewMode.Map
            ) {
                Text("Cards")
            }
            Button(
                onClick = { viewMode = ViewMode.Map },
                enabled = viewMode == ViewMode.Cards
            ) {
                Text("Map")
            }
        }
        
        // Content
        when (viewMode) {
            ViewMode.Cards -> CardsView(filters, onFiltersChange)
            ViewMode.Map -> MapView(filters, onFiltersChange)
        }
    }
}

@Composable
fun MapView(
    filters: Filters,
    onFiltersChange: (Filters) -> Unit
) {
    // Rounded location (100m precision)
    val roundedLocation = remember(filters.location) {
        filters.location.copy(
            latitude = round(filters.location.latitude, 3),
            longitude = round(filters.location.longitude, 3)
        )
    }
    
    GoogleMap(
        cameraPositionState = rememberCameraPositionState {
            position = CameraPosition.fromLatLngZoom(
                LatLng(roundedLocation.latitude, roundedLocation.longitude),
                15f
            )
        }
    ) {
        // Map markers
    }
    
    // Chip filters
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(Dimens.Component.Icon.SpacingSM)
    ) {
        filters.chips.forEach { chip ->
            FilterChip(
                selected = chip.selected,
                onClick = { /* Update filter */ }
            ) {
                Text(chip.label)
            }
        }
    }
}
```

## Behavior Verification Checklist

### ✅ Overlay Behaviors
- [ ] Tap outside dismisses
- [ ] Swipe down dismisses (bottom sheet)
- [ ] Back button pops top overlay
- [ ] Focus trapped inside
- [ ] Focus returns to trigger
- [ ] Background scroll locked
- [ ] Safe area insets respected

### ✅ Maps Behaviors
- [ ] Card/Map toggle preserves filters
- [ ] Chips wrap without overflow
- [ ] Search debounced (300ms)
- [ ] Location rounded (100m precision)
- [ ] Sheet behavior matches global rules

### ✅ Testing
- [ ] Test overlay dismissal (all methods)
- [ ] Test focus management
- [ ] Test scroll lock
- [ ] Test safe area insets
- [ ] Test maps toggle
- [ ] Test chip wrapping
- [ ] Test search debouncing
- [ ] Test location privacy

