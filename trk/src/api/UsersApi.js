import { firebase } from "@react-native-firebase/firestore";
import React from "react";
import { useState, useEffect } from "react";

function UsersApi() {
    console.log('[DATABASE] UsersAPI called');

    const ref = firebase.firestore().collection("users");

    function getUsersBySomeField(field, value) {
        return ref.where(field, '==', value).get();
    }
    //To update the user collection (usernames, etc)
    async function updateUser(userId, updatedUser) {
        const userRef = ref.doc(userId);
        return await userRef.update(updatedUser);
    }

    return {
        getUsersBySomeField,
        updateUser,
    };
}

export default UsersApi;