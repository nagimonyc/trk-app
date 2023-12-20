import React, { useContext, useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../NfcUtils/readClimb';
import ClimbsApi from '../../api/ClimbsApi';
import Image from '../../Components/Image';
import { AuthContext } from '../../Utils/AuthContext';
import analytics from '@react-native-firebase/analytics';
import TapsApi from '../../api/TapsApi';

export const useHomeScreenLogic = (props) => {
  const [climbsHistory, setClimbsHistory] = useState([]);
  // Initialize androidPromptRef conditionally based on the platform
  const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;
  // Navigation
  const { navigation } = props;
  const logo = require('../../../assets/nagimo-logo.png');
  // States
  const [hasNfc, setHasNfc] = React.useState(null);
  const [enabled, setEnabled] = React.useState(null);
  // user check
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const { onLatestFourTapsUpdate } = TapsApi(); // Assuming this is the method for subscribing to changes
    const { getClimb } = ClimbsApi();

    const unsubscribe = onLatestFourTapsUpdate(async (querySnapshot) => {
      // Handle the real-time updates here
      const climbDetailsPromises = querySnapshot.docs.map(async (doc) => {
        const tapData = doc.data();
        const climbSnapshot = await getClimb(tapData.climb);
        // Extract and format the timestamp
        let timestamp = tapData.timestamp;
        if (timestamp.toDate) { // Convert Firebase Timestamp to JavaScript Date
          timestamp = timestamp.toDate().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/New_York' // NEW YORK TIME
          });
        }
        return climbSnapshot.exists ? {
          ...tapData,
          tapTimestamp: timestamp,
          tapId: doc.id,
          ...climbSnapshot.data(),
        } : null;
      });



      const newClimbsHistory = (await Promise.all(climbDetailsPromises))
        .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false));

      setClimbsHistory(newClimbsHistory);
    });

    // Make sure to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  React.useEffect(() => {
    console.log('[TEST] HomeScreen useEffect called');
    async function checkNfc() {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        setEnabled(await NfcManager.isEnabled());
      }
      setHasNfc(supported);
    }
    checkNfc();
  }, []);


  async function identifyClimb() {
    if (Platform.OS === 'android') {
      androidPromptRef.current.setVisible(true);
    }
  
    try {
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const climbId = await readClimb(); // Read climb ID from NFC tag
      if (climbId && climbId[0]) {
        console.log(climbId[0]);
        navigation.navigate('Detail', { climbId: climbId[0], isFromHome: true }); // Navigate with climbId
      } else {
        throw new Error('Invalid climb ID'); // Handle invalid climb ID
      }
    } catch (ex) {
      Alert.alert('Error', ex.message || 'Climb not found!', [{ text: 'OK' }]);
    } finally {
      NfcManager.cancelTechnologyRequest();
      if (Platform.OS === 'android') {
        androidPromptRef.current.setVisible(false);
      }
    }

    if (Platform.OS === 'android') {
      androidPromptRef.current.setVisible(false);
    }

    analytics().logEvent('Tap_to_Track_pressed', {
      user_id: currentUser.uid,
      timestamp: new Date().toISOString()
    });
  }

  function renderNfcButtons() {
    if (hasNfc === null) {
      return null;
    } else if (!hasNfc) {

      return (
        <>
          <Text style={styles.tapText}>Your device doesn't support NFC</Text>
          <Image source={logo} style={styles.image} resizeMode="contain" />
        </>
      );
    } else if (!enabled) {
      return (
        <>
          <Text style={styles.tapText}>Your NFC is not enabled!</Text>
          <Image source={logo} style={styles.image} resizeMode="contain" />
          <TouchableOpacity onPress={() => { NfcManager.goToNfcSetting(); }}>
            <Text>GO TO NFC SETTINGS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { setEnabled(await NfcManager.isEnabled()); }}>
            <Text>CHECK AGAIN</Text>
          </TouchableOpacity>
        </>
      );
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Text style={styles.tapText}>Tap to Track</Text>
          <TouchableOpacity style={styles.button} onPress={identifyClimb}>
            <Image source={logo} style={styles.image} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      );
    };

  }
    return {
        renderNfcButtons,
        climbsHistory,
        androidPromptRef,
        logo
    };
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 60,
    marginTop: 15,
  },
  tapText: {
    marginTop: 50,
    textAlign: 'center',
    color: 'black',
    fontSize: 25,
    marginBottom: 10,
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    color: 'black'
  }

});

export default useHomeScreenLogic;