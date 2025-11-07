export interface Location {
  lat: number;
  lng: number;
}

export interface MapConfig {
  MAP_STYLE_URL: string;
  TILES_SOURCE: string;
  GEOCODER_ENDPOINT: string;
  PLACES_ENDPOINT: string;
  ROUTING_ENDPOINT: string;
  PRIVACY_GRID_METERS: number;
  DEFAULT_RADIUS_KM: number;
  UNITS: 'metric' | 'imperial';
  COUNTRY_BIAS: string;
}

export interface PlaceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Place {
  id: string;
  name: string;
  description?: string;
  category: string;
  location: Location;
  address: string;
  phone?: string;
  website?: string;
  hours?: string;
  photos: string[];
  verified: boolean;
  petFriendly: boolean;
  rating: number;
  reviewCount: number;
  amenities: string[];
  distance?: number;
  isOpen?: boolean;
  createdBy?: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface LostPetAlert {
  id: string;
  petId: string;
  petName: string;
  petPhoto: string;
  breed: string;
  lastSeen: Location;
  lastSeenTime: Date;
  description: string;
  contactInfo: string;
  radius: number;
  status: 'active' | 'found' | 'expired';
  sightings: Sighting[];
  createdBy: string;
  createdAt: Date;
}

export interface Sighting {
  id: string;
  location: Location;
  time: Date;
  description: string;
  photo?: string;
  reportedBy: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userPhoto: string;
  location: Location;
  gridLocation: Location;
  preciseSharingUntil?: Date;
  lastUpdated: Date;
  status: 'online' | 'away' | 'offline';
}

export interface PlaydateRequest {
  id: string;
  participants: string[];
  suggestedLocation?: Location;
  suggestedPlaces: Place[];
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  scheduledFor?: Date;
  createdAt: Date;
}

export interface MapMarker {
  id: string;
  type: 'place' | 'pet' | 'user' | 'alert' | 'sighting';
  location: Location;
  data: Place | LostPetAlert | UserPresence | Sighting;
}

export interface SearchResult {
  id: string;
  type: 'place' | 'address' | 'category';
  name: string;
  description?: string;
  location: Location;
  distance?: number;
}

export interface GeofenceConfig {
  id: string;
  location: Location;
  radius: number;
  type: 'playdate' | 'lost_pet' | 'saved_place';
  enabled: boolean;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}
