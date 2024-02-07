import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import SignInUp from '../Components/SignInUp';

const AuthStack = createStackNavigator();

function AuthScreen() {
    console.log('[TEST] AuthScreen called');
    return (
        <NavigationContainer>
            <AuthStack.Navigator initialRouteName="SignInUp">
                <AuthStack.Screen
                    name="SignInUp"
                    component={SignInUp}
                    options={{ headerShown: false }}
                />
            </AuthStack.Navigator>
        </NavigationContainer>
    );
}

export default AuthScreen;
