import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const SignUp = ({ role, nyuComp }) => {
    console.log("[TEST] sign up call");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = () => {
        console.log("[TEST] sign up call");
        auth()
            .createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Get the user object
                const user = userCredential.user;
                console.log('User signed up:', userCredential.user);

                // Create a new document in Firestore 'Users' collection
                firestore()
                    .collection('users')
                    .doc(user.uid)
                    .set({
                        email: user.email, // user's email address
                        uid: user.uid, // unique ID for the user
                        role: role ? 'setter' : 'climber', // user's role
                        taps: 0, // number of taps
                        nyuComp: nyuComp, // whether the user is a part of the NYU climbing competition
                    })
                    .then(() => {
                        console.log('User added to Firestore');
                    })
                    .catch((error) => {
                        console.log('Error adding user to Firestore: ', error);
                    });

                console.log('User account created & signed in!');
            })
            .catch(error => {
                console.error('Something went wrong with sign-up: ', error);
            });
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
            />
            <TextInput
                placeholder="Password"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
                style={styles.input}
            />
            <Button title="Sign Up" onPress={handleSignUp} />
        </View>
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

export default SignUp;
