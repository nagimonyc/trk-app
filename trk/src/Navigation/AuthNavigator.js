import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import SignInUpToggle from '../Components/SignInUpToggle';

const AuthStack = createStackNavigator();

function AuthNavigator() {
    console.log('[TEST] AuthNavigator called');
    return (
        <NavigationContainer>
            <AuthStack.Navigator initialRouteName="SignInUpToggle">
                <AuthStack.Screen
                    name="SignInUpToggle"
                    component={SignInUpToggle}
                    options={{ headerShown: false }}
                />
            </AuthStack.Navigator>
        </NavigationContainer>
    );
}

export default AuthNavigator;
