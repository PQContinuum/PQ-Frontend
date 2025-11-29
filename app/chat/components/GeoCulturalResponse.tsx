'use client';

import { useState, useMemo, useRef } from 'react';
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
  rating?: number; // Rating is now included
};

type Coords = {
  lat: number;
  lng: number;
};

type GeoCulturalData = {
  reply: string;
  places: Place[];
  userCoords: Coords;
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
              {/* User's Location Marker */}
              <AdvancedMarker position={data.userCoords}>
                <LocateFixed className="text-blue-600 size-8 p-1 bg-white rounded-full shadow-md" />
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

              {/* InfoWindow for selected place */}
              {selectedPlace && (
                <InfoWindow
                  position={selectedPlace}
                  onCloseClick={() => setSelectedPlace(null)}
                >
                  <p className="font-bold text-sm text-[#111]">{selectedPlace.name}</p>
                </InfoWindow>
              )}
            </Map>
          </motion.div>

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
                className={`group relative overflow-hidden rounded-xl border bg-white p-4 transition-all hover:shadow-lg hover:border-green-300 cursor-pointer ${selectedPlace?.name === place.name ? 'border-green-500 shadow-md' : 'border-black/10'}`}
              >
                <div className="space-y-2">
                  <h4 className="font-semibold text-[#111111] group-hover:text-[#00552b] transition-colors">
                    {place.name}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {place.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs">
                     {place.rating && (
                       <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                         <Star className="size-4 text-yellow-500" />
                         <span>{place.rating.toFixed(1)}</span>
                       </div>
                     )}
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Navigation className="size-3 text-[#00552b]" />
                      <span className="font-medium">{place.distance}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Clock className="size-3 text-[#00552b]" />
                      <span className="font-medium">{place.travel_time}</span>
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