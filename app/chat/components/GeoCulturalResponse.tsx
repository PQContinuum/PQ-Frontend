'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation, LocateFixed, Building } from 'lucide-react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';

// Define the types for the data passed to the component
type Place = {
  name: string;
  description: string;
  distance: string;
  travel_time: string;
  lat: number;
  lng: number;
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

        {/* 2. Main container for Map and Places */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px] md:h-[450px]">
          {/* Interactive Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-full h-full rounded-2xl border border-black/10 shadow-lg overflow-hidden"
          >
            <Map
              mapId={'bf51a910020fa25a'}
              defaultCenter={data.userCoords}
              defaultZoom={13}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              {/* User's Location Marker */}
              <AdvancedMarker position={data.userCoords}>
                <LocateFixed className="text-blue-600 size-7" />
              </AdvancedMarker>

              {/* Recommended Places Markers */}
              {data.places.map((place) => (
                <AdvancedMarker
                  key={place.name}
                  position={place}
                  onClick={() => setSelectedPlace(place)}
                >
                  <Pin
                    background={'#00552b'}
                    borderColor={'#003d1f'}
                    glyphColor={'#ffffff'}
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
            className="flex flex-col space-y-3 overflow-y-auto pr-2"
          >
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Building className="size-4 text-[#00552b]" />
              <span>Recomendaciones Culturales</span>
            </h3>
            {data.places.map((place) => (
              <motion.div
                key={place.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + data.places.indexOf(place) * 0.1 }}
                onClick={() => setSelectedPlace(place)}
                className="group relative overflow-hidden rounded-xl border border-black/10 bg-white p-4 transition-all hover:shadow-lg hover:border-[#00552b]/30 cursor-pointer"
              >
                <div className="space-y-2">
                  <h4 className="font-semibold text-[#111111] group-hover:text-[#00552b] transition-colors">
                    {place.name}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {place.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs">
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