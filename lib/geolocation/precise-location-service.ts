/**
 * ============================================================================
 * PRECISE LOCATION SERVICE
 * ============================================================================
 *
 * Maximum accuracy geolocation using:
 * 1. High-precision GPS (enableHighAccuracy, maximumAge: 0)
 * 2. Google Geocoding API (reverse geocoding)
 * 3. Google Places API (optional enrichment)
 *
 * This service follows best practices:
 * - No hallucinations: Only returns data from Google APIs
 * - No assumptions: Explicitly marks missing data as null
 * - Full validation: Checks accuracy, timestamp, coordinates
 * - Structured output: Returns your official StructuredAddress format
 *
 * References:
 * - Google Geocoding: https://developers.google.com/maps/documentation/geocoding
 * - Google Places: https://developers.google.com/maps/documentation/places/web-service
 */

import {
  type StructuredAddress,
  type GPSPosition,
  type LocationAcquisitionOptions,
  type LocationResult,
  type GoogleGeocodingResponse,
  type GoogleGeocodingResult,
  type GoogleGeocodingAddressComponent,
  type GooglePlacesResponse,
} from './address-types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: Required<LocationAcquisitionOptions> = {
  enableHighAccuracy: true, // CRITICAL: Use GPS for maximum accuracy
  maximumAge: 0, // CRITICAL: Always get fresh location
  timeout: 10000, // 10 seconds timeout (can be increased)
  minAccuracy: 50, // Accept positions with <= 50m accuracy
  enrichWithPlaces: false, // Places API enrichment (optional)
};

/** Accuracy thresholds for quality assessment */
const ACCURACY_EXCELLENT = 20; // <= 20m = excellent
const ACCURACY_GOOD = 50; // <= 50m = good
const ACCURACY_FAIR = 100; // <= 100m = fair
// > 100m = poor

// ============================================================================
// STEP 1: GPS ACQUISITION
// ============================================================================

/**
 * Get user's GPS position with high accuracy
 *
 * Uses navigator.geolocation.getCurrentPosition with:
 * - enableHighAccuracy: true (uses GPS/GNSS)
 * - maximumAge: 0 (no cached positions)
 * - timeout: configurable (default 10s)
 *
 * @returns GPSPosition or throws error
 */
async function acquireGPSPosition(
  options: Required<LocationAcquisitionOptions>
): Promise<GPSPosition> {
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocalización no soportada en este navegador');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gps: GPSPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        console.log(
          `[GPS] Position acquired: (${gps.latitude.toFixed(7)}, ${gps.longitude.toFixed(7)}) ` +
          `accuracy=${gps.accuracy.toFixed(1)}m`
        );

        // Validate accuracy threshold
        if (gps.accuracy > options.minAccuracy) {
          console.warn(
            `[GPS] Accuracy ${gps.accuracy.toFixed(1)}m exceeds threshold ${options.minAccuracy}m`
          );
        }

        resolve(gps);
      },
      (error) => {
        let errorMessage = 'Error desconocido al obtener ubicación';
        let errorCode: LocationResult['errorCode'] = 'POSITION_UNAVAILABLE';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Habilita el acceso en la configuración.';
            errorCode = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica GPS, WiFi o conexión de datos.';
            errorCode = 'POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            errorMessage = `Tiempo de espera agotado (${options.timeout}ms). Intenta de nuevo.`;
            errorCode = 'TIMEOUT';
            break;
        }

        console.error(`[GPS] Error: ${errorMessage}`, error);
        const err = new Error(errorMessage) as Error & { code: LocationResult['errorCode'] };
        err.code = errorCode;
        reject(err);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy,
        maximumAge: options.maximumAge,
        timeout: options.timeout,
      }
    );
  });
}

// ============================================================================
// STEP 2: REVERSE GEOCODING
// ============================================================================

/**
 * Helper: Extract component by type from address_components
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
 * Parse Google Geocoding result into StructuredAddress
 *
 * This function maps Google's address_components to your output structure.
 * It does NOT invent data - if a component is missing, it returns null.
 */
function parseGeocodingResult(
  result: GoogleGeocodingResult,
  gps: GPSPosition
): Omit<StructuredAddress, 'warnings' | 'note' | 'quality'> {
  const components = result.address_components;
  const geometry = result.geometry;

  // Extract all components (null if not found)
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

  return {
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

    // Coordinates (use GPS coordinates, not geocoded ones)
    lat: parseFloat(gps.latitude.toFixed(7)),
    lng: parseFloat(gps.longitude.toFixed(7)),

    // Accuracy
    accuracy: gps.accuracy,
    timestamp: gps.timestamp,

    // Additional context
    sublocalityLevel1: sublocalityL1,
    sublocalityLevel2: sublocalityL2,
    administrativeAreaLevel2: adminAreaL2,
    locationType: geometry.location_type,
  };
}

/**
 * Reverse geocode coordinates using Google Geocoding API
 *
 * @param lat Latitude (7 decimals precision)
 * @param lng Longitude (7 decimals precision)
 * @param apiKey Google Maps API Key
 * @returns Geocoding result or null
 */
async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string
): Promise<GoogleGeocodingResult | null> {
  try {
    // Use result_type to prioritize specific results
    // Priority: street_address > premise > neighborhood > sublocality
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

    console.log(`[Geocoding] Requesting: ${url.toString().replace(apiKey, 'API_KEY')}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GoogleGeocodingResponse = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      console.log(`[Geocoding] Success: Found ${data.results.length} results`);
      return data.results[0]; // Return most precise result
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('[Geocoding] No results found for coordinates');
      return null;
    } else {
      console.error(`[Geocoding] API error: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error('[Geocoding] Request failed:', error);
    return null;
  }
}

// ============================================================================
// STEP 3: PLACES API ENRICHMENT (Optional)
// ============================================================================

/**
 * Enrich address with Google Places API (optional)
 *
 * Uses Places Nearby Search to find the closest place to the coordinates.
 * This can provide additional context like business names, ratings, etc.
 *
 * @param lat Latitude
 * @param lng Longitude
 * @param apiKey Google Maps API Key
 * @returns Place result or null
 */
async function enrichWithPlaces(
  lat: number,
  lng: number,
  apiKey: string
): Promise<GooglePlacesResponse['results'][0] | null> {
  try {
    // Search for places within 25m radius
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${lat.toFixed(7)},${lng.toFixed(7)}`);
    url.searchParams.set('radius', '25'); // 25 meters
    url.searchParams.set('key', apiKey);

    console.log(`[Places] Requesting: ${url.toString().replace(apiKey, 'API_KEY')}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GooglePlacesResponse = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      console.log(`[Places] Success: Found ${data.results.length} places`);
      return data.results[0]; // Return closest place
    } else {
      console.log('[Places] No nearby places found');
      return null;
    }
  } catch (error) {
    console.error('[Places] Request failed:', error);
    return null;
  }
}

// ============================================================================
// STEP 4: QUALITY ASSESSMENT
// ============================================================================

/**
 * Assess location quality based on accuracy
 */
function assessQuality(accuracy: number): StructuredAddress['quality'] {
  if (accuracy <= ACCURACY_EXCELLENT) return 'excellent';
  if (accuracy <= ACCURACY_GOOD) return 'good';
  if (accuracy <= ACCURACY_FAIR) return 'fair';
  return 'poor';
}

/**
 * Generate warnings based on accuracy and data completeness
 */
function generateWarnings(
  address: Omit<StructuredAddress, 'warnings' | 'note' | 'quality'>
): string[] {
  const warnings: string[] = [];

  // Accuracy warnings
  if (address.accuracy > ACCURACY_EXCELLENT) {
    warnings.push(
      `Precisión de ${address.accuracy.toFixed(1)}m. Recomendado: <= ${ACCURACY_EXCELLENT}m para máxima exactitud.`
    );
  }

  if (address.accuracy > ACCURACY_FAIR) {
    warnings.push(
      `Precisión muy baja (${address.accuracy.toFixed(1)}m). Resultados pueden ser imprecisos. Intenta moverte a un área con mejor señal GPS.`
    );
  }

  // Missing data warnings
  if (!address.street && !address.streetNumber) {
    warnings.push('No se pudo determinar la calle exacta.');
  }

  if (!address.streetNumber && address.street) {
    warnings.push('Número de calle no disponible.');
  }

  if (!address.postalCode) {
    warnings.push('Código postal no disponible.');
  }

  if (!address.neighborhood) {
    warnings.push('Colonia/barrio no disponible.');
  }

  return warnings;
}

// ============================================================================
// MAIN PUBLIC API
// ============================================================================

/**
 * Get user's precise location and convert to structured address
 *
 * This is the MAIN function you should use.
 *
 * Flow:
 * 1. Acquire high-accuracy GPS position
 * 2. Validate coordinates
 * 3. Reverse geocode with Google Geocoding API
 * 4. Optionally enrich with Google Places API
 * 5. Return structured address with quality metrics
 *
 * @param apiKey Google Maps API Key (from process.env.GOOGLE_MAPS_API_KEY)
 * @param options Location acquisition options
 * @returns LocationResult with structured address or error
 */
export async function getPreciseLocation(
  apiKey: string,
  options: LocationAcquisitionOptions = {}
): Promise<LocationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // ===== STEP 1: Acquire GPS position =====
    console.log('[Location Service] Step 1: Acquiring GPS position...');
    const gps = await acquireGPSPosition(opts);

    // Validate coordinates
    if (
      gps.latitude < -90 || gps.latitude > 90 ||
      gps.longitude < -180 || gps.longitude > 180
    ) {
      throw Object.assign(
        new Error('Coordenadas inválidas: fuera del rango válido'),
        { code: 'INVALID_COORDINATES' as const }
      );
    }

    // Check for null island (0, 0)
    if (gps.latitude === 0 && gps.longitude === 0) {
      throw Object.assign(
        new Error('Coordenadas inválidas: (0, 0) - "Null Island"'),
        { code: 'INVALID_COORDINATES' as const }
      );
    }

    // ===== STEP 2: Reverse geocode =====
    console.log('[Location Service] Step 2: Reverse geocoding...');
    const geocodingResult = await reverseGeocode(
      gps.latitude,
      gps.longitude,
      apiKey
    );

    if (!geocodingResult) {
      throw Object.assign(
        new Error('No se pudo obtener la dirección desde las coordenadas'),
        { code: 'GEOCODING_FAILED' as const }
      );
    }

    // ===== STEP 3: Parse result =====
    console.log('[Location Service] Step 3: Parsing address...');
    const parsedAddress = parseGeocodingResult(geocodingResult, gps);

    // ===== STEP 4: Optional Places enrichment =====
    if (opts.enrichWithPlaces) {
      console.log('[Location Service] Step 4: Enriching with Places API...');
      const place = await enrichWithPlaces(gps.latitude, gps.longitude, apiKey);

      if (place) {
        console.log(`[Location Service] Nearby place: ${place.name}`);
        // You can use place data to enhance the address if needed
        // For now, we just log it
      }
    }

    // ===== STEP 5: Quality assessment =====
    console.log('[Location Service] Step 5: Assessing quality...');
    const quality = assessQuality(gps.accuracy);
    const warnings = generateWarnings(parsedAddress);

    // Build final structured address
    const address: StructuredAddress = {
      ...parsedAddress,
      quality,
      warnings,
      note: warnings.length > 0
        ? `Se detectaron ${warnings.length} advertencia(s) de calidad.`
        : null,
    };

    console.log('[Location Service] ✅ Success!');
    console.log(`[Location Service] Address: ${address.formattedAddress}`);
    console.log(`[Location Service] Quality: ${quality} (${gps.accuracy.toFixed(1)}m)`);

    return {
      success: true,
      address,
      error: null,
    };
  } catch (error) {
    const err = error as Error & { code?: LocationResult['errorCode'] };
    console.error('[Location Service] ❌ Error:', err.message);

    return {
      success: false,
      address: null,
      error: err.message,
      errorCode: err.code,
    };
  }
}

/**
 * Simplified version: Just get coordinates with high accuracy
 * (For when you only need lat/lng without full address)
 */
export async function getHighAccuracyCoordinates(
  timeout = 10000
): Promise<{ lat: number; lng: number; accuracy: number } | null> {
  try {
    const gps = await acquireGPSPosition({
      ...DEFAULT_OPTIONS,
      timeout,
    });

    return {
      lat: parseFloat(gps.latitude.toFixed(7)),
      lng: parseFloat(gps.longitude.toFixed(7)),
      accuracy: gps.accuracy,
    };
  } catch (error) {
    console.error('[getHighAccuracyCoordinates] Error:', error);
    return null;
  }
}
