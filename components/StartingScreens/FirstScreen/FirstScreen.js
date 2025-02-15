import React, { useEffect, useState } from 'react';
import {Text, View, TextInput,  PermissionsAndroid, Platform, TouchableOpacity} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { requestRide, listenForRideAcceptance, disconnectSocket } from "../../../utils/socket";

import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
import styles from './FirstScreenStyle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchInitialData from './FirstScreenApi';
export default function FirstScreen() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [rideStatus,setRideStatus]=useState('');
  const [drivers,setDrivers]=useState([]);
  const [destinationCoords, setDestinationCoords] = useState(null); // Stor
  const [location, setLocation] = useState({
    latitude: 28.6139, // Default to New Delhi
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  useEffect(() => {
    listenForRideAcceptance((data) => {
      console.log("🚖 Ride Accepted:", data);
      setRideStatus(`Ride Confirmed with Driver ID: ${data.driverId}`);
    });
  
    return () => {
      disconnectSocket(); // Cleanup on unmount
    };
  }, []);
  useEffect(() => {
    // Create an interval to call the function every 10 seconds
    const interval = setInterval(() => {
      requestLocationPermission();
    }, 10000); // 10000 milliseconds = 10 seconds
  
    // Cleanup function to clear the interval when the component is unmounted
    return () => clearInterval(interval);
  }, []);
  async function requestLocationPermission() {
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
  
        if (granted === PermissionsAndroid.RESULTS.GRANTED || Platform.OS === 'ios') {
          console.log("Location permission granted");
  
          // Fetch current location
          Geolocation.getCurrentPosition(
            async (position) => {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              };
  
              setLocation(newLocation);
  
              // Save location to AsyncStorage
              await AsyncStorage.setItem('latitude', newLocation.latitude.toString());
              await AsyncStorage.setItem('longitude', newLocation.longitude.toString());
  
              // Log and call API
              console.log("Calling API with:", newLocation.latitude, newLocation.longitude);
              const fetchedDrivers = await fetchInitialData(newLocation.latitude, newLocation.longitude);
              
              setDrivers(fetchedDrivers); // Store driver data in state
              console.log("Drivers set in state:", fetchedDrivers);
            },
            (error) => {
              console.error("Location Error:", error);
            },
            { enableHighAccuracy: true, timeout: 100000, maximumAge: 10000 }
          );
        } else {
          console.log("Location permission denied");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }
  // const handleRequestRide = async() => {
  //   const passengerData = {
  //     passengerId: "721ca9cb-a830-43f8-a484-0ac1eff768e0",
  //     source: await getCoordinatesFromAddress(source), // User's live location
  //     destination: await getCoordinatesFromAddress(destinationCoords), // Entered destination coordinates
  //   };
  //   console.log(`passenger data is ${passengerData}`)
  
  //   setRideStatus("🔍 Searching for a driver...");
  
  //   requestRide(passengerData, (data) => {
  //     setRideStatus(`🚖 Ride Assigned! Driver ID: ${data.driverId}`);
  //   });
  // };
  const handleRequestRide = async () => {
    if (!source.trim() || !destinationCoords) {
      setRideStatus("❌ Please enter valid locations!");
      return;
    }
  
    setRideStatus("🔍 Searching for a driver...");
  
    // Wait for source and destination coordinates
    const sourceCoords = await getCoordinatesFromAddress(source);
    const destCoords = destinationCoords; // Already set from long press
  
    if (!sourceCoords || !destCoords) {
      setRideStatus("❌ Unable to find locations. Try again.");
      return;
    }
  
    const passengerData = {
      passengerId: "721ca9cb-a830-43f8-a484-0ac1eff768e0",
      source: sourceCoords, // User's pickup location
      destination: destCoords, // Destination from long press
    };
  
    console.log("Sending Request:", passengerData);
  
    requestRide(passengerData, (data) => {
      if (data && data.driverId) {
        setRideStatus(`🚖 Ride Assigned! Driver ID: ${data.driverId}`);
      } else {
        setRideStatus("❌ No drivers available. Try again later.");
      }
    });
  };
  
  
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name || "Unknown Location";
    } catch (error) {
      console.error("Geocoding Error:", error);
      return "Unknown Location";
    }
  };
  const getCoordinatesFromAddress = async (address) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();

        if (data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
        } else {
            throw new Error("Address not found");
        }
    } catch (error) {
        console.error("Geocoding Error:", error);
        return null; // Handle case where no coordinates are found
    }
};

  
  const handleLongPress = async(event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Set destination coordinates
    setDestinationCoords({ latitude, longitude });
    const address = await getAddressFromCoordinates(latitude, longitude);
    // Format coordinates for user-friendly display
    if(address){
      setDestination(address);
    }else{

    
    setDestination(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
    }
    console.log("Destination Set:", latitude, longitude);
  };    
  return (
    <View style={styles.container}>
      {/* Search Container */}
      <View style={styles.searchContainer}>
        <View style={styles.inputCard}>
          {/* Source Input */}
          <View style={styles.inputWrapper}>
            <Icon name="my-location" size={20} color="#FFD700" />
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location"
              value={source}
              onChangeText={setSource}
              placeholderTextColor="#666666"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Destination Input */}
          <View style={styles.inputWrapper}>
            <Icon name="location-on" size={24} color="#FF0000" />
            <TextInput
              style={styles.input}
              placeholder="Where to?"
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor="#666666"
            />
          </View>
        </View>
      </View>

      {/* Map View */}
      <MapView style={styles.map} region={location} showsUserLocation={true} followsUserLocation={false} onLongPress={handleLongPress}>
        {/* OpenStreetMap Tile Layer */}
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />

        {/* Current Location Marker */}
        <Marker coordinate={location} title="Your Location" />
        {destinationCoords && (
          <Marker 
             coordinate={destinationCoords}
             title="Destination" 
             pinColor="blue" // Change color to differentiate
           />
         )}
         {drivers.map((driver) => ( 
          <Marker 
             key={driver.id} 
             coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
             title={`Car: ${driver.car_no}`}
             description={`Driver: ${driver.name}`}
          >
           <Icon name="directions-car" size={30} color="black" />
          </Marker>
         ))}
      </MapView>

      {/* Bottom Sheet */}
      <TouchableOpacity 
  style={styles.bottomSheet} 
  onPress={handleRequestRide}
>
  <Text style={styles.bottomSheetText}>Search</Text>
</TouchableOpacity>
    </View>
  );
}

