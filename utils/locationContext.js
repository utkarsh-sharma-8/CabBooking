import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation } from '../utils/permission'; // Your existing location function

// Create Context
export const LocationContext = createContext();

// Create Provider Component
export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    latitude: 28.6139, // Default New Delhi
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
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
            async (newLocation) => {
              setLocation(newLocation);
              await AsyncStorage.setItem('latitude', newLocation.latitude.toString());
              await AsyncStorage.setItem('longitude', newLocation.longitude.toString());
            },
            (error) => console.error("❌ Location error:", error)
          );
        }
      } catch (error) {
        console.error("❌ Error loading location:", error);
      }
    };

    loadLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
