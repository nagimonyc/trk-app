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
});

export default RecordScreen;
