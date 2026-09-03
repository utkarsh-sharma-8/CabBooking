import apiClient from './apiClient';

// Backend stores pickup/destination as GeoJSON ({type, coordinates:[lng,lat]});
// everywhere else in the app (socket payloads, local screen state) uses plain
// {latitude, longitude} — normalize here so callers never have to care which
// shape a given trip's location data originally came from.
function toLatLng(geoPoint) {
  if (!geoPoint?.coordinates) return null;
  const [longitude, latitude] = geoPoint.coordinates;
  return {latitude, longitude};
}

// Called once at app boot (see Splash.js) to check whether the current user
// has an in-progress trip — lets a killed-and-reopened app resume TripScreen
// instead of losing all trace of it.
export const getActiveTrip = async () => {
  const response = await apiClient.get('/trips/active');
  const trip = response.data?.data;
  if (!trip) return null;

  return {
    ...trip,
    pickupLocation: toLatLng(trip.pickupLocation),
    destinationLocation: toLatLng(trip.destinationLocation),
  };
};
