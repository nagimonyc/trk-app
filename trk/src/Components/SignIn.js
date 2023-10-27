import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, TouchableWithoutFeedback, Keyboard } from 'react-native';
import auth from '@react-native-firebase/auth';

const SignIn = () => {
    console.log("[TEST] sign in call");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = () => {
        auth()
            .signInWithEmailAndPassword(email, password)
            .then(() => {
                console.log('User signed in!');
            })
            .catch(error => {
                console.error('Something went wrong with sign-in: ', error);
            });
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <TextInput
                    placeholder="Email"
                    placeholderTextColor= {"#b1b1b3"}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    secureTextEntry
                    placeholderTextColor= {"#b1b1b3"}
                    onChangeText={setPassword}
                    style={styles.input}
                />
                <Button title="Sign In" onPress={handleSignIn} />
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
    },
});

export default SignIn;
