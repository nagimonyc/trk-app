import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform, Animated } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../../../NfcUtils/readClimb';
import Image from '../../../../Components/Image';
import { AuthContext } from '../../../../Utils/AuthContext';
import analytics from '@react-native-firebase/analytics';
import { useFocusEffect } from '@react-navigation/native';

import { useDispatch } from 'react-redux';
import { addClimb } from '../../../../Actions/tapActions';
import tapMessage from '../../../../../assets/tagMessages.json'

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useHomeScreenLogic = (props) => {
    // Animation
    const logoScale = useRef(new Animated.Value(1)).current;

    // Initialize androidPromptRef conditionally based on the platform
    const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;
    // Navigation
    const { navigation } = props;
    const logo = require('../../../../../assets/nagimo-logo.png');
    // States
    const [hasNfc, setHasNfc] = React.useState(null);
    const [enabled, setEnabled] = React.useState(null);
    // user check
    const { currentUser, role } = useContext(AuthContext);

    const dispatch = useDispatch();

    //Next PR these will actually be calculated rather than hardcoded (set the true value to the option with the most messages in JSON file)
    
    
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
    // const [isFirstClimbOfDay] = useState(false);
    let isFirstClimbOfDay = false;
    // const [isFirstClimbOfAnotherSession] = useState(false)
    let isFirstClimbOfAnotherSession = true;
    // const [isNotFirstClimb] = useState(false)
    let isNotFirstClimb = false;


    const [selectedMessage, setSelectedMessage] = useState('');
    

    function randomIndex(array) {
        return Math.floor(Math.random() * array.length);
    }

    //This sets a flag in local storage (avaible without wifi) to define if someone is FTU -> we can reuse this elsewhere if FTU/returning user needs to be checked
    const checkFirstTimeUser = async () => {
        try {
          const isFirstTime = await AsyncStorage.getItem('isFirstTimeUser');
          if (isFirstTime === null) {
            // It's the first time, set the flag
            await AsyncStorage.setItem('isFirstTimeUser', 'true');
            setIsFirstTimeUser(true); // Set state to true
          } else {
            setIsFirstTimeUser(false); // Set state to false if not first time
          }
        } catch (error) {
          console.error('Error checking first-time user status:', error);
          setIsFirstTimeUser(false); // Default to false in case of error
        }
      };
  
      useFocusEffect(
        useCallback(() => {
            checkFirstTimeUser();
        }, [])
    );
    const selectRandomMessage = useCallback(() => {
        let message;
        if (isFirstTimeUser) {
            message = tapMessage.FTU[randomIndex(tapMessage.FTU)];
        } else if (isFirstClimbOfDay) {
            message = tapMessage.FirstClimbOfDay[randomIndex(tapMessage.FirstClimbOfDay)];
        } else if (isFirstClimbOfAnotherSession) {
            message = tapMessage.FirstClimbOfAnotherSession[randomIndex(tapMessage.FirstClimbOfAnotherSession)];
        } else if (isNotFirstClimb) {
            message = tapMessage.NotFirstClimb[randomIndex(tapMessage.NotFirstClimb)];
        } else {
            // Default message or other logic
            message = "Completed a climb? 🎉🎉🎉  Tap below to save your achievement";
        }
        setSelectedMessage(message);
    }, [isFirstTimeUser, isFirstClimbOfDay]);

    useEffect(() => {
        selectRandomMessage();
    }, [isFirstTimeUser]);

    useFocusEffect(selectRandomMessage);
  
    // Create an animation function
    const startLogoAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoScale, {
                    toValue: 1.05, // Slightly larger
                    duration: 1750,
                    useNativeDriver: true,
                }),
                Animated.timing(logoScale, {
                    toValue: 1, // Back to normal
                    duration: 1750,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const checkConnectivity = (climbId) => {
        NetInfo.fetch().then(state => {
            console.log("Is connected?", state.isConnected);
            if (state.isConnected) {
                console.log('Navigating');
                navigation.navigate('Detail', { climbId: climbId[0], isFromHome: true });
            } else {
                dispatch(addClimb(climbId[0], currentUser, role));
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
        startLogoAnimation();
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
                Alert.alert('Action', 'Climb tagging cancelled.', [{ text: 'OK' }]);
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
                    <Animated.Image
                        source={logo}
                        style={[styles.image, { transform: [{ scale: logoScale }] }]}
                        resizeMode="contain"
                    />
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

            const messageComponent = selectedMessage.split(/(?<=[.,!?  ])\s/).map((sentence, index) => (
                <Text key={index} style={index === 0 ? styles.tapText : styles.sentence}>{sentence}</Text>
            ));

            return (
                <View style={{ flex: 1 }}>
                    {messageComponent}
                    <TouchableOpacity style={styles.button} onPress={identifyClimb}>
                        <Animated.Image
                            source={logo}
                            style={[styles.image, { transform: [{ scale: logoScale }] }]}
                            resizeMode="contain"
                        />
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
    },
    sentence: {
        textAlign: 'center',
        color: 'black',
        fontSize: 25,
        marginBottom: 10,
        fontWeight: '600',
        marginTop: 20,
    },

});

export default useHomeScreenLogic;