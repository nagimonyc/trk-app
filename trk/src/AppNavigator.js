import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from './Screens/Landing';
import HomeScreen from './Screens/Home';
import ClimbInputData from './Screens/ClimbList';
import ClimbDetailScreen from './Screens/ClimbDetail'

const Stack = createStackNavigator();

function AppNav(props) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerMode: 'float' }}>
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home: NFC Climb',
            headerStyle: {
              backgroundColor: 'blue', // Customize header background color
            },
            headerTintColor: 'white', // Customize text color of header title
            headerTitleStyle: {
              fontWeight: 'bold', // Customize font weight of header title
            },
          }}
        />
        <Stack.Screen
          name="List"
          component={ClimbInputData}
          options={{
            title: 'Choose Climb',
            headerStyle: {
              backgroundColor: 'blue', // Customize header background color
            },
            headerTintColor: 'white', // Customize text color of header title
            headerTitleStyle: {
              fontWeight: 'bold', // Customize font weight of header title
            },
          }}
        />
        <Stack.Screen
          name="Detail"
          component={ClimbDetailScreen}
          options={{
            title: 'Climb Info',
            headerStyle: {
              backgroundColor: 'blue', // Customize header background color
            },
            headerTintColor: 'white', // Customize text color of header title
            headerTitleStyle: {
              fontWeight: 'bold', // Customize font weight of header title
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNav;
