import { Text, View, StyleSheet } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import AndroidPrompt from '../../Components/AndroidPrompt';
import TapHistory from '../../Components/TapHistory';
import useHomeScreenLogic from '../Home_Backend/HomeScreenLogic';

function HomeScreen(props) {
  console.log('[TEST] HomeScreen called');
  const {
    renderNfcButtons,
    climbsHistory,
    androidPromptRef,
    logo
  } = useHomeScreenLogic(props);

  return (
    <>
      <View style={[styles.wrapper, styles.center]}>

        {renderNfcButtons()}
        <View style={[styles.effortHistoryList, {}]}>
          <Text style={{ fontSize: 25, fontWeight: '600', textAlign: 'left', marginLeft: 20, marginTop: 20, color: 'black'}}>Latest Gym Taps</Text>
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
  effortHistoryList: {
    flex: 1,
    width: '100%',
    color: 'black',
  },
});

export default HomeScreen;
