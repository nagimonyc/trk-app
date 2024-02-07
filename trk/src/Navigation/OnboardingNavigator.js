import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../Screens/NavScreens/Onboarding/Front/onboarding';
import { NavigationContainer } from '@react-navigation/native';

const OnboardingStack = createStackNavigator();

function OnboardingNavigator() {
    return (
        <NavigationContainer>
        <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
            <OnboardingStack.Screen name="OnboardingScreen" component={OnboardingScreen} />
            {/* Add other onboarding screens as needed */}
        </OnboardingStack.Navigator>
        </NavigationContainer>
    );
}

export default OnboardingNavigator;
