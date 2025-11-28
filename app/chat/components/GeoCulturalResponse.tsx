'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation } from 'lucide-react';
import Image from 'next/image';

type Place = {
  name: string;
  description: string;
  distance: string;
  travel_time: string;
  lat: number;
  lng: number;
};

type GeoCulturalData = {
  reply: string;
  map: {
    provider: string;
    url: string;
  };
  places: Place[];
};

type GeoCulturalResponseProps = {
  data: GeoCulturalData;
};

export function GeoCulturalResponse({ data }: GeoCulturalResponseProps) {
  return (
    <div className="space-y-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="prose prose-sm max-w-none"
      >
        <p className="text-[15px] leading-relaxed text-black">{data.reply}</p>
      </motion.div>

      {data.map && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-black/10 shadow-lg h-64"
        >
          <Image
            src={data.map.url}
            alt="Mapa cultural"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-[#00552b] border border-[#00552b]/20 z-10">
            {data.map.provider === 'google' ? 'Google Maps' : 'Mapbox'}
          </div>
        </motion.div>
      )}

      {data.places && data.places.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
            <MapPin className="size-4 text-[#00552b]" />
            Lugares recomendados
          </h3>
          <div className="grid gap-3">
            {data.places.map((place, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="group relative overflow-hidden rounded-xl border border-black/10 bg-gradient-to-br from-white to-[#f6f6f6] p-4 transition-all hover:shadow-lg hover:border-[#00552b]/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00552b]/0 via-[#00552b]/5 to-[#00552b]/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative space-y-2">
                  <h4 className="font-semibold text-[#111111] group-hover:text-[#00552b] transition-colors">
                    {place.name}
                  </h4>
                  <p className="text-sm text-[#4c4c4c] leading-relaxed">
                    {place.description}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#00552b] bg-[#00552b]/10 px-3 py-1 rounded-full">
                      <Navigation className="size-3" />
                      <span className="font-medium">{place.distance}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#00552b] bg-[#00552b]/10 px-3 py-1 rounded-full">
                      <Clock className="size-3" />
                      <span className="font-medium">{place.travel_time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
