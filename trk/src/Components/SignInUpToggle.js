import React, { useState } from 'react';
import { View, Button, StyleSheet, Text, Switch, SafeAreaView } from 'react-native';
import SignIn from './SignIn';
import SignUp from './SignUp';

const SignInUpToggle = () => {
    console.log("[TEST] sign in up toggle call");
    const [isSignIn, setIsSignIn] = useState(true);
    const [setterIsEnabled, setSetterIsEnabled] = useState(false);
    const [nyuCompIsEnabled, setNyuCompIsEnabled] = useState(true);

    const toggleSwitchSetter = () => setSetterIsEnabled(previousState => !previousState);
    const toggleSwitchNyu = () => setNyuCompIsEnabled(previousState => !previousState);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.switchContainer}>
                <View style={[styles.toggleSwitchView, { paddingLeft: 25, opacity: nyuCompIsEnabled ? 0 : 1 }]}>
                    <Text style={{ marginRight: 10, fontWeight: 'bold', color: 'black'}}>Setter?</Text>
                    <Switch
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitchSetter}
                        value={setterIsEnabled}
                        disabled={nyuCompIsEnabled}
                    />
                </View>

                <View style={styles.toggleSwitchView}>
                    <Text style={{ marginRight: 10, fontWeight: 'bold', color: 'black'}}>NYU Comp</Text>
                    <Switch
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitchNyu}
                        value={nyuCompIsEnabled}
                        trackColor={{ false: "#767577", true: "#4F0F87" }}
                    />
                </View>
            </View>
            <View style={styles.formContainer}>
                {isSignIn ? <SignIn /> : <SignUp role={setterIsEnabled} nyuComp={nyuCompIsEnabled} />}
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title={isSignIn ? 'Go to Sign Up' : 'Go to Sign In'}
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
        alignItems: 'center', // Added this line
    },
    toggleSwitchView: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center', // Added this line
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
    }
});

export default SignInUpToggle;
