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
};

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  watch: false,
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

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const coords: GeolocationCoords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    setState({
      coords,
      isLoading: false,
      error: null,
      permissionState: 'granted',
    });

    isRequestingRef.current = false;
  }, []);

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

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 0,
    };

    if (options.watch) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    }
  }, [options, handleSuccess, handleError, checkPermission]);

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
