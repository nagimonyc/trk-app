import React, { useContext, useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimb from '../../../../NfcUtils/readClimb';
import Image from '../../../../Components/Image';
import { AuthContext } from '../../../../Utils/AuthContext';
import analytics from '@react-native-firebase/analytics';
import ClimbsApi from '../../../../api/ClimbsApi';
import TapsApi from '../../../../api/TapsApi';
import { useDispatch } from 'react-redux';
import { addClimb } from '../../../../Actions/tapActions';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { Animated } from 'react-native';
import ClimbItem from '../../../../Components/ClimbItem';
import { LayoutAnimation, UIManager} from 'react-native';
import { IconButton } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

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
    const { currentUser,role} = useContext(AuthContext);

    const [tapId, setTapId] = useState(null);
    const [climb, setClimb] = useState(null);
    const [tapObj, setTapObj] = useState(null);

    const fadeAnim = React.useRef(new Animated.Value(0)).current;  // Initial value for opacity: 0


    const dispatch = useDispatch();

    const RightArrow = () => (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <Path d="M9 18l6-6-6-6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
    );


    const checkConnectivity = (climbId) => {
        NetInfo.fetch().then(state => {
            console.log("Is connected?", state.isConnected);
            if (state.isConnected) {
                console.log('Navigating');
                //navigation.navigate('Detail', { climbId: climbId[0], isFromHome: true});
                addClimbWithNetwork(climbId[0]);
            } else {
                dispatch(addClimb(climbId[0], currentUser, role));
                Alert.alert('Offline Action', 'Your action is saved and will be processed when you\'re online.', [{ text: 'OK' }]);
            }
        });
    };

    const addClimbWithNetwork = async (climbId) => {
        try {
          const climbDataResult = await ClimbsApi().getClimb(climbId);
          if (climbDataResult && climbDataResult._data) {
            if (currentUser.uid !== climbDataResult._data.setter && role !== "setter") {
              const { addTap } = TapsApi();
              const tap = {
                climb: climbId,
                user: currentUser.uid,
                timestamp: new Date(),
                completion: 0,
                attempts: '',
                witness1: '',
                witness2: '',
              };
      
              const documentReference =  await addTap(tap);
              const tapDataResult = await TapsApi().getTap(documentReference.id);
              setClimb(climbDataResult._data);
              setTapObj(tapDataResult._data);
              setTapId(documentReference.id);
              console.log('Climb was processed!');
              console.log('Tap ID: ', documentReference.id);
              console.log('Climb: ', climbDataResult._data);
              console.log('Tap: ', tapDataResult._data);
            } else {
              console.log('The Setter is the user or this a Setter Account. Tap was not added');
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
        //console.log('User role testing......');
        //console.log(role);
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
            if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }              
            return (
                <View style={{flex: 1, margin: 0, padding: 0, justifyContent: 'center', width: '100%'}}>
                    {tapId !== null && climb !== null && tapObj !== null && (
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
                    <View style={{paddingVertical: 20}}>
                    <Text style={styles.tapText}>Completed a climb?</Text>
                    <Text style={styles.celebration}>🎉🎉🎉</Text>
                    <Text style={styles.instructions}>Tap below to save your achievement</Text>
                    <TouchableOpacity style={styles.button} onPress={identifyClimb}>
                        <Image source={logo} style={styles.image} resizeMode="contain" />
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
        marginTop: 15,
    },
    tapText: {
        textAlign: 'center',
        color: 'black',
        fontSize: 25,
        fontWeight: '600',
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
        padding: 10,
        borderRadius: 5,
        color: 'black',
        marginTop: 30,
    },
    tapIdContainer: {
        padding: 20,
        width: '100%',
        flex: 1,
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
});

export default useHomeScreenLogic;