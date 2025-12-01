/**
 * Geolocation Module - Main Exports
 *
 * This is the entry point for all geolocation functionality.
 * Import from here to access the complete geolocation system.
 */

// ============================================================================
// CLIENT-SIDE (Browser)
// ============================================================================

export {
  getPreciseLocation,
  getHighAccuracyCoordinates,
} from './precise-location-service';

// ============================================================================
// SERVER-SIDE (Next.js API Routes)
// ============================================================================

export {
  reverseGeocodeServer,
  getAreaNameServer,
} from './server-geocoding';

// ============================================================================
// VALIDATION
// ============================================================================

export {
  validateLocation,
  validateLocationOrThrow,
} from './location-validator';

// ============================================================================
// CALIBRATION (Advanced)
// ============================================================================

export {
  LocationCalibrator,
  type CalibratedLocation,
  type CalibrationOptions,
} from './location-calibration';

export {
  LocationKalmanFilter,
  type KalmanLocation,
} from './kalman-filter';

// ============================================================================
// TYPES
// ============================================================================

export type {
  StructuredAddress,
  GPSPosition,
  LocationAcquisitionOptions,
  LocationResult,
  GoogleGeocodingAddressComponent,
  GoogleGeocodingGeometry,
  GoogleGeocodingResult,
  GoogleGeocodingResponse,
  GooglePlaceResult,
  GooglePlacesResponse,
} from './address-types';

export type {
  LocationValidationResult,
  LocationData,
} from './location-validator';
