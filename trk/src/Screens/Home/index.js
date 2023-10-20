import React, { useContext } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../NfcUtils/readClimb';
import ClimbsApi from '../../api/ClimbsApi';
import Image from '../../Components/Image';
import AndroidPrompt from '../../Components/AndroidPrompt';
import SignOut from '../../Components/SignOut';
import { AuthContext } from '../../Utils/AuthContext';
import TapsApi from '../../api/TapsApi';

function HomeScreen(props) {
  console.log('[TEST] HomeScreen called');
  // Android
  if (Platform.OS === 'android') {
    const androidPromptRef = React.useRef();
  }

  // Navigation
  const { navigation } = props;

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
      const { getClimb } = ClimbsApi();
      const climbId = await readClimb();
      const climbData = await getClimb(climbId[0]); // Fetch climb data using ID
      if (climbData.exists) { //check if climb exists and if the user is the setter, if not, allow them to read the climb
        console.log('Climb found:', climbData.data());
        Alert.alert('Success', `Climb ID: ${climbId[0]} has been successfully read!`, [{ text: 'OK' }])

        if (currentUser.uid !== climbData.data().setter) {
          const { addTap } = TapsApi();
          const tap = {
            climb: climbId[0],
            user: currentUser.uid,
            timestamp: new Date(),
            completion: '',
            attempts: '',
            witness1: '',
            witness2: '',
          }
          const documentReference = await addTap(tap);
          const newTapId = documentReference.id;
          console.log("New Tap ID is:", newTapId);
          navigation.navigate('Detail', { climbData: climbData.data(), tapId: newTapId });
        } else {
        navigation.navigate('Detail', { climbData: climbData.data() })}

      } else {
        Alert.alert('Error', 'Climb not found!', [{ text: 'OK' }]);
      }
    } catch (ex) {
      // console.warn(ex);
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
        <Image source={require('../../../assets/climb.png')} style={styles.banner} resizeMode="contain" />
        {renderNfcButtons()}
        <Button mode="contained" onPress={SignOut}>
          Sign Out
        </Button>
      </View>
      {(Platform.OS === 'android') ? <AndroidPrompt ref={androidPromptRef} onCancelPress={() => NfcManager.cancelTechnologyRequest()} /> : null}
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
