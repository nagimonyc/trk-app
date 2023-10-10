import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LandingScreen from '../Screens/Landing';
import HomeScreen from '../Screens/Home';
import ClimbInputData from '../Screens/ClimbList';
import ClimbDetailScreen from '../Screens/ClimbDetail';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserProfile from '../Screens/Profile';
import { AuthContext } from '../Utils/AuthContext';


const { currentUser } = useContext(AuthContext);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      {/* removed the header for the 'home' screen as the two homescreens stacked on top of one another and showed 2 'Home' headers */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Detail" component={ClimbDetailScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      { currentUser ? }
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
