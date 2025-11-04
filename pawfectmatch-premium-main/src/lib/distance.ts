export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationWithDistance {
  location: string
  coordinates?: Coordinates
  distance?: number
}

export function parseLocation(location: string): Coordinates | null {
  const patterns = [
    /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
    /^lat:\s*(-?\d+\.?\d*),?\s*lng:\s*(-?\d+\.?\d*)$/i,
    /^lat:\s*(-?\d+\.?\d*),?\s*lon:\s*(-?\d+\.?\d*)$/i,
  ]

  for (const pattern of patterns) {
    const match = location.match(pattern)
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1])
      const lon = parseFloat(match[2])
      if (isValidCoordinate(lat, lon)) {
        return { latitude: lat, longitude: lon }
      }
    }
  }

  const cityCoordinates = getCityCoordinates(location)
  if (cityCoordinates) {
    return cityCoordinates
  }

  return null
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

export function calculateDistance(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 3959
  const dLat = toRad(coords2.latitude - coords1.latitude)
  const dLon = toRad(coords2.longitude - coords1.longitude)
  const lat1 = toRad(coords1.latitude)
  const lat2 = toRad(coords2.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function getDistanceBetweenLocations(
  location1: string,
  location2: string
): number | null {
  const coords1 = parseLocation(location1)
  const coords2 = parseLocation(location2)

  if (!coords1 || !coords2) {
    return null
  }

  return calculateDistance(coords1, coords2)
}

export function formatDistance(miles: number): string {
  if (miles < 1) {
    return 'Less than 1 mile away'
  } else if (miles === 1) {
    return '1 mile away'
  } else if (miles < 10) {
    return `${miles.toFixed(1)} miles away`
  } else {
    return `${Math.round(miles)} miles away`
  }
}

export function getCityCoordinates(cityName: string): Coordinates | null {
  const normalizedCity = cityName.toLowerCase().trim()

  const cityDatabase: Record<string, Coordinates> = {
    'new york': { latitude: 40.7128, longitude: -74.006 },
    'new york, ny': { latitude: 40.7128, longitude: -74.006 },
    'los angeles': { latitude: 34.0522, longitude: -118.2437 },
    'los angeles, ca': { latitude: 34.0522, longitude: -118.2437 },
    'chicago': { latitude: 41.8781, longitude: -87.6298 },
    'chicago, il': { latitude: 41.8781, longitude: -87.6298 },
    'houston': { latitude: 29.7604, longitude: -95.3698 },
    'houston, tx': { latitude: 29.7604, longitude: -95.3698 },
    'phoenix': { latitude: 33.4484, longitude: -112.074 },
    'phoenix, az': { latitude: 33.4484, longitude: -112.074 },
    'philadelphia': { latitude: 39.9526, longitude: -75.1652 },
    'philadelphia, pa': { latitude: 39.9526, longitude: -75.1652 },
    'san antonio': { latitude: 29.4241, longitude: -98.4936 },
    'san antonio, tx': { latitude: 29.4241, longitude: -98.4936 },
    'san diego': { latitude: 32.7157, longitude: -117.1611 },
    'san diego, ca': { latitude: 32.7157, longitude: -117.1611 },
    'dallas': { latitude: 32.7767, longitude: -96.797 },
    'dallas, tx': { latitude: 32.7767, longitude: -96.797 },
    'san jose': { latitude: 37.3382, longitude: -121.8863 },
    'san jose, ca': { latitude: 37.3382, longitude: -121.8863 },
    'austin': { latitude: 30.2672, longitude: -97.7431 },
    'austin, tx': { latitude: 30.2672, longitude: -97.7431 },
    'jacksonville': { latitude: 30.3322, longitude: -81.6557 },
    'jacksonville, fl': { latitude: 30.3322, longitude: -81.6557 },
    'fort worth': { latitude: 32.7555, longitude: -97.3308 },
    'fort worth, tx': { latitude: 32.7555, longitude: -97.3308 },
    'columbus': { latitude: 39.9612, longitude: -82.9988 },
    'columbus, oh': { latitude: 39.9612, longitude: -82.9988 },
    'charlotte': { latitude: 35.2271, longitude: -80.8431 },
    'charlotte, nc': { latitude: 35.2271, longitude: -80.8431 },
    'san francisco': { latitude: 37.7749, longitude: -122.4194 },
    'san francisco, ca': { latitude: 37.7749, longitude: -122.4194 },
    'indianapolis': { latitude: 39.7684, longitude: -86.1581 },
    'indianapolis, in': { latitude: 39.7684, longitude: -86.1581 },
    'seattle': { latitude: 47.6062, longitude: -122.3321 },
    'seattle, wa': { latitude: 47.6062, longitude: -122.3321 },
    'denver': { latitude: 39.7392, longitude: -104.9903 },
    'denver, co': { latitude: 39.7392, longitude: -104.9903 },
    'washington': { latitude: 38.9072, longitude: -77.0369 },
    'washington, dc': { latitude: 38.9072, longitude: -77.0369 },
    'boston': { latitude: 42.3601, longitude: -71.0589 },
    'boston, ma': { latitude: 42.3601, longitude: -71.0589 },
    'nashville': { latitude: 36.1627, longitude: -86.7816 },
    'nashville, tn': { latitude: 36.1627, longitude: -86.7816 },
    'el paso': { latitude: 31.7619, longitude: -106.485 },
    'el paso, tx': { latitude: 31.7619, longitude: -106.485 },
    'detroit': { latitude: 42.3314, longitude: -83.0458 },
    'detroit, mi': { latitude: 42.3314, longitude: -83.0458 },
    'portland': { latitude: 45.5152, longitude: -122.6784 },
    'portland, or': { latitude: 45.5152, longitude: -122.6784 },
    'las vegas': { latitude: 36.1699, longitude: -115.1398 },
    'las vegas, nv': { latitude: 36.1699, longitude: -115.1398 },
    'memphis': { latitude: 35.1495, longitude: -90.049 },
    'memphis, tn': { latitude: 35.1495, longitude: -90.049 },
    'louisville': { latitude: 38.2527, longitude: -85.7585 },
    'louisville, ky': { latitude: 38.2527, longitude: -85.7585 },
    'baltimore': { latitude: 39.2904, longitude: -76.6122 },
    'baltimore, md': { latitude: 39.2904, longitude: -76.6122 },
    'milwaukee': { latitude: 43.0389, longitude: -87.9065 },
    'milwaukee, wi': { latitude: 43.0389, longitude: -87.9065 },
    'albuquerque': { latitude: 35.0844, longitude: -106.6504 },
    'albuquerque, nm': { latitude: 35.0844, longitude: -106.6504 },
    'tucson': { latitude: 32.2226, longitude: -110.9747 },
    'tucson, az': { latitude: 32.2226, longitude: -110.9747 },
    'fresno': { latitude: 36.7378, longitude: -119.7871 },
    'fresno, ca': { latitude: 36.7378, longitude: -119.7871 },
    'sacramento': { latitude: 38.5816, longitude: -121.4944 },
    'sacramento, ca': { latitude: 38.5816, longitude: -121.4944 },
    'mesa': { latitude: 33.4152, longitude: -111.8315 },
    'mesa, az': { latitude: 33.4152, longitude: -111.8315 },
    'kansas city': { latitude: 39.0997, longitude: -94.5786 },
    'kansas city, mo': { latitude: 39.0997, longitude: -94.5786 },
    'atlanta': { latitude: 33.749, longitude: -84.388 },
    'atlanta, ga': { latitude: 33.749, longitude: -84.388 },
    'miami': { latitude: 25.7617, longitude: -80.1918 },
    'miami, fl': { latitude: 25.7617, longitude: -80.1918 },
    'raleigh': { latitude: 35.7796, longitude: -78.6382 },
    'raleigh, nc': { latitude: 35.7796, longitude: -78.6382 },
    'omaha': { latitude: 41.2565, longitude: -95.9345 },
    'omaha, ne': { latitude: 41.2565, longitude: -95.9345 },
    'cleveland': { latitude: 41.4993, longitude: -81.6944 },
    'cleveland, oh': { latitude: 41.4993, longitude: -81.6944 },
    'tulsa': { latitude: 36.154, longitude: -95.9928 },
    'tulsa, ok': { latitude: 36.154, longitude: -95.9928 },
    'minneapolis': { latitude: 44.9778, longitude: -93.265 },
    'minneapolis, mn': { latitude: 44.9778, longitude: -93.265 },
  }

  return cityDatabase[normalizedCity] || null
}

export async function getCurrentUserLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        resolve(null)
      },
      {
        timeout: 5000,
        maximumAge: 300000,
      }
    )
  })
}

export function getDistanceFilterLabel(maxDistance: number): string {
  if (maxDistance >= 100) {
    return 'Anywhere'
  }
  return `Within ${maxDistance} miles`
}
