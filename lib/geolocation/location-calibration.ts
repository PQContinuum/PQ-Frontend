/**
 * Location Calibration System
 * Implements Uber/Rappi-style location accuracy using:
 * - watchPosition for continuous updates
 * - Kalman filtering for noise reduction
 * - Intelligent quality assessment
 * - Outlier detection
 *
 * References:
 * - Uber Engineering: https://www.uber.com/blog/rethinking-gps/
 * - Kalman Filter: https://maddevs.io/blog/reduce-gps-data-error-on-android-with-kalman-filter-and-accelerometer/
 */

import { LocationKalmanFilter, type KalmanLocation } from './kalman-filter';

export interface CalibratedLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  isCalibrated: boolean;
  sampleCount: number;
}

export interface CalibrationOptions {
  targetAccuracy: number; // Target accuracy in meters
  minSamples: number; // Minimum samples before considering calibrated
  maxSamples: number; // Maximum samples to collect
  maxAge: number; // Maximum age of location in ms
  timeout: number; // Timeout for initial location
  enableKalmanFilter: boolean; // Enable Kalman filtering
  rejectOutliers: boolean; // Reject suspicious GPS jumps
}

const DEFAULT_OPTIONS: CalibrationOptions = {
  targetAccuracy: 50,
  minSamples: 3,
  maxSamples: 10,
  maxAge: 0,
  timeout: 15000,
  enableKalmanFilter: true,
  rejectOutliers: true,
};

/**
 * Assess location quality based on accuracy
 */
function assessLocationQuality(accuracy: number): CalibratedLocation['quality'] {
  if (accuracy <= 20) return 'excellent';
  if (accuracy <= 50) return 'good';
  if (accuracy <= 100) return 'fair';
  return 'poor';
}

/**
 * Calculate weighted average of locations
 * Locations with better accuracy have more weight
 */
function calculateWeightedAverage(
  locations: KalmanLocation[]
): KalmanLocation {
  if (locations.length === 0) {
    throw new Error('No locations to average');
  }

  if (locations.length === 1) {
    return locations[0];
  }

  // Calculate weights (inverse of accuracy squared)
  const weights = locations.map((loc) => 1 / Math.pow(loc.accuracy, 2));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Calculate weighted average
  let lat = 0;
  let lng = 0;
  let accuracy = 0;

  locations.forEach((loc, i) => {
    const weight = weights[i] / totalWeight;
    lat += loc.lat * weight;
    lng += loc.lng * weight;
    accuracy += loc.accuracy * weight;
  });

  return {
    lat,
    lng,
    accuracy,
    timestamp: Date.now(),
  };
}

/**
 * Location Calibrator
 * Uses watchPosition with Kalman filtering for optimal accuracy
 */
export class LocationCalibrator {
  private options: CalibrationOptions;
  private kalmanFilter: LocationKalmanFilter;
  private samples: KalmanLocation[] = [];
  private watchId: number | null = null;
  private isCalibrating: boolean = false;
  private onUpdate: ((location: CalibratedLocation) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private startTime: number = 0;

  constructor(options: Partial<CalibrationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.kalmanFilter = new LocationKalmanFilter();
  }

  /**
   * Start calibration process
   * Uses watchPosition for continuous improvement (better than getCurrentPosition)
   */
  start(
    onUpdate: (location: CalibratedLocation) => void,
    onError: (error: string) => void
  ): void {
    if (this.isCalibrating) {
      console.warn('[LocationCalibrator] Already calibrating');
      return;
    }

    if (!('geolocation' in navigator)) {
      onError('Geolocalización no soportada en este navegador');
      return;
    }

    this.onUpdate = onUpdate;
    this.onError = onError;
    this.isCalibrating = true;
    this.startTime = Date.now();
    this.samples = [];
    this.kalmanFilter.reset();

    // Use watchPosition for continuous updates (Uber-style)
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        timeout: this.options.timeout,
        maximumAge: this.options.maxAge,
      }
    );

    console.log('[LocationCalibrator] Started calibration');
  }

  /**
   * Stop calibration
   */
  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isCalibrating = false;
    console.log('[LocationCalibrator] Stopped calibration');
  }

  /**
   * Handle position update from watchPosition
   */
  private handlePosition(position: GeolocationPosition): void {
    const rawLocation: KalmanLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    console.log(
      `[LocationCalibrator] Raw sample #${this.samples.length + 1}: ` +
        `accuracy=${rawLocation.accuracy.toFixed(1)}m`
    );

    // Check for suspicious GPS jumps (outlier detection)
    if (
      this.options.rejectOutliers &&
      this.samples.length > 0 &&
      this.kalmanFilter.isLocationJumpSuspicious(rawLocation, 200)
    ) {
      console.warn('[LocationCalibrator] Rejected suspicious GPS jump');
      return;
    }

    // Apply Kalman filtering if enabled
    const processedLocation = this.options.enableKalmanFilter
      ? this.kalmanFilter.filter(rawLocation)
      : rawLocation;

    // Add to samples
    this.samples.push(processedLocation);

    // Calculate current best estimate (weighted average of all samples)
    const bestEstimate = calculateWeightedAverage(this.samples);

    // Determine if we're calibrated
    const isCalibrated =
      this.samples.length >= this.options.minSamples &&
      bestEstimate.accuracy <= this.options.targetAccuracy;

    const quality = assessLocationQuality(bestEstimate.accuracy);

    const calibratedLocation: CalibratedLocation = {
      lat: bestEstimate.lat,
      lng: bestEstimate.lng,
      accuracy: bestEstimate.accuracy,
      timestamp: bestEstimate.timestamp,
      quality,
      isCalibrated,
      sampleCount: this.samples.length,
    };

    console.log(
      `[LocationCalibrator] Calibrated location (${this.samples.length} samples): ` +
        `accuracy=${calibratedLocation.accuracy.toFixed(1)}m, ` +
        `quality=${quality}, ` +
        `calibrated=${isCalibrated}`
    );

    // Notify update
    if (this.onUpdate) {
      this.onUpdate(calibratedLocation);
    }

    // Stop if we've achieved excellent accuracy or reached max samples
    if (
      (isCalibrated && quality === 'excellent') ||
      this.samples.length >= this.options.maxSamples
    ) {
      console.log('[LocationCalibrator] Calibration complete');
      this.stop();
    }
  }

  /**
   * Handle geolocation error
   */
  private handleError(error: GeolocationPositionError): void {
    let errorMessage = 'Error desconocido al obtener ubicación';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage =
          'Permiso de ubicación denegado. Por favor, habilita el acceso a tu ubicación.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS o WiFi.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
        break;
    }

    console.error('[LocationCalibrator] Error:', errorMessage);

    if (this.onError) {
      this.onError(errorMessage);
    }

    this.stop();
  }

  /**
   * Get calibration progress (0-1)
   */
  getProgress(): number {
    return Math.min(this.samples.length / this.options.minSamples, 1);
  }

  /**
   * Check if currently calibrating
   */
  isActive(): boolean {
    return this.isCalibrating;
  }

  /**
   * Get sample count
   */
  getSampleCount(): number {
    return this.samples.length;
  }
}
