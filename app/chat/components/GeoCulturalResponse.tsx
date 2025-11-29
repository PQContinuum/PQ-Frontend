'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation, LocateFixed, Building, Star } from 'lucide-react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

// Define the types for the data passed to the component
type Place = {
  name: string;
  description: string;
  distance: string;
  travel_time: string;
  lat: number;
  lng: number;
  rating?: number;
  detailedDescription?: string;
  photos?: string[];
};

type Coords = {
  lat: number;
  lng: number;
};

type GeoCulturalData = {
  reply: string;
  places: Place[];
  userCoords: Coords;
  userAreaName?: string;
};

type GeoCulturalResponseProps = {
  data: GeoCulturalData;
};

// MapControl component to programmatically move the map
const MapControl = ({ selectedPlace, userCoords }: { selectedPlace: Place | null, userCoords: Coords }) => {
  const map = useMap();

  useEffect(() => {
    if (map && selectedPlace) {
      map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      map.setZoom(15);
    } else if (map) {
      map.panTo(userCoords);
      map.setZoom(13);
    }
  }, [selectedPlace, map, userCoords]);

  return null;
};


// Main Component
export function GeoCulturalResponse({ data }: GeoCulturalResponseProps) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
        <p className="font-bold">Error de Configuración</p>
        <p className="text-sm">La clave de API de Google Maps no está configurada en el frontend. Por favor, añade `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` a tu archivo `.env.local`.</p>
      </div>
    );
  }

  // If there are no places, show a friendly message.
  if (!data.places || data.places.length === 0) {
    return (
       <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose prose-sm max-w-none prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-black"
        >
          <p>{data.reply}</p>
        </motion.div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="space-y-6 w-full">
        {/* 1. AI-generated textual reply */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose prose-sm max-w-none prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-black"
        >
          <p>{data.reply}</p>
        </motion.div>

        {/* 2. Main container for Map and Places (Single Column Layout) */}
        <div className="flex flex-col gap-6">
          {/* Interactive Map (Full Width) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-full h-[40vh] rounded-2xl border border-black/10 shadow-lg overflow-hidden"
          >
            <Map
              mapId={'bf51a910020fa25a'}
              defaultCenter={data.userCoords}
              defaultZoom={13}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              <MapControl selectedPlace={selectedPlace} userCoords={data.userCoords} />
              {/* User's Location Marker - Enhanced */}
              <AdvancedMarker position={data.userCoords}>
                <div className="relative">
                  {/* Pulsing ring animation */}
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40" />
                  {/* Main marker */}
                  <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-full shadow-lg border-2 border-white">
                    <LocateFixed className="text-white size-5" />
                  </div>
                </div>
              </AdvancedMarker>

              {/* Recommended Places Markers */}
              {data.places.map((place) => (
                <AdvancedMarker
                  key={place.name}
                  position={place}
                  onClick={() => setSelectedPlace(place)}
                >
                  <Pin
                    background={selectedPlace?.name === place.name ? '#facc15' : '#00552b'}
                    borderColor={selectedPlace?.name === place.name ? '#eab308' : '#003d1f'}
                    glyphColor={selectedPlace?.name === place.name ? '#000' : '#fff'}
                  />
                </AdvancedMarker>
              ))}

              {/* Enhanced InfoWindow for selected place */}
              {selectedPlace && (
                <InfoWindow
                  position={selectedPlace}
                  onCloseClick={() => setSelectedPlace(null)}
                >
                  <div className="max-w-[280px] p-1">
                    {/* Photo if available */}
                    {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedPlace.photos[0]}
                        alt={selectedPlace.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}

                    {/* Place name */}
                    <h3 className="font-bold text-base text-[#111] mb-2">{selectedPlace.name}</h3>

                    {/* Rating */}
                    {selectedPlace.rating && selectedPlace.rating > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-gray-800">{selectedPlace.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Detailed description if available */}
                    {selectedPlace.detailedDescription && (
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{selectedPlace.detailedDescription}</p>
                    )}

                    {/* Distance and travel time */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1">
                        <Navigation className="size-3 text-[#00552b]" />
                        <span>{selectedPlace.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-[#00552b]" />
                        <span>{selectedPlace.travel_time}</span>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </motion.div>

          {/* User Location Info Card */}
          {data.userAreaName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200"
            >
              <div className="bg-blue-500 p-2 rounded-full">
                <MapPin className="size-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium mb-0.5">Tu ubicación</p>
                <p className="text-sm font-bold text-blue-900">{data.userAreaName}</p>
              </div>
            </motion.div>
          )}

          {/* List of Recommended Places */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col space-y-3"
          >
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Building className="size-4 text-[#00552b]" />
              <span>Recomendaciones Cercanas</span>
            </h3>
            {data.places.map((place) => (
              <motion.div
                key={place.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + data.places.indexOf(place) * 0.1 }}
                onClick={() => setSelectedPlace(place)}
                className={`group relative overflow-hidden rounded-xl border bg-white transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
                  selectedPlace?.name === place.name
                    ? 'border-[#00552b] shadow-lg ring-2 ring-[#00552b]/20'
                    : 'border-black/10 hover:border-[#00552b]/30'
                }`}
              >
                {/* Photo gallery if available */}
                {place.photos && place.photos.length > 0 && (
                  <div className="relative h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={place.photos[0]}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {place.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <span>+{place.photos.length - 1}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={`space-y-3 ${place.photos ? 'p-4' : 'p-4'}`}>
                  {/* Title and rating row */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-[#111111] group-hover:text-[#00552b] transition-colors flex-1 text-base">
                      {place.name}
                    </h4>
                    {place.rating && place.rating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg shrink-0">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-800">{place.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Detailed description if available */}
                  {place.detailedDescription && (
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                      {place.detailedDescription}
                    </p>
                  )}

                  {/* Basic description (type info) */}
                  {!place.detailedDescription && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {place.description}
                    </p>
                  )}

                  {/* Distance, time, and action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Navigation className="size-3.5 text-[#00552b]" />
                        <span className="font-medium">{place.distance}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="size-3.5 text-[#00552b]" />
                        <span className="font-medium">{place.travel_time}</span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#00552b] opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver en mapa →
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </APIProvider>
  );
}