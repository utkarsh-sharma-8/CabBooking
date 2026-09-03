import {createNavigationContainerRef} from '@react-navigation/native';

// Lets code outside the React tree (the apiClient interceptor, on a failed token
// refresh) trigger navigation back to the Auth screen.
export const navigationRef = createNavigationContainerRef();

export function resetToAuth() {
  if (navigationRef.isReady()) {
    navigationRef.reset({index: 0, routes: [{name: 'Auth'}]});
  }
}
