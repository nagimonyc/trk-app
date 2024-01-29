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
import UsersApi from "../../../../api/UsersApi";
import storage from '@react-native-firebase/storage';

//MADE CHANGES TO NOW SHOW USERNAME AND PROFILE PIC (WITH EDIT BUTTON TO LEAD TO EDITING PAGE)
//Revamped how sessions are created (Only last 5 sessions are fetched as of now)- Next PR will implement pagination
const ClimberProfile = ({ navigation }) => {

    //We now store sessions and session count here, as well as the refreshing state for reloads.
    const { tapCount, currentUser } = useContext(AuthContext);

    const [user, setUser] = useState(null);

    const [climbsHistory, setClimbsHistory] = useState([]);
    const [sessionsHistory, setSessionsHistory] = useState([]);

    const [climbImageUrl, setClimbImageUrl] = useState(null);


    const [currentSession, setCurrentSession] = useState([]); //to store climbs in the current session
    const [historyCount, setHistoryCount] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    
    //For pagination
    const [lastLoadedClimb, setLastLoadedClimb] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            console.log('Loading Profile...'); //Loading icon on initial loads (was confusing, and seemed like data was missing otherwise)
            setRefreshing(true);
            handleTapHistory().then(() => setRefreshing(false));
        }, [])
    );

    const handleTapHistory = async () => {
        try {
            const { getTapsBySomeField, getActiveSessionTaps, getRecentFiveSessions, getExpiredTaps, getTotalSessionCount} = TapsApi();
            const { getClimb } = ClimbsApi();
            const {getUsersBySomeField} = UsersApi();
            let user = (await getUsersBySomeField('uid', currentUser.uid));
            if (user) {
                setUser(user.docs[0].data());
            }
            let recentSession = (await getRecentFiveSessions(currentUser.uid)) // Does not include the current session, gets the starting points of the last 5 sessions
            //Filtering the recent session starts
            const recentSessionStartsFiltered = recentSession.docs.map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects
                .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false)); // Apply the filter

            const promise = recentSessionStartsFiltered.map(tap => getClimb(tap.climb));
            // Resolve all promises to get climb details
            const recentSnapshot = await Promise.all(promise);

            // Combine climb details with tap data
            const recentSessionStarts = recentSnapshot.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists) return null;
                return { ...climbSnapshot.data(), tapId: recentSessionStartsFiltered[index].id, tapTimestamp: recentSessionStartsFiltered[index].timestamp};
            }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));

            //Getting climbs for the Active Session
            const activeSessionSnapshot = (await getActiveSessionTaps(currentUser.uid));
            const tapsSnapshot = await getExpiredTaps(currentUser.uid);
            // Filter taps
            const filteredTaps = tapsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects,
                .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false)); // Apply the filter

            //Filtering active session taps
            const filteredActiveTaps = activeSessionSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects
                .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false)); // Apply the filter

            
            // Fetch climb details for each filtered tap
            const climbsPromises = filteredTaps.map(tap => getClimb(tap.climb));

            //Fetching climb details for active taps
            const activeClimbPromises = filteredActiveTaps.map(tap => getClimb(tap.climb));

            // Resolve all promises to get climb details
            const climbsSnapshots = await Promise.all(climbsPromises);

            //Resolve active promises to get active session climb details
            const activeClimbsSnapshots = await Promise.all(activeClimbPromises);

            // Combine climb details with tap data
            //Added session info to expired climbs
            const newClimbsHistory = climbsSnapshots.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists) return null;
                return { ...climbSnapshot.data(), tapId: filteredTaps[index].id, tapTimestamp: filteredTaps[index].timestamp, isSelected: filteredTaps[index].isSelected, sessionTitle: filteredTaps[index].sessionTitle, sessionImages: filteredTaps[index].sessionImages, isSessionStart: filteredTaps[index].isSessionStart, tagged: filteredTaps[index].tagged};
            }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));


            //Combine active session climb details with tap data
            const activeClimbsHistory = activeClimbsSnapshots.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists) return null;
                return { ...climbSnapshot.data(), tapId: filteredActiveTaps[index].id, tapTimestamp: filteredActiveTaps[index].timestamp};
            }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));

            //To allow for pagination of sessions
            let sessionLogStart = null;
            if (recentSessionStarts.length > 0) {
                sessionLogStart = recentSessionStarts[recentSessionStarts.length-1]; // for a constant endpoint for the for-loop, enables a top-down approach
            }
            //This is the last session to be fetched
            console.log('Session start is: ', sessionLogStart);
            //All expired sessions are stored here
            console.log('Recent, non-active sessions are: ', recentSessionStarts.length);
            //const sessionsOld = groupClimbsByTimestamp(newClimbsHistory);
            const {expiredSessions, activeSession, activeSessionTimestamp} = groupClimbsByTimestampNew(newClimbsHistory, activeClimbsHistory, sessionLogStart);

            if (recentSession.docs.at(-1)) {
                console.log('Last loaded climb set: ', recentSession.docs.at(-1));
                setLastLoadedClimb(recentSession.docs.at(-1)); 
            }
            setClimbsHistory(newClimbsHistory); //Irrelevant value as of NOW (WILL REMOVE IN NEXT PR)- SESSION OBJECT REVAMP
            setSessionsHistory(expiredSessions); //Updating sessions on fetching a new climbHistory, expired sessions
            setCurrentSession(activeSession); // Storing Active Climbs in a new session, active session
            console.log('The typeof the list is: ', typeof activeSession[activeSessionTimestamp]);

            //To accurately calculate session count
            const sessionCount = (await (getTotalSessionCount(currentUser.uid))).data().count;
            console.log('Session Count Fetched: ', sessionCount);
            setSessionCount(sessionCount); //Session count updated, based on expired and current
            setHistoryCount(newClimbsHistory.length + activeClimbsHistory.length); //Summing up current and expired taps
        
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

    const groupClimbsByTimestampNew = (climbs, activeClimbs, startingClimb, start = null) => {
        console.log('Expired Climbs Are: ', climbs);
        const expiredSessions = {}; // Object to store expired sessions with keys
        let currentSessionClimbs = []; // To store the current session climbs
        let sessionKey = null;

        //Active session calculation, now wholly reliant on the firebase call
        const activeSessionStart = (activeClimbs && activeClimbs.length > 0? activeClimbs[activeClimbs.length - 1]: {tapTimestamp: firebase.firestore.Timestamp.now()});
        const activeSessionTimestamp = moment(convertTimestampToDate(activeSessionStart.tapTimestamp)).tz('America/New_York').format('YYYY-MM-DD HH:mm');
        console.log('Last Tap Was: ', start);
        let i = 0;
        if (start !== null && start.id) {
            i = climbs.findIndex(climb => climb.tapId === start.id) + 1;
            console.log('I starts at: ', i);
        }
        else {
            console.log('I is: ', i); //To document pagination
        }
        // Iterate from the oldest to the newest climb
        for (; i < climbs.length; i++) { //Can iterate through
                const climb = climbs[i];
                const climbDate = convertTimestampToDate(climb.tapTimestamp);
        
                if (!climbDate) {
                    console.error('Skipping climb due to invalid date:', climb);
                    continue;
                }
                currentSessionClimbs.push(climb);

                // When a climb marks the start of a session or is the startingClimb
                if (climb.isSessionStart == true|| (startingClimb && climb.tapId === startingClimb.tapId)) {
                    // Use the timestamp of the current climb to create a session key
                    sessionKey = moment(climbDate).tz('America/New_York').format('YYYY-MM-DD HH:mm');
                    expiredSessions[sessionKey] = [...currentSessionClimbs];
                    currentSessionClimbs = [];
                    //Stop after the last paginated tap is encountered, helps reduce loading time
                    if (climb.tapId === startingClimb.tapId) {
                        break;
                    }
                }
        }

        //console.log('Session Timestamp: ', sessionKey);
        const activeSession = {};
        activeSession[activeSessionTimestamp] = activeClimbs; //For desc ordering of active session taps
        console.log('Expired Session is: ', expiredSessions);
        console.log('Active Session is: ', activeSession);
        return {expiredSessions, activeSession, activeSessionTimestamp};
        //Returns expired sessions, active sessions, and the current session's timestamp
    };

    //Pagination Logic for scrolling down
    //We have the initally last loaded climb
    const handleLoadMoreSessions = async () => {
        if (lastLoadedClimb && !loadingMore) {
            setLoadingMore(true);
            console.log('Loading more at the Bottom!');
            const newSessions = (await TapsApi().getRecentFiveSessions(currentUser.uid, lastLoadedClimb)); //Change to lastLoadedClimb 
            const newSessionsFiltered = newSessions.docs.map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects
            .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false)); // Apply the filter

            const promise = newSessionsFiltered.map(tap => ClimbsApi().getClimb(tap.climb));
            // Resolve all promises to get climb details
            const snapshot = await Promise.all(promise);

             // Combine climb details with tap data
             const newSessionsHistory = snapshot.map((climbSnapshot, index) => {
                 if (!climbSnapshot.exists) return null;
                 return { ...climbSnapshot.data(), tapId: newSessionsFiltered[index].id, tapTimestamp: newSessionsFiltered[index].timestamp};
             }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));

            if (newSessionsHistory.length == 0) {
                console.log('No new climbs!');
                setLoadingMore(false);
                return;
            }

            const sessionLogStart = newSessionsHistory[newSessionsHistory.length-1]; // for a constant endpoint for the for-loop, enables a top-down approach
            const {expiredSessions, activeSession, activeSessionTimestamp} = groupClimbsByTimestampNew(climbsHistory, null, sessionLogStart, lastLoadedClimb);
            if (newSessions.docs.at(-1)) {
                console.log('Last loaded climb set: ', newSessions.docs.at(-1));
                setLastLoadedClimb(newSessions.docs.at(-1));
            }
            console.log('Previous Sessions History: ', sessionsHistory);
            console.log('New Sessions History', expiredSessions)
            setSessionsHistory(prevSessions => ({ ...prevSessions, ...expiredSessions}));
            setLoadingMore(false);
            return;
        }
        else {
            console.log('Loading Issue: ', loadingMore);
        }
    };


    //Scrolling handler for when the user reaches the bottom of the page
    const onScroll = ({ nativeEvent }) => {
        console.log('Scroll Check called!');
        const isCloseToBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 50; // 20 is a threshold you can adjust
        if (isCloseToBottom) {
            handleLoadMoreSessions();
        }
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


    //Scroll View Added for Drag Down Refresh
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={200} // Adjust based on performance
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3498db"]}/>
            }
            style={{margin: 0, padding: 0, width: '100%', height: '100%'}}
            >
            <View style={styles.innerContainer}>
                <View style={styles.profileTop}>
                    <View style={styles.topLine}>
                        <TouchableOpacity style={styles.initialCircle} onPress={()=> {navigation.navigate('Edit_User', {user: user})}}>
                            {climbImageUrl && (<Image source={{ uri: climbImageUrl }} style={{borderRadius: 50, height: '100%', width: '100%'}} />)}
                            {!climbImageUrl &&  (<Text style={styles.any_text}>{currentUser.email.charAt(0).toUpperCase()}</Text>)}
                            <View style={{ position: 'absolute', bottom: 0, right: -10, backgroundColor: 'white', borderRadius: 50, padding: 5, borderWidth: 0.5, borderColor:'black'}}>
                                <Icon name="edit" size={10} color="black" />
                            </View>
                        </TouchableOpacity>
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
                            Hi <Text style={{ color: 'black' }}>
                                {user && user.username? user.username: ''}
                            </Text> 🖖
                        </Text>
                    </View>
                </View>
                <View style={styles.header}>
                    <Text style={styles.titleText}>Activity</Text>
                </View>
                <View style={[styles.effortHistory, { alignItems: 'center' }]}>
                    <View style={[styles.effortHistoryList]}>
                        <SessionTapHistory climbsHistory={climbsHistory} currentSession={currentSession} isCurrent={true}/>
                        {sessionsHistory && Object.keys(sessionsHistory).length > 0 && <Text style={{color: 'black', paddingHorizontal: 20, paddingTop: 10, fontWeight: 'bold'}}>Past Sessions</Text>}
                        <SessionTapHistory climbsHistory={climbsHistory} currentSession={sessionsHistory} isCurrent={false}/>
                    </View>
                </View>
            </View>
        </ScrollView>
        </SafeAreaView>
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