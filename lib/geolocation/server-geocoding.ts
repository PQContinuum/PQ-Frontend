/**
 * Server-side geocoding utilities
 *
 * Use these functions in API routes (Next.js server-side)
 * for reverse geocoding coordinates to addresses.
 */

import type { StructuredAddress } from './address-types';

interface GoogleGeocodingAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodingResult {
  address_components: GoogleGeocodingAddressComponent[];
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
    location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
  };
  place_id: string;
  types: string[];
}

interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
  error_message?: string;
}

/**
 * Extract component by type from address_components
 */
function extractComponent(
  components: GoogleGeocodingAddressComponent[],
  type: string,
  format: 'long' | 'short' = 'long'
): string | null {
  const component = components.find((c) => c.types.includes(type));
  if (!component) return null;
  return format === 'long' ? component.long_name : component.short_name;
}

/**
 * Assess quality based on location_type
 */
function assessQualityFromLocationType(
  locationType: string
): StructuredAddress['quality'] {
  switch (locationType) {
    case 'ROOFTOP':
      return 'excellent';
    case 'RANGE_INTERPOLATED':
      return 'good';
    case 'GEOMETRIC_CENTER':
      return 'fair';
    default:
      return 'poor';
  }
}

/**
 * Server-side reverse geocoding
 *
 * Converts lat/lng to structured address using Google Geocoding API
 *
 * @param lat Latitude
 * @param lng Longitude
 * @param apiKey Google Maps API Key (from process.env.GOOGLE_MAPS_API_KEY)
 * @returns StructuredAddress or null on error
 */
export async function reverseGeocodeServer(
  lat: number,
  lng: number,
  apiKey: string
): Promise<StructuredAddress | null> {
  try {
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('[Server Geocoding] Invalid coordinates:', { lat, lng });
      return null;
    }

    // Build request URL
    const resultTypes = [
      'street_address',
      'premise',
      'subpremise',
      'neighborhood',
      'sublocality',
    ].join('|');

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat.toFixed(7)},${lng.toFixed(7)}`);
    url.searchParams.set('result_type', resultTypes);
    url.searchParams.set('key', apiKey);

    console.log('[Server Geocoding] Requesting:', url.toString().replace(apiKey, 'API_KEY'));

    // Make request
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('[Server Geocoding] HTTP error:', response.status, response.statusText);
      return null;
    }

    const data: GoogleGeocodingResponse = await response.json();

    if (data.status !== 'OK') {
      console.error('[Server Geocoding] API error:', data.status, data.error_message);
      return null;
    }

    if (!data.results || data.results.length === 0) {
      console.warn('[Server Geocoding] No results found');
      return null;
    }

    // Parse first (most precise) result
    const result = data.results[0];
    const components = result.address_components;

    // Extract all components
    const streetNumber = extractComponent(components, 'street_number');
    const route = extractComponent(components, 'route');
    const neighborhood = extractComponent(components, 'neighborhood');
    const sublocalityL1 = extractComponent(components, 'sublocality_level_1');
    const sublocalityL2 = extractComponent(components, 'sublocality_level_2');
    const locality = extractComponent(components, 'locality');
    const adminAreaL1 = extractComponent(components, 'administrative_area_level_1');
    const adminAreaL2 = extractComponent(components, 'administrative_area_level_2');
    const country = extractComponent(components, 'country');
    const countryCode = extractComponent(components, 'country', 'short');
    const postalCode = extractComponent(components, 'postal_code');

    // Build formatted addresses
    const streetParts = [route, streetNumber].filter(Boolean);
    const shortAddress = streetParts.length > 0 ? streetParts.join(' ') : 'Sin dirección exacta';

    const formattedParts = [
      streetParts.length > 0 ? streetParts.join(' ') : null,
      neighborhood || sublocalityL2,
      sublocalityL1,
      locality,
      adminAreaL1,
      country,
    ].filter(Boolean);

    const formattedAddress = formattedParts.length > 0
      ? formattedParts.join(', ')
      : result.formatted_address;

    // Assess quality
    const quality = assessQualityFromLocationType(result.geometry.location_type);

    // Generate warnings
    const warnings: string[] = [];
    if (!streetNumber && route) {
      warnings.push('Número de calle no disponible');
    }
    if (!postalCode) {
      warnings.push('Código postal no disponible');
    }
    if (!neighborhood) {
      warnings.push('Colonia/barrio no disponible');
    }

    const address: StructuredAddress = {
      // Street
      street: route,
      streetNumber: streetNumber,

      // Locality
      neighborhood: neighborhood,
      city: locality,
      state: adminAreaL1,
      country: country,
      countryCode: countryCode,

      // Postal & IDs
      postalCode: postalCode,
      placeId: result.place_id,

      // Formatted
      formattedAddress: formattedAddress,
      shortAddress: shortAddress,

      // Coordinates
      lat: parseFloat(lat.toFixed(7)),
      lng: parseFloat(lng.toFixed(7)),

      // Quality (server-side doesn't have GPS accuracy)
      accuracy: 0,
      quality: quality,
      timestamp: Date.now(),

      // Additional context
      sublocalityLevel1: sublocalityL1,
      sublocalityLevel2: sublocalityL2,
      administrativeAreaLevel2: adminAreaL2,
      locationType: result.geometry.location_type,

      // Warnings
      warnings: warnings,
      note: warnings.length > 0 ? `${warnings.length} advertencia(s)` : null,
    };

    console.log('[Server Geocoding] Success:', formattedAddress);

    return address;
  } catch (error) {
    console.error('[Server Geocoding] Error:', error);
    return null;
  }
}

/**
 * Get short area name for display (e.g., "Del Valle, CDMX")
 *
 * This is a simplified version for when you only need a display name
 */
export async function getAreaNameServer(
  lat: number,
  lng: number,
  apiKey: string
): Promise<string> {
  try {
    const address = await reverseGeocodeServer(lat, lng, apiKey);

    if (!address) {
      return 'ubicación desconocida';
    }

    // Build short name: "Neighborhood, City" or "City, State"
    const parts = [
      address.neighborhood || address.sublocalityLevel2,
      address.city,
      address.state,
    ].filter(Boolean);

    return parts.length > 0 ? parts.slice(0, 2).join(', ') : 'ubicación desconocida';
  } catch (error) {
    console.error('[getAreaNameServer] Error:', error);
    return 'ubicación desconocida';
  }
}
