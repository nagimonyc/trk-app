// Slide1.js
import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

const Slide1 = ({ onClose }) => {
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
            </View >
            <View style={{ flex: 2 }}>
                <Image source={require('../../../../../assets/giphy.gif')} style={styles.image} />
            </View >
            <View style={{ flex: 1 }}>
                <Text style={styles.header}>Enjoy our App!</Text>
                <Text style={styles.text}>This is an early version, expect some funky bugs sometimes. 😎</Text>
                {/* And some bugs... too. */}
                <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                    <TouchableOpacity style={{ backgroundColor: '#FF8100', padding: 10, borderRadius: 5, marginTop: 20 }} onPress={onClose}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Get Started</Text>
                    </TouchableOpacity>
                </View>
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
