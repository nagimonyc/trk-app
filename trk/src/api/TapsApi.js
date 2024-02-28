import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";
import moment from "moment-timezone";
import { firebase as firebaseFunctions } from "@react-native-firebase/functions";
import SessionsApi from "./SessionsApi";

//REMOVED UNNECESSARY API FUNCTIONS
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
        //REMOVED ALL PROCESSING OF THE CURRENT AND PREVIOUS TAPS IN THE SESSION
        //NOW DEAL ONLY WITH THE SESSION OBJECT
        const tapRef = firebase.firestore().collection("taps").doc(tapId);
        if (updatedTap && updatedTap.archived === true) {
            //update the current tap
            //remove that tap from its Session Climbs, and featured
            await tapRef.update(updatedTap);

            //get the session that contained the tap
            const sessionSnapshot = await SessionsApi().getSessionByTap(tapId);
            console.log('The fetched session is: ', sessionSnapshot.docs);
            if (!sessionSnapshot.empty) {
                const sessionObject = sessionSnapshot.docs[0].data();
                let climbsArray = sessionObject.climbs;
                let featuredClimbCopy = sessionObject.featuredClimb;
                const tapIdIndex = climbsArray.indexOf(tapId);
                if (tapIdIndex > -1) {
                    climbsArray.splice(tapIdIndex, 1);
                }
                if (featuredClimbCopy === tapId) {
                    featuredClimbCopy = climbsArray.length > 0 ? climbsArray[0] : ''; // Set to first element or null if climbsArray is empty
                }
                if (climbsArray.length == 0) {
                    //session is empty, archive it
                    await SessionsApi().updateSession(sessionSnapshot.docs[0].id, {archived: true});
                } else {
                    //update session with the new climbsarray and featuredClimb
                    await SessionsApi().updateSession(sessionSnapshot.docs[0].id, {climbs: climbsArray, featuredClimb: featuredClimbCopy});
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
        //console.log('User ID: ', userId);
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
        //console.log('User ID: ', userId);
        //console.log('Fetching Active Session Climbs....');
        return ref
            .where('user', '==', userId)
            .where('archived', '==', false)
            .where("expiryTime", ">", firebase.firestore.Timestamp.now())
            .orderBy("expiryTime")
            .orderBy('timestamp', 'desc') //To avoid rerendering on reversing the climb list
            .get();
    }

    //To get all sessions quicker (display count)
    function getTotalSessionCount(userId) {
        //console.log('User ID: ', userId);
        //console.log('Fetching Expired Climbs....');
        return ref
            .where('user', '==', userId)
            .where('isSessionStart', '==', true)
            .where('archived', '==', false)
            .count()
            .get();
    }
    //To get all the taps made by a user
    function getTotalTapCount(userId) {
        return ref
            .where('user', '==', userId)
            .where('archived', '==', false)
            .count()
            .get();
    }

    function getClimbsByIdUserCount(climbId, userId) {
        return ref
        .where('user', '==', userId)
        .where('climb', '==', climbId)
        .where('archived', '==', false)
        .count()
        .get();
    }

    return {
        addTap,
        getTap,
        getTapsBySomeField,
        getTopTenTaps,
        updateTap,
        onLatestFourTapsUpdate,
        getTapsByClimbAndDate, 
        getLastUserTap,
        getActiveSessionTaps,
        getTotalSessionCount,
        getTotalTapCount,
        getClimbsByIdUserCount
    };
}

export default TapsApi;
