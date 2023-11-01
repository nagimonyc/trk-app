import React, { useState, useContext } from "react";
import { SafeAreaView, View, Text, StyleSheet, Button, Alert, TouchableOpacity} from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import SignOut from "./SignOut";

const Settings = () => {
    const { currentUser } = useContext(AuthContext);
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
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>
            <TouchableOpacity 
                style={[styles.button, { backgroundColor: 'black' }]} 
                onPress={handleDeleteAccount}
            >
                <Text style={styles.buttonText}>Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#3498db' }]} 
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
        borderRadius: 5,  
        alignItems: 'center', 
        justifyContent: 'center',
        width: '45%',  
    },
    buttonText: {
        color: 'white',  
        fontSize: 16
    }
    
});

export default Settings;