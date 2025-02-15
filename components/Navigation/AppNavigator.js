import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Auth from '../StartingScreens/AuthScreen/Auth';
import Splash from '../StartingScreens/Splash';
import FirstScreen from '../StartingScreens/FirstScreen/FirstScreen';

const Stack=createNativeStackNavigator();
const AppNavigator = () => {
  return (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen name="Splash" component={Splash} options={{headerShown:false}}/>
            <Stack.Screen name='Auth' component={Auth} options={{headerShown:false}}/>
            <Stack.Screen name='FirstScreen' component={FirstScreen} options={{headerShown:false}}/>

        </Stack.Navigator>
    </NavigationContainer>
    
  )
}

export default AppNavigator