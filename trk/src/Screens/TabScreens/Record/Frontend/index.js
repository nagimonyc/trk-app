import { Text, View, StyleSheet } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import AndroidPrompt from '../../../../Components/AndroidPrompt';
import TapHistory from '../../../../Components/TapHistory';
import logic from '../Backend/logic';

function RecordScreen(props) {
    console.log('[TEST] RecordScreen called');
    const {
        renderNfcButtons,
        androidPromptRef,
    } = logic(props);
    return (
        <>
            <View style={styles.center}>
                {renderNfcButtons()}
            </View>
            {(androidPromptRef) ? <AndroidPrompt ref={androidPromptRef} onCancelPress={() => NfcManager.cancelTechnologyRequest()} /> : null}
        </>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
    },
});

export default RecordScreen;
