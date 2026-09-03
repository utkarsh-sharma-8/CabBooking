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
  Keyboard,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';
import {
  getSocket,
  requestRide,
  listenForRideAcceptance,
  registerPassenger,
  listenForDriverLocation,
} from '../../../utils/socket';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './FirstScreenStyle';
import {getUser} from '../../../utils/authStorage';
import fetchInitialData from './FirstScreenApi';
import CustomSidebar from './CustomSidebar';
import {LocationContext} from '../../../utils/locationContext';
import {
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
} from '../../../utils/addressCoordinates';
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;
const FirstScreen = () => {
  const navigation = useNavigation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [rideStatus, setRideStatus] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  // Which input a map tap should fill next — set by focusing that field.
  const [activeField, setActiveField] = useState(null); // 'source' | 'destination' | null
  const [passengerId, setPassengerId] = useState('');
  const {location} = useContext(LocationContext); // Get location from context
  // The rideAccepted listener below is registered once at mount (see the
  // effect's [] deps) — refs, not the state variables directly, keep it
  // reading the LATEST pickup/destination instead of a stale mount-time
  // closure once the user actually sets them.
  const sourceCoordsRef = useRef(sourceCoords);
  const destinationCoordsRef = useRef(destinationCoords);
  useEffect(() => {
    sourceCoordsRef.current = sourceCoords;
  }, [sourceCoords]);
  useEffect(() => {
    destinationCoordsRef.current = destinationCoords;
  }, [destinationCoords]);
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
      const user = await getUser();
      const id = user?.passengerId;
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
        setRideStatus(data?.message || 'Your ride has been accepted!');
        navigation.navigate('TripScreen', {
          tripId: data?.tripId,
          driver: data?.driver || (data?.driverId ? {phone: data.driverId} : null),
          passenger: null,
          pickupLocation: sourceCoordsRef.current,
          destinationLocation: destinationCoordsRef.current,
        });
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
      getSocket()?.off('rideAccepted'); // Cleanup to prevent duplicate listeners
    };
  }, []);
  // Auto-fill Pickup with the current location's address on load — but only
  // until the user starts interacting with it (typing, focusing it, or
  // tapping the map to set it) — after that, their choice always wins. This
  // re-checks on every location update (cheap: it short-circuits once source
  // is set) since the first update or two may still be locationContext's
  // placeholder default before a real GPS fix comes in.
  useEffect(() => {
    if (activeField === 'source' || sourceCoords || source) return;
    let cancelled = false;
    (async () => {
      const address = await getAddressFromCoordinates(location.latitude, location.longitude);
      if (cancelled || !address) return;
      setSource(address);
      setSourceCoords({latitude: location.latitude, longitude: location.longitude});
    })();
    return () => {
      cancelled = true;
    };
  }, [location.latitude, location.longitude]);

  const handleRequestRide = async () => {
    console.log(`🔍 Search bar pressed...`);

    try {
      if (!destinationCoords) {
        setRideStatus('Please Enter Valid Destination Location!');
        console.log('Please Enter Valid Destination Location!');
        return;
      }

      setRideStatus('Searching for a driver...');

      // Prefer coords picked directly off the map (precise); fall back to
      // the device's current location if the field was left empty; only
      // geocode as a last resort, for a pickup address the user typed by hand.
      let resolvedSourceCoords;
      if (sourceCoords) {
        resolvedSourceCoords = sourceCoords;
      } else if (!source.trim()) {
        resolvedSourceCoords = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      } else {
        resolvedSourceCoords = await getCoordinatesFromAddress(source);
      }

      // Validate source and destination coordinates
      if (!resolvedSourceCoords || !resolvedSourceCoords.latitude || !resolvedSourceCoords.longitude) {
        setRideStatus('Unable To Find Pickup Location. Please Try Again.');
        return;
      }

      if (
        !destinationCoords ||
        !destinationCoords.latitude ||
        !destinationCoords.longitude
      ) {
        setRideStatus(
          'Please Set a Valid Destination By Tapping The Map.',
        );
        return;
      }

      // Construct passenger ride request data
      console.log(`passengerId is ${passengerId}`);
      const passengerData = {
        passengerId: passengerId,
        source: {
          latitude: parseFloat(resolvedSourceCoords.latitude),
          longitude: parseFloat(resolvedSourceCoords.longitude),
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
  // Fills whichever input was focused last (tap the Pickup or Destination
  // field, then tap a spot on the map). If neither was focused, defaults to
  // Destination — the map's original single-purpose behavior.
  const handleMapPress = async event => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    const field = activeField || 'destination';

    const address = await getAddressFromCoordinates(latitude, longitude);
    const displayText =
      address || `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;

    if (field === 'source') {
      setSourceCoords({latitude, longitude});
      setSource(displayText);
    } else {
      setDestinationCoords({latitude, longitude});
      setDestination(displayText);
    }
    setActiveField(null);
    Keyboard.dismiss();
    console.log(`${field} set:`, latitude, longitude);
  };

  const handleSourceChange = text => {
    setSource(text);
    setSourceCoords(null); // typed text no longer matches any previously-picked coords
  };

  const handleDestinationChange = text => {
    setDestination(text);
    setDestinationCoords(null);
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
          <View
            style={[
              styles.inputWrapper,
              activeField === 'source' && {borderColor: '#FFD700', borderWidth: 2},
            ]}>
            <Icon name="my-location" size={20} color="#FFD700" />
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location, or tap here then tap the map"
              value={source}
              onChangeText={handleSourceChange}
              onFocus={() => setActiveField('source')}
              placeholderTextColor="#666666"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Destination Input */}
          <View
            style={[
              styles.inputWrapper,
              activeField === 'destination' && {borderColor: '#FF0000', borderWidth: 2},
            ]}>
            <Icon name="location-on" size={24} color="#FF0000" />
            <TextInput
              style={styles.input}
              placeholder="Where to? Or tap here then tap the map"
              value={destination}
              onChangeText={handleDestinationChange}
              onFocus={() => setActiveField('destination')}
              placeholderTextColor="#666666"
            />
          </View>
        </View>
      </View>

      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location}
        showsUserLocation={true}
        followsUserLocation={false}
        onPress={handleMapPress}>
        {/* Current Location Marker */}
        <Marker coordinate={location} title="Your Location" />
        {sourceCoords && (
          <Marker
            coordinate={sourceCoords}
            title="Pickup"
            pinColor="gold"
          />
        )}
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

export default FirstScreen;
