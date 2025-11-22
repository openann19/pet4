import type { Location } from './types';
import { isTruthy } from '@petspark/shared';

export interface DeepLinkParams {
  type: 'match' | 'chat' | 'place' | 'lost-found';
  id: string;
  location?: Location;
}

export function generateAppDeepLink(params: DeepLinkParams): string {
  const baseUrl = 'app://petspark';
  const queryParams = new URLSearchParams({
    type: params.type,
    id: params.id,
    ...(params.location && {
      lat: params.location.lat.toString(),
      lng: params.location.lng.toString(),
    }),
  });

  return `${String(baseUrl ?? '')}?${String(queryParams.toString() ?? '')}`;
}

export function generateMapDeepLink(
  location: Location,
  label?: string
): {
  appleMaps: string;
  googleMaps: string;
  universal: string;
} {
  const { lat, lng } = location;
  const labelParam = label ? encodeURIComponent(label) : '';

  return {
    appleMaps: `maps://maps.apple.com/?daddr=${String(lat ?? '')},${String(lng ?? '')}&dirflg=d`,
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${String(lat ?? '')},${String(lng ?? '')}${String(labelParam ? `&destination_place_id=${String(labelParam)}` : '')}`,
    universal: `geo:${String(lat ?? '')},${String(lng ?? '')}${String(labelParam ? `?q=${String(labelParam)}` : '')}`,
  };
}

export function openInMaps(location: Location, label?: string): void {
  const links = generateMapDeepLink(location, label);

  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = userAgent.includes('android');

  if (isTruthy(isIOS)) {
    const link = document.createElement('a');
    link.href = links.appleMaps;
    link.click();

    setTimeout(() => {
      const universalLink = document.createElement('a');
      universalLink.href = links.googleMaps;
      universalLink.target = '_blank';
      universalLink.click();
    }, 1000);
  } else if (isTruthy(isAndroid)) {
    const link = document.createElement('a');
    link.href = links.googleMaps;
    link.target = '_blank';
    link.click();
  } else {
    window.open(links.googleMaps, '_blank');
  }
}

export function handleAppDeepLink(url: string): DeepLinkParams | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'app:' && !urlObj.hostname.includes('petspark')) {
      return null;
    }

    const type = urlObj.searchParams.get('type');
    const id = urlObj.searchParams.get('id');
    const lat = urlObj.searchParams.get('lat');
    const lng = urlObj.searchParams.get('lng');

    if (!type || !id) {
      return null;
    }

    const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    return {
      type: type as DeepLinkParams['type'],
      id,
      ...(location ? { location } : {}),
    };
  } catch {
    return null;
  }
}
