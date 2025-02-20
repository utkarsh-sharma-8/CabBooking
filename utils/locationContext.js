import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import {getCurrentLocation} from '../utils/permission'; // Your existing location function

// Create Context
export const LocationContext = createContext();

// Create Provider Component
export const LocationProvider = ({children}) => {
  const [location, setLocation] = useState({
    latitude: 28.6139, // Default New Delhi
    longitude: 77.209,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    let watchId = null; // To store the location watch reference

    const loadLocation = async () => {
      try {
        const lat = await AsyncStorage.getItem('latitude');
        const lng = await AsyncStorage.getItem('longitude');

        if (lat && lng) {
          setLocation({
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        } else {
          // Fetch fresh location if not in storage
          getCurrentLocation(
            async newLocation => {
              setLocation(newLocation);
              await AsyncStorage.setItem(
                'latitude',
                newLocation.latitude.toString(),
              );
              await AsyncStorage.setItem(
                'longitude',
                newLocation.longitude.toString(),
              );
            },
            error => console.error('❌ Location error:', error),
          );
        }
      } catch (error) {
        console.error('❌ Error loading location:', error);
      }
    };

    // ✅ Start Watching for Live Location Updates
    const startLocationUpdates = () => {
      watchId = Geolocation.watchPosition(
        async position => {
          const {latitude, longitude} = position.coords;

          // ✅ Update location state
          setLocation({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });

          // ✅ Store new location in AsyncStorage
          await AsyncStorage.setItem('latitude', latitude.toString());
          await AsyncStorage.setItem('longitude', longitude.toString());
        },
        error => {
          console.error('❌ Live location error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update only when moving 10 meters
        },
      );
    };

    loadLocation(); // Load initial location from storage or fetch a fresh one
    startLocationUpdates(); // Start live tracking

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId); // ✅ Stop tracking on unmount
      }
    };
  }, []);

  return (
    <LocationContext.Provider value={{location, setLocation}}>
      {children}
    </LocationContext.Provider>
  );
};
