import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Coords = {
  lat: number;
  lng: number;
};

export function haversineDistance(coords1: Coords, coords2: Coords): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
  const dLon = (coords2.lng - coords1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * (Math.PI / 180)) *
      Math.cos(coords2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export function estimateTravelTime(distance: number): string {
  const walkingSpeedKmh = 5;
  const drivingSpeedKmh = 30; // Urban average

  if (distance < 3) {
    const timeMinutes = Math.round((distance / walkingSpeedKmh) * 60);
    return `${timeMinutes} min walking`;
  } else {
    const timeMinutes = Math.round((distance / drivingSpeedKmh) * 60);
    return `${timeMinutes} min by car`;
  }
}
