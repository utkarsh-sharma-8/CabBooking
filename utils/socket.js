import {io} from 'socket.io-client';
import {SOCKET_URL} from './config';
import {getAccessToken} from './authStorage';

// The socket is created lazily by connectSocket() (called once the user is
// authenticated — see Auth.js/Splash.js) rather than eagerly at module load,
// since it now needs an access token for the handshake. The `auth` option is a
// function so socket.io re-reads the current in-memory token on every
// (re)connection attempt, picking up a freshly-refreshed token automatically.
let socket = null;

// The most recent register_driver payload, replayed automatically whenever
// the socket (re)connects — including socket.io's own automatic reconnection
// after a network blip. A reconnect gets a new socket id server-side, and the
// server derives driver presence from the currently-connected socket, so
// without this a dropped-and-restored connection would silently leave the
// driver invisible to ride matching until they left and reopened the screen.
let lastDriverRegistration = null;
const MAX_CONSECUTIVE_AUTH_FAILURES = 3;

export function connectSocket() {
  if (socket) {
    return socket;
  }
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    forceNew: false,
    auth: cb => cb({token: getAccessToken()}),
  });

  let consecutiveAuthFailures = 0;

  socket.on('connect', () => {
    consecutiveAuthFailures = 0;
    if (lastDriverRegistration) {
      socket.emit('register_driver', lastDriverRegistration);
    }
  });

  socket.on('connect_error', async err => {
    console.log(`socket connect_error: ${err.message}`);
    if (err.message?.startsWith('Unauthorized')) {
      consecutiveAuthFailures += 1;
      if (consecutiveAuthFailures > MAX_CONSECUTIVE_AUTH_FAILURES) {
        console.log('socket: giving up after repeated auth failures');
        return;
      }
      // Lazy import avoids a require cycle (apiClient doesn't depend on socket.js).
      const {bootstrapSession} = require('./apiClient');
      const refreshed = await bootstrapSession();
      if (refreshed) {
        socket.connect();
      }
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  lastDriverRegistration = null;
}

// Note: `phone`/`passengerId` fields below are no longer used to establish
// identity server-side (the server derives that from the authenticated socket's
// JWT — see be/cab_booking_be/services/sockets.js); they're accepted here only
// for any non-identity payload data (e.g. location) and backward-compatible
// call sites.

const registerDriver = driverData => {
  lastDriverRegistration = driverData;
  getSocket()?.emit('register_driver', driverData);
};

const listenForRideAcceptance = callback => {
  const s = getSocket();
  s?.off('rideAccepted');
  s?.on('rideAccepted', data => callback(data));
};

const requestRide = (passengerData, callback) => {
  const s = getSocket();
  s?.emit('requestRide', passengerData);
  s?.off('rideAssigned');
  s?.on('rideAssigned', data => callback(data));
};

const updateDriverLocation = (phone, latitude, longitude) => {
  if (lastDriverRegistration) {
    lastDriverRegistration = {...lastDriverRegistration, latitude, longitude};
  }
  getSocket()?.emit('location_update', {phone, latitude, longitude});
};

const listenForRideRequests = callback => {
  const s = getSocket();
  s?.off('rideRequest');
  s?.on('rideRequest', data => callback(data));
};

const acceptRide = (driverId, passengerId, pickupLocation, destinationLocation, callback) => {
  const s = getSocket();
  // pickupLocation/destinationLocation are echoed back from what this driver
  // already received via listenForRideRequests — the server uses them to
  // create the trip record (see be/cab_booking_be/services/sockets.js).
  s?.emit('acceptRide', {driverId, passengerId, pickupLocation, destinationLocation});
  s?.off('rideAssigned');
  s?.on('rideAssigned', data => callback(data));
};

// Emit-only — deliberately does not attach its own 'tripCompleted' listener,
// since that event is already handled uniformly for both roles by
// listenForTripCompleted (a driver also needs to see "trip completed" state,
// not just the passenger), and two listeners on the same event would fight
// over which one survives the off-then-on pattern.
const completeTrip = tripId => {
  getSocket()?.emit('completeTrip', {tripId});
};

const listenForTripDriverLocation = callback => {
  const s = getSocket();
  s?.off('trip_driver_location');
  s?.on('trip_driver_location', data => callback(data));
};

const listenForTripCompleted = callback => {
  const s = getSocket();
  s?.off('tripCompleted');
  s?.on('tripCompleted', data => callback(data));
};

const registerPassenger = passengerId => {
  getSocket()?.emit('register_passenger', {passengerId});
};

const listenForDriverLocation = callback => {
  const s = getSocket();
  s?.off('driver_location');
  s?.on('driver_location', data => callback(data));
};

const listenForNoDriversAvailable = callback => {
  const s = getSocket();
  s?.off('noDriversAvailable');
  s?.on('noDriversAvailable', data => callback(data));
};

export {
  registerPassenger,
  registerDriver,
  requestRide,
  acceptRide,
  listenForRideRequests,
  listenForDriverLocation,
  updateDriverLocation,
  listenForRideAcceptance,
  listenForNoDriversAvailable,
  completeTrip,
  listenForTripDriverLocation,
  listenForTripCompleted,
};
