'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LocationCalibrator,
  type CalibratedLocation,
  type CalibrationOptions,
} from '@/lib/geolocation/location-calibration';

export type GeolocationCoords = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  isCalibrated?: boolean;
  sampleCount?: number;
};

export type GeolocationState = {
  coords: GeolocationCoords | null;
  isLoading: boolean;
  error: string | null;
  permissionState: PermissionState | null;
};

export type GeolocationOptions = {
  /** Target accuracy in meters. Default: 50 */
  targetAccuracy?: number;
  /** Minimum samples before considering calibrated. Default: 3 */
  minSamples?: number;
  /** Maximum samples to collect. Default: 10 */
  maxSamples?: number;
  /** Timeout for initial location in ms. Default: 15000 */
  timeout?: number;
  /** Enable Kalman filter for smoothing. Default: true */
  enableKalmanFilter?: boolean;
  /** Reject suspicious GPS jumps. Default: true */
  rejectOutliers?: boolean;
};

const DEFAULT_OPTIONS: GeolocationOptions = {
  targetAccuracy: 50,
  minSamples: 3,
  maxSamples: 10,
  timeout: 15000,
  enableKalmanFilter: true,
  rejectOutliers: true,
};

/**
 * Enhanced geolocation hook using Uber/Rappi-style calibration
 *
 * Features:
 * - Uses watchPosition for continuous improvement (better than getCurrentPosition)
 * - Kalman filtering to reduce GPS noise by up to 43%
 * - Weighted averaging of multiple samples
 * - Outlier detection and rejection
 * - Quality assessment (excellent/good/fair/poor)
 *
 * References:
 * - Uber Engineering: https://www.uber.com/blog/rethinking-gps/
 * - Kalman Filter: https://maddevs.io/blog/reduce-gps-data-error-on-android-with-kalman-filter-and-accelerometer/
 */
export function useGeolocation(options: GeolocationOptions = DEFAULT_OPTIONS) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    isLoading: false,
    error: null,
    permissionState: null,
  });

  const calibratorRef = useRef<LocationCalibrator | null>(null);
  const isRequestingRef = useRef(false);

  // Check permission
  const checkPermission = useCallback(async () => {
    if (!('permissions' in navigator)) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setState((prev) => ({ ...prev, permissionState: result.state }));
      return result.state;
    } catch {
      return null;
    }
  }, []);

  // Handle calibration update
  const handleCalibrationUpdate = useCallback((location: CalibratedLocation) => {
    const coords: GeolocationCoords = {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      quality: location.quality,
      isCalibrated: location.isCalibrated,
      sampleCount: location.sampleCount,
    };

    setState({
      coords,
      isLoading: !location.isCalibrated,
      error: null,
      permissionState: 'granted',
    });
  }, []);

  // Handle calibration error
  const handleCalibrationError = useCallback((error: string) => {
    setState({
      coords: null,
      isLoading: false,
      error,
      permissionState: 'denied',
    });
    isRequestingRef.current = false;
  }, []);

  // Request location with calibration
  const requestLocation = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalización no soportada en este navegador',
        isLoading: false,
      }));
      return;
    }

    if (isRequestingRef.current) {
      return;
    }

    isRequestingRef.current = true;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    await checkPermission();

    // Create calibrator with options
    const calibrationOptions: CalibrationOptions = {
      targetAccuracy: options.targetAccuracy ?? DEFAULT_OPTIONS.targetAccuracy!,
      minSamples: options.minSamples ?? DEFAULT_OPTIONS.minSamples!,
      maxSamples: options.maxSamples ?? DEFAULT_OPTIONS.maxSamples!,
      maxAge: 0, // Always get fresh location
      timeout: options.timeout ?? DEFAULT_OPTIONS.timeout!,
      enableKalmanFilter: options.enableKalmanFilter ?? DEFAULT_OPTIONS.enableKalmanFilter!,
      rejectOutliers: options.rejectOutliers ?? DEFAULT_OPTIONS.rejectOutliers!,
    };

    calibratorRef.current = new LocationCalibrator(calibrationOptions);
    calibratorRef.current.start(handleCalibrationUpdate, handleCalibrationError);
  }, [options, checkPermission, handleCalibrationUpdate, handleCalibrationError]);

  // Stop calibration
  const stopCalibration = useCallback(() => {
    if (calibratorRef.current) {
      calibratorRef.current.stop();
      calibratorRef.current = null;
    }
    isRequestingRef.current = false;
  }, []);

  // Reset
  const reset = useCallback(() => {
    stopCalibration();
    setState({
      coords: null,
      isLoading: false,
      error: null,
      permissionState: null,
    });
  }, [stopCalibration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCalibration();
    };
  }, [stopCalibration]);

  return {
    ...state,
    requestLocation,
    stopCalibration,
    reset,
    checkPermission,
    calibrationProgress: calibratorRef.current?.getProgress() ?? 0,
    sampleCount: calibratorRef.current?.getSampleCount() ?? 0,
  };
}
