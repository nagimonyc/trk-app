import React, { useState } from 'react';
import { View, Text, Button, TouchableOpacity } from 'react-native';
import SignIn from './SignIn'; // Your sign-in component
import SignUp from './SignUp'; // Your sign-up component

const Authentication = () => {
    const [isSignIn, setIsSignIn] = useState(true); // state to toggle between sign in and sign up

    return (
        <View>
            {isSignIn ? <SignIn /> : <SignUp />}
            <TouchableOpacity onPress={() => setIsSignIn(!isSignIn)}>
                <Text>
                    {isSignIn ? 'Go to Sign Up' : 'Go to Sign In'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default Authentication;
