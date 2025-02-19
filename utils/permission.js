import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app requires access to your location.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // iOS permissions are handled automatically
};

export const getCurrentLocation = async (onSuccess, onError) => {
  const hasPermission = await requestLocationPermission();
  if (hasPermission) {
    Geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        onSuccess(location);
      },
      (error) => {
        console.error("Location Error:", error);
        if (onError) onError(error);
      },
      { enableHighAccuracy: true, timeout: 100000, maximumAge: 10000 }
    );
  } else {
    console.log("Location permission denied");
  }
};
