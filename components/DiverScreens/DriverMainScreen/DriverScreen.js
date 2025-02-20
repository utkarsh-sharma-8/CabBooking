import { StyleSheet, Text, View, Alert, Dimensions, PermissionsAndroid } from 'react-native';
import React, { useEffect, useState, useRef,useContext } from 'react';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Button, Modal } from 'react-native';
import { LocationContext } from '../../../utils/locationContext'; //Use Location Context
import { listenForRideRequests, registerDriver, updateDriverLocation,socket } from '../../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DriverScreen() {
  const {location} = useContext(LocationContext);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [phone, setPhone] = useState('');
  useEffect(() => {
    const loadPhoneAndRegister = async () => {
      const storedPhone = await AsyncStorage.getItem("phone");
      if (storedPhone) {
        setPhone(storedPhone); //This will update state
        registerDriver({ phone: storedPhone, latitude: location.latitude, longitude: location.longitude });
      }else{
        console.log(`lol`);
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
      socket.off("rideRequest"); //Cleanup listener on unmount
    };
  }, []); // Runs when `phone` is set
  
  
  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
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
                  <Button title="Accept" />
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

