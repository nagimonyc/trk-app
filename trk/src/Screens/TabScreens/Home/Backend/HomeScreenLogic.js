import React, { useContext, useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../../../NfcUtils/readClimb';
import ClimbsApi from '../../../../api/ClimbsApi';
import Image from '../../../../Components/Image';
import analytics from '@react-native-firebase/analytics';
import TapsApi from '../../../../api/TapsApi';


export const useHomeScreenLogic = (props) => {
  const [climbsHistory, setClimbsHistory] = useState([]);

  // Initialize androidPromptRef conditionally based on the platform
  const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;


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

  return {
    climbsHistory,
    androidPromptRef,
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