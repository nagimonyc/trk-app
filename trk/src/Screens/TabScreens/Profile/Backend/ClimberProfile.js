import React, { useState, useContext, useEffect } from "react";
import { Linking, Platform, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Button, Alert, Image, Dimensions, Modal, TextInput } from "react-native";
import { AuthContext } from "../../../../Utils/AuthContext";
import { useFocusEffect } from '@react-navigation/native';
import UsersApi from "../../../../api/UsersApi";
import storage from '@react-native-firebase/storage';
import admin from '@react-native-firebase/app';

const ClimberProfile = ({ navigation }) => {
    const { tapCount, currentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const fullName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.username;


    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    setRefreshing(true);
                    await fetchUserData(); // Your additional async function
                    //await handleClimbHistory();
                    // await handleTapHistory();
                } catch (error) {
                    console.error('Error during focus effect:', error);
                } finally {
                    setRefreshing(false);
                }
            };
            fetchData();
        }, [])
    );

    const fetchUserData = async () => {
        try {
            if (currentUser) {
                const userRef = admin.firestore().collection('users').doc(currentUser.uid);
                const userDoc = await userRef.get();

                if (userDoc.exists) {
                    const userData = userDoc.data();

                    // Keep existing subscription data and display it
                    if (userData.subscriptionStatus) {
                        const storedSubscription = {
                            status: userData.subscriptionStatus,
                            current_period_start: userData.currentPeriodStart,
                            current_period_end: userData.currentPeriodEnd,
                            isPaused: userData.isPaused,  // Include pause status if present
                            resumeDate: userData.resumeDate, // Include resume date if present
                        };
                        setUser({ ...userData, subscriptionDetails: storedSubscription });
                    } else {
                        setUser(userData); // In case there's no stored subscription yet
                    }

                    // Fetch fresh subscription info from Stripe in the background and update Firestore
                    if (userData.stripeCustomerId) {
                        const subscription = await fetchStripeSubscription(userData.stripeCustomerId);

                        // Update user data and UI with new subscription details
                        const updatedUserData = {
                            ...userData,
                            subscriptionDetails: subscription,
                        };
                        setUser(updatedUserData);

                        // Persist updated subscription details to Firestore
                        await userRef.update({
                            subscriptionId: subscription.subscriptionId,
                            subscriptionStatus: subscription.status,
                            currentPeriodStart: subscription.current_period_start,
                            currentPeriodEnd: subscription.current_period_end,
                            isPaused: subscription.isPaused || false,  // Save the paused status
                            resumeDate: subscription.resumeDate || null, // Save the resume date if paused
                        });
                    }
                }
            } else {
                Alert.alert("Error", "No current user found!");
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
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

    const formatDateToEasternTime = (unixTimestamp) => {
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleString('en-US', { timeZone: 'UTC', month: 'long', day: '2-digit' });
    };


    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };


    useEffect(() => {
        const loadImages = async () => {
            try {
                // Default image path
                let climbImageURL = 'climb photos/the_crag.png';
                if (user && user.image && user.image.length > 0) {
                    //Implement image fetch logic
                    climbImageURL = user.image[0].path;
                }
                const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
                setClimbImageUrl(loadedClimbImageUrl);
            } catch (error) {
                console.error("Error loading images: ", error);
            }
        };
        loadImages();
    }, [user]);


    //To fetch the climb image of the latest climb
    const loadImageUrl = async (imagePath) => {
        try {
            const url = await storage().ref(imagePath).getDownloadURL();
            return url;
        } catch (error) {
            console.error("Error getting image URL: ", error);
            throw error;
        }
    };

    const getSubscriptionText = (StripeStatus, current_period_start, current_period_end, isPaused, resumeDate) => {
        const currentDate = new Date().getTime() / 1000;  // Obtenir la date actuelle en timestamp UNIX
        const nextBillingCycle = current_period_end;  // Date de fin du cycle de facturation
        const resumeDateTimestamp = resumeDate ? new Date(resumeDate).getTime() / 1000 : null;

        // Priorité au statut de Stripe s'il est "cancelled"
        if (StripeStatus === 'canceled') {
            if (currentDate <= nextBillingCycle) {
                return {
                    status: 'Active',
                    label: 'Cancels on',
                    date: formatDateToEasternTime(nextBillingCycle),  // La date de fin du cycle si annulée
                };
            } else {
                // Après la date de fin du cycle, on passe à "Cancelled"
                return {
                    status: 'Cancelled',
                    label: 'Membership cancelled',
                    date: formatDateToEasternTime(nextBillingCycle),  // Afficher la date d'annulation
                };
            }
        }

        // Si le gel est en place et que nous sommes après la fin du cycle de facturation, mais avant la date de reprise
        if (isPaused && resumeDateTimestamp && currentDate > nextBillingCycle && currentDate < resumeDateTimestamp) {
            return {
                status: 'Frozen',
                label: 'Frozen until',
                date: formatDateToEasternTime(resumeDateTimestamp),
            };
        }

        // Si un gel est programmé et que l'utilisateur est encore dans sa période active actuelle
        if (resumeDateTimestamp && currentDate <= nextBillingCycle) {
            return {
                status: 'Active',  // Le statut est toujours actif mais avec un freeze en attente
                label: 'Freeze starts',
                date: formatDateToEasternTime(nextBillingCycle),  // Date à laquelle le freeze commencera (fin du cycle actuel)
            };
        }

        // Si nous sommes avant la fin du cycle de facturation, l'abonnement est toujours actif
        if (StripeStatus !== 'scheduled' && currentDate <= nextBillingCycle) {
            return {
                status: 'Active',
                label: 'Cycle renewal',
                date: formatDateToEasternTime(nextBillingCycle),  // Date de renouvellement
            };
        }

        // Par défaut, renvoyer le statut de Stripe
        switch (StripeStatus) {
            case 'active':
                return {
                    status: 'Active',
                    label: 'Cycle renewal',
                    date: formatDateToEasternTime(nextBillingCycle),
                };
            case 'trialing':
                return {
                    status: 'Trialing',
                    label: 'Trial period ends',
                    date: formatDateToEasternTime(nextBillingCycle),
                };
            case 'scheduled':
                return {
                    status: 'Scheduled',
                    label: 'Cycle starts',
                    date: formatDateToEasternTime(current_period_start),
                };
            default:
                return {
                    status: 'Inactive',
                    label: 'No active subscription',
                    date: 'N/A',
                };
        }
    };

    //Scroll View Added for Drag Down Refresh
    return (


        <SafeAreaView style={[styles.container]}>
            {/* profile section */}
            <View style={{ height: 225, backgroundColor: 'white', paddingHorizontal: 15 }}>
                {/* Left Container for photo and text */}
                <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                    {/* photo */}
                    <TouchableOpacity style={[styles.initialCircle]} onPress={() => { navigation.navigate('Edit_User', { user: user }) }}>
                        {climbImageUrl && (<Image source={{ uri: climbImageUrl }} style={{ height: '100%', width: '100%', borderRadius: 10 }} resizeMode="contain" />)}
                        {!climbImageUrl && (<Text style={styles.any_text}>{currentUser.email.charAt(0).toUpperCase()}</Text>)}
                        <View style={{ position: 'absolute', bottom: -5, right: -10, backgroundColor: 'white', borderRadius: 50, padding: 5, borderWidth: 0.5, borderColor: 'black' }}>
                            <Image source={require('./../../../../../assets/editPen.png')} style={{ width: 10, height: 10 }} resizeMode="contain" />
                        </View>
                    </TouchableOpacity>
                    {/* text */}
                    <View style={{}}>
                        <Text style={{ color: 'black', fontSize: 30, fontWeight: '700', marginTop: 15 }}>
                            {fullName}
                        </Text>
                    </View>
                </View>
                {/* Subscription Status and Date */}
                <View style={{ flexDirection: 'row', marginTop: 15 }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>
                            {user?.subscriptionDetails ? capitalizeFirstLetter(getSubscriptionText(
                                user.subscriptionDetails.status,
                                user.subscriptionDetails.current_period_start,
                                user.subscriptionDetails.current_period_end,
                                user.subscriptionDetails.isPaused,  // Check si c'est en pause
                                user.subscriptionDetails.resumeDate // Date de reprise si en pause
                            ).status) : 'Inactive'}
                        </Text>
                        <Text style={{ color: '#696969' }}>Membership</Text>
                    </View>
                    <View style={{ borderLeftWidth: 1, borderLeftColor: '#D5D5D5', marginVertical: 5 }}></View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        {user?.subscriptionDetails && (
                            <>
                                <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>
                                    {getSubscriptionText(
                                        user.subscriptionDetails.status,
                                        user.subscriptionDetails.current_period_start,
                                        user.subscriptionDetails.current_period_end,
                                        user.subscriptionDetails.isPaused,
                                        user.subscriptionDetails.resumeDate
                                    ).date}
                                </Text>
                                <Text style={{
                                    color: getSubscriptionText(
                                        user.subscriptionDetails.status,
                                        user.subscriptionDetails.current_period_start,
                                        user.subscriptionDetails.current_period_end,
                                        user.subscriptionDetails.isPaused,
                                        user.subscriptionDetails.resumeDate
                                    ).label === 'Freeze starts' ? 'green' : '#696969' // Mettre en vert si "Freeze starts"
                                }}>
                                    {getSubscriptionText(
                                        user.subscriptionDetails.status,
                                        user.subscriptionDetails.current_period_start,
                                        user.subscriptionDetails.current_period_end,
                                        user.subscriptionDetails.isPaused,
                                        user.subscriptionDetails.resumeDate
                                    ).label}
                                </Text>
                                {/* <Text>{user.subscriptionId}</Text> */}
                            </>
                        )}
                    </View>
                </View>
            </View>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Account', { subscriptionId: user.subscriptionId })}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}>
                                <Image source={require('../../../../../assets/carbon_account.png')} style={{ width: 25, height: 25 }} />
                                <Text style={{ color: 'black', marginLeft: 15, fontWeight: 600, fontSize: 16 }}>Account</Text>
                            </View>
                            <View style={{ alignItems: 'center', marginRight: 5 }}>
                                <Image source={require('../../../../../assets/material-symbols_chevron-right.png')} style={{ width: 25, height: 25 }} />
                            </View>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}>
                                <Image source={require('../../../../../assets/clarity_settings-solid.png')} style={{ width: 25, height: 25 }} />
                                <Text style={{ color: 'black', marginLeft: 15, fontWeight: 600, fontSize: 16 }}>Settings</Text>
                            </View>
                            <View style={{ alignItems: 'center', marginRight: 5 }}>
                                <Image source={require('../../../../../assets/material-symbols_chevron-right.png')} style={{ width: 25, height: 25 }} />
                            </View>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ paddingVertical: 20, flex: 1, justifyContent: 'flex-end' }}>
                <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, marginBottom: 5 }}>More gyms coming soon ♥</Text>
                <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, marginBottom: 5 }}>Contact me if you have ideas or feedback :)</Text>
                <TouchableOpacity onPress={() => Linking.openURL('sms:+13474534258')}>
                    <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, textDecorationLine: 'underline' }}>(347) 453-4258</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    );
}

//Sessions are now passed to SessionTapHistory (displaying logic only now)
//Two session histories for active session, and older sessions.

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        margin: 0,
    },
    innerContainer: {
        flex: 1,
        paddingTop: 5,
        width: '100%',
        margin: 0,
    },
    header: {
        flex: 0.75,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    any_text: {
        color: 'black',
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        paddingTop: 10,
        paddingBottom: 0,
    },
    effortRecapGraph: {
        flex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    effortRecapImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        paddingHorizontal: 20,
    },
    effortHistory: {
        flex: 4,
        padding: 0,
        color: 'black',
        width: '100%',
        margin: 0,
    },
    effortHistoryList: {
        flex: 1,
        width: '100%',
        color: 'black',
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 20,
    },
    pillButton: {
        backgroundColor: '#3498db', // or any color of your choice
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,  // This will give it a pill shape
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 16
    },
    greeting: {
        display: 'flex',
        paddingTop: 10,

    },
    greeting_text: {
        color: 'black',
        fontSize: 18,
        fontWeight: '700'
    },
    initialCircle: {
        backgroundColor: '#D9D9D9',
        width: 80,
        height: 80,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileTop: {
        marginLeft: 20,
        marginTop: 10,
    },
    topLine: {
        flexDirection: 'row', // Align children in a row
        alignItems: 'center', // Center children vertically
        justifyContent: 'space-between', // Changed from 'space-around' to 'space-between'
        paddingHorizontal: 10,

    },
    recapNumber: {
        color: 'black',
        fontWeight: 'bold',
    },
    settings: {
        marginRight: 15,
        alignSelf: 'center',
    },
    recapData: {
        marginTop: 10,
        alignItems: 'center',
        flexDirection: 'column',
    },
    tabButton: {
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 15,
        width: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabActive: {
        borderBottomColor: '#3498db',
        color: 'black',
    },
    tabText: {
        fontSize: 15,
        color: 'lightgray',
        fontWeight: '500',
    },
    activeTabText: {
        fontSize: 15,
        color: 'black',
        fontWeight: '500',
    },
    centeredView: {
        flex: 1,
        justifyContent: "flex-start",
        paddingTop: 80,
        alignItems: "center",
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    modalView: {
        backgroundColor: "black",
        borderRadius: 20,
        padding: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        height: '85%',
    },
    modalVideo: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    closeButtonContainer: {
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
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    videoLabel: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(238, 135, 51, 1)',
        color: 'white',
        fontSize: 10,
        padding: 2,
        fontWeight: 500,
        zIndex: 1, // Try increasing this if the label is not appearing on top.
    },
    scrollViewContent: {
        paddingBottom: 10, // Add padding at the bottom for scrollable content
    },
    gradeSection: {
        marginBottom: 15,
    },
    gradeTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        width: '100%',
        marginBottom: -2,
        // textAlign: 'center'

    },
    gradeCountContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#C7C7C7',
        width: '81%',
        textAlign: 'right',
        // Add padding or height if needed to ensure the border is visible
        marginBottom: 5,
        justifyContent: 'center'
    },
    gradeCount: {
        fontSize: 16,
        color: 'gray',
        fontWeight: '600',
        textAlign: 'right',
    },
    climbTile: {
        height: 75, // Adjust the height as needed
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Placeholder background color
        // borderRadius: 10,
        // borderColor: 'blue'
    },
    columnWrapper: {
        // justifyContent: 'flex-start',
        // alignSelf: 'flex-end'
        marginTop: 15,
    },
    climbImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    inputContainer: {
        flexDirection: 'row',
        height: '65%',
        backgroundColor: '#EEEEF0', // Match the gray box color
        borderRadius: 10, // Match the border radius from your design
        alignItems: 'center',
        paddingHorizontal: 10,
        marginHorizontal: 15
    },
    icon: {
        width: 16, // Adjust as needed
        height: '100%', // Adjust as needed
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        fontSize: 14, // Adjust as needed
        color: '#000', // Text color
        height: '100%',
        margin: 0,
        padding: 0
        // Remove border if you previously had one
    },
});

export default ClimberProfile;
