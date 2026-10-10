jest.mock('../apiClient', () => ({get: jest.fn()}));

import apiClient from '../apiClient';
import {getActiveTrip} from '../tripApi';

describe('getActiveTrip', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns null when there is no active trip', async () => {
    apiClient.get.mockResolvedValue({data: {success: true, data: null}});
    await expect(getActiveTrip()).resolves.toBeNull();
  });

  test('converts GeoJSON [lng, lat] points to {latitude, longitude} for both locations', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          tripId: 't1',
          status: 'active',
          pickupLocation: {type: 'Point', coordinates: [77.209, 28.6139]},
          destinationLocation: {type: 'Point', coordinates: [72.8777, 19.076]},
          driver: {phone: '+911111111111', name: 'D'},
          passenger: {phone: '+912222222222', name: 'P'},
        },
      },
    });

    const trip = await getActiveTrip();

    expect(trip.pickupLocation).toEqual({latitude: 28.6139, longitude: 77.209});
    expect(trip.destinationLocation).toEqual({latitude: 19.076, longitude: 72.8777});
    // Non-location fields pass through untouched.
    expect(trip.tripId).toBe('t1');
    expect(trip.driver).toEqual({phone: '+911111111111', name: 'D'});
  });

  test('a location that was never set (no coordinates) normalizes to null, not [0,0]', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        success: true,
        data: {tripId: 't1', status: 'active', pickupLocation: undefined, destinationLocation: undefined},
      },
    });

    const trip = await getActiveTrip();

    expect(trip.pickupLocation).toBeNull();
    expect(trip.destinationLocation).toBeNull();
  });
});
