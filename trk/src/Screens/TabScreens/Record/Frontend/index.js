import React, { useContext, useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import AndroidPrompt from '../../../../Components/AndroidPrompt';
import TapHistory from '../../../../Components/TapHistory';
import logic from '../Backend/logic';
import OnboardingModal from '../../../../Components/OnboardingModal';

function RecordScreen(props) {
    console.log('[TEST] RecordScreen called');
    const {
        renderNfcButtons,
        androidPromptRef,
        showOnboarding,
        handleHelpPress,
        handleCloseOnboarding
    } = logic(props);
    return (
        <>
            <View style={{ alignItems: 'flex-end' }}>
                <Button title="Help" onPress={handleHelpPress} />
            </View>
            <View style={styles.center}>
                {renderNfcButtons()}
            </View>
            {(androidPromptRef) ? <AndroidPrompt ref={androidPromptRef} onCancelPress={() => NfcManager.cancelTechnologyRequest()} /> : null}
            <OnboardingModal isVisible={showOnboarding} onClose={handleCloseOnboarding} />
        </>
    );
}

const styles = StyleSheet.create({
    //Simplified CSS logic (one style variable)
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
    },
});

export default RecordScreen;
