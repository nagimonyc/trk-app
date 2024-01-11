import React, { useState } from 'react';
import { View, Button, StyleSheet, Text, Switch, SafeAreaView, Alert } from 'react-native';
import SignIn from './SignIn';
import SignUp from './SignUp';
import auth from '@react-native-firebase/auth';

const SignInUpToggle = () => {
    console.log("[TEST] sign in up toggle call");
    const [isSignIn, setIsSignIn] = useState(true);
    const [setterIsEnabled, setSetterIsEnabled] = useState(false);
    const [nyuCompIsEnabled, setNyuCompIsEnabled] = useState(true);

    const toggleSwitchSetter = () => setSetterIsEnabled(previousState => !previousState);
    const toggleSwitchNyu = () => setNyuCompIsEnabled(previousState => !previousState);

    const handleForgotPassword = (email) => {
        auth()
            .sendPasswordResetEmail(email)
            .then(() => {
                Alert.alert("Check your email", "A link to reset your password has been sent to your email.");
            })
            .catch(error => {
                Alert.alert("Error", error.message);
            });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.switchContainer}>
                <View style={[styles.toggleSwitchView, { paddingLeft: 25, opacity: nyuCompIsEnabled ? 0 : 1 }]}>
                    <Text style={{ marginRight: 10, fontWeight: 'bold', color: 'black' }}>Setter?</Text>
                    <Switch
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitchSetter}
                        value={setterIsEnabled}
                        disabled={nyuCompIsEnabled}
                    />
                </View>

                <View style={[styles.toggleSwitchView, { opacity: 0 }]}>
                    <Text style={{ marginRight: 10, fontWeight: 'bold', color: 'black' }}>NYU Comp</Text>
                    <Switch
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitchNyu}
                        value={nyuCompIsEnabled}
                        trackColor={{ false: "#767577", true: "#4F0F87" }}
                    />
                </View>
            </View>
            <View style={styles.formContainer}>
                {isSignIn ? <SignIn onForgotPassword={handleForgotPassword} role={setterIsEnabled} nyuComp={nyuCompIsEnabled}/> : <SignUp role={setterIsEnabled} nyuComp={nyuCompIsEnabled} />}
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title={isSignIn ? 'Go to Sign Up' : 'Go to Login'}
                    onPress={() => setIsSignIn(!isSignIn)}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        alignItems: 'center',
    },
    toggleSwitchView: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    formContainer: {
        flex: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flex: 1,
        marginTop: 20,
        marginBottom: 20,
        justifyContent: 'center',
        padding: 5,
    }
});

export default SignInUpToggle;

