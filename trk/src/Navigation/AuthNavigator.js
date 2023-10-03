import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SignIn from '../Components/SignIn';
import SignUp from '../Components/SignUp';
import { NavigationContainer } from '@react-navigation/native';
import Authentication from '../Components/Authentication';

const AuthStack = createStackNavigator();

function AuthNavigator() {
    return (
        <NavigationContainer>
            <AuthStack.Navigator initialRouteName="Authentication">
                <AuthStack.Screen
                    name="Authentication"
                    component={Authentication}
                    options={{ headerShown: false }}
                />
            </AuthStack.Navigator>
        </NavigationContainer>
    );
}

export default AuthNavigator;
