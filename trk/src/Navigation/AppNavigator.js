import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import CompRanking from '../Screens/CompRanking';
import HomeScreen from '../Screens/Home';
import ClimbInputData from '../Screens/ClimbCreate';
import ClimbDetailScreen from '../Screens/ClimbDetail';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserProfile from '../Screens/Profile';
import { AuthContext } from '../Utils/AuthContext';
import ClimberPerformance from '../Components/ClimberPerformance';
import SetDetail from '../Screens/SetDetail';
import Settings from '../Components/Settings';
import FeedbackForm from '../Screens/FeedbackForm';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  console.log('[TEST] HomeStack called');
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomePage_stack"
        component={HomeScreen}
        options={{ title: 'Home', headerBackTitleVisible: null }}
      />
      <Stack.Screen
        name="Detail"
        component={ClimbDetailScreen}
        options={{ title: 'Climb Detail', headerBackTitle: 'Home', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackForm}
        options={{ title: 'Feedback Form', headerBackTitle: 'Climb Detail', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  console.log('[TEST] ProfileStack called');
  return (
    <Stack.Navigator>
      {/* removed the header for the 'home' screen as the two homescreens stacked on top of one another and showed 2 'Home' headers */}
      <Stack.Screen name="User_Profile"
        component={UserProfile}
        options={{ title: 'Profile', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="Detail"
        component={ClimbDetailScreen}
        options={{ title: 'Climb Detail', headerBackTitle: 'Profile', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Set"
        component={SetDetail}
        options={{ title: 'Climb Performance', headerBackTitle: 'Profile', headerTitleAlign: 'center' }} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen
        name="Feedback"
        component={FeedbackForm}
        options={{ title: 'Feedback Form', headerBackTitle: 'Back', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function RankStack() {
  console.log('[TEST] RankStack called');
  return (
    <Stack.Navigator>
      {/* Here, change the name of the screen to 'Competition_Ranking_screen' */}
      <Stack.Screen
        name="Competition_Ranking_screen"
        component={CompRanking}
        options={{ title: 'Analytics', headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="Climber_Performance"
        component={ClimberPerformance}
        options={{ title: 'Climber Performance', headerBackTitle: 'Ranking', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  console.log('[TEST] AppTabs called');
  const { role } = useContext(AuthContext);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Home', headerShown: false }}
      />
      {role === 'climber' ? null :
        <Tab.Screen
          name="Create Climb"
          component={ClimbInputData}
          options={{}}
        />}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: 'Profile', headerShown: false }}
      />
      {role === 'climber' ? null :
        <Tab.Screen
          name="RankingTab"
          component={RankStack}
          options={{ title: 'Analytics', headerShown: false }}
        />}
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
