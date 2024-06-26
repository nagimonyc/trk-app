import React from "react";
import { SafeAreaView, StyleSheet, View, Text, Button, Alert } from "react-native";
import { AuthContext } from "../../../../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import SetterProfile from "../Backend/SetterProfile";
import ClimberProfile from "../Backend/ClimberProfile";

const UserProfile = ({ navigation }) => {
    const { role } = React.useContext(AuthContext);


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>

                <ClimberProfile navigation={navigation} />
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 0,
    },
    innerContainer: {
        flex: 1,
    },

});

export default UserProfile;
