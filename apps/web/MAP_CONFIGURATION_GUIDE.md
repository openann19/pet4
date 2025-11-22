# Map Configuration Guide

## Overview

The PawfectMatch map system provides comprehensive location-based features with full admin configurability. All settings can be adjusted in real-time through the Admin Console without requiring code changes or deployments.

## Features

### 1. **Custom Place Categories**

- Add, edit, and delete place categories with custom icons and colors
- Each category has:
  - **ID**: Unique identifier (e.g., `park`, `vet`, `groomer`)
  - **Name**: Display name (e.g., "Parks", "Veterinarians")
  - **Icon**: Emoji or icon character (e.g., 🌳, 🏥, ✂️)
  - **Color**: Hex color code for map markers and UI elements

### 2. **Privacy & Location Settings**

#### Privacy Grid Size

- **Range**: 100m - 5000m
- **Default**: 1000m
- **Purpose**: User locations are snapped to a grid of this size to protect privacy
- **Behavior**: Coarse locations are always approximate; precise sharing requires explicit user consent

#### Precise Location Controls

- **Enable/Disable**: Toggle whether users can share exact GPS coordinates
- **Timeout**: 5-240 minutes (default: 60 min)
- **Behavior**: After timeout, location reverts to approximate grid-snapped coordinates
- **Use Cases**: Playdate meetups, live location sharing during walks

#### Distance Settings

- **Default Radius**: Initial search/discovery radius (default: 10km)
- **Max Radius**: Maximum searchable distance (default: 100km)
- **Min Radius**: Minimum searchable distance (default: 1km)
- **Units**: Metric (km/m) or Imperial (mi/ft)

#### Country Bias

- **Format**: Two-letter country code (e.g., `US`, `GB`, `BG`, `DE`)
- **Purpose**: Prioritizes local results in geocoding and search

### 3. **Map Features (Toggle On/Off)**

#### Geofencing

- **Purpose**: Location-based notifications and alerts
- **Use Cases**:
  - "Your match is nearby!" notifications
  - Playdate arrival reminders
  - Lost pet alert radius monitoring

#### Lost Pet Alerts

- **Purpose**: Community-driven lost & found system
- **Features**:
  - Create alerts with photo, description, last-seen location
  - Set broadcast radius
  - Community sighting reports
  - Status tracking (active/found/expired)

#### Playdate Planning

- **Purpose**: Smart venue suggestions for meetups
- **Features**:
  - Midpoint calculation between participants
  - Venue recommendations (open now, pet-friendly, safe)
  - One-tap directions to native maps
  - Live location sharing during meetups

#### Place Discovery

- **Purpose**: Find pet-friendly venues and services
- **Features**:
  - Categorized search (parks, vets, groomers, cafes)
  - Verified business badges
  - Ratings and reviews
  - Save favorites
  - "Popular now" based on check-ins

#### Additional Toggles

- **Auto Center on Location**: Automatically center map on user's location when opened
- **Show Distance Labels**: Display distance information on markers
- **Cluster Markers**: Group nearby markers to reduce visual clutter
- **Max Visible Markers**: Limit number of markers shown at once (10-200, default: 50)

### 4. **User-Submitted Content**

#### Enable User-Submitted Places

- **Toggle**: Allow users to add new places to the map
- **Moderation**: Require admin approval before places appear publicly

#### Moderation Queue

- **Review**: Pending place submissions
- **Actions**: Approve, deny with reason, edit details
- **Quality Signals**: Duplicate detection, suspicious coordinates, photo quality

## Admin Console Access

### Navigation

1. Open Admin Console (shield icon in header)
2. Navigate to **Map Configuration** section
3. All settings update immediately upon save

### Map Configuration Sections

#### 1. Privacy & Location Settings

```
Privacy Grid Size: [slider] 1000m
✓ Enable Precise Location
Precise Location Timeout: [slider] 60 min
Default Radius: [input] 10 km
Max Radius: [input] 100 km
Units: [dropdown] Metric
Country Bias: [input] US
```

#### 2. Map Features

```
✓ Geofencing
✓ Lost Pet Alerts
✓ Playdate Planning
✓ Place Discovery
✓ Auto Center on Location
✓ Show Distance Labels
✓ Cluster Markers
Max Visible Markers: [slider] 50
```

#### 3. Place Categories

```
[+ Add Category]

🌳 Parks
   ID: park | Color: #22c55e
   [Edit] [Delete]

🏥 Veterinarians
   ID: vet | Color: #3b82f6
   [Edit] [Delete]

✂️ Groomers
   ID: groomer | Color: #a855f7
   [Edit] [Delete]

... (more categories)
```

#### 4. User-Submitted Places

```
✓ Enable User-Submitted Places
✓ Require Moderation
```

#### 5. API Configuration (Read-Only)

```
Geocoding Endpoint: /api/geocode
Places Endpoint: /api/places
Routing Endpoint: /api/routes
Tiles Source: https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.png
```

## API Endpoints

All map configuration and data is exposed via REST API endpoints:

### Configuration

- `GET /api/map/config` - Get current configuration
- `PUT /api/map/config` - Update configuration (admin only)

### Places

- `GET /api/map/places` - List places (with filters)
- `GET /api/map/places/:id` - Get place details
- `POST /api/map/places` - Create place (requires auth)
- `PATCH /api/map/places/:id` - Update place
- `DELETE /api/map/places/:id` - Delete place (admin only)
- `POST /api/map/places/:id/moderate` - Approve/reject place (admin only)

### Categories

- `GET /api/map/categories` - List all categories
- `POST /api/map/categories` - Create category (admin only)
- `PATCH /api/map/categories/:id` - Update category (admin only)
- `DELETE /api/map/categories/:id` - Delete category (admin only)

### Lost Pet Alerts

- `GET /api/map/lost-pets` - List active alerts
- `POST /api/map/lost-pets` - Create alert
- `PATCH /api/map/lost-pets/:id` - Update alert
- `POST /api/map/lost-pets/:id/sightings` - Report sighting

### Playdate

- `POST /api/map/playdate/suggest` - Get venue suggestions
- `POST /api/map/playdate` - Create playdate request

### Geocoding

- `GET /api/geocode?address=...` - Convert address to coordinates
- `GET /api/geocode/reverse?lat=...&lng=...` - Convert coordinates to address

### Search

- `GET /api/map/search?q=...&lat=...&lng=...&radius=...` - Search places

## Frontend Integration

### React Hook

```typescript
import { useMapConfig } from '@/lib/maps/useMapConfig';

function MyComponent() {
  const { mapSettings, categorySettings, PLACE_CATEGORIES } = useMapConfig();

  // mapSettings contains all privacy and feature flags
  // categorySettings contains category configuration
  // PLACE_CATEGORIES is the array of categories
}
```

### API Client

```typescript
import { mapAPI } from '@/lib/maps/api';

// Get configuration
const config = await mapAPI.getConfig();

// Search places
const places = await mapAPI.searchPlaces('dog park', { lat: 40.7128, lng: -74.006 }, 5);

// Get places by category
const vets = await mapAPI.getPlaces({
  category: 'vet',
  location: { lat: 40.7128, lng: -74.006 },
  radius: 10,
  verified: true,
});

// Create lost pet alert
const alert = await mapAPI.createLostPetAlert({
  petId: 'pet-123',
  petName: 'Buddy',
  petPhoto: 'https://...',
  breed: 'Golden Retriever',
  lastSeen: { lat: 40.7128, lng: -74.006 },
  lastSeenTime: new Date(),
  description: 'Wearing red collar',
  contactInfo: 'contact@example.com',
  radius: 5,
  status: 'active',
  createdBy: 'user-456',
});

// Suggest playdate locations
const suggestions = await mapAPI.suggestPlaydateLocations(['user-1', 'user-2', 'user-3'], {
  category: 'park',
  maxDistance: 10,
});
```

## Privacy & Safety

### Default Behavior

- **Location always approximate** by default (snapped to grid)
- **No exact home addresses** stored or displayed
- **Precise sharing is opt-in** and time-limited
- **User control** over all location features

### GDPR Compliance

- **Data minimization**: Only store what's necessary
- **Retention limits**: Precise locations purged after timeout
- **Export/delete**: Location data included in account data export/deletion
- **Consent**: Clear privacy banners on first use

### Content Moderation

- **User submissions** require approval before going live
- **Report mechanism** for inappropriate or unsafe venues
- **Quality filters**: Duplicate detection, suspicious coordinates
- **Audit trail**: All admin actions logged with who/what/when/why

## Best Practices

### Privacy Grid Size

- **Urban areas**: 500-1000m provides good balance
- **Suburban**: 1000-2000m recommended
- **Rural**: 2000-5000m to avoid identifying specific properties
- **Consider**: Population density and user expectations

### Precise Location Timeout

- **Short meetups**: 30-60 minutes
- **Extended walks**: 90-120 minutes
- **Events**: 120-180 minutes
- **Never**: Keep indefinitely disabled for privacy

### Category Management

- **Start minimal**: 6-8 core categories
- **User feedback**: Add based on demand
- **Consistent naming**: Use plural forms (Parks, Vets)
- **Distinct colors**: Ensure good contrast and differentiation
- **Emoji selection**: Choose universally recognized icons

### Feature Rollout

1. **Phase 1**: Enable Place Discovery only
2. **Phase 2**: Add Playdate Planning when user base grows
3. **Phase 3**: Enable Lost Pet Alerts with community guidelines
4. **Phase 4**: Activate Geofencing for power users

### Performance

- **Max Markers**: Start at 50, increase if needed
- **Clustering**: Always enabled for areas with many venues
- **Distance Labels**: Disable for very dense areas
- **Radius limits**: Prevent excessive server load with reasonable max

## Troubleshooting

### Issue: Users can't see nearby places

- **Check**: Place Discovery feature is enabled
- **Check**: Default Radius is appropriate for area density
- **Check**: Category has approved places in that location
- **Check**: User permissions allow location access

### Issue: Markers too cluttered

- **Solution**: Enable Cluster Markers
- **Solution**: Reduce Max Visible Markers
- **Solution**: Increase default zoom level (frontend)

### Issue: Privacy concerns

- **Solution**: Increase Privacy Grid Size
- **Solution**: Disable Precise Location entirely
- **Solution**: Add prominent privacy notices
- **Solution**: Audit location data retention

### Issue: User submissions low quality

- **Solution**: Enable Require Moderation
- **Solution**: Add submission guidelines
- **Solution**: Implement quality scoring
- **Solution**: Require photos for submissions

## Future Enhancements

### Planned Features

- **Heat maps**: Density visualization for popular areas
- **Custom geofences**: User-defined notification zones
- **Route planning**: Multi-stop walk planning
- **Offline maps**: Cached tiles for areas
- **AR features**: Augmented reality place discovery
- **Social check-ins**: Share visits with matches

### Configuration Additions

- **Operating hours**: Auto-filter closed venues
- **Accessibility**: Wheelchair-friendly, enclosed areas
- **Amenities**: Water fountains, waste bags, parking
- **Size restrictions**: Large dog areas vs. small dog areas
- **Leash requirements**: On-leash vs. off-leash zones

## Support

For questions or issues with map configuration:

1. Check this guide first
2. Review Admin Console tooltips
3. Test changes in staging environment
4. Contact technical support with specific error messages
5. Include configuration export when reporting issues

## Version History

- **v1.0** (Current): Initial map configuration system
  - Custom place categories
  - Privacy grid snapping
  - Precise location timeout
  - Feature toggles
  - User-submitted places
  - Moderation queue
  - Full API exposure
