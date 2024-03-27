import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Image } from 'react-native';
import { Platform, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
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
import ShareView from '../Screens/NavScreens/ShareSession/Frontend';
import FollowScreen from '../Screens/TabScreens/Follow';
import Community from '../Components/Community';
import New_Share from '../Components/New_Share';
import Collection from '../Components/Collection';

import VideoGrid from '../Components/VideoGrid';

import Notification from '../Screens/NavScreens/Notification/Frontend';
import RoomsScreen from '../Components/RoomsScreen';
import UsersScreen from '../Components/UsersScreen';
import PayUI from '../Screens/NavScreens/Pay/Frontend';

//Created FollowPage, and altered name of Tracker (now Live Taps)-> as discussed in the meeting
//Added live tracker to other components
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const GymTopTab = createMaterialTopTabNavigator();
const ClimbInputStack = createStackNavigator();


//Smaller Feedback Button
const FeedbackButton = ({ onPress, title, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('Developer_Feedback')} style={styles.button}>
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

//Smaller Feedback Button
const NagimoPlusButton = ({ onPress, title, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('Payment_Portal')} style={styles.buttonplus}>
    <Text style={styles.textplus}>{title}</Text>
  </TouchableOpacity>
);

const MessageButton = ({ onPress, title, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('Rooms_Screen')} style={styles.button}>
    <Image source={require('../../assets/message.png')} style={{ width: 21, height: 21 }} />
  </TouchableOpacity>
);

const NotificationButton = ({ navigation }) => {
  const { currentUser } = useContext(AuthContext);
  const [notificationCount, setNotificationCount] = useState(0);

  const markNotificationsAsRead = async () => {
    // Get the current user's unread notifications from Firestore
    const notificationsSnapshot = await firestore()
      .collection('notifications')
      .where('userId', '==', currentUser.uid)
      .where('seen', '==', false)
      .get();

    // Create a batch to perform multiple write operations as a single transaction
    const batch = firestore().batch();

    notificationsSnapshot.forEach((doc) => {
      // For each unread notification, set 'seen' to true
      const notificationRef = firestore().collection('notifications').doc(doc.id);
      batch.update(notificationRef, { seen: true });
    });

    // Commit the batch
    await batch.commit();

    // Reset the notification count
    setNotificationCount(0);
  };

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('notifications')
      .where('userId', '==', currentUser.uid)
      .where('seen', '==', false) // Adjust this based on your notification document structure
      .onSnapshot(snapshot => {
        // Count the number of unread notifications
        const unreadCount = snapshot.docs.length;
        setNotificationCount(unreadCount);
      });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [currentUser.uid]);

  return (
    <TouchableOpacity onPress={() => {
      navigation.navigate('Notification');
      markNotificationsAsRead();
    }} style={styles.button}>
      <Image source={require('../../assets/notifications.png')} style={{ width: 18, height: 21 }} />
      {notificationCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>{notificationCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};



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
    color:'white',
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
  const { role } = useContext(AuthContext);
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RecordPage_stack"
        component={RecordScreen}
        options={({ navigation }) => ({
          title: role === 'setter' ? 'Scan' : 'Record',
          headerBackTitleVisible: null,
          headerTitleAlign: 'center',
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <FeedbackButton
                title="Help"
                navigation={navigation}
              />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Developer_Feedback"
        component={DeveloperFeedbackForm}
        options={{ title: 'Help', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Detail"
        component={ClimbDetailScreen}
        options={{ title: 'Climb Detail', headerBackTitle: 'Record', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Community"
        component={Community}
        options={{ title: 'Community Posts', headerBackTitle: 'Record', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="New_Share"
        component={New_Share}
        options={{ title: 'Share', headerBackTitle: 'Record', headerTitleAlign: 'center' }}
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

function CollectionStack() {
  console.log('[TEST] FollowStack called');
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Collection"
        component={Collection}
        options={({ navigation }) => ({
          title: 'Collection',
          headerBackTitleVisible: null,
          headerTitleAlign: 'center',
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <NagimoPlusButton
                title="Nagimo+"
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
        name="Payment_Portal"
        component={PayUI}
        options={{ title: 'Nagimo+', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Community"
        component={Community}
        options={{ title: 'Community Posts', headerBackTitle: 'Collection', headerTitleAlign: 'center' }}
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
          headerTitleAlign: 'center',
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
        name="Community"
        component={Community}
        options={{ title: 'Community Posts', headerBackTitle: 'Record', headerTitleAlign: 'center' }}
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
        name="Share_Session"
        component={ShareView}
        options={{ title: 'Share Session', headerBackTitle: 'Back', headerTitleAlign: 'center' }}
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
      {/* <Stack.Screen
        name="MyGym"
        component={GymTabs}
        options={({ navigation }) => ({
          title: 'My Gym',
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
        })}
      />  */}
      <Stack.Screen
        name="MyGym"
        component={VideoGrid}
        options={({ navigation }) => ({
          title: 'My Gym',
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <View style={{ display: 'flex', flexDirection: 'row' }}>
                <NotificationButton
                  title="Notification"
                  navigation={navigation}
                />
                {/* <FeedbackButton
                title="Feedback"
                navigation={navigation}
              /> 
              {/* NOTIFICATION ICON HERE */}
              </View>
            </View>
          ),
          headerLeft: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <View style={{ display: 'flex', flexDirection: 'row' }}>
                <MessageButton
                  title="Messages"
                  navigation={navigation}
                />
                {/* <FeedbackButton
                title="Feedback"
                navigation={navigation}
              /> */}
                {/* NOTIFICATION ICON HERE */}
              </View>
            </View>
          ),
        })
        }
      />
      <Stack.Screen
        name="Notification"
        component={Notification}
        options={{ title: 'Notifications', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Rooms_Screen"
        component={RoomsScreen}
        options={{ title: 'Chats', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="UsersScreen"
        component={UsersScreen}
        options={{ title: 'New Chat', headerTitleAlign: 'center' }}
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
          headerTitleAlign: 'center',
          headerRight: () => (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <View style={{ display: 'flex', flexDirection: 'row' }}>
                <FeedbackButton
                  title="Feedback"
                  navigation={navigation}
                />
              </View>
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
  const initialRouteName = role === 'setter' ? 'AnalyticsTab' : 'Record';

  return (
    <Tab.Navigator initialRouteName={initialRouteName}>
      {/* <Tab.Screen
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

      /> */}
      {role === 'setter' && (
        <>
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
          />

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
          />

          <Tab.Screen
            name="Record"
            component={RecordStack}
            options={{
              title: 'Scan',
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
        </>
      )}

      {role !== 'setter' && (<Tab.Screen
        name="Collection_Stack"
        component={CollectionStack}
        options={{
          title: 'Collection',
          headerShown: false,
          tabBarIcon: ({ size, focused, color }) => {
            return (
              <Image
                style={{ width: size, height: size - 2 }}
                source={require('../../assets/card_collec_icon.png')}
              />
            );
          },
        }}

      />)}


      {/* {role !== 'setter' && (
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
        />)} */}


      {/* <Tab.Screen
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
      /> */}
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
