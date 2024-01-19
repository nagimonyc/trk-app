import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform, Animated } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../../../NfcUtils/readClimb';
import Image from '../../../../Components/Image';
import { AuthContext } from '../../../../Utils/AuthContext';
import analytics from '@react-native-firebase/analytics';
import ClimbsApi from '../../../../api/ClimbsApi';
import TapsApi from '../../../../api/TapsApi';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addClimb } from '../../../../Actions/tapActions';
import tapMessage from '../../../../../assets/tagMessages.json';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import ClimbItem from '../../../../Components/ClimbItem';
import { LayoutAnimation, UIManager} from 'react-native'; //For smoother animations
import { IconButton } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { firebase } from '@react-native-firebase/functions';


//Only altered CSS with the integration of the dynamic text (UI impact only)
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

    //Storing the newly added tap data for creation of ClimbItem and future tasks.
    const [tapId, setTapId] = useState(null);
    const [climb, setClimb] = useState(null);
    const [tapObj, setTapObj] = useState(null);

    const scheduleFunction = firebase.functions().httpsCallable('scheduleFunction');

    const fadeAnim = React.useRef(new Animated.Value(0)).current;  // Initial value for opacity: 0 (Animation Value)

    const dispatch = useDispatch();

    //Right Arrow for UI (Check it out Button to match Profile)
    const RightArrow = () => (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <Path d="M9 18l6-6-6-6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
    );

    //Next PR these will actually be calculated rather than hardcoded (set the true value to the option with the most messages in JSON file)
    let isFirstTimeUser = false;
    let isFTUNotFirstClimb = false;
    let isReturningUserFirstClimbOfDay = false;
    let isReturningUserFirstClimbOfAnotherSession = true;
    let isReturningUserNotFirstClimb = false;


    const [selectedMessage, setSelectedMessage] = useState('');
    

    function randomIndex(array) {
        return Math.floor(Math.random() * array.length);
    }

    const selectRandomMessage = useCallback(() => {
        let message;
        if (isFirstTimeUser) {
            message = tapMessage.FTUFirstClimb[randomIndex(tapMessage.FTUFirstClimb)];
        } else if (isFTUNotFirstClimb) {
            message = tapMessage.FTUNotFirstClimb[randomIndex(tapMessage.FTUNotFirstClimb)];
        } else if (isReturningUserFirstClimbOfDay) {
            message = tapMessage.ReturningUserFirstClimbOfDay[randomIndex(tapMessage.ReturningUserFirstClimbOfDay)];
        } else if (isReturningUserFirstClimbOfAnotherSession) {
            message = tapMessage.ReturningUserFirstClimbOfAnotherSession[randomIndex(tapMessage.ReturningUserFirstClimbOfAnotherSession)];
        } else if (isReturningUserNotFirstClimb) {
            message = tapMessage.ReturningUserNotFirstClimb[randomIndex(tapMessage.ReturningUserNotFirstClimb)];
        } else {
            // Default message or other logic
            message = "Completed a climb? 🎉🎉🎉  Tap below to save your achievement";
        }
        setSelectedMessage(message);
    }, [isFirstTimeUser, isFTUNotFirstClimb, isReturningUserFirstClimbOfDay]);

    useFocusEffect(selectRandomMessage);
  
    // Create an animation function
    const startLogoAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoScale, {
                    toValue: 1.15, // Slightly larger
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
                //navigation.navigate('Detail', { climbId: climbId[0], isFromHome: true});
                addClimbWithNetwork(climbId[0]); //No Navigation to Climb Detail, done in record itself
            } else {
                dispatch(addClimb(climbId[0], currentUser, role));
                Alert.alert('Offline Action', 'Your action is saved and will be processed when you\'re online.', [{ text: 'OK' }]); //Offline Processing done as usual
            }
        });
    };

    const addClimbWithNetwork = async (climbId) => {
        try {
          const climbDataResult = await ClimbsApi().getClimb(climbId);
          if (climbDataResult && climbDataResult._data) {
            if (currentUser.uid !== climbDataResult._data.setter && role !== "setter") {
              const { addTap, getLastUserTap} = TapsApi();

              //Checking if it marks the start of a session. If not it is marked as the session start
              let isSessionStart = false;
              const lastTapSnapshot = await getLastUserTap(currentUser.uid);
              let lastUserTap = null;
              console.log('Snapshot: ', lastTapSnapshot.docs);
              if (!lastTapSnapshot.empty) {
                lastUserTap = lastTapSnapshot.docs[0].data();
                console.log('Last Tap Data:', lastUserTap);
              }
              const currentTime = new Date();
              const sixHoursLater = new Date(currentTime.getTime() + (6 * 60 * 60 * 1000)); // Add 6 hours in milliseconds
            if (!lastUserTap || !lastUserTap.expiryTime) {
                // No last tap or no data in last tap, start a new session
                isSessionStart = true;
            } else {
                const lastExpiryTime = lastUserTap.expiryTime ? lastUserTap.expiryTime.toDate() : null;
                if (!lastExpiryTime || currentTime > lastExpiryTime) {
                    // If expiry time is not set or current time is past the expiry time
                    console.log('Here');
                    isSessionStart = true;
                } else {
                    // Current time is within the expiry time of the last session
                    isSessionStart = false;
                }
            }            

              const tap = {
                archived: false,
                climb: climbId,
                user: currentUser.uid,
                timestamp: currentTime,
                completion: 0,
                attempts: '',
                witness1: '',
                witness2: '',
                isSessionStart: isSessionStart,
                expiryTime: isSessionStart ? sixHoursLater : (lastUserTap?.expiryTime || null),
            };

              console.log('Tap: ', tap);

            const documentReference =  await addTap(tap);
            const tapDataResult = await TapsApi().getTap(documentReference.id);
              //Notifications only sent is it marks the start of a session
              if (isSessionStart) {
                    scheduleFunction({tapId: documentReference.id, expiryTime: tap.expiryTime})
                            .then((result) => {
                                // Read result of the Cloud Function.
                                console.log('Function result:', result.data);
                            }).catch((error) => {
                                // Getting the Error details.
                                console.error('Error calling function:', error);
                            });
                }
              setClimb(climbDataResult._data);
              setTapObj(tapDataResult._data); //All relevant data is collected and set.
              setTapId(documentReference.id);
              console.log('Climb was processed!');
              console.log('Tap ID: ', documentReference.id);
              console.log('Climb: ', climbDataResult._data);
              console.log('Tap: ', tapDataResult._data);
            } else {
              console.log('The Setter is the user or this a Setter Account. Tap was not added');
              //Toasts are shown for non-recorded logic (Tap not created).
              Toast.show({
                type: 'success',
                text1: 'You are a Setter! View in Profile.',
            });
            }
          } else {
            console.error('Climb data not found');
            Toast.show({
                type: 'error',
                text1: 'Tap Processed. No climb data.',
            });
          }
        } catch (error) {
          console.error('Error processing climbId (possibly Firebase error):', error);
          Toast.show({
            type: 'error',
            text1: 'Tap Processed. Error.',
        });
        }
      }; 

      //FADE-IN AND OUT ANIMATION HANDLER
      useEffect(() => {
        if (tapId) {
          // Immediate fade-in animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
      
          // Start the flashing after 10 seconds
          const timeoutId = setTimeout(() => {
            let flashes = 0;
            const intervalId = setInterval(() => {
              // Define the flashing animation within the interval callback
              const flashingAnimation = Animated.sequence([
                Animated.timing(fadeAnim, {
                  toValue: 0.3,
                  duration: 250,
                  useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 250,
                  useNativeDriver: true,
                }),
              ]);
      
              flashingAnimation.start();
      
              flashes++;
              if (flashes >= 10) { // 10 flashes in 5 seconds
                clearInterval(intervalId);
      
                // Proceed to fade out after flashing
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 1000,
                  useNativeDriver: true,
                }).start(() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setTapId(null);
                  setClimb(null);
                  setTapObj(null);
                });
              }
            }, 500); // Flash every 500ms
      
            return () => {
              clearInterval(intervalId);
            };
          }, 10000); // Start flashing after 10 seconds
      
          return () => {
            clearTimeout(timeoutId);
          };
        }
      }, [tapId, fadeAnim]);
                 
    //Timestamp formatting for future ClimbItem call
    const timeStampFormatting = (timestamp) => {
        let tempTimestamp = null;
        if (timestamp.toDate) { // Convert Firebase Timestamp to JavaScript Date
            tempTimestamp = timestamp.toDate().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York' // NEW YORK TIME
            });
        }
        return tempTimestamp;
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
            if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }

            const messageComponent = selectedMessage.split(/(?<=[.,!?  ])\s/).map((sentence, index) => (
                <Text key={index} style={index === 0 ? styles.tapText : styles.sentence}>{sentence}</Text>
            ));

            return (
                <View style={{display: 'flex', flexDirection: 'column', margin: 0, padding: 0, justifyContent: (tapId? 'flex-start': 'center'), width: '100%', height: '100%'}}>
                    {tapId !== null && climb !== null && tapObj !== null && ( //Animated Top View
                        <Animated.View
                            style={{
                            ...styles.tapIdContainer, 
                            opacity: fadeAnim, // Bind opacity to animated value
                            }}
                        >
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20}}>
                            <Text style={{ color: 'black', fontSize: 15 }}>That's a tap!</Text>
                            <IconButton
                                icon="camera-timer"
                                iconColor="black"
                                size={20}
                                style={{ position: 'absolute', end: 0 }}
                            />
                        </View>

                        <ClimbItem climb={climb} tapId={tapId} tapTimestamp={timeStampFormatting(tapObj.timestamp)} fromHome={true}/>
                        <TouchableOpacity style={styles.navigate}
                            onPress={() => navigation.navigate('ProfileTab')}>
                           <Text style={styles.buttonText}>Check it out</Text>
                           <RightArrow style={{ width: '100%', height: '100%' }} />
                        </TouchableOpacity>

                        </Animated.View>
                    )}
                    <View style={{paddingBottom: 20, justifyContent: 'center', paddingTop: 20}}>
                    {messageComponent}
                    <TouchableOpacity style={styles.button} onPress={identifyClimb}>
                        <Animated.Image
                            source={logo}
                            style={[styles.image, { transform: [{ scale: logoScale }] }]}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    </View>
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
        marginBottom: 20,
        marginTop: 0,
    },
    tapText: {
        textAlign: 'center',
        color: 'black',
        fontSize: 20,
        fontWeight: '400'
    },
  celebration: {
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
        fontSize: 20,
    },

  instructions: {
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
        fontSize: 20,
        paddingHorizontal: 40,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 5,
        color: 'black',
        marginTop: 30,
    },
    tapIdContainer: {
        padding: 20,
        width: '100%',
        alignSelf: 'flex-start',
    },
    navigate: {
        backgroundColor: '#3498db', // or any color of your choice
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginTop: 10,
        borderRadius: 50,  // This will give it a pill shape
        alignItems: 'center',
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'row',
        width: '50%',
        alignSelf: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 15
    },
    sentence: {
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
        fontSize: 20,
        fontWeight: '400'
    },
});

export default useHomeScreenLogic;
