import React, { useContext, useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, SafeAreaView, Image, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'; // Ensure you import useRoute
import NfcManager from 'react-native-nfc-manager';
import AndroidPrompt from '../../../../Components/AndroidPrompt';
import TapHistory from '../../../../Components/TapHistory';
import logic from '../Backend/logic';
import OnboardingModal from '../../../../Components/OnboardingModal';
import { AuthContext } from '../../../../Utils/AuthContext';
import TapCard from '../../../../Components/TapCard';
import { ActivityIndicator } from 'react-native-paper';
import storage from '@react-native-firebase/storage';

function RecordScreen(props) {
    console.log('[TEST] RecordScreen called');

    const { isNewUser, completeOnboarding } = useContext(AuthContext);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const route = useRoute(); // Use useRoute to access the current route
    const navigation = useNavigation(); // If not already using useNavigation
    const logo = require('../../../../../assets/nagimo-logo2.png');

    const [isModalVisible, setIsModalVisible] = useState(false);
    
    const toggleModal = () => {
        setIsModalVisible(!isModalVisible);
    };

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


    //Copies for the Modal to Access
    const [tapIdCopy, setTapIdCopy] = useState(null);
    const [climbCopy, setClimbCopy] = useState(null);
    const [tapObjCopy, setTapObjCopy] = useState(null);

    const {
        renderNfcButtons,
        androidPromptRef,
        tapId,
        climb,
        tapObj,
    } = logic(props);

    // Hook for tapId
    useEffect(() => {
        if (tapId !== null) {
            setTapIdCopy(tapId);
        }
    }, [tapId]);

    // Hook for climb
    useEffect(() => {
        if (climb !== null) {
            setClimbCopy(climb);
        }
    }, [climb]);

    // Hook for tapObj
    useEffect(() => {
        if (tapObj !== null) {
            setTapObjCopy(tapObj);
        }
    }, [tapObj]);


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
    
    //To get the tapped Climb URL
    const [climbImageUrl, setClimbImageURL] = useState(null);
    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                const climbImage = await storage().ref(climb.images[climb.images.length-1].path).getDownloadURL();
                setClimbImageURL(climbImage);
            } catch (error) {
                console.error('Failed to fetch image URL:', error);
            }
        };
        if (climb) {
            fetchImageURL();
        }
    }, [climb]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                {/* idle card */}
                {tapId !== null && climb !== null && (
                <TouchableOpacity onPress={toggleModal}>
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
                            {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: 120, height: 130}} resizeMode="contain" /> : <ActivityIndicator color='#fe8100'/>}
                        </View>
                        <View style={[styles.climbColor, {backgroundColor: (climb.color? climb.color: '#fe8100')}]}>
                        </View>
                        <View style={{ flexDirection: 'column', marginLeft: 15 }}>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Name</Text>
                                <Text style={{ fontSize: 20, color: 'black', paddingVertical: 5}}>{climb.name}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Grade</Text>
                                <Text style={{ fontSize: 30, fontWeight: 800, paddingVertical: 5, color: 'black'}}>{climb.grade}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                </TouchableOpacity>)}

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
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                <Text style={[styles.text, styles.momentumText, { color: 'black' }]}>
                                    Tap 
                                </Text>
                                <Image source={logo} style={[styles.logo, {marginLeft: 5}]} resizeMode="contain" />
                                </View>
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
                        <View style={[styles.climbColor, {backgroundColor: '#fe8100'}]}>
                        </View>
                        <View style={{ flexDirection: 'column', marginLeft: 15 }}>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Name</Text>
                                <Text style={{ fontSize: 20, color: 'black', paddingVertical: 5}}>?</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#454545' }}>Grade</Text>
                                <Text style={{ fontSize: 30, fontWeight: 800, paddingVertical: 5, color: 'black'}}>?</Text>
                            </View>
                        </View>
                    </View>
                </View>)}
                <View>
                    {renderNfcButtons()}
                </View>
                {/* Modal Like View (Contained Within)*/}
                {isModalVisible && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setIsModalVisible(!isModalVisible)}
                            >
                                <Text style={styles.textStyle}>✕</Text>
                            </TouchableOpacity>
                            {/* Modal content goes here */}
                            <TapCard climb={climbCopy} tapId={tapIdCopy} tapObj={tapObjCopy} tapTimestamp={timeStampFormatting(tapObjCopy.timestamp)} blurred={true}/>
                        </View>
                    </View>
                )}
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
        marginLeft: 8,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    closeButton: {
        backgroundColor: '#FF6165',
        width: 30,
        height: 30,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -5,
        right: -5,
        zIndex: 2000,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        height: '100%',
        width: '100%',
        textAlignVertical: 'top',
        paddingTop: 3,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    modalContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        padding: 0, // Adjust as needed
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 0,
        alignItems: 'center',
        width: '90%', // Adjust as needed
        height: '95%', // Adjust as needed, less than 100% to not cover full screen
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default RecordScreen;
