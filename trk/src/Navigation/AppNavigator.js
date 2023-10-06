import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LandingScreen from '../Screens/Landing';
import HomeScreen from '../Screens/Home';
import ClimbInputData from '../Screens/ClimbList';
import ClimbDetailScreen from '../Screens/ClimbDetail';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserProfile from '../Screens/Profile';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Climb List" component={ClimbInputData} />
      <Tab.Screen name="Profile" component={UserProfile} />
    </Tab.Navigator>
  );
}

function AppNav(props) {
  return (
    <NavigationContainer>
      <AppTabs></AppTabs>
    </NavigationContainer>
  );
}

export default AppNav;
