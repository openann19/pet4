import type {
  Place,
  LostPetAlert,
  PlaceCategory,
  SearchResult,
  Location,
  PlaydateRequest,
} from './types';

export interface MapConfigAPI {
  privacyGridMeters: number;
  defaultRadiusKm: number;
  maxRadiusKm: number;
  units: 'metric' | 'imperial';
  countryBias: string;
  enablePreciseLocation: boolean;
  preciseLocationTimeoutMinutes: number;
  enableGeofencing: boolean;
  enableLostPetAlerts: boolean;
  enablePlaydatePlanning: boolean;
  enablePlaceDiscovery: boolean;
  categories: PlaceCategory[];
}

export const mapAPI = {
  async getConfig(): Promise<MapConfigAPI> {
    const response = await fetch('/api/map/config');
    return response.json();
  },

  async updateConfig(config: Partial<MapConfigAPI>): Promise<MapConfigAPI> {
    const response = await fetch('/api/map/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return response.json();
  },

  async searchPlaces(query: string, location?: Location, radius?: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (location) {
      params.append('lat', location.lat.toString());
      params.append('lng', location.lng.toString());
    }
    if (radius) params.append('radius', radius.toString());

    const response = await fetch(`/api/map/search?${params}`);
    return response.json();
  },

  async getPlaces(filters: {
    category?: string;
    location?: Location;
    radius?: number;
    verified?: boolean;
  }): Promise<Place[]> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.location) {
      params.append('lat', filters.location.lat.toString());
      params.append('lng', filters.location.lng.toString());
    }
    if (filters.radius) params.append('radius', filters.radius.toString());
    if (filters.verified !== undefined) params.append('verified', String(filters.verified));

    const response = await fetch(`/api/map/places?${params}`);
    return response.json();
  },

  async getPlace(id: string): Promise<Place> {
    const response = await fetch(`/api/map/places/${id}`);
    return response.json();
  },

  async createPlace(place: Omit<Place, 'id' | 'moderationStatus'>): Promise<Place> {
    const response = await fetch('/api/map/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(place),
    });
    return response.json();
  },

  async updatePlace(id: string, updates: Partial<Place>): Promise<Place> {
    const response = await fetch(`/api/map/places/${String(id ?? '')}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async deletePlace(id: string): Promise<void> {
    await fetch(`/api/map/places/${id}`, { method: 'DELETE' });
  },

  async moderatePlace(
    id: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<Place> {
    const response = await fetch(`/api/map/places/${id}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    return response.json();
  },

  async getLostPetAlerts(location?: Location, radius?: number): Promise<LostPetAlert[]> {
    const params = new URLSearchParams();
    if (location) {
      params.append('lat', location.lat.toString());
      params.append('lng', location.lng.toString());
    }
    if (radius) params.append('radius', radius.toString());

    const response = await fetch(`/api/map/lost-pets?${params}`);
    return response.json();
  },

  async createLostPetAlert(
    alert: Omit<LostPetAlert, 'id' | 'sightings' | 'createdAt'>
  ): Promise<LostPetAlert> {
    const response = await fetch('/api/map/lost-pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    return response.json();
  },

  async updateLostPetAlert(id: string, updates: Partial<LostPetAlert>): Promise<LostPetAlert> {
    const response = await fetch(`/api/map/lost-pets/${String(id ?? '')}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async reportSighting(
    alertId: string,
    sighting: {
      location: Location;
      description: string;
      photo?: string;
    }
  ): Promise<LostPetAlert> {
    const response = await fetch(`/api/map/lost-pets/${alertId}/sightings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sighting),
    });
    return response.json();
  },

  async suggestPlaydateLocations(
    participants: string[],
    preferences?: {
      category?: string;
      maxDistance?: number;
    }
  ): Promise<Place[]> {
    const response = await fetch('/api/map/playdate/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participants, preferences }),
    });
    return response.json();
  },

  async createPlaydateRequest(
    request: Omit<PlaydateRequest, 'id' | 'createdAt'>
  ): Promise<PlaydateRequest> {
    const response = await fetch('/api/map/playdate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async geocode(address: string): Promise<Location> {
    const params = new URLSearchParams({ address });
    const response = await fetch(`/api/geocode?${params}`);
    return response.json();
  },

  async reverseGeocode(location: Location): Promise<string> {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
    });
    const response = await fetch(`/api/geocode/reverse?${params}`);
    const data = await response.json();
    return data.address;
  },

  async snapToGrid(location: Location, gridSize: number): Promise<Location> {
    const latGrid = Math.floor(location.lat / gridSize) * gridSize + gridSize / 2;
    const lngGrid = Math.floor(location.lng / gridSize) * gridSize + gridSize / 2;
    return { lat: latGrid, lng: lngGrid };
  },

  async getCategories(): Promise<PlaceCategory[]> {
    const response = await fetch('/api/map/categories');
    return response.json();
  },

  async createCategory(category: Omit<PlaceCategory, 'id'>): Promise<PlaceCategory> {
    const response = await fetch('/api/map/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return response.json();
  },

  async updateCategory(id: string, updates: Partial<PlaceCategory>): Promise<PlaceCategory> {
    const response = await fetch(`/api/map/categories/${String(id ?? '')}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async deleteCategory(id: string): Promise<void> {
    await fetch(`/api/map/categories/${id}`, { method: 'DELETE' });
  },
};
