import React from "react";
import { SafeAreaView, StyleSheet, View, Text, Button, Alert } from "react-native";
import { AuthContext } from "../../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import SetterProfile from "./setter";
import ClimberProfile from "./climber";

const UserProfile = () => {
    const { role } = React.useContext(AuthContext);

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
                            const { currentUser } = React.useContext(AuthContext);
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
               
                { role === 'climber' ? <ClimberProfile /> : <SetterProfile /> }
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    innerContainer: {
        flex: 1,
    },
    
});

export default UserProfile;
