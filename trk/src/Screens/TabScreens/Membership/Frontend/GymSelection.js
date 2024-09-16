import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
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
        navigation.navigate('Membership', { gymName });
    };

    return (
        <View style={[styles.container, { flex: 1 }]}>
            <View style={{ marginHorizontal: 15, flex: 1 }}>
                <Text style={styles.title}>Where are you climbing today?</Text>
                <ScrollView
                    style={{ marginTop: 30, flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 30 }}
                >
                    <TouchableOpacity onPress={() => handleGymSelection('MetroRock')} style={styles.button}>
                        <Text style={styles.buttonText}>MetroRock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleGymSelection('Bouldering Project')} style={styles.button}>
                        <Text style={styles.buttonText}>Bouldering Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleGymSelection('Brooklyn Boulders')} style={styles.button}>
                        <Text style={styles.buttonText}>Brooklyn Boulders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleGymSelection('Method')} style={styles.button}>
                        <Text style={styles.buttonText}>Method</Text>
                    </TouchableOpacity>
                    {/* Uncomment if needed */}
                    {/* <TouchableOpacity onPress={() => handleGymSelection('GP81')} style={styles.button}>
              <Text style={styles.buttonText}>GP81</Text>
          </TouchableOpacity> */}
                    <TouchableOpacity onPress={() => handleGymSelection('Island Rock')} style={styles.button}>
                        <Text style={styles.buttonText}>Island Rock</Text>
                    </TouchableOpacity>
                    {/* Uncomment if needed */}
                    {/* <TouchableOpacity onPress={() => handleGymSelection('Test')} style={styles.button}>
              <Text style={styles.buttonText}>Test</Text>
          </TouchableOpacity> */}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FCF7F3',
    },
    title: {
        fontFamily: "DMSans-Regular",
        fontSize: 40,
        marginTop: 30,
        fontWeight: '500',
        color: 'black',
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