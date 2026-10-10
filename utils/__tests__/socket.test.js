// A hand-rolled fake socket (not a real socket.io-client) — captures
// .on()/.off()/.emit() calls so tests can assert exactly which events were
// wired up and fired, and can manually trigger a captured handler (e.g.
// 'connect') to simulate the server side without a real connection.
function createMockSocket() {
  const handlers = {};
  return {
    handlers,
    on: jest.fn((event, cb) => {
      handlers[event] = cb;
    }),
    off: jest.fn(event => {
      delete handlers[event];
    }),
    emit: jest.fn(),
    emitWithAck: jest.fn(async () => ({ok: true})),
    timeout: jest.fn(function () {
      return this;
    }),
    connect: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(() => {
      Object.keys(handlers).forEach(key => delete handlers[key]);
    }),
  };
}

let mockSocket;
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

let mockCurrentRoute;
jest.mock('../navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
    getCurrentRoute: jest.fn(() => mockCurrentRoute),
    navigate: jest.fn(),
  },
}));

// Server-shaped trip, as pushed by `active_trip` (GeoJSON locations).
const serverTrip = {
  tripId: 't1',
  status: 'active',
  pickupLocation: {type: 'Point', coordinates: [76.93, 31.7]},
  destinationLocation: null,
  driver: {phone: '9000000001', name: 'D', car_no: 'HP01'},
  passenger: null,
};

describe('socket.js', () => {
  let socketModule;

  beforeEach(() => {
    jest.resetModules();
    mockSocket = createMockSocket();
    mockCurrentRoute = {name: 'FirstScreen'};
    socketModule = require('../socket');
    socketModule.connectSocket();
  });

  test('connectSocket only creates one underlying socket across repeated calls', () => {
    const {io} = require('socket.io-client');
    socketModule.connectSocket();
    socketModule.connectSocket();
    expect(io).toHaveBeenCalledTimes(1);
  });

  test('requestRide only emits — it does not listen for a reply event', () => {
    // Regression test: requestRide used to register a listener on
    // 'rideAssigned', an event the server only ever sends to a *driver's*
    // own socket (as acceptRide's confirmation) — never to the passenger
    // who called requestRide. That made a passenger's "no drivers available"
    // case invisible to the UI. See listenForNoDriversAvailable instead.
    const passengerData = {passengerId: 'p1', source: {latitude: 1, longitude: 2}};
    socketModule.requestRide(passengerData);

    expect(mockSocket.emit).toHaveBeenCalledWith('requestRide', passengerData);
    expect(mockSocket.on).not.toHaveBeenCalledWith('rideAssigned', expect.anything());
  });

  test('listenForNoDriversAvailable wires the noDriversAvailable event and forwards its payload', () => {
    const callback = jest.fn();
    socketModule.listenForNoDriversAvailable(callback);

    expect(mockSocket.off).toHaveBeenCalledWith('noDriversAvailable');
    expect(mockSocket.handlers.noDriversAvailable).toBeInstanceOf(Function);

    mockSocket.handlers.noDriversAvailable({message: 'No drivers nearby.'});
    expect(callback).toHaveBeenCalledWith({message: 'No drivers nearby.'});
  });

  test('listenForRideAcceptance replaces any previous listener instead of stacking', () => {
    const first = jest.fn();
    const second = jest.fn();
    socketModule.listenForRideAcceptance(first);
    socketModule.listenForRideAcceptance(second);

    mockSocket.handlers.rideAccepted({tripId: 't1'});
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({tripId: 't1'});
  });

  test('registerDriver emits register_driver and replays it automatically on reconnect', () => {
    const payload = {phone: '+911234567890', latitude: 1, longitude: 2};
    socketModule.registerDriver(payload);
    expect(mockSocket.emit).toHaveBeenCalledWith('register_driver', payload);

    mockSocket.emit.mockClear();
    // Simulate socket.io's own reconnect after a network blip — the server
    // sees a brand new socket id, so the driver must re-announce itself or
    // it silently drops out of ride matching until the app is reopened.
    mockSocket.handlers.connect();
    expect(mockSocket.emit).toHaveBeenCalledWith('register_driver', payload);
  });

  test('goOffline asks the server and stops replaying the driver registration on reconnect', async () => {
    socketModule.registerDriver({phone: '+911234567890', latitude: 1, longitude: 2});
    mockSocket.connected = true;

    await expect(socketModule.goOffline()).resolves.toEqual({ok: true});
    expect(mockSocket.emitWithAck).toHaveBeenCalledWith('go_offline', {});

    mockSocket.emit.mockClear();
    mockSocket.handlers.connect();
    expect(mockSocket.emit).not.toHaveBeenCalledWith('register_driver', expect.anything());
  });

  test('goOffline keeps the driver registration when the server refuses (mid-trip)', async () => {
    const payload = {phone: '+911234567890', latitude: 1, longitude: 2};
    socketModule.registerDriver(payload);
    mockSocket.connected = true;
    mockSocket.emitWithAck.mockResolvedValueOnce({ok: false, error: 'on a trip'});

    await expect(socketModule.goOffline()).resolves.toEqual({ok: false, error: 'on a trip'});

    mockSocket.emit.mockClear();
    mockSocket.handlers.connect();
    expect(mockSocket.emit).toHaveBeenCalledWith('register_driver', payload);
  });

  test('disconnectSocket clears pending driver registration so it is not replayed after a fresh connectSocket()', () => {
    socketModule.registerDriver({phone: '+911234567890', latitude: 1, longitude: 2});
    socketModule.disconnectSocket();

    mockSocket = createMockSocket();
    socketModule.connectSocket();
    mockSocket.handlers.connect();

    expect(mockSocket.emit).not.toHaveBeenCalledWith('register_driver', expect.anything());
  });

  test('registerPassenger is replayed on reconnect, like registerDriver', () => {
    socketModule.registerPassenger('p1', {latitude: 1, longitude: 2});
    mockSocket.emit.mockClear();

    mockSocket.handlers.connect();
    expect(mockSocket.emit).toHaveBeenCalledWith('register_passenger', {
      passengerId: 'p1',
      latitude: 1,
      longitude: 2,
    });
  });

  test('an active_trip sync away from TripScreen resumes the trip there, normalized', () => {
    const {navigationRef} = require('../navigationRef');
    mockSocket.handlers.active_trip(serverTrip);

    expect(navigationRef.navigate).toHaveBeenCalledWith('TripScreen', {
      ...serverTrip,
      pickupLocation: {latitude: 31.7, longitude: 76.93},
      destinationLocation: null,
    });
  });

  test('an active_trip sync during Splash does not navigate — Splash routes itself', () => {
    const {navigationRef} = require('../navigationRef');
    mockCurrentRoute = {name: 'Splash'};
    mockSocket.handlers.active_trip(serverTrip);
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });

  test('a TripScreen subscriber receives syncs (including null) instead of the global handler', () => {
    const {navigationRef} = require('../navigationRef');
    const subscriber = jest.fn();
    const unsubscribe = socketModule.subscribeToActiveTrip(subscriber);

    mockSocket.handlers.active_trip(null);
    expect(subscriber).toHaveBeenCalledWith(null);
    mockSocket.handlers.active_trip(serverTrip);
    expect(subscriber).toHaveBeenLastCalledWith(expect.objectContaining({tripId: 't1'}));
    expect(navigationRef.navigate).not.toHaveBeenCalled();

    unsubscribe();
    mockSocket.handlers.active_trip(serverTrip);
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
  });

  test('acceptRide forwards a server rideAcceptError to onError', () => {
    const onError = jest.fn();
    socketModule.acceptRide('9000000001', 'p1', null, null, jest.fn(), onError);

    mockSocket.handlers.rideAcceptError({message: 'Could not start the trip.'});
    expect(onError).toHaveBeenCalledWith({message: 'Could not start the trip.'});
  });

  test('sendChatMessage emits chat_send with an ack timeout and resolves with the ack', async () => {
    mockSocket.emitWithAck.mockResolvedValueOnce({ok: true, message: {id: 'm1'}});
    const payload = {tripId: 't1', body: 'hi', clientMsgId: 'c1'};

    await expect(socketModule.sendChatMessage(payload)).resolves.toEqual({ok: true, message: {id: 'm1'}});
    expect(mockSocket.timeout).toHaveBeenCalledWith(expect.any(Number));
    expect(mockSocket.emitWithAck).toHaveBeenCalledWith('chat_send', payload);
  });

  test('chat helpers reject instead of hanging when there is no socket', async () => {
    socketModule.disconnectSocket();
    await expect(socketModule.fetchChatHistory()).rejects.toThrow('Not connected');
  });

  test('onChatMessage forwards messages and unsubscribes only its own handler', () => {
    const callback = jest.fn();
    const unsubscribe = socketModule.onChatMessage(callback);
    mockSocket.handlers.chat_message({id: 'm1'});
    expect(callback).toHaveBeenCalledWith({id: 'm1'});

    unsubscribe();
    expect(mockSocket.off).toHaveBeenCalledWith('chat_message', callback);
  });

  test('onSocketConnect subscribers run on every reconnect until unsubscribed', () => {
    const callback = jest.fn();
    const unsubscribe = socketModule.onSocketConnect(callback);
    mockSocket.handlers.connect();
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    mockSocket.handlers.connect();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
