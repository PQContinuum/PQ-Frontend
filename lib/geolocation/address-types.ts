/**
 * ============================================================================
 * ADDRESS & LOCATION TYPES
 * ============================================================================
 *
 * Structured types for precise address representation using Google Maps APIs.
 * These types ensure consistency across the application and prevent data loss.
 */

/**
 * Complete structured address from Google Geocoding + Places APIs
 *
 * This is your OFFICIAL output structure - DO NOT modify field names
 */
export interface StructuredAddress {
  // ===== STREET INFORMATION =====
  /** Street name (e.g., "Avenida Insurgentes Sur") */
  street: string | null;

  /** Street number (e.g., "1234") */
  streetNumber: string | null;

  // ===== LOCALITY INFORMATION =====
  /** Neighborhood / Colonia (e.g., "Del Valle") */
  neighborhood: string | null;

  /** City / Municipality (e.g., "Ciudad de México") */
  city: string | null;

  /** State / Province (e.g., "CDMX") */
  state: string | null;

  /** Country (e.g., "México") */
  country: string | null;

  /** ISO country code (e.g., "MX") */
  countryCode: string | null;

  // ===== POSTAL & IDENTIFIERS =====
  /** Postal code / ZIP code (e.g., "03100") */
  postalCode: string | null;

  /** Google Place ID for this address */
  placeId: string | null;

  // ===== FORMATTED ADDRESSES =====
  /** Full formatted address string (e.g., "Insurgentes Sur 1234, Del Valle, CDMX") */
  formattedAddress: string;

  /** Short formatted address (e.g., "Insurgentes Sur 1234") */
  shortAddress: string;

  // ===== COORDINATES =====
  /** Latitude with 7 decimals precision */
  lat: number;

  /** Longitude with 7 decimals precision */
  lng: number;

  // ===== QUALITY METRICS =====
  /** GPS accuracy in meters */
  accuracy: number;

  /** Quality assessment */
  quality: 'excellent' | 'good' | 'fair' | 'poor';

  /** Timestamp when location was acquired */
  timestamp: number;

  // ===== ADDITIONAL CONTEXT (optional) =====
  /** Sublocality level 1 (e.g., "Benito Juárez" - delegación/alcaldía) */
  sublocalityLevel1: string | null;

  /** Sublocality level 2 (e.g., specific neighborhood subdivision) */
  sublocalityLevel2: string | null;

  /** Administrative area level 2 (e.g., municipality within state) */
  administrativeAreaLevel2: string | null;

  /** Location type from Google (e.g., "ROOFTOP", "GEOMETRIC_CENTER") */
  locationType: string | null;

  // ===== WARNINGS & NOTES =====
  /** Array of warning messages (e.g., low accuracy warnings) */
  warnings: string[];

  /** General note about the location quality or issues */
  note: string | null;
}

/**
 * Raw GPS position data
 */
export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

/**
 * Options for location acquisition
 */
export interface LocationAcquisitionOptions {
  /** Enable high accuracy mode (uses GPS, more battery) */
  enableHighAccuracy?: boolean;

  /** Maximum age of cached position in ms (0 = always fresh) */
  maximumAge?: number;

  /** Timeout for position acquisition in ms */
  timeout?: number;

  /** Minimum acceptable accuracy in meters (default: 50) */
  minAccuracy?: number;

  /** Use Google Places API for enrichment (default: true) */
  enrichWithPlaces?: boolean;
}

/**
 * Result of location acquisition
 */
export interface LocationResult {
  success: boolean;
  address: StructuredAddress | null;
  error: string | null;
  errorCode?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'GEOCODING_FAILED' | 'INVALID_COORDINATES';
}

/**
 * Google Geocoding API Response Types
 */
export interface GoogleGeocodingAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleGeocodingGeometry {
  location: {
    lat: number;
    lng: number;
  };
  location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
  viewport: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface GoogleGeocodingResult {
  address_components: GoogleGeocodingAddressComponent[];
  formatted_address: string;
  geometry: GoogleGeocodingGeometry;
  place_id: string;
  types: string[];
}

export interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
}

/**
 * Google Places API Response Types (simplified)
 */
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  types: string[];
}

export interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
}
