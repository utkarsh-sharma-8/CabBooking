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
import styles from './splashStyle';
import {hasStoredSession, getUser} from '../../utils/authStorage';
import {bootstrapSession} from '../../utils/apiClient';
import {connectSocket} from '../../utils/socket';
import {endSession} from '../../utils/session';
import {getActiveTrip} from '../../utils/tripApi';

export default function Splash() {
  const navigation = useNavigation();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasSession = await hasStoredSession();
        if (!hasSession) {
          navigation.replace('Auth');
          return;
        }

        const refreshed = await bootstrapSession();
        if (!refreshed) {
          await endSession();
          return;
        }

        connectSocket();
        const user = await getUser();

        // A killed-and-reopened app shouldn't lose an in-progress trip —
        // check for one before falling through to the normal idle screen.
        const activeTrip = await getActiveTrip();
        if (activeTrip) {
          navigation.replace('TripScreen', activeTrip);
          return;
        }

        navigation.replace(user?.isDriver ? 'DriverScreen' : 'FirstScreen');
      } catch (error) {
        console.log(`error at splash is ${error}`);
        navigation.replace('Auth');
      }
    };
    const timer = setTimeout(checkAuth, 1500); // Splash duration
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
