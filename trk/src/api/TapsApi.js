import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";
import moment from "moment-timezone";

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


    return {
        addTap,
        getTap,
        getAllTaps,
        onTapsUpdate,
        getTapsBySomeField,
        getTopTenTaps,
        updateTap,
        onLatestFourTapsUpdate,
        getTapsByClimbAndDate
    };
}

export default TapsApi;