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
import SessionsApi from "../../../../api/SessionsApi";

//MADE CHANGES TO NOW SHOW USERNAME AND PROFILE PIC (WITH EDIT BUTTON TO LEAD TO EDITING PAGE)
//Revamped how sessions are created (Only last 5 sessions are fetched as of now)- Next PR will implement pagination
const ClimberProfile = ({ navigation }) => {

    //We now store sessions and session count here, as well as the refreshing state for reloads.
    const { tapCount, currentUser } = useContext(AuthContext);

    const [user, setUser] = useState(null);

    const [sessionsHistory, setSessionsHistory] = useState([]);

    const [climbImageUrl, setClimbImageUrl] = useState(null);


    const [currentSession, setCurrentSession] = useState([]); //to store climbs in the current session

    const [currentSessionObject, setCurrentSessionObject] = useState(null);

    const [historyCount, setHistoryCount] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    
    //For pagination
    const [lastLoadedClimb, setLastLoadedClimb] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            //console.log('Loading Profile...'); //Loading icon on initial loads (was confusing, and seemed like data was missing otherwise)
            setRefreshing(true);
            handleTapHistory().then(() => setRefreshing(false));
        }, [])
    );


    //Get active sessions in the same manner. Fetch sessions through the session object (order by timestamp and fetch last 5)- for pagination
    const handleTapHistory = async () => {
        try {
            const {getActiveSessionTaps, getTotalTapCount} = TapsApi();
            const { getClimb } = ClimbsApi();
            
            //To get User information, retained as is
            const {getUsersBySomeField} = UsersApi();
            let user = (await getUsersBySomeField('uid', currentUser.uid));
            if (user) {
                setUser(user.docs[0].data());
            }

            //Gets all expired sessions as Session Objects
            let recentSessionObjects = (await SessionsApi().getRecentFiveSessionsObjects(currentUser.uid));
            const recentSessionObjectsFiltered = recentSessionObjects.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            //No need to fetch Climb data, can be done in Session Detail
            
            //Getting Current Session Object
            const lastUserSession = (await SessionsApi().getLastUserSession(currentUser.uid));
            if (!lastUserSession.empty) {
                setCurrentSessionObject(lastUserSession.docs[0]);
            }
            //Getting climbs for the Active Session, retain as it is faster- tagging can be updated to most recent session
            const activeSessionSnapshot = (await getActiveSessionTaps(currentUser.uid));
            //Filtering active session taps
            const filteredActiveTaps = activeSessionSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects
                .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false)); // Apply the filter

            //Fetching climb details for active taps
            const activeClimbPromises = filteredActiveTaps.map(tap => getClimb(tap.climb));
            //Resolve active promises to get active session climb details
            const activeClimbsSnapshots = await Promise.all(activeClimbPromises);
            //Combine active session climb details with tap data
            const activeClimbsHistory = activeClimbsSnapshots.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists) return null;
                return { ...climbSnapshot.data(), tapId: filteredActiveTaps[index].id, tapTimestamp: filteredActiveTaps[index].timestamp, isSessionStart: filteredActiveTaps[index].isSessionStart, tagged: filteredActiveTaps[index].tagged};
            }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));


            //To allow for pagination of sessions

            //For the Firebase Query
            if (recentSessionObjects.docs.at(-1)) {
                //console.log('Last loaded climb set: ', recentSession.docs.at(-1));
                setLastLoadedClimb(recentSessionObjects.docs.at(-1)); 
            }

            const {activeSession, activeSessionTimestamp} = groupBySessions(activeClimbsHistory);

            setSessionsHistory(recentSessionObjectsFiltered); //Updating sessions on fetching a new climbHistory, expired sessions
            setCurrentSession(activeSession); // Storing Active Climbs in a new session, active session (REMAINS THE SAME)

            //To accurately calculate session count
            const sessionCount = (await (SessionsApi().getTotalSessionCount(currentUser.uid))).data().count;
            const tapCount = (await (getTotalTapCount(currentUser.uid))).data().count;
            console.log('The session count is: ', sessionCount);
            setSessionCount(sessionCount); //Session count updated, based on expired and current
            setHistoryCount(tapCount); //Total tap Count updated
        
        } catch (error) {
            console.error("Error fetching climbs for user:", error);
        }
    };

    //New Refreshing logic for drop-down reloading
    const onRefresh = React.useCallback(() => {
        //console.log('Refreshing...');
        setRefreshing(true);
        handleTapHistory().then(() => setRefreshing(false));
      }, []);

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
        //console.log("Received timestamp:", timestamp);
        if (!timestamp || typeof timestamp.seconds !== 'number' || typeof timestamp.nanoseconds !== 'number') {
            console.error('Invalid or missing timestamp:', timestamp);
            return null; // Return null or a default date, as per your logic
        }
        // Convert to milliseconds and create a new Date object
        return new Date(timestamp.seconds * 1000 + Math.round(timestamp.nanoseconds / 1000000));
    };
    
    //Starting climb is the session start of the last session you want to fetch, and start is the last session you fetched previously
    const groupBySessions = (activeClimbs, start = null) => {
        //Active session calculation REMAINS THE SAME, now wholly reliant on the firebase call
        const activeSessionStart = (activeClimbs && activeClimbs.length > 0? activeClimbs[activeClimbs.length - 1]: {tapTimestamp: firebase.firestore.Timestamp.now()});
        const activeSessionTimestamp = moment(convertTimestampToDate(activeSessionStart.tapTimestamp)).tz('America/New_York').format('YYYY-MM-DD HH:mm');
        const activeSession = {};
        activeSession[activeSessionTimestamp] = (activeClimbs && activeClimbs.length > 0 ? activeClimbs: []); //For desc ordering of active session taps
        return {activeSession, activeSessionTimestamp};
        //Returns expired sessions, active sessions, and the current session's timestamp
    };


    //Pagination Logic for scrolling down
    //We have the initally last loaded climb
    const handleLoadMoreSessions = async () => {
        if (lastLoadedClimb && !loadingMore) {
            setLoadingMore(true);
            //console.log('Loading more at the Bottom!');
            const newSessions = (await SessionsApi().getRecentFiveSessionsObjects(currentUser.uid, lastLoadedClimb)); //Change to lastLoadedClimb 
            const newSessionsFiltered = newSessions.docs.map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects
        
            if (newSessionsFiltered.length == 0) {
                console.log('No new climbs!');
                setLoadingMore(false);
                return;
            }
            if (newSessions.docs.at(-1)) {
                setLastLoadedClimb(newSessions.docs.at(-1));
            }
            setSessionsHistory(prevSessions => ({ ...prevSessions, ...newSessionsFiltered}));
            setLoadingMore(false);
            return;
        }
        else {
            //console.log('Loading Issue: ', loadingMore);
        }
    };

    //Scrolling handler for when the user reaches the bottom of the page
    const onScroll = ({ nativeEvent }) => {
        //console.log('Scroll Check called!');
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
                            <Image source={require('./../../../../../assets/editPen.png')} style={{ width: 10, height: 10 }}   resizeMode="contain" />
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
                        <SessionTapHistory currentSession={currentSession} isCurrent={true} currentSessionObject={currentSessionObject}/>
                        {sessionsHistory && Object.keys(sessionsHistory).length > 0 && <Text style={{color: 'black', paddingHorizontal: 20, paddingTop: 10, fontWeight: 'bold'}}>Past Sessions</Text>}
                        <SessionTapHistory currentSession={sessionsHistory} isCurrent={false}/>
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
