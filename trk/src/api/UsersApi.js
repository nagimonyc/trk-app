import { firebase } from "@react-native-firebase/firestore";
import React from "react";
import { useState, useEffect } from "react";

function UsersApi() {
    console.log('[DATABASE] UsersAPI called');

    const ref = firebase.firestore().collection("users");

    function getUsersBySomeField(field, value) {
        return ref.where(field, '==', value).get();
    }

    function getUsersByForSearch(searchQuery) {
        return ref.where('username', '>=', searchQuery)
            .where('username', '<=', searchQuery + '\uf8ff')
            .where('role', '==', 'climber')
            .limit(10)
            .get();
    }

    function getUsersByForSearchEmail(searchQuery) {
        return ref.where('email', '>=', searchQuery)
            .where('email', '<=', searchQuery + '\uf8ff')
            .where('role', '==', 'climber')
            .limit(10)
            .get();
    }

    function getUsersByForSearchSetter(searchQuery) {
        return ref.where('username', '>=', searchQuery)
            .where('username', '<=', searchQuery + '\uf8ff')
            .where('role', '==', 'setter')
            .limit(10)
            .get();
    }

    function getUsersByForSearchEmailSetter(searchQuery) {
        return ref.where('email', '>=', searchQuery)
            .where('email', '<=', searchQuery + '\uf8ff')
            .where('role', '==', 'setter')
            .limit(10)
            .get();
    }

    //To update the user collection (usernames, etc)
    async function updateUser(userId, updatedUser) {
        const userRef = ref.doc(userId);
        return await userRef.update(updatedUser);
    }

    return {
        getUsersBySomeField,
        updateUser,
        getUsersByForSearch,
        getUsersByForSearchEmail,
        getUsersByForSearchEmailSetter,
        getUsersByForSearchSetter,
    };
}

export default UsersApi;