import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const subscriber = auth().onAuthStateChanged(async user => {
            if (user) {
                try {
                    const token = await messaging().getToken();
                    const userRef = firestore().collection('users').doc(user.uid);

                    // Update the FCM token
                    await userRef.set({ fcmToken: token }, { merge: true });

                    // Subscribe to user document changes
                    const unsubscribe = userRef.onSnapshot(snapshot => {
                        const userData = snapshot.data();
                        setCurrentUser({
                            ...user.toJSON(), // Convert user to plain object
                            ...userData
                        });
                    }, error => {
                        console.error('Error fetching user data:', error);
                    });

                    return unsubscribe; // Unsubscribe when auth state changes
                } catch (error) {
                    console.error('Error updating FCM token:', error);
                }
            } else {
                setCurrentUser(null);
            }
            if (initializing) setInitializing(false);
        });

        return () => {
            subscriber(); // Unsubscribe from auth listener on cleanup
        };
    }, [initializing]);

    return (
        <AuthContext.Provider value={{
            currentUser,
            initializing
        }}>
            {children}
        </AuthContext.Provider>
    );
};
