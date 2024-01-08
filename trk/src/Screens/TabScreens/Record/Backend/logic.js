import React, { useContext, useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../../../NfcUtils/readClimb';
import Image from '../../../../Components/Image';
import { AuthContext } from '../../../../Utils/AuthContext';
import analytics from '@react-native-firebase/analytics';

import { useDispatch } from 'react-redux';
import { addClimb } from '../../../../Actions/tapActions';

import NetInfo from '@react-native-community/netinfo';

export const useHomeScreenLogic = (props) => {

    // Initialize androidPromptRef conditionally based on the platform
    const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;
    // Navigation
    const { navigation } = props;
    const logo = require('../../../../../assets/nagimo-logo.png');
    // States
    const [hasNfc, setHasNfc] = React.useState(null);
    const [enabled, setEnabled] = React.useState(null);
    // user check
    const { currentUser } = useContext(AuthContext);

    const dispatch = useDispatch();


    const checkConnectivity = (climbId) => {
        NetInfo.fetch().then(state => {
            console.log("Is connected?", state.isConnected);
            if (state.isConnected) {
                console.log('Navigating');
                navigation.navigate('Detail', { climbId: climbId[0], isFromHome: true });
            } else {
                dispatch(addClimb(climbId[0], currentUser));
                Alert.alert('Offline Action', 'Your action is saved and will be processed when you\'re online.', [{ text: 'OK' }]);
            }
        });
    };


    useEffect(() => {
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
        let isReading = true;  // Flag to indicate NFC reading is in progress

        if (Platform.OS === 'android') {
            androidPromptRef.current.setVisible(true);
        }

        try {
            await NfcManager.requestTechnology(NfcTech.NfcA);
            const climbId = await readClimb();
            isReading = false;  // Clear the flag on successful read

            if (climbId && climbId[0]) {
                console.log(climbId[0]);
                console.log('Climb ID worked');
                //Better way to verify climb_id
                checkConnectivity(climbId);
                //navigation.navigate('Detail', { climbId: climbId[0], isFromHome: true });
            } else {
                throw new Error('Invalid climb ID');
            }
        } catch (ex) {
            if (isReading) {
                Alert.alert('Info', 'Climb tagging cancelled.', [{ text: 'OK' }]);
            } else {
                Alert.alert('Error', ex.message || 'Climb not found!', [{ text: 'OK' }]);
            }
        } finally {
            NfcManager.cancelTechnologyRequest();
            if (Platform.OS === 'android') {
                androidPromptRef.current.setVisible(false);
            }
        }

        if (Platform.OS === 'android') {
            androidPromptRef.current.setVisible(false);
        }

        analytics().logEvent('Tap_to_Track_pressed', {
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
                <View style={{ flex: 1 }}>
                    <Text style={styles.tapText}>Completed a climb?</Text>
                    <Text style={styles.celebration}>🎉🎉🎉</Text>
                    <Text style={styles.instructions}>Tap below to save your achievement</Text>
                    <TouchableOpacity style={styles.button} onPress={identifyClimb}>
                        <Image source={logo} style={styles.image} resizeMode="contain" />
                    </TouchableOpacity>
                </View>
            );
        };

    }
    return {
        renderNfcButtons,
        androidPromptRef,
    };
};

const styles = StyleSheet.create({
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
        marginTop: 100,
        textAlign: 'center',
        color: 'black',
        fontSize: 25,
        marginBottom: 10,
        fontWeight: '600',
    },
  celebration: {
        marginTop: 20,
        textAlign: 'center',
        color: 'black',
        fontSize: 20,
        marginBottom: 10,
    },
  instructions: {
        marginTop: 30,
        textAlign: 'center',
        color: 'black',
        fontSize: 20,
        marginBottom: 10,
        marginHorizontal: 40,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 5,
        color: 'black',
        marginTop: 50,
    }

});

export default useHomeScreenLogic;