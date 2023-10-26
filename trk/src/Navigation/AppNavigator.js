import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import CompRanking from '../Screens/CompRanking';
import HomeScreen from '../Screens/Home';
import ClimbInputData from '../Screens/ClimbList';
import ClimbDetailScreen from '../Screens/ClimbDetail';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserProfile from '../Screens/Profile';
import { AuthContext } from '../Utils/AuthContext';
import ClimberPerformance from '../Components/ClimberPerformance';
import SetDetail from '../Screens/SetDetail';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  console.log('[TEST] HomeStack called');
  return (
    <Stack.Navigator>
      {/* removed the header for the 'home' screen as the two homescreens stacked on top of one another and showed 2 'Home' headers */}
      <Stack.Screen name="Home2" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Detail" component={ClimbDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  console.log('[TEST] ProfileStack called');
  return (
    <Stack.Navigator>
      {/* removed the header for the 'home' screen as the two homescreens stacked on top of one another and showed 2 'Home' headers */}
      <Stack.Screen name="Profile" component={UserProfile} />
      <Stack.Screen name="Detail" component={ClimbDetailScreen} />
      <Stack.Screen name="Set" component={SetDetail} />
    </Stack.Navigator>
  );
}

function RankStack() {
  console.log('[TEST] RankStack called');
  return (
    <Stack.Navigator>
      {/* removed the header for the 'home' screen as the two homescreens stacked on top of one another and showed 2 'Home' headers */}
      <Stack.Screen name="Ranking" component={CompRanking} />
      <Stack.Screen name="ClimberPerformance" component={ClimberPerformance} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  console.log('[TEST] AppTabs called');
  const { role } = useContext(AuthContext);

  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      {role === 'climber' ? null : <Tab.Screen name="Climb List" component={ClimbInputData} />}
      <Tab.Screen name="Profile" component={ProfileStack} options={{ headerShown: false }} />
      {role === 'climber' ? null : <Tab.Screen name="Ranking" component={RankStack} options={{ headerShown: false }} />}
    </Tab.Navigator>
  );
}

function AppNav(props) {
  console.log('[TEST] AppNav called');
  return (
    <NavigationContainer>
      <AppTabs></AppTabs>
    </NavigationContainer>
  );
}

export default AppNav;
