'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type GeolocationCoords = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

export type GeolocationState = {
  coords: GeolocationCoords | null;
  isLoading: boolean;
  error: string | null;
  permissionState: PermissionState | null;
};

export type GeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  /** Target accuracy in meters. Will retry until achieving this or max attempts reached. Default: 50 */
  targetAccuracy?: number;
  /** Maximum number of location attempts. Default: 3 */
  maxAttempts?: number;
  /** Number of readings to average for better precision. Default: 1 */
  averageReadings?: number;
};

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  watch: false,
  targetAccuracy: 50, // meters
  maxAttempts: 3,
  averageReadings: 1,
};

export function useGeolocation(options: GeolocationOptions = DEFAULT_OPTIONS) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    isLoading: false,
    error: null,
    permissionState: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const isRequestingRef = useRef(false);

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

  const readingsRef = useRef<GeolocationCoords[]>([]);
  const attemptCountRef = useRef(0);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Error desconocido al obtener ubicación';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permiso de ubicación denegado. Por favor, habilita el acceso a tu ubicación en la configuración del navegador.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS o WiFi.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
        break;
    }

    setState({
      coords: null,
      isLoading: false,
      error: errorMessage,
      permissionState: error.code === error.PERMISSION_DENIED ? 'denied' : 'prompt',
    });

    isRequestingRef.current = false;
  }, []);

  /**
   * Get a single geolocation reading
   */
  const getSingleReading = useCallback((geoOptions: PositionOptions): Promise<GeolocationCoords> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => reject(error),
        geoOptions
      );
    });
  }, []);

  /**
   * Average multiple readings for better precision (like Uber/Rappi)
   */
  const averageCoords = useCallback((readings: GeolocationCoords[]): GeolocationCoords => {
    if (readings.length === 0) throw new Error('No readings to average');
    if (readings.length === 1) return readings[0];

    const sum = readings.reduce(
      (acc, reading) => ({
        lat: acc.lat + reading.lat,
        lng: acc.lng + reading.lng,
        accuracy: acc.accuracy + reading.accuracy,
      }),
      { lat: 0, lng: 0, accuracy: 0 }
    );

    return {
      lat: sum.lat / readings.length,
      lng: sum.lng / readings.length,
      accuracy: sum.accuracy / readings.length,
      timestamp: Date.now(),
    };
  }, []);

  /**
   * Smart retry strategy with multiple attempts (like Uber/Rappi)
   */
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
    readingsRef.current = [];
    attemptCountRef.current = 0;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    await checkPermission();

    const targetAccuracy = options.targetAccuracy ?? 50;
    const maxAttempts = options.maxAttempts ?? 3;
    const averageReadings = options.averageReadings ?? 1;
    let bestCoords: GeolocationCoords | null = null;

    try {
      // Attempt 1: High accuracy, short timeout
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        attemptCountRef.current = attempt + 1;

        const geoOptions: PositionOptions = {
          enableHighAccuracy: attempt < 2 ? true : false, // Try without high accuracy on last attempt
          timeout: attempt === 0 ? 5000 : attempt === 1 ? 10000 : 15000, // Progressive timeout
          maximumAge: 0, // Always get fresh location
        };

        try {
          // Collect multiple readings if requested
          const readings: GeolocationCoords[] = [];
          for (let i = 0; i < averageReadings; i++) {
            const reading = await getSingleReading(geoOptions);
            readings.push(reading);

            // Small delay between readings for variation
            if (i < averageReadings - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // Average the readings
          const coords = averageCoords(readings);
          readingsRef.current.push(coords);

          // Keep best reading
          if (!bestCoords || coords.accuracy < bestCoords.accuracy) {
            bestCoords = coords;
          }

          // Check if we achieved target accuracy
          if (coords.accuracy <= targetAccuracy) {
            setState({
              coords,
              isLoading: false,
              error: null,
              permissionState: 'granted',
            });
            isRequestingRef.current = false;
            return;
          }

        } catch (error) {
          // If this is not the last attempt, continue
          if (attempt === maxAttempts - 1) {
            throw error;
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // If we got here, we didn't achieve target accuracy but have readings
      if (bestCoords) {
        setState({
          coords: bestCoords,
          isLoading: false,
          error: bestCoords.accuracy > targetAccuracy
            ? `Precisión limitada: ${Math.round(bestCoords.accuracy)}m. Intenta moverte a un área con mejor señal GPS.`
            : null,
          permissionState: 'granted',
        });
      } else {
        throw new Error('No se pudo obtener ubicación');
      }

    } catch (error) {
      handleError(error as GeolocationPositionError);
    } finally {
      isRequestingRef.current = false;
    }
  }, [options, checkPermission, getSingleReading, averageCoords, handleError]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearWatch();
    setState({
      coords: null,
      isLoading: false,
      error: null,
      permissionState: null,
    });
    isRequestingRef.current = false;
  }, [clearWatch]);

  useEffect(() => {
    return () => {
      clearWatch();
    };
  }, [clearWatch]);

  return {
    ...state,
    requestLocation,
    clearWatch,
    reset,
    checkPermission,
  };
}
