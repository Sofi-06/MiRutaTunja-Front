import { getBackendUrl } from '@/services/backendUrl';

export interface PlaceResult {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

const localPlaces: Record<string, { lat: number; lng: number; name: string }> = {
  uptc: { lat: 5.5562, lng: -73.3516, name: 'Universidad UPTC' },
  'universidad uptc': { lat: 5.5562, lng: -73.3516, name: 'Universidad UPTC' },
  terminal: { lat: 5.530809, lng: -73.34496, name: 'Terminal de Transportes' },
  'terminal de transportes': { lat: 5.530809, lng: -73.34496, name: 'Terminal de Transportes' },
  'plaza de bolivar': { lat: 5.5324627, lng: -73.3615504, name: 'Plaza de Bolívar' },
  'plaza de bolívar': { lat: 5.5324627, lng: -73.3615504, name: 'Plaza de Bolívar' },
  uniboyaca: { lat: 5.5682, lng: -73.332, name: 'Universidad de Boyacá' },
  'universidad de boyaca': { lat: 5.5682, lng: -73.332, name: 'Universidad de Boyacá' },
  'universidad de boyacá': { lat: 5.5682, lng: -73.332, name: 'Universidad de Boyacá' },
  'hospital san rafael': { lat: 5.5269, lng: -73.3578, name: 'Hospital San Rafael' },
  muiscas: { lat: 5.5724, lng: -73.3396, name: 'Barrio Los Muiscas' },
  'los muiscas': { lat: 5.5724, lng: -73.3396, name: 'Barrio Los Muiscas' },
  arboleda: { lat: 5.575069, lng: -73.331541, name: 'Despacho Arboleda' },
  centro: { lat: 5.5332, lng: -73.362, name: 'Centro Histórico' },
  viva: { lat: 5.5492, lng: -73.349, name: 'C.C. Viva Tunja' },
  'viva tunja': { lat: 5.5492, lng: -73.349, name: 'C.C. Viva Tunja' },
};

/**
 * Formats coordinates into a lightweight synthetic Colombian address,
 * used only when the backend geocoding proxy is unreachable.
 */
function fallbackColombianAddress(lat: number, lng: number): string {
  const cra = Math.max(1, Math.round(10 + (-73.36155 - lng) * 482));
  const cl = Math.max(1, Math.round(19 + (lat - 5.53246) * 840));
  const house = Math.round(Math.abs(lat * 100000) % 80) + 10;
  return `Cra. ${cra} # ${cl}-${house}`;
}

/**
 * Searches for places matching the query.
 * 1. Checks local predefined places first (instant, no network).
 * 2. Falls back to the backend's /places/search proxy (Nominatim / Google Places),
 *    which keeps third-party API keys server-side.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cleanQuery = trimmed.toLowerCase();

  const localMatches: PlaceResult[] = [];
  for (const [key, place] of Object.entries(localPlaces)) {
    if (key.includes(cleanQuery) || place.name.toLowerCase().includes(cleanQuery)) {
      if (!localMatches.some((m) => m.name === place.name)) {
        localMatches.push({
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          address: 'Ubicación local',
        });
      }
    }
  }

  if (localMatches.length > 0) {
    return localMatches.slice(0, 5);
  }

  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/places/search?q=${encodeURIComponent(trimmed)}`);
    if (response.ok) {
      return await response.json();
    }
    console.error(`placesService: backend search error: status ${response.status}`);
  } catch (error) {
    console.error('placesService: backend search request error:', error);
  }

  return [];
}

/**
 * Resolves a text query to a single best match place result, or null.
 */
export async function geocodeLocation(query: string): Promise<PlaceResult | null> {
  const results = await searchPlaces(query);
  return results.length > 0 ? results[0] : null;
}

/**
 * Resolves latitude and longitude coordinates to a human-readable address
 * via the backend's /places/reverse proxy (Mapbox / Nominatim).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/places/reverse?lat=${lat}&lng=${lng}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.address) return data.address;
    } else {
      console.error(`placesService: backend reverse geocode error: status ${response.status}`);
    }
  } catch (error) {
    console.error('placesService: backend reverse geocode request error:', error);
  }

  return fallbackColombianAddress(lat, lng);
}
