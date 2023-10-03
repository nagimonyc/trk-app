import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = () => {
        auth()
            .createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Get the user object
                const user = userCredential.user;

                // Create a new document in Firestore 'Users' collection
                firestore()
                    .collection('Users')
                    .doc(user.uid)
                    .set({
                        email: user.email, // user's email address
                        uid: user.uid, // unique ID for the user
                        // add other user-related information here
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
        <View>
            <Text>Sign Up</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                placeholder="Password"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            />
            <Button title="Sign Up" onPress={handleSignUp} />
        </View>
    );
};

export default SignUp;
