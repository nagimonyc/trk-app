import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // <-- Add this line

// Create a context object
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const [role, setRole] = useState(null);
    const [tapCount, setTapCount] = useState(0);

    // Handle user state changes
    function onAuthStateChanged(user) {
        setCurrentUser(user);
        if (initializing) setInitializing(false);
    }

    useEffect(() => {
        // Subscribe to Firebase auth state changes
        const subscriber = auth().onAuthStateChanged(onAuthStateChanged);

        // Unsubscribe on cleanup
        return subscriber;
    }, []);

    useEffect(() => {
        if (currentUser) {
            // Fetch the role from Firestore when currentUser changes.
            const unsubscribe = firestore()
                .collection('users')
                .doc(currentUser.uid)
                .onSnapshot(documentSnapshot => {
                    const userData = documentSnapshot.data();
                    if (userData) {
                        setRole(userData?.role);
                        setTapCount(userData?.taps);
                    }
                });

            // Detach listener when the component unmounts
            return () => unsubscribe();
        }
    }, [currentUser]); // <-- Add this line

    // Return the provider component
    return (
        <AuthContext.Provider value={{ currentUser, initializing, role, tapCount }}>
            {children}
        </AuthContext.Provider>
    );
};
