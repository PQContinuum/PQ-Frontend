'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Check, Navigation, AlertCircle } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { StructuredAddress } from '@/lib/geolocation/address-types';

type LocationMapConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: {
    lat: number;
    lng: number;
    accuracy: number;
    address: StructuredAddress;
  }) => void;
  initialLocation: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  initialAddress: StructuredAddress;
};

export function LocationMapConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
  initialAddress,
}: LocationMapConfirmDialogProps) {
  const [markerPosition, setMarkerPosition] = useState({
    lat: initialLocation.lat,
    lng: initialLocation.lng,
  });
  const [currentAddress, setCurrentAddress] = useState<StructuredAddress>(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Reverse geocode when marker position changes
  const reverseGeocodePosition = useCallback(
    async (lat: number, lng: number) => {
      // Clear previous timeout
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }

      // Debounce geocoding requests (wait 500ms after user stops dragging)
      geocodingTimeoutRef.current = setTimeout(async () => {
        setIsGeocoding(true);
        setGeocodingError(null);

        try {
          const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
          url.searchParams.set('latlng', `${lat.toFixed(7)},${lng.toFixed(7)}`);
          url.searchParams.set(
            'result_type',
            'street_address|premise|subpremise|neighborhood|sublocality'
          );
          url.searchParams.set('key', apiKey);

          const response = await fetch(url.toString());

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const components = result.address_components;

            // Helper to extract component
            const extractComponent = (type: string, format: 'long' | 'short' = 'long') => {
              const component = components.find((c: any) => c.types.includes(type));
              if (!component) return null;
              return format === 'long' ? component.long_name : component.short_name;
            };

            // Build new address
            const streetNumber = extractComponent('street_number');
            const route = extractComponent('route');
            const neighborhood = extractComponent('neighborhood');
            const sublocalityL1 = extractComponent('sublocality_level_1');
            const sublocalityL2 = extractComponent('sublocality_level_2');
            const locality = extractComponent('locality');
            const adminAreaL1 = extractComponent('administrative_area_level_1');
            const adminAreaL2 = extractComponent('administrative_area_level_2');
            const country = extractComponent('country');
            const countryCode = extractComponent('country', 'short');
            const postalCode = extractComponent('postal_code');

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

            const formattedAddress =
              formattedParts.length > 0 ? formattedParts.join(', ') : result.formatted_address;

            const newAddress: StructuredAddress = {
              street: route,
              streetNumber: streetNumber,
              neighborhood: neighborhood,
              city: locality,
              state: adminAreaL1,
              country: country,
              countryCode: countryCode,
              postalCode: postalCode,
              placeId: result.place_id,
              formattedAddress: formattedAddress,
              shortAddress: shortAddress,
              lat: parseFloat(lat.toFixed(7)),
              lng: parseFloat(lng.toFixed(7)),
              accuracy: initialLocation.accuracy,
              timestamp: Date.now(),
              sublocalityLevel1: sublocalityL1,
              sublocalityLevel2: sublocalityL2,
              administrativeAreaLevel2: adminAreaL2,
              locationType: result.geometry.location_type,
              quality: currentAddress.quality,
              warnings: [],
              note: null,
            };

            setCurrentAddress(newAddress);
          } else {
            throw new Error('No se pudo obtener la dirección para esta ubicación');
          }
        } catch (error) {
          console.error('[LocationMapConfirmDialog] Geocoding error:', error);
          setGeocodingError(
            error instanceof Error ? error.message : 'Error al obtener la dirección'
          );
        } finally {
          setIsGeocoding(false);
        }
      }, 500);
    },
    [apiKey, initialLocation.accuracy, currentAddress.quality]
  );

  // Handle map click to update marker position
  const handleMapClick = useCallback(
    (event: any) => {
      if (event.detail?.latLng) {
        const newLat = event.detail.latLng.lat;
        const newLng = event.detail.latLng.lng;
        setMarkerPosition({ lat: newLat, lng: newLng });
        reverseGeocodePosition(newLat, newLng);
      }
    },
    [reverseGeocodePosition]
  );

  // Handle confirm button
  const handleConfirm = useCallback(() => {
    onConfirm({
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      accuracy: initialLocation.accuracy,
      address: currentAddress,
    });
  }, [markerPosition, initialLocation.accuracy, currentAddress, onConfirm]);

  // Reset position when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMarkerPosition({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
      });
      setCurrentAddress(initialAddress);
      setGeocodingError(null);
    }
  }, [isOpen, initialLocation, initialAddress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden pointer-events-auto"
            >
              <div className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-colors z-10"
                >
                  <X className="size-5 text-gray-600" />
                </button>

                <div className="px-8 pt-12 pb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto w-20 h-20 bg-gradient-to-br from-[#00552b] to-[#00aa56] rounded-full flex items-center justify-center mb-6"
                  >
                    <MapPin className="size-10 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-[#111111] text-center mb-3"
                  >
                    Confirma tu ubicación
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[#4c4c4c] text-center text-[15px] leading-relaxed mb-6"
                  >
                    Mueve el pin en el mapa para ajustar tu ubicación exacta o confirma la ubicación actual.
                  </motion.p>

                  {/* Map Container */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 400 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl overflow-hidden border-2 border-gray-200 mb-6"
                  >
                    <APIProvider apiKey={apiKey}>
                      <Map
                        mapId="location-confirmation-map"
                        defaultCenter={markerPosition}
                        defaultZoom={16}
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        onClick={handleMapClick}
                        mapTypeControl={false}
                        fullscreenControl={false}
                        streetViewControl={false}
                        style={{
                          width: '100%',
                          height: '400px',
                        }}
                      >
                        <AdvancedMarker
                          position={markerPosition}
                          draggable={true}
                          onDragEnd={(event: any) => {
                            if (event.latLng) {
                              const newLat = event.latLng.lat();
                              const newLng = event.latLng.lng();
                              setMarkerPosition({ lat: newLat, lng: newLng });
                              reverseGeocodePosition(newLat, newLng);
                            }
                          }}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#00552b] to-[#00aa56] rounded-full flex items-center justify-center shadow-lg">
                              <Navigation className="size-6 text-white" />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#00552b]" />
                          </div>
                        </AdvancedMarker>
                      </Map>
                    </APIProvider>
                  </motion.div>

                  {/* Address Display */}
                  {isGeocoding ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3"
                    >
                      <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="text-sm text-blue-800">Obteniendo dirección...</p>
                    </motion.div>
                  ) : geocodingError ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                    >
                      <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{geocodingError}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="size-5 text-green-600" />
                        <span className="font-semibold text-green-900">Ubicación seleccionada</span>
                      </div>

                      <div className="space-y-2 text-sm">
                        {currentAddress.street && (
                          <div>
                            <span className="text-green-700 font-medium">Calle: </span>
                            <span className="text-gray-800">
                              {[currentAddress.street, currentAddress.streetNumber]
                                .filter(Boolean)
                                .join(' ')}
                            </span>
                          </div>
                        )}
                        {currentAddress.neighborhood && (
                          <div>
                            <span className="text-green-700 font-medium">Colonia: </span>
                            <span className="text-gray-800">{currentAddress.neighborhood}</span>
                          </div>
                        )}
                        {currentAddress.city && (
                          <div>
                            <span className="text-green-700 font-medium">Ciudad: </span>
                            <span className="text-gray-800">
                              {[currentAddress.city, currentAddress.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-green-200">
                          <span className="text-xs text-green-700">
                            Coordenadas: {markerPosition.lat.toFixed(7)}, {markerPosition.lng.toFixed(7)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={handleConfirm}
                      disabled={isGeocoding}
                      className="w-full bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white font-semibold py-4 px-6 rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="size-5" />
                      Confirmar ubicación
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isGeocoding}
                      className="w-full text-[#4c4c4c] font-medium py-4 px-6 rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
