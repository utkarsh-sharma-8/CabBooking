import {io} from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.11:3000'; // Your backend URL

const socket = io(SOCKET_URL, {
  transports: ['websocket'], // Use WebSockets only
  reconnection: true, // Auto-reconnect if disconnected
  forceNew: false, // Prevent duplicate connections
});
// ✅ REGISTER DRIVER
const registerDriver = driverData => {
  console.log(`registerDriver event called`);
  socket.emit('register_driver', driverData);
};

// Listen for ride acceptance (Single Listener)
const listenForRideAcceptance = callback => {
  socket.off('rideAccepted'); // Remove existing listener to prevent duplicates
  socket.on('rideAccepted', data => {
    callback(data); // Execute callback when a driver accepts the ride
  });
};

// Function to request a ride
const requestRide = (passengerData, callback) => {
  socket.emit('requestRide', passengerData);

  // Remove any existing listener before adding a new one
  socket.off('rideAssigned');
  socket.on('rideAssigned', data => {
    callback(data); // Handle assigned ride details
  });
};
// ✅ SEND DRIVER LOCATION UPDATES (Driver updates location)
const updateDriverLocation = (phone, latitude, longitude) => {
  socket.emit('location_update', {phone, latitude, longitude});
};
// ✅ LISTEN FOR RIDE REQUESTS (Driver receives ride requests)
const listenForRideRequests = callback => {
  socket.off('rideRequest'); // Remove duplicate listeners
  socket.on('rideRequest', data => {
    callback(data); // Handle incoming ride request
  });
};
// ✅ ACCEPT A RIDE (Driver accepts ride)
const acceptRide = (driverId, passengerId, callback) => {
  socket.emit('acceptRide', {driverId, passengerId});

  // Remove any existing listener before adding a new one
  socket.off('rideAccepted');
  socket.on('rideAccepted', data => {
    callback(data); // Handle ride acceptance details
  });
};
// Function to register passenger (call this after login)
const registerPassenger = passengerId => {
  socket.emit('register_passenger', {passengerId});
};
// ✅ LISTEN FOR DRIVER LOCATION UPDATES (Passenger receives updates)
const listenForDriverLocation = callback => {
  console.log(`listenForDriverLocation Called`);
  socket.off('driver_location'); // Remove duplicate listeners
  socket.on('driver_location', data => {
    callback(data); // Handle location updates
  });
};
// ✅ SEND MESSAGE (Between Passenger & Driver)
const sendMessage = (senderId, receiverId, message) => {
  socket.emit('Send Message', {senderId, receiverId, message});
};
// ✅ LISTEN FOR MESSAGES (Passenger or Driver receives messages)
const listenForMessages = callback => {
  socket.off('recieveMessage'); // Remove duplicate listeners
  socket.on('recieveMessage', data => {
    callback(data); // Handle incoming message
  });
};
// Clean up function (Call this when the user disconnects or logs out)
const disconnectSocket = () => {
  socket.off('rideAccepted');
  socket.off('rideAssigned');
  socket.disconnect(); // Properly disconnect the socket
};

// export { listenForRideAcceptance, requestRide, registerPassenger, disconnectSocket, socket };
export {
  socket,
  registerPassenger,
  registerDriver,
  requestRide,
  acceptRide,
  listenForRideRequests,
  listenForDriverLocation,
  updateDriverLocation,
  listenForRideAcceptance,
  sendMessage,
  listenForMessages,
  disconnectSocket,
};
