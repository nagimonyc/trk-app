import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../Screens/NavScreens/Onboarding/Front/onboarding';

const OnboardingStack = createStackNavigator();

function OnboardingNavigator() {
    return (
        <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
            <OnboardingStack.Screen name="OnboardingScreen" component={OnboardingScreen} />
            {/* Add other onboarding screens as needed */}
        </OnboardingStack.Navigator>
    );
}

export default OnboardingNavigator;
