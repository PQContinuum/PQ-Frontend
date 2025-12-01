'use client';

import { useState, useCallback, useMemo } from 'react';
import { getPreciseLocation } from '@/lib/geolocation/precise-location-service';
import type { StructuredAddress, LocationResult } from '@/lib/geolocation/address-types';

/**
 * Hook for precise location acquisition with full address
 *
 * Usage:
 * ```tsx
 * const { address, isLoading, error, requestLocation } = usePreciseLocation();
 *
 * await requestLocation();
 * console.log(address.street, address.streetNumber, address.city);
 * ```
 */
export function usePreciseLocation() {
  const [address, setAddress] = useState<StructuredAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const result: LocationResult = await getPreciseLocation(apiKey, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
        minAccuracy: 100,
        enrichWithPlaces: false,
      });

      if (result.success && result.address) {
        setAddress(result.address);
        return result.address;
      } else {
        const errorMsg = result.error || 'Unknown error';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAddress(null);
    setError(null);
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
    reset,
    // Convenience getters (memoized)
    coords,
    quality: address?.quality,
    warnings,
  };
}
