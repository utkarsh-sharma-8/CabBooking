import { StyleSheet, Text, View, Dimensions, PermissionsAndroid, TouchableOpacity } from 'react-native';
import React, { useEffect, useState, useRef,useContext } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LocationContext } from '../../../utils/locationContext'; //Use Location Context
import { listenForRideRequests, registerDriver, updateDriverLocation, acceptRide, getSocket } from '../../../utils/socket';
import { getUser } from '../../../utils/authStorage';
import { endSession } from '../../../utils/session';

export default function DriverScreen() {
  const navigation = useNavigation();
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

  const handleAcceptRide = () => {
    if (!currentRequest) return;
    acceptRide(
      phone,
      currentRequest.passengerId,
      currentRequest.pickupLocation,
      currentRequest.destinationLocation,
      data => {
        navigation.navigate('TripScreen', {
          tripId: data?.tripId,
          driver: null,
          passenger: data?.passenger || null,
          pickupLocation: currentRequest.pickupLocation,
          destinationLocation: currentRequest.destinationLocation,
        });
      },
    );
    setShowRequestModal(false);
  };

  const handleLogout = async () => {
    await endSession();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      {location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
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
  logoutButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    backgroundColor: '#ff4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
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
