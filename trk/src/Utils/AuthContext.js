import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

// Create a context object
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [initializing, setInitializing] = useState(true);

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

    // Return the provider component
    return (
        <AuthContext.Provider value={{ currentUser, initializing }}>
            {children}
        </AuthContext.Provider>
    );
};