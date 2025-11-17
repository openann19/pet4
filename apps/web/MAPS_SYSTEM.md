# 🗺️ PawfectMatch Maps System - Complete Implementation Guide

## Overview

This document outlines the complete maps system implementation for PawfectMatch, covering discovery, pet-friendly places, playdate planning, lost-pet alerts, and real-time presence with full admin moderation capabilities.

## Architecture

### Core Components

```
MAPS SYSTEM ARCHITECTURE
├── 📱 Map Views
│   ├── DiscoverNearMe - Pet discovery with coarse location
│   ├── PetFriendlyPlaces - Categorized venue discovery
│   ├── PlaydatePlanner - Midpoint calculation & venue suggestions
│   ├── LostPetMode - Alert broadcasting & sighting reports
│   └── MatchesOnMap - Gentle presence indicators
│
├── 🔧 Core Services
│   ├── Location Service - Privacy-first geolocation
│   ├── Geocoding Service - Address search & reverse geocoding
│   ├── Places Service - POI management & search
│   ├── Routing Service - Navigation & ETA calculations
│   └── Geofencing Service - Proximity alerts & triggers
│
├── 🛡️ Admin Console
│   ├── Places CMS - Create/edit/verify places
│   ├── Moderation Queue - Review submissions & reports
│   ├── Quality Control - Duplicate detection & validation
│   └── Audit Log - Complete change tracking
│
└── 📊 Analytics & Observability
    ├── User Event Tracking - Map interactions & searches
    ├── Performance Metrics - Latency & render times
    └── Correlation IDs - End-to-end request tracing
```

## 1. Foundations & Environments

### Configuration Contract

```typescript
interface MapConfig {
  MAP_STYLE_URL: string; // Map tile style endpoint
  TILES_SOURCE: string; // Map tiles provider URL
  GEOCODER_ENDPOINT: string; // Geocoding API endpoint
  PLACES_ENDPOINT: string; // Places API endpoint
  ROUTING_ENDPOINT: string; // Routing API endpoint
  PRIVACY_GRID_METERS: number; // Coarse location grid size (500-1000m)
  DEFAULT_RADIUS_KM: number; // Default search radius (10km)
  UNITS: 'metric' | 'imperial'; // Distance units
  COUNTRY_BIAS: string; // Country code for search bias
}
```

### Environment Files

**`/workspaces/spark-template/src/lib/maps/config.ts`** - Contains environment-specific configurations

**Boot Command**: `npm run dev` - Starts all services with seed POIs and demo routes

## 2. Privacy & Permissions

### Location Privacy States

1. **Coarse Location (Default)**
   - Snap to grid (500-1000m cells)
   - Suitable for: Discovery, general matching
   - No permission banner required

2. **Precise Location (Opt-in)**
   - Exact GPS coordinates
   - Session-bound (max 60 minutes)
   - Clear consent banner with copy:
     - EN: "Share your precise location to enable live meet-ups? You can turn this off anytime."
     - BG: "Споделяне на точната ви локация за активиране на срещи на живо? Може да го изключите по всяко време."

3. **Location Denied**
   - Graceful degradation to manual location selection
   - Continue with city-level accuracy
   - Display friendly message: "Select your area manually to continue"

### Privacy Implementation

```typescript
interface LocationPrivacy {
  precisionLevel: 'none' | 'coarse' | 'precise';
  gridSizeMeters: number;
  preciseSharingUntil?: Date;
  consentGiven: boolean;
  consentTimestamp?: Date;
}

// Snap location to privacy grid
const snapToGrid = (location: Location, gridSize: number): Location => {
  const gridSizeDeg = gridSize / 111000; // meters to degrees
  return {
    lat: Math.floor(location.lat / gridSizeDeg) * gridSizeDeg + gridSizeDeg / 2,
    lng: Math.floor(location.lng / gridSizeDeg) * gridSizeDeg + gridSizeDeg / 2,
  };
};
```

### GDPR Compliance

- **Export**: Include all location records in user data export
- **Delete**: Purge all location history on account deletion
- **Retention**: Keep precise location only during active session
- **Audit**: Log all location access events

## 3. Location Acquisition & Accuracy

### Tiered Strategy

```typescript
async function getLocation(precisionLevel: 'coarse' | 'precise'): Promise<LocationResult> {
  // 1. Check cached location (< 5 minutes old)
  const cached = await getCachedLocation();
  if (cached && isCacheValid(cached)) {
    return cached;
  }

  // 2. Try network-based location (fast, coarse)
  try {
    const networkLoc = await navigator.geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 300000,
    });
    if (precisionLevel === 'coarse') {
      return snapToGrid(networkLoc, PRIVACY_GRID_METERS);
    }
  } catch (error) {
    // Fall through to GPS
  }

  // 3. Use GPS if precise location requested and consented
  if (precisionLevel === 'precise' && hasConsent()) {
    const gpsLoc = await navigator.geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return gpsLoc;
  }

  // 4. Fallback to manual selection
  return promptManualLocation();
}
```

### Accuracy Indicators

Display subtle chip showing current accuracy:

- "~200m" - High accuracy
- "~1km" - Standard accuracy
- "~5km" - Low accuracy / City-level

## 4. Core Map Views

### A. Discover Near Me

**Features:**

- Clustered markers at low zoom levels
- List view synced to viewport
- Real-time filter updates
- Distance sorting

**Filters:**

- Distance slider (1-50km)
- Pet size (small/medium/large/extra-large)
- Age range (1-15 years)
- Intent (playdate/adoption/companionship)

**Sheet Actions:**

- Save to Favorites
- Navigate (opens native maps)
- Start Chat
- Plan Meet

### B. Pet-Friendly Places

**Categories:**

- 🌳 Parks (dog parks, trails)
- 🏥 Veterinarians
- ✂️ Groomers
- ☕ Pet Cafes
- 🛒 Pet Stores
- 🏨 Pet Hotels
- 🏖️ Dog Beaches
- 🎯 Training Centers

**Features:**

- Verified badge for admin-approved places
- Community ratings (1-5 stars)
- Open/closed status
- Distance from current location
- Save to favorites
- "Popular now" based on check-ins

**Place Sheet:**

```typescript
interface PlaceSheet {
  name: string;
  category: string;
  photos: string[];
  rating: number;
  reviewCount: number;
  distance: string;
  address: string;
  hours: string;
  phone?: string;
  website?: string;
  amenities: string[]; // 'Water', 'Fenced', 'Off-leash', 'Shade'
  actions: ['Save', 'Navigate', 'Share', 'Report'];
}
```

### C. Playdate Planner

**Flow:**

1. Select 2+ participants from matches
2. Calculate fair midpoint
3. Suggest 2-3 nearby venues:
   - Open now
   - Pet-friendly
   - Safe/public
4. Optional: "Share live location for 60 min"
5. Share meet link

**Midpoint Calculation:**

```typescript
function calculateMidpoint(locations: Location[]): Location {
  const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
  const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
  return { lat: avgLat, lng: avgLng };
}

function suggestVenues(midpoint: Location): Promise<Place[]> {
  return searchPlaces({
    location: midpoint,
    radius: 2, // km
    categories: ['park', 'cafe'],
    openNow: true,
    petFriendly: true,
    sortBy: 'rating',
    limit: 3,
  });
}
```

**Share Link Format:**

```
pawfectmatch://playdate/{playdateId}
?participants={userId1},{userId2}
&location={lat},{lng}
&place={placeId}
```

### D. Lost Pet Mode

**Alert Creation:**

```typescript
interface LostPetAlert {
  petId: string;
  petName: string;
  petPhoto: string;
  breed: string;
  lastSeenLocation: Location;
  lastSeenTime: Date;
  description: string;
  contactInfo: string; // Phone/email
  broadcastRadius: number; // 1-50 km
  status: 'active' | 'found' | 'expired';
}
```

**Features:**

- Radius slider for alert zone (1-50km)
- Poster sheet generator with photo
- Notify nearby users (opt-in audience only)
- Sighting reports with photos + locations
- Separate map layer for alerts vs. regular POIs

**Notifications:**

- Alert creator: "New sighting reported near {location}"
- Nearby users: "Lost pet alert in your area" (once per alert)

### E. My Matches on Map

**Presence Modes:**

1. **Coarse Grid (Default)**
   - "In your area today"
   - Grid-snapped location
   - No exact position

2. **Precise (Temporary Opt-in)**
   - Exact location marker
   - Session-bound (expires after 60 minutes)
   - Clear indicator: "Sharing precise location"

**UI Elements:**

- Avatar markers for matches
- Tap to see profile card
- Distance estimate (coarse: "< 2km", precise: "1.3 km")
- Online/offline status

## 5. Search, Geocoding & Results

### Unified Search Box

**Inputs:**

- Addresses: "123 Main St, New York"
- Place names: "Central Park"
- Categories: "dog parks near me"
- Bulgarian + English queries

**Search API:**

```typescript
interface SearchQuery {
  query: string;
  location?: Location;
  radius?: number;
  categories?: string[];
  limit?: number;
  countryBias?: string;
  language?: 'en' | 'bg';
}

interface SearchResult {
  id: string;
  type: 'address' | 'place' | 'category';
  name: string;
  description?: string;
  location: Location;
  distance?: number;
}
```

**Ranking:**

1. Recent searches (exact match)
2. Saved places
3. Distance (nearest first)
4. Rating (highest first)
5. Open now (prioritized)
6. Relevance score

**Bulgarian Example:**

- Query: "парк" → Returns local dog parks
- Query: "ветеринар" → Returns nearby veterinarians

## 6. Markers, Clustering & Density

### Marker Types

```typescript
interface MapMarker {
  id: string;
  type: 'pet' | 'place' | 'user' | 'alert' | 'sighting';
  location: Location;
  icon: string;
  color: string;
  state: 'default' | 'selected' | 'saved' | 'verified' | 'crowded';
}
```

### Clustering Algorithm

```typescript
function clusterMarkers(markers: MapMarker[], zoom: number): Cluster[] {
  const gridSize = calculateGridSize(zoom);
  const clusters: Map<string, Cluster> = new Map();

  for (const marker of markers) {
    const cellId = getCellId(marker.location, gridSize);
    if (!clusters.has(cellId)) {
      clusters.set(cellId, {
        id: cellId,
        count: 0,
        markers: [],
        center: marker.location,
      });
    }
    const cluster = clusters.get(cellId)!;
    cluster.count++;
    cluster.markers.push(marker);
  }

  return Array.from(clusters.values());
}
```

### Zoom Behavior

- Zoom < 10: Show clusters
- Zoom 10-14: Expand to individual pins
- Zoom > 14: Full detail + labels

### Hit Targets

- Minimum: 44×44px tap target
- Visual marker: Can be smaller (24×24px)
- Invisible hit area extends beyond visual

## 7. Routing & Meet Points

### Navigation Integration

```typescript
function openNativeMap(destination: Location, label?: string) {
  const { lat, lng } = destination;
  const encoded = encodeURIComponent(label || '');

  // iOS
  if (isIOS()) {
    window.open(`maps://?q=${encoded}&ll=${lat},${lng}`);
  }
  // Android
  else if (isAndroid()) {
    window.open(`geo:${lat},${lng}?q=${lat},${lng}(${encoded})`);
  }
  // Web fallback
  else {
    const provider = getUserPreference('mapProvider') || 'google';
    if (provider === 'google') {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    } else {
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}`);
    }
  }
}
```

### Meet Point Suggestions

```typescript
interface MeetPointCriteria {
  safety: number; // Well-lit, public
  petFriendly: boolean;
  open: boolean;
  rating: number;
  distance: number; // From midpoint
}

function scoreMeetPoint(place: Place, midpoint: Location): number {
  let score = 0;
  score += place.verified ? 30 : 0;
  score += place.rating * 10;
  score += place.isOpen ? 20 : -50;
  score += place.amenities.includes('water') ? 10 : 0;
  score += place.amenities.includes('fenced') ? 15 : 0;
  score -= calculateDistance(place.location, midpoint) * 5;
  return score;
}
```

### ETA Display

Show mode-specific ETAs:

- 🚶 Walk: "12 min"
- 🚗 Drive: "5 min"
- 🚇 Transit: "18 min"

## 8. Geofencing & Notifications

### Geofence Configuration

```typescript
interface Geofence {
  id: string;
  type: 'playdate' | 'lost_pet' | 'saved_place';
  location: Location;
  radius: number; // meters
  enabled: boolean;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  quietHours: { start: string; end: string }; // "22:00"-"08:00"
}
```

### Notification Examples

**Playdate Arrival:**

- Title: "Almost there!"
- Body: "You're 200m from {placeName}"
- Action: "View Details"

**Lost Pet Awareness:**

- Title: "Lost pet alert"
- Body: "A {breed} was lost near your area"
- Action: "See Details" | "Dismiss"

**Saved Place Nearby:**

- Title: "You're near {placeName}"
- Body: "One of your saved places is 500m away"
- Action: "Navigate" | "Dismiss"

### Quiet Hours

Respect user-defined or default quiet hours (22:00-08:00):

- Queue notifications
- Deliver summary in morning
- Exception: Emergency/critical alerts only

## 9. Offline & Weak Network

### Caching Strategy

```typescript
interface MapCache {
  tiles: {
    zoom: number;
    x: number;
    y: number;
    data: Blob;
    cachedAt: Date;
  }[];
  places: Place[];
  viewport: {
    center: Location;
    zoom: number;
    boundingBox: BoundingBox;
  };
  photos: {
    url: string;
    thumbnail: Blob;
  }[];
}
```

### Offline Capabilities

**Read-Only:**

- View cached tiles for last viewport
- Browse cached POIs
- View saved places
- View cached photos (thumbnails)

**Write Queue:**

- Queue place submissions
- Queue sighting reports
- Queue favorites/saves
- Sync when connection restored

### Offline UI

Display banner:

- EN: "You're offline. Viewing cached data. Updates will sync when you reconnect."
- BG: "Няма връзка. Преглед на кеширани данни. Актуализациите ще се синхронизират при повторно свързване."

## 10. Error Handling & Empty States

### Error Messages

**Location Off:**

```
Title: "Location access disabled"
Message: "Enable location in your device settings to discover nearby pets and places"
Actions: [Open Settings] [Continue Without]
```

**Geocoder Fail:**

```
Title: "Couldn't find that address"
Message: "Check the spelling or try a different search"
Actions: [Try Again] [Browse Map]
```

**No Places Match:**

```
Title: "No places found"
Message: "Try adjusting your filters or search radius"
Actions: [Reset Filters] [Expand Radius]
```

### Empty States

**No Saved Places:**

```
Icon: 📍
Title: "No saved places yet"
Message: "Tap the heart icon on any place to save it here"
Action: [Discover Places]
```

**No Lost Pet Alerts:**

```
Icon: 🐾
Title: "No lost pets in your area"
Message: "We'll notify you if any pet goes missing nearby"
```

## 11. Accessibility & Internationalization

### Keyboard Navigation (Web)

- Tab: Focus next interactive element
- Enter/Space: Activate selected marker
- Arrow keys: Pan map
- +/- or PgUp/PgDown: Zoom
- Escape: Close sheets/popups

### Screen Reader Support

**Marker Announcements:**

```
"Place marker: Central Dog Park, 1.2 kilometers away, 4.5 star rating, open now. Double tap to view details"
```

**Map Region:**

```
"Showing 15 places within 5 kilometers of your location"
```

### Localization (EN/BG)

**Key Translations:**

| English             | Bulgarian                   |
| ------------------- | --------------------------- |
| Discover Near Me    | Открий наблизо              |
| Pet-Friendly Places | Места за домашни любимци    |
| Playdate Planner    | Планиране на среща          |
| Lost Pet Mode       | Режим изгубен любимец       |
| Navigate            | Навигация                   |
| Share Location      | Споделяне на местоположение |
| Save Place          | Запази място                |
| Open Now            | Отворено сега               |
| Distance            | Разстояние                  |
| Filters             | Филтри                      |
| My Location         | Моята локация               |
| Search              | Търсене                     |

## 12. Admin Console

### Places CMS

**Create/Edit Place:**

```typescript
interface PlaceForm {
  name: string;
  category: string;
  location: Location;
  address: string;
  phone?: string;
  website?: string;
  hours?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  photos: File[];
  amenities: string[];
  petFriendly: boolean;
  verified: boolean;
  moderationNotes?: string;
}
```

**Bulk Import (CSV):**

```csv
name,category,lat,lng,address,phone,website,petFriendly
"Central Dog Park",park,40.7829,-73.9654,"123 W 81st St, New York, NY 10024",555-1234,example.com,true
```

**Duplicate Detection:**

- Match by name + location (within 100m)
- Suggest merge or mark as duplicate
- Admin review required

### Moderation Queue

**Queue Filters:**

- Status: Pending, Approved, Rejected
- Type: Place, Report, Lost Pet, Sighting
- Date: Last 24h, 7 days, 30 days
- Priority: High, Medium, Low

**Moderation Actions:**

```typescript
interface ModerationAction {
  action: 'approve' | 'reject' | 'edit' | 'merge' | 'delete';
  reason?: string;
  notes?: string;
  moderatorId: string;
  timestamp: Date;
}
```

**Quality Signals:**

- ❌ Suspicious coordinates (ocean, restricted area)
- ❌ Low-quality photos (blur, inappropriate)
- ⚠️ Missing required fields
- ⚠️ Potential duplicate (name + location match)
- ✅ Verified submitter
- ✅ Multiple confirmations

### Audit Log

```typescript
interface AuditLogEntry {
  id: string;
  entityType: 'place' | 'user' | 'report';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  actorId: string;
  actorName: string;
  actorRole: 'admin' | 'moderator';
  before?: any;
  after?: any;
  reason?: string;
  timestamp: Date;
  correlationId: string;
}
```

**Audit UI:**

- Filterable by entity, action, actor, date
- Export to CSV
- Immutable log (no deletions)

## 13. Analytics & Observability

### Event Tracking

```typescript
// Map interactions
track('map_view_opened', { view: 'discover' | 'places' | 'playdate' | 'lost_pet' });
track('search_performed', { query: string, resultCount: number });
track('filter_changed', { filter: string, value: any });
track('poi_opened', { placeId: string, category: string });
track('poi_saved', { placeId: string });
track('navigate_clicked', { placeId: string, destination: Location });

// Playdate & social
track('meet_point_suggested', { participantCount: number, venueCount: number });
track('meet_point_confirmed', { placeId: string });
track('presence_opt_in_changed', { enabled: boolean, duration: number });

// Lost pet
track('lost_pet_alert_created', { petId: string, radius: number });
track('sighting_reported', { alertId: string, location: Location });
```

### Performance Metrics

**Latency Budget:**

- Map first render: < 1000ms
- Results update (search/filter): < 500ms
- Marker tap to sheet open: < 200ms
- Navigation to external app: < 100ms

**Tracking:**

```typescript
interface PerformanceMetric {
  metric: string;
  value: number; // milliseconds
  timestamp: Date;
  correlationId: string;
  userAgent: string;
}

// Example
trackPerformance('map_first_render', renderTime, correlationId);
```

### Correlation IDs

**Flow:**

1. Client generates correlationId on request
2. Attach to all API calls as header: `X-Correlation-ID`
3. Server logs include correlationId
4. Client events include correlationId
5. Analytics dashboard links client → server logs

**Example:**

```
Client Event: search_performed (correlationId: abc-123)
  ↓
API Request: GET /api/places?q=park (X-Correlation-ID: abc-123)
  ↓
Server Log: [INFO] Places search query="park" results=15 latency=120ms correlationId=abc-123
```

## 14. Safety & Abuse Prevention

### Privacy Controls

**Default Settings:**

- Coarse location only
- No home address sharing
- Private places not searchable
- Opt-in for precise location

**Home Address Protection:**

- Detect if place submission is within 50m of user's home
- Warn: "This looks like your home address. Sharing this publicly isn't safe"
- Block publishing if confirmed as home

**Abuse Prevention:**

- Rate limit: 10 place submissions/day per user
- Rate limit: 5 reports/hour per user
- Photo moderation queue for all user-uploaded images
- Automated NSFW detection

### Report Place Flow

```typescript
interface PlaceReport {
  placeId: string;
  reason: 'incorrect_info' | 'not_pet_friendly' | 'closed' | 'inappropriate' | 'spam' | 'other';
  description?: string;
  reportedBy: string;
  timestamp: Date;
}
```

**Actions:**

1. User reports place
2. Place goes to moderation queue
3. Multiple reports trigger immediate review
4. Admin approves or rejects report
5. Unsafe places blocked from search

## 15. Definition of Done

### Functional Requirements

✅ Discover, Places, Playdate Planner, Lost Pet, Matches on Map work on Web + Mobile  
✅ Privacy defaults to coarse location; precise is session-bound and opt-in  
✅ Clustering, search, filters, and deep links are reliable and fast  
✅ Admin can approve places, resolve reports, and imports work  
✅ Five-minute demo script runs clean on staging with seed data

### Performance Requirements

✅ Map first render < 1000ms  
✅ Results update < 500ms  
✅ Marker interactions < 200ms  
✅ No memory leaks on long sessions

### Accessibility Requirements

✅ Keyboard navigation works (web)  
✅ Screen reader compatible (mobile + web)  
✅ High contrast mode supported  
✅ Reduce motion respected

### Security & Privacy Requirements

✅ No exact locations stored without consent  
✅ Home addresses blocked from public sharing  
✅ Rate limiting on submissions  
✅ Photo moderation queue  
✅ GDPR export/delete

## 16. Five-Minute Demo Script

### Setup (One-time)

```bash
# Seed database with demo data
npm run seed:map-data

# Data includes:
# - 50 pet-friendly places (all categories)
# - 20 demo pet profiles
# - 5 nearby matches
# - 2 lost pet alerts
# - 10 demo routes
```

### Demo Flow

**1. Discover Near Me (60 sec)**

- Open app → Maps tab → Discover view
- Allow approximate location
- See clustered pins and synced list
- Apply filter: "Dog parks within 5km"
- Tap marker → sheet shows place details
- Save to favorites

**2. Search & Places (45 sec)**

- Switch to Places view
- Search "парк" (Bulgarian)
- Results sort by distance/open-now
- Tap Central Dog Park
- Sheet shows photos, tags, hours
- Save to favorites
- Tap Navigate → opens native maps

**3. Playdate Planning (90 sec)**

- Switch to Playdate Planner
- Select 2 matches from list
- System suggests midpoint + 3 venues
- Review venue cards (distance, rating, amenities)
- Toggle "Share precise location for 60 min"
- Confirm venue → share meet link
- Link opens to playdate details

**4. Lost Pet Alert (60 sec)**

- Create Lost Pet alert
- Upload pet photo
- Set broadcast radius (5km)
- Add description: "Golden Retriever, brown collar"
- Submit alert
- Nearby test user receives push notification
- View alert on map with radius overlay

**5. Admin Moderation (45 sec)**

- Open Admin Console
- Review pending place submission
- Check location on map
- Verify photos and details
- Approve with reason: "Verified location and amenities"
- Deny duplicate submission with reason: "Duplicate of Place ID 123"
- Clients update within 5 seconds

**Total Time: 5 minutes**

## Technology Stack

### Frontend

- **React** (Web) with TypeScript
- **React Native** (Mobile) with TypeScript
- **Leaflet** or **Mapbox GL JS** for map rendering
- **Framer Motion** for animations

### Backend

- **Node.js + Express** or **FastAPI** (Python)
- **PostgreSQL** with PostGIS for spatial queries
- **Redis** for caching and geofencing
- **Socket.io** for real-time updates

### Third-Party Services

- **MapTiler** or **Mapbox** for tiles and geocoding
- **Nominatim** (OpenStreetMap) for open-source geocoding
- **Cloudinary** for image storage and optimization

### Infrastructure

- **Docker** for containerization
- **Kubernetes** for orchestration
- **NGINX** for API gateway and load balancing
- **Prometheus + Grafana** for monitoring

## File Structure

```
src/
├── lib/
│   └── maps/
│       ├── config.ts           # Environment configurations
│       ├── types.ts            # TypeScript interfaces
│       ├── utils.ts            # Utility functions (distance, grid, etc.)
│       ├── location.ts         # Location service (privacy-first)
│       ├── geocoding.ts        # Geocoding & search
│       ├── places.ts           # Places service
│       ├── routing.ts          # Navigation & ETA
│       └── geofencing.ts       # Proximity alerts
│
├── components/
│   └── maps/
│       ├── MapView.tsx         # Core map component
│       ├── PlaceSheet.tsx      # Place detail bottom sheet
│       ├── SearchBar.tsx       # Unified search
│       ├── FilterPanel.tsx     # Filter UI
│       ├── MarkerCluster.tsx   # Marker clustering
│       ├── LocationPrivacyBanner.tsx
│       ├── DiscoverNearMe.tsx
│       ├── PetFriendlyPlaces.tsx
│       ├── PlaydatePlanner.tsx
│       ├── LostPetMode.tsx
│       └── MatchesOnMap.tsx
│
├── components/
│   └── admin/
│       └── maps/
│           ├── PlacesCMS.tsx
│           ├── ModerationQueue.tsx
│           ├── QualityControl.tsx
│           └── AuditLog.tsx
│
└── hooks/
    ├── useLocation.ts          # Location hook with privacy
    ├── useGeocoding.ts         # Search & geocoding
    ├── usePlaces.ts            # Places data fetching
    └── useGeofencing.ts        # Proximity monitoring
```

## Next Steps

1. **Phase 1: Core Infrastructure**
   - Implement location service with privacy controls
   - Set up geocoding and places APIs
   - Create base map component with markers

2. **Phase 2: Discovery Features**
   - Build Discover Near Me view
   - Implement Pet-Friendly Places view
   - Add search and filters

3. **Phase 3: Social Features**
   - Create Playdate Planner
   - Implement Lost Pet Mode
   - Add Matches on Map

4. **Phase 4: Admin & Moderation**
   - Build Places CMS
   - Create moderation queue
   - Implement audit logging

5. **Phase 5: Polish & Optimization**
   - Add offline support
   - Implement analytics
   - Performance optimization
   - Accessibility audit

## Support & Documentation

- **API Docs**: `/docs/api/maps`
- **User Guide**: `/docs/user/maps`
- **Admin Manual**: `/docs/admin/places`
- **Privacy Policy**: `/docs/privacy#location`

---

**Last Updated**: 2025-01-27  
**Status**: Specification Complete - Ready for Implementation
