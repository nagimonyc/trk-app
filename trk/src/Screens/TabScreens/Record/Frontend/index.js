import React, { useContext, useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; // Ensure you import useRoute
import NfcManager from 'react-native-nfc-manager';
import AndroidPrompt from '../../../../Components/AndroidPrompt';
import TapHistory from '../../../../Components/TapHistory';
import logic from '../Backend/logic';
import OnboardingModal from '../../../../Components/OnboardingModal';
import { AuthContext } from '../../../../Utils/AuthContext';

function RecordScreen(props) {
    console.log('[TEST] RecordScreen called');

    const { isNewUser, completeOnboarding } = useContext(AuthContext);
    const [showOnboarding, setShowOnboarding] = useState(isNewUser);
    const route = useRoute(); // Use useRoute to access the current route
    const navigation = useNavigation(); // If not already using useNavigation


    useEffect(() => {
        if (route.params?.showOnboardingModal) {
            setShowOnboarding(true);
        }
    }, [route.params]);


    const handleCloseOnboarding = () => {
        setShowOnboarding(false);
        completeOnboarding(); // Call this function to update the user's isNewUser status in your AuthContext and Firestore
    };
    const handleHelpPress = () => {
        setShowOnboarding(true); // Re-open the onboarding modal
    };

    // const showOnboarding = props.route.params?.showOnboarding || false;
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
