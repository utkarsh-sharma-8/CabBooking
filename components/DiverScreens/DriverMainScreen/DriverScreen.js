// import { StyleSheet, Text, View, Alert, Dimensions, PermissionsAndroid } from 'react-native';
// import React, { useEffect, useState } from 'react';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import io from 'socket.io-client';
// import { Button, Modal } from 'react-native';

// export default function DriverScreen() {
//   const [location, setLocation] = useState(null);
//   const [errorMsg, setErrorMsg] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [currentRequest, setCurrentRequest] = useState(null);
//   const [watchId, setWatchId] = useState(null);
//   const [currentRide, setCurrentRide] = useState(null)
//   const [phone,setPhone]=useState("9736871008");
//   // Request location permission
//   const requestLocationPermission = async () => {
//     try {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         {
//           title: "Location Permission",
//           message: "This app needs access to your location to show you on the map",
//           buttonNeutral: "Ask Me Later",
//           buttonNegative: "Cancel",
//           buttonPositive: "OK"
//         }
//       );
//       if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//         startLocationUpdates();
//       } else {
//         setErrorMsg('Location permission denied');
//       }
//     } catch (err) {
//       setErrorMsg('Error requesting location permission');
//     }
//   };

//   // useEffect(() => {
//   //   const newSocket = io(`http://192.168.1.11:3000`);
//   //   setSocket(newSocket);

//   //   // ✅ Register driver when connected
//   //   newSocket.on("connect", () => {
//   //     console.log("✅ Socket connected successfully!");
//   //     newSocket.emit("register_driver", { phone: "9736871008" }); // Emit after connection
//   // });

//   //   // 🎧 Listen for ride requests
//   //   newSocket.on("rideRequest", (request) => {
//   //       setCurrentRide(request);
//   //       Alert.alert("New Ride Request", "Accept this ride?", [
//   //           { text: "Decline", onPress: () => setCurrentRide(null) },
//   //           { text: "Accept", onPress: () => acceptRide(request) }
//   //       ]);
//   //   });
//   //   newSocket.on("driver_location", (data) => {
//   //     console.log("📍 Location update received from server:", data);
//   //     if (data.phone === phone) {
//   //         setLocation({ coords: { latitude: data.latitude, longitude: data.longitude } });
//   //     }
//   // });

//   //   // 🔄 Emit `register_driver` every 10 seconds
//   //   const interval = setInterval(() => {
//   //       newSocket.emit("register_driver", { phone });
//   //       console.log("🔄 Driver registered again for updates...");
//   //   }, 10000); // 10 sec interval

//     // ✅ Cleanup on unmount: disconnect socket & clear interval
// //     return () => {
// //         newSocket.disconnect();
// //         clearInterval(interval);
// //     };
// // }, []);
// useEffect(() => {
//   const newSocket = io(`http://192.168.1.11:3000`);
//   setSocket(newSocket);

//   newSocket.on("connect", () => {
//       console.log("✅ Socket connected!");
//       newSocket.emit("register_driver", { phone });
//   });

//   newSocket.on("rideRequest", (request) => {
//       Alert.alert("New Ride Request", `Pickup: ${request.pickupLocation.latitude}, ${request.pickupLocation.longitude}`, [
//           { text: "Decline", onPress: () => {} },
//           { text: "Accept", onPress: () => acceptRide(request) }
//       ]);
//   });

//   return () => {
//       newSocket.disconnect();
//   };
// }, []);

// // ✅ Accept Ride Function
// const acceptRide = (ride) => {
//     if (!socket) return;

//     socket.emit("acceptRide", {
//         driverId: "+9736871008",
//         passengerId: ride.passengerId
//     });

//     Alert.alert("✅ Ride Accepted", "Passenger has been notified!");
// };

//   // Start location updates
//   const startLocationUpdates = () => {
//     // Get initial location
//     Geolocation.getCurrentPosition(
//       (position) => {
//         setLocation(position);
//       },
//       (error) => setErrorMsg(error.message),
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//     );

//     // Watch position changes
//     const id = Geolocation.watchPosition(
//       (position) => {
//         setLocation(position);
//         // Emit location update to server if socket exists
//         if (socket) {
//           socket.emit('driverLocationUpdate', {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//           });
//         }
//       },
//       (error) => setErrorMsg(error.message),
//       { 
//         enableHighAccuracy: true, 
//         distanceFilter: 10, // Minimum distance (meters) between updates
//         interval: 5000, // Minimum time (milliseconds) between updates
//       }
//     );
    
//     setWatchId(id);
//   };

//   // Request permissions and start location updates on mount
//   useEffect(() => {
//     requestLocationPermission();

//     // Cleanup on unmount
//     return () => {
//       if (watchId !== null) {
//         Geolocation.clearWatch(watchId);
//       }
//     };
//   }, []);

//   const handleAcceptRide = () => {
//     if (socket && currentRequest) {
//       socket.emit('acceptRide', {
//         requestId: currentRequest.id,
//         driverLocation: {
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//         },
//       });
//       setShowRequestModal(false);
//       setCurrentRequest(null);
//       Alert.alert('Success', 'Ride accepted! Navigate to pickup location.');
//     }
//   };

//   const handleDeclineRide = () => {
//     if (socket && currentRequest) {
//       socket.emit('declineRide', { requestId: currentRequest.id });
//       setShowRequestModal(false);
//       setCurrentRequest(null);
//     }
//   };

//   if (errorMsg) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.errorText}>{errorMsg}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {location && (
//         <MapView
//           provider={PROVIDER_GOOGLE}
//           style={styles.map}
//           initialRegion={{
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude,
//             latitudeDelta: 0.0922,
//             longitudeDelta: 0.0421,
//           }}
//         >
//           <Marker
//             coordinate={{
//               latitude: location.coords.latitude,
//               longitude: location.coords.longitude,
//             }}
//             title="Your Location"
//             description="You Are Here"
//           />
//         </MapView>
//       )}

//       <Modal
//         visible={showRequestModal}
//         transparent={true}
//         animationType="slide"
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>New Ride Request!</Text>
//             {currentRequest && (
//               <>
//                 <Text style={styles.modalText}>
//                   Distance: {currentRequest.distance} km
//                 </Text>
//                 <Text style={styles.modalText}>
//                   Estimated fare: ${currentRequest.estimatedFare}
//                 </Text>
//                 <View style={styles.buttonContainer}>
//                   <Button title="Accept" onPress={handleAcceptRide} />
//                   <Button 
//                     title="Decline" 
//                     onPress={handleDeclineRide}
//                     color="red" 
//                   />
//                 </View>
//               </>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     width: Dimensions.get('window').width,
//     height: Dimensions.get('window').height,
//   },
//   errorText: {
//     fontSize: 16,
//     color: 'red',
//     textAlign: 'center',
//     marginTop: 20,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     width: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 10,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 15,
//   },
// });
import { StyleSheet, Text, View, Alert, Dimensions, PermissionsAndroid } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import io from 'socket.io-client';
import { Button, Modal } from 'react-native';

export default function DriverScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [phone, setPhone] = useState("9736871008");

  const socketRef = useRef(null);
  const watchIdRef = useRef(null); // Store watchId

  // ✅ Request Location Permission
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

  // ✅ Initialize Socket Connection
  // useEffect(() => {
  //   const newSocket = io(`http://192.168.1.11:3000`);
  //   socketRef.current = newSocket;

  //   newSocket.on("connect", () => {
  //     console.log("✅ Socket connected!");
  //     newSocket.emit("register_driver", { phone });
  //     startLocationUpdates();
  //   });

  //   newSocket.on("rideRequest", (request) => {
  //     Alert.alert(
  //       "New Ride Request",
  //       `Pickup: ${request.pickupLocation.latitude}, ${request.pickupLocation.longitude}`,
  //       [
  //         { text: "Decline", onPress: () => {} },
  //         { text: "Accept", onPress: () => acceptRide(request) }
  //       ]
  //     );
  //   });

  //   return () => {
  //     newSocket.disconnect();
  //   };
  // }, []);
  useEffect(() => {
    const newSocket = io(`http://192.168.1.11:3000`);
    socketRef.current = newSocket;
  
    newSocket.on("connect", () => {
      console.log("✅ Socket connected!");
  
      // Fetch driver's current location
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("📍 Sending initial location:", latitude, longitude);
  
          // Register driver with initial location
          newSocket.emit("register_driver", { phone, latitude, longitude });
          startLocationUpdates(); // Start sending location updates
        },
        (error) => {
          console.log("❌ Failed to get initial location:", error.message);
          newSocket.emit("register_driver", { phone });
          startLocationUpdates();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  
    newSocket.on("rideRequest", (request) => {
      console.log("🚖 Ride Request Received:", request);
      Alert.alert(
        "New Ride Request",
        `Pickup: ${request.pickupLocation.latitude}, ${request.pickupLocation.longitude}`,
        [
          { text: "Decline", onPress: () => {} },
          { text: "Accept", onPress: () => acceptRide(request) }
        ]
      );
    });
  
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // ✅ Accept Ride Function
  const acceptRide = (ride) => {
    if (!socketRef.current) return;

    socketRef.current.emit("acceptRide", {
      driverId: phone,
      passengerId: ride.passengerId
    });

    Alert.alert("✅ Ride Accepted", "Passenger has been notified!");
  };

  // ✅ Start Location Updates
  // const startLocationUpdates = () => {
  //   Geolocation.getCurrentPosition(
  //     (position) => {
  //       setLocation(position);
  //     },
  //     (error) => setErrorMsg(error.message),
  //     { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  //   );
  
  //   watchIdRef.current = Geolocation.watchPosition(
  //     (position) => {
  //       setLocation(position);
  
  //       // ✅ Ensure socket exists before emitting
  //       if (socketRef.current && socketRef.current.connected) {
  //         socketRef.current.emit('location_update', {
  //           phone,
  //           latitude: position.coords.latitude,
  //           longitude: position.coords.longitude,
  //         });
  //       }
  //     },
  //     (error) => setErrorMsg(error.message),
  //     { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
  //   );
  // };
  const startLocationUpdates = () => {
    console.log(`aaaaaaaaa this is called start location update`)
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
      },
      (error) => setErrorMsg(error.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    console.log(`ajsdhasdhasjldbasldn`);
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        setLocation(position);
        if (socketRef.current && socketRef.current.connected) {
          console.log("📍 Sending location update:", position.coords);
          socketRef.current.emit('location_update', {
            phone,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      },
      (error) => setErrorMsg(error.message),
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
    );
  };
  
  
  // ✅ Request permissions and start location updates on mount
  useEffect(() => {
    requestLocationPermission();

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
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
                <Text style={styles.modalText}>
                  Distance: {currentRequest.distance} km
                </Text>
                <Text style={styles.modalText}>
                  Estimated fare: ${currentRequest.estimatedFare}
                </Text>
                <View style={styles.buttonContainer}>
                  <Button title="Accept" onPress={acceptRide} />
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

