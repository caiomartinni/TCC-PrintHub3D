import { getDistance, convertDistance } from 'geolib';
import { GeoPoint } from '../types/index.js';

export interface MakerWithDistance {
  id: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

export const calculateDistance = (from: GeoPoint, to: GeoPoint): number => {
  const distanceInMeters = getDistance(
    { latitude: from.latitude, longitude: from.longitude },
    { latitude: to.latitude, longitude: to.longitude }
  );
  return convertDistance(distanceInMeters, 'km');
};

export const findNearestMakers = <T extends MakerWithDistance>(
  userLocation: GeoPoint,
  makers: T[],
  limit = 10,
  maxDistanceKm = 500
): Array<T & { distance: number }> => {
  const makersWithDistance = makers
    .filter((maker) => maker.latitude && maker.longitude)
    .map((maker) => ({
      ...maker,
      distance: calculateDistance(userLocation, {
        latitude: maker.latitude,
        longitude: maker.longitude,
      }),
    }))
    .filter((maker) => maker.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return makersWithDistance;
};

export const geocodeAddress = async (address: string): Promise<GeoPoint | null> => {
  // TODO: Integrate with Google Maps Geocoding API or ViaCEP + IBGE
  console.log('[GeoService] geocodeAddress - not yet integrated', address);
  return null;
};

export const getCoordinatesFromCEP = async (cep: string): Promise<GeoPoint | null> => {
  // TODO: Integrate with ViaCEP to get lat/lng from CEP
  // ViaCEP only returns address, lat/lng requires geocoding
  console.log('[GeoService] getCoordinatesFromCEP - not yet integrated', cep);
  return null;
};
