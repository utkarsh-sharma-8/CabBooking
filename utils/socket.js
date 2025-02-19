import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.1.11:3000"; // Your backend URL

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Use WebSockets only
  reconnection: true, // Auto-reconnect if disconnected
  forceNew: false, // Prevent duplicate connections
});

// Listen for ride acceptance (Single Listener)
const listenForRideAcceptance = (callback) => {
  socket.off("rideAccepted"); // Remove existing listener to prevent duplicates
  socket.on("rideAccepted", (data) => {
    callback(data); // Execute callback when a driver accepts the ride
  });
};

// Function to request a ride
const requestRide = (passengerData, callback) => {
  socket.emit("requestRide", passengerData);

  // Remove any existing listener before adding a new one
  socket.off("rideAssigned"); 
  socket.on("rideAssigned", (data) => {
    callback(data); // Handle assigned ride details
  });
};

// Function to register passenger (call this after login)
const registerPassenger = (passengerId) => {
  socket.emit("register_passenger", { passengerId });
};

// Clean up function (Call this when the user disconnects or logs out)
const disconnectSocket = () => {
  socket.off("rideAccepted");
  socket.off("rideAssigned");
  socket.disconnect(); // Properly disconnect the socket
};

export { listenForRideAcceptance, requestRide, registerPassenger, disconnectSocket, socket };
