import React, { useState } from 'react';
import { View, Button, StyleSheet, Text, Switch, SafeAreaView } from 'react-native';
import SignIn from './SignIn';
import SignUp from './SignUp';

const SignInUpToggle = () => {
    const [isSignIn, setIsSignIn] = useState(true);
    const [isEnabled, setIsEnabled] = useState(false);

    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.switchContainer}>
                <Text style={{ marginRight: 10, fontWeight: 'bold' }}>Setter?</Text>
                <Switch>
                    <Switch
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitch}
                        value={isEnabled}
                    />
                </Switch>
            </View>
            <View style={styles.formContainer}>
                {isSignIn ? <SignIn /> : <SignUp role={isEnabled} />}
            </View>
            <View><Text></Text></View>

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
        flex: 1,
        flexDirection: 'row', // Added this line
        alignItems: 'center', // Added this line
        backgroundColor: 'red',
        justifyContent: 'flex-end',
        paddingRight: 20
    },
    formContainer: {
        flex: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'blue'
    },
    buttonContainer: {
        flex: 1,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: 'green',
        justifyContent: 'center',
    }
});

export default SignInUpToggle;
