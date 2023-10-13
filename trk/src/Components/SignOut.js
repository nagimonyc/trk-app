import React from "react";
import auth from '@react-native-firebase/auth';

const SignOut = () => {
    console.log("[TEST] sign out call");
    auth()
        .signOut()
        .then(() => {
            console.log('User signed out!');
            // Optionally, you can navigate the user to the landing page or log-in screen
        })
        .catch((error) => {
            console.log('Error signing out: ', error);
        });
};

export default SignOut;