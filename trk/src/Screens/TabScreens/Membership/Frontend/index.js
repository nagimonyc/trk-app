import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
import { AuthContext } from "../../../../Utils/AuthContext";
import UsersApi from "../../../../api/UsersApi";
import { Marquee } from "@animatereactnative/marquee";
import logic from "../../Record/Backend/logic";
import analytics from '@react-native-firebase/analytics';

const Membership = ({ route, navigation }) => {
    const gymName = route?.params?.gymName || null;
    const [user, setUser] = useState(null);
    const { currentUser } = useContext(AuthContext);
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const fullName = currentUser ? (currentUser.firstName ? currentUser.firstName + ' ' + currentUser.lastName : '') : '';
    const [currentTime, setCurrentTime] = useState(new Date()); // State for current time
    const [isPixelated, setIsPixelated] = useState(true); // State to track if pixelation is active


    const { identifyClimb } = logic({ navigation });

    useEffect(() => {
        if (currentUser) {
            fetchAndUpdateUserData();
        }
    }, [currentUser]);

    const fetchImageURL = async (imagePath) => {
        if (imagePath) {
            try {
                const url = await storage().ref(imagePath).getDownloadURL();
                setClimbImageUrl(url);
            } catch (error) {
                console.error("Error getting image URL: ", error);
            }
        }
    };

    const handleTakePhoto = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 300,
                height: 400,
                cropping: true,
                compressImageQuality: 0.7
            });
            if (image) {
                const uploadResult = await uploadImage(image.path);
                UsersApi().updateUser(currentUser.uid, { image: [uploadResult] });
                fetchImageURL(uploadResult.path);
            }
        } catch (error) {
            if (error.code !== 'E_PICKER_CANCELLED') {
                Alert.alert("Error", "Failed to take photo: " + error.message);
            }
        }
    };

    const uploadImage = async (imagePath) => {
        const filename = imagePath.split('/').pop().replace(/\.jpg/gi, "").replace(/-/g, "");
        const storageRef = storage().ref(`climb_images/${filename}`);
        await storageRef.putFile(imagePath);
        return { id: filename, path: storageRef.fullPath, timestamp: new Date().toISOString() };
    };

    const fetchStripeSubscription = async (customerId) => {
        try {
            const response = await fetch(`https://us-central1-trk-app-505a1.cloudfunctions.net/getMembershipDetails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customerId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (response.headers.get("content-type")?.includes("application/json")) {
                return await response.json();
            } else {
                let responseBody = await response.text();
                throw new Error('Expected JSON response, got: ' + responseBody);
            }
        } catch (error) {
            console.error('Failed to fetch subscription details:', error);
            throw error;
        }
    };

    const fetchAndUpdateUserData = async () => {
        try {
            const { getUsersBySomeField, updateUser } = UsersApi();
            const userDataResponse = await getUsersBySomeField('uid', currentUser.uid);

            if (userDataResponse && userDataResponse.docs.length > 0) {
                let userData = userDataResponse.docs[0].data();

                // Fetch image URL if image exists
                if (userData.image && userData.image.length > 0) {
                    await fetchImageURL(userData.image[0].path);
                }

                // Keep existing subscription data and display it
                if (userData.subscriptionStatus) {
                    const storedSubscription = {
                        status: userData.subscriptionStatus,
                        current_period_start: userData.currentPeriodStart,
                        current_period_end: userData.currentPeriodEnd,
                        isPaused: userData.isPaused,
                        resumeDate: userData.resumeDate,
                    };
                    userData = { ...userData, subscriptionDetails: storedSubscription };
                }

                // Fetch fresh subscription info from Stripe and update Firestore
                if (userData.stripeCustomerId) {
                    const subscription = await fetchStripeSubscription(userData.stripeCustomerId);

                    // Update user data with new subscription details
                    userData = {
                        ...userData,
                        subscriptionDetails: subscription,
                    };

                    // Persist updated subscription details to Firestore
                    await updateUser(currentUser.uid, {
                        subscriptionId: subscription.subscriptionId,
                        subscriptionStatus: subscription.status,
                        currentPeriodStart: subscription.current_period_start,
                        currentPeriodEnd: subscription.current_period_end,
                        isPaused: subscription.isPaused || false,
                        resumeDate: subscription.resumeDate || null,
                    });
                }

                // Finally, set the user state
                setUser(userData);
            } else {
                console.error('User data not found');
            }
        } catch (error) {
            console.error('Failed to fetch and update user data:', error);
        }
    };

    // Select the image based on the gym name
    const getGymImage = (gymName) => {
        switch (gymName) {
            case 'MetroRock':
                return require('../../../../../assets/MetroRock-logo.png');
            case 'Bouldering Project':
                return require('../../../../../assets/logo-bp-2.png');
            case 'Brooklyn Boulders':
                return require('../../../../../assets/BKB-logo.png');
            case 'GP81':
                return require('../../../../../assets/GP81-logo.png');
            case 'Island Rock':
                return require('../../../../../assets/islandRock-logo.png');
            case 'Method':
                return require('../../../../../assets/method-logo.png');
            case 'Test':
                return require('../../../../../assets/method-logo.png');
            default:
                return require('../../../../../assets/GP81-logo.png'); // Default image if gymName doesn't match
        }
    };

    // New function to render the pixelated overlay
    const renderPixelatedOverlay = () => {
        return (
            <View style={styles.pixelatedOverlay}>
                {Array.from({ length: 100 }).map((_, index) => (
                    <View key={index} style={styles.pixelBox}></View>
                ))}
            </View>
        );
    };


    const handleGymSelection = async (gymName) => {
        const timestamp = new Date().toISOString();

        if (currentUser) {
            // Log event to Firebase Analytics with gym name
            await analytics().logEvent('gym_visit', {
                user_id: currentUser.uid,
                gym_name: gymName,
                timestamp: timestamp,
            });
        }

        // Navigate to Membership screen
        navigation.navigate('Membership', { gymName });
    };

    const logNfcInteraction = async (gymName) => {
        try {
            const { getUsersBySomeField, updateUser } = UsersApi();
            const userDataResponse = await getUsersBySomeField('uid', currentUser.uid);

            if (!userDataResponse || userDataResponse.docs.length === 0) {
                console.error('User data not found');
                return false;
            }

            const userData = userDataResponse.docs[0].data();
            const nfcInteractions = userData.nfcInteractions || {};

            // Vérifie si c'est la première interaction pour ce gymnase
            if (!nfcInteractions[gymName]) {
                const firstVisitTime = new Date().toISOString();

                // Enregistre l'interaction NFC pour la première fois
                nfcInteractions[gymName] = { firstVisit: firstVisitTime };

                await updateUser(currentUser.uid, {
                    nfcInteractions: nfcInteractions
                });

                console.log(`First NFC interaction logged for gym: ${gymName} at ${firstVisitTime}`);
                return true;  // C'était la première fois
            }

            return false;  // Ce n'était pas la première fois
        } catch (error) {
            console.error('Error logging NFC interaction:', error);
            return false;  // Return false if there was an error
        }
    };


    const doSomething = async () => {
        try {
            const climbId = await identifyClimb();  // Await the NFC result

            if (climbId) {
                console.log("Climb ID found:", climbId);
                setIsPixelated(false);  // Remove pixelation

                const gymName = climbId;  // Utilise l'ID du gymnase ou nom dans `climbId[2]`

                const isFirstInteraction = await logNfcInteraction(gymName);  // Log la première interaction

                // Log dans Google Analytics
                await analytics().logEvent('gym_visit', {
                    user_id: currentUser.uid,
                    gym_name: gymName,
                    is_first_time: isFirstInteraction,  // Flag pour savoir si c'est la première fois
                    timestamp: new Date().toISOString(),
                });

            } else {
                console.log("No Climb ID found.");
            }
        } catch (error) {
            console.error("Error identifying climb:", error);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date()); // Update time every second
        }, 1000);

        return () => clearInterval(timer); // Clean up the interval on component unmount
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 20, marginTop: 25 }}>
                {currentUser && currentUser.subscriptionStatus == "active" ? (
                    <LinearGradient
                        colors={['#FFFFFF', '#FF8100']} // White to orange gradient
                        style={styles.gradientStyle}
                    >
                        <Marquee spacing={20} speed={0.5} style={{ width: '100%', marginVertical: 5, height: 50, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'space-around', width: 400 }}>
                                {/* First Image */}
                                <Image
                                    source={require('../../../../../assets/long-logo.png')}
                                    style={{ width: '33.3%', height: '100%', alignSelf: 'center' }} // Flexible width, adjusts to fill available space
                                    resizeMode="contain"
                                />

                                {/* Second Image */}
                                <Image
                                    source={getGymImage(gymName)}
                                    style={{ width: '33.3%', height: '100%' }} // Flexible width, adjusts to fill available space
                                    resizeMode="contain"
                                />
                                {/* Text */}
                                {/* Time with seconds */}
                                <Text style={{ width: '33.3%', fontSize: 16, color: 'black', fontWeight: '600', textAlign: 'center' }}>
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </Text>
                            </View>
                        </Marquee>
                        <TouchableOpacity onPress={() => doSomething()} style={styles.membershipCard}>
                            {/* Always render the image or placeholder */}
                            {climbImageUrl ? (
                                <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <TouchableOpacity onPress={handleTakePhoto} style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: 'white' }}>
                                    <View style={{ position: 'relative', width: 75, height: 75 }}>
                                        <Image source={require('../../../../../assets/user_box.png')} style={{ width: '100%', height: '100%' }} />
                                        <View style={{ position: 'absolute', top: -30, right: -20, width: 25, height: 25 }}>
                                            <Image source={require('../../../../../assets/info_icon.png')} style={{ width: '100%', height: '100%' }} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Render pixelated overlay if pixelation is still active */}
                            {isPixelated && renderPixelatedOverlay()}
                        </TouchableOpacity>
                        <Text style={{
                            color: 'black',
                            fontSize: 28,
                            fontWeight: 'bold',
                            marginTop: 15,
                        }}>{fullName}</Text>
                        {currentUser.subscriptionStatus == "active" && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#397538', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>MEMBER</Text>
                            </View>
                        )}
                        {!currentUser.subscriptionStatus == "active" && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#FF8100', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>NOT A MEMBER</Text>
                            </View>
                        )}
                    </LinearGradient>
                ) : (
                    <View style={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        width: '90%',
                        height: '85%',
                        backgroundColor: '#CACACA',
                        borderRadius: 20,
                        flexDirection: 'column'
                    }}>
                        <View style={{ width: '100%', alignItems: 'center', backgroundColor: 'transparent' }}>
                            <Image
                                source={require('../../../../../assets/long-logo.png')}
                                style={{ width: '40%', height: undefined, aspectRatio: 5, marginTop: 10, marginBottom: 20 }} // Adjust the aspectRatio according to your logo's aspect ratio
                                resizeMode="contain"
                            />
                        </View>
                        <View style={{
                            width: '60%',
                            height: '60%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 10,
                            backgroundColor: climbImageUrl ? 'transparent' : 'white'
                        }}>
                            {climbImageUrl ? (
                                <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <TouchableOpacity onPress={handleTakePhoto} style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: 'white' }}>
                                    <View style={{ position: 'relative', width: 75, height: 75 }}>
                                        <Image source={require('../../../../../assets/user_box.png')} style={{ width: '100%', height: '100%' }} />
                                        <View style={{ position: 'absolute', top: -30, right: -20, width: 25, height: 25 }}>
                                            <Image source={require('../../../../../assets/info_icon.png')} style={{ width: '100%', height: '100%' }} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={{
                            color: 'black',
                            fontSize: 20,
                            fontWeight: 'bold',
                            marginTop: 15,
                        }}>{currentUser ? fullName : ''}</Text>
                        {currentUser && currentUser.subscriptionStatus == "active" && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#397538', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>MEMBER</Text>
                            </View>)}
                        {(!currentUser || !currentUser.subscriptionStatus == "active") && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#FF8100', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>NOT A MEMBER</Text>
                            </View>)}
                    </View>
                )}
                {!climbImageUrl && (
                    <TouchableOpacity onPress={handleTakePhoto} style={{ padding: 10, backgroundColor: '#FF8100', borderRadius: 5, marginTop: 30 }}>
                        <Text style={{ color: 'white' }}>Add photo to unlock membership</Text>
                    </TouchableOpacity>
                )}
                {climbImageUrl && currentUser && currentUser.subscriptionStatus == "active" && (
                    <View style={{ padding: 10, borderRadius: 5, marginTop: 15, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../../../../assets/zondicons_information-solid.png')} style={{ width: 20, height: 20 }} />
                        <Text style={{ color: 'black', marginLeft: 10 }}>Show membership to staff</Text>
                    </View>
                )}
                {climbImageUrl && (!currentUser || !currentUser.subscriptionStatus == "active") && (
                    <View style={{ padding: 10, borderRadius: 5, marginTop: 15, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../../../../assets/zondicons_information-solid.png')} style={{ width: 20, height: 20 }} />
                        <Text style={{ color: 'black', marginLeft: 10 }}>Purchase Membership to Activate Card</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    gradientStyle: {
        width: '100%',
        height: '85%',
        borderRadius: 20,
        flexDirection: 'column',
        // padding: 20,
        alignItems: 'center',
    },
    membershipCard: {
        width: '70%',
        height: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        position: 'relative', // Ensure that pixelation overlay is positioned properly
    },
    pixelatedOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        zIndex: 1, // Ensure it's on top
    },
    pixelBox: {
        width: '10%', // Adjust the size to control pixelation density
        height: '10%',
        backgroundColor: '#CACACA', // The color of each pixel box
        borderWidth: 1,
        borderColor: '#E0E0E0', // Optional: to simulate grid lines between pixels
    },
});

export default Membership;