import React, { useContext, useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, SafeAreaView, Image } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'; // Ensure you import useRoute
import NfcManager from 'react-native-nfc-manager';
import AndroidPrompt from '../../../../Components/AndroidPrompt';
import TapHistory from '../../../../Components/TapHistory';
import logic from '../Backend/logic';
import OnboardingModal from '../../../../Components/OnboardingModal';
import { AuthContext } from '../../../../Utils/AuthContext';

function RecordScreen(props) {
    console.log('[TEST] RecordScreen called');

    const { isNewUser, completeOnboarding } = useContext(AuthContext);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const route = useRoute(); // Use useRoute to access the current route
    const navigation = useNavigation(); // If not already using useNavigation
    const logo = require('../../../../../assets/nagimo-logo2.png');


    useEffect(() => {
        if (route.params?.showOnboardingModal) {
            setShowOnboarding(true);
        }
    }, [route.params]);

    useEffect(() => {
        if (isNewUser) {
            setShowOnboarding(true);
        }
    });


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
        tapId,
        climb,
        tapObj,
    } = logic(props);
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                {/* idle card */}
                {tapId !== null && climb !== null && (
                <View style={styles.idleCard}>
                    {/* top part */}
                    <View style={styles.topPart}>
                        {/* Media */}
                        <View style={styles.media}>
                            <Image source={require('../../../../../assets/add-photo-image-(3).png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
                            <Text style={{ marginTop: 15, fontSize: 12, fontWeight: 500, color: '#505050' }}>Add Media</Text>
                        </View>
                        {/* Text */}
                        <View style={styles.textContainer}>
                            <Text style={[styles.text, styles.climbCardText, {color: 'black'}]}>🎉 Climb Found 🎉</Text>
                            <View style={styles.momentumTextWrapper}>
                                <View style={styles.inlineContainer}>
                                    {tapObj.tapNumber == 1 && (
                                    <Text style={[styles.text, styles.momentumText, {color: 'black', marginBottom: 5}]}>Record a <Text style={{fontWeight: 'bold'}}>video</Text> to <Text style={{fontWeight: 'bold'}}>unlock</Text> Climb Card!</Text>
                                    )}
                                    {tapObj.tapNumber > 1 && (
                                    <Text style={[styles.text, styles.momentumText, {color: 'black', marginBottom: 5}]}>You've taken on this climb before!</Text>
                                    )}
                                    </View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    {/* bottom part */}
                    <View style={styles.bottomPart}>
                        {/* image & color */}
                        <View style={[styles.climbNoBg]}>
                            <Text style={{ textAlign: 'center', fontSize: 42, color: 'black'}}>
                                ?
                            </Text>
                        </View>
                        <View style={styles.climbColor}>
                        </View>
                        <View style={{ flexDirection: 'column', marginLeft: 15 }}>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Name</Text>
                                <Text style={{ fontSize: 20, color: 'black', paddingVertical: 5}}>{climb.name}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Grade</Text>
                                <Text style={{ fontSize: 30, fontWeight: 400, paddingVertical: 5, color: 'black'}}>{climb.grade}</Text>
                            </View>
                        </View>
                    </View>
                </View>)}

                {(tapId == null || climb == null) && (
               
               <View style={styles.idleCard}>
                    {/* top part */}
                    <View style={styles.topPart}>
                        {/* Media */}
                        <View style={styles.media}>
                            <Image source={require('../../../../../assets/add-photo-image-(3).png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
                            <Text style={{ marginTop: 15, fontSize: 12, fontWeight: 500, color: '#505050' }}>Add Media</Text>
                        </View>
                        {/* Text */}
                        <View style={styles.textContainer}>
                            <Text style={[styles.text, styles.climbCardText, {color: 'black'}]}>🃏 Climb Card 🃏</Text>
                            <View style={styles.momentumTextWrapper}>
                            <View style={styles.inlineContainer}>
                                <Text style={[styles.text, styles.momentumText, {color: 'black', marginBottom: 5}]}>
                                    Tap 
                                </Text>
                                <Image source={logo} style={styles.logo} resizeMode="contain" />
                                <Text style={[styles.text, styles.momentumText, {color: 'black', marginBottom: 5}]}>
                                    to collect your first card!
                                </Text>
                            </View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    {/* bottom part */}
                    <View style={styles.bottomPart}>
                        {/* image & color */}
                        <View style={[styles.climbNoBg]}>
                            <Text style={{ textAlign: 'center', fontSize: 42, color: 'black'}}>
                                ?
                            </Text>
                        </View>
                        <View style={styles.climbColor}>
                        </View>
                        <View style={{ flexDirection: 'column', marginLeft: 15 }}>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Name</Text>
                                <Text style={{ fontSize: 20, color: 'black', paddingVertical: 5}}>?</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Grade</Text>
                                <Text style={{ fontSize: 30, fontWeight: 400, paddingVertical: 5, color: 'black'}}>?</Text>
                            </View>
                        </View>
                    </View>
                </View>)}
                <View>
                    {renderNfcButtons()}
                </View>
            </View>
            {(androidPromptRef) ? <AndroidPrompt ref={androidPromptRef} onCancelPress={() => NfcManager.cancelTechnologyRequest()} /> : null}
            <OnboardingModal isVisible={showOnboarding} onClose={handleCloseOnboarding} />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    //Simplified CSS logic (one style variable)
    idleCard: {
        backgroundColor: 'white',
        marginHorizontal: 10,
        marginTop: 20,
        borderRadius: 15,
        height: 340
    },
    topPart: {
        flexDirection: 'row',
        margin: 15,
    },
    bottomPart: {
        flexDirection: 'row',
        margin: 15,
        marginBottom: 10

    },
    media: {
        width: 125,
        height: 145,
        backgroundColor: '#D9D9D9',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center', // Aligns children to the center of the container
        paddingHorizontal: 10,
    },
    climbCardText: {
        alignSelf: 'center', // Centers the text horizontally
        fontSize: 16,
        fontWeight: '700',
        position: 'absolute', // Positions the text absolutely within the container
        top: 0, // Aligns the text to the top of the container
        width: '100%', // Ensures the text is as wide as the container
        textAlign: 'center', // Centers the text within its own container
    },
    momentumText: {
        alignSelf: 'center', // Centers the text horizontally
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center'
    },
    momentumTextWrapper: {
        flex: 1,
        justifyContent: 'center', // Centers child vertically in the available space
        flexDirection: 'row', // Aligns children in a row
        alignItems: 'center', // Centers children vertically in the row
        marginTop: 20
    },
    inlineContainer: {
        flexDirection: 'column', // Aligns children in a row
        alignItems: 'center', // Centers children vertically in the row
    },
    logo: {
        height: 20, // Adjust this value to match your text size
        width: 20, // The width will adjust automatically keeping aspect ratio
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 15,
    },
    climbNoBg: {
        width: 120,
        height: 130,
        borderRadius: 10,
        borderColor: '#DEDEDE',
        borderWidth: 1,
        justifyContent: 'center',
    },
    climbColor: {
        width: 35,
        height: 130,
        backgroundColor: '#fe8100',
        marginLeft: 8,
    },
});

export default RecordScreen;
