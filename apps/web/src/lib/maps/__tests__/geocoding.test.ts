import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMapDeepLink, handleAppDeepLink } from '../deep-links';
import type { Location } from '../types';

vi.mock('../provider-config', () => ({
  getGeocodingUrl: () => 'https://api.maptiler.com/geocoding',
  getGeocodingApiKey: () => 'test-key',
}));

describe('Geocoding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates map deep links', () => {
    const location: Location = { lat: 40.7128, lng: -74.006 };
    const links = generateMapDeepLink(location, 'Test Place');

    expect(links.appleMaps).toContain('maps.apple.com');
    expect(links.googleMaps).toContain('google.com/maps');
    expect(links.universal).toContain('geo:');
  });

  it('handles app deep links', () => {
    const link = handleAppDeepLink('app://petspark?type=match&id=123');
    expect(link).toEqual({ type: 'match', id: '123' });
  });

  it('handles app deep links with location', () => {
    const link = handleAppDeepLink('app://petspark?type=place&id=456&lat=40.7128&lng=-74.006');
    expect(link).toEqual({
      type: 'place',
      id: '456',
      location: { lat: 40.7128, lng: -74.006 },
    });
  });
});
