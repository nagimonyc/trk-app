import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Image } from 'react-native';
import { Button } from 'react-native-paper';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';

import CompRanking from '../Screens/TabScreens/GymAnalytics/CompRanking/Frontend';
import HomeScreen from '../Screens/TabScreens/Home/Frontend';
import ClimbInputData from '../Screens/TabScreens/ClimbCreate/Frontend';
import ClimbDetailScreen from '../Screens/NavScreens/ClimbDetail/Frontend';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserProfile from '../Screens/TabScreens/Profile/Frontend';
import { AuthContext } from '../Utils/AuthContext';
import ClimberPerformance from '../Components/ClimberPerformance';
import SetDetail from '../Screens/NavScreens/Set/Frontend';
import Settings from '../Components/Settings';

import FeedbackForm from '../Screens/NavScreens/FeedbackForm/Frontend';
import DeveloperFeedbackForm from '../Screens/NavScreens/DeveloperFeedbackForm/Frontend';
import GlossaryDefinition from '../Screens/NavScreens/GlossaryDefinition';
import GymDaily from '../Screens/TabScreens/GymAnalytics/GymDaily/Frontend';
import LiveClimbTracker from '../Screens/LiveClimbTracker';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const GymTopTab = createMaterialTopTabNavigator();
const ClimbInputStack = createStackNavigator();

const FeedbackButton = ({ onPress, title, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('Developer_Feedback')} style={styles.button}>
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const TrackerButton = ({ onPress, title, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('Climbs_Tracker')} style={styles.button_tracker}>
    <Text style={styles.text_tracker}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    borderColor: '#4c6a78',
    borderWidth: 1
  },
  button_tracker: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    borderColor: '#fe8100',
    borderWidth: 1
  },
  text: {
    color: '#4c6a78',
    textAlign: 'center',
  },
  text_tracker: {
    color: '#fe8100',
    textAlign: 'center',
  }
});




function GymTabs() {
  return (
    <GymTopTab.Navigator
      screenOptions={{
        activeTintColor: '#3498db',
        inactiveTintColor: 'gray',
        swipeEnabled: true,
      }}
    >
      <GymTopTab.Screen
        name="DailySummary"
        component={GymDaily}
        options={{ title: 'Daily Summary' }}
      />
      <GymTopTab.Screen
        name="CompRanking"
        component={CompRanking}
        options={{ title: 'Competition' }}
      />
    </GymTopTab.Navigator>
  );
}

function HomeStack() {
  console.log('[TEST] HomeStack called');
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomePage_stack"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Home',
          headerBackTitleVisible: null,
          headerRight: () => (
            <View style={{display: 'flex', flexDirection: 'row'}}>
            <TrackerButton 
            title="Tracker"
            navigation={navigation}/>
            <FeedbackButton
              title="Feedback"
              navigation={navigation}
            />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Developer_Feedback"
        component={DeveloperFeedbackForm}
        options={{ title: 'Developer Feedback', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Climbs_Tracker"
        component={LiveClimbTracker}
        options={{ title: 'Climb Tracker', headerTitleAlign: 'center' }}
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
      <Stack.Screen
        name="Definition"
        component={GlossaryDefinition}
        options={{ title: 'Definition', headerBackTitle: 'Climb Detail', headerTitleAlign: 'center' }}
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
        options={({ navigation }) => ({
          title: 'Profile',
          headerBackTitleVisible: false,
          headerRight: () => (
            <View style={{display: 'flex', flexDirection: 'row'}}>
            <FeedbackButton
              title="Feedback"
              navigation={navigation}
            />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Developer_Feedback"
        component={DeveloperFeedbackForm}
        options={{ title: 'Developer Feedback', headerTitleAlign: 'center' }}
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

      <Stack.Screen
        name="ClimbInputData"
        component={ClimbInputData}
        options={{ title: 'Climb Data', headerBackTitle: 'Back', headerTitleAlign: 'center' }}
      />

      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen
        name="Feedback"
        component={FeedbackForm}
        options={{ title: 'Feedback Form', headerBackTitle: 'Back', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Definition"
        component={GlossaryDefinition}
        options={{ title: 'Definition', headerBackTitle: 'Back', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function AnalyticsStack() {
  console.log('[TEST] AnalyticsStack called');
  return (
    <Stack.Navigator>
      {/* Here, change the name of the screen to 'Competition_Ranking_screen' */}
      <Stack.Screen
        name="MyGym"
        component={GymTabs}
        options={({ navigation }) => ({
          title: 'My Gym',
          headerBackTitleVisible: false,
          headerRight: () => (
            <View style={{display: 'flex', flexDirection: 'row'}}>
            <FeedbackButton
              title="Feedback"
              navigation={navigation}
            />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Developer_Feedback"
        component={DeveloperFeedbackForm}
        options={{ title: 'Developer Feedback', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Climber_Performance"
        component={ClimberPerformance}
        options={{ title: 'Climber Performance', headerBackTitle: 'Ranking', headerTitleAlign: 'center' }}
      />

    </Stack.Navigator>
  );
}


function ClimbInputStackScreen() {
  return (
    <ClimbInputStack.Navigator>
      <ClimbInputStack.Screen
        name="Create Climb"
        component={ClimbInputData}
        options={({ navigation }) => ({
          headerRight: () => (
            <View style={{display: 'flex', flexDirection: 'row'}}>
            <FeedbackButton
              title="Feedback"
              navigation={navigation}
            />
            </View>
          ),
        })}
      />
      <ClimbInputStack.Screen
        name="Developer_Feedback"
        component={DeveloperFeedbackForm}
        options={{ title: 'Developer Feedback', headerTitleAlign: 'center' }}
      />
    </ClimbInputStack.Navigator>
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
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Image
                style={{ width: size, height: size }}
                source={require('../../assets/home.png')}
              />
            );
          },
        }}

      />
      {role === 'climber' ? null :
        <Tab.Screen
          name="Create Climb"
          component={ClimbInputStackScreen} // Use the new stack here
          options={{
            title: 'Create Climb',
            headerShown: false,
            tabBarIcon: ({ size, focused, color }) => {
              return (
                <Image
                  style={{ width: size, height: size }}
                  source={require('../../assets/tools.png')}
                />);
            },
          }}
        />}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile', headerShown: false,
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Image
                style={{ width: size, height: size }}
                source={require('../../assets/profile.png')}
              />
            );
          },
        }}
      />
      {role === 'climber' ? null :
        <Tab.Screen
          name="AnalyticsTab"
          component={AnalyticsStack}
          options={{
            title: 'My Gym', headerShown: false,
            tabBarIcon: ({ size, focused, color }) => {
              return (
                <Image
                  style={{ width: size, height: size }}
                  source={require('../../assets/analytics.png')}
                />
              );
            },
          }}
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
