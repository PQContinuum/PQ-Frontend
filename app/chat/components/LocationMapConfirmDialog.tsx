'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Check, Navigation, AlertCircle } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, type MapMouseEvent } from '@vis.gl/react-google-maps';
import type { StructuredAddress } from '@/lib/geolocation/address-types';

// Type for marker drag events
type MarkerDragEvent = google.maps.MapMouseEvent;

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
              const component = components.find((c: { types: string[] }) => c.types.includes(type));
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
    (event: MapMouseEvent) => {
      const latLng = event.detail?.latLng;
      if (latLng) {
        const newLat = latLng.lat;
        const newLng = latLng.lng;
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:px-6 md:py-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[95vh] overflow-y-auto pointer-events-auto"
            >
              <div className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-colors z-10"
                >
                  <X className="size-4 sm:size-5 text-gray-600" />
                </button>

                <div className="px-4 sm:px-6 md:px-8 pt-10 sm:pt-12 pb-4 sm:pb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#00552b] to-[#00aa56] rounded-full flex items-center justify-center mb-4 sm:mb-6"
                  >
                    <MapPin className="size-8 sm:size-10 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl font-bold text-[#111111] text-center mb-2 sm:mb-3"
                  >
                    Confirma tu ubicación
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[#4c4c4c] text-center text-sm sm:text-[15px] leading-relaxed mb-4 sm:mb-6 px-2"
                  >
                    Mueve el pin en el mapa para ajustar tu ubicación exacta o confirma la ubicación actual.
                  </motion.p>

                  {/* Map Container - Responsive heights */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.5 }}
                    className="rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-200 mb-4 sm:mb-6"
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
                        className="h-[280px] sm:h-[320px] md:h-[400px] w-full"
                      >
                        <AdvancedMarker
                          position={markerPosition}
                          draggable={true}
                          onDrag={(event: MarkerDragEvent) => {
                            // Update position in real-time while dragging
                            if (event.latLng) {
                              const newLat = event.latLng.lat();
                              const newLng = event.latLng.lng();
                              setMarkerPosition({ lat: newLat, lng: newLng });
                            }
                          }}
                          onDragEnd={(event: MarkerDragEvent) => {
                            // Trigger geocoding only when drag ends
                            if (event.latLng) {
                              const newLat = event.latLng.lat();
                              const newLng = event.latLng.lng();
                              setMarkerPosition({ lat: newLat, lng: newLng });
                              reverseGeocodePosition(newLat, newLng);
                            }
                          }}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#00552b] to-[#00aa56] rounded-full flex items-center justify-center shadow-lg">
                              <Navigation className="size-5 sm:size-6 text-white" />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#00552b]" />
                          </div>
                        </AdvancedMarker>
                      </Map>
                    </APIProvider>
                  </motion.div>

                  {/* Address Display - Fixed min-height responsive */}
                  <div className="mb-4 sm:mb-6 min-h-[140px] sm:min-h-[160px]">
                    {isGeocoding ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 sm:gap-3"
                      >
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24">
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
                        <p className="text-xs sm:text-sm text-blue-800">Obteniendo dirección...</p>
                      </motion.div>
                    ) : geocodingError ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 sm:gap-3"
                      >
                        <AlertCircle className="size-4 sm:size-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-red-800">{geocodingError}</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                      >
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Check className="size-4 sm:size-5 text-green-600" />
                          <span className="text-sm sm:text-base font-semibold text-green-900">Ubicación seleccionada</span>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          {currentAddress.street && (
                            <div className="flex flex-wrap">
                              <span className="text-green-700 font-medium">Calle: </span>
                              <span className="text-gray-800 ml-1">
                                {[currentAddress.street, currentAddress.streetNumber]
                                  .filter(Boolean)
                                  .join(' ')}
                              </span>
                            </div>
                          )}
                          {currentAddress.neighborhood && (
                            <div className="flex flex-wrap">
                              <span className="text-green-700 font-medium">Colonia: </span>
                              <span className="text-gray-800 ml-1">{currentAddress.neighborhood}</span>
                            </div>
                          )}
                          {currentAddress.city && (
                            <div className="flex flex-wrap">
                              <span className="text-green-700 font-medium">Ciudad: </span>
                              <span className="text-gray-800 ml-1">
                                {[currentAddress.city, currentAddress.state].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          <div className="pt-1.5 sm:pt-2 border-t border-green-200">
                            <span className="text-[10px] sm:text-xs text-green-700 break-all">
                              Coordenadas: {markerPosition.lat.toFixed(7)}, {markerPosition.lng.toFixed(7)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <button
                      onClick={handleConfirm}
                      disabled={isGeocoding}
                      className="w-full bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Check className="size-4 sm:size-5" />
                      Confirmar ubicación
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isGeocoding}
                      className="w-full text-[#4c4c4c] font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base"
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
