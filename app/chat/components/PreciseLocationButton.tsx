'use client';

import { MapPin, Loader2, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';
import { usePreciseLocation } from '@/hooks/use-precise-location';
import { useSetUserLocation } from '@/app/chat/store';

/**
 * Button component for acquiring precise location with full address
 *
 * Features:
 * - High-accuracy GPS acquisition
 * - Full address geocoding
 * - Quality indicators
 * - Warning displays
 * - Integration with chat store
 */
export function PreciseLocationButton() {
  const { address, isLoading, error, requestLocation, coords, quality, warnings } = usePreciseLocation();
  const setUserLocation = useSetUserLocation();

  const handleGetLocation = async () => {
    try {
      const addr = await requestLocation();

      // Update chat store with coordinates
      if (coords) {
        setUserLocation({
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          timestamp: coords.timestamp,
        });
      }

      console.log('[PreciseLocationButton] Full address:', addr);
    } catch (err) {
      console.error('[PreciseLocationButton] Error:', err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Button */}
      <button
        onClick={handleGetLocation}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#00552b] text-white rounded-lg hover:bg-[#003d1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Obteniendo ubicación precisa...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            Obtener mi ubicación
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs mb-1">Error al obtener ubicación</p>
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {address && (
        <div className="space-y-2.5">
          {/* Quality Badge */}
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className={`w-4 h-4 ${
              quality === 'excellent' ? 'text-green-600' :
              quality === 'good' ? 'text-blue-600' :
              quality === 'fair' ? 'text-yellow-600' :
              'text-red-600'
            }`} />
            <span className="font-semibold">
              Calidad: <span className="capitalize">{quality}</span>
            </span>
            <span className="text-xs text-gray-500">
              ({address.accuracy.toFixed(1)}m)
            </span>
          </div>

          {/* Compact Address Display */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="space-y-1.5 text-sm">
              {/* Street */}
              {(address.street || address.streetNumber) && (
                <div className="flex items-start gap-2">
                  <Navigation className="w-3.5 h-3.5 text-[#00552b] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Dirección</p>
                    <p className="font-semibold">
                      {[address.street, address.streetNumber].filter(Boolean).join(' ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Neighborhood & City */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {address.neighborhood && (
                  <div>
                    <p className="text-gray-500">Colonia</p>
                    <p className="font-semibold">{address.neighborhood}</p>
                  </div>
                )}
                {address.postalCode && (
                  <div>
                    <p className="text-gray-500">C.P.</p>
                    <p className="font-semibold">{address.postalCode}</p>
                  </div>
                )}
              </div>

              {/* City, State */}
              <div className="text-xs">
                <p className="text-gray-500">Ciudad, Estado</p>
                <p className="font-semibold">
                  {[address.city, address.state].filter(Boolean).join(', ')}
                </p>
              </div>

              {/* Coordinates */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-0.5">Coordenadas</p>
                <p className="font-mono text-xs text-gray-700">
                  {address.lat.toFixed(7)}, {address.lng.toFixed(7)}
                </p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-900 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Advertencias
              </p>
              <ul className="text-xs text-yellow-800 space-y-0.5">
                {warnings.map((warning, i) => (
                  <li key={i} className="leading-relaxed">• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
