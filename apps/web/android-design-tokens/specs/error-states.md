# Error/Empty/Loading/Offline States

## State Inventory

### Discover Screen
| State | Copy Key (EN) | Copy Key (BG) | Icon | Action |
|-------|---------------|---------------|------|--------|
| Empty | `discover.empty.title` | `discover.empty.title.bg` | Search | Refresh |
| Empty | `discover.empty.message` | `discover.empty.message.bg` | - | - |
| Error | `discover.error.title` | `discover.error.title.bg` | Error | Retry |
| Error | `discover.error.message` | `discover.error.message.bg` | - | - |
| Loading | Skeleton cards | - | - | - |
| Offline | `discover.offline.title` | `discover.offline.title.bg` | WifiOff | Check Connection |

### Matches Screen
| State | Copy Key (EN) | Copy Key (BG) | Icon | Action |
|-------|---------------|---------------|------|--------|
| Empty | `matches.empty.title` | `matches.empty.title.bg` | Heart | Start Swiping |
| Empty | `matches.empty.message` | `matches.empty.message.bg` | - | - |
| Error | `matches.error.title` | `matches.error.title.bg` | Error | Retry |
| Error | `matches.error.message` | `matches.error.message.bg` | - | - |
| Loading | Skeleton cards | - | - | - |
| Offline | `matches.offline.title` | `matches.offline.title.bg` | WifiOff | Check Connection |

### Chat Screen
| State | Copy Key (EN) | Copy Key (BG) | Icon | Action |
|-------|---------------|---------------|------|--------|
| Empty | `chat.empty.title` | `chat.empty.title.bg` | Message | Start Chatting |
| Empty | `chat.empty.message` | `chat.empty.message.bg` | - | - |
| Error | `chat.error.title` | `chat.error.title.bg` | Error | Retry |
| Error | `chat.error.message` | `chat.error.message.bg` | - | - |
| Loading | Skeleton messages | - | - | - |
| Offline | `chat.offline.title` | `chat.offline.title.bg` | WifiOff | Check Connection |

### Profile Screen
| State | Copy Key (EN) | Copy Key (BG) | Icon | Action |
|-------|---------------|---------------|------|--------|
| Empty | `profile.empty.title` | `profile.empty.title.bg` | Person | Edit Profile |
| Empty | `profile.empty.message` | `profile.empty.message.bg` | - | - |
| Error | `profile.error.title` | `profile.error.title.bg` | Error | Retry |
| Error | `profile.error.message` | `profile.error.message.bg` | - | - |
| Loading | Skeleton profile | - | - | - |
| Offline | `profile.offline.title` | `profile.offline.title.bg` | WifiOff | Check Connection |

### AI Analysis Panel
| State | Copy Key (EN) | Copy Key (BG) | Icon | Action |
|-------|---------------|---------------|------|--------|
| Empty | `ai.empty.title` | `ai.empty.title.bg` | Image | Upload Photo |
| Empty | `ai.empty.message` | `ai.empty.message.bg` | - | - |
| Error | `ai.error.title` | `ai.error.title.bg` | Error | Retry |
| Error | `ai.error.message` | `ai.error.message.bg` | - | - |
| Loading | Skeleton analysis | - | - | - |
| Analyzing | `ai.analyzing.title` | `ai.analyzing.title.bg` | Loading | Cancel |
| Offline | `ai.offline.title` | `ai.offline.title.bg` | WifiOff | Check Connection |

### Maps Screen
| State | Copy Key (EN) | Copy Key (BG) | Icon | Action |
|-------|---------------|---------------|------|--------|
| Empty | `maps.empty.title` | `maps.empty.title.bg` | Map | Enable Location |
| Empty | `maps.empty.message` | `maps.empty.message.bg` | - | - |
| Error | `maps.error.title` | `maps.error.title.bg` | Error | Retry |
| Error | `maps.error.message` | `maps.error.message.bg` | - | - |
| Loading | Skeleton map | - | - | - |
| Offline | `maps.offline.title` | `maps.offline.title.bg` | WifiOff | Check Connection |

## String Resources

### English (strings.xml)
```xml
<!-- Discover -->
<string name="discover.empty.title">No pets to discover</string>
<string name="discover.empty.message">Start swiping to find your perfect match!</string>
<string name="discover.error.title">Unable to load pets</string>
<string name="discover.error.message">Please check your connection and try again.</string>
<string name="discover.offline.title">You\'re offline</string>

<!-- Matches -->
<string name="matches.empty.title">No matches yet</string>
<string name="matches.empty.message">Keep swiping to find your perfect match!</string>
<string name="matches.error.title">Unable to load matches</string>
<string name="matches.error.message">Please check your connection and try again.</string>
<string name="matches.offline.title">You\'re offline</string>

<!-- Chat -->
<string name="chat.empty.title">No conversations</string>
<string name="chat.empty.message">Start chatting with your matches!</string>
<string name="chat.error.title">Unable to load conversations</string>
<string name="chat.error.message">Please check your connection and try again.</string>
<string name="chat.offline.title">You\'re offline</string>

<!-- Profile -->
<string name="profile.empty.title">Complete your profile</string>
<string name="profile.empty.message">Add photos and information to get started!</string>
<string name="profile.error.title">Unable to load profile</string>
<string name="profile.error.message">Please check your connection and try again.</string>
<string name="profile.offline.title">You\'re offline</string>

<!-- AI Analysis -->
<string name="ai.empty.title">Upload a photo</string>
<string name="ai.empty.message">Get AI-powered breed analysis!</string>
<string name="ai.error.title">Analysis failed</string>
<string name="ai.error.message">Please try again or upload a different photo.</string>
<string name="ai.analyzing.title">Analyzing...</string>
<string name="ai.offline.title">You\'re offline</string>

<!-- Maps -->
<string name="maps.empty.title">Enable location</string>
<string name="maps.empty.message">See pets near you on the map!</string>
<string name="maps.error.title">Unable to load map</string>
<string name="maps.error.message">Please check your connection and try again.</string>
<string name="maps.offline.title">You\'re offline</string>
```

### Bulgarian (strings-bg.xml)
```xml
<!-- Discover -->
<string name="discover.empty.title">Няма животни за откриване</string>
<string name="discover.empty.message">Започнете да свайпвате, за да намерите идеалния си мач!</string>
<string name="discover.error.title">Не може да се заредят животни</string>
<string name="discover.error.message">Моля, проверете връзката си и опитайте отново.</string>
<string name="discover.offline.title">Офлайн сте</string>

<!-- Matches -->
<string name="matches.empty.title">Все още няма мачове</string>
<string name="matches.empty.message">Продължете да свайпвате, за да намерите идеалния си мач!</string>
<string name="matches.error.title">Не може да се заредят мачове</string>
<string name="matches.error.message">Моля, проверете връзката си и опитайте отново.</string>
<string name="matches.offline.title">Офлайн сте</string>

<!-- Chat -->
<string name="chat.empty.title">Няма разговори</string>
<string name="chat.empty.message">Започнете чат с вашите мачове!</string>
<string name="chat.error.title">Не може да се заредят разговори</string>
<string name="chat.error.message">Моля, проверете връзката си и опитайте отновo.</string>
<string name="chat.offline.title">Офлайн сте</string>

<!-- Profile -->
<string name="profile.empty.title">Попълнете профила си</string>
<string name="profile.empty.message">Добавете снимки и информация, за да започнете!</string>
<string name="profile.error.title">Не може да се зареди профил</string>
<string name="profile.error.message">Моля, проверете връзката си и опитайте отново.</string>
<string name="profile.offline.title">Офлайн сте</string>

<!-- AI Analysis -->
<string name="ai.empty.title">Качете снимка</string>
<string name="ai.empty.message">Получете анализ на породата с AI!</string>
<string name="ai.error.title">Анализът не бе успешен</string>
<string name="ai.error.message">Моля, опитайте отново или качете друга снимка.</string>
<string name="ai.analyzing.title">Анализиране...</string>
<string name="ai.offline.title">Офлайн сте</string>

<!-- Maps -->
<string name="maps.empty.title">Активирайте местоположението</string>
<string name="maps.empty.message">Вижте животни близо до вас на картата!</string>
<string name="maps.error.title">Не може да се зареди карта</string>
<string name="maps.error.message">Моля, проверете връзката си и опитайте отново.</string>
<string name="maps.offline.title">Офлайн сте</string>
```

## Skeleton States

### Skeleton Dimensions
- **Card**: Match final card dimensions exactly
- **Text**: Match line height and width
- **Image**: Match aspect ratio (16:9)
- **Avatar**: Match size (40dp)

### Implementation
```kotlin
@Composable
fun CardSkeleton() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(400.dp) // Match final card height
    ) {
        // Skeleton content
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .shimmer()
        )
        Spacer(modifier = Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(20.dp)
                .shimmer()
        )
    }
}
```

## Offline Banner

### Behavior
- **Show**: When network unavailable
- **Position**: Top of screen (below app bar)
- **Dismissible**: No (auto-dismiss when online)
- **Actions**: Check Connection button

### Implementation
```kotlin
@Composable
fun OfflineBanner(visible: Boolean, onCheckConnection: () -> Unit) {
    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically() + fadeIn(),
        exit = slideOutVertically() + fadeOut()
    ) {
        Surface(
            color = MaterialTheme.colorScheme.errorContainer,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .padding(Dimens.Component.PageGutter)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.WifiOff, contentDescription = null)
                    Spacer(modifier = Modifier.width(Dimens.Component.Icon.SpacingMD))
                    Text(stringResource(R.string.offline.title))
                }
                TextButton(onClick = onCheckConnection) {
                    Text(stringResource(R.string.offline.check_connection))
                }
            }
        }
    }
}
```

## Retry Patterns

### Consistent Retry
- **Button**: Primary button style
- **Label**: "Retry" (EN) / "Опитайте отново" (BG)
- **Icon**: Refresh icon
- **Action**: Retry failed operation

### Implementation
```kotlin
@Composable
fun ErrorState(
    title: String,
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(Dimens.Layout.VerticalRhythm.Section))
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall
        )
        Spacer(modifier = Modifier.height(Dimens.Layout.VerticalRhythm.Element))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.height(Dimens.Layout.VerticalRhythm.Section))
        Button(onClick = onRetry) {
            Icon(Icons.Default.Refresh, contentDescription = null)
            Spacer(modifier = Modifier.width(Dimens.Component.Icon.SpacingSM))
            Text(stringResource(R.string.retry))
        }
    }
}
```

## State Transitions

### Transitions
- **Loading → Content**: Fade + scale in
- **Content → Error**: Fade out, fade in error
- **Error → Loading**: Fade out, fade in loading
- **Online → Offline**: Slide down banner
- **Offline → Online**: Slide up banner

### Implementation
```kotlin
@Composable
fun StateContent(
    state: State,
    onRetry: () -> Unit
) {
    Crossfade(
        targetState = state,
        animationSpec = tween(240, easing = StandardEasing)
    ) { currentState ->
        when (currentState) {
            is State.Loading -> LoadingState()
            is State.Success -> ContentState(currentState.data)
            is State.Error -> ErrorState(currentState.error, onRetry)
            is State.Empty -> EmptyState()
        }
    }
}
```

## Implementation Checklist

### ✅ Requirements
- [ ] All states have explicit copy (EN/BG)
- [ ] Skeletons match final dimensions
- [ ] No content jump on state change
- [ ] Offline banner shows/hides correctly
- [ ] Retry patterns consistent
- [ ] State transitions smooth
- [ ] Empty states have actions
- [ ] Error states have retry

### ✅ Testing
- [ ] Test empty states
- [ ] Test error states
- [ ] Test loading states
- [ ] Test offline states
- [ ] Test state transitions
- [ ] Test retry actions
- [ ] Test in EN locale
- [ ] Test in BG locale

