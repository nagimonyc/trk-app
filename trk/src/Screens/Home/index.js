import React, { useContext } from 'react';
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

function HomeScreen(props) {
  console.log('[TEST] HomeScreen called');

  // Initialize androidPromptRef conditionally based on the platform
  const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;

  // Navigation
  const { navigation } = props;

  const logo = require('../../../assets/nagimo-logo.png');

  // API Call to database


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
      const climbId = await readClimb(); // Read climb ID from NFC tag
      if (climbId && climbId[0]) {
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
  
    analytics().logEvent('Tap to Track pressed', {
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
        <>
          <Text style={styles.tapText}>Tap to Track</Text>
          <TouchableOpacity style={styles.button} onPress={identifyClimb}>
            <Image source={logo} style={styles.image} resizeMode="contain" />
          </TouchableOpacity>
        </>
      );
    };

  }

  return (
    <>
      <View style={[styles.wrapper, styles.center]}>

        {renderNfcButtons()}
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
    color: 'black',
    fontSize: 25,
    marginBottom: 25,
    fontWeight: '600'
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
  },

});

export default HomeScreen;
