import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, {Marker, UrlTile} from 'react-native-maps';
import {
  socket,
  requestRide,
  listenForRideAcceptance,
  disconnectSocket,
  registerPassenger,
  listenForDriverLocation,
} from '../../../utils/socket';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './FirstScreenStyle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchInitialData from './FirstScreenApi';
import CustomSidebar from './CustomSidebar';
import {LocationContext} from '../../../utils/locationContext';
import {
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
} from '../../../utils/addressCoordinates';
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;
export default FirstScreen = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [rideStatus, setRideStatus] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [destinationCoords, setDestinationCoords] = useState(null); // Stor
  const [passengerId, setPassengerId] = useState('');
  const {location} = useContext(LocationContext); // Get location from context
  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -DRAWER_WIDTH : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarOpen(!isSidebarOpen);
  };
  useEffect(() => {
    // Register the passenger when entering this screen
    const fetchPassengerIdandListenForRide = async () => {
      const id = await AsyncStorage.getItem('passengerId');
      console.log(`passengerId is ${id}`);
      if (id) {
        setPassengerId(id);
        registerPassenger(id);
      } else {
        Alert.alert('You need to register again');
      }
      // Listen for ride acceptance
      listenForRideAcceptance(data => {
        console.log('🚖 Ride Accepted:', data);
        setRideData(data);
      });
      listenForDriverLocation(driverData => {
        console.log(`📍 Driver Location Updated:`, driverData);

        setDrivers(prevDrivers => {
          if (!Array.isArray(driverData)) {
            driverData = [driverData]; // ✅ Ensure it's always an array
          }

          const updatedDrivers = [...prevDrivers];

          driverData.forEach(newDriver => {
            const existingDriverIndex = updatedDrivers.findIndex(
              driver => driver.phone === newDriver.phone,
            );

            if (existingDriverIndex !== -1) {
              // ✅ Update existing driver location
              updatedDrivers[existingDriverIndex] = newDriver;
            } else {
              // ✅ Add new driver to list
              updatedDrivers.push(newDriver);
            }
          });

          return updatedDrivers;
        });
      });
    };
    fetchPassengerIdandListenForRide();
    return () => {
      socket.off('rideAccepted'); // Cleanup to prevent duplicate listeners
    };
  }, []);
  const handleRequestRide = async () => {
    console.log(`🔍 Search bar pressed...`);

    try {
      if (!destinationCoords) {
        setRideStatus('Please Enter Valid Destination Location!');
        console.log('Please Enter Valid Destination Location!');
        return;
      }

      setRideStatus('Searching for a driver...');

      // Get current location for source if no specific pickup location is entered
      let sourceCoords;
      if (!source.trim()) {
        sourceCoords = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      } else {
        sourceCoords = await getCoordinatesFromAddress(source);
      }

      // Validate source and destination coordinates
      if (!sourceCoords || !sourceCoords.latitude || !sourceCoords.longitude) {
        setRideStatus('Unable To Find Pickup Location. Please Try Again.');
        return;
      }

      if (
        !destinationCoords ||
        !destinationCoords.latitude ||
        !destinationCoords.longitude
      ) {
        setRideStatus(
          'Please Set a Valid Destination By Long-Pressing On The Map.',
        );
        return;
      }

      // Construct passenger ride request data
      console.log(`passengerId is ${passengerId}`);
      const passengerData = {
        passengerId: passengerId,
        source: {
          latitude: parseFloat(sourceCoords.latitude),
          longitude: parseFloat(sourceCoords.longitude),
        },
        destination: {
          latitude: parseFloat(destinationCoords.latitude),
          longitude: parseFloat(destinationCoords.longitude),
        },
      };

      // Send ride request via socket
      requestRide(passengerData, data => {
        if (data && data.driverId) {
          console.log(`Ride Assigned To Driver ${data.driverId}`);
          setRideStatus(`Ride Assigned! Driver ID: ${data.driverId}`);
        } else {
          console.log('No Drivers Available.');
          setRideStatus('No Drivers Available. Try Again Later.');
        }
      });
    } catch (error) {
      console.error('Ride request error:', error);
      setRideStatus('Error requesting ride. Please try again.');
    }
  };
  const handleLongPress = async event => {
    const {latitude, longitude} = event.nativeEvent.coordinate;

    // Set destination coordinates
    setDestinationCoords({latitude, longitude});
    const address = await getAddressFromCoordinates(latitude, longitude);
    // Format coordinates for user-friendly display
    if (address) {
      setDestination(address);
    } else {
      setDestination(
        `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
      );
    }
    console.log('Destination Set:', latitude, longitude);
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
        <Icon name="menu" size={24} color="#333" />
      </TouchableOpacity>
      {/* Search Container */}
      <View style={styles.searchContainer}>
        <View style={styles.inputCard}>
          {/* Source Input */}
          <View style={styles.inputWrapper}>
            <Icon name="my-location" size={20} color="#FFD700" />
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location"
              value={source}
              onChangeText={setSource}
              placeholderTextColor="#666666"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Destination Input */}
          <View style={styles.inputWrapper}>
            <Icon name="location-on" size={24} color="#FF0000" />
            <TextInput
              style={styles.input}
              placeholder="Where to?"
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor="#666666"
            />
          </View>
        </View>
      </View>

      {/* Map View */}
      <MapView
        style={styles.map}
        region={location}
        showsUserLocation={true}
        followsUserLocation={false}
        onLongPress={handleLongPress}>
        {/* OpenStreetMap Tile Layer */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />

        {/* Current Location Marker */}
        <Marker coordinate={location} title="Your Location" />
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            pinColor="blue" // Change color to differentiate
          />
        )}
        {drivers.map(driver => (
          <Marker
            key={driver.phone}
            coordinate={{
              latitude: driver.latitude,
              longitude: driver.longitude,
            }}
            title={`phone.: ${driver.phone}`}>
            <Icon name="directions-car" size={30} color="black" />
          </Marker>
        ))}
      </MapView>

      {/* Bottom Sheet */}
      <TouchableOpacity style={styles.bottomSheet} onPress={handleRequestRide}>
        <Text style={styles.bottomSheetText}>Search</Text>
      </TouchableOpacity>
      <CustomSidebar
        isOpen={isSidebarOpen}
        slideAnim={slideAnim}
        onClose={toggleSidebar}
      />
    </View>
  );
};
