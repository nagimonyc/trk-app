import React, { useState, useContext, useEffect } from "react";
import { Platform, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Button, Alert, Image } from "react-native";
import { AuthContext } from "../../../../Utils/AuthContext";
import TapHistory from "../../../../Components/TapHistory";
import TapsApi from "../../../../api/TapsApi";
import ClimbsApi from "../../../../api/ClimbsApi";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import SessionTapHistory from "../../../../Components/SessionTapHistory";

const ClimberProfile = ({ navigation }) => {
    const { tapCount, currentUser } = useContext(AuthContext);
    const [climbsHistory, setClimbsHistory] = useState([]);
    const [historyCount, setHistoryCount] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            handleTapHistory();
        }, [])
    );    

    const handleTapHistory = async () => {
        const { getTapsBySomeField } = TapsApi();
        const { getClimb } = ClimbsApi();
        try {
            const tapsSnapshot = await getTapsBySomeField('user', currentUser.uid);
    
            // Filter taps
            const filteredTaps = tapsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() })) // Convert to tap objects
                .filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false)); // Apply the filter
    
            // Fetch climb details for each filtered tap
            const climbsPromises = filteredTaps.map(tap => getClimb(tap.climb));
    
            // Resolve all promises to get climb details
            const climbsSnapshots = await Promise.all(climbsPromises);
    
            // Combine climb details with tap data
            const newClimbsHistory = climbsSnapshots.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists) return null;
                return { ...climbSnapshot.data(), tapId: filteredTaps[index].id, tapTimestamp: filteredTaps[index].timestamp};
            }).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));
    
            setClimbsHistory(newClimbsHistory);
            setHistoryCount(newClimbsHistory.length);
        } catch (error) {
            console.error("Error fetching climbs for user:", error);
        }
    };    

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.greeting}>
                <Text style={styles.greeting_text}>
                    Hi <Text style={{color: 'black'}}>{currentUser && currentUser.email ? currentUser.email.split('@')[0] : ''}</Text> 🖖
                </Text>
                </View>
                <View style={styles.header}>
                    <Text style={styles.titleText}>Activity</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        {
                            Platform.OS === 'android' ?
                                <Icon name="settings" size={30} color="#3498db" /> :
                                <Image source={require('../../../../../assets/settings.png')} style={{ width: 30, height: 30 }} />
                        }
                    </TouchableOpacity>
                </View>
                <View style={styles.effortRecap}>
                    <View style={[styles.effortRecapChild, {}]}>
                        <Text style={styles.any_text}>{historyCount}</Text>
                        <Text style={styles.any_text}>Total Climbs</Text>
                    </View>
                    <View style={[styles.effortRecapChild, {}]}>
                        {/* <Text>CLIMB</Text>
                        <Text>Best Effort</Text> */}
                    </View>
                </View>
                <View style={[styles.effortHistory, { alignItems: 'center' }]}>
                    <View style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
                        <View style={{ flex: 1 }}></View>
                        <Text style={{ fontWeight: 'bold', flex: 1, textAlign: 'center', color: 'black' }}>
                            Recap
                        </Text>
                       {/* <TouchableOpacity
                            style={[styles.pillButton]}
                            onPress={handleTapHistory}
                        >
                            <Text style={styles.buttonText}>Reload</Text>
                    </TouchableOpacity> */}
                    </View>
                    <View style={[styles.effortHistoryList]}>
                        <SessionTapHistory climbsHistory={climbsHistory} />
                    </View>
                </View>
            </View>
        </SafeAreaView >
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        margin: 0,
    },
    innerContainer: {
        flex: 1,
        paddingVertical: 5,
        width: '100%',
        margin: 0,
    },
    header: {
        flex: 0.75,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    any_text: {
        color: 'black',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    effortRecap: {
        flex: 0.75,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    effortRecapChild: {
        justifyContent: 'center',
        alignItems: 'center',
        color: 'black',
        paddingHorizontal: 10, 
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
        padding: 0,
        color: 'black',
        width: '100%',
        margin: 0,
    },
    effortHistoryList: {
        flex: 1,
        width: '100%',
        color: 'black',
        backgroundColor: 'transparent', 
        paddingHorizontal: 0, 
        paddingVertical: 5,
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
    },
    greeting: {
        display: 'flex',
        paddingTop: 20,
        paddingHorizontal: 20
        
    },
    greeting_text: {
        color: 'black',
        fontSize: 20,
    }

});

export default ClimberProfile;