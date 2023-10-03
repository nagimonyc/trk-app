import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import SignIn from './SignIn';
import SignUp from './SignUp';

const Authentication = () => {
    const [isSignIn, setIsSignIn] = useState(true);

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                {isSignIn ? <SignIn /> : <SignUp />}
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title={isSignIn ? 'Go to Sign Up' : 'Go to Sign In'}
                    onPress={() => setIsSignIn(!isSignIn)}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        marginTop: 20,
        marginBottom: 20,
    }
});

export default Authentication;
