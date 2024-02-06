import React from 'react';
import Swiper from 'react-native-swiper';
import { View, Button, Text, StyleSheet } from 'react-native';

// Assuming you have separate components for each slide
import Slide1 from './Slide1';
import Slide2 from './Slide2';
import Slide3 from './Slide3';
import Slide4 from './Slide4';
import Slide5 from './slide5';

const OnboardingScreen = ({ navigation }) => {
    const handleDone = () => {
        // Update the user's state to reflect that onboarding is complete
        // You would have a function to call here that updates the user state in your backend or context

        // Then navigate to the main app
        // navigation.replace('App'); // Use 'replace' to prevent going back to onboarding
        navigation.replace('App')
    };

    return (
        <Swiper loop={false} showsButtons={true} onIndexChanged={(index) => {
            // Call handleDone when the user reaches the last slide
            if (index === 4) { // Assuming you have 4 slides, indexed 0-3
                handleDone();
            }
        }}>
            <Slide1 />
            <Slide2 />
            <Slide3 />
            <Slide4 />
            <Slide5 />
        </Swiper>
    );
};

const styles = StyleSheet.create({
    // Add styles for your slides if necessary
});

export default OnboardingScreen;
