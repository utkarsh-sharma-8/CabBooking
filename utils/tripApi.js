import apiClient from './apiClient';

// Backend stores pickup/destination as GeoJSON ({type, coordinates:[lng,lat]});
// everywhere else in the app (socket payloads, local screen state) uses plain
// {latitude, longitude} — normalize here so callers never have to care which
// shape a given trip's location data originally came from.
function toLatLng(geoPoint) {
  if (!geoPoint?.coordinates) {return null;}
  const [longitude, latitude] = geoPoint.coordinates;
  return {latitude, longitude};
}

// Same trip shape arrives from GET /trips/active and the socket's on-connect
// `active_trip` push (see socket.js) — both go through here.
export const normalizeTrip = trip => {
  if (!trip) {return null;}
  return {
    ...trip,
    pickupLocation: toLatLng(trip.pickupLocation),
    destinationLocation: toLatLng(trip.destinationLocation),
  };
};

// Called once at app boot (see Splash.js) to check whether the current user
// has an in-progress trip — lets a killed-and-reopened app resume TripScreen
// instead of losing all trace of it.
export const getActiveTrip = async () => {
  const response = await apiClient.get('/trips/active');
  return normalizeTrip(response.data?.data);
};

// Recent trips in one role plus completed-trip counts — feeds the Home and
// DriverHome dashboards. role: 'driver' | 'passenger'.
export const getTripHistory = async (role, limit = 10) => {
  const response = await apiClient.get('/trips/history', {params: {role, limit}});
  const data = response.data?.data;
  return {
    trips: (data?.trips || []).map(normalizeTrip),
    summary: data?.summary || {totalCompleted: 0, completedToday: 0},
  };
};
