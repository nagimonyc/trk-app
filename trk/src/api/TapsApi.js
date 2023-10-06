import { firebase } from "@react-native-firebase/firestore";

function TapsApi() {

    const ref = firebase.firestore().collection("taps");

    function addTap(tap) {
        return ref.add(tap);
    }

    function getTap(id) {
        return ref.doc(id).get();
    }

    return {
        addTap,
        getTap
    };
}

export default TapsApi;