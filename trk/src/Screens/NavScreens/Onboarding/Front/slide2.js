// Slide1.js
import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView } from 'react-native';

const Slide1 = () => {
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
            </View >
            <View style={{ flex: 2 }}>
                <Image source={require('../../../../../assets/iosOpen.gif')} style={styles.image} resizeMode='contain' />
            </View >
            <View style={{ flex: 1 }}>
                <Text style={styles.header}>Nagimo</Text>
                <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Open</Text> the Nagimo app and <Text style={{ fontWeight: 'bold' }}>press</Text> the button in the center of your screen.</Text>
            </View >
            <View style={{ flex: 1 }}>
            </View >
        </SafeAreaView>
    );
};

// Add styles below
const styles = StyleSheet.create({
    image: {
        width: 250,
        height: 250,
        marginBottom: 30,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
    },
    text: {
        fontSize: 20,
        textAlign: 'center',
        marginHorizontal: 45,
    },
});

export default Slide1;
