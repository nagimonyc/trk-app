import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from '@react-navigation/native';
import analytics from '@react-native-firebase/analytics';
import { AuthContext } from "../../../../Utils/AuthContext";

const GymSelection = () => {
    const navigation = useNavigation();
    const { currentUser } = useContext(AuthContext);

    const handleGymSelection = async (gymName) => {
        const timestamp = new Date().toISOString();

        if (currentUser) {
            // Log event to Firebase Analytics with gym name
            await analytics().logEvent('gym_access', {
                user_id: currentUser.uid,
                gym_name: gymName,
                timestamp: timestamp,
            });
        }

        // Navigate to Membership screen
        navigation.navigate('Membership');
    };

    return (
        <View style={styles.container}>
            <View style={{ marginHorizontal: 15 }}>
                <Text style={styles.title}>Where are you climbing today?</Text>
                <View style={{ display: 'flex', width: '100%', height: '100%', marginTop: 30 }}>
                    <TouchableOpacity onPress={() => handleGymSelection('MetroRock')} style={styles.button}>
                        <Text style={styles.buttonText}>MetroRock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleGymSelection('Bouldering Project')} style={styles.button}>
                        <Text style={styles.buttonText}>Bouldering Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleGymSelection('Brooklyn Boulders')} style={styles.button}>
                        <Text style={styles.buttonText}>Brooklyn Boulders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleGymSelection('GP81')} style={styles.button}>
                        <Text style={styles.buttonText}>GP81</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FCF7F3'
    },
    title: {
        fontFamily: "DMSans-Regular",
        fontSize: 40,
        marginTop: 30,
        fontWeight: '500',
    },
    button: {
        alignItems: 'center',
        height: 65,
        backgroundColor: '#ff6633',
        borderRadius: 10,
        marginBottom: 30,
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: "DMSans-Regular",
        fontSize: 21,
        fontWeight: '500',
        color: '#FCF7F3',
    },
});

export default GymSelection;
