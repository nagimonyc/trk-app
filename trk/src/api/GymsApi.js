import React from "react";
import { firebase } from "@react-native-firebase/firestore";

function GymsApi() {
    console.log('[DATABASE] GymsApi called');
    const ref = firebase.firestore().collection("gyms");

    function setGymConfig(gymId, config) {
        return ref.doc(gymId).set({ config }, { merge: true });
    }

    return setGymConfig;
}

export default GymsApi;