import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from './splashStyle';
export default function Splash() {
const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      // navigation.replace("Auth");  // Corrected navigation method
      navigation.replace("FirstScreen");  // Corrected navigation method

     
    }, 2000);  // Splash screen duration

    return () => clearTimeout(timer);  // Cleanup timer
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
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading amazing rides for you...</Text>
      </View>
    </View>
  );
}