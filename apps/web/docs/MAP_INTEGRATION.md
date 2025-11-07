# Map Integration Implementation

## Overview

Реализирана е пълна интеграция на MapLibre GL карти с всички функционални повърхности и поверителност по подразбиране.

## Implemented Features

### 1. Core Map Infrastructure ✅

- **MapLibre GL** интеграция с векторни тайлове
- **Конфигурация по среди** (dev/staging/prod) чрез environment variables
- **Клъстеризация** на маркери при zoom
- **Performance оптимизации** (debounce, caching)

### 2. Map Components ✅

- `MapLibreMap.tsx` - Основен map component
- `useMapLibreMap.ts` - Hook за управление на картата
- `provider-config.ts` - Конфигурация на доставчик

### 3. Functional Surfaces ✅

#### Discover → Map Mode
- Реална карта с клъстерирани маркери
- Превключвател Cards | Map
- Уважава всички филтри (age/size/distance)
- Bottom sheet при тап на маркер

#### Match → Plan Playdate  
- VenuePicker component с геокодиране
- Категории: Park, Vet, Groomer, Pet-friendly Café, Store
- Търсене с дебаунс
- Deep links към Apple/Google Maps

#### Chat → Location Sharing
- LocationBubble component за мини карта
- LocationPicker за избор на локация
- Privacy blur (coarse grid + jitter)
- Full map sheet при тап

#### Community → Lost & Found
- Map-first view с филтри (radius, time)
- Клъстерирани alert маркери
- Report Sighting функционалност
- Auto-expire на стари алерти

### 4. Privacy & Safety ✅

- **Grid snapping** (300-500m) за локации
- **Random jitter** (200-500m) който се регенерира всеки сешън
- **Degrade precision** за Lost & Found пинове с времето
- **Precise sharing** само при явно действие
- **Never show exact home** координати

### 5. Geocoding & POI ✅

- Forward/reverse geocoding чрез MapTiler API
- POI търсене с категории
- Request ID tracking и latency monitoring
- Multi-language support (EN/BG)

### 6. Deep Links & Navigation ✅

- Apple Maps deeplinks (iOS)
- Google Maps deeplinks (Android/Web)
- Universal geo: links
- App deep links (app://petspark)
- Automatic detection на платформа

### 7. Mobile Behavior ✅

- Sheet компоненти с swipe-down to close
- Tap outside to dismiss
- Back/Esc closes overlay
- Focus trap в sheets
- Offline support (cached tiles)

### 8. Monitoring & Quotas ✅

- Geocoding metrics tracking
- Tile request counting
- Quota alerts при 80% лимит
- Daily reset на квоти
- Text report за latency & errors

## Configuration

### Environment Variables

```bash
VITE_MAP_STYLE_URL=https://api.maptiler.com/maps/streets-v2/style.json?key=
VITE_MAP_TILES_API_KEY=your_maptiler_key
VITE_GEOCODING_API_KEY=your_geocoding_key
VITE_GEOCODING_ENDPOINT=https://api.maptiler.com/geocoding
VITE_MAP_PROVIDER=maplibre
```

### Default Quotas

- Tiles: 100,000/day
- Geocoding: 10,000/day
- Alert threshold: 80%

## Usage Examples

### Discover Map Mode
```tsx
<DiscoverMapMode 
  pets={pets}
  userPet={userPet}
  onSwipe={handleSwipe}
/>
```

### Venue Picker
```tsx
<VenuePicker
  open={showVenuePicker}
  onClose={() => setShowVenuePicker(false)}
  onSelectVenue={handleVenueSelect}
  matchLocation={matchLocation}
/>
```

### Location Sharing
```tsx
<LocationBubble
  location={location}
  label="Meeting Point"
  timestamp="2:30 PM"
  onTap={() => openFullMap()}
/>
```

## Privacy Implementation

Всички локации минават през:
1. **Grid snapping** - закръгляне до 300-500m grid
2. **Session jitter** - случайно отместване 200-500m, уникално за сешън
3. **Precision degradation** - Lost & Found пинове стават по-неточни с времето

## Testing

Run type checking:
```bash
npm run typecheck
```

Run tests:
```bash
npm test
```

## Next Steps

1. **Admin Console Maps**
   - Heatmap за активност
   - Reports map с moderation actions
   - Audit logging

2. **Offline Support**
   - Tile caching стратегия
   - Offline banner
   - Fallback при липса на мрежа

3. **Performance**
   - Lazy loading на маркери
   - Virtual scrolling за голям брой места
   - Web Workers за геокодиране

4. **Analytics**
   - Map interaction tracking
   - Venue selection analytics
   - Location sharing metrics

