import React, { useState } from 'react';
import { Modal, View, StyleSheet, Button, SafeAreaView, Text, Platform } from 'react-native';
import Swiper from 'react-native-swiper';


// Import your slide components
import Slide1 from '../Screens/NavScreens/Onboarding/Front/slide1';
import Slide2 from '../Screens/NavScreens/Onboarding/Front/slide2';
import Slide3 from '../Screens/NavScreens/Onboarding/Front/slide3';
import Slide4 from '../Screens/NavScreens/Onboarding/Front/slide4';
import Slide5 from '../Screens/NavScreens/Onboarding/Front/slide5';
import Slide6 from '../Screens/NavScreens/Onboarding/Front/slide6';
import { platform } from 'process';

// Add Slide5 if you have a fifth slide

const OnboardingModal = ({ isVisible, onClose }) => {
    const renderNextButton = () => <Text style={{ color: '#FF8100', fontSize: 48 }}>›</Text>;
    const renderPrevButton = () => <Text style={{ color: '#FF8100', fontSize: 48 }}>‹</Text>;
    return (
        <SafeAreaView>
            <Modal
                animationType="slide"
                transparent={false}
                visible={isVisible}
                onRequestClose={onClose}>
                <Swiper loop={false} showsButtons={true} activeDotColor="#FF8100" dotColor="#D9D9D9" nextButton={renderNextButton()} prevButton={renderPrevButton()}>
                    <Slide1 />
                    {Platform.OS === 'ios' ? <Slide2 /> : <Slide6 />}
                    {Platform.OS === 'ios' ? <Slide3 /> : <Slide5 />}
                    <Slide4 onClose={onClose} />
                </Swiper>
            </Modal>
        </SafeAreaView>
    );
};

export default OnboardingModal;
