// Slide1.js
import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView } from 'react-native';

const Slide1 = () => {
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
            </View >
            <View style={{ flex: 2 }}>
                <Image source={require('../../../../../assets/climbing-illustration.png')} style={styles.image} />
            </View >
            <View style={{ flex: 1 }}>
                <Text style={styles.header}>Nagimo</Text>
                <Text style={styles.text}>Climbed something you <Text style={{ fontWeight: 'bold' }}>loved</Text> but can’t keep a record of it?</Text>
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
        color: 'black'
    },
    text: {
        fontSize: 20,
        textAlign: 'center',
        marginHorizontal: 45,
        color: 'black'
    },
});

export default Slide1;
