import React from "react";
import { SafeAreaView, StyleSheet, View, Text, Button, Alert } from "react-native";
import { AuthContext } from "../../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import SetterProfile from "../../Components/SetterProfile";
import ClimberProfile from "../../Components/ClimberProfile";

const UserProfile = () => {
    const { role } = React.useContext(AuthContext);


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>

                {role === 'climber' ? <ClimberProfile /> : <SetterProfile />}
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
