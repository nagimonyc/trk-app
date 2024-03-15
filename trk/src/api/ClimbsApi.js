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
        return ref.where(field, '==', value).orderBy('timestamp','desc').get();
    }

    async function updateClimb(climbId, updatedClimb) {
        await ref.doc(climbId).update(updatedClimb);
        return climbId;
    }

    function getClimbsForSetter(setterId) { //Only Movement for now
        return ref.where('setter', '==', setterId).where('gym', '==', 'TDrC1lRRjbMuMI06pONY').orderBy('timestamp','desc').get();
    }

    function getClimbsInLastWeek(setterId) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Subtract 7 days to get the date one week ago
        return ref
            .where('setter', '==', setterId)
            .where('timestamp', '>=', oneWeekAgo)
            .get();
    }
    



    return {
        addClimb,
        getClimb,
        getClimbsBySomeField,
        updateClimb,
        getClimbsForSetter,
        getClimbsInLastWeek
    };
}

export default ClimbsApi;