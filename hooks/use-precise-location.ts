'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { getPreciseLocation } from '@/lib/geolocation/precise-location-service';
import type { StructuredAddress, LocationResult } from '@/lib/geolocation/address-types';

/**
 * Hook for precise location acquisition with full address
 *
 * Uses a progressive strategy:
 * 1. First attempt: Quick network location (5s timeout, low accuracy OK)
 * 2. Second attempt: High accuracy GPS (30s timeout)
 * 3. Updates UI progressively as better location is acquired
 *
 * Usage:
 * ```tsx
 * const { address, isLoading, error, requestLocation, stage } = usePreciseLocation();
 *
 * await requestLocation();
 * console.log(address.street, address.streetNumber, address.city);
 * ```
 */
export function usePreciseLocation() {
  const [address, setAddress] = useState<StructuredAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'quick' | 'precise' | 'done'>('idle');
  const abortRef = useRef(false);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStage('quick');
    abortRef.current = false;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      setStage('idle');
      throw new Error('Google Maps API key not configured');
    }

    let bestAddress: StructuredAddress | null = null;

    // ==========================================
    // STAGE 1: Quick network-based location (5s)
    // ==========================================
    try {
      console.log('[usePreciseLocation] Stage 1: Quick network location...');

      const quickResult: LocationResult = await getPreciseLocation(apiKey, {
        enableHighAccuracy: false, // Use network (WiFi/Cell) - much faster
        maximumAge: 60000,         // Accept cached locations up to 1 minute old
        timeout: 5000,             // Only wait 5 seconds
        minAccuracy: 500,          // Accept up to 500m accuracy for quick result
        enrichWithPlaces: false,
      });

      if (abortRef.current) return null;

      if (quickResult.success && quickResult.address) {
        bestAddress = quickResult.address;
        setAddress(bestAddress);
        console.log(`[usePreciseLocation] Quick location: ${bestAddress.accuracy.toFixed(0)}m accuracy`);
      }
    } catch (e) {
      console.warn('[usePreciseLocation] Quick location failed, continuing to precise...', e);
    }

    if (abortRef.current) {
      setIsLoading(false);
      setStage('idle');
      return null;
    }

    // ==========================================
    // STAGE 2: High-precision GPS (30s)
    // ==========================================
    setStage('precise');

    try {
      console.log('[usePreciseLocation] Stage 2: High-precision GPS...');

      const preciseResult: LocationResult = await getPreciseLocation(apiKey, {
        enableHighAccuracy: true,  // Use GPS/GNSS hardware
        maximumAge: 0,             // Always fresh data
        timeout: 30000,            // 30 seconds for GPS cold start
        minAccuracy: 100,          // Accept up to 100m
        enrichWithPlaces: false,
      });

      if (abortRef.current) return bestAddress;

      if (preciseResult.success && preciseResult.address) {
        // Only update if precision is better
        if (!bestAddress || preciseResult.address.accuracy < bestAddress.accuracy) {
          bestAddress = preciseResult.address;
          setAddress(bestAddress);
          console.log(`[usePreciseLocation] Precise location: ${bestAddress.accuracy.toFixed(0)}m accuracy`);
        }
      } else if (!bestAddress) {
        // Only set error if we don't have ANY location
        const errorMsg = preciseResult.error || 'No se pudo obtener ubicación precisa';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      // If we have a quick location, use it despite GPS failure
      if (bestAddress) {
        console.warn('[usePreciseLocation] GPS failed but using network location');
        setError(null); // Clear error since we have usable data
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        // Provide more helpful error messages
        if (errorMsg.includes('Tiempo de espera') || errorMsg.includes('timeout')) {
          setError('No se pudo obtener señal GPS. Intenta en un área abierta o activa WiFi para mejor precisión.');
        } else if (errorMsg.includes('Permiso')) {
          setError(errorMsg);
        } else {
          setError(`${errorMsg}. Verifica que GPS y WiFi estén activados.`);
        }
        throw err;
      }
    } finally {
      setIsLoading(false);
      setStage(bestAddress ? 'done' : 'idle');
    }

    return bestAddress;
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setIsLoading(false);
    setStage('idle');
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setAddress(null);
    setError(null);
    setStage('idle');
  }, []);

  // Memoize coords to prevent infinite loops in useEffect
  const coords = useMemo(() => {
    if (!address) return null;
    return {
      lat: address.lat,
      lng: address.lng,
      accuracy: address.accuracy,
      timestamp: address.timestamp,
    };
  }, [address]);

  // Memoize warnings to prevent unnecessary re-renders
  const warnings = useMemo(() => {
    return address?.warnings || [];
  }, [address?.warnings]);

  return {
    address,
    isLoading,
    error,
    requestLocation,
    cancel,
    reset,
    stage, // 'idle' | 'quick' | 'precise' | 'done'
    // Convenience getters (memoized)
    coords,
    quality: address?.quality,
    warnings,
  };
}
