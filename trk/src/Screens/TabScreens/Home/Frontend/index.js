import { Text, View, StyleSheet, Image } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import AndroidPrompt from '../../../../Components/AndroidPrompt';
import TapHistory from '../../../../Components/TapHistory';
import useHomeScreenLogic from '../Backend/HomeScreenLogic';

function HomeScreen(props) {
    console.log('[TEST] HomeScreen called');
    const {
        climbsHistory,
        androidPromptRef,
        logo
    } = useHomeScreenLogic(props);
    return (
        <>
            <View style={[styles.wrapper]}>
                <View style={{ width: '100%' }}>
                    <Text style={[styles.headerHome]}>Gym</Text>
                    <View style={{ backgroundColor: '#0B1D4E' }}>
                        <Image source={require('../../../../../assets/movementlicLogo.png')} style={{ width: '80%', height: 80, padding: 20 }} resizeMode="contain" />
                    </View>
                </View>
                <View style={[styles.effortHistoryList, {}]}>
                    <Text style={[styles.headerHome]}>Latest Gym Taps</Text>
                    <TapHistory climbsHistory={climbsHistory} fromHome={true} />
                </View>
            </View >
            {(androidPromptRef) ? <AndroidPrompt ref={androidPromptRef} onCancelPress={() => NfcManager.cancelTechnologyRequest()} /> : null
            }
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
    headerHome: {
        fontSize: 25,
        fontWeight: '600',
        textAlign: 'left',
        marginLeft: 20,
        marginTop: 20,
        marginBottom: 5,
        color: 'black'
    },
    effortHistoryList: {
        flex: 1,
        width: '100%',
        color: 'black',
    },
});

export default HomeScreen;
