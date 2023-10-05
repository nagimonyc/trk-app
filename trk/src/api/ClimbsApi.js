import { firebase } from "@react-native-firebase/firestore";
import React from "react";
import { useState, useEffect } from "react";

function ClimbsApi() {

    const ref = firebase.firestore().collection("climbs");

    function addClimb(climb) {
        return ref.add(climb);
    }

    function getClimb(id) {
        return ref.doc(id).get();
    }

    return {
        addClimb,
        getClimb
    };
}

export default ClimbsApi;