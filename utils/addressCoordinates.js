import apiClient from './apiClient';

// Proxied through the backend (see be/cab_booking_be/routes/geocodeRoutes.js)
// rather than calling a geocoding provider directly from the app — this
// picked up the shared Authorization header/401-refresh handling for free,
// and keeps the Google API key server-side instead of shipping it inside the
// compiled JS bundle.

export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await apiClient.get('/geocode/reverse', {
      params: {latitude, longitude},
    });
    return response.data?.data?.address || 'Unknown Location';
  } catch (error) {
    console.error('Geocoding Error:', error);
    return 'Unknown Location';
  }
};

export const getCoordinatesFromAddress = async address => {
  try {
    if (!address || address.trim() === '') {
      return null;
    }

    const response = await apiClient.get('/geocode/search', {
      params: {address},
    });
    const result = response.data?.data;

    if (!result) {
      console.error('No results found for address:', address);
      return null;
    }

    return {latitude: result.latitude, longitude: result.longitude};
  } catch (error) {
    console.error('Geocoding Error:', error);
    return null;
  }
};
