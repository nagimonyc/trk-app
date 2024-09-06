import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Image } from 'react-native';
import { Platform, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserProfile from '../Screens/TabScreens/Profile/Frontend';
import { AuthContext } from '../Utils/AuthContext';
import Settings from '../Components/Settings';
import { useCameraPermission } from 'react-native-vision-camera';
import messaging from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';
import UserEdit from '../Components/UserEdit';
import Membership from '../Screens/TabScreens/Membership/Frontend';
import GymSelection from '../Screens/TabScreens/Membership/Frontend/GymSelection';

//Created FollowPage, and altered name of Tracker (now Live Taps)-> as discussed in the meeting
//Added live tracker to other components
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  notificationBadge: {
    position: 'absolute',
    right: -1, // adjust the position as needed
    top: -3,  // adjust the position as needed
    backgroundColor: 'red',
    borderRadius: 7.5, // Half of the width and height to make it a circle
    width: 15, // Set a width and height that work for your design
    height: 15, // Set a width and height that work for your design
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 10, // Make sure the font size allows the text to fit in the badge
    fontWeight: 'bold',
    textAlign: 'center', // Center the text horizontally
    lineHeight: 15, // Match the height of the badge for vertical centering
  },
  button: {
    backgroundColor: 'white',
    padding: 5,
    marginRight: 10,
    marginLeft: 10,
  },
  buttonplus: {
    backgroundColor: '#fe8100',
    padding: 5,
    marginRight: 10,
    marginLeft: 10,
    color: 'white',
    borderRadius: 5,
  },
  textplus: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
  button_tracker: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    marginLeft: 10,
    borderColor: '#fe8100',
    borderWidth: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#4c6a78',
    textAlign: 'center',
    fontSize: 12,
  },
  text_tracker: {
    color: '#fe8100',
    textAlign: 'center',
  }
});


function ProfileStack() {
  console.log('[TEST] ProfileStack called');
  return (
    <Stack.Navigator>
      <Stack.Screen name="User_Profile"
        component={UserProfile}
        options={({ navigation }) => ({
          title: 'Profile',
          // headerShown: false,
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="Edit_User"
        component={UserEdit}
        options={({ navigation }) => ({
          title: 'Edit Profile', headerTitleAlign: 'center'
        })}
      />
      <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  );
}






function FullMembershipStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="gymSelection"
        component={GymSelection}
        options={{ title: 'Membership', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Membership"
        component={Membership}
        options={{ title: 'Card', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

function BasicMembershipStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Membership"
        component={Membership}
        options={{ title: 'Card', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}


function AppTabs() {
  console.log('[TEST] AppTabs called');
  const { role, currentUser } = useContext(AuthContext);
  const initialRouteName = role === 'setter' ? 'AnalyticsTab' : 'Record';
  const hasFullAccess = currentUser?.image && currentUser?.isMember;

  return (
    <Tab.Navigator initialRouteName={initialRouteName}>
      <Tab.Screen
        name="Membership_Stack"
        component={hasFullAccess ? FullMembershipStack : BasicMembershipStack}
        options={{
          title: 'Membership',
          headerShown: false,
          tabBarIcon: ({ size }) => (
            <Image
              style={{ width: size, height: size - 2 }}
              source={require('../../assets/card_collec_icon.png')}
            />
          ),
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

    </Tab.Navigator>
  );
}

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    // console.log('Authorization status:', authStatus);
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
