import React, {useContext, useEffect, useRef, useState} from 'react';
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
  subscribeToActiveTrip,
  getSocket,
} from '../../utils/socket';
import {postTripRoutesFor} from '../../utils/navigationRef';
import TripChat from './TripChat';
import useTripChat from './useTripChat';
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
  // tripCompleted and a null active_trip sync can both report the same
  // ending (the event lands just before a reconnect) — alert only once.
  const endedRef = useRef(false);
  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;
  const myRole = isDriver === null ? null : isDriver ? 'driver' : 'passenger';
  const chat = useTripChat(tripData?.tripId, myRole);
  const closeChat = chat.close;

  useEffect(() => {
    const init = async () => {
      try {
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
            const routes = postTripRoutesFor(driverRole);
            navigation.reset({index: routes.length - 1, routes});
          }
        }
      } catch (error) {
        // Without this, a failed getUser()/getActiveTrip() (e.g. a network
        // blip) would leave the screen stuck blank forever — isDriver never
        // leaves its initial `null`, so the loading-state early return below
        // never resolves either way.
        Alert.alert('Something went wrong', 'Could not load this trip. Please try again.', [
          // Role may be unknown here — Splash works out where to land.
          {text: 'OK', onPress: () => navigation.reset({index: 0, routes: [{name: 'Splash'}]})},
        ]);
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
    const endTrip = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      // The chat modal would otherwise sit on top of the alert; the server
      // rejects messages for a completed trip anyway.
      closeChat();
      Alert.alert('Trip Completed', 'This trip has ended.', [
        {
          text: 'OK',
          onPress: () => {
            const routes = postTripRoutesFor(isDriver);
            navigation.reset({index: routes.length - 1, routes});
          },
        },
      ]);
    };
    listenForTripCompleted(endTrip);
    // After every reconnect the server re-sends this user's trip from
    // Postgres. A trip refreshes what's on screen; null while a trip is
    // showing means it was completed while this device was offline and the
    // tripCompleted event above was missed.
    const unsubscribe = subscribeToActiveTrip(trip => {
      if (trip) {
        setTripData(trip);
      } else if (tripDataRef.current) {
        endTrip();
      }
    });
    return () => {
      getSocket()?.off('tripCompleted');
      unsubscribe();
    };
  }, [isDriver, closeChat]);

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

      <TouchableOpacity
        style={[styles.chatButton, isDriver && styles.chatButtonAboveComplete]}
        onPress={chat.open}>
        <Text style={styles.chatButtonText}>Chat</Text>
        {chat.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{chat.unreadCount > 9 ? '9+' : chat.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TripChat
        visible={chat.isOpen}
        onClose={chat.close}
        chat={chat}
        myRole={myRole}
        otherPartyName={otherParty?.name}
      />

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
