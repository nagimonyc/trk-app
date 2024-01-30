import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, TouchableWithoutFeedback, Keyboard, Alert, Platform, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import { TouchableOpacity } from 'react-native-gesture-handler';

GoogleSignin.configure({
    webClientId: '786555738802-5g0r4c2i0dho0lcne6j7c3h0p744pnk0.apps.googleusercontent.com',
});

const SignIn = ({ onForgotPassword, role, nyuComp }) => {
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

    const onGoogleButtonPress = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            await GoogleSignin.signOut();
            const { idToken } = await GoogleSignin.signIn();
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            const userCredential = await auth().signInWithCredential(googleCredential);
            //console.log('Signed in with Google!');
            // Check if the user is new
            if (userCredential.additionalUserInfo.isNewUser) {
                const user = userCredential.user;
                // Here, set the additional data as you like
                firestore()
                    .collection('users')
                    .doc(user.uid)
                    .set({
                        email: user.email,
                        uid: user.uid,
                        role: role ? 'setter' : 'climber', // set a default or desired role
                        taps: 0,
                        nyuComp: nyuComp, // set default or desired value
                        timestamp: new Date(),
                        username: user.email.split('@')[0], //ADDING AN INITIAL USERNAME
                    })
                    .then(() => {
                        console.log('New user added to Firestore');
                    })
                    .catch((error) => {
                        console.log('Error adding new user to Firestore:', error);
                    });
            }
        } catch (error) {
            //console.error(error);
            Alert.alert('Sign in Error', 'Failed to sign in with Google');
        }
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
                <View style={{ display: 'flex', flexDirection: 'column', padding: 10 }}>
                    <View style={{ marginBottom: 10 }}>
                        <Button title="Login" onPress={handleSignIn} />
                    </View>
                    {
                        Platform.OS !== 'ios' && (
                            <View>
                                <TouchableOpacity
                                    style={{display: 'flex', flexDirection: 'row', paddingVertical: 10, justifyContent:'center', alignItems:'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.54)', borderRadius: 10}}
                                    onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
                                >
                                <Image source={require('../../assets/google.png')} style={{width: 25, height: 25, marginLeft: 10}}/>
                                <Text style={{color: 'rgba(0,0,0,0.54)', fontWeight:'500', paddingHorizontal: 20}}>Continue with Google</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }
                </View>
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
