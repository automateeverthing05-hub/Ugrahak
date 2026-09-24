/**
 * Calculates Great-Circle Distance between two coordinates in meters using Haversine Formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Checks if a customer is within the target radius (100–200 meters) of merchant
 */
export function isWithinNearbyRadius(
  customerLat: number,
  customerLon: number,
  merchantLat: number,
  merchantLon: number,
  radiusMeters = 200
): { isNearby: boolean; distanceMeters: number } {
  const distance = calculateDistanceMeters(
    customerLat,
    customerLon,
    merchantLat,
    merchantLon
  );

  return {
    isNearby: distance <= radiusMeters,
    distanceMeters: Math.round(distance),
  };
}

