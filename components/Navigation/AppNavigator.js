import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Auth from '../StartingScreens/AuthScreen/Auth';
import Splash from '../StartingScreens/Splash';
import FirstScreen from '../StartingScreens/FirstScreen/FirstScreen';
import DriverVerification from '../DiverScreens/VerificationScreen/Verification';
import DriverScreen from '../DiverScreens/DriverMainScreen/DriverScreen';
import TripScreen from '../TripScreen/TripScreen';
import { LocationProvider } from '../../utils/locationContext';
import { navigationRef } from '../../utils/navigationRef';
const Stack=createNativeStackNavigator();
const AppNavigator = () => {
  return (
    <LocationProvider>
    <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>
            <Stack.Screen name="Splash" component={Splash} options={{headerShown:false}}/>
            <Stack.Screen name='Auth' component={Auth} options={{headerShown:false}}/>
            <Stack.Screen name='FirstScreen' component={FirstScreen} options={{headerShown:false}}/>
            <Stack.Screen name='Verification' component ={DriverVerification} options={{headerShown:false}}/>
            <Stack.Screen name='DriverScreen' component ={DriverScreen} options={{headerShown:false}}/>
            <Stack.Screen name='TripScreen' component ={TripScreen} options={{headerShown:false}}/>
        </Stack.Navigator>
    </NavigationContainer>
    </LocationProvider>
  )
}

export default AppNavigator