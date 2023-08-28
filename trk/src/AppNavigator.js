import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from './Screens/Landing';
import HomeScreen from './Screens/Home';
import PokemonListScreen from './Screens/ClimbList';
import ClimbDetail from './Screens/ClimbDetail';
import ClimbInputData from './Screens/ClimbList';

const HomeStack = createStackNavigator();

function Home(props) {
  return (
    <HomeStack.Navigator headerMode="screen">
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'NFC Climb' }}
      />
      <HomeStack.Screen
        name="List"
        component={ClimbInputData}
        options={{ title: 'Choose Climb' }}
      />
    </HomeStack.Navigator>
  );
}

const RootStack = createStackNavigator();

function AppNav(props) {
  return (
    <NavigationContainer>
      <RootStack.Navigator headerMode="none" mode="modal">
        <RootStack.Screen name="Landing" component={LandingScreen} />
        <RootStack.Screen name="Home" component={Home} />
        <RootStack.Screen name="Detail" component={ClimbDetail} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default AppNav;
