import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";

function TapsApi() {

    const ref = firebase.firestore().collection("taps");

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
        return ref.where(field, '==', value).get();
    }

    // Get top 10 most recent taps
    function getTopTenTaps() {
        return ref.orderBy('createdAt', 'desc').limit(10).get();
    }

    return {
        addTap,
        getTap,
        getAllTaps,
        onTapsUpdate,
        getTapsBySomeField,
        getTopTenTaps
    };
}

export default TapsApi;