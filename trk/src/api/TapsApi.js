import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";
import moment from "moment-timezone";
import { firebase as firebaseFunctions } from "@react-native-firebase/functions";

function TapsApi() {

    const ref = firebase.firestore().collection("taps");
    console.log('[DATABASE] TApsApi called');

    // Add a new tap
    function addTap(tap) {
        return ref.add(tap);
    }

    // Get a tap by its ID
    function getTap(id) {
        return ref.doc(id).get();
    }

    // Get all taps
    function getAllTaps() {
        return ref.get();
    }

    // Get taps with real-time updates
    function onTapsUpdate(callback) {
        return ref.onSnapshot(callback);
    }

    // Get taps with some specific field value
    function getTapsBySomeField(field, value) {
        return ref.where(field, '==', value).orderBy('timestamp','desc').get();
    }

    // Get top 10 most recent taps
    function getTopTenTaps() {
        return ref.orderBy('timestamp', 'desc').limit(10).get();
    }


    function onLatestFourTapsUpdate(callback) {
        return ref.orderBy('timestamp', 'desc').limit(4).onSnapshot(callback);
    }

    async function updateTap(tapId, updatedTap) {
        const tapRef = firebase.firestore().collection("taps").doc(tapId);
        if (updatedTap && updatedTap.archived === true) {
            //update the current tap
            //find next tap and make that session start
            await tapRef.update(updatedTap);
            const oldTap = await getTap(tapId);
            console.log('The old tap is: ', oldTap);

            //If the tap being archived marks the start of a session, then we find the oldest tap in that session to mark as the beginning of the session (still expires at the older time)
            if (oldTap._data.isSessionStart) {
                    const nextTaps = await ref
                    .where('user', '==', oldTap._data.user)
                    .where('archived', '!=', true)
                    .orderBy('archived')
                    .where('expiryTime', '==', oldTap._data.expiryTime)
                    .orderBy('timestamp', 'asc')
                    .limit(5)
                    .get();

                if (!nextTaps.empty) {
                    console.log('Updating the next one! ', nextTaps.docs[0]);
                    const nextTapRef = firebase.firestore().collection("taps").doc(nextTaps.docs[0].id);
                    await nextTapRef.update({ isSessionStart: true });

                    const scheduleFunction = firebaseFunctions.functions().httpsCallable('scheduleFunction');
                    let expiryTimeForFunction;
                    if (oldTap._data.expiryTime instanceof firebase.firestore.Timestamp) {
                        // Convert Firebase Timestamp to JavaScript Date object
                        expiryTimeForFunction = oldTap._data.expiryTime.toDate().toISOString();
                    } else if (oldTap._data.expiryTime instanceof Date) {
                        // Already a JavaScript Date object
                        expiryTimeForFunction = oldTap._data.expiryTime.toISOString();
                    } else {
                        // If it's not a Firebase Timestamp or JavaScript Date, use it as is
                        expiryTimeForFunction = oldTap._data.expiryTime;
                    }

                    scheduleFunction({ tapId: nextTaps.docs[0].id, expiryTime: expiryTimeForFunction })
                        .then((result) => {
                            console.log('Function result:', result.data);
                        }).catch((error) => {
                            console.error('Error calling function:', error);
                        });

                }
            }
            return;
        }
        return await tapRef.update(updatedTap);
    }

    async function getTapsByClimbAndDate(climbId, date) {
        const startOfDay = moment(date).startOf('day').toDate();
        const endOfDay = moment(date).endOf('day').toDate();
        return ref.where('climb', '==', climbId)
                .where('timestamp', '>=', startOfDay)
                .where('timestamp', '<=', endOfDay)
                .get();
    }


    //To get the last Tap made by a user
    function getLastUserTap(userId) {
        console.log('User ID: ', userId);
        return ref
            .where('user', '==', userId)
            .where('archived', '!=', true)
            .orderBy('archived')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();
    }

    //To get all the taps in the current session
    function getActiveSessionTaps(userId) {
        console.log('User ID: ', userId);
        console.log('Fetching Active Session Climbs....');
        return ref
            .where('user', '==', userId)
            .where("expiryTime", ">", firebase.firestore.Timestamp.now())
            .orderBy("expiryTime", "desc").get();
    }

    // To get the starting points of the last sessions with pagination
    function getRecentFiveSessions(userId, startAfterDoc = null) {
        console.log('User ID: ', userId);
        console.log('Fetching Session Start Climbs with Pagination....');
        let query = ref
            .where('user', '==', userId)
            .where('isSessionStart', '==', true)
            .where("expiryTime", '<=', firebase.firestore.Timestamp.now())
            .orderBy("expiryTime", "desc")
            .limit(5);

        if (startAfterDoc) {
            console.log('Starting after: ', startAfterDoc);
            query = query.startAfter(startAfterDoc);
        }

        return query.get();
    }


    //To get all expired taps to build Expired sessions
    function getExpiredTaps(userId) {
        console.log('User ID: ', userId);
        console.log('Fetching Expired Climbs....');
        return ref
            .where('user', '==', userId)
            .where("expiryTime", '<=', firebase.firestore.Timestamp.now())
            .orderBy("expiryTime", "desc")
            .get();
    }

    //To get all sessions quicker (display count)
    function getTotalSessionCount(userId) {
        console.log('User ID: ', userId);
        console.log('Fetching Expired Climbs....');
        return ref
            .where('user', '==', userId)
            .where('isSessionStart', '==', true)
            .where('archived', '==', false)
            .count()
            .get();
    }

    return {
        addTap,
        getTap,
        getAllTaps,
        onTapsUpdate,
        getTapsBySomeField,
        getTopTenTaps,
        updateTap,
        onLatestFourTapsUpdate,
        getTapsByClimbAndDate, 
        getLastUserTap,
        getActiveSessionTaps,
        getRecentFiveSessions,
        getExpiredTaps,
        getTotalSessionCount,
    };
}

export default TapsApi;