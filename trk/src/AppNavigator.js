import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from './Screens/Landing';
import HomeScreen from './Screens/Home';
import ClimbDetail from './Screens/ClimbDetail';
import ClimbInputData from './Screens/ClimbList';
import SignIn from './Components/SignIn';
import SignUp from './Components/SignUp';


const AuthStack = createStackNavigator();


export function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="SignIn" component={SignIn} />
      <AuthStack.Screen name="SignUp" component={SignUp} />
    </AuthStack.Navigator>
  );
}

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
              backgroundColor: 'blue',
            },
            headerTintColor: 'white',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="List"
          component={ClimbInputData}
          options={{
            title: 'Choose Climb',
            headerStyle: {
              backgroundColor: 'blue',
            },
            headerTintColor: 'white',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="Detail"
          component={ClimbDetail}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNav;
