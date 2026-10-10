import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useContext, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Alert, Button, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LocationContext } from '../../../utils/locationContext'; //Use Location Context
import { listenForRideRequests, registerDriver, updateDriverLocation, acceptRide, getSocket, goOffline } from '../../../utils/socket';
import { getUser } from '../../../utils/authStorage';

// The driver is ONLINE for as long as this screen is open: it registers on
// mount, and leaving it any way other than into a trip (the top bar's back
// button, "Go offline", Android back) goes offline first — see beforeRemove
// below. DriverHome, underneath it in the stack, is the offline state.
export default function DriverScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const leavingRef = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const {location} = useContext(LocationContext);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [phone, setPhone] = useState('');
  useEffect(() => {
    const loadPhoneAndRegister = async () => {
      const user = await getUser();
      if (user?.phone) {
        setPhone(user.phone); //This will update state
        registerDriver({ phone: user.phone, latitude: location.latitude, longitude: location.longitude });
      }else{
        console.log(`No stored user found — driver is not registered`);
      }
    };
    loadPhoneAndRegister();
  }, []); // Runs once when component mounts
  useEffect(() => {
    if (!phone) return; //Ensure phone is loaded before sending updates

    //Send location updates via WebSocket when location changes
    updateDriverLocation(phone, location.latitude, location.longitude);
  }, [location, phone]); //Runs whenever `location` or `phone` updates
  useEffect(() => {
    if (!phone) return; //Ensure phone is loaded before listening

    // ✅ Listen for ride requests from passengers
    listenForRideRequests((requestData) => {
      console.log("New Ride Request:", requestData);
      setCurrentRequest(requestData)
      setShowRequestModal(true);
    });

    return () => {
      getSocket()?.off("rideRequest"); //Cleanup listener on unmount
    };
  }, [phone]); // Must re-run once `phone` actually resolves (it starts empty)

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      const {action} = e.data;
      // Into a trip (accept replaces this screen) the driver must stay
      // registered — live trip tracking depends on it. A RESET is logout or
      // a session ending; the socket is being torn down anyway.
      if (action.type === 'RESET' || (action.type === 'REPLACE' && action.payload?.name === 'TripScreen')) {
        return;
      }
      if (leavingRef.current) return; // second pass, after going offline
      e.preventDefault();
      setLeaving(true);
      goOffline().then(reply => {
        setLeaving(false);
        if (!reply?.ok) {
          Alert.alert('Still online', reply?.error || 'Could not go offline. Please try again.');
          return;
        }
        leavingRef.current = true;
        navigation.dispatch(action);
      });
    });
  }, [navigation]);

  const handleGoOffline = () => {
    if (leaving) return;
    // DriverHome is normally underneath; after a resumed trip it may not be.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('DriverHome');
    }
  };

  const recenter = () => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 400);
  };

  const handleAcceptRide = () => {
    if (!currentRequest) return;
    acceptRide(
      phone,
      currentRequest.passengerId,
      currentRequest.pickupLocation,
      currentRequest.destinationLocation,
      data => {
        // replace, not navigate: TripScreen hands back to a fresh
        // [DriverHome, DriverScreen] stack when the trip ends.
        navigation.replace('TripScreen', {
          tripId: data?.tripId,
          driver: null,
          passenger: data?.passenger || null,
          pickupLocation: currentRequest.pickupLocation,
          destinationLocation: currentRequest.destinationLocation,
        });
      },
      error => {
        Alert.alert('Could not start trip', error?.message || 'Please try again.');
        // Only a transient failure is worth retrying; a ride that's gone to
        // another trip (retryable: false) is dropped.
        if (error?.retryable) {
          setShowRequestModal(true);
        } else {
          setCurrentRequest(null);
        }
      },
    );
    setShowRequestModal(false);
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            description="You Are Here"
          />
        </MapView>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, {top: insets.top + 10}]}>
        <TouchableOpacity style={styles.roundButton} onPress={handleGoOffline} accessibilityLabel="Back to dashboard">
          <Icon name="arrow-back" size={22} color="#1E1E1E" />
        </TouchableOpacity>
        <View style={styles.statusPill}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusPillText}>Online</Text>
        </View>
        <TouchableOpacity style={styles.roundButton} onPress={recenter} accessibilityLabel="Recenter map">
          <Icon name="my-location" size={22} color="#1E1E1E" />
        </TouchableOpacity>
      </View>

      {/* Bottom status card */}
      <View style={[styles.bottomCard, {paddingBottom: insets.bottom + 18}]}>
        <View style={styles.handle} />
        <View style={styles.searchingRow}>
          <ActivityIndicator color="#B8860B" />
          <View style={styles.searchingTextWrap}>
            <Text style={styles.searchingTitle}>Finding rides near you</Text>
            <Text style={styles.searchingSubtitle}>Keep this screen open to receive requests</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.offlineButton, leaving && styles.offlineButtonDisabled]}
          onPress={handleGoOffline}
          disabled={leaving}
          activeOpacity={0.85}>
          {leaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="power-settings-new" size={20} color="#FFFFFF" />
              <Text style={styles.offlineButtonText}>Go offline</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {/* Ride Request Modal */}
      <Modal visible={showRequestModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Ride Request!</Text>
            {currentRequest && (
              <>
                <Text style={styles.modalText}>Source:{(`${currentRequest.pickupLocation.latitude},${currentRequest.pickupLocation.longitude}`)}</Text>
                <Text style={styles.modalText}>Destination:{(`${currentRequest.destinationLocation.latitude},${currentRequest.destinationLocation.longitude}`)}</Text>

                <Text style={styles.modalText}>
                  Distance: {currentRequest.distance} km
                </Text>
                <Text style={styles.modalText}>
                  Estimated fare: ${currentRequest.estimatedFare}
                </Text>
                <View style={styles.buttonContainer}>
                  <Button title="Accept" onPress={handleAcceptRide} />
                  <Button title="Decline" onPress={() => setShowRequestModal(false)} color="red" />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 22,
    paddingHorizontal: 18,
    height: 44,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginBottom: 14,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchingTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  searchingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  searchingSubtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 12,
    height: 50,
    marginTop: 18,
  },
  offlineButtonDisabled: {
    opacity: 0.7,
  },
  offlineButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
});
