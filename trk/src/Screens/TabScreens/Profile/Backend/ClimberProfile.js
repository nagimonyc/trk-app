import React, { useState, useContext, useEffect } from "react";
import { Platform, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Button, Alert, Image } from "react-native";
import { AuthContext } from "../../../../Utils/AuthContext";
import TapHistory from "../../../../Components/TapHistory";
import TapsApi from "../../../../api/TapsApi";
import ClimbsApi from "../../../../api/ClimbsApi";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import SessionTapHistory from "../../../../Components/SessionTapHistory";
import moment from 'moment-timezone';
import { RefreshControl, ScrollView} from 'react-native';


const ClimberProfile = ({ navigation }) => {

    //We now store sessions and session count here, as well as the refreshing state for reloads.
    const { tapCount, currentUser } = useContext(AuthContext);
    const [climbsHistory, setClimbsHistory] = useState([]);
    const [sessionsHistory, setSessionsHistory] = useState([]);
    const [currentSession, setCurrentSession] = useState([]); //to store climbs in the current session
    const [historyCount, setHistoryCount] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);


    useFocusEffect(
        React.useCallback(() => {
            console.log('Loading Profile...');
            setRefreshing(true);
            handleTapHistory().then(() => setRefreshing(false));
        }, [])
    );

    const handleTapHistory = async () => {
        const { getTapsBySomeField } = TapsApi();
        const { getClimb } = ClimbsApi();
        try {
            const tapsSnapshot = await getTapsBySomeField('user', currentUser.uid);

            // Filter taps
            const filteredTaps = tapsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects
                .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false)); // Apply the filter

            // Fetch climb details for each filtered tap
            const climbsPromises = filteredTaps.map(tap => getClimb(tap.climb));

            // Resolve all promises to get climb details
            const climbsSnapshots = await Promise.all(climbsPromises);

            // Combine climb details with tap data
            const newClimbsHistory = climbsSnapshots.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists) return null;
                return { ...climbSnapshot.data(), tapId: filteredTaps[index].id, tapTimestamp: filteredTaps[index].timestamp};
            }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));

            //const sessionsOld = groupClimbsByTimestamp(newClimbsHistory);
            const {expiredSessions, activeSession, sessionKey} = groupClimbsByTimestampDynamic(newClimbsHistory);
            //console.log('Expired Sessions: ', expiredSessions);
            //console.log('Current Session: ', activeSession);
            //console.log('Old Sessions: ', sessionsOld);
            //groupClimbsByTimestampDynamic(newClimbsHistory);
            setClimbsHistory(newClimbsHistory);
            setSessionsHistory(expiredSessions); //Updating sessions on fetching a new climbHistory
            setCurrentSession(activeSession);
            //console.log(sessions);
            setHistoryCount(newClimbsHistory.length);
            setSessionCount(Object.keys(expiredSessions).length + (activeSession[sessionKey]? 1: 0)); //Session count updated
        } catch (error) {
            console.error("Error fetching climbs for user:", error);
        }
    };

    //New Refreshing logic for drop-down reloading
    const onRefresh = React.useCallback(() => {
        console.log('Refreshing...');
        setRefreshing(true);
        handleTapHistory().then(() => setRefreshing(false));
      }, []);
      

    //The following are SessionTapHistory formatting functions to deal with the creation of sessions
    //MIGRATED CODE

    // Helper function to format timestamp
    const formatTimestamp = (timestamp) => {
        //console.log(timestamp);
        const formattedDate = moment(timestamp, 'YYYY-MM-DD HH:mm').tz('America/New_York').format('Do MMM [starting at] hA');
        if (formattedDate === 'Invalid date') {
            //console.error('Invalid date detected:', timestamp);
            return 'Unknown Date';
        }
        return formattedDate;
    };


    const convertTimestampToDate = (timestamp) => {
        console.log("Received timestamp:", timestamp);
        if (!timestamp || typeof timestamp.seconds !== 'number' || typeof timestamp.nanoseconds !== 'number') {
            console.error('Invalid or missing timestamp:', timestamp);
            return null; // Return null or a default date, as per your logic
        }
        // Convert to milliseconds and create a new Date object
        return new Date(timestamp.seconds * 1000 + Math.round(timestamp.nanoseconds / 1000000));
    };

    //CREATION OF SESSIONS WITH 4 HOUR GROUPS (Will alter in the next PR to make dynamic)
    const groupClimbsByTimestamp = (climbs) => {
        const grouped = {};
        climbs.forEach(climb => {
            const dateObject = convertTimestampToDate(climb.tapTimestamp);
            console.log('Date Object:', dateObject);
            if (!dateObject) {
                // Handle the error or skip this climb
                console.error('Skipping climb due to invalid date:', climb);
                return;
            }
            // Convert the timestamp to a standard JavaScript Date object
            const date = moment(dateObject).tz('America/New_York');
            
            // Round down the timestamp to the nearest 4 hours
            const hours = date.hours();
            const roundedHours = hours - (hours % 4);
            const roundedDate = date.clone().hours(roundedHours).minutes(0).seconds(0).milliseconds(0);

            const key = roundedDate.format('YYYY-MM-DD HH:mm'); // Formatted key
            console.log(key); // Debugging
            //console.log(climb.tapId);
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(climb);
        });
        return grouped;
    };

    //NEW SESSION CREATION (6 hour dynamic sessions)
    const groupClimbsByTimestampDynamic = (climbs) => {
        const expiredSessions = {}; // Object to store expired sessions with keys
        let currentSessionClimbs = []; // To store the current session climbs
        let sessionStartTimestamp = null;
        let sessionKey = null;
        const currentTime = new Date().getTime();
    
        // Iterate from the oldest to the newest climb
        for (let i = climbs.length - 1; i >= 0; i--) {
            const climb = climbs[i];
            const climbDate = convertTimestampToDate(climb.tapTimestamp);
    
            if (!climbDate) {
                console.error('Skipping climb due to invalid date:', climb);
                continue;
            }
    
            if (currentSessionClimbs.length === 0) {
                sessionStartTimestamp = climbDate;
                sessionKey = moment(climbDate).tz('America/New_York').format('YYYY-MM-DD HH:mm');
                currentSessionClimbs.push(climb);
            } else {
                const timeDiff = climbDate - sessionStartTimestamp;
    
                if (timeDiff <= 6 * 3600 * 1000) { // 6 hours in milliseconds
                    currentSessionClimbs.push(climb);
                } else {
                    if (!expiredSessions[sessionKey]) {
                        expiredSessions[sessionKey] = [];
                    }
                    currentSessionClimbs.reverse();
                    expiredSessions[sessionKey].push(...currentSessionClimbs);
                    currentSessionClimbs = [climb]; // Start a new session
                    sessionStartTimestamp = climbDate;
                    sessionKey = moment(climbDate).tz('America/New_York').format('YYYY-MM-DD HH:mm');
                }
            }
        }
    
        let currentSession = null;
        if (currentSessionClimbs.length > 0) {
            currentSessionClimbs.reverse();
            // Check if the last session is still within the 6-hour window
            if (currentTime - sessionStartTimestamp.getTime() <= 6 * 3600 * 1000) {
                // This is the current session
                currentSession = currentSessionClimbs;
            } else {
                if (!expiredSessions[sessionKey]) {
                    expiredSessions[sessionKey] = [];
                }
                expiredSessions[sessionKey].push(...currentSessionClimbs);
            }
        }
        //console.log('Session Timestamp: ', sessionKey);
        const activeSession = {};
        activeSession[sessionKey] = currentSession;
        return { expiredSessions, activeSession, sessionKey};
    };    


    //Scroll View Added for Drag Down Refresh
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3498db"]}/>
            }
            style={{margin: 0, padding: 0, width: '100%', height: '100%'}}
            >
            <View style={styles.innerContainer}>
                <View style={styles.profileTop}>
                    <View style={styles.topLine}>
                        <View style={styles.initialCircle}>
                            <Text style={styles.any_text}>{currentUser.email.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.recapData}>
                            <Text style={styles.recapNumber}>{historyCount}</Text>
                            <Text style={styles.any_text}>Climbs</Text>
                        </View>
                        <View style={styles.recapData}>
                            <Text style={styles.recapNumber}>{sessionCount}</Text>
                            <Text style={styles.any_text}>Sessions</Text>
                        </View>
                        <TouchableOpacity style={styles.settings}
                        onPress={() => navigation.navigate('Settings')}>
                            {
                                Platform.OS === 'android' ?
                                    <Icon name="settings" size={30} color="#3498db" /> :
                                    <Image source={require('../../../../../assets/settings.png')} style={{ width: 30, height: 30 }} />
                            }
                        </TouchableOpacity>
                    </View>
                    <View style={styles.greeting}>
                        <Text style={styles.greeting_text}>
                            Hi <Text style={{ color: 'black' }}>{currentUser && currentUser.email ? currentUser.email.split('@')[0] : ''}</Text> 🖖
                        </Text>
                    </View>
                </View>
                <View style={styles.header}>
                    <Text style={styles.titleText}>Activity</Text>

                </View>
                <View style={[styles.effortHistory, { alignItems: 'center' }]}>
                    <View style={[styles.effortHistoryList]}>
                        <SessionTapHistory climbsHistory={climbsHistory} currentSession={currentSession} isCurrent={true}/>
                        <SessionTapHistory climbsHistory={climbsHistory} currentSession={sessionsHistory} isCurrent={false}/>
                    </View>
                </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    );
}
//Sessions are now passed to SessionTapHistory (displaying logic only now)

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
        paddingVertical: 10,
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
        fontSize: 16,
    },
    initialCircle: {
        backgroundColor: '#D9D9D9',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
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
    }
});

export default ClimberProfile;