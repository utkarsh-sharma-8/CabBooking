import {createNavigationContainerRef} from '@react-navigation/native';

// Lets code outside the React tree (the apiClient interceptor, on a failed token
// refresh) trigger navigation back to the Auth screen.
export const navigationRef = createNavigationContainerRef();

export function resetToAuth() {
  if (navigationRef.isReady()) {
    navigationRef.reset({index: 0, routes: [{name: 'Auth'}]});
  }
}

// Where a signed-in user lands — after Splash, after login, after a trip.
// Drivers get their dashboard (going online is a deliberate step from there),
// passengers get Home; neither is dropped straight onto a map any more.
export function homeRoutesFor(user) {
  return user?.isDriver ? [{name: 'DriverHome'}] : [{name: 'Home'}];
}

// After a trip a driver goes straight back on the map (still online, with
// DriverHome underneath for "go offline"); a passenger goes back to Home.
export function postTripRoutesFor(isDriver) {
  return isDriver
    ? [{name: 'DriverHome'}, {name: 'DriverScreen'}]
    : [{name: 'Home'}];
}
