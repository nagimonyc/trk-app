import React from "react";
import { SafeAreaView, Text, StyleSheet, View, Image, Button, TouchableOpacity, Alert } from "react-native";
import { AuthContext } from "../../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";

const UserProfile = () => {
    console.log('[TEST] UserProfile called');
    const { tapCount } = React.useContext(AuthContext);
    const { currentUser } = React.useContext(AuthContext);



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
                            // Assuming the user's Firestore document ID is their UID
                            const userUID = currentUser.uid; // replace this with the actual user UID
                            await firestore().collection('users').doc(userUID).delete();
                            const user = firebase.auth().currentUser;
                            try {
                                await user.delete();
                                // User account has been deleted from Firebase Authentication
                            } catch (error) {
                                console.error("Error deleting user account:", error);
                            }
                            // SignOut(); // navigate back to sign-in/sign-up
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
                <View style={styles.header}>
                    <Text style={styles.titleText}>Activity</Text>
                    <Button title="Delete Account" onPress={handleDeleteAccount}></Button>
                </View>
                <View style={styles.effortRecap}>
                    <View style={[styles.effortRecapChild, {}]}>
                        <Text>{tapCount}</Text>
                        <Text>Total Climbs</Text>
                    </View>
                    <View style={[styles.effortRecapChild, {}]}>
                        <Text>CLIMB</Text>
                        <Text>Best Effort</Text>
                    </View>
                </View>
                <View style={styles.effortRecapGraph}>
                    <Image
                        source={require('../../../assets/recapGraph.png')}
                        resizeMode="contain"
                        style={styles.effortRecapImage}
                    >
                    </Image>
                </View>
                <View style={[styles.effortHistory, { alignItems: 'center' }]}><Text style={{ fontWeight: 'bold', }}>Recap</Text></View>
            </View>
        </SafeAreaView >
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    innerContainer: {
        flex: 1,
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    effortRecap: {
        flex: 2,
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    effortRecapChild: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    effortRecapGraph: {
        flex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    effortRecapImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        paddingHorizontal: 20,
    },
    effortHistory: {
        flex: 4,
        paddingHorizontal: 20,
    },
});

export default UserProfile;