import {io} from 'socket.io-client';
import {SOCKET_URL} from './config';
import {getAccessToken} from './authStorage';
import {navigationRef} from './navigationRef';

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
// Same idea for passengers: without a replay, a reconnected passenger drops
// out of the nearby-drivers broadcast until FirstScreen remounts.
let lastPassengerRegistration = null;
// TripScreen registers here while mounted so it, not the global handler,
// decides what a server trip sync means for the trip on screen.
let activeTripSubscriber = null;
// Called on every (re)connect — lets the trip chat refetch history to cover
// messages broadcast while this device was offline.
const connectSubscribers = new Set();
const MAX_CONSECUTIVE_AUTH_FAILURES = 3;
const CHAT_ACK_TIMEOUT_MS = 8000;

// Screens where boot/login code is still deciding where to go (Splash does
// its own GET /trips/active) — a sync arriving then must not navigate too.
const PRE_SESSION_ROUTES = ['Splash', 'Auth'];

// The server pushes `active_trip` on every (re)connect with the user's
// in-progress trip from Postgres, or null if there is none. That covers the
// events a dropped connection missed: a rideAccepted/rideAssigned that fired
// while offline (resume into TripScreen from wherever the user is), or a
// tripCompleted (TripScreen's subscriber closes the trip out).
function handleActiveTripSync(rawTrip) {
  // Lazy require: tripApi -> apiClient -> session -> socket is a cycle.
  const {normalizeTrip} = require('./tripApi');
  const trip = normalizeTrip(rawTrip);

  if (activeTripSubscriber) {
    activeTripSubscriber(trip);
    return;
  }
  if (!trip || !navigationRef.isReady()) return;
  const routeName = navigationRef.getCurrentRoute()?.name;
  if (!routeName || routeName === 'TripScreen' || PRE_SESSION_ROUTES.includes(routeName)) return;
  navigationRef.navigate('TripScreen', trip);
}

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
    if (lastPassengerRegistration) {
      socket.emit('register_passenger', lastPassengerRegistration);
    }
    connectSubscribers.forEach(callback => callback());
  });

  socket.on('active_trip', handleActiveTripSync);

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
  lastPassengerRegistration = null;
  activeTripSubscriber = null;
  connectSubscribers.clear();
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

// Takes the driver out of ride matching without dropping the socket. The
// stored registration is cleared first so a reconnect in the meantime doesn't
// replay it and silently put the driver back online — and restored if the
// server refuses (it does mid-trip: live trip tracking needs the driver
// registered).
const goOffline = async () => {
  const previousRegistration = lastDriverRegistration;
  lastDriverRegistration = null;
  const s = getSocket();
  // Not connected: the server already dropped this driver on disconnect, and
  // with the registration cleared a reconnect won't re-add them.
  if (!s?.connected) return {ok: true};
  try {
    const reply = await s.timeout(CHAT_ACK_TIMEOUT_MS).emitWithAck('go_offline', {});
    if (!reply?.ok) lastDriverRegistration = previousRegistration;
    return reply;
  } catch (error) {
    lastDriverRegistration = previousRegistration;
    return {ok: false, error: 'Could not reach the server. Please try again.'};
  }
};

const listenForRideAcceptance = callback => {
  const s = getSocket();
  s?.off('rideAccepted');
  s?.on('rideAccepted', data => callback(data));
};

// Emit-only — deliberately does not listen for a response event here. The
// server (see be/services/rides-service/services/sockets.js) only ever
// replies to a matched requestRide with either 'rideAccepted' (once a driver
// actually accepts — see listenForRideAcceptance) or 'noDriversAvailable'
// (see listenForNoDriversAvailable) — it never emits 'rideAssigned' to a
// passenger's own socket (that event is acceptRide's driver-side confirmation
// only), so a callback wired to 'rideAssigned' here would simply never fire.
const requestRide = passengerData => {
  getSocket()?.emit('requestRide', passengerData);
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

const acceptRide = (driverId, passengerId, pickupLocation, destinationLocation, callback, onError) => {
  const s = getSocket();
  // pickupLocation/destinationLocation are echoed back from what this driver
  // already received via listenForRideRequests — the server uses them to
  // create the trip record (see be/services/rides-service/services/sockets.js).
  s?.off('rideAssigned');
  s?.off('rideAcceptError');
  s?.on('rideAssigned', data => callback(data));
  // The server rejects the accept if it couldn't persist the trip; the
  // assignment is kept, so the driver can retry.
  s?.on('rideAcceptError', data => onError?.(data));
  s?.emit('acceptRide', {driverId, passengerId, pickupLocation, destinationLocation});
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

// location: where the passenger is looking for a ride — the server sends
// them only drivers near it. Call again whenever it changes.
const registerPassenger = (passengerId, location) => {
  lastPassengerRegistration = {
    passengerId,
    latitude: location?.latitude,
    longitude: location?.longitude,
  };
  getSocket()?.emit('register_passenger', lastPassengerRegistration);
};

// Returns an unsubscribe function for the effect cleanup.
const subscribeToActiveTrip = callback => {
  activeTripSubscriber = callback;
  return () => {
    if (activeTripSubscriber === callback) activeTripSubscriber = null;
  };
};

const listenForDriverLocation = callback => {
  const s = getSocket();
  s?.off('driver_location');
  s?.on('driver_location', data => callback(data));
};

// A driver nearby stopped being bookable (went offline, disconnected, or
// took a trip) — payload {phone}; drop their marker.
const listenForDriverGone = callback => {
  const s = getSocket();
  s?.off('driver_gone');
  s?.on('driver_gone', data => callback(data));
};

const listenForNoDriversAvailable = callback => {
  const s = getSocket();
  s?.off('noDriversAvailable');
  s?.on('noDriversAvailable', data => callback(data));
};

// --- In-trip chat (see chat_send/chat_history in rides-service sockets.js) ---
// Both resolve with the server's ack ({ok, ...}); they reject if there's no
// socket or no ack arrives in time. socket.io buffers emits while
// disconnected, so a message that timed out may still be delivered after a
// reconnect — the server dedupes on clientMsgId, so resending it is safe.

const emitWithAck = (event, payload) => {
  const s = getSocket();
  if (!s) return Promise.reject(new Error('Not connected'));
  return s.timeout(CHAT_ACK_TIMEOUT_MS).emitWithAck(event, payload);
};

const sendChatMessage = ({tripId, body, clientMsgId}) =>
  emitWithAck('chat_send', {tripId, body, clientMsgId});

const fetchChatHistory = () => emitWithAck('chat_history', {});

// Unlike the listenFor* helpers, this removes only its own handler, and
// returns an unsubscribe function for the effect cleanup.
const onChatMessage = callback => {
  const s = getSocket();
  s?.on('chat_message', callback);
  return () => s?.off('chat_message', callback);
};

const onSocketConnect = callback => {
  connectSubscribers.add(callback);
  return () => connectSubscribers.delete(callback);
};

export {
  sendChatMessage,
  fetchChatHistory,
  onChatMessage,
  onSocketConnect,
  registerPassenger,
  registerDriver,
  goOffline,
  requestRide,
  acceptRide,
  listenForRideRequests,
  listenForDriverLocation,
  listenForDriverGone,
  updateDriverLocation,
  listenForRideAcceptance,
  listenForNoDriversAvailable,
  completeTrip,
  listenForTripDriverLocation,
  listenForTripCompleted,
  subscribeToActiveTrip,
};
