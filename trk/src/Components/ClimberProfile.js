import React, { useState, useContext } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Button, Alert } from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import TapHistory from "./TapHistory";
import TapsApi from "../api/TapsApi";
import ClimbsApi from "../api/ClimbsApi";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";

const ClimberProfile = () => {
    const { tapCount, currentUser } = useContext(AuthContext);
    const [climbsHistory, setClimbsHistory] = useState([]);

    const handleTapHistory = async () => {
        const { getTapsBySomeField } = TapsApi();
        const { getClimb } = ClimbsApi();
        try {
            const tapsSnapshot = await getTapsBySomeField('user', currentUser.uid);
            const climbsPromises = [];
            tapsSnapshot.docs.forEach(doc => {
                const climbId = doc.data().climb;
                const climbPromise = getClimb(climbId);
                climbsPromises.push(climbPromise);
            });
            const climbsSnapshots = await Promise.all(climbsPromises);
            const newClimbsHistory = climbsSnapshots.map((climbSnapshot, index) => {
                return climbSnapshot.exists ? { ...climbSnapshot.data(), tapId: tapsSnapshot.docs[index].id } : null;
            }).filter(climb => climb !== null);
            setClimbsHistory(newClimbsHistory);
        } catch (error) {
            console.error("Error fetching climbs for user:", error);
        }
    };
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
                        {/* <Text>CLIMB</Text>
                        <Text>Best Effort</Text> */}
                    </View>
                </View>
                <View style={[styles.effortHistory, { alignItems: 'center' }]}>
                    <View style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}></View>
                        <Text style={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                            Recap
                        </Text>
                        <TouchableOpacity
                            style={[styles.pillButton]}
                            onPress={handleTapHistory}
                        >
                            <Text style={styles.buttonText}>Reload</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.effortHistoryList, { backgroundColor: '#F2E5D6' }]}>
                        <TapHistory climbsHistory={climbsHistory} />
                    </View>
                </View>
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
        flex: 0.75,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    effortRecap: {
        flex: 0.75,
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
        paddingHorizontal: 5,
    },
    effortHistoryList: {
        flex: 1,
        width: '100%',
    },
    pillButton: {
        backgroundColor: '#3498db', // or any color of your choice
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,  // This will give it a pill shape
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 16
    }
});

export default ClimberProfile;