import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";
import moment from "moment-timezone";
import { firebase as firebaseFunctions } from "@react-native-firebase/functions";

function SessionsApi() {
    const ref = firebase.firestore().collection("checkout_sessions");
    console.log('[DATABASE] SessionsApi called');

    //Add the new session 
    function addSession(session) {
        return ref.add(session);
    }

    //To get the last Session made by a user
    function getLastUserSession(userId) {
        //console.log('User ID: ', userId);
        return ref
            .where('user', '==', userId)
            .where('archived', '!=', true)
            .orderBy('archived')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();
    }

    async function updateSession(sessionId, updatedSession) {
        const sessionRef = ref.doc(sessionId);
        //Need to account for deletion of taps in a session
        return await sessionRef.update(updatedSession);
    }

    // To get the starting points of the last sessions with pagination
    function getRecentFiveSessionsObjects(userId, startAfterDoc = null) {
        let query = ref
            .where('user', '==', userId)
            .where('archived', '==', false)
            .where("expiryTime", '<=', firebase.firestore.Timestamp.now())
            .orderBy("expiryTime", "desc")
            .limit(5);

        if (startAfterDoc) {
            query = query.startAfter(startAfterDoc);
        }
        return query.get();
    }
    //To get all sessions quicker (display count)
    function getTotalSessionCount(userId) {
        return ref
            .where('user', '==', userId)
            .where('archived', '==', false)
            .count()
            .get();
    }

    function getSessionByTap(tapId) {
        return ref.where('archived', '==', false)
        .where('climbs','array-contains', tapId)
        .get();
    }

    
    // To get weekly climbs
    function getLastWeekSessionsObjects(userId) {
        const oneWeekAgo = firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); //A week ago
        let query = ref
            .where('user', '==', userId)
            .where('archived', '==', false)
            .where("timestamp", '>=', oneWeekAgo) // Filter for sessions from the past week
            .orderBy("timestamp", "desc");
        return query.get();
    }    

    return {
        addSession,
        getLastUserSession,
        updateSession,
        getRecentFiveSessionsObjects,
        getTotalSessionCount,
        getSessionByTap,
        getLastWeekSessionsObjects,
    };
}

export default SessionsApi;