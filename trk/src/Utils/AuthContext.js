import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // <-- Add this line

// Create a context object
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    console.log('[TEST] AuthProvider called');
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

    // Return the provider component
    return (
        <AuthContext.Provider value={{ currentUser, initializing, role, tapCount }}>
            {children}
        </AuthContext.Provider>
    );
};