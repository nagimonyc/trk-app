import { firebase } from "@react-native-firebase/firestore";
import React from "react";
import { useState, useEffect } from "react";

function ClimbsApi() {
    console.log('[DATABASE] ClimbsAPI called');

    const ref = firebase.firestore().collection("climbs");

    function addClimb(climb) {
        return ref.add(climb);
    }

    function getClimb(id) {
        return ref.doc(id).get();
    }

    function getClimbsBySomeField(field, value) {
        return ref.where(field, '==', value).get();
    }

    function updateClimb(climbId, updatedClimb) {
        return ref.doc(climbId).update(updatedClimb);
    }

    return {
        addClimb,
        getClimb,
        getClimbsBySomeField,
        updateClimb
    };
}

export default ClimbsApi;