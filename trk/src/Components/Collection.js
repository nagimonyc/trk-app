import React, { useState, useContext, useEffect  } from "react";
import { SafeAreaView, View, Text, StyleSheet, Button, Alert, TouchableOpacity, Switch } from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import SignOut from "./SignOut";

const Collection = () => {
    const { currentUser, role } = useContext(AuthContext);
    return (
        <SafeAreaView style={styles.container}>
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

export default Collection;