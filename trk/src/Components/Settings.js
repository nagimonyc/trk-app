import React, { useState, useContext, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, Button, Alert, TouchableOpacity, Switch } from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import SignOut from "./SignOut";

const Settings = () => {
    const { currentUser, role } = useContext(AuthContext);
    const handleDeleteAccount = async () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete all user data?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Yes", onPress: async () => {
                        try {

                            const userUID = currentUser.uid;
                            await firestore().collection('users').doc(userUID).delete();
                            const user = firebase.auth().currentUser;
                            try {
                                await user.delete();
                            } catch (error) {
                                console.error("Error deleting user account:", error);
                            }
                        } catch (error) {
                            console.error("Error deleting user data:", error);
                        }
                    }
                }
            ]
        );
    };

    const [nyuCompIsEnabled, setNyuCompIsEnabled] = useState(false);

    useEffect(() => {
        // console.log(currentUser);
        const fetchSettings = async () => {
            const userUID = currentUser.uid;
            const doc = await firestore().collection('users').doc(userUID).get();
            if (doc.exists) {
                setNyuCompIsEnabled(doc.data().nyuComp || false);
            }
        };

        fetchSettings();
    }, [currentUser.uid]); // Depend on currentUser.uid to refetch if it changes

    const toggleSwitchNyu = async () => {
        const newNyuCompIsEnabled = !nyuCompIsEnabled;
        setNyuCompIsEnabled(newNyuCompIsEnabled);

        try {
            const userUID = currentUser.uid;
            await firestore().collection('users').doc(userUID).update({
                nyuComp: newNyuCompIsEnabled,
            });
        } catch (error) {
            console.error("Error updating user settings:", error);
            setNyuCompIsEnabled(!newNyuCompIsEnabled);
        }
    };


    return (
        <SafeAreaView style={styles.container}>

            {/* {role === 'climber' && (<View style={styles.switchContainer}>
                <Text style={({marginBottom: 10, fontSize: 15, color: 'black'})}>NYU tryouts?</Text>
                <Switch onValueChange={toggleSwitchNyu} value={nyuCompIsEnabled}  trackColor={{false: 'rgba(0,0,0,0.3)', true: 'rgba(0,0,0,0.1)'}}
                thumbColor={'#fe8100'}/>

            </View>)} */}
            <View style={styles.innerContainer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#D2122E' }]}
                    onPress={handleDeleteAccount}
                >
                    <Text style={styles.buttonText}>Delete Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#fe8100' }]}
                    onPress={SignOut}
                >
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'flex-end',
    },
    innerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '45%',
    },
    buttonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '400'
    },
    switchContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 100,
    },


});

export default Settings;