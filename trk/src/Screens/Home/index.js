import React, { useContext, useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../NfcUtils/readClimb';
import ClimbsApi from '../../api/ClimbsApi';
import Image from '../../Components/Image';
import AndroidPrompt from '../../Components/AndroidPrompt';
import { AuthContext } from '../../Utils/AuthContext';
import analytics from '@react-native-firebase/analytics';
import TapsApi from '../../api/TapsApi';
import TapHistory from '../../Components/TapHistory';

function HomeScreen(props) {
  console.log('[TEST] HomeScreen called');
  const [climbsHistory, setClimbsHistory] = useState([]);


  // Initialize androidPromptRef conditionally based on the platform
  const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;

  // Navigation
  const { navigation } = props;

  const logo = require('../../../assets/nagimo-logo.png');

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
        .filter(tap => tap !== null);

      setClimbsHistory(newClimbsHistory);
    });

    // Make sure to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  // States
  const [hasNfc, setHasNfc] = React.useState(null);
  const [enabled, setEnabled] = React.useState(null);

  // user check
  const { currentUser } = useContext(AuthContext);

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
      const { getClimb } = ClimbsApi();
      const climbId = await readClimb();
      const climbData = await getClimb(climbId[0]); // Fetch climb data using ID
      if (climbData.exists) { //check if climb exists and if the user is the setter, if not, allow them to read the climb
        if (currentUser.uid !== climbData.data().setter) {
          const { addTap } = TapsApi();
          const tap = {
            climb: climbId[0],
            user: currentUser.uid,
            timestamp: new Date(),
            completion: 0,
            attempts: '',
            witness1: '',
            witness2: '',
          }
          const documentReference = await addTap(tap);
          const newTapId = documentReference.id;
          navigation.navigate('Detail', { climbData: climbData.data(), tapId: newTapId, climbId: climbId[0] });
        } else {
          navigation.navigate('Detail', { climbData: climbData.data(), climbId: climbId[0] })
        }

      } else {
        Alert.alert('Error', 'Climb not found!', [{ text: 'OK' }]);
      }
    } catch (ex) {
      console.warn(ex);
    } finally {
      NfcManager.cancelTechnologyRequest();
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

  return (
    <>
      <View style={[styles.wrapper, styles.center]}>

        {renderNfcButtons()}
        <View style={[styles.effortHistoryList, {}]}>
          <Text style={{ fontSize: 25, fontWeight: '600', textAlign: 'left', marginLeft: 20, marginTop: 20 }}>Latest Gym Taps</Text>
          <TapHistory climbsHistory={climbsHistory} fromHome={true} />
        </View>
      </View>
      {(androidPromptRef) ? <AndroidPrompt ref={androidPromptRef} onCancelPress={() => NfcManager.cancelTechnologyRequest()} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
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
  },
  effortHistoryList: {
    flex: 1,
    width: '100%',
    color: 'black',
  },

});

export default HomeScreen;
