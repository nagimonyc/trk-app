// Slide1.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const Slide3 = () => {
    return (
        <View style={styles.slide}>
            <Image source={require('../../../../../assets/giphy.gif')} style={styles.image} />
            <Text style={styles.header}>Welcome to Nagimo</Text>
            <Text style={styles.text}>Join our climbing community and track your progress!</Text>
        </View>
    );
};

// Add styles below
const styles = StyleSheet.create({
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    image: {
        width: 300,
        height: 300,
        marginBottom: 30,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    text: {
        fontSize: 18,
        textAlign: 'center',
        marginHorizontal: 40,
    },
});

export default Slide3;
