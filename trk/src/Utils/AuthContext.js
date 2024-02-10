import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // <-- Add this line
import messaging from '@react-native-firebase/messaging';

// Create a context object
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    console.log('[TEST] AuthProvider called');
    const [currentUser, setCurrentUser] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const [role, setRole] = useState(null);
    const [tapCount, setTapCount] = useState(0);
    const [isNewUser, setIsNewUser] = useState(false);

    const resetOnboarding = () => {
        setIsNewUser(true); // Set isNewUser back to true
        if (currentUser) {
            // Also update Firestore document for the current user
            firestore().collection('users').doc(currentUser.uid).update({ isNewUser: true });
        }
    };

    async function onAuthStateChanged(user) {
        if (user) {
            try {
                const token = await messaging().getToken();
                // Store the token in Firestore
                const userRef = firestore().collection('users').doc(user.uid);
                await userRef.set({ fcmToken: token }, { merge: true });
            } catch (error) {
                console.error('Error updating FCM token:', error); //Storing FCM token for push notifications, on login
            }
        }

        setCurrentUser(user);
        if (user && user.isNewUser) {
            setIsNewUser(user.isNewUser);
        }
        if (initializing) setInitializing(false);
    }

    useEffect(() => {
        console.log('[DATABASE] use effect called Auth Provider 1');
        // Subscribe to Firebase auth state changes
        const subscriber = auth().onAuthStateChanged(onAuthStateChanged);

        // Unsubscribe on cleanup
        return subscriber;
    }, []);


    useEffect(() => {
        console.log('[TEST] use effect called Auth Provider 2');
        if (!currentUser) return;

        console.log('[DATABASE] use effect called Auth Provider 2(prime)');

        // Fetch the user's role from Firestore when currentUser changes.
        const unsubscribeUser = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot(documentSnapshot => {
                const userData = documentSnapshot.data();
                if (userData) {
                    setRole(userData?.role);
                    // Check if the user is new and needs to complete onboarding
                    setIsNewUser(!!userData.isNewUser); // Use double negation to convert to boolean
                }
            });

        // Fetch non-archived taps count
        const unsubscribeTaps = firestore()
            .collection('taps')
            .where('user', '==', currentUser.uid)
            .onSnapshot(querySnapshot => {
                const nonArchivedCount = querySnapshot.docs
                    .filter(doc => !doc.data().archived)
                    .length;
                setTapCount(nonArchivedCount);
            });

        // Detach listeners when the component unmounts
        return () => {
            unsubscribeUser();
            unsubscribeTaps();
        };
    }, [currentUser]);

    const completeOnboarding = () => {
        setIsNewUser(false); // Update local state
        if (currentUser) {
            // Update Firestore document for the current user
            firestore().collection('users').doc(currentUser.uid).update({ isNewUser: false });
        }
    };


    // Return the provider component
    return (
        <AuthContext.Provider value={{
            currentUser, initializing, role, tapCount, isNewUser, completeOnboarding, resetOnboarding
        }}>
            {children}
        </AuthContext.Provider>
    );
};