import React, { useState, useContext, useEffect } from "react";
import { Linking, Platform, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Button, Alert, Image } from "react-native";
import { AuthContext } from "../../../../Utils/AuthContext";
import TapHistory from "../../../../Components/TapHistory";
import TapsApi from "../../../../api/TapsApi";
import ClimbsApi from "../../../../api/ClimbsApi";
import CommentsApi from "../../../../api/CommentsApi";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
// import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/FontAwesome'; // Make sure to import Icon
import { useFocusEffect } from '@react-navigation/native';
import SessionTapHistory from "../../../../Components/SessionTapHistory";
import moment from 'moment-timezone';
import { RefreshControl, ScrollView } from 'react-native';
import UsersApi from "../../../../api/UsersApi";
import storage from '@react-native-firebase/storage';
import SessionsApi from "../../../../api/SessionsApi";
import LineGraphComponent from "../../../../Components/LineGraphComponent";

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

    const [sessionCount, setSessionCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // best effort
    const [highestVGrade, setHighestVGrade] = useState('V0');

    //For pagination
    const [lastLoadedClimb, setLastLoadedClimb] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);


    //For Tabs (Activity and Progress)
    const [activeTab, setActiveTab] = useState('Activity');
    const [sessionsThisWeek, setSessionsThisWeek] = useState([]);
    const [climbsThisWeek, setClimbsThisWeek] = useState([]);
    const [timeThisWeek, setTimeThisWeek] = useState('0m');
    const [gradeThisWeek, setGradeThisWeek] = useState('V0');
    const [commentsLeft, setCommentsLeft] = useState(0);
    // const [tapCount, setTapCount] = useState(0);


    // Define the tab switcher component
    const TabSwitcher = () => (
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 30, backgroundColor: 'white' }}>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'Activity' ? styles.tabActive : {}]}
                onPress={() => setActiveTab('Activity')}
            >
                <Text style={[activeTab === 'Activity' ? styles.activeTabText : styles.tabText]}>ACTIVITY</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'Progress' ? styles.tabActive : {}]}
                onPress={() => setActiveTab('Progress')}
            >
                <Text style={[activeTab === 'Activity' ? styles.tabText : styles.activeTabText]}>PROGRESS</Text>
            </TouchableOpacity>
        </View>
    );

    useEffect(() => {
        if (climbsThisWeek && climbsThisWeek.length > 0) {
            // Sort the climbs by grade lexicographically in descending order
            const sorted = climbsThisWeek.slice().sort((a, b) => {
                // Assuming that the grade property is a string and can be compared lexicographically
                return b.grade.localeCompare(a.grade);
            });
            // Set the highest grade
            setGradeThisWeek(sorted[0].grade);
        }
    }, [climbsThisWeek]);


    //To prepare climbs to be displayed (for the week) 
    const prepClimbs = async (data) => {
        try {
            const tapsPromises = data.climbs.map(tapId => TapsApi().getTap(tapId));
            const tapsData = await Promise.all(tapsPromises);
            const promise = tapsData.filter(tap => (tap.data() != null && tap.data() != undefined)).map(tap => ClimbsApi().getClimb(tap.data().climb));
            const recentSnapshot = await Promise.all(promise);
            const recentSessionStarts = recentSnapshot.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists || !tapsData[index] || !tapsData[index].data()) return null;
                return { ...climbSnapshot.data(), tapId: tapsData[index].id, tapTimestamp: tapsData[index].data().timestamp };
            }).filter(climb => climb !== null);
            setClimbsThisWeek(prev => prev.concat(recentSessionStarts));
        } catch (error) {
            console.error('Error while preparing climbs: ', error.message);
        }
    };

    //To calculate the session duration for Progress
    const calculateDuration = async (data) => {
        try {
            // Assuming timestamps are in milliseconds
            const firstTap = data[data.length - 1];
            const lastTap = data[0];

            //Timestamp and ExpiryTime Exits in Session Objects!
            //const lastTapItem = (await TapsApi().getTap(lastTap)).data();
            //const firstTapItem = (await TapsApi().getTap(firstTap)).data();
            const lastTimestamp = firstTap.timestamp.toDate(); // Most recent
            const firstTimestamp = lastTap.expiryTime.toDate(); // Oldest

            // Calculate the difference in hours
            const differenceInHours = (firstTimestamp - lastTimestamp) / (1000 * 60 * 60);

            // If the difference is less than an hour, return in minutes
            if (differenceInHours < 1) {
                const differenceInMinutes = Math.round((firstTimestamp - lastTimestamp) / (1000 * 60));
                setTimeThisWeek(`${differenceInMinutes} mins`);
            }

            // Otherwise, round to the nearest half hour and return in hours
            const roundedHours = Math.round(differenceInHours * 2) / 2;
            setTimeThisWeek(`${roundedHours} hrs`);
        } catch (error) {
            console.error('Error while calculating duration: ', error.message);
        }
    };

    const MoreSection = () => {
        const [showProgress, setShowProgress] = useState(false);

        // Helper function to toggle the progress graph
        const toggleProgress = () => {
            setShowProgress(!showProgress);
        };

        return (
            <View style={{ marginTop: 20 }}>
                <Text style={{ paddingHorizontal: 15, color: 'black', fontSize: 16, fontWeight: '700' }}>More</Text>
                <TouchableOpacity
                    style={{
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'space-between', // Use space-between to align Text and Icon
                        flexDirection: 'row', // Set direction of children to row
                        marginTop: 10,
                    }}
                    onPress={toggleProgress}
                >
                    <View></View>
                    <Text style={{ color: 'black', fontWeight: '500', fontSize: 14 }}>Weekly Graph</Text>
                    <Icon name={showProgress ? 'chevron-up' : 'chevron-down'} size={14} color="#525252" />
                </TouchableOpacity>
                {showProgress && <ProgressContent />}
            </View>
        );
    };

    //Display for the Progress Tab
    const ProgressContent = () => (
        <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
            {/* <Text style={{ color: 'black', paddingHorizontal: 20, paddingTop: 10, fontWeight: 'bold' }}>This Week</Text> */}
            <View style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                <LineGraphComponent data={climbsThisWeek} />
            </View>
            {/* <Text style={{ color: 'black', paddingHorizontal: 20, paddingTop: 10, fontWeight: 'bold' }}>Total</Text>
            <View style={{ backgroundColor: 'white', paddingHorizontal: 15, display: 'flex', width: '100%', marginTop: 20, paddingVertical: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 5 }}>
                    <Text style={{ fontSize: 15, color: 'black' }}>Sessions</Text>
                    <Text style={{ fontSize: 15, color: 'black' }}>{sessionsThisWeek.length}</Text>
                </View>
                <View style={{ borderBottomColor: '#E0E0E0', borderBottomWidth: 1, marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 5 }}>
                    <Text style={{ fontSize: 15, color: 'black' }}>Climbs</Text>
                    <Text style={{ fontSize: 15, color: 'black' }}>{climbsThisWeek.length}</Text>
                </View>
                <View style={{ borderBottomColor: '#E0E0E0', borderBottomWidth: 1, marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 5 }}>
                    <Text style={{ fontSize: 15, color: 'black' }}>Time</Text>
                    <Text style={{ fontSize: 15, color: 'black' }}>{timeThisWeek}</Text>
                </View>
                <View style={{ borderBottomColor: '#E0E0E0', borderBottomWidth: 1, marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
                    <Text style={{ fontSize: 15, color: 'black' }}>Best Effort</Text>
                    <Text style={{ fontSize: 15, color: 'black' }}>{gradeThisWeek}</Text>
                </View>
            </View> */}
            {/* <Text style={{ color: 'black', paddingHorizontal: 20, paddingTop: 20, fontWeight: '300', textAlign: 'center', width: '100%' }}>More features coming soon.</Text>
            <Text style={{ color: 'black', paddingHorizontal: 20, paddingTop: 5, fontWeight: '300', textAlign: 'center', width: '100%' }}>Any suggestions? Leave them in feedback!</Text> */}
        </View>
    );

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
            const { getActiveSessionTaps, getTotalTapCount, getTapsBySomeField } = TapsApi();
            const { getClimb } = ClimbsApi();

            // const tapCountCheck = await getTotalTapCount(currentUser.uid);
            // if (tapCountCheck) {
            //     setTapCount(tapCountCheck.data().count);
            // }

            const userTapsCheck = await getTapsBySomeField('user', currentUser.uid);
            if (!userTapsCheck) {
                console.log("No user taps found");
                return;
            }

            // Temporary array to hold all the grades
            const grades = [];

            // Fetch all climbs associated with the taps
            for (let doc of userTapsCheck.docs) {
                let tap = { id: doc.id, ...doc.data() };
                let climb = await getClimb(tap.climb); // Assuming getClimb returns the climb document
                if (climb) {
                    let grade = climb.data().grade; // Assuming climb data has a grade field
                    console.log(`Grade for climbId ${tap.climb}: ${grade}`);
                    // Add the grade to the array
                    grades.push(grade);
                }
            }

            // Now filter the grades to only include those starting with "V" and find the highest one
            const vGrades = grades
                .filter(grade => grade.startsWith("V"))
                .map(grade => parseInt(grade.substring(1), 10)); // Convert the numeric part to an integer

            // Check if there are any "V" grades, find the highest, and set it in the state
            if (vGrades.length > 0) {
                const highestVGradeNumber = Math.max(...vGrades);
                const highestVGrade = `V${highestVGradeNumber}`;
                setHighestVGrade(highestVGrade);
                console.log(`Highest V Grade: ${highestVGrade}`);
                // Here you could update a state variable to store the highest V grade
                // setHighestVGrade(highestVGrade); // Assuming you have a useState to store this
            } else {
                console.log("No V grades found");
                // Handle the case where no "V" grades are present
            }

            const { getCommentsCountBySomeField } = CommentsApi();
            let count = await getCommentsCountBySomeField('user', currentUser.uid);
            if (count) {
                setCommentsLeft(count); // Update the state variable
            }

            //To get User information, retained as is
            const { getUsersBySomeField } = UsersApi();
            let user = (await getUsersBySomeField('uid', currentUser.uid));
            if (user) {
                setUser(user.docs[0].data());
            }

            //Gets all expired sessions as Session Objects
            let recentSessionObjects = (await SessionsApi().getRecentFiveSessionsObjects(currentUser.uid));
            const recentSessionObjectsFiltered = recentSessionObjects.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            //No need to fetch Climb data, can be done in Session Detail

            //Get Weekly Session Objects (Progress)
            let weeklySessionObjects = (await SessionsApi().getLastWeekSessionsObjects(currentUser.uid));
            const weeklySessionObjectsFiltered = weeklySessionObjects.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClimbsThisWeek([]);
            for (let i = 0; i < weeklySessionObjectsFiltered.length; i = i + 1) {
                if (weeklySessionObjectsFiltered[i].climbs)
                    prepClimbs(weeklySessionObjectsFiltered[i]);
            }
            setSessionsThisWeek(weeklySessionObjectsFiltered);
            /*
            if (weeklySessionObjectsFiltered && weeklySessionObjectsFiltered.length > 0) {
                calculateDuration(weeklySessionObjectsFiltered);
            }

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
                return { ...climbSnapshot.data(), tapId: filteredActiveTaps[index].id, tapTimestamp: filteredActiveTaps[index].timestamp, isSessionStart: filteredActiveTaps[index].isSessionStart, tagged: filteredActiveTaps[index].tagged };
            }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));


            //To allow for pagination of sessions

            //For the Firebase Query
            if (recentSessionObjects.docs.at(-1)) {
                //console.log('Last loaded climb set: ', recentSession.docs.at(-1));
                setLastLoadedClimb(recentSessionObjects.docs.at(-1));
            }

            const { activeSession, activeSessionTimestamp } = groupBySessions(activeClimbsHistory);

            setSessionsHistory(recentSessionObjectsFiltered); //Updating sessions on fetching a new climbHistory, expired sessions
            setSessionsThisWeek(weeklySessionObjectsFiltered);
            setCurrentSession(activeSession); // Storing Active Climbs in a new session, active session (REMAINS THE SAME)

            //To accurately calculate session count
            const sessionCount = (await (SessionsApi().getTotalSessionCount(currentUser.uid))).data().count;
            const tapCount = (await (getTotalTapCount(currentUser.uid))).data().count;
            console.log('The session count is: ', sessionCount);
            setSessionCount(sessionCount); //Session count updated, based on expired and current
            setHistoryCount(tapCount); //Total tap Count updated
            */
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
        const activeSessionStart = (activeClimbs && activeClimbs.length > 0 ? activeClimbs[activeClimbs.length - 1] : { tapTimestamp: firebase.firestore.Timestamp.now() });
        const activeSessionTimestamp = moment(convertTimestampToDate(activeSessionStart.tapTimestamp)).tz('America/New_York').format('YYYY-MM-DD HH:mm');
        const activeSession = {};
        activeSession[activeSessionTimestamp] = (activeClimbs && activeClimbs.length > 0 ? activeClimbs : []); //For desc ordering of active session taps
        return { activeSession, activeSessionTimestamp };
        //Returns expired sessions, active sessions, and the current session's timestamp
    };


    //Pagination Logic for scrolling down
    //We have the initally last loaded climb
    const handleLoadMoreSessions = async () => {
        if (lastLoadedClimb && !loadingMore && activeTab === 'Activity') {
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
            setSessionsHistory(prevSessions => ({ ...prevSessions, ...newSessionsFiltered }));
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
        // <SafeAreaView style={styles.container}>
        //     <ScrollView
        //         onScroll={onScroll}
        //         scrollEventThrottle={200} // Adjust based on performance
        //         refreshControl={
        //             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3498db"]} />
        //         }
        //         style={{ margin: 0, padding: 0, width: '100%', height: '100%' }}
        //     >
        //         <View style={styles.innerContainer}>
        //             <View style={styles.profileTop}>
        //                 <View style={styles.topLine}>
        // <TouchableOpacity style={styles.initialCircle} onPress={() => { navigation.navigate('Edit_User', { user: user }) }}>
        //     {climbImageUrl && (<Image source={{ uri: climbImageUrl }} style={{ borderRadius: 50, height: '100%', width: '100%' }} />)}
        //     {!climbImageUrl && (<Text style={styles.any_text}>{currentUser.email.charAt(0).toUpperCase()}</Text>)}
        //     <View style={{ position: 'absolute', bottom: 0, right: -10, backgroundColor: 'white', borderRadius: 50, padding: 5, borderWidth: 0.5, borderColor: 'black' }}>
        //         <Image source={require('./../../../../../assets/editPen.png')} style={{ width: 10, height: 10 }} resizeMode="contain" />
        //     </View>
        // </TouchableOpacity>
        // <View style={styles.recapData}>
        //     <Text style={styles.recapNumber}>{historyCount}</Text>
        //     <Text style={styles.any_text}>Climbs</Text>
        // </View>
        // <View style={styles.recapData}>
        //     <Text style={styles.recapNumber}>{sessionCount}</Text>
        //     <Text style={styles.any_text}>Sessions</Text>
        // </View>
        // <TouchableOpacity style={styles.settings}
        //     onPress={() => navigation.navigate('Settings')}>
        //     {
        //         Platform.OS === 'android' ?
        //             <Icon name="settings" size={30} color="#3498db" /> :
        //             <Image source={require('../../../../../assets/settings.png')} style={{ width: 30, height: 30 }} />
        //     }
        // </TouchableOpacity>
        //                 </View>
        // <View style={styles.greeting}>
        //     <Text style={styles.greeting_text}>
        //         Hi <Text style={{ color: 'black' }}>
        //             {user && user.username ? user.username : ''}
        //         </Text> 🖖
        //     </Text>
        // </View>
        //             </View>
        //             <TabSwitcher />
        //             {activeTab === 'Activity' ? (
        //                 <View style={[styles.effortHistory, { alignItems: 'center' }]}>
        //                     <View style={[styles.effortHistoryList]}>
        //                         <SessionTapHistory currentSession={currentSession} isCurrent={true} currentSessionObject={currentSessionObject} />
        //                         {sessionsHistory && Object.keys(sessionsHistory).length > 0 && <Text style={{ color: 'black', paddingHorizontal: 20, paddingTop: 10, fontWeight: 'bold' }}>Past Sessions</Text>}
        //                         <SessionTapHistory currentSession={sessionsHistory} isCurrent={false} />
        //                     </View>
        //                 </View>) : <ProgressContent />}
        //         </View>
        //     </ScrollView>
        // </SafeAreaView>

        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
                <SafeAreaView style={[styles.container]}>
                    {/* profile section */}
                    <View style={{ height: 115, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 15 }}>
                        {/* Left Container for photo and text */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* photo */}
                            <TouchableOpacity style={[styles.initialCircle]} onPress={() => { navigation.navigate('Edit_User', { user: user }) }}>
                                {climbImageUrl && (<Image source={{ uri: climbImageUrl }} style={{ height: '100%', width: '100%', borderRadius: 10 }} resizeMode="contain" />)}
                                {!climbImageUrl && (<Text style={styles.any_text}>{currentUser.email.charAt(0).toUpperCase()}</Text>)}
                                <View style={{ position: 'absolute', bottom: -5, right: -10, backgroundColor: 'white', borderRadius: 50, padding: 5, borderWidth: 0.5, borderColor: 'black' }}>
                                    <Image source={require('./../../../../../assets/editPen.png')} style={{ width: 10, height: 10 }} resizeMode="contain" />
                                </View>
                            </TouchableOpacity>
                            {/* text */}
                            <View style={{ marginLeft: 15 }}>
                                <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>
                                    {user && user.username ? user.username : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Right Container for settings icon */}
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ paddingVertical: 20 }}>
                            <Image source={require('../../../../../assets/settings.png')} style={{ width: 30, height: 30 }} />
                        </TouchableOpacity>
                    </View>
                    {/* Fun Stats */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ paddingHorizontal: 15, color: 'black', fontSize: 16, fontWeight: '700' }}>Fun Stats</Text>
                        <View style={{ width: '100%', backgroundColor: 'white', marginTop: 10 }}>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Climbs Found</Text>
                                    <Text style={{ color: 'black' }}>{tapCount}</Text>
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Route Setters Smiling (Reviews Left)</Text>
                                    <Text style={{ color: 'black' }}>{commentsLeft}</Text>
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Climbing Sessions per Week</Text>
                                    <Text style={{ color: 'black' }}>{sessionsThisWeek.length}</Text>
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Best Effort</Text>
                                    <Text style={{ color: 'black' }}>{highestVGrade}</Text>
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{
                                paddingHorizontal: 15,
                                backgroundColor: 'white', // Ensure there's a background color
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 2,
                                elevation: 5, // for Android
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Friends made along the way</Text>
                                    <Text style={{ color: 'black' }}>∞</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    {/* More (graph) */}
                    <MoreSection />

                </SafeAreaView >
                {/* call me 🤙 */}
                <View style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    marginBottom: 25
                }}>
                    <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, marginBottom: 5 }}>More & more features coming soon ♥</Text>
                    <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, marginBottom: 5 }}>Contact me if you have feature ideas or feedback :)</Text>
                    <TouchableOpacity onPress={() => Linking.openURL('sms:+13474534258')}>
                        <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, textDecorationLine: 'underline' }}>(347) 453-4258</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView >
        </View>
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
        width: 75,
        height: 75,
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
});

export default ClimberProfile;
