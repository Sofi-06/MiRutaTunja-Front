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
 * Searches for places matching the query.
 * 1. Checks local predefined places first.
 * 2. Checks Nominatim (OSM Search API) second.
 * 3. Falls back to Google Places API (New Text Search) third, requesting only basic fields.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cleanQuery = trimmed.toLowerCase();

  // 1. Check local predefined places
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
    console.log(`placesService: Found ${localMatches.length} local match(es) for "${trimmed}"`);
    return localMatches.slice(0, 5);
  }

  // 2. Try Nominatim (OpenStreetMap)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(`${trimmed}, Tunja, Boyacá, Colombia`)}`;
    console.log(`placesService: Searching Nominatim for "${trimmed}"...`);
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'MiRutaTunjaApp/1.0',
      },
    });

    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        console.log(`placesService: Nominatim returned ${results.length} result(s)`);
        return results.map((item: any) => ({
          name: item.display_name.split(',')[0],
          address: item.display_name.split(',').slice(1).join(',').trim(),
          lat: Number.parseFloat(item.lat),
          lng: Number.parseFloat(item.lon),
        }));
      }
    }
  } catch (error) {
    console.error('placesService: Nominatim request error:', error);
  }

  // 3. Fallback to Google Places API (New Text Search)
  try {
    const apiKey = process.env.EXPO_PUBLIC_API_KEY_PLACES || process.env.API_KEY_PLACES;
    if (!apiKey) {
      console.warn('placesService: Google Places API key is not configured in environment variables');
      return [];
    }

    console.log(`placesService: Nominatim failed/empty. Falling back to Google Places API for "${trimmed}"...`);
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Crucial: Only request displayName, formattedAddress, and location to minimize API costs
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        textQuery: `${trimmed}, Tunja, Boyacá, Colombia`,
        languageCode: 'es',
        maxResultCount: 5,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.places && data.places.length > 0) {
        console.log(`placesService: Google Places returned ${data.places.length} result(s)`);
        return data.places.map((place: any) => ({
          name: place.displayName?.text || 'Ubicación encontrada',
          address: place.formattedAddress,
          lat: place.location.latitude,
          lng: place.location.longitude,
        }));
      }
    } else {
      const errorText = await response.text();
      console.error(`placesService: Google Places API error: status ${response.status}`, errorText);
    }
  } catch (error) {
    console.error('placesService: Google Places API request error:', error);
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
