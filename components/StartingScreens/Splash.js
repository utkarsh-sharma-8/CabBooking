import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './splashStyle';
import { getCurrentLocation } from '../../utils/permission';  // Import the utility
export default function Splash() {
const navigation = useNavigation();

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     requestLocationPermission();
  //     navigation.replace("Auth");  // Corrected navigation method
  //     // navigation.replace("FirstScreen");  // Corrected navigation method
  //     // navigation.replace("DriverScreen");  // Corrected navigation method


     
  //   }, 2000);  // Splash screen duration

  //   return () => clearTimeout(timer);  // Cleanup timer
  // }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fetch the user's location before navigating
      getCurrentLocation(
        async (location) => {
          console.log("User location:", location);
          // Save the location to AsyncStorage if needed
          await AsyncStorage.setItem('latitude', location.latitude.toString());
          await AsyncStorage.setItem('longitude', location.longitude.toString());

          navigation.replace("Auth");  // Navigate after fetching location
        },
        (error) => {
          console.error("Failed to fetch location", error);
          navigation.replace("Auth");  // Navigate even if location fails
        }
      );
    }, 3000);  // Splash duration

    return () => clearTimeout(timer);  // Cleanup the timer
  }, []);
  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🚕</Text>
        </View>
        <Text style={styles.appName}>RideNow</Text>
      </View>

      {/* Tagline */}
      <Text style={styles.tagline}>Your ride, your way</Text>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        {/* <ActivityIndicator size="large" color="#FFD700" /> */}
        <Text style={styles.loadingText}>Welcome To The RideNow</Text>
      </View>
    </View>
  );
}