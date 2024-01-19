/**
 * @format
 */
import './shim';

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid} from 'react-native';
//Push Notification Handler
PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
    // Perform background task or prepare data for foreground handling
});

AppRegistry.registerComponent('Nagimo', () => App);
