import React, { useContext, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Image } from 'react-native';
import { Platform, StyleSheet, TouchableOpacity, Text, View } from 'react-native';

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
import DataDetail from '../Screens/NavScreens/DataDetail/Frontend';
import { useCameraPermission } from 'react-native-vision-camera';
import FeedbackForm from '../Screens/NavScreens/FeedbackForm/Frontend';
import DeveloperFeedbackForm from '../Screens/NavScreens/DeveloperFeedbackForm/Frontend';
import GlossaryDefinition from '../Screens/NavScreens/GlossaryDefinition/Frontend';
import GymDaily from '../Screens/TabScreens/GymAnalytics/GymDaily/Frontend';
import LiveClimbTracker from '../Screens/LiveClimbTracker';
import RecordScreen from '../Screens/TabScreens/Record/Frontend';
import messaging from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';
import SessionDetail from '../Components/SessionDetail';
import EditSession from '../Components/Edit_Session';
import UserEdit from '../Components/UserEdit';
import FollowScreen from '../Screens/TabScreens/Follow';

//Created FollowPage, and altered name of Tracker (now Live Taps)-> as discussed in the meeting
//Added live tracker to other components
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
    <Text style={styles.text_tracker}>Live Taps</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    marginLeft: 10,
    borderColor: '#4c6a78',
    borderWidth: 1
  },
  button_tracker: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    marginLeft: 10,
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
          headerTitle: 'Home',
          headerLeft: Platform.OS === 'ios' ? () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <TrackerButton
                title="Tracker"
                navigation={navigation} />
            </View>
          ) : null,
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              {Platform.OS !== 'ios' &&
                <TrackerButton
                  title="Tracker"
                  navigation={navigation} />
              }
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
        name="Feedback"
        component={FeedbackForm}
        options={{ title: 'Feedback Form', headerBackTitle: 'Climb Detail', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function RecordStack() {
  console.log('[TEST] HomeStack called');
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RecordPage_stack"
        component={RecordScreen}
        options={({ navigation }) => ({
          title: 'Record',
          headerBackTitleVisible: null,
          headerLeft: Platform.OS === 'ios' ? () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <TrackerButton
                title="Tracker"
                navigation={navigation} />
            </View>
          ) : null,
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              {Platform.OS !== 'ios' &&
                <TrackerButton
                  title="Tracker"
                  navigation={navigation} />
              }
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
        options={{ title: 'Climb Detail', headerBackTitle: 'Record', headerTitleAlign: 'center' }}
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
      <Stack.Screen
        name="Climbs_Tracker"
        component={LiveClimbTracker}
        options={{ title: 'Climb Tracker', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function FollowStack() {
  console.log('[TEST] FollowStack called');
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FollowPage_stack"
        component={FollowScreen}
        options={({ navigation }) => ({
          title: 'Follow',
          headerBackTitleVisible: null,
          headerLeft: Platform.OS === 'ios' ? () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <TrackerButton
                title="Tracker"
                navigation={navigation} />
            </View>
          ) : null,
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              {Platform.OS !== 'ios' &&
                <TrackerButton
                  title="Tracker"
                  navigation={navigation} />
              }
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
        name="Feedback"
        component={FeedbackForm}
        options={{ title: 'Feedback Form', headerBackTitle: 'Climb Detail', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Definition"
        component={GlossaryDefinition}
        options={{ title: 'Definition', headerBackTitle: 'Climb Detail', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Climbs_Tracker"
        component={LiveClimbTracker}
        options={{ title: 'Climb Tracker', headerTitleAlign: 'center' }}
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
          headerLeft: Platform.OS === 'ios' ? () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <TrackerButton
                title="Tracker"
                navigation={navigation} />
            </View>
          ) : null,
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              {Platform.OS !== 'ios' &&
                <TrackerButton
                  title="Tracker"
                  navigation={navigation} />
              }
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
        name="Session_Detail"
        component={SessionDetail}
        options={({ navigation }) => ({
          title: 'Session', headerTitleAlign: 'center', headerRight: () => (
            <FeedbackButton
              title="Feedback"
              navigation={navigation}
            />)
        })}
      />
      <Stack.Screen
        name="Edit_Session"
        component={EditSession}
        options={({ navigation }) => ({
          title: 'Edit Session', headerTitleAlign: 'center', headerRight: () => (
            <FeedbackButton
              title="Feedback"
              navigation={navigation}
            />)
        })}
      />
      <Stack.Screen
        name="Edit_User"
        component={UserEdit}
        options={({ navigation }) => ({
          title: 'Edit Profile', headerTitleAlign: 'center', headerRight: () => (
            <FeedbackButton
              title="Feedback"
              navigation={navigation}
            />)
        })}
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
      <Stack.Screen
        name="Climbs_Tracker"
        component={LiveClimbTracker}
        options={{ title: 'Climb Tracker', headerTitleAlign: 'center' }}
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
            <View style={{ display: 'flex', flexDirection: 'row' }}>
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
      <Stack.Screen
        name="Data Detail"
        component={DataDetail}
        options={{ title: 'Data Detail', headerBackTitle: 'Daily Summary', headerTitleAlign: 'center' }}
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
            <View style={{ display: 'flex', flexDirection: 'row' }}>
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
    <Tab.Navigator initialRouteName="Record">
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
          name="Create_Climb_Tab"
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
        name="Record"
        component={RecordStack}
        options={{
          title: 'Record',
          headerShown: false,
          // To be completed by @abhipi or @redpepper-nag
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Image
                style={{ width: size, height: size }}
                source={require('../../assets/record.png')}
              />
            );
          },
        }}
      />
      <Tab.Screen
        name="Follow"
        component={FollowStack}
        options={{
          title: 'Follow',
          headerShown: false,
          // To be completed by @abhipi or @redpepper-nag
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Image
                style={{ width: size, height: size }}
                source={require('../../assets/follow.png')}
              />
            );
          },
        }}
      />
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

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    // Now fetch the FCM token
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      //console.log('FCM Token:', fcmToken);
      // Perform any additional setup with the FCM token, like sending it to your server
    } else {
      console.log('Failed to fetch FCM token');
    }
  }
}



function AppNav(props) {
  console.log('[TEST] AppNav called');

  const navigationRef = useRef();
  const { hasPermission, requestPermission } = useCameraPermission();
  //Notification Management in the Foreground and Background
  useEffect(() => {
    // Request permission and setup handlers
    requestUserPermission();
    // Foreground notification handler
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      Toast.show({
        type: 'success',
        text1: 'Check out your new session in Profile!'
      });
    });

    // Background and quit state notification handler
    messaging().onNotificationOpenedApp(remoteMessage => {
      //console.log('Notification clicked!');
      if (remoteMessage.data.targetScreen) {
        navigationRef.current?.navigate(remoteMessage.data.targetScreen);
      }
    });

    messaging().getInitialNotification().then(remoteMessage => {
      //console.log('Notification clicked!');
      if (remoteMessage && remoteMessage.data.targetScreen) {
        navigationRef.current?.navigate(remoteMessage.data.targetScreen);
      }
    });

    return () => {
      unsubscribeForeground();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppTabs></AppTabs>
      <Toast />
    </NavigationContainer>
  );
}

export default AppNav;
