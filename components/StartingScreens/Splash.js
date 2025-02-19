import React, {useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './splashStyle';
import {getCurrentLocation} from '../../utils/permission'; // Import the utility
export default function Splash() {
  const navigation = useNavigation();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const isDriver = await AsyncStorage.getItem('isDriver');
        if (isDriver) {
          navigation.replace('DriverScreen');
        } else if (token) {
          navigation.replace('FirstScreen');
        } else {
          navigation.replace('Auth');
        }
      } catch (error) {
        console.log(`error at splash is ${error}`);
      }
    };
    const timer = setTimeout(checkAuth, 3000); // Splash duration
    return () => clearTimeout(timer);
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
