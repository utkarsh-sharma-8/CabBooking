import { StyleSheet, Text, View, Alert, Dimensions, PermissionsAndroid } from 'react-native';
import React, { useEffect, useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import io from 'socket.io-client';
import { Button, Modal } from 'react-native';

export default function DriverScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location to show you on the map",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        startLocationUpdates();
      } else {
        setErrorMsg('Location permission denied');
      }
    } catch (err) {
      setErrorMsg('Error requesting location permission');
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('YOUR_BACKEND_URL');
    setSocket(newSocket);

    // Listen for ride requests
    newSocket.on('rideRequest', (request) => {
      setCurrentRequest(request);
      setShowRequestModal(true);
    });

    return () => newSocket.disconnect();
  }, []);

  // Start location updates
  const startLocationUpdates = () => {
    // Get initial location
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
      },
      (error) => setErrorMsg(error.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    // Watch position changes
    const id = Geolocation.watchPosition(
      (position) => {
        setLocation(position);
        // Emit location update to server if socket exists
        if (socket) {
          socket.emit('driverLocationUpdate', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      },
      (error) => setErrorMsg(error.message),
      { 
        enableHighAccuracy: true, 
        distanceFilter: 10, // Minimum distance (meters) between updates
        interval: 5000, // Minimum time (milliseconds) between updates
      }
    );
    
    setWatchId(id);
  };

  // Request permissions and start location updates on mount
  useEffect(() => {
    requestLocationPermission();

    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const handleAcceptRide = () => {
    if (socket && currentRequest) {
      socket.emit('acceptRide', {
        requestId: currentRequest.id,
        driverLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });
      setShowRequestModal(false);
      setCurrentRequest(null);
      Alert.alert('Success', 'Ride accepted! Navigate to pickup location.');
    }
  };

  const handleDeclineRide = () => {
    if (socket && currentRequest) {
      socket.emit('declineRide', { requestId: currentRequest.id });
      setShowRequestModal(false);
      setCurrentRequest(null);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
          />
        </MapView>
      )}

      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Ride Request!</Text>
            {currentRequest && (
              <>
                <Text style={styles.modalText}>
                  Distance: {currentRequest.distance} km
                </Text>
                <Text style={styles.modalText}>
                  Estimated fare: ${currentRequest.estimatedFare}
                </Text>
                <View style={styles.buttonContainer}>
                  <Button title="Accept" onPress={handleAcceptRide} />
                  <Button 
                    title="Decline" 
                    onPress={handleDeclineRide}
                    color="red" 
                  />
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