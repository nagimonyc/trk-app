import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../NfcUtils/readClimb';
import ClimbsApi from '../../api/ClimbsApi';
import Image from '../../Components/Image';
import AndroidPrompt from '../../Components/AndroidPrompt';

function HomeScreen(props) {
  const { navigation } = props;
  const androidPromptRef = React.useRef();
  const [hasNfc, setHasNfc] = React.useState(null);
  const [enabled, setEnabled] = React.useState(null);
  const { getClimb } = ClimbsApi(); // Use getClimb from your ClimbsApi

  React.useEffect(() => {
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
      const climbId = await readClimb();
      const climbData = await getClimb(climbId[0]); // Fetch climb data using ID
      if (climbData.exists) {
        console.log('Climb found:', climbData.data());
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
  }

  function renderNfcButtons() {
    if (hasNfc === null) {
      return null;
    } else if (!hasNfc) {
      return <Text>Your device doesn't support NFC</Text>;
    } else if (!enabled) {
      return (
        <>
          <Text>Your NFC is not enabled!</Text>
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
          <Button mode="contained" style={styles.btn} onPress={() => { navigation.navigate('List'); }}>
            Create Climb
          </Button>
          <Button mode="contained" style={styles.btn} onPress={identifyClimb}>
            Identify Climb
          </Button>
        </>
      );
    }
  }

  return (
    <>
      <View style={[styles.wrapper, styles.center]}>
        <Image source={require('../../../images/climb.png')} style={styles.banner} resizeMode="contain" />
        {renderNfcButtons()}
      </View>
      <AndroidPrompt ref={androidPromptRef} onCancelPress={() => NfcManager.cancelTechnologyRequest()} />
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
  btn: {
    width: 240,
    marginBottom: 20,
  },
  banner: {
    width: 240,
    height: 240,
    marginBottom: 60,
  },
});

export default HomeScreen;
