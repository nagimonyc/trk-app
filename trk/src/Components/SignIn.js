import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

const SignIn = ({ onForgotPassword }) => {
    console.log("[TEST] sign in call");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Email and password must not be empty');
            return;
        }
        auth()
            .signInWithEmailAndPassword(email, password)
            .then(() => {
                console.log('User signed in!');
            })
            .catch(error => {
                Alert.alert('Invalid email or password. Passwords are case sensitive');
            });
    };

    const handleForgotPassword = () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }
        onForgotPassword(email);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <TextInput
                    placeholder="Email"
                    placeholderTextColor={"#b1b1b3"}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    secureTextEntry
                    placeholderTextColor={"#b1b1b3"}
                    onChangeText={setPassword}
                    style={styles.input}
                />
                <Button title="Login" onPress={handleSignIn} />
                <Text onPress={handleForgotPassword} style={styles.forgotPasswordText}>Forgot Password?</Text>
                <View style={styles.prompt}>
                    <Text style={styles.promptText}>Don't have an account?</Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    input: {
        width: 300,
        height: 40,
        padding: 10,
        borderWidth: 1,
        borderColor: 'black',
        marginBottom: 10,
        color: 'black',
    },
    prompt: {
        position: 'absolute',
        bottom: -20,
        flexDirection: 'row', 
        alignItems: 'center',
    },
    promptText: {
        fontSize: 13,
        color: 'black',
    },
    forgotPasswordText: {
        color: '#0000FF',
        marginTop: 15,
        marginBottom: 15,
        textDecorationLine: 'underline',
    }
});

export default SignIn;
