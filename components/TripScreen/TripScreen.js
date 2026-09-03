import React, {useContext, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useNavigation, useRoute} from '@react-navigation/native';
import {LocationContext} from '../../utils/locationContext';
import {getUser} from '../../utils/authStorage';
import {getActiveTrip} from '../../utils/tripApi';
import {
  completeTrip,
  listenForTripDriverLocation,
  listenForTripCompleted,
  getSocket,
} from '../../utils/socket';
import styles from './TripScreenStyle';

// Shown to both driver and passenger once matched. Role is self-derived
// (same pattern Splash.js already uses) rather than passed as a nav param,
// so every navigation.navigate('TripScreen', {...}) call site only needs to
// pass trip data, not know about roles.
export default function TripScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {location} = useContext(LocationContext);
  const [isDriver, setIsDriver] = useState(null);
  const [tripData, setTripData] = useState(route.params?.tripId ? route.params : null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const user = await getUser();
      const driverRole = !!user?.isDriver;
      setIsDriver(driverRole);

      // Defensive self-fetch — covers reaching this screen without nav
      // params (the resume-after-reconnect path, or a direct deep link).
      if (!route.params?.tripId) {
        const active = await getActiveTrip();
        if (active) {
          setTripData(active);
        } else {
          navigation.replace(driverRole ? 'DriverScreen' : 'FirstScreen');
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isDriver === false) {
      listenForTripDriverLocation(data => {
        setDriverPosition({latitude: data.latitude, longitude: data.longitude});
      });
    }
    return () => {
      getSocket()?.off('trip_driver_location');
    };
  }, [isDriver]);

  useEffect(() => {
    if (isDriver === null) return;
    listenForTripCompleted(() => {
      Alert.alert('Trip Completed', 'This trip has ended.', [
        {
          text: 'OK',
          onPress: () => navigation.replace(isDriver ? 'DriverScreen' : 'FirstScreen'),
        },
      ]);
    });
    return () => {
      getSocket()?.off('tripCompleted');
    };
  }, [isDriver]);

  const handleCompleteTrip = () => {
    if (!tripData?.tripId || completing) return;
    setCompleting(true);
    completeTrip(tripData.tripId);
    // listenForTripCompleted (above) handles the alert + navigation once the
    // server confirms — completing just guards against double-tapping.
  };

  if (isDriver === null || !tripData) {
    return <View style={styles.container} />;
  }

  const otherParty = isDriver ? tripData.passenger : tripData.driver;
  const mapCenter = isDriver
    ? location
    : driverPosition || tripData.pickupLocation || location;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}>
        {!isDriver && driverPosition && (
          <Marker coordinate={driverPosition} title="Driver" pinColor="gold" />
        )}
        {tripData.pickupLocation && (
          <Marker coordinate={tripData.pickupLocation} title="Pickup" />
        )}
        {tripData.destinationLocation && (
          <Marker coordinate={tripData.destinationLocation} title="Destination" pinColor="blue" />
        )}
      </MapView>

      <View style={styles.statusCard}>
        <Text style={styles.statusText}>
          {isDriver ? 'Trip in progress' : 'Driver is on the way'}
        </Text>
        {otherParty && (
          <>
            <Text style={styles.partyName}>{otherParty.name}</Text>
            <Text style={styles.partyDetail}>{otherParty.phone}</Text>
            {otherParty.car_no && <Text style={styles.partyDetail}>{otherParty.car_no}</Text>}
          </>
        )}
      </View>

      {isDriver && (
        <TouchableOpacity
          style={[styles.completeButton, completing && styles.completeButtonDisabled]}
          onPress={handleCompleteTrip}
          disabled={completing}>
          <Text style={styles.completeButtonText}>
            {completing ? 'Completing...' : 'Complete Trip'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
